import { Request, Response } from 'express';
import pool from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import multer from 'multer';
import path from 'path';
import fs, { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Configurare multer pentru upload-uri formulare
const formUploadDir = path.join(__dirname, '../../uploads/forms');

const formUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        if (!existsSync(formUploadDir)) {
          mkdirSync(formUploadDir, { recursive: true });
        }
        cb(null, formUploadDir);
      } catch (e) {
        cb(e as Error, '');
      }
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tip fișier neacceptat'));
  }
});

export const formUploadMiddleware = formUpload.array('attachments', 10);

export const ElectronicFormsController = {
  // === CATEGORII ===
  listCategories: async (req: Request, res: Response) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM form_categories WHERE is_active = 1 ORDER BY type, name');
      res.json(rows);
    } catch (error) {
      console.error('Error listing categories:', error);
      res.status(500).json({ message: 'Eroare la listarea categoriilor' });
    }
  },

  // === TEMPLATE-URI ===
  listTemplates: async (req: Request, res: Response) => {
    try {
      const { categoryId, search, type } = req.query;
      let query = `
        SELECT 
          ft.*,
          fc.name as category_name,
          fc.type as category_type,
          COUNT(ff.id) as field_count
        FROM form_templates ft
        JOIN form_categories fc ON ft.category_id = fc.id
        LEFT JOIN form_fields ff ON ft.id = ff.template_id
        WHERE ft.is_active = 1
      `;
      const params: any[] = [];

      if (categoryId) {
        query += ' AND ft.category_id = ?';
        params.push(categoryId);
      }
      if (type) {
        query += ' AND fc.type = ?';
        params.push(type);
      }
      if (search) {
        query += ' AND (ft.name LIKE ? OR ft.description LIKE ? OR ft.code LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += ' GROUP BY ft.id ORDER BY ft.name';
      const [rows] = await pool.execute(query, params);
      res.json(rows);
    } catch (error) {
      console.error('Error listing templates:', error);
      res.status(500).json({ message: 'Eroare la listarea template-urilor' });
    }
  },

  getTemplate: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [templates] = await pool.execute(
        'SELECT ft.*, fc.name as category_name FROM form_templates ft JOIN form_categories fc ON ft.category_id = fc.id WHERE ft.id = ?',
        [id]
      );
      if ((templates as any[]).length === 0) {
        return res.status(404).json({ message: 'Template nu a fost găsit' });
      }

      const [fields] = await pool.execute(
        'SELECT * FROM form_fields WHERE template_id = ? ORDER BY display_order, id',
        [id]
      );

      res.json({
        ...(templates as any[])[0],
        fields: fields || []
      });
    } catch (error) {
      console.error('Error getting template:', error);
      res.status(500).json({ message: 'Eroare la obținerea template-ului' });
    }
  },

  createTemplate: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) {
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      const { categoryId, code, name, description, requiresSignature, signatureOrder, metadata, fields } = req.body;

      await conn.beginTransaction();

      const [result] = await conn.execute(
        `INSERT INTO form_templates (category_id, code, name, description, requires_signature, signature_order, metadata, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          categoryId,
          code,
          name,
          description || null,
          requiresSignature || false,
          signatureOrder ? JSON.stringify(signatureOrder) : null,
          metadata ? JSON.stringify(metadata) : null,
          req.user.id
        ]
      );
      const templateId = (result as ResultSetHeader).insertId;

      // Adăugăm câmpurile
      if (fields && Array.isArray(fields)) {
        for (const field of fields) {
          await conn.execute(
            `INSERT INTO form_fields (template_id, field_key, field_type, label, placeholder, description, is_required, validation_rules, options, default_value, display_order, section, visibility_rules)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              templateId,
              field.fieldKey,
              field.fieldType,
              field.label,
              field.placeholder || null,
              field.description || null,
              field.isRequired || false,
              field.validationRules ? JSON.stringify(field.validationRules) : null,
              field.options ? JSON.stringify(field.options) : null,
              field.defaultValue || null,
              field.displayOrder || 0,
              field.section || null,
              field.visibilityRules ? JSON.stringify(field.visibilityRules) : null
            ]
          );
        }
      }

      await conn.commit();
      conn.release();

      res.status(201).json({ id: templateId, message: 'Template creat cu succes' });
    } catch (error: any) {
      await conn.rollback();
      conn.release();
      console.error('Error creating template:', error);
      res.status(500).json({ message: 'Eroare la crearea template-ului', error: error.message });
    }
  },

  updateTemplate: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { name, description, requiresSignature, signatureOrder, metadata, fields } = req.body;

      await conn.beginTransaction();

      await conn.execute(
        `UPDATE form_templates 
         SET name = ?, description = ?, requires_signature = ?, signature_order = ?, metadata = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          name,
          description || null,
          requiresSignature || false,
          signatureOrder ? JSON.stringify(signatureOrder) : null,
          metadata ? JSON.stringify(metadata) : null,
          id
        ]
      );

      // Actualizăm câmpurile (ștergem vechile și adăugăm noile)
      await conn.execute('DELETE FROM form_fields WHERE template_id = ?', [id]);

      if (fields && Array.isArray(fields)) {
        for (const field of fields) {
          await conn.execute(
            `INSERT INTO form_fields (template_id, field_key, field_type, label, placeholder, description, is_required, validation_rules, options, default_value, display_order, section, visibility_rules)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              field.fieldKey,
              field.fieldType,
              field.label,
              field.placeholder || null,
              field.description || null,
              field.isRequired || false,
              field.validationRules ? JSON.stringify(field.validationRules) : null,
              field.options ? JSON.stringify(field.options) : null,
              field.defaultValue || null,
              field.displayOrder || 0,
              field.section || null,
              field.visibilityRules ? JSON.stringify(field.visibilityRules) : null
            ]
          );
        }
      }

      await conn.commit();
      conn.release();

      res.json({ message: 'Template actualizat cu succes' });
    } catch (error: any) {
      await conn.rollback();
      conn.release();
      console.error('Error updating template:', error);
      res.status(500).json({ message: 'Eroare la actualizarea template-ului', error: error.message });
    }
  },

  // === INSTANȚE (Formulare completate) ===
  listInstances: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Neautentificat' });
      }

      const { status, templateId, search, submittedBy } = req.query;
      let query = `
        SELECT 
          fi.*,
          ft.name as template_name,
          ft.code as template_code,
          u1.first_name as created_by_first_name,
          u1.last_name as created_by_last_name,
          u2.first_name as submitted_by_first_name,
          u2.last_name as submitted_by_last_name
        FROM form_instances fi
        JOIN form_templates ft ON fi.template_id = ft.id
        LEFT JOIN users u1 ON fi.created_by = u1.id
        LEFT JOIN users u2 ON fi.submitted_by = u2.id
        WHERE 1=1
      `;
      const params: any[] = [];

      // Filtrare după utilizator (văd doar cele create de mine sau trimise către mine)
      if (!req.user.roles?.includes('ADMIN')) {
        query += ' AND (fi.created_by = ? OR fi.submitted_by = ?)';
        params.push(req.user.id, req.user.id);
      }

      if (status) {
        query += ' AND fi.status = ?';
        params.push(status);
      }
      if (templateId) {
        query += ' AND fi.template_id = ?';
        params.push(templateId);
      }
      if (submittedBy) {
        query += ' AND fi.submitted_by = ?';
        params.push(submittedBy);
      }
      if (search) {
        query += ' AND (ft.name LIKE ? OR fi.instance_number LIKE ? OR JSON_EXTRACT(fi.form_data, "$.*") LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += ' ORDER BY fi.created_at DESC LIMIT 100';
      const [rows] = await pool.execute(query, params);
      res.json(rows);
    } catch (error) {
      console.error('Error listing instances:', error);
      res.status(500).json({ message: 'Eroare la listarea instanțelor' });
    }
  },

  getInstance: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [instances] = await pool.execute(
        `SELECT 
          fi.*,
          ft.name as template_name,
          ft.code as template_code,
          u1.first_name as created_by_first_name,
          u1.last_name as created_by_last_name,
          u2.first_name as submitted_by_first_name,
          u2.last_name as submitted_by_last_name
         FROM form_instances fi
         JOIN form_templates ft ON fi.template_id = ft.id
         LEFT JOIN users u1 ON fi.created_by = u1.id
         LEFT JOIN users u2 ON fi.submitted_by = u2.id
         WHERE fi.id = ?`,
        [id]
      );

      if ((instances as any[]).length === 0) {
        return res.status(404).json({ message: 'Instanță nu a fost găsită' });
      }

      const instance = (instances as any[])[0];

      // Obținem semnăturile
      const [signatures] = await pool.execute(
        'SELECT fs.*, u.first_name, u.last_name, u.email FROM form_signatures fs JOIN users u ON fs.signer_id = u.id WHERE fs.instance_id = ? ORDER BY fs.signature_order',
        [id]
      );

      // Obținem comentariile
      const [comments] = await pool.execute(
        'SELECT fc.*, u.first_name, u.last_name FROM form_comments fc JOIN users u ON fc.created_by = u.id WHERE fc.instance_id = ? ORDER BY fc.created_at DESC',
        [id]
      );

      res.json({
        ...instance,
        signatures: signatures || [],
        comments: comments || []
      });
    } catch (error) {
      console.error('Error getting instance:', error);
      res.status(500).json({ message: 'Eroare la obținerea instanței' });
    }
  },

  createInstance: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) {
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      const { templateId, formData, status = 'DRAFT' } = req.body;
      const files = (req.files as Express.Multer.File[]) || [];

      await conn.beginTransaction();

      // Generăm număr unic de instanță
      const year = new Date().getFullYear();
      const [countResult] = await conn.execute(
        'SELECT COUNT(*) as count FROM form_instances WHERE YEAR(created_at) = ?',
        [year]
      );
      const count = ((countResult as any[])[0]?.count || 0) + 1;
      const instanceNumber = `FORM-${year}-${String(count).padStart(6, '0')}`;

      // Procesăm atașamentele
      const attachments = files.map(file => ({
        name: file.originalname,
        filename: file.filename,
        path: `/uploads/forms/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype
      }));

      const [result] = await conn.execute(
        `INSERT INTO form_instances (template_id, instance_number, status, form_data, attachments, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          templateId,
          instanceNumber,
          status,
          JSON.stringify(formData),
          attachments.length > 0 ? JSON.stringify(attachments) : null,
          req.user.id
        ]
      );
      const instanceId = (result as ResultSetHeader).insertId;

      await conn.commit();
      conn.release();

      res.status(201).json({ id: instanceId, instanceNumber, message: 'Formular creat cu succes' });
    } catch (error: any) {
      await conn.rollback();
      conn.release();
      console.error('Error creating instance:', error);
      res.status(500).json({ message: 'Eroare la crearea formularului', error: error.message });
    }
  },

  updateInstance: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) {
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      const { id } = req.params;
      const { formData, status, attachments } = req.body;
      const files = (req.files as Express.Multer.File[]) || [];

      await conn.beginTransaction();

      // Procesăm noi atașamente
      let allAttachments = attachments || [];
      if (files.length > 0) {
        const newAttachments = files.map(file => ({
          name: file.originalname,
          filename: file.filename,
          path: `/uploads/forms/${file.filename}`,
          size: file.size,
          mimetype: file.mimetype
        }));
        allAttachments = [...allAttachments, ...newAttachments];
      }

      await conn.execute(
        `UPDATE form_instances 
         SET form_data = ?, attachments = ?, status = ?, updated_at = NOW()
         WHERE id = ? AND created_by = ?`,
        [
          JSON.stringify(formData),
          allAttachments.length > 0 ? JSON.stringify(allAttachments) : null,
          status,
          id,
          req.user.id
        ]
      );

      await conn.commit();
      conn.release();

      res.json({ message: 'Formular actualizat cu succes' });
    } catch (error: any) {
      await conn.rollback();
      conn.release();
      console.error('Error updating instance:', error);
      res.status(500).json({ message: 'Eroare la actualizarea formularului', error: error.message });
    }
  },

  submitInstance: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) {
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      const { id } = req.params;
      const { registryWorkId, registryEntryId } = req.body;

      await conn.beginTransaction();

      // Verificăm dacă formularul necesită semnătură
      const [instances] = await conn.execute(
        `SELECT fi.*, ft.requires_signature 
         FROM form_instances fi
         JOIN form_templates ft ON fi.template_id = ft.id
         WHERE fi.id = ?`,
        [id]
      );

      if ((instances as any[]).length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(404).json({ message: 'Formular nu a fost găsit' });
      }

      const instance = (instances as any[])[0];
      const newStatus = instance.requires_signature ? 'IN_REVIEW' : 'SUBMITTED';

      await conn.execute(
        `UPDATE form_instances 
         SET status = ?, submitted_by = ?, submitted_at = NOW(), registry_work_id = ?, registry_entry_id = ?, updated_at = NOW()
         WHERE id = ?`,
        [newStatus, req.user.id, registryWorkId || null, registryEntryId || null, id]
      );

      await conn.commit();
      conn.release();

      res.json({ message: 'Formular trimis cu succes', status: newStatus });
    } catch (error: any) {
      await conn.rollback();
      conn.release();
      console.error('Error submitting instance:', error);
      res.status(500).json({ message: 'Eroare la trimiterea formularului', error: error.message });
    }
  },

  signInstance: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) {
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      const { id } = req.params;
      const { signatureOrder, reason, signatureType = 'ELECTRONIC' } = req.body;

      await conn.beginTransaction();

      // Verificăm dacă utilizatorul poate semna
      const [instances] = await conn.execute(
        `SELECT fi.*, ft.signature_order as template_signature_order
         FROM form_instances fi
         JOIN form_templates ft ON fi.template_id = ft.id
         WHERE fi.id = ?`,
        [id]
      );

      if ((instances as any[]).length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(404).json({ message: 'Formular nu a fost găsit' });
      }

      // Verificăm dacă nu a fost deja semnat de acest utilizator
      const [existingSignatures] = await conn.execute(
        'SELECT id FROM form_signatures WHERE instance_id = ? AND signer_id = ?',
        [id, req.user.id]
      );

      if ((existingSignatures as any[]).length > 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ message: 'Formularul a fost deja semnat de dvs.' });
      }

      // Adăugăm semnătura
      await conn.execute(
        `INSERT INTO form_signatures (instance_id, signer_id, signer_role, signature_order, signature_type, signature_data, signed_at, reason, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
        [
          id,
          req.user.id,
          req.user.roles?.[0] || 'USER',
          signatureOrder || 1,
          signatureType,
          JSON.stringify({ method: 'MOCK_SIGNATURE', timestamp: new Date().toISOString() }),
          reason || 'Semnare formular',
          req.ip || req.socket.remoteAddress || null
        ]
      );

      // Verificăm dacă toate semnăturile necesare au fost aplicate
      const [allSignatures] = await conn.execute(
        'SELECT COUNT(*) as count FROM form_signatures WHERE instance_id = ?',
        [id]
      );
      const signatureCount = (allSignatures as any[])[0]?.count || 0;

      // Dacă toate semnăturile sunt aplicate, marcăm ca SIGNED
      // (pentru demo, considerăm că 1 semnătură este suficientă)
      if (signatureCount >= 1) {
        await conn.execute(
          'UPDATE form_instances SET status = "SIGNED", updated_at = NOW() WHERE id = ?',
          [id]
        );
      }

      await conn.commit();
      conn.release();

      res.json({ message: 'Formular semnat cu succes' });
    } catch (error: any) {
      await conn.rollback();
      conn.release();
      console.error('Error signing instance:', error);
      res.status(500).json({ message: 'Eroare la semnarea formularului', error: error.message });
    }
  },

  addComment: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Neautentificat' });
      }

      const { id } = req.params;
      const { commentText, commentType = 'COMMENT' } = req.body;

      await pool.execute(
        'INSERT INTO form_comments (instance_id, comment_text, comment_type, created_by) VALUES (?, ?, ?, ?)',
        [id, commentText, commentType, req.user.id]
      );

      res.json({ message: 'Comentariu adăugat cu succes' });
    } catch (error: any) {
      console.error('Error adding comment:', error);
      res.status(500).json({ message: 'Eroare la adăugarea comentariului', error: error.message });
    }
  }
};

