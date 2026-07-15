import { Request, Response } from 'express';
import pool from '../config/database';

function toDateOnly(input: string): string {
  // expects YYYY-MM-DD
  return String(input).slice(0, 10);
}

function parseNumberSafe(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export const BudgetController = {
  // --- Indicators ---
  listIndicators: async (req: Request, res: Response) => {
    try {
      const type = String(req.query.type || 'EXPENSE').toUpperCase();
      const [rows] = await pool.execute(
        `
        SELECT id, indicator_type, capitol, subcapitol, paragraf, indicator_code, name, ca_cb,
               row_kind, calc_expression, indent_level, display_order,
               is_active
        FROM budget_indicators
        WHERE is_active = TRUE AND indicator_type = ?
        ORDER BY display_order, LENGTH(indicator_code), indicator_code
        `,
        [type]
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('Error listing budget indicators:', error);
      res.status(500).json({ success: false, message: 'Eroare la încărcarea indicatorilor bugetari' });
    }
  },

  importIndicators: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Neautentificat' });
      const { type, rows } = req.body as any;
      const indicatorType = String(type || 'EXPENSE').toUpperCase();
      if (!Array.isArray(rows) || rows.length === 0) {
        conn.release();
        return res.status(400).json({ success: false, message: 'rows este obligatoriu (listă)' });
      }

      await conn.beginTransaction();
      let upserted = 0;

      for (const r of rows) {
        const capitol = r.capitol ? String(r.capitol) : null;
        const subcapitol = r.subcapitol ? String(r.subcapitol) : null;
        const paragraf = r.paragraf ? String(r.paragraf) : null;
        const indicator_code = String(r.indicator_code || r.code || '').trim();
        const name = String(r.name || r.denumire || '').trim();
        const ca_cb = r.ca_cb ? String(r.ca_cb) : (r.caCb ? String(r.caCb) : null);
        const row_kind = r.row_kind ? String(r.row_kind).toUpperCase() : (r.kind ? String(r.kind).toUpperCase() : 'LEAF');
        const calc_expression = r.calc_expression ? String(r.calc_expression) : (r.formula ? String(r.formula) : null);
        const indent_level = Number.isFinite(Number(r.indent_level)) ? Number(r.indent_level) : (Number.isFinite(Number(r.indent)) ? Number(r.indent) : 0);
        const display_order = Number.isFinite(Number(r.display_order)) ? Number(r.display_order) : (Number.isFinite(Number(r.order)) ? Number(r.order) : 0);
        if (!indicator_code || !name) continue;

        await conn.execute(
          `
          INSERT INTO budget_indicators
            (indicator_type, capitol, subcapitol, paragraf, indicator_code, name, ca_cb,
             row_kind, calc_expression, indent_level, display_order,
             is_active)
          VALUES
            (?, ?, ?, ?, ?, ?, ?,
             ?, ?, ?, ?,
             TRUE)
          ON DUPLICATE KEY UPDATE
            capitol = VALUES(capitol),
            subcapitol = VALUES(subcapitol),
            paragraf = VALUES(paragraf),
            name = VALUES(name),
            ca_cb = VALUES(ca_cb),
            row_kind = VALUES(row_kind),
            calc_expression = VALUES(calc_expression),
            indent_level = VALUES(indent_level),
            display_order = VALUES(display_order),
            is_active = TRUE,
            updated_at = CURRENT_TIMESTAMP
          `,
          [indicatorType, capitol, subcapitol, paragraf, indicator_code, name, ca_cb, row_kind, calc_expression, indent_level, display_order]
        );
        upserted++;
      }

      await conn.commit();
      conn.release();
      return res.json({ success: true, message: 'Indicatori importați', upserted });
    } catch (error) {
      try { await conn.rollback(); } catch {}
      conn.release();
      console.error('Error importing budget indicators:', error);
      return res.status(500).json({ success: false, message: 'Eroare la import indicatori' });
    }
  },

  // --- Annual budget ---
  getAnnualBudget: async (req: Request, res: Response) => {
    try {
      const year = parseInt(String(req.query.year || new Date().getFullYear()), 10);
      const type = String(req.query.type || 'REVENUE').toUpperCase();
      const fundingSource = String(req.query.funding_source || req.query.fundingSource || 'OWN_REVENUE').toUpperCase();
      const [rows] = await pool.execute(
        `
        SELECT
          bi.id as indicator_id,
          bi.indicator_type,
          bi.capitol,
          bi.subcapitol,
          bi.paragraf,
          bi.indicator_code,
          bi.name,
          bi.ca_cb,
          bi.row_kind,
          bi.calc_expression,
          bi.indent_level,
          bi.display_order,
          COALESCE(baa.amount, 0) as amount
        FROM budget_indicators bi
        LEFT JOIN budget_annual_allocations baa
          ON baa.indicator_id = bi.id AND baa.year = ? AND baa.funding_source = ?
        WHERE bi.is_active = TRUE AND bi.indicator_type = ?
        ORDER BY bi.display_order, LENGTH(bi.indicator_code), bi.indicator_code
        `,
        [year, fundingSource, type]
      );
      res.json({ success: true, data: rows, year, type, funding_source: fundingSource });
    } catch (error) {
      console.error('Error getting annual budget:', error);
      res.status(500).json({ success: false, message: 'Eroare la încărcarea bugetului anual' });
    }
  },

  upsertAnnualBudget: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Neautentificat' });
      const year = parseInt(String(req.params.year), 10);
      const { items } = req.body as any;
      const fundingSource = String(req.body.funding_source || req.body.fundingSource || 'OWN_REVENUE').toUpperCase();
      if (!Number.isFinite(year)) {
        conn.release();
        return res.status(400).json({ success: false, message: 'year invalid' });
      }
      if (!Array.isArray(items)) {
        conn.release();
        return res.status(400).json({ success: false, message: 'items este obligatoriu (listă)' });
      }

      await conn.beginTransaction();
      for (const it of items) {
        const indicatorId = Number(it.indicator_id || it.indicatorId);
        if (!Number.isFinite(indicatorId)) continue;
        const amount = parseNumberSafe(it.amount);
        await conn.execute(
          `
          INSERT INTO budget_annual_allocations (year, funding_source, indicator_id, amount, created_by, updated_by)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            amount = VALUES(amount),
            updated_by = VALUES(updated_by),
            updated_at = CURRENT_TIMESTAMP
          `,
          [year, fundingSource, indicatorId, amount, req.user.id, req.user.id]
        );
      }
      await conn.commit();
      conn.release();
      return res.json({ success: true, message: 'Buget anual salvat' });
    } catch (error) {
      try { await conn.rollback(); } catch {}
      conn.release();
      console.error('Error upserting annual budget:', error);
      return res.status(500).json({ success: false, message: 'Eroare la salvarea bugetului anual' });
    }
  },

  // --- Execution (daily) ---
  getExecution: async (req: Request, res: Response) => {
    try {
      const date = toDateOnly(String(req.query.date || new Date().toISOString().slice(0, 10)));
      const [rows] = await pool.execute(
        `
        SELECT
          bi.id as indicator_id,
          bi.capitol,
          bi.subcapitol,
          bi.paragraf,
          bi.indicator_code,
          bi.name,
          bi.ca_cb,
          bi.row_kind,
          bi.calc_expression,
          bi.indent_level,
          bi.display_order,
          COALESCE(ex.credits_initial, 0) as credits_initial,
          COALESCE(ex.credits_definitive, 0) as credits_definitive,
          COALESCE(ex.commitments_budgetary, 0) as commitments_budgetary,
          COALESCE(ex.commitments_legal, 0) as commitments_legal,
          COALESCE(ex.payments_made, 0) as payments_made,
          COALESCE(ex.commitments_legal_to_pay, 0) as commitments_legal_to_pay,
          COALESCE(ex.expenses_effective, 0) as expenses_effective
        FROM budget_indicators bi
        LEFT JOIN budget_execution_daily ex
          ON ex.indicator_id = bi.id AND ex.exec_date = ?
        WHERE bi.is_active = TRUE AND bi.indicator_type = 'EXPENSE'
        ORDER BY bi.display_order, LENGTH(bi.indicator_code), bi.indicator_code
        `,
        [date]
      );
      res.json({ success: true, date, data: rows });
    } catch (error) {
      console.error('Error getting budget execution:', error);
      res.status(500).json({ success: false, message: 'Eroare la încărcarea execuției' });
    }
  },

  upsertExecution: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Neautentificat' });
      const date = toDateOnly(String(req.params.date));
      const { items } = req.body as any;
      if (!Array.isArray(items)) {
        conn.release();
        return res.status(400).json({ success: false, message: 'items este obligatoriu (listă)' });
      }

      await conn.beginTransaction();
      for (const it of items) {
        const indicatorId = Number(it.indicator_id || it.indicatorId);
        if (!Number.isFinite(indicatorId)) continue;
        await conn.execute(
          `
          INSERT INTO budget_execution_daily
            (exec_date, indicator_id,
             credits_initial, credits_definitive, commitments_budgetary, commitments_legal,
             payments_made, commitments_legal_to_pay, expenses_effective,
             created_by, updated_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            credits_initial = VALUES(credits_initial),
            credits_definitive = VALUES(credits_definitive),
            commitments_budgetary = VALUES(commitments_budgetary),
            commitments_legal = VALUES(commitments_legal),
            payments_made = VALUES(payments_made),
            commitments_legal_to_pay = VALUES(commitments_legal_to_pay),
            expenses_effective = VALUES(expenses_effective),
            updated_by = VALUES(updated_by),
            updated_at = CURRENT_TIMESTAMP
          `,
          [
            date,
            indicatorId,
            parseNumberSafe(it.credits_initial),
            parseNumberSafe(it.credits_definitive),
            parseNumberSafe(it.commitments_budgetary),
            parseNumberSafe(it.commitments_legal),
            parseNumberSafe(it.payments_made),
            parseNumberSafe(it.commitments_legal_to_pay),
            parseNumberSafe(it.expenses_effective),
            req.user.id,
            req.user.id,
          ]
        );
      }
      await conn.commit();
      conn.release();
      return res.json({ success: true, message: 'Execuție salvată' });
    } catch (error) {
      try { await conn.rollback(); } catch {}
      conn.release();
      console.error('Error upserting execution:', error);
      return res.status(500).json({ success: false, message: 'Eroare la salvarea execuției' });
    }
  },

  clonePreviousDay: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Neautentificat' });
      const date = toDateOnly(String(req.params.date));

      // find latest previous date that has any execution rows
      const [prevRows] = await conn.execute(
        `SELECT exec_date as d
         FROM budget_execution_daily
         WHERE exec_date < ?
         GROUP BY exec_date
         ORDER BY exec_date DESC
         LIMIT 1`,
        [date]
      );
      const prevDate = (prevRows as any[])[0]?.d;
      if (!prevDate) {
        conn.release();
        return res.status(400).json({ success: false, message: 'Nu există zi precedentă cu date salvate' });
      }

      await conn.beginTransaction();
      // copy all rows from prevDate into date (upsert)
      await conn.execute(
        `
        INSERT INTO budget_execution_daily
          (exec_date, indicator_id,
           credits_initial, credits_definitive, commitments_budgetary, commitments_legal,
           payments_made, commitments_legal_to_pay, expenses_effective,
           created_by, updated_by)
        SELECT
          ?, indicator_id,
          credits_initial, credits_definitive, commitments_budgetary, commitments_legal,
          payments_made, commitments_legal_to_pay, expenses_effective,
          ?, ?
        FROM budget_execution_daily
        WHERE exec_date = ?
        ON DUPLICATE KEY UPDATE
          credits_initial = VALUES(credits_initial),
          credits_definitive = VALUES(credits_definitive),
          commitments_budgetary = VALUES(commitments_budgetary),
          commitments_legal = VALUES(commitments_legal),
          payments_made = VALUES(payments_made),
          commitments_legal_to_pay = VALUES(commitments_legal_to_pay),
          expenses_effective = VALUES(expenses_effective),
          updated_by = VALUES(updated_by),
          updated_at = CURRENT_TIMESTAMP
        `,
        [date, req.user.id, req.user.id, prevDate]
      );
      await conn.commit();
      conn.release();
      return res.json({ success: true, message: 'Am preluat valorile din ziua precedentă', prevDate });
    } catch (error) {
      try { await conn.rollback(); } catch {}
      conn.release();
      console.error('Error cloning previous day execution:', error);
      return res.status(500).json({ success: false, message: 'Eroare la preluarea zilei precedente' });
    }
  },
};


