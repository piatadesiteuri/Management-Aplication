import pool from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface AuditData {
  entity_id: number;
  entity_type: 'MATERIAL_REQUEST' | 'TRANSPORT_EVENT' | 'STOCK_OPERATION' | 'APPROVAL' | 'NOTIFICATION' | 'DOCUMENT';
  action_type: string;
  performed_by: number;
  old_values?: any;
  new_values?: any;
  comments?: string;
  ip_address?: string;
  user_agent?: string;
}

export class TraceabilityService {
  /**
   * Creează un audit entry pentru cereri de materiale
   */
  static async auditMaterialRequest(data: {
    request_id: number;
    action_type: string;
    performed_by: number;
    old_values?: any;
    new_values?: any;
    comments?: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    try {
      await pool.execute(
        `INSERT INTO material_request_audit 
         (request_id, action_type, performed_by, old_values, new_values, comments, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.request_id,
          data.action_type,
          data.performed_by,
          data.old_values ? JSON.stringify(data.old_values) : null,
          data.new_values ? JSON.stringify(data.new_values) : null,
          data.comments,
          data.ip_address,
          data.user_agent
        ]
      );
      
      console.log(`📝 Material request audit created: ${data.action_type} for request ${data.request_id}`);
    } catch (error) {
      console.error('❌ Error creating material request audit:', error);
    }
  }

  /**
   * Creează un audit entry pentru evenimente de transport
   */
  static async auditTransportEvent(data: {
    event_id: number;
    action_type: string;
    performed_by: number;
    old_values?: any;
    new_values?: any;
    comments?: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    try {
      await pool.execute(
        `INSERT INTO transport_event_audit 
         (event_id, action_type, performed_by, old_values, new_values, comments, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.event_id,
          data.action_type,
          data.performed_by,
          data.old_values ? JSON.stringify(data.old_values) : null,
          data.new_values ? JSON.stringify(data.new_values) : null,
          data.comments,
          data.ip_address,
          data.user_agent
        ]
      );
      
      console.log(`📝 Transport event audit created: ${data.action_type} for event ${data.event_id}`);
    } catch (error) {
      console.error('❌ Error creating transport event audit:', error);
    }
  }

  /**
   * Creează un audit entry pentru operațiuni de stoc
   */
  static async auditStockOperation(data: {
    operation_id?: number;
    operation_type: string;
    entity_type: 'EVENT_STOCK' | 'INVENTORY' | 'SUPPLY_EVENT';
    performed_by: number;
    old_values?: any;
    new_values?: any;
    comments?: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    try {
      await pool.execute(
        `INSERT INTO stock_operation_audit 
         (operation_id, operation_type, entity_type, performed_by, old_values, new_values, comments, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.operation_id,
          data.operation_type,
          data.entity_type,
          data.performed_by,
          data.old_values ? JSON.stringify(data.old_values) : null,
          data.new_values ? JSON.stringify(data.new_values) : null,
          data.comments,
          data.ip_address,
          data.user_agent
        ]
      );
      
      console.log(`📝 Stock operation audit created: ${data.operation_type} for ${data.entity_type}`);
    } catch (error) {
      console.error('❌ Error creating stock operation audit:', error);
    }
  }

  /**
   * Obține istoricul complet al unei cereri de materiale
   */
  static async getMaterialRequestTraceability(requestId: number): Promise<any[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
           mra.*,
           u.first_name,
           u.last_name,
           u.email
         FROM material_request_audit mra
         LEFT JOIN users u ON mra.performed_by = u.id
         WHERE mra.request_id = ?
         ORDER BY mra.performed_at DESC`,
        [requestId]
      );
      
      return rows;
    } catch (error) {
      console.error('❌ Error fetching material request traceability:', error);
      return [];
    }
  }

  /**
   * Obține istoricul complet al unui eveniment de transport
   */
  static async getTransportEventTraceability(eventId: number): Promise<any[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
           tea.*,
           u.first_name,
           u.last_name,
           u.email
         FROM transport_event_audit tea
         LEFT JOIN users u ON tea.performed_by = u.id
         WHERE tea.event_id = ?
         ORDER BY tea.performed_at DESC`,
        [eventId]
      );
      
      return rows;
    } catch (error) {
      console.error('❌ Error fetching transport event traceability:', error);
      return [];
    }
  }

  /**
   * Obține statistici de trasabilitate
   */
  static async getTraceabilityStatistics(): Promise<any> {
    try {
      const [stats] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM traceability_statistics`
      );
      
      return stats;
    } catch (error) {
      console.error('❌ Error fetching traceability statistics:', error);
      return [];
    }
  }

  /**
   * Obține trasabilitatea completă a unei cereri cu toate detaliile
   */
  static async getCompleteRequestTraceability(requestId: number): Promise<any> {
    try {
      const [requestData] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM material_request_traceability WHERE request_id = ?`,
        [requestId]
      );
      
      const [auditTrail] = await pool.execute<RowDataPacket[]>(
        `SELECT 
           mra.*,
           u.first_name,
           u.last_name,
           u.email
         FROM material_request_audit mra
         LEFT JOIN users u ON mra.performed_by = u.id
         WHERE mra.request_id = ?
         ORDER BY mra.performed_at ASC`,
        [requestId]
      );
      
      return {
        request: requestData[0] || null,
        auditTrail: auditTrail || []
      };
    } catch (error) {
      console.error('❌ Error fetching complete request traceability:', error);
      return { request: null, auditTrail: [] };
    }
  }

  /**
   * Obține trasabilitatea completă a unui eveniment de transport
   */
  static async getCompleteTransportTraceability(eventId: number): Promise<any> {
    try {
      const [eventData] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM transport_event_traceability WHERE event_id = ?`,
        [eventId]
      );
      
      const [auditTrail] = await pool.execute<RowDataPacket[]>(
        `SELECT 
           tea.*,
           u.first_name,
           u.last_name,
           u.email
         FROM transport_event_audit tea
         LEFT JOIN users u ON tea.performed_by = u.id
         WHERE tea.event_id = ?
         ORDER BY tea.performed_at ASC`,
        [eventId]
      );
      
      return {
        event: eventData[0] || null,
        auditTrail: auditTrail || []
      };
    } catch (error) {
      console.error('❌ Error fetching complete transport traceability:', error);
      return { event: null, auditTrail: [] };
    }
  }

  /**
   * Obține toate cererile cu trasabilitatea lor
   */
  static async getAllRequestsWithTraceability(filters: {
    status?: string;
    priority?: string;
    requester_id?: number;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<any> {
    try {
      const { status, priority, requester_id, start_date, end_date, page = 1, limit = 20 } = filters;
      const offset = (page - 1) * limit;
      
      let whereConditions = [];
      let queryParams = [];
      
      if (status) {
        whereConditions.push('status = ?');
        queryParams.push(status);
      }
      
      if (priority) {
        whereConditions.push('priority = ?');
        queryParams.push(priority);
      }
      
      if (requester_id) {
        whereConditions.push('requester_id = ?');
        queryParams.push(requester_id);
      }
      
      if (start_date) {
        whereConditions.push('DATE(created_at) >= ?');
        queryParams.push(start_date);
      }
      
      if (end_date) {
        whereConditions.push('DATE(created_at) <= ?');
        queryParams.push(end_date);
      }
      
      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
      
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM material_request_traceability 
         ${whereClause}
         ORDER BY request_created_at DESC
         LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
        queryParams
      );
      
      const [countResult] = await pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM material_request_traceability ${whereClause}`,
        queryParams
      );
      
      return {
        data: rows,
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Error fetching requests with traceability:', error);
      return { data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
    }
  }
}
