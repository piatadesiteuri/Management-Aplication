import pool from '../config/database';

export interface ActivityLogData {
  user_id: number;
  action_type: string;
  entity_type: string;
  entity_id?: number | null;
  description: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
}

export class ActivityLogService {
  /**
   * Creează un log de activitate
   */
  static async createLog(data: ActivityLogData): Promise<void> {
    try {
      console.log('🔍 ActivityLogService.createLog called with:', data);
      const details = data.details ? JSON.stringify(data.details) : null;
      
      const [result] = await pool.execute(
        `INSERT INTO activity_logs (
          user_id, action_type, entity_type, entity_id, description, 
          details, ip_address, user_agent, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          data.user_id,
          data.action_type,
          data.entity_type,
          data.entity_id || null,
          data.description,
          details,
          data.ip_address || null,
          data.user_agent || null
        ]
      );
      
      console.log(`📝 Activity log created successfully: ${data.action_type} - ${data.description}`);
      console.log(`📝 Insert result:`, result);
      
      // Trimite logul în timp real prin WebSocket
      try {
        const [userResult] = await pool.query(
          'SELECT first_name, last_name, email FROM users WHERE id = ?',
          [data.user_id]
        );
        const user = (userResult as any[])[0];
        
        // Obține ID-ul real al logului creat
        const logId = (result as any).insertId;
        
        const realtimeLog = {
          id: logId,
          user_id: data.user_id,
          action_type: data.action_type,
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          description: data.description,
          details: data.details,
          ip_address: data.ip_address,
          user_agent: data.user_agent,
          created_at: new Date().toISOString(),
          first_name: user?.first_name || 'Unknown',
          last_name: user?.last_name || 'User',
          email: user?.email || 'unknown@example.com'
        };
        
        // Importă funcția de broadcast
        const { broadcastActivityLog } = require('../app');
        
        // Pentru logout, trimite la toți utilizatorii conectați
        if (data.action_type === 'LOGOUT') {
          console.log(`📡 Broadcasting logout log ${logId} to all connected users`);
        }
        
        broadcastActivityLog(realtimeLog);
        
        console.log(`📡 Broadcasted activity log ${logId} via WebSocket`);
      } catch (wsError) {
        console.error('❌ Error broadcasting activity log:', wsError);
      }
    } catch (error) {
      console.error('❌ Error creating activity log:', error);
      // Nu aruncăm eroarea pentru a nu afecta operațiunea principală
    }
  }

  /**
   * Log pentru crearea evenimentelor
   */
  static async logEventCreated(userId: number, eventId: number, eventTitle: string, eventType: string, ipAddress?: string): Promise<void> {
    await this.createLog({
      user_id: userId,
      action_type: 'EVENT_CREATED',
      entity_type: 'EVENT',
      entity_id: eventId,
      description: `A creat evenimentul "${eventTitle}"`,
      details: {
        event_id: eventId,
        event_title: eventTitle,
        event_type: eventType
      },
      ip_address: ipAddress
    });
  }

  /**
   * Log pentru actualizarea evenimentelor
   */
  static async logEventUpdated(userId: number, eventId: number, eventTitle: string, changes: any, ipAddress?: string): Promise<void> {
    await this.createLog({
      user_id: userId,
      action_type: 'EVENT_UPDATED',
      entity_type: 'EVENT',
      entity_id: eventId,
      description: `A actualizat evenimentul "${eventTitle}"`,
      details: {
        event_id: eventId,
        event_title: eventTitle,
        changes: changes
      },
      ip_address: ipAddress
    });
  }

  /**
   * Log pentru ștergerea evenimentelor
   */
  static async logEventDeleted(userId: number, eventId: number, eventTitle: string, ipAddress?: string): Promise<void> {
    await this.createLog({
      user_id: userId,
      action_type: 'EVENT_DELETED',
      entity_type: 'EVENT',
      entity_id: eventId,
      description: `A șters evenimentul "${eventTitle}"`,
      details: {
        event_id: eventId,
        event_title: eventTitle
      },
      ip_address: ipAddress
    });
  }

  /**
   * Log pentru aprobarea evenimentelor
   */
  static async logEventApproved(userId: number, eventId: number, eventTitle: string, ipAddress?: string): Promise<void> {
    await this.createLog({
      user_id: userId,
      action_type: 'EVENT_APPROVED',
      entity_type: 'EVENT',
      entity_id: eventId,
      description: `A aprobat evenimentul "${eventTitle}"`,
      details: {
        event_id: eventId,
        event_title: eventTitle
      },
      ip_address: ipAddress
    });
  }

  /**
   * Log pentru respingerea evenimentelor
   */
  static async logEventRejected(userId: number, eventId: number, eventTitle: string, reason: string, ipAddress?: string): Promise<void> {
    await this.createLog({
      user_id: userId,
      action_type: 'EVENT_REJECTED',
      entity_type: 'EVENT',
      entity_id: eventId,
      description: `A respins evenimentul "${eventTitle}"`,
      details: {
        event_id: eventId,
        event_title: eventTitle,
        reason: reason
      },
      ip_address: ipAddress
    });
  }

  /**
   * Log pentru asignarea utilizatorilor la evenimente
   */
  static async logEventAssigned(userId: number, eventId: number, eventTitle: string, assignedUserId: number, role: string, ipAddress?: string): Promise<void> {
    await this.createLog({
      user_id: userId,
      action_type: 'EVENT_ASSIGNED',
      entity_type: 'EVENT',
      entity_id: eventId,
      description: `A asignat utilizatorul la evenimentul "${eventTitle}"`,
      details: {
        event_id: eventId,
        event_title: eventTitle,
        assigned_user_id: assignedUserId,
        role: role
      },
      ip_address: ipAddress
    });
  }

  /**
   * Log pentru crearea alertelor
   */
  static async logAlertCreated(userId: number, alertId: number, alertTitle: string, alertType: string, ipAddress?: string): Promise<void> {
    await this.createLog({
      user_id: userId,
      action_type: 'ALERT_CREATED',
      entity_type: 'ALERT',
      entity_id: alertId,
      description: `S-a generat alertă: "${alertTitle}"`,
      details: {
        alert_id: alertId,
        alert_title: alertTitle,
        alert_type: alertType
      },
      ip_address: ipAddress
    });
  }

  /**
   * Log pentru rezolvarea alertelor
   */
  static async logAlertResolved(userId: number, alertId: number, alertTitle: string, ipAddress?: string): Promise<void> {
    await this.createLog({
      user_id: userId,
      action_type: 'ALERT_RESOLVED',
      entity_type: 'ALERT',
      entity_id: alertId,
      description: `A rezolvat alerta: "${alertTitle}"`,
      details: {
        alert_id: alertId,
        alert_title: alertTitle
      },
      ip_address: ipAddress
    });
  }

  /**
   * Log pentru autentificare
   */
  static async logUserLogin(userId: number, email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    console.log('🔍 ActivityLogService.logUserLogin called with:', { userId, email, ipAddress, userAgent });
    try {
      await this.createLog({
        user_id: userId,
        action_type: 'LOGIN',
        entity_type: 'USER',
        entity_id: userId,
        description: `S-a conectat în sistem`,
        details: {
          user_email: email
        },
        ip_address: ipAddress,
        user_agent: userAgent
      });
      console.log('✅ ActivityLogService.logUserLogin completed successfully');
    } catch (error) {
      console.error('❌ ActivityLogService.logUserLogin error:', error);
      throw error;
    }
  }

  /**
   * Log pentru deconectare
   */
  static async logUserLogout(userId: number, email: string, ipAddress?: string): Promise<void> {
    try {
      console.log('🔍 ActivityLogService.logUserLogout called for user:', userId, email);
      await this.createLog({
        user_id: userId,
        action_type: 'LOGOUT',
        entity_type: 'USER',
        entity_id: userId,
        description: `S-a deconectat din sistem`,
        details: {
          user_email: email
        },
        ip_address: ipAddress
      });
      console.log('✅ ActivityLogService.logUserLogout completed successfully');
    } catch (error) {
      console.error('❌ ActivityLogService.logUserLogout error:', error);
      throw error;
    }
  }

  /**
   * Log pentru crearea vehiculelor
   */
  static async logVehicleCreated(userId: number, vehicleId: number, vehicleBrand: string, vehicleModel: string, ipAddress?: string): Promise<void> {
    await this.createLog({
      user_id: userId,
      action_type: 'VEHICLE_CREATED',
      entity_type: 'VEHICLE',
      entity_id: vehicleId,
      description: `A adăugat vehiculul "${vehicleBrand} ${vehicleModel}"`,
      details: {
        vehicle_id: vehicleId,
        vehicle_brand: vehicleBrand,
        vehicle_model: vehicleModel
      },
      ip_address: ipAddress
    });
  }

  /**
   * Log pentru crearea furnizorilor
   */
  static async logSupplierCreated(userId: number, supplierId: number, supplierName: string, ipAddress?: string): Promise<void> {
    await this.createLog({
      user_id: userId,
      action_type: 'SUPPLIER_CREATED',
      entity_type: 'SUPPLIER',
      entity_id: supplierId,
      description: `A adăugat furnizorul "${supplierName}"`,
      details: {
        supplier_id: supplierId,
        supplier_name: supplierName
      },
      ip_address: ipAddress
    });
  }

  /**
   * Log pentru modificarea setărilor
   */
  static async logSettingsChanged(userId: number, settingType: string, changes: any, ipAddress?: string): Promise<void> {
    await this.createLog({
      user_id: userId,
      action_type: 'SETTINGS_CHANGED',
      entity_type: 'SYSTEM',
      entity_id: null,
      description: `A modificat setările de ${settingType}`,
      details: changes,
      ip_address: ipAddress
    });
  }

  /**
   * Log pentru generarea rapoartelor
   */
  static async logReportGenerated(userId: number, reportType: string, reportParams: any, ipAddress?: string): Promise<void> {
    await this.createLog({
      user_id: userId,
      action_type: 'REPORT_GENERATED',
      entity_type: 'SYSTEM',
      entity_id: null,
      description: `A generat raportul "${reportType}"`,
      details: {
        report_type: reportType,
        parameters: reportParams
      },
      ip_address: ipAddress
    });
  }

  /**
   * Log pentru acțiunile cu task-uri
   */
  static async logTaskAction(userId: number, taskId: number, actionType: string, description: string, ipAddress?: string): Promise<void> {
    await this.createLog({
      user_id: userId,
      action_type: actionType,
      entity_type: 'TASK',
      entity_id: taskId,
      description: description,
      ip_address: ipAddress
    });
  }
} 