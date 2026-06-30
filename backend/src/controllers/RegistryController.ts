import { Request, Response } from 'express';
import pool from '../config/database';
import { ActivityLogService } from '../services/ActivityLogService';

type RegisterType = 'REGISTRU_UNIC' | 'REGISTRU_ACTE';
type Direction = 'IN' | 'OUT' | 'INTERNAL';
type Channel = 'PHYSICAL' | 'ONLINE' | 'INTERNAL';
type WorkStatus = 'RECEIVED' | 'ASSIGNED' | 'IN_PROGRESS' | 'FINALIZED' | 'ARCHIVED' | 'CANCELLED';

function getClientIp(req: Request): string | undefined {
  return (req.headers['x-forwarded-for'] as string) || req.ip || undefined;
}

async function allocateNumber(conn: any, registerId: number, year: number): Promise<number> {
  // Lock row (or create)
  const [rows] = await conn.execute(
    'SELECT next_number FROM registry_counters WHERE register_id = ? AND year = ? FOR UPDATE',
    [registerId, year]
  );

  if ((rows as any[]).length === 0) {
    await conn.execute(
      'INSERT INTO registry_counters (register_id, year, next_number) VALUES (?, ?, ?)',
      [registerId, year, 2]
    );
    return 1;
  }

  const current = Number((rows as any[])[0].next_number);
  await conn.execute(
    'UPDATE registry_counters SET next_number = ? WHERE register_id = ? AND year = ?',
    [current + 1, registerId, year]
  );
  return current;
}

export const RegistryController = {
  // --- Registers ---
  listRegisters: async (req: Request, res: Response) => {
    try {
      const { year, type, status } = req.query as any;
      const where: string[] = [];
      const params: any[] = [];

      if (year) { where.push('r.year = ?'); params.push(Number(year)); }
      if (type) { where.push('r.type = ?'); params.push(type); }
      if (status) { where.push('r.status = ?'); params.push(status); }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

      const [rows] = await pool.execute(
        `
        SELECT 
          r.*,
          (
            SELECT JSON_ARRAYAGG(JSON_OBJECT('id', d.id, 'name', d.name))
            FROM registry_register_departments rrd
            JOIN departments d ON d.id = rrd.department_id
            WHERE rrd.register_id = r.id
          ) as departments
        FROM registry_registers r
        ${whereSql}
        ORDER BY r.year DESC, r.type, r.name
        `,
        params
      );

      const mapped = (rows as any[]).map(r => {
        // MySQL2 poate întoarce JSON-ul deja parsat (object/array) sau ca string.
        let deps: any[] = [];
        if (r.departments) {
          if (typeof r.departments === 'string') {
            try {
              deps = JSON.parse(r.departments);
            } catch {
              deps = [];
            }
          } else if (Array.isArray(r.departments)) {
            deps = r.departments;
          } else if (typeof r.departments === 'object') {
            // uneori vine ca obiect ce reprezintă array JSON
            deps = r.departments as any[];
          }
        }
        return {
          ...r,
          departments: deps,
        };
      });
      return res.json(mapped);
    } catch (error) {
      console.error('Error listing registers:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea registrelor' });
    }
  },

  createRegister: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const { name, type, year, code, departmentIds } = req.body as {
        name?: string;
        type?: RegisterType;
        year?: number;
        code?: string;
        departmentIds?: number[];
      };

      if (!name || !type || !year) {
        return res.status(400).json({ message: 'name, type, year sunt obligatorii' });
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [result] = await conn.execute(
          'INSERT INTO registry_registers (code, name, type, year, status, created_by) VALUES (?, ?, ?, ?, "ACTIVE", ?)',
          [code || null, name, type, Number(year), req.user.id]
        );
        const registerId = (result as any).insertId as number;

        if (Array.isArray(departmentIds) && departmentIds.length > 0) {
          const unique = Array.from(new Set(departmentIds.map(Number)));
          for (const depId of unique) {
            await conn.execute(
              'INSERT INTO registry_register_departments (register_id, department_id) VALUES (?, ?)',
              [registerId, depId]
            );
          }
        }

        await conn.commit();

        await ActivityLogService.createLog({
          user_id: req.user.id,
          action_type: 'REGISTRY_REGISTER_CREATED',
          entity_type: 'REGISTRY_REGISTER',
          entity_id: registerId,
          description: `A creat registrul "${name}" (${type}, ${year})`,
          details: { register_id: registerId, name, type, year, departmentIds: departmentIds || [] },
          ip_address: getClientIp(req),
        });

        return res.status(201).json({ id: registerId });
      } catch (e) {
        try { await conn.rollback(); } catch {}
        throw e;
      } finally {
        conn.release();
      }
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Codul registrului este deja folosit' });
      }
      console.error('Error creating register:', error);
      return res.status(500).json({ message: 'Eroare la crearea registrului' });
    }
  },

  // --- Entries ---
  listEntries: async (req: Request, res: Response) => {
    try {
      const { registerId, year, direction, channel, status, search, page = 1, limit = 20 } = req.query as any;
      const where: string[] = [];
      const params: any[] = [];

      if (registerId) { where.push('e.register_id = ?'); params.push(Number(registerId)); }
      if (year) { where.push('e.year = ?'); params.push(Number(year)); }
      if (direction) { where.push('e.direction = ?'); params.push(direction); }
      if (channel) { where.push('e.channel = ?'); params.push(channel); }
      if (status) { where.push('e.status = ?'); params.push(status); }
      if (search) {
        where.push('(e.title LIKE ? OR e.sender_name LIKE ? OR e.recipient_name LIKE ?)');
        const term = `%${search}%`;
        params.push(term, term, term);
      }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
      const offset = (pageNum - 1) * limitNum;

      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM registry_entries e ${whereSql}`,
        params
      );
      const total = (countRows as any[])[0].total;

      const [rows] = await pool.execute(
        `
        SELECT
          e.*,
          r.name as register_name,
          r.code as register_code,
          r.type as register_type,
          d.name as assigned_department_name,
          u.email as assigned_to_email
        FROM registry_entries e
        JOIN registry_registers r ON r.id = e.register_id
        LEFT JOIN departments d ON d.id = e.assigned_department_id
        LEFT JOIN users u ON u.id = e.assigned_to_user_id
        ${whereSql}
        ORDER BY e.year DESC, e.number DESC
        LIMIT ${limitNum} OFFSET ${offset}
        `,
        params
      );

      return res.json({ total, page: pageNum, limit: limitNum, entries: rows });
    } catch (error) {
      console.error('Error listing registry entries:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea înregistrărilor' });
    }
  },

  createEntry: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) {
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      const registerId = Number(req.params.registerId);
      if (!Number.isFinite(registerId)) {
        conn.release();
        return res.status(400).json({ message: 'registerId invalid' });
      }

      const {
        year,
        direction,
        channel,
        title,
        description,
        sender_name,
        sender_entity,
        recipient_name,
        recipient_entity,
        received_at,
        sent_at
      } = req.body as any;

      if (!year || !direction || !channel || !title) {
        conn.release();
        return res.status(400).json({ message: 'year, direction, channel, title sunt obligatorii' });
      }

      // Nu permitem înregistrări noi în registre arhivate (profesional: după închidere de an, doar consultare).
      const [regRows] = await conn.execute(
        'SELECT id, status, year FROM registry_registers WHERE id = ? LIMIT 1',
        [registerId]
      );
      const reg = (regRows as any[])[0];
      if (!reg) {
        conn.release();
        return res.status(404).json({ message: 'Registrul nu a fost găsit' });
      }
      if (String(reg.status) !== 'ACTIVE') {
        conn.release();
        return res.status(400).json({ message: 'Registrul este arhivat; nu se pot crea înregistrări noi' });
      }

      // Validare enum simplă
      const allowedDirection: Direction[] = ['IN', 'OUT', 'INTERNAL'];
      const allowedChannel: Channel[] = ['PHYSICAL', 'ONLINE', 'INTERNAL'];
      if (!allowedDirection.includes(direction) || !allowedChannel.includes(channel)) {
        conn.release();
        return res.status(400).json({ message: 'direction/channel invalid' });
      }

      await conn.beginTransaction();
      const number = await allocateNumber(conn, registerId, Number(year));

      const [result] = await conn.execute(
        `
        INSERT INTO registry_entries (
          register_id, year, number, direction, channel, title, description,
          sender_name, sender_entity, recipient_name, recipient_entity,
          received_at, sent_at, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'RECEIVED', ?)
        `,
        [
          registerId,
          Number(year),
          number,
          direction,
          channel,
          title,
          description || null,
          sender_name || null,
          sender_entity || null,
          recipient_name || null,
          recipient_entity || null,
          received_at || null,
          sent_at || null,
          req.user.id
        ]
      );
      const entryId = (result as any).insertId as number;

      await conn.commit();

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'REGISTRY_ENTRY_CREATED',
        entity_type: 'REGISTRY_ENTRY',
        entity_id: entryId,
        description: `A înregistrat actul #${number}/${year}: "${title}"`,
        details: { entry_id: entryId, register_id: registerId, year, number, direction, channel },
        ip_address: getClientIp(req),
      });

      conn.release();
      return res.status(201).json({ id: entryId, number, year });
    } catch (error) {
      try { await conn.rollback(); } catch {}
      conn.release();
      console.error('Error creating registry entry:', error);
      return res.status(500).json({ message: 'Eroare la crearea înregistrării' });
    }
  },

  assignEntry: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const entryId = Number(req.params.entryId);
      const { departmentId, assignedToUserId } = req.body as { departmentId?: number; assignedToUserId?: number };

      if (!Number.isFinite(entryId)) return res.status(400).json({ message: 'entryId invalid' });
      if (!departmentId && !assignedToUserId) return res.status(400).json({ message: 'departmentId sau assignedToUserId obligatoriu' });

      const [rows] = await pool.execute('SELECT id, title, status FROM registry_entries WHERE id = ?', [entryId]);
      const entry = (rows as any[])[0];
      if (!entry) return res.status(404).json({ message: 'Înregistrarea nu a fost găsită' });

      await pool.execute(
        'UPDATE registry_entries SET assigned_department_id = ?, assigned_to_user_id = ?, status = "ASSIGNED" WHERE id = ?',
        [departmentId || null, assignedToUserId || null, entryId]
      );

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'REGISTRY_ENTRY_ASSIGNED',
        entity_type: 'REGISTRY_ENTRY',
        entity_id: entryId,
        description: `A repartizat actul "${entry.title}"`,
        details: { entry_id: entryId, department_id: departmentId || null, assigned_to_user_id: assignedToUserId || null },
        ip_address: getClientIp(req),
      });

      return res.json({ success: true });
    } catch (error) {
      console.error('Error assigning registry entry:', error);
      return res.status(500).json({ message: 'Eroare la repartizarea înregistrării' });
    }
  },

  // --- Works (Registrul Unic = LUCRĂRI) ---
  listWorks: async (req: Request, res: Response) => {
    try {
      const {
        unicRegisterId,
        year,
        direction,
        channel,
        status,
        search,
        page = 1,
        limit = 20,
      } = req.query as any;

      const where: string[] = [];
      const params: any[] = [];

      if (unicRegisterId) { where.push('w.unic_register_id = ?'); params.push(Number(unicRegisterId)); }
      if (year) { where.push('w.year = ?'); params.push(Number(year)); }
      if (direction) { where.push('w.direction = ?'); params.push(direction); }
      if (channel) { where.push('w.channel = ?'); params.push(channel); }
      if (status) { where.push('w.status = ?'); params.push(status); }
      if (search) {
        where.push('(w.title LIKE ? OR w.description LIKE ? OR w.sender_name LIKE ? OR w.recipient_name LIKE ?)');
        const term = `%${search}%`;
        params.push(term, term, term, term);
      }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
      const offset = (pageNum - 1) * limitNum;

      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM registry_works w ${whereSql}`,
        params
      );
      const total = (countRows as any[])[0]?.total ?? 0;

      const [rows] = await pool.execute(
        `
        SELECT
          w.*,
          r.name as unic_register_name,
          d.name as assigned_department_name,
          u.email as assigned_to_email
        FROM registry_works w
        JOIN registry_registers r ON r.id = w.unic_register_id
        LEFT JOIN departments d ON d.id = w.assigned_department_id
        LEFT JOIN users u ON u.id = w.assigned_to_user_id
        ${whereSql}
        ORDER BY w.year DESC, w.number DESC
        LIMIT ${limitNum} OFFSET ${offset}
        `,
        params
      );

      return res.json({ total, page: pageNum, limit: limitNum, works: rows });
    } catch (error) {
      console.error('Error listing registry works:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea lucrărilor' });
    }
  },

  getWork: async (req: Request, res: Response) => {
    try {
      const workId = Number(req.params.workId);
      if (!Number.isFinite(workId)) return res.status(400).json({ message: 'workId invalid' });

      const [rows] = await pool.execute(
        `
        SELECT
          w.*,
          r.name as unic_register_name,
          d.name as assigned_department_name,
          u.email as assigned_to_email
        FROM registry_works w
        JOIN registry_registers r ON r.id = w.unic_register_id
        LEFT JOIN departments d ON d.id = w.assigned_department_id
        LEFT JOIN users u ON u.id = w.assigned_to_user_id
        WHERE w.id = ?
        LIMIT 1
        `,
        [workId]
      );
      const work = (rows as any[])[0];
      if (!work) return res.status(404).json({ message: 'Lucrarea nu a fost găsită' });

      const [entryRows] = await pool.execute(
        `
        SELECT
          e.*,
          rr.name as register_name,
          rr.code as register_code,
          d.name as assigned_department_name,
          u.email as assigned_to_email
        FROM registry_work_entries wre
        JOIN registry_entries e ON e.id = wre.entry_id
        JOIN registry_registers rr ON rr.id = e.register_id
        LEFT JOIN departments d ON d.id = e.assigned_department_id
        LEFT JOIN users u ON u.id = e.assigned_to_user_id
        WHERE wre.work_id = ?
        ORDER BY e.year DESC, e.number DESC
        `,
        [workId]
      );

      const [transferRows] = await pool.execute(
        `
        SELECT
          t.*,
          df.name as from_department_name,
          dt.name as to_department_name,
          uf.email as from_user_email,
          ut.email as to_user_email
        FROM registry_work_transfers t
        LEFT JOIN departments df ON df.id = t.from_department_id
        LEFT JOIN departments dt ON dt.id = t.to_department_id
        LEFT JOIN users uf ON uf.id = t.from_user_id
        LEFT JOIN users ut ON ut.id = t.to_user_id
        WHERE t.work_id = ?
        ORDER BY t.created_at ASC
        `,
        [workId]
      );

      return res.json({ work, entries: entryRows, transfers: transferRows });
    } catch (error) {
      console.error('Error getting registry work:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea lucrării' });
    }
  },

  createWork: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) {
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      const {
        unicRegisterId,
        year,
        direction,
        channel,
        title,
        description,
        sender_name,
        sender_entity,
        recipient_name,
        recipient_entity,
        received_at,
        sent_at,
        actsRegisterId,
      } = req.body as any;

      if (!unicRegisterId || !year || !direction || !channel || !title) {
        conn.release();
        return res.status(400).json({ message: 'unicRegisterId, year, direction, channel, title sunt obligatorii' });
      }

      const allowedDirection: Direction[] = ['IN', 'OUT', 'INTERNAL'];
      const allowedChannel: Channel[] = ['PHYSICAL', 'ONLINE', 'INTERNAL'];
      if (!allowedDirection.includes(direction) || !allowedChannel.includes(channel)) {
        conn.release();
        return res.status(400).json({ message: 'direction/channel invalid' });
      }

      // Validare registru unic
      const [unicRows] = await conn.execute(
        'SELECT id, status, year, type FROM registry_registers WHERE id = ? LIMIT 1',
        [Number(unicRegisterId)]
      );
      const unic = (unicRows as any[])[0];
      if (!unic) {
        conn.release();
        return res.status(404).json({ message: 'Registrul Unic nu a fost găsit' });
      }
      if (String(unic.type) !== 'REGISTRU_UNIC') {
        conn.release();
        return res.status(400).json({ message: 'unicRegisterId nu este un Registru Unic' });
      }
      if (String(unic.status) !== 'ACTIVE') {
        conn.release();
        return res.status(400).json({ message: 'Registrul Unic este arhivat; nu se pot crea lucrări noi' });
      }

      await conn.beginTransaction();
      const workNumber = await allocateNumber(conn, Number(unicRegisterId), Number(year));

      const [insWork] = await conn.execute(
        `
        INSERT INTO registry_works (
          unic_register_id, year, number, direction, channel, title, description,
          sender_name, sender_entity, recipient_name, recipient_entity,
          received_at, sent_at,
          status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'RECEIVED', ?)
        `,
        [
          Number(unicRegisterId),
          Number(year),
          workNumber,
          direction,
          channel,
          title,
          description || null,
          sender_name || null,
          sender_entity || null,
          recipient_name || null,
          recipient_entity || null,
          received_at || null,
          sent_at || null,
          req.user.id,
        ]
      );
      const workId = (insWork as any).insertId as number;

      // Opțional: creează ACT în registru de acte și îl leagă de lucrare (recepția completă).
      let createdEntryId: number | null = null;
      if (actsRegisterId) {
        const regId = Number(actsRegisterId);
        const [actRegRows] = await conn.execute(
          'SELECT id, status, type FROM registry_registers WHERE id = ? LIMIT 1',
          [regId]
        );
        const actReg = (actRegRows as any[])[0];
        if (!actReg) {
          throw new Error('Registrul de acte selectat nu există');
        }
        if (String(actReg.type) !== 'REGISTRU_ACTE') {
          throw new Error('actsRegisterId nu este un Registru de acte');
        }
        if (String(actReg.status) !== 'ACTIVE') {
          throw new Error('Registrul de acte este arhivat');
        }

        const entryNumber = await allocateNumber(conn, regId, Number(year));
        const [insEntry] = await conn.execute(
          `
          INSERT INTO registry_entries (
            register_id, year, number, direction, channel, title, description,
            sender_name, sender_entity, recipient_name, recipient_entity,
            received_at, sent_at, status, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'RECEIVED', ?)
          `,
          [
            regId,
            Number(year),
            entryNumber,
            direction,
            channel,
            title,
            description || null,
            sender_name || null,
            sender_entity || null,
            recipient_name || null,
            recipient_entity || null,
            received_at || null,
            sent_at || null,
            req.user.id,
          ]
        );
        createdEntryId = (insEntry as any).insertId as number;
        await conn.execute(
          'INSERT INTO registry_work_entries (work_id, entry_id) VALUES (?, ?)',
          [workId, createdEntryId]
        );
      }

      await conn.commit();

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'REGISTRY_WORK_RECEIVED',
        entity_type: 'REGISTRY_WORK',
        entity_id: workId,
        description: `A înregistrat lucrarea RU #${workNumber}/${year}: "${title}"`,
        details: { work_id: workId, unic_register_id: unicRegisterId, year, number: workNumber, direction, channel, createdEntryId },
        ip_address: getClientIp(req),
      });

      conn.release();
      return res.status(201).json({ id: workId, number: workNumber, year, createdEntryId });
    } catch (error: any) {
      try { await conn.rollback(); } catch {}
      conn.release();
      console.error('Error creating registry work:', error);
      return res.status(500).json({ message: error?.message || 'Eroare la crearea lucrării' });
    }
  },

  assignWork: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const workId = Number(req.params.workId);
      const { departmentId, assignedToUserId } = req.body as { departmentId?: number; assignedToUserId?: number };

      if (!Number.isFinite(workId)) return res.status(400).json({ message: 'workId invalid' });
      if (!departmentId && !assignedToUserId) return res.status(400).json({ message: 'departmentId sau assignedToUserId obligatoriu' });

      const [rows] = await pool.execute('SELECT id, title FROM registry_works WHERE id = ?', [workId]);
      const work = (rows as any[])[0];
      if (!work) return res.status(404).json({ message: 'Lucrarea nu a fost găsită' });

      await pool.execute(
        'UPDATE registry_works SET assigned_department_id = ?, assigned_to_user_id = ?, status = "ASSIGNED" WHERE id = ?',
        [departmentId || null, assignedToUserId || null, workId]
      );

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'REGISTRY_WORK_ASSIGNED',
        entity_type: 'REGISTRY_WORK',
        entity_id: workId,
        description: `A repartizat lucrarea "${work.title}"`,
        details: { work_id: workId, department_id: departmentId || null, assigned_to_user_id: assignedToUserId || null },
        ip_address: getClientIp(req),
      });

      return res.json({ success: true });
    } catch (error) {
      console.error('Error assigning registry work:', error);
      return res.status(500).json({ message: 'Eroare la repartizarea lucrării' });
    }
  },

  transferWork: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) {
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }
      const workId = Number(req.params.workId);
      if (!Number.isFinite(workId)) {
        conn.release();
        return res.status(400).json({ message: 'workId invalid' });
      }

      const { toDepartmentId, toUserId, note } = req.body as { toDepartmentId?: number; toUserId?: number; note?: string };
      if (!toDepartmentId && !toUserId) {
        conn.release();
        return res.status(400).json({ message: 'toDepartmentId sau toUserId obligatoriu' });
      }

      const [rows] = await conn.execute(
        'SELECT id, title, assigned_department_id, assigned_to_user_id FROM registry_works WHERE id = ? LIMIT 1',
        [workId]
      );
      const work = (rows as any[])[0];
      if (!work) {
        conn.release();
        return res.status(404).json({ message: 'Lucrarea nu a fost găsită' });
      }

      await conn.beginTransaction();
      await conn.execute(
        `
        INSERT INTO registry_work_transfers
          (work_id, from_department_id, to_department_id, from_user_id, to_user_id, note, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          workId,
          work.assigned_department_id || null,
          toDepartmentId || null,
          work.assigned_to_user_id || null,
          toUserId || null,
          note || null,
          req.user.id,
        ]
      );

      await conn.execute(
        'UPDATE registry_works SET assigned_department_id = ?, assigned_to_user_id = ?, status = "IN_PROGRESS" WHERE id = ?',
        [toDepartmentId || work.assigned_department_id || null, toUserId || null, workId]
      );

      await conn.commit();

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'REGISTRY_WORK_TRANSFERRED',
        entity_type: 'REGISTRY_WORK',
        entity_id: workId,
        description: `A transferat (circulație internă) lucrarea "${work.title}"`,
        details: { work_id: workId, to_department_id: toDepartmentId || null, to_user_id: toUserId || null, note: note || null },
        ip_address: getClientIp(req),
      });

      conn.release();
      return res.json({ success: true });
    } catch (error) {
      try { await conn.rollback(); } catch {}
      conn.release();
      console.error('Error transferring registry work:', error);
      return res.status(500).json({ message: 'Eroare la transferul lucrării' });
    }
  },

  listWorkEntries: async (req: Request, res: Response) => {
    try {
      const workId = Number(req.params.workId);
      if (!Number.isFinite(workId)) return res.status(400).json({ message: 'workId invalid' });

      const [rows] = await pool.execute(
        `
        SELECT
          e.*,
          rr.name as register_name,
          rr.code as register_code
        FROM registry_work_entries wre
        JOIN registry_entries e ON e.id = wre.entry_id
        JOIN registry_registers rr ON rr.id = e.register_id
        WHERE wre.work_id = ?
        ORDER BY e.year DESC, e.number DESC
        `,
        [workId]
      );
      return res.json({ entries: rows });
    } catch (error) {
      console.error('Error listing work entries:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea actelor lucrării' });
    }
  },

  createWorkEntry: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) {
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      const workId = Number(req.params.workId);
      if (!Number.isFinite(workId)) {
        conn.release();
        return res.status(400).json({ message: 'workId invalid' });
      }

      const {
        actsRegisterId,
        year,
        direction,
        channel,
        title,
        description,
        sender_name,
        sender_entity,
        recipient_name,
        recipient_entity,
        received_at,
        sent_at,
      } = req.body as any;

      if (!actsRegisterId || !year || !direction || !channel || !title) {
        conn.release();
        return res.status(400).json({ message: 'actsRegisterId, year, direction, channel, title sunt obligatorii' });
      }

      const allowedDirection: Direction[] = ['IN', 'OUT', 'INTERNAL'];
      const allowedChannel: Channel[] = ['PHYSICAL', 'ONLINE', 'INTERNAL'];
      if (!allowedDirection.includes(direction) || !allowedChannel.includes(channel)) {
        conn.release();
        return res.status(400).json({ message: 'direction/channel invalid' });
      }

      // Validare lucrare
      const [workRows] = await conn.execute(
        'SELECT id, title FROM registry_works WHERE id = ? LIMIT 1',
        [workId]
      );
      const work = (workRows as any[])[0];
      if (!work) {
        conn.release();
        return res.status(404).json({ message: 'Lucrarea nu a fost găsită' });
      }

      // Validare registru acte
      const regId = Number(actsRegisterId);
      const [actRegRows] = await conn.execute(
        'SELECT id, status, type FROM registry_registers WHERE id = ? LIMIT 1',
        [regId]
      );
      const actReg = (actRegRows as any[])[0];
      if (!actReg) {
        conn.release();
        return res.status(404).json({ message: 'Registrul de acte nu a fost găsit' });
      }
      if (String(actReg.type) !== 'REGISTRU_ACTE') {
        conn.release();
        return res.status(400).json({ message: 'actsRegisterId nu este un Registru de acte' });
      }
      if (String(actReg.status) !== 'ACTIVE') {
        conn.release();
        return res.status(400).json({ message: 'Registrul de acte este arhivat; nu se pot crea acte noi' });
      }

      await conn.beginTransaction();
      const entryNumber = await allocateNumber(conn, regId, Number(year));

      const [insEntry] = await conn.execute(
        `
        INSERT INTO registry_entries (
          register_id, year, number, direction, channel, title, description,
          sender_name, sender_entity, recipient_name, recipient_entity,
          received_at, sent_at, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'RECEIVED', ?)
        `,
        [
          regId,
          Number(year),
          entryNumber,
          direction,
          channel,
          title,
          description || null,
          sender_name || null,
          sender_entity || null,
          recipient_name || null,
          recipient_entity || null,
          received_at || null,
          sent_at || null,
          req.user.id,
        ]
      );
      const entryId = (insEntry as any).insertId as number;

      await conn.execute(
        'INSERT INTO registry_work_entries (work_id, entry_id) VALUES (?, ?)',
        [workId, entryId]
      );

      await conn.commit();

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'REGISTRY_WORK_ENTRY_CREATED',
        entity_type: 'REGISTRY_ENTRY',
        entity_id: entryId,
        description: `A adăugat un act la lucrarea "${work.title}"`,
        details: { work_id: workId, entry_id: entryId, register_id: regId, year, number: entryNumber, direction, channel },
        ip_address: getClientIp(req),
      });

      conn.release();
      return res.status(201).json({ id: entryId, number: entryNumber, year });
    } catch (error) {
      try { await conn.rollback(); } catch {}
      conn.release();
      console.error('Error creating work entry:', error);
      return res.status(500).json({ message: 'Eroare la crearea actului pentru lucrare' });
    }
  },

  // --- Year rollover (automatizare închidere de an) ---
  rolloverYear: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) {
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }
      const { fromYear, toYear } = req.body as { fromYear?: number; toYear?: number };
      if (!fromYear || !toYear) {
        conn.release();
        return res.status(400).json({ message: 'fromYear și toYear sunt obligatorii' });
      }

      await conn.beginTransaction();
      // arhivează registrele active din fromYear
      await conn.execute(
        'UPDATE registry_registers SET status = "ARCHIVED" WHERE year = ? AND status = "ACTIVE"',
        [Number(fromYear)]
      );

      // arhivează lucrările din Registrul Unic pentru fromYear (proces oficial: închidere de an)
      await conn.execute(
        'UPDATE registry_works SET status = "ARCHIVED" WHERE year = ? AND status <> "CANCELLED"',
        [Number(fromYear)]
      );

      // creează registrele pentru toYear (proces oficial: pregătire anul următor)
      // 1) Registrul Unic (dacă nu există)
      const [existingUnic] = await conn.execute(
        'SELECT id FROM registry_registers WHERE year = ? AND type = "REGISTRU_UNIC" LIMIT 1',
        [Number(toYear)]
      );
      let createdUnicId: number | null = null;
      let unicId: number | null = null;
      if ((existingUnic as any[]).length === 0) {
        const [ins] = await conn.execute(
          'INSERT INTO registry_registers (code, name, type, year, status, created_by) VALUES (?, ?, "REGISTRU_UNIC", ?, "ACTIVE", ?)',
          [`REG-UNIC-${toYear}`, `Registrul Unic ${toYear}`, Number(toYear), req.user.id]
        );
        createdUnicId = (ins as any).insertId;
        unicId = createdUnicId;
      } else {
        unicId = Number((existingUnic as any[])[0].id);
      }

      // 2) Registre de acte: câte unul per departament (dacă nu există)
      const [deptRows] = await conn.execute('SELECT id, name FROM departments ORDER BY name');
      const departments = deptRows as any[];
      const createdActRegisterIds: number[] = [];

      for (const d of departments) {
        const code = `REG-ACT-${toYear}-D${d.id}`;
        const name = `Registru acte - ${d.name} (${toYear})`;

        const [existingAct] = await conn.execute(
          'SELECT id FROM registry_registers WHERE year = ? AND type = "REGISTRU_ACTE" AND code = ? LIMIT 1',
          [Number(toYear), code]
        );
        let regId: number;
        if ((existingAct as any[]).length === 0) {
          const [insAct] = await conn.execute(
            'INSERT INTO registry_registers (code, name, type, year, status, created_by) VALUES (?, ?, "REGISTRU_ACTE", ?, "ACTIVE", ?)',
            [code, name, Number(toYear), req.user.id]
          );
          regId = (insAct as any).insertId;
          createdActRegisterIds.push(regId);
        } else {
          regId = Number((existingAct as any[])[0].id);
        }

        // asociere registru ↔ departament (idempotent)
        await conn.execute(
          'INSERT IGNORE INTO registry_register_departments (register_id, department_id) VALUES (?, ?)',
          [regId, Number(d.id)]
        );
      }

      await conn.commit();

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'REGISTRY_YEAR_ROLLOVER',
        entity_type: 'SYSTEM',
        entity_id: null,
        description: `A rulat închiderea de an: ${fromYear} -> ${toYear}`,
        details: { fromYear, toYear, createdUnicId, createdActRegisters: createdActRegisterIds.length, unicId },
        ip_address: getClientIp(req),
      });

      conn.release();
      return res.json({ success: true, createdUnicId, createdActRegisters: createdActRegisterIds.length, unicId });
    } catch (error) {
      try { await conn.rollback(); } catch {}
      conn.release();
      console.error('Error rolling over registry year:', error);
      return res.status(500).json({ message: 'Eroare la închiderea de an' });
    }
  }
  ,

  /**
   * Generează registre standard pentru un an:
   * - Registrul Unic (1 singur)
   * - Registre de acte (câte unul per departament, asociat departamentului)
   */
  bootstrapYear: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) {
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      const { year } = req.body as { year?: number };
      if (!year) {
        conn.release();
        return res.status(400).json({ message: 'year este obligatoriu' });
      }

      await conn.beginTransaction();

      // 1) Registrul Unic (dacă nu există) - idempotent (acceptă și ARCHIVED pentru consultare)
      const [unicRows] = await conn.execute(
        'SELECT id, status FROM registry_registers WHERE year = ? AND type = "REGISTRU_UNIC" ORDER BY (status = "ACTIVE") DESC, id ASC LIMIT 1',
        [Number(year)]
      );
      let unicId: number;
      if ((unicRows as any[]).length === 0) {
        const [insUnic] = await conn.execute(
          'INSERT INTO registry_registers (code, name, type, year, status, created_by) VALUES (?, ?, "REGISTRU_UNIC", ?, "ACTIVE", ?)',
          [`REG-UNIC-${year}`, `Registrul Unic ${year}`, Number(year), req.user.id]
        );
        unicId = (insUnic as any).insertId;
      } else {
        unicId = Number((unicRows as any[])[0].id);
      }

      // 2) Registre de acte: câte unul per departament
      const [deptRows] = await conn.execute('SELECT id, name FROM departments ORDER BY name');
      const departments = deptRows as any[];
      const createdActRegisters: Array<{ id: number; departmentId: number; name: string }> = [];

      for (const d of departments) {
        const code = `REG-ACT-${year}-D${d.id}`;
        const name = `Registru acte - ${d.name} (${year})`;

        const [existingAct] = await conn.execute(
          'SELECT id FROM registry_registers WHERE year = ? AND type = "REGISTRU_ACTE" AND code = ? LIMIT 1',
          [Number(year), code]
        );
        let regId: number;
        if ((existingAct as any[]).length === 0) {
          const [insAct] = await conn.execute(
            'INSERT INTO registry_registers (code, name, type, year, status, created_by) VALUES (?, ?, "REGISTRU_ACTE", ?, "ACTIVE", ?)',
            [code, name, Number(year), req.user.id]
          );
          regId = (insAct as any).insertId;
          createdActRegisters.push({ id: regId, departmentId: Number(d.id), name });
        } else {
          regId = Number((existingAct as any[])[0].id);
        }

        // asociere registru ↔ departament (idempotent)
        await conn.execute(
          'INSERT IGNORE INTO registry_register_departments (register_id, department_id) VALUES (?, ?)',
          [regId, Number(d.id)]
        );
      }

      await conn.commit();

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'REGISTRY_BOOTSTRAP_YEAR',
        entity_type: 'SYSTEM',
        entity_id: null,
        description: `A generat registrele standard pentru anul ${year}`,
        details: { year, unicId, createdActRegistersCount: createdActRegisters.length },
        ip_address: getClientIp(req),
      });

      conn.release();
      return res.json({ success: true, year, unicId, createdActRegisters });
    } catch (error) {
      try { await conn.rollback(); } catch {}
      conn.release();
      console.error('Error bootstrapping registry year:', error);
      return res.status(500).json({ message: 'Eroare la generarea registrelor pentru an' });
    }
  },

  /**
   * Generează date demo pentru dovadă (intrare/ieșire/intern + fizic/online + repartizare).
   * Creează automat registrele dacă lipsesc (bootstrapYear implicit).
   */
  seedDemo: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) {
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      const { year } = req.body as { year?: number };
      const y = Number(year || new Date().getFullYear());

      // asigurăm registrele (idempotent; dacă anul e ARCHIVED, seed-ul generează date "istorice" / ARCHIVED)
      await conn.beginTransaction();
      const [unicRows] = await conn.execute(
        'SELECT id, status FROM registry_registers WHERE year = ? AND type = "REGISTRU_UNIC" ORDER BY (status = "ACTIVE") DESC, id ASC LIMIT 1',
        [y]
      );
      let unicId: number;
      let unicStatus: 'ACTIVE' | 'ARCHIVED' = 'ACTIVE';
      if ((unicRows as any[]).length === 0) {
        const [insUnic] = await conn.execute(
          'INSERT INTO registry_registers (code, name, type, year, status, created_by) VALUES (?, ?, "REGISTRU_UNIC", ?, "ACTIVE", ?)',
          [`REG-UNIC-${y}`, `Registrul Unic ${y}`, y, req.user.id]
        );
        unicId = (insUnic as any).insertId;
      } else {
        unicId = Number((unicRows as any[])[0].id);
        unicStatus = String((unicRows as any[])[0].status) === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE';
      }

      const [deptRows] = await conn.execute('SELECT id, name FROM departments ORDER BY name');
      const departments = deptRows as any[];
      const firstDeptId = departments.length ? Number(departments[0].id) : null;

      // alegem câteva registre de acte existente pentru anul curent (ca să "se vadă" în tab-ul de acte)
      // dacă nu există și anul e ACTIVE, creăm minim unul; dacă anul e ARCHIVED, nu inventăm registre noi.
      const actsRegisterIds: number[] = [];
      if (firstDeptId) {
        // preferăm primele 3 departamente (dacă există registrele)
        const deptIds = departments.slice(0, 3).map((d: any) => Number(d.id));
        for (const depId of deptIds) {
          const code = `REG-ACT-${y}-D${depId}`;
        const [actRows] = await conn.execute(
          'SELECT id FROM registry_registers WHERE year = ? AND type = "REGISTRU_ACTE" AND code = ? LIMIT 1',
          [y, code]
        );
          if ((actRows as any[]).length > 0) {
            actsRegisterIds.push(Number((actRows as any[])[0].id));
          }
        }

        if (actsRegisterIds.length === 0 && unicStatus === 'ACTIVE') {
          const code = `REG-ACT-${y}-D${firstDeptId}`;
          const [insAct] = await conn.execute(
            'INSERT INTO registry_registers (code, name, type, year, status, created_by) VALUES (?, ?, "REGISTRU_ACTE", ?, "ACTIVE", ?)',
            [code, `Registru acte - ${departments[0].name} (${y})`, y, req.user.id]
          );
          const actsId = (insAct as any).insertId as number;
          actsRegisterIds.push(actsId);
          await conn.execute(
            'INSERT IGNORE INTO registry_register_departments (register_id, department_id) VALUES (?, ?)',
            [actsId, firstDeptId]
          );
        }
      }

      // Seed LUCRĂRI în Registrul Unic + acte asociate (în Registru de acte) pentru dovada fluxurilor.
      const demoWorks: Array<{ direction: Direction; channel: Channel; title: string; sender: string; recipient: string }> = [
        { direction: 'IN', channel: 'PHYSICAL', title: 'Cerere depusă la ghișeu – solicitare informații', sender: 'Cetățean', recipient: 'Registratură' },
        { direction: 'IN', channel: 'ONLINE', title: 'Cerere online – solicitare documente', sender: 'Cetățean (online)', recipient: 'Registratură' },
        { direction: 'OUT', channel: 'PHYSICAL', title: 'Expediere răspuns către entitate externă', sender: 'Instituție', recipient: 'Entitate externă' },
        { direction: 'INTERNAL', channel: 'INTERNAL', title: 'Circulație internă – notă internă către departament', sender: 'Management', recipient: 'Departament' },
      ];

      const createdWorkIds: number[] = [];
      const createdEntryIds: number[] = [];
      const workSeedStatus: WorkStatus = unicStatus === 'ARCHIVED' ? 'ARCHIVED' : 'RECEIVED';
      const entrySeedStatus = unicStatus === 'ARCHIVED' ? 'CLOSED' : 'RECEIVED';

      for (const w of demoWorks) {
        const wNum = await allocateNumber(conn, unicId, y);
        const [insWork] = await conn.execute(
          `INSERT INTO registry_works
            (unic_register_id, year, number, direction, channel, title, description, sender_name, recipient_name, status, created_by, received_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [unicId, y, wNum, w.direction, w.channel, w.title, 'Lucrare demo pentru prezentare', w.sender, w.recipient, workSeedStatus, req.user.id]
        );
        const workId = (insWork as any).insertId as number;
        createdWorkIds.push(workId);

        // creează ACT asociat într-unul din registrele de acte (dacă există)
        if (actsRegisterIds.length > 0) {
          const actsId = actsRegisterIds[createdWorkIds.length % actsRegisterIds.length];
          const eNum = await allocateNumber(conn, actsId, y);
          const [insEntry] = await conn.execute(
          `INSERT INTO registry_entries
            (register_id, year, number, direction, channel, title, description, sender_name, recipient_name, status, created_by, received_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [actsId, y, eNum, w.direction, w.channel, `${w.title} (act)`, 'Act demo asociat lucrării', w.sender, w.recipient, entrySeedStatus, req.user.id]
        );
          const entryId = (insEntry as any).insertId as number;
          createdEntryIds.push(entryId);
          await conn.execute('INSERT INTO registry_work_entries (work_id, entry_id) VALUES (?, ?)', [workId, entryId]);
        }
      }

      // Repartizare + circulație demo pe prima lucrare
      if (createdWorkIds.length > 0 && firstDeptId) {
        await conn.execute(
          'UPDATE registry_works SET assigned_department_id = ?, status = "ASSIGNED" WHERE id = ?',
          [firstDeptId, createdWorkIds[0]]
        );
        await conn.execute(
          `INSERT INTO registry_work_transfers
            (work_id, from_department_id, to_department_id, from_user_id, to_user_id, note, created_by)
           VALUES (?, NULL, ?, NULL, NULL, ?, ?)`,
          [createdWorkIds[0], firstDeptId, 'Transfer demo (circulație internă) către structură', req.user.id]
        );
      }

      await conn.commit();

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'REGISTRY_SEED_DEMO',
        entity_type: 'SYSTEM',
        entity_id: null,
        description: `A generat date demo pentru registratură (${y})`,
        details: { year: y, unicId, unicStatus, actsRegisterIds, createdWorks: createdWorkIds.length, createdEntries: createdEntryIds.length },
        ip_address: getClientIp(req),
      });

      conn.release();
      return res.json({ success: true, year: y, createdWorks: createdWorkIds.length, createdEntries: createdEntryIds.length });
    } catch (error) {
      try { await conn.rollback(); } catch {}
      conn.release();
      console.error('Error seeding registry demo:', error);
      return res.status(500).json({ message: 'Eroare la attachment date demo' });
    }
  }
};


