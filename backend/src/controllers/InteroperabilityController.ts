import { Request, Response } from 'express';
import pool from '../config/database';
import { ResultSetHeader } from 'mysql2';

export const InteroperabilityController = {
  // === INTEGRĂRI EXTERNE ===
  listIntegrations: async (req: Request, res: Response) => {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          ei.*,
          COUNT(DISTINCT er.id) as reports_count,
          COUNT(DISTINCT il.id) as logs_count,
          MAX(il.created_at) as last_activity
        FROM interoperability_integrations ei
        LEFT JOIN interoperability_reports er ON ei.id = er.integration_id
        LEFT JOIN interoperability_logs il ON ei.id = il.integration_id
        WHERE ei.is_active = 1
        GROUP BY ei.id
        ORDER BY ei.name
      `);
      res.json(rows);
    } catch (error) {
      console.error('Error listing integrations:', error);
      res.status(500).json({ message: 'Eroare la listarea integrărilor' });
    }
  },

  getIntegration: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [integrations] = await pool.execute(
        'SELECT * FROM interoperability_integrations WHERE id = ?',
        [id]
      );
      if ((integrations as any[]).length === 0) {
        return res.status(404).json({ message: 'Integrare nu a fost găsită' });
      }
      res.json((integrations as any[])[0]);
    } catch (error) {
      console.error('Error getting integration:', error);
      res.status(500).json({ message: 'Eroare la obținerea integrării' });
    }
  },

  updateIntegration: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { endpoint_url, api_key, api_secret, config_json, status } = req.body;

      await pool.execute(
        `UPDATE interoperability_integrations 
         SET endpoint_url = ?, api_key = ?, api_secret = ?, config_json = ?, status = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          endpoint_url || null,
          api_key || null,
          api_secret || null,
          config_json ? JSON.stringify(config_json) : null,
          status || 'PLANNED',
          id
        ]
      );

      res.json({ message: 'Integrare actualizată cu succes' });
    } catch (error) {
      console.error('Error updating integration:', error);
      res.status(500).json({ message: 'Eroare la actualizarea integrării' });
    }
  },

  testConnection: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [integrations] = await pool.execute(
        'SELECT * FROM interoperability_integrations WHERE id = ?',
        [id]
      );

      if ((integrations as any[]).length === 0) {
        return res.status(404).json({ message: 'Integrare nu a fost găsită' });
      }

      const integration = (integrations as any[])[0];

      // Simulare test conexiune (în producție ar face request real)
      const testResult = {
        success: integration.endpoint_url ? Math.random() > 0.3 : false, // 70% success rate dacă are endpoint
        duration_ms: Math.floor(Math.random() * 1000) + 100,
        error: integration.endpoint_url ? null : 'Endpoint URL nu este configurat'
      };

      // Salvează rezultatul testului
      await pool.execute(
        `UPDATE interoperability_integrations 
         SET last_connection_test = NOW(),
             last_connection_status = ?,
             last_connection_error = ?
         WHERE id = ?`,
        [
          testResult.success ? 'SUCCESS' : 'FAILED',
          testResult.error || null,
          id
        ]
      );

      // Salvează în log
      await pool.execute(
        `INSERT INTO interoperability_logs (integration_id, action_type, request_url, request_method, success, error_message, duration_ms)
         VALUES (?, 'CONNECTION_TEST', ?, 'GET', ?, ?, ?)`,
        [
          id,
          integration.endpoint_url || '',
          testResult.success ? 1 : 0,
          testResult.error || null,
          testResult.duration_ms
        ]
      );

      res.json(testResult);
    } catch (error) {
      console.error('Error testing connection:', error);
      res.status(500).json({ message: 'Eroare la testarea conexiunii', error: (error as Error).message });
    }
  },

  // === RAPOARTE EXTERNE ===
  listReports: async (req: Request, res: Response) => {
    try {
      const { integrationId, status, startDate, endDate } = req.query;
      let query = `
        SELECT 
          er.*,
          ei.name as integration_name,
          ei.code as integration_code,
          u.first_name as created_by_first_name,
          u.last_name as created_by_last_name
        FROM interoperability_reports er
        JOIN interoperability_integrations ei ON er.integration_id = ei.id
        LEFT JOIN users u ON er.created_by = u.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (integrationId) {
        query += ' AND er.integration_id = ?';
        params.push(integrationId);
      }
      if (status) {
        query += ' AND er.status = ?';
        params.push(status);
      }
      if (startDate) {
        query += ' AND er.report_period_start >= ?';
        params.push(startDate);
      }
      if (endDate) {
        query += ' AND er.report_period_end <= ?';
        params.push(endDate);
      }

      query += ' ORDER BY er.created_at DESC LIMIT 100';
      const [rows] = await pool.execute(query, params);
      res.json(rows);
    } catch (error) {
      console.error('Error listing reports:', error);
      res.status(500).json({ message: 'Eroare la listarea rapoartelor' });
    }
  },

  createReport: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Neautentificat' });
      }

      const { integrationId, reportType, reportPeriodStart, reportPeriodEnd, payload } = req.body;

      const [result] = await pool.execute(
        `INSERT INTO interoperability_reports (integration_id, report_type, report_period_start, report_period_end, payload_json, status, created_by)
         VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
        [
          integrationId,
          reportType,
          reportPeriodStart,
          reportPeriodEnd,
          payload ? JSON.stringify(payload) : null,
          req.user.id
        ]
      );
      const reportId = (result as ResultSetHeader).insertId;

      res.status(201).json({ id: reportId, message: 'Raport creat cu succes' });
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({ message: 'Eroare la crearea raportului', error: (error as Error).message });
    }
  },

  sendReport: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [reports] = await pool.execute(
        'SELECT er.*, ei.endpoint_url, ei.api_key FROM interoperability_reports er JOIN interoperability_integrations ei ON er.integration_id = ei.id WHERE er.id = ?',
        [id]
      );

      if ((reports as any[]).length === 0) {
        return res.status(404).json({ message: 'Raport nu a fost găsit' });
      }

      const report = (reports as any[])[0];

      // Simulare trimitere raport (în producție ar face request real către endpoint)
      const sendResult = {
        success: report.endpoint_url ? Math.random() > 0.2 : false, // 80% success rate
        response: report.endpoint_url ? { status: 'RECEIVED', messageId: `MSG-${Date.now()}` } : null,
        error: report.endpoint_url ? null : 'Endpoint URL nu este configurat'
      };

      // Actualizează statusul raportului
      await pool.execute(
        `UPDATE interoperability_reports 
         SET status = ?, response_json = ?, error_message = ?, sent_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [
          sendResult.success ? 'SENT' : 'ERROR',
          sendResult.response ? JSON.stringify(sendResult.response) : null,
          sendResult.error || null,
          id
        ]
      );

      // Salvează în log
      await pool.execute(
        `INSERT INTO interoperability_logs (integration_id, action_type, request_url, request_method, request_payload, response_status, response_body, success, error_message, duration_ms)
         VALUES (?, 'REPORT_SENT', ?, 'POST', ?, ?, ?, ?, ?, ?)`,
        [
          report.integration_id,
          report.endpoint_url || '',
          'POST',
          report.payload_json || null,
          sendResult.success ? 200 : 500,
          sendResult.response ? JSON.stringify(sendResult.response) : null,
          sendResult.success ? 1 : 0,
          sendResult.error || null,
          Math.floor(Math.random() * 500) + 200
        ]
      );

      res.json({ message: sendResult.success ? 'Raport trimis cu succes' : 'Eroare la trimiterea raportului', ...sendResult });
    } catch (error) {
      console.error('Error sending report:', error);
      res.status(500).json({ message: 'Eroare la trimiterea raportului', error: (error as Error).message });
    }
  },

  // === LOG-URI ===
  listLogs: async (req: Request, res: Response) => {
    try {
      const { integrationId, limit = 100 } = req.query;
      let query = `
        SELECT 
          il.*,
          ei.name as integration_name,
          ei.code as integration_code
        FROM interoperability_logs il
        JOIN interoperability_integrations ei ON il.integration_id = ei.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (integrationId) {
        query += ' AND il.integration_id = ?';
        params.push(integrationId);
      }

      query += ' ORDER BY il.created_at DESC LIMIT ?';
      params.push(Number(limit));

      const [rows] = await pool.execute(query, params);
      res.json(rows);
    } catch (error) {
      console.error('Error listing logs:', error);
      res.status(500).json({ message: 'Eroare la listarea log-urilor' });
    }
  },

  // === CONFIGURARE RAPORTARE AUTOMATĂ ===
  listAutoReportConfigs: async (req: Request, res: Response) => {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          arc.*,
          ei.name as integration_name,
          ei.code as integration_code
        FROM interoperability_auto_report_configs arc
        JOIN interoperability_integrations ei ON arc.integration_id = ei.id
        ORDER BY arc.next_run_at ASC
      `);
      res.json(rows);
    } catch (error) {
      console.error('Error listing auto report configs:', error);
      res.status(500).json({ message: 'Eroare la listarea configurărilor' });
    }
  },

  createAutoReportConfig: async (req: Request, res: Response) => {
    try {
      const { integrationId, reportType, scheduleType, scheduleDay, scheduleTime } = req.body;

      // Calculează next_run_at (simplificat)
      const nextRun = new Date();
      nextRun.setHours(parseInt(scheduleTime.split(':')[0]));
      nextRun.setMinutes(parseInt(scheduleTime.split(':')[1]));
      if (nextRun < new Date()) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      const [result] = await pool.execute(
        `INSERT INTO interoperability_auto_report_configs (integration_id, report_type, schedule_type, schedule_day, schedule_time, next_run_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [integrationId, reportType, scheduleType, scheduleDay || null, scheduleTime, nextRun]
      );
      const configId = (result as ResultSetHeader).insertId;

      res.status(201).json({ id: configId, message: 'Configurare creată cu succes' });
    } catch (error) {
      console.error('Error creating auto report config:', error);
      res.status(500).json({ message: 'Eroare la crearea configurării', error: (error as Error).message });
    }
  }
};

