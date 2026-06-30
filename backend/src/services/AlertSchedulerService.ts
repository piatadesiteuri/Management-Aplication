import pool from '../config/database';
import { RuleEngineService } from './RuleEngineService';

export interface ScheduledAlert {
  id: number;
  rule_id: number;
  entity_id: number;
  entity_type: string;
  scheduled_time: Date;
  alert_type: 'ITP_EXPIRY' | 'RCA_EXPIRY' | 'EVENT_REMINDER' | 'DOCUMENT_EXPIRY';
  days_before: number;
  status: 'PENDING' | 'SENT' | 'CANCELLED';
  created_at: Date;
}

export class AlertSchedulerService {
  private static instance: AlertSchedulerService;
  private scheduledJobs: Map<number, NodeJS.Timeout> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): AlertSchedulerService {
    if (!AlertSchedulerService.instance) {
      AlertSchedulerService.instance = new AlertSchedulerService();
    }
    return AlertSchedulerService.instance;
  }

  /**
   * Pornește serviciul de scheduling
   */
  public async startScheduler(): Promise<void> {
    console.log('🚀 Starting Alert Scheduler...');
    
    // Creează tabelul pentru scheduled alerts dacă nu există
    await this.createScheduledAlertsTable();
    
    // Programează alertele existente
    await this.scheduleExistingAlerts();
    
    // Verifică la fiecare oră pentru alerte noi
    this.checkInterval = setInterval(() => {
      this.checkForNewAlerts();
    }, 60 * 60 * 1000); // 1 oră
    
    console.log('✅ Alert Scheduler started');
  }

  /**
   * Oprește serviciul de scheduling
   */
  public stopScheduler(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    // Oprește toate job-urile programate
    this.scheduledJobs.forEach(timeout => clearTimeout(timeout));
    this.scheduledJobs.clear();
    
    console.log('🛑 Alert Scheduler stopped');
  }

  /**
   * Creează tabelul pentru scheduled alerts
   */
  private async createScheduledAlertsTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS scheduled_alerts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        rule_id INT NOT NULL,
        entity_id INT NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        scheduled_time DATETIME NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        days_before INT NOT NULL,
        status ENUM('PENDING', 'SENT', 'CANCELLED') DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_scheduled_time (scheduled_time),
        INDEX idx_status (status),
        INDEX idx_entity (entity_type, entity_id),
        FOREIGN KEY (rule_id) REFERENCES alert_rules(id) ON DELETE CASCADE
      )
    `;
    
    await pool.execute(createTableSQL);
  }

  /**
   * Programează alertele existente din baza de date
   */
  private async scheduleExistingAlerts(): Promise<void> {
    try {
      console.log('📅 Scheduling existing alerts...');
      
      // Programează alerte pentru ITP/RCA
      await this.scheduleDocumentAlerts();
      
      // Programează alerte pentru evenimente
      await this.scheduleEventAlerts();
      
      // Programează alertele din tabelul scheduled_alerts
      await this.schedulePendingAlerts();
      
      console.log('✅ Existing alerts scheduled');
    } catch (error) {
      console.error('❌ Error scheduling existing alerts:', error);
    }
  }

  /**
   * Programează alerte pentru documente (ITP, RCA)
   */
  private async scheduleDocumentAlerts(): Promise<void> {
    const documentTypes = [
      { type: 'ITP', daysBefore: [30, 7, 1] },
      { type: 'RCA', daysBefore: [30, 7, 1] }
    ];

    for (const docType of documentTypes) {
      for (const daysBefore of docType.daysBefore) {
        const [documents] = await pool.execute(`
          SELECT vd.*, v.brand, v.model 
          FROM vehicle_documents vd
          JOIN vehicles v ON vd.vehicle_id = v.id
          WHERE vd.type = ? 
          AND vd.expiry_date BETWEEN 
            DATE_ADD(NOW(), INTERVAL ? DAY) 
            AND DATE_ADD(NOW(), INTERVAL ? DAY)
          AND vd.expiry_date > NOW()
        `, [docType.type, daysBefore, daysBefore]);

        for (const doc of documents as any[]) {
          await this.scheduleAlert({
            rule_id: docType.type === 'ITP' ? 4 : 5,
            entity_id: doc.vehicle_id,
            entity_type: 'VEHICLE',
            scheduled_time: new Date(doc.expiry_date.getTime() - (daysBefore * 24 * 60 * 60 * 1000)),
            alert_type: docType.type === 'ITP' ? 'ITP_EXPIRY' : 'RCA_EXPIRY',
            days_before: daysBefore
          });
        }
      }
    }
  }

  /**
   * Programează alerte pentru evenimente
   */
  private async scheduleEventAlerts(): Promise<void> {
    const [events] = await pool.execute(`
      SELECT ce.* 
      FROM calendar_events ce
      WHERE ce.start_time > NOW()
      AND ce.status = 'PENDING'
    `);

    for (const event of events as any[]) {
      // Alertă la 24h înainte
      const alert24h = new Date(event.start_time.getTime() - (24 * 60 * 60 * 1000));
      if (alert24h > new Date()) {
        await this.scheduleAlert({
          rule_id: 1,
          entity_id: event.id,
          entity_type: 'EVENT',
          scheduled_time: alert24h,
          alert_type: 'EVENT_REMINDER',
          days_before: 1
        });
      }
    }
  }

  /**
   * Programează o alertă specifică
   */
  private async scheduleAlert(alert: Omit<ScheduledAlert, 'id' | 'status' | 'created_at'>): Promise<void> {
    try {
      // Verifică dacă alerta există deja
      const [existing] = await pool.execute(`
        SELECT id FROM scheduled_alerts 
        WHERE rule_id = ? AND entity_id = ? AND entity_type = ? 
        AND alert_type = ? AND days_before = ? AND status = 'PENDING'
      `, [alert.rule_id, alert.entity_id, alert.entity_type, alert.alert_type, alert.days_before]);

      if ((existing as any[]).length > 0) {
        return; // Alerta există deja
      }

      // Inserează alerta programată
      const [result] = await pool.execute(`
        INSERT INTO scheduled_alerts 
        (rule_id, entity_id, entity_type, scheduled_time, alert_type, days_before)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [alert.rule_id, alert.entity_id, alert.entity_type, alert.scheduled_time, alert.alert_type, alert.days_before]);

      const alertId = (result as any).insertId;
      
      // Calculează delay-ul în milisecunde
      const delay = alert.scheduled_time.getTime() - Date.now();
      
      if (delay > 0) {
        // Programează job-ul
        const timeout = setTimeout(() => {
          this.executeScheduledAlert(alertId);
        }, delay);
        
        this.scheduledJobs.set(alertId, timeout);
        
        console.log(`📅 Scheduled alert ${alertId} for ${alert.entity_type} ${alert.entity_id} at ${alert.scheduled_time.toISOString()}`);
      } else {
        // Execută imediat dacă timpul a trecut
        this.executeScheduledAlert(alertId);
      }
    } catch (error) {
      console.error('❌ Error scheduling alert:', error);
    }
  }

  /**
   * Execută o alertă programată
   */
  private async executeScheduledAlert(alertId: number): Promise<void> {
    try {
      const [alerts] = await pool.execute(`
        SELECT * FROM scheduled_alerts WHERE id = ? AND status = 'PENDING'
      `, [alertId]);

      if ((alerts as any[]).length === 0) return;

      const alert = (alerts as any[])[0];
      
      // Marchează ca trimisă
      await pool.execute(`
        UPDATE scheduled_alerts SET status = 'SENT' WHERE id = ?
      `, [alertId]);

      // Execută regula de alertă
      const ruleEngine = RuleEngineService.getInstance();
      await ruleEngine.evaluateRuleById(alert.rule_id, alert.entity_id);
      
      console.log(`✅ Executed scheduled alert ${alertId}`);
    } catch (error) {
      console.error('❌ Error executing scheduled alert:', error);
    }
  }

  /**
   * Programează alertele din tabelul scheduled_alerts
   */
  private async schedulePendingAlerts(): Promise<void> {
    const [alerts] = await pool.execute(`
      SELECT * FROM scheduled_alerts 
      WHERE status = 'PENDING' AND scheduled_time > NOW()
    `);

    for (const alert of alerts as any[]) {
      const delay = new Date(alert.scheduled_time).getTime() - Date.now();
      
      if (delay > 0) {
        const timeout = setTimeout(() => {
          this.executeScheduledAlert(alert.id);
        }, delay);
        
        this.scheduledJobs.set(alert.id, timeout);
      }
    }
  }

  /**
   * Verifică pentru alerte noi (la fiecare oră)
   */
  private async checkForNewAlerts(): Promise<void> {
    try {
      console.log('🔍 Checking for new alerts to schedule...');
      
      // Verifică documente noi
      await this.scheduleDocumentAlerts();
      
      // Verifică evenimente noi
      await this.scheduleEventAlerts();
      
    } catch (error) {
      console.error('❌ Error checking for new alerts:', error);
    }
  }

  /**
   * Adaugă o alertă programată manual
   */
  public async addScheduledAlert(alert: Omit<ScheduledAlert, 'id' | 'status' | 'created_at'>): Promise<number> {
    const [result] = await pool.execute(`
      INSERT INTO scheduled_alerts 
      (rule_id, entity_id, entity_type, scheduled_time, alert_type, days_before)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [alert.rule_id, alert.entity_id, alert.entity_type, alert.scheduled_time, alert.alert_type, alert.days_before]);

    const alertId = (result as any).insertId;
    
    // Programează job-ul
    const delay = alert.scheduled_time.getTime() - Date.now();
    if (delay > 0) {
      const timeout = setTimeout(() => {
        this.executeScheduledAlert(alertId);
      }, delay);
      
      this.scheduledJobs.set(alertId, timeout);
    }

    return alertId;
  }

  /**
   * Anulează o alertă programată
   */
  public async cancelScheduledAlert(alertId: number): Promise<void> {
    await pool.execute(`
      UPDATE scheduled_alerts SET status = 'CANCELLED' WHERE id = ?
    `, [alertId]);

    // Oprește job-ul dacă există
    const timeout = this.scheduledJobs.get(alertId);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduledJobs.delete(alertId);
    }
  }

  /**
   * Obține alertele programate pentru un utilizator
   */
  public async getScheduledAlertsForUser(userId: number): Promise<ScheduledAlert[]> {
    const [rows] = await pool.execute(`
      SELECT sa.* FROM scheduled_alerts sa
      JOIN alert_rules ar ON sa.rule_id = ar.id
      WHERE sa.status = 'PENDING'
      AND sa.scheduled_time > NOW()
      ORDER BY sa.scheduled_time ASC
    `);
    
    return rows as ScheduledAlert[];
  }
} 