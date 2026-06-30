import { Request, Response } from 'express';
const pool = require('../config/database').default;

export const ActivityLogController = {
  /**
   * Obține logurile de activitate cu filtrare și pagination
   */
  getActivityLogs: async (req: Request, res: Response) => {
    try {
      const {
        actionType,
        entityType,
        userId,
        startDate,
        endDate,
        search,
        page = 1,
        limit = 20
      } = req.query;

      let pageNum = parseInt(page as string, 10);
      let limitNum = parseInt(limit as string, 10);
      if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
      if (isNaN(limitNum) || limitNum < 1) limitNum = 20;
      const offset = (pageNum - 1) * limitNum;

      // Construiește query-ul cu filtre
      let whereConditions = [];
      let queryParams = [];

      if (actionType) {
        whereConditions.push('al.action_type = ?');
        queryParams.push(actionType);
      }

      if (entityType) {
        whereConditions.push('al.entity_type = ?');
        queryParams.push(entityType);
      }

      if (userId) {
        whereConditions.push('al.user_id = ?');
        queryParams.push(parseInt(userId as string));
      }

      if (startDate) {
        whereConditions.push('DATE(al.created_at) >= ?');
        queryParams.push(startDate);
      }

      if (endDate) {
        whereConditions.push('DATE(al.created_at) <= ?');
        queryParams.push(endDate);
      }

      if (search) {
        whereConditions.push('(al.description LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)');
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

      // Query pentru count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM activity_logs al 
        LEFT JOIN users u ON al.user_id = u.id 
        ${whereClause}
      `;
      const [countResult] = await pool.query(countQuery, queryParams);
      const total = (countResult as any[])[0].total;

      // Query pentru date
      const dataQuery = `
        SELECT 
          al.*,
          u.first_name,
          u.last_name,
          u.email
        FROM activity_logs al 
        LEFT JOIN users u ON al.user_id = u.id 
        ${whereClause}
        ORDER BY al.created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      const [rows] = await pool.query(dataQuery, [...queryParams, limitNum, offset]);

      // Parse JSON pentru details
      const logs = (rows as any[]).map(log => {
        let parsedDetails = null;
        if (log.details && typeof log.details === 'string') {
          try {
            parsedDetails = JSON.parse(log.details);
          } catch (e) {
            console.warn('Invalid JSON in details for log ID:', log.id, log.details);
            parsedDetails = null;
          }
        } else if (log.details && typeof log.details === 'object') {
          parsedDetails = log.details;
        }
        
        return {
          ...log,
          details: parsedDetails
        };
      });

      res.json({ logs, total });
    } catch (error) {
      console.error('Eroare la loguri:', error);
      res.status(500).json({ message: 'Eroare la obținerea logurilor de activitate', error: (error as Error).message });
    }
  },

  /**
   * Obține statistici pentru loguri
   */
  getLogStats: async (req: Request, res: Response) => {
    try {
      const [generalStats] = await pool.query(`
        SELECT 
          COUNT(*) as total_logs,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_logs,
          COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as week_logs
        FROM activity_logs
      `);

      const [actionStats] = await pool.query(`
        SELECT 
          action_type,
          COUNT(*) as count
        FROM activity_logs 
        GROUP BY action_type 
        ORDER BY count DESC 
        LIMIT 10
      `);

      const [entityStats] = await pool.query(`
        SELECT 
          entity_type,
          COUNT(*) as count
        FROM activity_logs 
        GROUP BY entity_type 
        ORDER BY count DESC
      `);

      const [userStats] = await pool.query(`
        SELECT 
          u.first_name,
          u.last_name,
          COUNT(al.id) as activity_count
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        GROUP BY al.user_id, u.first_name, u.last_name
        ORDER BY activity_count DESC
        LIMIT 5
      `);

      res.json({
        general: (generalStats as any[])[0],
        actionStats: actionStats as any[],
        entityStats: entityStats as any[],
        userStats: userStats as any[]
      });
    } catch (error) {
      console.error('Error getting log stats:', error);
      res.status(500).json({ message: 'Eroare la obținerea statisticilor logurilor', error: (error as Error).message });
    }
  },

  /**
   * Șterge logurile vechi
   */
  cleanupOldLogs: async (req: Request, res: Response) => {
    try {
      const { daysToKeep = 90 } = req.body;
      await pool.query(
        'DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
        [daysToKeep]
      );
      res.json({ message: `Logurile mai vechi de ${daysToKeep} zile au fost șterse` });
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
      res.status(500).json({ message: 'Eroare la ștergerea logurilor vechi', error: (error as Error).message });
    }
  },

  /**
   * Raport de acces la date cu caracter personal
   * Monitorizează accesul utilizatorilor la date cu caracter personal
   */
  getPersonalDataAccessReport: async (req: Request, res: Response) => {
    try {
      const {
        userId,
        startDate,
        endDate,
        entityType,
        actionType,
        page = 1,
        limit = 50
      } = req.query;

      let pageNum = parseInt(page as string, 10);
      let limitNum = parseInt(limit as string, 10);
      if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
      if (isNaN(limitNum) || limitNum < 1) limitNum = 50;
      const offset = (pageNum - 1) * limitNum;

      // Tipuri de entități care conțin date cu caracter personal
      const personalDataEntityTypes = [
        'PATIENT', 'USER', 'CITIZEN', 'EMPLOYEE', 
        'IDENTITY_DOCUMENT', 'INSURANCE_STATUS', 'EPISODE'
      ];

      // Tipuri de acțiuni care reprezintă acces la date personale
      const personalDataActions = [
        'VIEW', 'ACCESS', 'READ', 'DOWNLOAD', 'EXPORT',
        'PATIENT_VIEWED', 'PATIENT_ACCESSED', 'USER_VIEWED',
        'IDENTITY_ACCESSED', 'INSURANCE_ACCESSED', 'EPISODE_VIEWED'
      ];

      let whereConditions = [];
      let queryParams = [];

      // Filtru pentru entități cu date personale
      if (entityType) {
        whereConditions.push('al.entity_type = ?');
        queryParams.push(entityType);
      } else {
        whereConditions.push(`al.entity_type IN (${personalDataEntityTypes.map(() => '?').join(',')})`);
        queryParams.push(...personalDataEntityTypes);
      }

      // Filtru pentru acțiuni de acces
      if (actionType) {
        whereConditions.push('al.action_type = ?');
        queryParams.push(actionType);
      } else {
        whereConditions.push(`(al.action_type IN (${personalDataActions.map(() => '?').join(',')}) OR al.action_type LIKE '%VIEW%' OR al.action_type LIKE '%ACCESS%')`);
        queryParams.push(...personalDataActions);
      }

      if (userId) {
        whereConditions.push('al.user_id = ?');
        queryParams.push(parseInt(userId as string));
      }

      if (startDate) {
        whereConditions.push('DATE(al.created_at) >= ?');
        queryParams.push(startDate);
      }

      if (endDate) {
        whereConditions.push('DATE(al.created_at) <= ?');
        queryParams.push(endDate);
      }

      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

      // Query pentru count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM activity_logs al 
        LEFT JOIN users u ON al.user_id = u.id 
        ${whereClause}
      `;
      const [countResult] = await pool.query(countQuery, queryParams);
      const total = (countResult as any[])[0].total;

      // Query pentru date cu detalii despre contextul accesului
      const dataQuery = `
        SELECT 
          al.id,
          al.user_id,
          al.action_type,
          al.entity_type,
          al.entity_id,
          al.description,
          al.details,
          al.ip_address,
          al.user_agent,
          al.created_at,
          u.first_name,
          u.last_name,
          u.email,
          CASE 
            WHEN al.details IS NOT NULL AND JSON_EXTRACT(al.details, '$.reason') IS NOT NULL 
            THEN JSON_UNQUOTE(JSON_EXTRACT(al.details, '$.reason'))
            ELSE 'Acces standard'
          END as access_reason,
          CASE 
            WHEN al.details IS NOT NULL AND JSON_EXTRACT(al.details, '$.context') IS NOT NULL 
            THEN JSON_UNQUOTE(JSON_EXTRACT(al.details, '$.context'))
            ELSE NULL
          END as access_context
        FROM activity_logs al 
        LEFT JOIN users u ON al.user_id = u.id 
        ${whereClause}
        ORDER BY al.created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      const [rows] = await pool.query(dataQuery, [...queryParams, limitNum, offset]);

      // Parse JSON pentru details
      const logs = (rows as any[]).map(log => {
        let parsedDetails = null;
        if (log.details && typeof log.details === 'string') {
          try {
            parsedDetails = JSON.parse(log.details);
          } catch (e) {
            parsedDetails = null;
          }
        } else if (log.details && typeof log.details === 'object') {
          parsedDetails = log.details;
        }
        
        return {
          ...log,
          details: parsedDetails,
          access_reason: log.access_reason || 'Acces standard',
          access_context: log.access_context || null
        };
      });

      // Statistici pentru raport
      const [stats] = await pool.query(`
        SELECT 
          COUNT(DISTINCT al.user_id) as unique_users,
          COUNT(DISTINCT al.entity_id) as unique_entities_accessed,
          COUNT(*) as total_accesses
        FROM activity_logs al 
        ${whereClause}
      `, queryParams);

      res.json({
        logs,
        total,
        page: pageNum,
        limit: limitNum,
        stats: (stats as any[])[0]
      });
    } catch (error) {
      console.error('Error getting personal data access report:', error);
      res.status(500).json({ 
        message: 'Eroare la obținerea raportului de acces la date cu caracter personal', 
        error: (error as Error).message 
      });
    }
  }
}; 