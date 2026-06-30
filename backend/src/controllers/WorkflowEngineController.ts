import { Request, Response } from 'express';
import pool from '../config/database';
import { ActivityLogService } from '../services/ActivityLogService';

function getClientIp(req: Request): string | undefined {
  return (req.headers['x-forwarded-for'] as string) || req.ip || undefined;
}

function safeJsonParse(input: any): any | null {
  if (input == null) return null;
  if (typeof input === 'object') return input;
  if (typeof input === 'string') {
    try { return JSON.parse(input); } catch { return null; }
  }
  return null;
}

function extractStartStep(schema: any): string | null {
  if (!schema || typeof schema !== 'object') return null;
  if (typeof schema.startStepKey === 'string') return schema.startStepKey;
  if (typeof schema.startStep === 'string') return schema.startStep;
  if (Array.isArray(schema.steps) && schema.steps.length > 0) {
    const first = schema.steps[0];
    if (first && typeof first.key === 'string') return first.key;
    if (first && typeof first.code === 'string') return first.code;
  }
  return null;
}

function findStep(schema: any, stepKey: string): any | null {
  if (!schema || typeof schema !== 'object') return null;
  const steps = Array.isArray(schema.steps) ? schema.steps : [];
  return steps.find((s: any) => s && (s.key === stepKey || s.code === stepKey)) || null;
}

function getNextSteps(schema: any, stepKey: string): string[] {
  const step = findStep(schema, stepKey);
  if (!step) return [];
  // allow: next = ['A','B'] or transitions = [{ to:'A' },...]
  if (Array.isArray(step.next)) return step.next.filter((x: any) => typeof x === 'string');
  if (Array.isArray(step.transitions)) return step.transitions.map((t: any) => t?.to).filter((x: any) => typeof x === 'string');
  return [];
}

function getTransitionTarget(schema: any, stepKey: string, action: string | null): string | null {
  const step = findStep(schema, stepKey);
  if (!step) return null;
  if (Array.isArray(step.transitions) && action) {
    const t = step.transitions.find((x: any) => x && String(x.action || '').toUpperCase() === action.toUpperCase());
    if (t && typeof t.to === 'string') return t.to;
  }
  const next = getNextSteps(schema, stepKey);
  return next.length ? next[0] : null;
}

function isRollbackAllowed(schema: any): boolean {
  const rb = schema?.rollback;
  if (!rb) return true;
  if (typeof rb.allowed === 'boolean') return rb.allowed;
  return true;
}

function stepLabel(step: any): string | null {
  if (!step) return null;
  return (typeof step.label === 'string' && step.label) || (typeof step.name === 'string' && step.name) || null;
}

export const WorkflowEngineController = {
  // --- Definitions ---
  listDefinitions: async (req: Request, res: Response) => {
    try {
      const { type } = req.query as any;
      const where: string[] = [];
      const params: any[] = [];
      if (type) { where.push('d.flow_type = ?'); params.push(type); }
      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

      const [rows] = await pool.execute(
        `
        SELECT d.*,
               v.version as active_version,
               v.created_at as active_version_created_at
        FROM workflow_definitions d
        LEFT JOIN workflow_definition_versions v ON v.id = d.active_version_id
        ${whereSql}
        ORDER BY d.updated_at DESC
        `,
        params
      );
      return res.json(rows);
    } catch (error) {
      console.error('Error listing workflow definitions:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea definițiilor de flux' });
    }
  },

  createDefinition: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Neautentificat' });
      const { code, name, flow_type, process_key, description } = req.body as any;
      if (!code || !name || !flow_type) {
        return res.status(400).json({ message: 'code, name, flow_type sunt obligatorii' });
      }
      // compat: acceptă și valori vechi din UI (WORK/INFO)
      const normalizedFlowType =
        String(flow_type) === 'WORK' ? 'WORKFLOW' :
        String(flow_type) === 'INFO' ? 'INFORMATION' :
        String(flow_type);
      const [result] = await pool.execute(
        `INSERT INTO workflow_definitions (code, name, flow_type, process_key, description, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [String(code), String(name), normalizedFlowType, process_key || null, description || null, req.user.id]
      );
      const id = (result as any).insertId as number;

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'WORKFLOW_DEFINITION_CREATED',
        entity_type: 'WORKFLOW_DEFINITION',
        entity_id: id,
        description: `A creat definiția de flux "${name}" (${flow_type})`,
        details: { id, code, name, flow_type, process_key: process_key || null },
        ip_address: getClientIp(req),
      });

      return res.status(201).json({ id });
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Code deja existent' });
      }
      console.error('Error creating workflow definition:', error);
      return res.status(500).json({ message: 'Eroare la crearea definiției de flux' });
    }
  },

  getDefinition: async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: 'id invalid' });
      const [rows] = await pool.execute('SELECT * FROM workflow_definitions WHERE id = ? LIMIT 1', [id]);
      const def = (rows as any[])[0];
      if (!def) return res.status(404).json({ message: 'Definiția nu a fost găsită' });
      return res.json(def);
    } catch (error) {
      console.error('Error getting workflow definition:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea definiției' });
    }
  },

  // --- Versions ---
  listVersions: async (req: Request, res: Response) => {
    try {
      const definitionId = Number(req.params.id);
      if (!Number.isFinite(definitionId)) return res.status(400).json({ message: 'id invalid' });
      const [rows] = await pool.execute(
        `SELECT id, definition_id, version, is_active, change_note, created_at, created_by
         FROM workflow_definition_versions
         WHERE definition_id = ?
         ORDER BY version DESC`,
        [definitionId]
      );
      return res.json(rows);
    } catch (error) {
      console.error('Error listing workflow versions:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea versiunilor' });
    }
  },

  createVersion: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) {
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }
      const definitionId = Number(req.params.id);
      if (!Number.isFinite(definitionId)) {
        conn.release();
        return res.status(400).json({ message: 'id invalid' });
      }
      const { schema_json, change_note } = req.body as any;
      const schema = safeJsonParse(schema_json) ?? schema_json;
      if (!schema || typeof schema !== 'object') {
        conn.release();
        return res.status(400).json({ message: 'schema_json invalid (JSON)' });
      }

      await conn.beginTransaction();
      const [rows] = await conn.execute(
        'SELECT COALESCE(MAX(version), 0) as maxv FROM workflow_definition_versions WHERE definition_id = ?',
        [definitionId]
      );
      const nextVersion = Number((rows as any[])[0]?.maxv || 0) + 1;

      const [ins] = await conn.execute(
        `INSERT INTO workflow_definition_versions (definition_id, version, schema_json, change_note, is_active, created_by)
         VALUES (?, ?, ?, ?, FALSE, ?)`,
        [definitionId, nextVersion, JSON.stringify(schema), change_note || null, req.user.id]
      );
      const versionId = (ins as any).insertId as number;

      await conn.commit();

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'WORKFLOW_VERSION_CREATED',
        entity_type: 'WORKFLOW_DEFINITION',
        entity_id: definitionId,
        description: `A creat versiunea v${nextVersion} pentru definiția #${definitionId}`,
        details: { definition_id: definitionId, version_id: versionId, version: nextVersion, change_note: change_note || null },
        ip_address: getClientIp(req),
      });

      conn.release();
      return res.status(201).json({ id: versionId, version: nextVersion });
    } catch (error) {
      try { await conn.rollback(); } catch {}
      conn.release();
      console.error('Error creating workflow version:', error);
      return res.status(500).json({ message: 'Eroare la crearea versiunii' });
    }
  },

  getVersionSchema: async (req: Request, res: Response) => {
    try {
      const versionId = Number(req.params.versionId);
      if (!Number.isFinite(versionId)) return res.status(400).json({ message: 'versionId invalid' });
      const [rows] = await pool.execute(
        'SELECT id, definition_id, version, schema_json, is_active, change_note FROM workflow_definition_versions WHERE id = ? LIMIT 1',
        [versionId]
      );
      const v = (rows as any[])[0];
      if (!v) return res.status(404).json({ message: 'Versiunea nu a fost găsită' });
      const schema = safeJsonParse(v.schema_json) ?? v.schema_json;
      return res.json({ ...v, schema_json: schema });
    } catch (error) {
      console.error('Error getting workflow version schema:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea schemei' });
    }
  },

  activateVersion: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) {
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }
      const definitionId = Number(req.params.id);
      const versionId = Number(req.params.versionId);
      if (!Number.isFinite(definitionId) || !Number.isFinite(versionId)) {
        conn.release();
        return res.status(400).json({ message: 'id/versionId invalid' });
      }

      await conn.beginTransaction();
      await conn.execute(
        'UPDATE workflow_definition_versions SET is_active = FALSE WHERE definition_id = ?',
        [definitionId]
      );
      const [upd] = await conn.execute(
        'UPDATE workflow_definition_versions SET is_active = TRUE WHERE id = ? AND definition_id = ?',
        [versionId, definitionId]
      );
      if ((upd as any).affectedRows === 0) {
        throw new Error('Versiunea nu aparține definiției');
      }
      await conn.execute(
        'UPDATE workflow_definitions SET active_version_id = ? WHERE id = ?',
        [versionId, definitionId]
      );
      await conn.commit();

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'WORKFLOW_VERSION_ACTIVATED',
        entity_type: 'WORKFLOW_DEFINITION',
        entity_id: definitionId,
        description: `A activat versiunea #${versionId} pentru definiția #${definitionId}`,
        details: { definition_id: definitionId, version_id: versionId },
        ip_address: getClientIp(req),
      });

      conn.release();
      return res.json({ success: true });
    } catch (error: any) {
      try { await conn.rollback(); } catch {}
      conn.release();
      console.error('Error activating workflow version:', error);
      return res.status(500).json({ message: error?.message || 'Eroare la activarea versiunii' });
    }
  },

  // --- Instances (execution/monitoring) ---
  startInstance: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) {
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }
      const { definitionId, versionId, context_json } = req.body as any;
      if (!definitionId) {
        conn.release();
        return res.status(400).json({ message: 'definitionId obligatoriu' });
      }

      await conn.beginTransaction();
      const [defRows] = await conn.execute(
        'SELECT id, active_version_id FROM workflow_definitions WHERE id = ? AND is_active = 1 LIMIT 1',
        [Number(definitionId)]
      );
      const def = (defRows as any[])[0];
      if (!def) throw new Error('Definiția nu există sau este inactivă');

      const vId = Number(versionId || def.active_version_id);
      if (!vId) throw new Error('Definiția nu are o versiune activă');

      const [verRows] = await conn.execute(
        'SELECT id, schema_json FROM workflow_definition_versions WHERE id = ? AND definition_id = ? LIMIT 1',
        [vId, Number(definitionId)]
      );
      const ver = (verRows as any[])[0];
      if (!ver) throw new Error('Versiunea nu există pentru această definiție');

      const schema = safeJsonParse(ver.schema_json) ?? ver.schema_json;
      const startStepKey = extractStartStep(schema);
      if (!startStepKey) throw new Error('Schema nu definește startStepKey/steps');

      const ctx = safeJsonParse(context_json) ?? context_json ?? null;

      const [ins] = await conn.execute(
        `INSERT INTO workflow_instances (definition_id, version_id, status, current_step_key, context_json, started_by)
         VALUES (?, ?, 'ACTIVE', ?, ?, ?)`,
        [Number(definitionId), vId, startStepKey, ctx ? JSON.stringify(ctx) : null, req.user.id]
      );
      const instanceId = (ins as any).insertId as number;

      await conn.execute(
        `INSERT INTO workflow_instance_history
           (instance_id, action, from_step_key, to_step_key, reason, comment, performed_by, snapshot_json)
         VALUES (?, 'START', NULL, ?, NULL, NULL, ?, ?)`,
        [instanceId, startStepKey, req.user.id, JSON.stringify({ current_step_key: startStepKey, context_json: ctx })]
      );

      await conn.commit();

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'WORKFLOW_INSTANCE_STARTED',
        entity_type: 'WORKFLOW_INSTANCE',
        entity_id: instanceId,
        description: `A inițiat o instanță de flux (def #${definitionId}, ver #${vId})`,
        details: { instance_id: instanceId, definition_id: Number(definitionId), version_id: vId, startStepKey },
        ip_address: getClientIp(req),
      });

      conn.release();
      return res.status(201).json({ id: instanceId, current_step_key: startStepKey });
    } catch (error: any) {
      try { await conn.rollback(); } catch {}
      conn.release();
      console.error('Error starting workflow instance:', error);
      return res.status(500).json({ message: error?.message || 'Eroare la inițierea instanței' });
    }
  },

  listInstances: async (req: Request, res: Response) => {
    try {
      const { definitionId, status } = req.query as any;
      const where: string[] = [];
      const params: any[] = [];
      if (definitionId) { where.push('i.definition_id = ?'); params.push(Number(definitionId)); }
      if (status) { where.push('i.status = ?'); params.push(status); }
      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

      const [rows] = await pool.execute(
        `
        SELECT i.*,
               d.name as definition_name,
               d.flow_type as flow_type,
               v.version as version,
               u.email as started_by_email,
               u.first_name as started_by_first_name,
               u.last_name as started_by_last_name
        FROM workflow_instances i
        JOIN workflow_definitions d ON d.id = i.definition_id
        JOIN workflow_definition_versions v ON v.id = i.version_id
        LEFT JOIN users u ON u.id = i.started_by
        ${whereSql}
        ORDER BY i.started_at DESC
        LIMIT 200
        `,
        params
      );
      return res.json(rows);
    } catch (error) {
      console.error('Error listing workflow instances:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea instanțelor' });
    }
  },

  getInstance: async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: 'id invalid' });

      const [rows] = await pool.execute(
        `
        SELECT i.*,
               d.name as definition_name,
               d.flow_type as flow_type,
               v.version as version,
               v.schema_json as schema_json,
               u.email as started_by_email,
               u.first_name as started_by_first_name,
               u.last_name as started_by_last_name
        FROM workflow_instances i
        JOIN workflow_definitions d ON d.id = i.definition_id
        JOIN workflow_definition_versions v ON v.id = i.version_id
        LEFT JOIN users u ON u.id = i.started_by
        WHERE i.id = ?
        LIMIT 1
        `,
        [id]
      );
      const inst = (rows as any[])[0];
      if (!inst) return res.status(404).json({ message: 'Instanța nu a fost găsită' });

      const [hist] = await pool.execute(
        `
        SELECT h.*,
               u.email as performed_by_email,
               u.first_name as performed_by_first_name,
               u.last_name as performed_by_last_name
        FROM workflow_instance_history h
        LEFT JOIN users u ON u.id = h.performed_by
        WHERE h.instance_id = ?
        ORDER BY h.performed_at ASC
        `,
        [id]
      );

      const schema = safeJsonParse(inst.schema_json) ?? inst.schema_json;
      const ctx = safeJsonParse(inst.context_json) ?? inst.context_json;

      return res.json({ instance: { ...inst, schema_json: schema, context_json: ctx }, history: hist });
    } catch (error) {
      console.error('Error getting workflow instance:', error);
      return res.status(500).json({ message: 'Eroare la încărcarea instanței' });
    }
  },

  advanceInstance: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) {
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        conn.release();
        return res.status(400).json({ message: 'id invalid' });
      }
      const { to_step_key, action, comment } = req.body as any;

      await conn.beginTransaction();
      const [rows] = await conn.execute(
        `SELECT i.id, i.status, i.current_step_key, i.context_json, i.definition_id, i.version_id, v.schema_json
         FROM workflow_instances i
         JOIN workflow_definition_versions v ON v.id = i.version_id
         WHERE i.id = ? FOR UPDATE`,
        [id]
      );
      const inst = (rows as any[])[0];
      if (!inst) throw new Error('Instanța nu există');
      if (!['ACTIVE', 'WAITING_SIGNATURE'].includes(String(inst.status))) throw new Error('Instanța nu este activă');

      const schema = safeJsonParse(inst.schema_json) ?? inst.schema_json;
      const from = inst.current_step_key as string | null;
      if (!from) throw new Error('Instanța nu are current_step_key');

      const allowedNext = getNextSteps(schema, from);
      let to = to_step_key as string | undefined;
      if (!to) {
        const a = typeof action === 'string' ? action : null;
        const t = getTransitionTarget(schema, from, a);
        if (t) to = t;
      }
      if (!to) to = allowedNext[0];
      if (!to || typeof to !== 'string') throw new Error('to_step_key invalid');
      if (allowedNext.length > 0 && !allowedNext.includes(to)) throw new Error(`Tranziție nepermisă: ${from} -> ${to}`);
      const toStep = findStep(schema, to);
      if (!toStep) throw new Error('to_step_key nu există în schema curentă');

      // Dacă suntem în WAITING_SIGNATURE, cerem explicit action=SIGNED (sau to_step_key manual)
      if (String(inst.status) === 'WAITING_SIGNATURE') {
        const curStep = findStep(schema, from);
        const needsSig = !!curStep?.signature?.required;
        const a = typeof action === 'string' ? action.toUpperCase() : '';
        if (needsSig && a !== 'SIGNED' && !to_step_key) {
          throw new Error('Instanța este în WAITING_SIGNATURE: folosește action=SIGNED');
        }
      }

      // Semnare mock: dacă pasul are signature.required => WAITING_SIGNATURE (nu avansăm automat peste semnare)
      const requiresSignature = !!toStep?.signature?.required;
      const isEnd = !!toStep?.isEnd;
      const nextStatus = requiresSignature ? 'WAITING_SIGNATURE' : (isEnd ? 'COMPLETED' : 'ACTIVE');

      await conn.execute(
        `UPDATE workflow_instances
         SET current_step_key = ?, status = ?, completed_at = ${isEnd ? 'NOW()' : 'completed_at'}
         WHERE id = ?`,
        [to, nextStatus, id]
      );

      const snapshot = {
        current_step_key: to,
        context_json: safeJsonParse(inst.context_json) ?? inst.context_json ?? null,
        status: nextStatus,
        step_label: stepLabel(toStep),
        action: typeof action === 'string' ? action : null,
      };

      await conn.execute(
        `INSERT INTO workflow_instance_history
           (instance_id, action, from_step_key, to_step_key, reason, comment, performed_by, snapshot_json)
         VALUES (?, ?, ?, ?, NULL, ?, ?, ?)`,
        [id, isEnd ? 'COMPLETE' : 'ADVANCE', from, to, comment || null, req.user.id, JSON.stringify(snapshot)]
      );

      await conn.commit();

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'WORKFLOW_INSTANCE_ADVANCED',
        entity_type: 'WORKFLOW_INSTANCE',
        entity_id: id,
        description: `A avansat instanța #${id}: ${from} -> ${to}`,
        details: { instance_id: id, from_step_key: from, to_step_key: to, completed: isEnd },
        ip_address: getClientIp(req),
      });

      conn.release();
      return res.json({ success: true, to_step_key: to, completed: isEnd });
    } catch (error: any) {
      try { await conn.rollback(); } catch {}
      conn.release();
      console.error('Error advancing workflow instance:', error);
      return res.status(500).json({ message: error?.message || 'Eroare la avansarea instanței' });
    }
  },

  rollbackInstance: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) {
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        conn.release();
        return res.status(400).json({ message: 'id invalid' });
      }
      const { to_history_id, to_step_key, reason, comment } = req.body as any;
      if (!reason || String(reason).trim() === '') {
        conn.release();
        return res.status(400).json({ message: 'reason este obligatoriu (motivare)'} );
      }

      await conn.beginTransaction();
      const [rows] = await conn.execute(
        `SELECT i.id, i.status, i.current_step_key, i.context_json, v.schema_json
         FROM workflow_instances i
         JOIN workflow_definition_versions v ON v.id = i.version_id
         WHERE i.id = ? FOR UPDATE`,
        [id]
      );
      const inst = (rows as any[])[0];
      if (!inst) throw new Error('Instanța nu există');

      const schema = safeJsonParse(inst.schema_json) ?? inst.schema_json;
      if (!isRollbackAllowed(schema)) throw new Error('Rollback nu este permis de schema fluxului');
      const from = inst.current_step_key as string | null;

      let targetStep: string | null = null;
      if (to_step_key) {
        targetStep = String(to_step_key);
      } else if (to_history_id) {
        const [hRows] = await conn.execute(
          'SELECT to_step_key FROM workflow_instance_history WHERE id = ? AND instance_id = ? LIMIT 1',
          [Number(to_history_id), id]
        );
        const h = (hRows as any[])[0];
        if (!h) throw new Error('to_history_id invalid pentru această instanță');
        targetStep = h.to_step_key || null;
      } else {
        // default: rollback la ultimul START/ADVANCE anterior
        const [hRows] = await conn.execute(
          `SELECT to_step_key FROM workflow_instance_history
           WHERE instance_id = ? AND action IN ('START','ADVANCE','COMPLETE')
           ORDER BY performed_at DESC
           LIMIT 2`,
          [id]
        );
        const hs = hRows as any[];
        if (hs.length < 2) throw new Error('Nu există o stare anterioară stabilă');
        targetStep = hs[1].to_step_key || null;
      }

      if (!targetStep) throw new Error('Nu s-a determinat pasul țintă pentru rollback');
      if (!findStep(schema, targetStep)) throw new Error('Pasul țintă nu există în schema curentă');

      await conn.execute(
        `UPDATE workflow_instances
         SET current_step_key = ?, status = 'ACTIVE', completed_at = NULL
         WHERE id = ?`,
        [targetStep, id]
      );

      const snapshot = {
        current_step_key: targetStep,
        context_json: safeJsonParse(inst.context_json) ?? inst.context_json ?? null,
        status: 'ACTIVE',
      };

      await conn.execute(
        `INSERT INTO workflow_instance_history
           (instance_id, action, from_step_key, to_step_key, reason, comment, performed_by, snapshot_json)
         VALUES (?, 'ROLLBACK', ?, ?, ?, ?, ?, ?)`,
        [id, from || null, targetStep, String(reason), comment || null, req.user.id, JSON.stringify(snapshot)]
      );

      await conn.commit();

      await ActivityLogService.createLog({
        user_id: req.user.id,
        action_type: 'WORKFLOW_INSTANCE_ROLLBACK',
        entity_type: 'WORKFLOW_INSTANCE',
        entity_id: id,
        description: `A efectuat rollback controlat pe instanța #${id} (${from} -> ${targetStep})`,
        details: { instance_id: id, from_step_key: from, to_step_key: targetStep, reason: String(reason) },
        ip_address: getClientIp(req),
      });

      conn.release();
      return res.json({ success: true, to_step_key: targetStep });
    } catch (error: any) {
      try { await conn.rollback(); } catch {}
      conn.release();
      console.error('Error rolling back workflow instance:', error);
      return res.status(500).json({ message: error?.message || 'Eroare la rollback' });
    }
  },

  seedDefaults: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) {
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }
      await conn.beginTransaction();

      const defaults = [
        {
          code: 'WF-CONCEDIU',
          name: 'Cerere concediu (demo aprobare + semnare)',
          flow_type: 'WORKFLOW',
          process_key: 'CONCEDIU',
          schema: {
            name: 'Flux cerere concediu',
            type: 'WORKFLOW',
            startStepKey: 'INIT',
            steps: [
              {
                code: 'INIT',
                label: 'Inițiere cerere',
                actor: 'INITIATOR',
                form: { fields: ['perioada', 'motiv'], validations: ['required'] },
                transitions: [{ action: 'SUBMIT', to: 'AVIZARE' }],
              },
              {
                code: 'AVIZARE',
                label: 'Avizare manager',
                actor: 'MANAGER',
                rules: { autoAssign: 'LEAST_LOADED' },
                transitions: [
                  { action: 'APPROVE', to: 'SEMNARE' },
                  { action: 'REJECT', to: 'INIT' },
                ],
              },
              {
                code: 'SEMNARE',
                label: 'Semnare electronică (mock)',
                actor: 'SEMNATAR',
                signature: { required: true, order: 1, reason: 'Aprob cerere concediu' },
                transitions: [{ action: 'SIGNED', to: 'ARHIVARE' }],
              },
              { code: 'ARHIVARE', label: 'Arhivare finală', actor: 'SYSTEM', isEnd: true },
            ],
            rollback: { allowed: true, strategy: 'RETURN_TO_PREVIOUS' },
          }
        },
        {
          code: 'WF-PETITIE',
          name: 'Soluționare petiție (demo)',
          flow_type: 'WORKFLOW',
          process_key: 'PETITIE',
          schema: {
            name: 'Flux cerere (demo)',
            type: 'WORKFLOW',
            startStepKey: 'RECEIVED',
            steps: [
              { code: 'RECEIVED', label: 'Înregistrată', actor: 'INITIATOR', next: ['ASSIGNED'] },
              { code: 'ASSIGNED', label: 'Repartizată', actor: 'DEPARTAMENT', next: ['IN_PROGRESS'] },
              { code: 'IN_PROGRESS', label: 'În lucru', actor: 'DEPARTAMENT', next: ['FINALIZED'] },
              { code: 'FINALIZED', label: 'Finalizată', actor: 'SYSTEM', isEnd: true },
            ]
          }
        },
        {
          code: 'DOC-FACTURA',
          name: 'Flux document: Factură (demo semnare)',
          flow_type: 'DOCUMENT',
          process_key: 'FACTURA',
          schema: {
            name: 'Flux document – factură (demo)',
            type: 'DOCUMENT',
            startStepKey: 'INIT',
            steps: [
              { code: 'INIT', label: 'Inițiere', actor: 'INITIATOR', next: ['AVIZARE'] },
              { code: 'AVIZARE', label: 'Avizare structură', actor: 'DEPARTAMENT', transitions: [{ action: 'APPROVE', to: 'SEMNARE' }] },
              { code: 'SEMNARE', label: 'Semnare electronică (mock)', actor: 'SEMNATAR', signature: { required: true, order: 1, reason: 'Aprob document' }, transitions: [{ action: 'SIGNED', to: 'ARHIVARE' }] },
              { code: 'ARHIVARE', label: 'Arhivare finală', actor: 'SYSTEM', isEnd: true },
            ],
            rollback: { allowed: true, strategy: 'RETURN_TO_PREVIOUS' },
          }
        },
        {
          code: 'INFO-NOTIFICARI',
          name: 'Flux informații: Notificare către utilizatori (demo)',
          flow_type: 'INFORMATION',
          process_key: 'NOTIFY',
          schema: {
            name: 'Flux informații – notificări (demo)',
            type: 'INFORMATION',
            startStepKey: 'GENERATED',
            steps: [
              { code: 'GENERATED', label: 'Generată', actor: 'SYSTEM', next: ['DELIVERED'] },
              { code: 'DELIVERED', label: 'Livrată', actor: 'SYSTEM', next: ['READ'] },
              { code: 'READ', label: 'Citită', actor: 'INITIATOR', isEnd: true },
            ],
            rollback: { allowed: false, strategy: 'RETURN_TO_PREVIOUS' },
          }
        }
      ];

      const created: any[] = [];
      for (const d of defaults) {
        const [existing] = await conn.execute(
          'SELECT id FROM workflow_definitions WHERE code = ? LIMIT 1',
          [d.code]
        );
        if ((existing as any[]).length > 0) continue;

        const [insDef] = await conn.execute(
          `INSERT INTO workflow_definitions (code, name, flow_type, process_key, description, is_active, created_by)
           VALUES (?, ?, ?, ?, ?, TRUE, ?)`,
          [d.code, d.name, d.flow_type, d.process_key, 'Flux demo (seed defaults)', req.user.id]
        );
        const defId = (insDef as any).insertId as number;
        const [insVer] = await conn.execute(
          `INSERT INTO workflow_definition_versions (definition_id, version, schema_json, change_note, is_active, created_by)
           VALUES (?, 1, ?, 'Exemple inițiale', TRUE, ?)`,
          [defId, JSON.stringify(d.schema), req.user.id]
        );
        const verId = (insVer as any).insertId as number;
        await conn.execute(
          'UPDATE workflow_definitions SET active_version_id = ? WHERE id = ?',
          [verId, defId]
        );
        created.push({ definitionId: defId, versionId: verId, code: d.code });
      }

      await conn.commit();
      conn.release();
      return res.json({ success: true, created });
    } catch (error) {
      try { await conn.rollback(); } catch {}
      conn.release();
      console.error('Error seeding workflow defaults:', error);
      return res.status(500).json({ message: 'Eroare la seed defaults' });
    }
  }
};


