import pool from '../config/database';
import { ActivityLogService } from './ActivityLogService';

export interface AlertRule {
  id: number;
  name: string;
  description: string;
  type: 'EVENT' | 'VEHICLE' | 'SUPPLIER' | 'USER';
  condition_sql: string; // SQL condition
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  is_active: boolean;
  notification_channels: string[]; // ['email', 'in_app', 'sms']
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: number;
  rule_id: number;
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  entity_type: 'EVENT' | 'VEHICLE' | 'SUPPLIER' | 'USER';
  entity_id: number;
  user_id?: number;
  department_id?: number;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

export class RuleEngineService {
  private static instance: RuleEngineService;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): RuleEngineService {
    if (!RuleEngineService.instance) {
      RuleEngineService.instance = new RuleEngineService();
    }
    return RuleEngineService.instance;
  }

  /**
   * Pornește motorul de reguli
   */
  public startRuleEngine(): void {
    console.log('🚀 Starting Rule Engine...');
    
    // Verifică regulile la fiecare 5 minute
    this.checkInterval = setInterval(() => {
      this.checkAllRules();
    }, 5 * 60 * 1000);

    // Prima verificare imediat
    this.checkAllRules();
  }

  /**
   * Oprește motorul de reguli
   */
  public stopRuleEngine(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🛑 Rule Engine stopped');
    }
  }

  /**
   * Verifică toate regulile active
   */
  private async checkAllRules(): Promise<void> {
    try {
      console.log('🔍 Checking all active rules...');
      
      const rules = await this.getActiveRules();
      
      for (const rule of rules) {
        await this.evaluateRule(rule);
      }
      
      console.log(`✅ Checked ${rules.length} rules`);
    } catch (error) {
      console.error('❌ Error checking rules:', error);
    }
  }

  /**
   * Obține toate regulile active
   */
  private async getActiveRules(): Promise<AlertRule[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM alert_rules WHERE is_active = 1 ORDER BY severity DESC'
    );
    return rows as AlertRule[];
  }

  /**
   * Evaluează o regulă specifică
   */
  private async evaluateRule(rule: AlertRule): Promise<void> {
    try {
      console.log(`🔍 Evaluating rule: ${rule.name}`);
      
      // Execută condiția SQL pentru a găsi entitățile care îndeplinesc regula
      const [entities] = await pool.execute(rule.condition_sql);
      
      if ((entities as any[]).length > 0) {
        console.log(`⚠️ Rule "${rule.name}" triggered for ${(entities as any[]).length} entities`);
        
        // Creează alerte pentru fiecare entitate
        for (const entity of entities as any[]) {
          await this.createAlert(rule, entity);
        }
      }
    } catch (error) {
      console.error(`❌ Error evaluating rule "${rule.name}":`, error);
    }
  }

  /**
   * Creează o alertă
   */
  private async createAlert(rule: AlertRule, entity: any): Promise<void> {
    try {
      // Verifică dacă alerta există deja
      const existingAlert = await this.getExistingAlert(rule.id, entity.id);
      
      if (existingAlert) {
        console.log(`ℹ️ Alert already exists for rule ${rule.id} and entity ${entity.id}`);
        return;
      }

      // Creează alerta
      const alertTitle = this.generateAlertTitle(rule, entity);
      const alertMessage = this.generateAlertMessage(rule, entity);

      const [result] = await pool.execute(
        `INSERT INTO alerts (
          rule_id, title, message, severity, status, entity_type, entity_id, 
          user_id, department_id, created_at
        ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, NOW())`,
        [
          rule.id,
          alertTitle,
          alertMessage,
          rule.severity,
          rule.type,
          entity.id,
          entity.user_id || null,
          entity.department_id || null
        ]
      );

      const alertId = (result as any).insertId;
      console.log(`✅ Created alert ${alertId} for rule "${rule.name}"`);

      // Log activitatea
      await ActivityLogService.logAlertCreated(
        1, // System user
        alertId,
        alertTitle,
        rule.type,
        '192.168.1.100' // System IP
      );

      // Trimite notificări
      await this.sendNotifications(rule, alertId, entity);

      // Broadcast alerta prin WebSocket pentru real-time
      try {
        const { sendNotification } = require('../app');
        
        // Trimite la toți utilizatorii conectați (pentru admini)
        const alertData = {
          type: 'alert',
          data: {
            id: alertId,
            title: alertTitle,
            message: alertMessage,
            severity: rule.severity,
            entity_type: rule.type,
            created_at: new Date().toISOString()
          }
        };
        
        // Broadcast la toți utilizatorii
        const { broadcastActivityLog } = require('../app');
        broadcastActivityLog({
          id: alertId,
          user_id: 1,
          action_type: 'ALERT_CREATED',
          entity_type: 'ALERT',
          entity_id: alertId,
          description: `Alertă nouă: ${alertTitle}`,
          details: {
            alert_title: alertTitle,
            alert_severity: rule.severity,
            alert_type: rule.type
          },
          ip_address: '192.168.1.100',
          created_at: new Date().toISOString(),
          first_name: 'System',
          last_name: 'Alert',
          email: 'system@dspdolj.ro'
        });
        
        console.log(`📡 Broadcasted alert ${alertId} via WebSocket`);
      } catch (wsError) {
        console.error('❌ Error broadcasting alert:', wsError);
      }

    } catch (error) {
      console.error('❌ Error creating alert:', error);
    }
  }

  /**
   * Verifică dacă există deja o alertă pentru această regulă și entitate
   */
  private async getExistingAlert(ruleId: number, entityId: number): Promise<Alert | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM alerts WHERE rule_id = ? AND entity_id = ? AND status = "ACTIVE"',
      [ruleId, entityId]
    );
    
    const alerts = rows as Alert[];
    return alerts.length > 0 ? alerts[0] : null;
  }

  /**
   * Generează titlul alertei
   */
  private generateAlertTitle(rule: AlertRule, entity: any): string {
    switch (rule.type) {
      case 'EVENT':
        return `Eveniment: ${entity.title || 'Fără titlu'}`;
      case 'VEHICLE':
        return `Vehicul: ${entity.brand} ${entity.model}`;
      case 'SUPPLIER':
        return `Furnizor: ${entity.name || 'Fără nume'}`;
      case 'USER':
        return `Utilizator: ${entity.first_name} ${entity.last_name}`;
      default:
        return rule.name;
    }
  }

  /**
   * Generează mesajul alertei
   */
  private generateAlertMessage(rule: AlertRule, entity: any): string {
    return rule.description;
  }

  /**
   * Trimite notificări pentru alertă
   */
  private async sendNotifications(rule: AlertRule, alertId: number, entity: any): Promise<void> {
    try {
      // Notificare în aplicație
      if (rule.notification_channels.includes('in_app')) {
        await this.sendInAppNotification(alertId, entity);
      }

      // Notificare email
      if (rule.notification_channels.includes('email')) {
        await this.sendEmailNotification(rule, entity);
      }

      // Notificare SMS (pentru viitor)
      if (rule.notification_channels.includes('sms')) {
        await this.sendSMSNotification(rule, entity);
      }

    } catch (error) {
      console.error('❌ Error sending notifications:', error);
    }
  }

  /**
   * Trimite notificare în aplicație
   */
  private async sendInAppNotification(alertId: number, entity: any): Promise<void> {
    try {
      // Obține alerta pentru a avea detaliile
      const [alertRows] = await pool.execute(
        'SELECT * FROM alerts WHERE id = ?',
        [alertId]
      );
      
      if ((alertRows as any[]).length === 0) return;
      
      const alert = (alertRows as any[])[0];
      const eventId = alert.entity_type === 'EVENT' ? alert.entity_id : null;
      const notificationPayload = JSON.stringify({
        alert_id: alertId,
        entity_type: alert.entity_type,
        entity_id: alert.entity_id,
        event_id: eventId,
      });

      // Creează notificarea în sistemul de notificări
      const [notificationResult] = await pool.execute(
        `INSERT INTO notifications (user_id, message, type, status, event_id, data, created_at) 
         VALUES (?, ?, 'alert', 'unread', ?, ?, NOW())`,
        [
          alert.user_id || 1,
          `🚨 ALERTĂ: ${alert.title} - ${alert.message}`,
          eventId,
          notificationPayload,
        ]
      );
      
      const notificationId = (notificationResult as any).insertId;
      console.log(`📱 Created in-app notification ${notificationId} for alert ${alertId}`);
      
              // Trimite notificarea prin WebSocket la toți utilizatorii conectați
        try {
          const { sendNotification, broadcastActivityLog } = require('../app');
          
          const notificationData = {
            type: 'notification',
            message: `🚨 ALERTĂ: ${alert.title} - ${alert.message}`,
            notificationId: notificationId,
            alertId: alertId,
            severity: alert.severity,
            entity_type: alert.entity_type
          };
          
          console.log(`📡 Broadcasting notification ${notificationId} via WebSocket to all connected users:`, notificationData);
          
          // Trimite la toți utilizatorii conectați (broadcast)
          broadcastActivityLog({
            id: notificationId,
            user_id: 1,
            action_type: 'NOTIFICATION_SENT',
            entity_type: 'NOTIFICATION',
            entity_id: notificationId,
            description: `Notificare nouă: ${alert.title}`,
            details: {
              notification_message: notificationData.message,
              alert_severity: alert.severity,
              alert_type: alert.entity_type
            },
            ip_address: '192.168.1.100',
            created_at: new Date().toISOString(),
            first_name: 'System',
            last_name: 'Alert',
            email: 'system@dspdolj.ro'
          });
          
          console.log(`✅ Broadcasted notification ${notificationId} via WebSocket to all users`);
        } catch (wsError) {
          console.error('❌ Error broadcasting notification via WebSocket:', wsError);
        }
    } catch (error) {
      console.error('❌ Error creating in-app notification:', error);
    }
  }

  /**
   * Trimite notificare email
   */
  private async sendEmailNotification(rule: AlertRule, entity: any): Promise<void> {
    // Aici vom integra cu EmailService
    console.log(`📧 Sending email notification for rule "${rule.name}"`);
  }

  /**
   * Trimite notificare SMS
   */
  private async sendSMSNotification(rule: AlertRule, entity: any): Promise<void> {
    // Pentru viitor - integrare cu serviciu SMS
    console.log(`📱 Sending SMS notification for rule "${rule.name}"`);
  }



  /**
   * Marchează o alertă ca fiind rezolvată
   */
  public async resolveAlert(alertId: number, userId: number): Promise<void> {
    await pool.execute(
      'UPDATE alerts SET status = "RESOLVED", resolved_at = NOW() WHERE id = ?',
      [alertId]
    );
    console.log(`✅ Alert ${alertId} resolved by user ${userId}`);
  }

  /**
   * Obține toate alertele active
   */
  public async getActiveAlerts(): Promise<Alert[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM alerts WHERE status = "ACTIVE" ORDER BY severity DESC, created_at DESC'
    );
    return rows as Alert[];
  }

  /**
   * Obține alertele pentru un utilizator specific
   */
  public async getUserAlerts(userId: number): Promise<Alert[]> {
    const [rows] = await pool.execute(
      `SELECT a.* FROM alerts a 
       LEFT JOIN alert_rules ar ON a.rule_id = ar.id 
       WHERE a.user_id = ? OR ar.notification_channels LIKE '%in_app%'
       ORDER BY a.severity DESC, a.created_at DESC`,
      [userId]
    );
    return rows as Alert[];
  }

  /**
   * Evaluează o regulă specifică pentru o entitate specifică
   */
  public async evaluateRuleById(ruleId: number, entityId: number): Promise<void> {
    try {
      const [ruleRows] = await pool.execute(
        'SELECT * FROM alert_rules WHERE id = ? AND is_active = 1',
        [ruleId]
      );
      
      if ((ruleRows as any[]).length === 0) {
        console.log(`❌ Rule ${ruleId} not found or inactive`);
        return;
      }
      
      const rule = (ruleRows as any[])[0];
      
      // Obține entitatea specifică
      const [entityRows] = await pool.execute(
        'SELECT * FROM vehicles WHERE id = ?',
        [entityId]
      );
      
      if ((entityRows as any[]).length === 0) {
        console.log(`❌ Entity ${entityId} not found`);
        return;
      }
      
      const entity = (entityRows as any[])[0];
      
      // Creează alerta
      await this.createAlert(rule, entity);
      
    } catch (error) {
      console.error(`❌ Error evaluating rule ${ruleId} for entity ${entityId}:`, error);
    }
  }
} 