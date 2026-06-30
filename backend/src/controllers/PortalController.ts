import { Request, Response } from 'express';
import pool from '../config/database';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

function getClientIp(req: Request): string | undefined {
  return (req.headers['x-forwarded-for'] as string) || req.ip || undefined;
}

function isStaff(roles: string[]) {
  const staffRoles = new Set([
    'SUPER_ADMIN',
    'DEPARTMENT_ADMIN',
    'MANAGER',
    'OPERATOR',
    'INSPECTOR',
  ]);
  return roles.some(r => staffRoles.has(r));
}

async function ensureAccessToPatient(userId: number, roles: string[], patientId: number) {
  if (isStaff(roles)) return { ok: true as const, relationship: 'STAFF' as const };

  const [rows] = await pool.execute(
    `
    SELECT relationship
    FROM patient_user_links
    WHERE user_id = ? AND patient_id = ? AND is_active = 1
    LIMIT 1
    `,
    [userId, patientId]
  );
  const rel = (rows as any[])[0]?.relationship as ('SELF' | 'CAREGIVER' | undefined);
  if (!rel) return { ok: false as const };
  return { ok: true as const, relationship: rel };
}

function getPatientMedicalUploadDir(patientId: number) {
  return path.join(__dirname, '../../uploads/documents/patients', String(patientId), 'medical');
}

export const patientMedicalUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        const patientId = Number((req.params as any).patientId);
        const uploadDir = getPatientMedicalUploadDir(patientId);
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
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
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

export const PortalController = {
  // --- Link management (MVP) ---
  selfLink: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const { identityType, identityNumber } = req.body as any;
      if (!identityType || !identityNumber) return res.status(400).json({ message: 'identityType și identityNumber sunt obligatorii' });

      const [rows] = await pool.execute(
        'SELECT id FROM patients WHERE identity_type = ? AND identity_number = ? LIMIT 1',
        [String(identityType), String(identityNumber)]
      );
      const patientId = (rows as any[])[0]?.id;
      if (!patientId) return res.status(404).json({ message: 'Pacient negăsit (nu există în sistem)' });

      await pool.execute(
        `
        INSERT INTO patient_user_links (user_id, patient_id, relationship, relationship_label, is_active, created_by)
        VALUES (?, ?, 'SELF', NULL, 1, ?)
        ON DUPLICATE KEY UPDATE is_active = 1, updated_at = CURRENT_TIMESTAMP
        `,
        [req.user.id, patientId, req.user.id]
      );
      return res.json({ success: true, patientId });
    } catch (error) {
      console.error('Error selfLink:', error);
      return res.status(500).json({ message: 'Eroare la asocierea contului cu pacientul' });
    }
  },

  caregiverLink: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const { patientIdentityType, patientIdentityNumber, relationshipLabel } = req.body as any;
      if (!patientIdentityType || !patientIdentityNumber) return res.status(400).json({ message: 'patientIdentityType și patientIdentityNumber sunt obligatorii' });

      const [rows] = await pool.execute(
        'SELECT id FROM patients WHERE identity_type = ? AND identity_number = ? LIMIT 1',
        [String(patientIdentityType), String(patientIdentityNumber)]
      );
      const patientId = (rows as any[])[0]?.id;
      if (!patientId) return res.status(404).json({ message: 'Pacient negăsit (nu există în sistem)' });

      await pool.execute(
        `
        INSERT INTO patient_user_links (user_id, patient_id, relationship, relationship_label, is_active, created_by)
        VALUES (?, ?, 'CAREGIVER', ?, 1, ?)
        ON DUPLICATE KEY UPDATE is_active = 1, relationship_label = VALUES(relationship_label), updated_at = CURRENT_TIMESTAMP
        `,
        [req.user.id, patientId, relationshipLabel || 'Aparținător', req.user.id]
      );
      return res.json({ success: true, patientId });
    } catch (error) {
      console.error('Error caregiverLink:', error);
      return res.status(500).json({ message: 'Eroare la asocierea aparținătorului' });
    }
  },

  // --- Patient selector ---
  myPatients: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });

      // Staff poate vedea “toți pacienții” doar pentru demo (limit)
      if (isStaff(req.user.roles)) {
        const [rows] = await pool.execute(
          `
          SELECT
            p.id, p.first_name, p.last_name, p.identity_type, p.identity_number,
            p.insurance_status_current,
            e.status as current_episode_status,
            d.name as department_name,
            e.ward, e.room, e.floor,
            e.attending_doctor_name, e.attending_doctor_phone
          FROM patients p
          LEFT JOIN patient_episodes e
            ON e.id = (
              SELECT e2.id
              FROM patient_episodes e2
              WHERE e2.patient_id = p.id AND e2.status IN ('PROGRAMAT','INTERNAT')
              ORDER BY e2.created_at DESC
              LIMIT 1
            )
          LEFT JOIN departments d ON d.id = e.department_id
          ORDER BY p.created_at DESC
          LIMIT 50
          `
        );
        return res.json({ patients: rows, mode: 'STAFF_DEMO' });
      }

      const [rows] = await pool.execute(
        `
        SELECT
          l.relationship, l.relationship_label,
          p.id, p.first_name, p.last_name, p.identity_type, p.identity_number,
          p.insurance_status_current,
          e.status as current_episode_status,
          d.name as department_name,
          e.ward, e.room, e.floor,
          e.attending_doctor_name, e.attending_doctor_phone
        FROM patient_user_links l
        JOIN patients p ON p.id = l.patient_id
        LEFT JOIN patient_episodes e
          ON e.id = (
            SELECT e2.id
            FROM patient_episodes e2
            WHERE e2.patient_id = p.id AND e2.status IN ('PROGRAMAT','INTERNAT')
            ORDER BY e2.created_at DESC
            LIMIT 1
          )
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE l.user_id = ? AND l.is_active = 1
        ORDER BY p.last_name, p.first_name
        `,
        [req.user.id]
      );

      return res.json({ patients: rows });
    } catch (error) {
      console.error('Error myPatients:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea pacienților' });
    }
  },

  // --- Dossier ---
  dossier: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const patientId = Number(req.params.patientId);
      if (!Number.isFinite(patientId)) return res.status(400).json({ message: 'patientId invalid' });

      const access = await ensureAccessToPatient(req.user.id, req.user.roles, patientId);
      if (!access.ok) return res.status(403).json({ message: 'Acces interzis la acest pacient' });

      const [patientRows] = await pool.execute('SELECT * FROM patients WHERE id = ? LIMIT 1', [patientId]);
      const patient = (patientRows as any[])[0];
      if (!patient) return res.status(404).json({ message: 'Pacient negăsit' });

      const [insuranceRows] = await pool.execute(
        'SELECT * FROM patient_insurance_status WHERE patient_id = ? ORDER BY created_at DESC LIMIT 20',
        [patientId]
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
        [patientId]
      );

      const [obsRows] = await pool.execute(
        `
        SELECT o.*, u.email as recorded_by_email
        FROM patient_observations o
        LEFT JOIN users u ON u.id = o.recorded_by
        WHERE o.patient_id = ?
        ORDER BY o.recorded_at DESC
        LIMIT 100
        `,
        [patientId]
      );

      const [apptRows] = await pool.execute(
        `
        SELECT
          a.*,
          r.name as resource_name, r.type as resource_type,
          d.name as resource_department_name
        FROM appointments a
        JOIN medical_resources r ON r.id = a.resource_id
        LEFT JOIN departments d ON d.id = r.department_id
        WHERE a.patient_id = ?
        ORDER BY a.start_time DESC
        LIMIT 50
        `,
        [patientId]
      );

      const [docRows] = await pool.execute(
        `
        SELECT *
        FROM patient_documents
        WHERE patient_id = ?
        ORDER BY created_at DESC
        LIMIT 50
        `,
        [patientId]
      );

      const [idDocRows] = await pool.execute(
        `
        SELECT *
        FROM patient_identity_documents
        WHERE patient_id = ?
        ORDER BY created_at DESC
        LIMIT 20
        `,
        [patientId]
      );

      return res.json({
        patient,
        access: { relationship: access.relationship },
        insurance: insuranceRows,
        episodes: episodeRows,
        observations: obsRows,
        appointments: apptRows,
        documents: docRows,
        identityDocuments: idDocRows,
      });
    } catch (error) {
      console.error('Error dossier:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea dosarului pacientului' });
    }
  },

  // --- Scheduling (self-service) ---
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
      return res.json({ resources: rows });
    } catch (error) {
      console.error('Error listResources:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea resurselor' });
    }
  },

  listPatientAppointments: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const patientId = Number(req.params.patientId);
      if (!Number.isFinite(patientId)) return res.status(400).json({ message: 'patientId invalid' });
      const access = await ensureAccessToPatient(req.user.id, req.user.roles, patientId);
      if (!access.ok) return res.status(403).json({ message: 'Acces interzis la acest pacient' });

      const [rows] = await pool.execute(
        `
        SELECT
          a.*,
          r.name as resource_name, r.type as resource_type,
          d.name as resource_department_name
        FROM appointments a
        JOIN medical_resources r ON r.id = a.resource_id
        LEFT JOIN departments d ON d.id = r.department_id
        WHERE a.patient_id = ?
        ORDER BY a.start_time DESC
        LIMIT 50
        `,
        [patientId]
      );
      return res.json({ appointments: rows });
    } catch (error) {
      console.error('Error listPatientAppointments:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea programărilor' });
    }
  },

  createPatientAppointment: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const patientId = Number(req.params.patientId);
      if (!Number.isFinite(patientId)) return res.status(400).json({ message: 'patientId invalid' });

      const access = await ensureAccessToPatient(req.user.id, req.user.roles, patientId);
      if (!access.ok) return res.status(403).json({ message: 'Acces interzis la acest pacient' });

      const { serviceType, resourceId, startTime, endTime } = req.body as any;
      if (!serviceType || !resourceId || !startTime || !endTime) {
        return res.status(400).json({ message: 'serviceType, resourceId, startTime, endTime sunt obligatorii' });
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
        VALUES (?, NULL, ?, ?, ?, ?, 'SCHEDULED', ?)
        `,
        [patientId, String(serviceType), Number(resourceId), String(startTime), String(endTime), req.user.id]
      );

      return res.status(201).json({ id: (result as any).insertId });
    } catch (error: any) {
      console.error('Error createPatientAppointment:', error);
      return res.status(500).json({ message: error?.message || 'Eroare la crearea programării' });
    }
  },

  // --- Documents ---
  listPatientDocuments: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const patientId = Number(req.params.patientId);
      if (!Number.isFinite(patientId)) return res.status(400).json({ message: 'patientId invalid' });
      const access = await ensureAccessToPatient(req.user.id, req.user.roles, patientId);
      if (!access.ok) return res.status(403).json({ message: 'Acces interzis la acest pacient' });

      const [rows] = await pool.execute(
        `
        SELECT *
        FROM patient_documents
        WHERE patient_id = ?
        ORDER BY created_at DESC
        LIMIT 50
        `,
        [patientId]
      );
      return res.json({ documents: rows });
    } catch (error) {
      console.error('Error listPatientDocuments:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea documentelor' });
    }
  },

  uploadPatientDocument: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      if (!isStaff(req.user.roles)) return res.status(403).json({ message: 'Acces interzis' });

      const patientId = Number(req.params.patientId);
      if (!Number.isFinite(patientId)) return res.status(400).json({ message: 'patientId invalid' });
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) return res.status(400).json({ message: 'Fișierul este obligatoriu' });

      const { category = 'ALTELE', title } = req.body as any;
      const docTitle = title || file.originalname;

      const [result] = await pool.execute(
        `
        INSERT INTO patient_documents
          (patient_id, category, title, file_name, file_path, file_size, mime_type, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [patientId, String(category), String(docTitle), file.originalname, file.path, file.size, file.mimetype, req.user.id]
      );

      return res.status(201).json({ id: (result as any).insertId, ip: getClientIp(req) });
    } catch (error: any) {
      console.error('Error uploadPatientDocument:', error);
      return res.status(500).json({ message: error?.message || 'Eroare la încărcarea documentului' });
    }
  },

  // --- Messaging ---
  listPatientThreads: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const patientId = Number(req.params.patientId);
      if (!Number.isFinite(patientId)) return res.status(400).json({ message: 'patientId invalid' });

      const access = await ensureAccessToPatient(req.user.id, req.user.roles, patientId);
      if (!access.ok) return res.status(403).json({ message: 'Acces interzis la acest pacient' });

      const [rows] = await pool.execute(
        `
        SELECT
          t.*,
          (SELECT pm.message FROM patient_messages pm WHERE pm.thread_id = t.id ORDER BY pm.created_at DESC LIMIT 1) as last_message,
          (SELECT pm.created_at FROM patient_messages pm WHERE pm.thread_id = t.id ORDER BY pm.created_at DESC LIMIT 1) as last_message_at
        FROM patient_message_threads t
        WHERE t.patient_id = ?
        ORDER BY t.updated_at DESC
        LIMIT 50
        `,
        [patientId]
      );
      return res.json({ threads: rows });
    } catch (error) {
      console.error('Error listPatientThreads:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea mesajelor' });
    }
  },

  createThreadAndMessage: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const patientId = Number(req.params.patientId);
      if (!Number.isFinite(patientId)) return res.status(400).json({ message: 'patientId invalid' });

      const access = await ensureAccessToPatient(req.user.id, req.user.roles, patientId);
      if (!access.ok) return res.status(403).json({ message: 'Acces interzis la acest pacient' });

      const { subject, message } = req.body as any;
      if (!subject || !message) return res.status(400).json({ message: 'subject și message sunt obligatorii' });

      const senderType =
        isStaff(req.user.roles) ? 'STAFF' :
        access.relationship === 'CAREGIVER' ? 'CAREGIVER' :
        'PATIENT';

      const [threadResult] = await pool.execute(
        `
        INSERT INTO patient_message_threads (patient_id, subject, status, created_by)
        VALUES (?, ?, 'OPEN', ?)
        `,
        [patientId, String(subject), req.user.id]
      );
      const threadId = (threadResult as any).insertId as number;

      const [msgResult] = await pool.execute(
        `
        INSERT INTO patient_messages (thread_id, sender_user_id, sender_type, message)
        VALUES (?, ?, ?, ?)
        `,
        [threadId, req.user.id, senderType, String(message)]
      );

      return res.status(201).json({ threadId, messageId: (msgResult as any).insertId });
    } catch (error) {
      console.error('Error createThreadAndMessage:', error);
      return res.status(500).json({ message: 'Eroare la trimiterea mesajului' });
    }
  },

  getThread: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const threadId = Number(req.params.threadId);
      if (!Number.isFinite(threadId)) return res.status(400).json({ message: 'threadId invalid' });

      const [threads] = await pool.execute('SELECT * FROM patient_message_threads WHERE id = ? LIMIT 1', [threadId]);
      const thread = (threads as any[])[0];
      if (!thread) return res.status(404).json({ message: 'Conversație negăsită' });

      const access = await ensureAccessToPatient(req.user.id, req.user.roles, Number(thread.patient_id));
      if (!access.ok) return res.status(403).json({ message: 'Acces interzis' });

      const [rows] = await pool.execute(
        `
        SELECT
          m.*,
          u.email as sender_email,
          u.first_name as sender_first_name,
          u.last_name as sender_last_name
        FROM patient_messages m
        LEFT JOIN users u ON u.id = m.sender_user_id
        WHERE m.thread_id = ?
        ORDER BY m.created_at ASC
        `,
        [threadId]
      );

      return res.json({ thread, messages: rows, access: { relationship: access.relationship } });
    } catch (error) {
      console.error('Error getThread:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea conversației' });
    }
  },

  postToThread: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const threadId = Number(req.params.threadId);
      if (!Number.isFinite(threadId)) return res.status(400).json({ message: 'threadId invalid' });
      const { message } = req.body as any;
      if (!message) return res.status(400).json({ message: 'message este obligatoriu' });

      const [threads] = await pool.execute('SELECT * FROM patient_message_threads WHERE id = ? LIMIT 1', [threadId]);
      const thread = (threads as any[])[0];
      if (!thread) return res.status(404).json({ message: 'Conversație negăsită' });

      const access = await ensureAccessToPatient(req.user.id, req.user.roles, Number(thread.patient_id));
      if (!access.ok) return res.status(403).json({ message: 'Acces interzis' });

      const senderType =
        isStaff(req.user.roles) ? 'STAFF' :
        access.relationship === 'CAREGIVER' ? 'CAREGIVER' :
        'PATIENT';

      const [result] = await pool.execute(
        `
        INSERT INTO patient_messages (thread_id, sender_user_id, sender_type, message)
        VALUES (?, ?, ?, ?)
        `,
        [threadId, req.user.id, senderType, String(message)]
      );

      await pool.execute('UPDATE patient_message_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [threadId]);

      return res.status(201).json({ id: (result as any).insertId });
    } catch (error) {
      console.error('Error postToThread:', error);
      return res.status(500).json({ message: 'Eroare la trimiterea mesajului' });
    }
  },

  // Inbox minim pentru personal (demonstrație bidirecțională)
  staffInbox: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      if (!isStaff(req.user.roles)) return res.status(403).json({ message: 'Acces interzis' });

      const [rows] = await pool.execute(
        `
        SELECT
          t.*,
          p.first_name, p.last_name, p.identity_type, p.identity_number,
          (SELECT pm.message FROM patient_messages pm WHERE pm.thread_id = t.id ORDER BY pm.created_at DESC LIMIT 1) as last_message,
          (SELECT pm.created_at FROM patient_messages pm WHERE pm.thread_id = t.id ORDER BY pm.created_at DESC LIMIT 1) as last_message_at
        FROM patient_message_threads t
        JOIN patients p ON p.id = t.patient_id
        WHERE t.status = 'OPEN'
        ORDER BY t.updated_at DESC
        LIMIT 50
        `
      );
      return res.json({ threads: rows });
    } catch (error) {
      console.error('Error staffInbox:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea inbox-ului' });
    }
  }
};


