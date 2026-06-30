import { Request, Response } from 'express';
import pool from '../config/database';
import { ActivityLogService } from '../services/ActivityLogService';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

function getClientIp(req: Request): string | undefined {
  return (req.headers['x-forwarded-for'] as string) || req.ip || undefined;
}

function getPatientUploadDir(patientId: number) {
  return path.join(__dirname, '../../uploads/documents/patients', String(patientId));
}

// Config multer pentru "scan acte identitate" (CI/Pasaport etc.)
export const patientIdentityUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        const patientId = Number((req.params as any).id);
        const uploadDir = getPatientUploadDir(patientId);
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (e) {
        cb(e as Error, '');
      }
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tip fișier neacceptat. Acceptăm PDF/JPG/PNG/GIF.'));
  }
});

export const PatientController = {
  // --- Identity lookup (MOCK + derivare CNP) ---
  lookupIdentity: async (req: Request, res: Response) => {
    try {
      const { identityType, identityNumber } = req.query as any;
      if (!identityType || !identityNumber) {
        return res.status(400).json({ message: 'identityType și identityNumber sunt obligatorii' });
      }

      const it = String(identityType);
      const inum = String(identityNumber);

      // 1) caută în registru persoane (mock)
      const [rows] = await pool.execute(
        `
        SELECT
          identity_type, identity_number, first_name, last_name, date_of_birth, gender,
          address_json, document_series, document_number, source
        FROM person_registry
        WHERE identity_type = ? AND identity_number = ?
        LIMIT 1
        `,
        [it, inum]
      );
      const hit = (rows as any[])[0];
      if (hit) {
        return res.json({ found: true, source: hit.source || 'MOCK', person: hit });
      }

      // 2) fallback: derivare din CNP (date naștere + sex) chiar fără integrare externă
      if (it === 'CNP' && /^\d{13}$/.test(inum)) {
        const weights = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
        const digits = inum.split('').map(d => Number(d));
        const sum = weights.reduce((acc, w, idx) => acc + w * digits[idx], 0);
        const mod = sum % 11;
        const control = mod === 10 ? 1 : mod;
        const isValid = control === digits[12];

        const s = digits[0];
        const yy = Number(inum.slice(1, 3));
        const mm = Number(inum.slice(3, 5));
        const dd = Number(inum.slice(5, 7));

        const century =
          s === 1 || s === 2 ? 1900 :
          s === 3 || s === 4 ? 1800 :
          s === 5 || s === 6 ? 2000 :
          // 7/8/9: tratăm minim ca 1900 (în practică depinde de context; pentru MVP e ok)
          1900;

        const yyyy = century + yy;
        const dateOfBirth = `${yyyy.toString().padStart(4, '0')}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
        const gender = s % 2 === 1 ? 'M' : 'F';

        return res.json({
          found: false,
          source: 'CNP_DERIVED',
          derived: {
            isValid,
            dateOfBirth,
            gender,
          },
        });
      }

      return res.status(404).json({ message: 'Nu există date pentru acest identificator (mock)' });
    } catch (error) {
      console.error('Error identity lookup:', error);
      return res.status(500).json({ message: 'Eroare la căutarea identității' });
    }
  },

  // --- Patient Identity Service ---
  listPatients: async (req: Request, res: Response) => {
    try {
      const { search, page = 1, limit = 20 } = req.query as any;
      const where: string[] = [];
      const params: any[] = [];

      if (search) {
        where.push('(p.first_name LIKE ? OR p.last_name LIKE ? OR p.identity_number LIKE ?)');
        const term = `%${search}%`;
        params.push(term, term, term);
      }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
      const offset = (pageNum - 1) * limitNum;

      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM patients p ${whereSql}`,
        params
      );
      const total = (countRows as any[])[0]?.total ?? 0;

      // include "unde este" pacientul (ultimul episod activ)
      const [rows] = await pool.execute(
        `
        SELECT
          p.*,
          e.status as current_episode_status,
          e.type as current_episode_type,
          e.department_id as current_department_id,
          d.name as current_department_name
        FROM patients p
        LEFT JOIN patient_episodes e
          ON e.id = (
            SELECT e2.id
            FROM patient_episodes e2
            WHERE e2.patient_id = p.id
              AND e2.status IN ('PROGRAMAT','INTERNAT')
            ORDER BY e2.created_at DESC
            LIMIT 1
          )
        LEFT JOIN departments d ON d.id = e.department_id
        ${whereSql}
        ORDER BY p.created_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
        `,
        params
      );

      return res.json({ total, page: pageNum, limit: limitNum, patients: rows });
    } catch (error) {
      console.error('Error listing patients:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea pacienților' });
    }
  },

  createPatient: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const {
        identityType,
        identityNumber,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        contactData,
      } = req.body as any;

      if (!identityType || !identityNumber || !firstName || !lastName) {
        return res.status(400).json({ message: 'identityType, identityNumber, firstName, lastName sunt obligatorii' });
      }

      const [result] = await pool.execute(
        `
        INSERT INTO patients
          (identity_type, identity_number, first_name, last_name, date_of_birth, gender, contact_data, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          String(identityType),
          String(identityNumber),
          String(firstName),
          String(lastName),
          dateOfBirth ? String(dateOfBirth) : null,
          gender ? String(gender) : 'UNKNOWN',
          contactData ? JSON.stringify(contactData) : null,
          req.user.id,
        ]
      );
      const id = (result as any).insertId as number;

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'PATIENT_CREATED',
        entity_type: 'PATIENT',
        entity_id: id,
        description: `A creat pacientul ${lastName} ${firstName} (${identityType} ${identityNumber})`,
        details: { patient_id: id, identityType, identityNumber },
        ip_address: getClientIp(req),
      });

      return res.status(201).json({ id });
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Există deja un pacient cu acest identificator' });
      }
      console.error('Error creating patient:', error);
      return res.status(500).json({ message: 'Eroare la crearea pacientului' });
    }
  },

  getPatient: async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: 'id invalid' });

      const [rows] = await pool.execute('SELECT * FROM patients WHERE id = ? LIMIT 1', [id]);
      const patient = (rows as any[])[0];
      if (!patient) return res.status(404).json({ message: 'Pacient negăsit' });

      const [insuranceRows] = await pool.execute(
        'SELECT * FROM patient_insurance_status WHERE patient_id = ? ORDER BY created_at DESC LIMIT 20',
        [id]
      );

      const [episodeRows] = await pool.execute(
        `
        SELECT e.*, d.name as department_name
        FROM patient_episodes e
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE e.patient_id = ?
        ORDER BY e.created_at DESC
        LIMIT 50
        `,
        [id]
      );

      const [docRows] = await pool.execute(
        `
        SELECT *
        FROM patient_identity_documents
        WHERE patient_id = ?
        ORDER BY created_at DESC
        LIMIT 50
        `,
        [id]
      );

      return res.json({ patient, insurance: insuranceRows, episodes: episodeRows, identityDocuments: docRows });
    } catch (error) {
      console.error('Error getting patient:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea pacientului' });
    }
  },

  listIdentityDocuments: async (req: Request, res: Response) => {
    try {
      const patientId = Number(req.params.id);
      if (!Number.isFinite(patientId)) return res.status(400).json({ message: 'id invalid' });
      const [rows] = await pool.execute(
        `
        SELECT *
        FROM patient_identity_documents
        WHERE patient_id = ?
        ORDER BY created_at DESC
        LIMIT 50
        `,
        [patientId]
      );
      return res.json({ documents: rows });
    } catch (error) {
      console.error('Error listing identity documents:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea documentelor de identitate' });
    }
  },

  uploadIdentityDocument: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const patientId = Number(req.params.id);
      if (!Number.isFinite(patientId)) return res.status(400).json({ message: 'id invalid' });

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) return res.status(400).json({ message: 'Fișierul este obligatoriu' });

      const { documentType = 'CI' } = req.body as any;

      const [result] = await pool.execute(
        `
        INSERT INTO patient_identity_documents
          (patient_id, document_type, file_name, file_path, file_size, mime_type, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [patientId, String(documentType), file.originalname, file.path, file.size, file.mimetype, req.user.id]
      );

      const id = (result as any).insertId as number;

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'PATIENT_IDENTITY_DOC_UPLOADED',
        entity_type: 'PATIENT',
        entity_id: patientId,
        description: `A încărcat document de identitate pentru pacient #${patientId} (${documentType})`,
        details: { patient_id: patientId, documentType, doc_id: id, file: { name: file.originalname, size: file.size, mime: file.mimetype } },
        ip_address: getClientIp(req),
      });

      return res.status(201).json({ id });
    } catch (error: any) {
      console.error('Error uploading identity document:', error);
      return res.status(500).json({ message: error?.message || 'Eroare la încărcarea documentului' });
    }
  },

  // --- Insurance management (status + history) ---
  addInsuranceStatus: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const patientId = Number(req.params.id);
      if (!Number.isFinite(patientId)) return res.status(400).json({ message: 'id invalid' });
      const { status, validFrom, validTo, source } = req.body as any;
      if (!status) return res.status(400).json({ message: 'status este obligatoriu' });

      await pool.execute(
        `
        INSERT INTO patient_insurance_status (patient_id, status, valid_from, valid_to, source, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [patientId, String(status), validFrom || null, validTo || null, source || null, req.user.id]
      );

      // actualizează status curent pe pacient
      await pool.execute(
        'UPDATE patients SET insurance_status_current = ? WHERE id = ?',
        [String(status), patientId]
      );

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'PATIENT_INSURANCE_UPDATED',
        entity_type: 'PATIENT',
        entity_id: patientId,
        description: `A actualizat calitatea de asigurat pentru pacient #${patientId}: ${status}`,
        details: { patient_id: patientId, status, validFrom: validFrom || null, validTo: validTo || null, source: source || null },
        ip_address: getClientIp(req),
      });

      return res.json({ success: true });
    } catch (error) {
      console.error('Error adding insurance status:', error);
      return res.status(500).json({ message: 'Eroare la actualizarea calității de asigurat' });
    }
  },

  // --- Patient Lists & Census Service ---
  listEpisodes: async (req: Request, res: Response) => {
    try {
      const { status, type, departmentId, page = 1, limit = 20 } = req.query as any;
      const where: string[] = [];
      const params: any[] = [];

      if (status) { where.push('e.status = ?'); params.push(String(status)); }
      if (type) { where.push('e.type = ?'); params.push(String(type)); }
      if (departmentId) { where.push('e.department_id = ?'); params.push(Number(departmentId)); }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
      const offset = (pageNum - 1) * limitNum;

      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM patient_episodes e ${whereSql}`,
        params
      );
      const total = (countRows as any[])[0]?.total ?? 0;

      const [rows] = await pool.execute(
        `
        SELECT
          e.*,
          p.first_name, p.last_name, p.identity_type, p.identity_number,
          d.name as department_name
        FROM patient_episodes e
        JOIN patients p ON p.id = e.patient_id
        LEFT JOIN departments d ON d.id = e.department_id
        ${whereSql}
        ORDER BY e.created_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
        `,
        params
      );

      return res.json({ total, page: pageNum, limit: limitNum, episodes: rows });
    } catch (error) {
      console.error('Error listing episodes:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea episoadelor' });
    }
  },

  createEpisode: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const patientId = Number(req.params.id);
      if (!Number.isFinite(patientId)) return res.status(400).json({ message: 'id invalid' });

      const { type, status, departmentId, startDate, endDate, ward, room, floor, attendingDoctorName, attendingDoctorPhone } = req.body as any;
      if (!type) return res.status(400).json({ message: 'type este obligatoriu' });

      const [result] = await pool.execute(
        `
        INSERT INTO patient_episodes (
          patient_id, type, status, department_id, start_date, end_date,
          ward, room, floor, attending_doctor_name, attending_doctor_phone,
          created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          patientId,
          String(type),
          String(status || 'PROGRAMAT'),
          departmentId ? Number(departmentId) : null,
          startDate || null,
          endDate || null,
          ward || null,
          room || null,
          floor || null,
          attendingDoctorName || null,
          attendingDoctorPhone || null,
          req.user.id,
        ]
      );
      const episodeId = (result as any).insertId as number;

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'PATIENT_EPISODE_CREATED',
        entity_type: 'PATIENT_EPISODE',
        entity_id: episodeId,
        description: `A creat episod medical pentru pacient #${patientId} (${type})`,
        details: { episode_id: episodeId, patient_id: patientId, type, status: status || 'PROGRAMAT', departmentId: departmentId || null },
        ip_address: getClientIp(req),
      });

      return res.status(201).json({ id: episodeId });
    } catch (error) {
      console.error('Error creating episode:', error);
      return res.status(500).json({ message: 'Eroare la crearea episodului' });
    }
  },

  censusSummary: async (req: Request, res: Response) => {
    try {
      // default: INTERNARE (centralizatoare internați/externați/programat internare)
      const { type = 'INTERNARE' } = req.query as any;

      const [statusRows] = await pool.execute(
        `
        SELECT e.status, COUNT(*) as count
        FROM patient_episodes e
        WHERE e.type = ?
        GROUP BY e.status
        `,
        [String(type)]
      );

      const [deptRows] = await pool.execute(
        `
        SELECT
          d.id as department_id,
          d.name as department_name,
          SUM(CASE WHEN e.status = 'INTERNAT' THEN 1 ELSE 0 END) as internat,
          SUM(CASE WHEN e.status = 'PROGRAMAT' THEN 1 ELSE 0 END) as programat,
          SUM(CASE WHEN e.status = 'EXTERNAT' THEN 1 ELSE 0 END) as externat
        FROM departments d
        LEFT JOIN patient_episodes e
          ON e.department_id = d.id
          AND e.type = ?
        GROUP BY d.id, d.name
        ORDER BY d.name
        `,
        [String(type)]
      );

      const totals: any = { PROGRAMAT: 0, INTERNAT: 0, EXTERNAT: 0, CANCELLED: 0 };
      for (const r of (statusRows as any[])) totals[r.status] = Number(r.count) || 0;

      return res.json({ type, totals, byDepartment: deptRows });
    } catch (error) {
      console.error('Error census summary:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea sumarului' });
    }
  },

  updateEpisode: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const episodeId = Number((req.params as any).episodeId);
      if (!Number.isFinite(episodeId)) return res.status(400).json({ message: 'episodeId invalid' });
      const { status, departmentId, startDate, endDate, ward, room, floor, attendingDoctorName, attendingDoctorPhone } = req.body as any;

      const updates: string[] = [];
      const params: any[] = [];
      if (status) { updates.push('status = ?'); params.push(String(status)); }
      if (departmentId !== undefined) { updates.push('department_id = ?'); params.push(departmentId ? Number(departmentId) : null); }
      if (startDate !== undefined) { updates.push('start_date = ?'); params.push(startDate || null); }
      if (endDate !== undefined) { updates.push('end_date = ?'); params.push(endDate || null); }
      if (ward !== undefined) { updates.push('ward = ?'); params.push(ward || null); }
      if (room !== undefined) { updates.push('room = ?'); params.push(room || null); }
      if (floor !== undefined) { updates.push('floor = ?'); params.push(floor || null); }
      if (attendingDoctorName !== undefined) { updates.push('attending_doctor_name = ?'); params.push(attendingDoctorName || null); }
      if (attendingDoctorPhone !== undefined) { updates.push('attending_doctor_phone = ?'); params.push(attendingDoctorPhone || null); }
      if (updates.length === 0) return res.status(400).json({ message: 'Nimic de actualizat' });

      params.push(episodeId);
      await pool.execute(
        `UPDATE patient_episodes SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'PATIENT_EPISODE_UPDATED',
        entity_type: 'PATIENT_EPISODE',
        entity_id: episodeId,
        description: `A actualizat episodul #${episodeId}`,
        details: { episode_id: episodeId, changes: { status, departmentId, startDate, endDate } },
        ip_address: getClientIp(req),
      });

      return res.json({ success: true });
    } catch (error) {
      console.error('Error updating episode:', error);
      return res.status(500).json({ message: 'Eroare la actualizarea episodului' });
    }
  },

  transferEpisode: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const episodeId = Number((req.params as any).episodeId);
      if (!Number.isFinite(episodeId)) return res.status(400).json({ message: 'episodeId invalid' });
      const { toDepartmentId, reason } = req.body as any;
      if (!toDepartmentId) return res.status(400).json({ message: 'toDepartmentId este obligatoriu' });

      const [rows] = await pool.execute('SELECT id, patient_id, department_id FROM patient_episodes WHERE id = ? LIMIT 1', [episodeId]);
      const ep = (rows as any[])[0];
      if (!ep) return res.status(404).json({ message: 'Episod negăsit' });

      const fromDept = ep.department_id ? Number(ep.department_id) : null;
      const toDept = Number(toDepartmentId);
      const when = new Date().toISOString().slice(0, 19).replace('T', ' ');

      await pool.execute(
        `
        INSERT INTO patient_episode_transfers
          (episode_id, from_department_id, to_department_id, reason, transferred_by, transferred_at)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [episodeId, fromDept, toDept, reason || null, req.user.id, when]
      );

      await pool.execute(
        'UPDATE patient_episodes SET department_id = ? WHERE id = ?',
        [toDept, episodeId]
      );

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'PATIENT_EPISODE_TRANSFER',
        entity_type: 'PATIENT_EPISODE',
        entity_id: episodeId,
        description: `Transfer pacient (episod #${episodeId})`,
        details: { episode_id: episodeId, patient_id: ep.patient_id, fromDepartmentId: fromDept, toDepartmentId: toDept, reason: reason || null },
        ip_address: getClientIp(req),
      });

      return res.json({ success: true });
    } catch (error) {
      console.error('Error transferring episode:', error);
      return res.status(500).json({ message: 'Eroare la transferul episodului' });
    }
  },

  listEpisodeTransfers: async (req: Request, res: Response) => {
    try {
      const episodeId = Number((req.params as any).episodeId);
      if (!Number.isFinite(episodeId)) return res.status(400).json({ message: 'episodeId invalid' });
      const [rows] = await pool.execute(
        `
        SELECT
          t.*,
          d1.name as from_department_name,
          d2.name as to_department_name,
          u.email as transferred_by_email
        FROM patient_episode_transfers t
        LEFT JOIN departments d1 ON d1.id = t.from_department_id
        LEFT JOIN departments d2 ON d2.id = t.to_department_id
        LEFT JOIN users u ON u.id = t.transferred_by
        WHERE t.episode_id = ?
        ORDER BY t.transferred_at DESC
        `,
        [episodeId]
      );
      return res.json({ transfers: rows });
    } catch (error) {
      console.error('Error listing episode transfers:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea transferurilor' });
    }
  },

  // --- Scheduling Service ---
  listResources: async (req: Request, res: Response) => {
    try {
      const { type, departmentId, isActive } = req.query as any;
      const where: string[] = [];
      const params: any[] = [];

      if (type) { where.push('r.type = ?'); params.push(String(type)); }
      if (departmentId) { where.push('r.department_id = ?'); params.push(Number(departmentId)); }
      if (isActive != null) { where.push('r.is_active = ?'); params.push(Number(isActive) ? 1 : 0); }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const [rows] = await pool.execute(
        `
        SELECT r.*, d.name as department_name
        FROM medical_resources r
        LEFT JOIN departments d ON d.id = r.department_id
        ${whereSql}
        ORDER BY r.type, r.name
        `,
        params
      );
      return res.json(rows);
    } catch (error) {
      console.error('Error listing resources:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea resurselor' });
    }
  },

  createResource: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const { type, name, departmentId, details } = req.body as any;
      if (!type || !name) return res.status(400).json({ message: 'type și name sunt obligatorii' });

      const [result] = await pool.execute(
        `
        INSERT INTO medical_resources (type, name, department_id, details, is_active)
        VALUES (?, ?, ?, ?, 1)
        `,
        [String(type), String(name), departmentId ? Number(departmentId) : null, details ? JSON.stringify(details) : null]
      );
      return res.status(201).json({ id: (result as any).insertId });
    } catch (error) {
      console.error('Error creating resource:', error);
      return res.status(500).json({ message: 'Eroare la crearea resursei' });
    }
  },

  listAppointments: async (req: Request, res: Response) => {
    try {
      const { patientId, resourceId, from, to, status, page = 1, limit = 20 } = req.query as any;
      const where: string[] = [];
      const params: any[] = [];

      if (patientId) { where.push('a.patient_id = ?'); params.push(Number(patientId)); }
      if (resourceId) { where.push('a.resource_id = ?'); params.push(Number(resourceId)); }
      if (status) { where.push('a.status = ?'); params.push(String(status)); }
      if (from) { where.push('a.start_time >= ?'); params.push(String(from)); }
      if (to) { where.push('a.end_time <= ?'); params.push(String(to)); }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
      const offset = (pageNum - 1) * limitNum;

      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM appointments a ${whereSql}`,
        params
      );
      const total = (countRows as any[])[0]?.total ?? 0;

      const [rows] = await pool.execute(
        `
        SELECT
          a.*,
          p.first_name, p.last_name, p.identity_type, p.identity_number,
          r.name as resource_name, r.type as resource_type,
          d.name as resource_department_name
        FROM appointments a
        JOIN patients p ON p.id = a.patient_id
        JOIN medical_resources r ON r.id = a.resource_id
        LEFT JOIN departments d ON d.id = r.department_id
        ${whereSql}
        ORDER BY a.start_time DESC
        LIMIT ${limitNum} OFFSET ${offset}
        `,
        params
      );

      return res.json({ total, page: pageNum, limit: limitNum, appointments: rows });
    } catch (error) {
      console.error('Error listing appointments:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea programărilor' });
    }
  },

  createAppointment: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const { patientId, episodeId, serviceType, resourceId, startTime, endTime } = req.body as any;
      if (!patientId || !serviceType || !resourceId || !startTime || !endTime) {
        return res.status(400).json({ message: 'patientId, serviceType, resourceId, startTime, endTime sunt obligatorii' });
      }

      // conflict simplu: resursa nu trebuie să aibă suprapuneri
      const [conflicts] = await pool.execute(
        `
        SELECT id FROM appointments
        WHERE resource_id = ?
          AND status IN ('SCHEDULED','CHECKED_IN')
          AND NOT (end_time <= ? OR start_time >= ?)
        LIMIT 1
        `,
        [Number(resourceId), String(startTime), String(endTime)]
      );
      if ((conflicts as any[]).length > 0) {
        return res.status(400).json({ message: 'Resursa este deja programată în intervalul selectat' });
      }

      const [result] = await pool.execute(
        `
        INSERT INTO appointments (patient_id, episode_id, service_type, resource_id, start_time, end_time, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, 'SCHEDULED', ?)
        `,
        [
          Number(patientId),
          episodeId ? Number(episodeId) : null,
          String(serviceType),
          Number(resourceId),
          String(startTime),
          String(endTime),
          req.user.id,
        ]
      );
      return res.status(201).json({ id: (result as any).insertId });
    } catch (error) {
      console.error('Error creating appointment:', error);
      return res.status(500).json({ message: 'Eroare la crearea programării' });
    }
  },

  // --- Monitoring Service ---
  listObservations: async (req: Request, res: Response) => {
    try {
      const { patientId, episodeId, type, page = 1, limit = 20 } = req.query as any;
      const where: string[] = [];
      const params: any[] = [];
      if (patientId) { where.push('o.patient_id = ?'); params.push(Number(patientId)); }
      if (episodeId) { where.push('o.episode_id = ?'); params.push(Number(episodeId)); }
      if (type) { where.push('o.type = ?'); params.push(String(type)); }
      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
      const offset = (pageNum - 1) * limitNum;

      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM patient_observations o ${whereSql}`,
        params
      );
      const total = (countRows as any[])[0]?.total ?? 0;

      const [rows] = await pool.execute(
        `
        SELECT
          o.*,
          p.first_name, p.last_name,
          u.email as recorded_by_email
        FROM patient_observations o
        JOIN patients p ON p.id = o.patient_id
        LEFT JOIN users u ON u.id = o.recorded_by
        ${whereSql}
        ORDER BY o.recorded_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
        `,
        params
      );
      return res.json({ total, page: pageNum, limit: limitNum, observations: rows });
    } catch (error) {
      console.error('Error listing observations:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea observațiilor' });
    }
  },

  addObservation: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const { patientId, episodeId, type, value, recordedAt } = req.body as any;
      if (!patientId || !type || !value) {
        return res.status(400).json({ message: 'patientId, type, value sunt obligatorii' });
      }

      const when = recordedAt ? String(recordedAt) : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const [result] = await pool.execute(
        `
        INSERT INTO patient_observations (patient_id, episode_id, type, value, recorded_at, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [Number(patientId), episodeId ? Number(episodeId) : null, String(type), String(value), when, req.user.id]
      );

      return res.status(201).json({ id: (result as any).insertId });
    } catch (error) {
      console.error('Error adding observation:', error);
      return res.status(500).json({ message: 'Eroare la salvarea observației' });
    }
  }
};


