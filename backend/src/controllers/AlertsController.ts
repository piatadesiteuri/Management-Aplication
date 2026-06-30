import { Request, Response } from 'express';
import pool from '../config/database';
import { RuleEngineService, AlertRule, Alert } from '../services/RuleEngineService';
import { ActivityLogService } from '../services/ActivityLogService';
import { AlertSchedulerService } from '../services/AlertSchedulerService';

export const AlertsController = {
  // ===== GESTIONARE REGULI =====
  
  /**
   * Obține toate regulile de alerte
   */
  getAlertRules: async (req: Request, res: Response) => {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM alert_rules ORDER BY severity DESC, created_at DESC'
      );
      
      res.json(rows);
    } catch (error) {
      console.error('Error getting alert rules:', error);
      res.status(500).json({ message: 'Eroare la obținerea regulilor de alerte' });
    }
  },

  /**
   * Creează o nouă regulă de alertă
   */
  createAlertRule: async (req: Request, res: Response) => {
    try {
      const { name, description, type, condition_sql, severity, notification_channels } = req.body;

      if (!name || !description || !type || !condition_sql || !severity || !notification_channels) {
        return res.status(400).json({ message: 'Toate câmpurile sunt obligatorii' });
      }

      const [result] = await pool.execute(
        `INSERT INTO alert_rules (
          name, description, type, condition_sql, severity, notification_channels
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [name, description, type, condition_sql, severity, JSON.stringify(notification_channels)]
      );

      const ruleId = (result as any).insertId;
      
      res.status(201).json({
        message: 'Regula de alertă a fost creată cu succes',
        ruleId
      });
    } catch (error) {
      console.error('Error creating alert rule:', error);
      res.status(500).json({ message: 'Eroare la crearea regulii de alertă' });
    }
  },

  /**
   * Actualizează o regulă de alertă
   */
  updateAlertRule: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, type, condition_sql, severity, notification_channels, is_active } = req.body;

      await pool.execute(
        `UPDATE alert_rules SET 
          name = ?, description = ?, type = ?, condition_sql = ?, 
          severity = ?, notification_channels = ?, is_active = ?
         WHERE id = ?`,
        [name, description, type, condition_sql, severity, JSON.stringify(notification_channels), is_active, id]
      );

      res.json({ message: 'Regula de alertă a fost actualizată cu succes' });
    } catch (error) {
      console.error('Error updating alert rule:', error);
      res.status(500).json({ message: 'Eroare la actualizarea regulii de alertă' });
    }
  },

  /**
   * Șterge o regulă de alertă
   */
  deleteAlertRule: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await pool.execute('DELETE FROM alert_rules WHERE id = ?', [id]);

      res.json({ message: 'Regula de alertă a fost ștearsă cu succes' });
    } catch (error) {
      console.error('Error deleting alert rule:', error);
      res.status(500).json({ message: 'Eroare la ștergerea regulii de alertă' });
    }
  },

  // ===== GESTIONARE ALERTE =====

  /**
   * Obține toate alertele active
   */
  getActiveAlerts: async (req: Request, res: Response) => {
    try {
      const ruleEngine = RuleEngineService.getInstance();
      const alerts = await ruleEngine.getActiveAlerts();
      
      res.json(alerts);
    } catch (error) {
      console.error('Error getting active alerts:', error);
      res.status(500).json({ message: 'Eroare la obținerea alertelor active' });
    }
  },

  /**
   * Obține toate alertele (active și rezolvate)
   */
  getAllAlerts: async (req: Request, res: Response) => {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM alerts ORDER BY severity DESC, created_at DESC'
      );
      
      res.json(rows);
    } catch (error) {
      console.error('Error getting all alerts:', error);
      res.status(500).json({ message: 'Eroare la obținerea tuturor alertelor' });
    }
  },

  /**
   * Obține alertele pentru utilizatorul curent
   */
  getUserAlerts: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Utilizator neautentificat' });
      }

      const ruleEngine = RuleEngineService.getInstance();
      const alerts = await ruleEngine.getUserAlerts(req.user.id);
      
      res.json(alerts);
    } catch (error) {
      console.error('Error getting user alerts:', error);
      res.status(500).json({ message: 'Eroare la obținerea alertelor utilizatorului' });
    }
  },



  /**
   * Marchează o alertă ca fiind rezolvată
   */
  resolveAlert: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Utilizator neautentificat' });
      }

      const { id } = req.params;
      const ruleEngine = RuleEngineService.getInstance();
      
      // Obține informațiile despre alertă înainte de rezolvare
      const [alertRows] = await pool.execute(
        'SELECT title, entity_type FROM alerts WHERE id = ?',
        [id]
      );
      
      const alert = (alertRows as any[])[0];
      if (!alert) {
        return res.status(404).json({ message: 'Alertă negăsită' });
      }
      
      await ruleEngine.resolveAlert(Number(id), req.user.id);
      
      // Log activitatea
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
      await ActivityLogService.logAlertResolved(
        req.user.id,
        Number(id),
        alert.title,
        ipAddress
      );
      
      res.json({ message: 'Alertă marcată ca rezolvată' });
    } catch (error) {
      console.error('Error resolving alert:', error);
      res.status(500).json({ message: 'Eroare la marcarea alertei ca rezolvată' });
    }
  },

  // ===== STATISTICI ALERTE =====

  /**
   * Obține statistici pentru alerte
   */
  getAlertStats: async (req: Request, res: Response) => {
    try {
      // Statistici generale
      const [totalAlerts] = await pool.execute(
        'SELECT COUNT(*) as total FROM alerts'
      );

      const [activeAlerts] = await pool.execute(
        'SELECT COUNT(*) as active FROM alerts WHERE status = "ACTIVE"'
      );

      const [severityStats] = await pool.execute(
        `SELECT severity, COUNT(*) as count 
         FROM alerts 
         WHERE status = "ACTIVE" 
         GROUP BY severity`
      );

      const [typeStats] = await pool.execute(
        `SELECT entity_type, COUNT(*) as count 
         FROM alerts 
         WHERE status = "ACTIVE" 
         GROUP BY entity_type`
      );

      // Alerte din ultimele 7 zile
      const [recentAlerts] = await pool.execute(
        `SELECT DATE(created_at) as date, COUNT(*) as count 
         FROM alerts 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
         GROUP BY DATE(created_at) 
         ORDER BY date`
      );

      res.json({
        total: (totalAlerts as any[])[0].total,
        active: (activeAlerts as any[])[0].active,
        severityStats,
        typeStats,
        recentAlerts
      });
    } catch (error) {
      console.error('Error getting alert stats:', error);
      res.status(500).json({ message: 'Eroare la obținerea statisticilor alertelor' });
    }
  },

  // ===== TESTARE REGULI =====

  /**
   * Testează o regulă specifică
   */
  testRule: async (req: Request, res: Response) => {
    try {
      const { ruleId } = req.params;

      // Obține regula
      const [rules] = await pool.execute(
        'SELECT * FROM alert_rules WHERE id = ?',
        [ruleId]
      );

      if ((rules as any[]).length === 0) {
        return res.status(404).json({ message: 'Regula nu a fost găsită' });
      }

      const rule = (rules as any[])[0];

      // Testează regula
      const [entities] = await pool.execute(rule.condition_sql);

      res.json({
        rule,
        entitiesFound: (entities as any[]).length,
        entities: entities
      });
    } catch (error) {
      console.error('Error testing rule:', error);
      res.status(500).json({ message: 'Eroare la testarea regulii' });
    }
  },

  // ===== PORNIRE/OPRIRE RULE ENGINE =====

  /**
   * Pornește Rule Engine
   */
  startRuleEngine: async (req: Request, res: Response) => {
    try {
      const ruleEngine = RuleEngineService.getInstance();
      ruleEngine.startRuleEngine();
      
      res.json({ message: 'Rule Engine pornit cu succes' });
    } catch (error) {
      console.error('Error starting rule engine:', error);
      res.status(500).json({ message: 'Eroare la pornirea Rule Engine' });
    }
  },

  /**
   * Oprește Rule Engine
   */
  stopRuleEngine: async (req: Request, res: Response) => {
    try {
      const ruleEngine = RuleEngineService.getInstance();
      ruleEngine.stopRuleEngine();
      
      res.json({ message: 'Rule Engine oprit cu succes' });
    } catch (error) {
      console.error('Error stopping rule engine:', error);
      res.status(500).json({ message: 'Eroare la oprirea Rule Engine' });
    }
  },

  /**
   * Declanșează manual evaluarea tuturor regulilor
   */
  triggerAllRules: async (req: Request, res: Response) => {
    try {
      console.log('🚀 Triggering all alert rules manually...');
      
      const ruleEngine = RuleEngineService.getInstance();
      
      // Obține toate regulile active
      const [rules] = await pool.execute(
        'SELECT * FROM alert_rules WHERE is_active = 1 ORDER BY severity DESC'
      );
      
      let alertsCreated = 0;
      
      // Evaluează fiecare regulă
      for (const rule of rules as any[]) {
        try {
          console.log(`🔍 Evaluating rule: ${rule.name}`);
          
          // Execută condiția SQL
          const [entities] = await pool.execute(rule.condition_sql);
          
          if ((entities as any[]).length > 0) {
            console.log(`⚠️ Rule "${rule.name}" triggered for ${(entities as any[]).length} entities`);
            
            // Creează alerte pentru fiecare entitate
            for (const entity of entities as any[]) {
              // Verifică dacă alerta există deja
              const [existingAlerts] = await pool.execute(
                'SELECT * FROM alerts WHERE rule_id = ? AND entity_id = ? AND status = "ACTIVE"',
                [rule.id, entity.id]
              );
              
              if ((existingAlerts as any[]).length === 0) {
                // Creează alerta
                const alertTitle = `Vehicul: ${entity.brand} ${entity.model}`;
                const alertMessage = rule.description;
                
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
                alertsCreated++;
                
                console.log(`✅ Created alert ${alertId} for rule "${rule.name}"`);
                
                // Log activitatea
                await ActivityLogService.logAlertCreated(
                  1, // System user
                  alertId,
                  alertTitle,
                  rule.type,
                  '192.168.1.100' // System IP
                );

                // Broadcast alerta prin WebSocket pentru real-time
                try {
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
              }
            }
          }
        } catch (ruleError) {
          console.error(`❌ Error evaluating rule "${rule.name}":`, ruleError);
        }
      }
      
      console.log(`🎉 Manual rule evaluation completed. Created ${alertsCreated} new alerts.`);
      
            res.json({ 
        message: 'Evaluarea regulilor completată cu succes',
        alertsCreated,
        rulesEvaluated: (rules as any[]).length
      });
    } catch (error) {
      console.error('Error triggering rules:', error);
      res.status(500).json({ message: 'Eroare la declanșarea regulilor' });
    }
  },

  /**
   * Creează o alertă de test pentru verificarea real-time
   */
  createTestAlert: async (req: Request, res: Response) => {
    try {
      console.log('🚨 Creating test alert for real-time verification...');
      
      const testAlertTitle = `Test Alertă Real-time - ${new Date().toLocaleString('ro-RO')}`;
      const testAlertMessage = 'Aceasta este o alertă de test pentru verificarea funcționalității real-time. ITP-ul vehiculului va expira în 30 de zile.';
      
      // Creează alerta
      const [result] = await pool.execute(
        `INSERT INTO alerts (
          rule_id, title, message, severity, status, entity_type, entity_id, 
          user_id, department_id, created_at
        ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, NOW())`,
        [
          4, // Rule ID pentru ITP
          testAlertTitle,
          testAlertMessage,
          'HIGH',
          'VEHICLE',
          1, // Vehicle ID pentru Dacia Logan
          null,
          null
        ]
      );
      
      const alertId = (result as any).insertId;
      console.log(`✅ Created test alert ${alertId}`);
      
      // Log activitatea
      await ActivityLogService.logAlertCreated(
        1, // System user
        alertId,
        testAlertTitle,
        'VEHICLE',
        '192.168.1.100' // System IP
      );

      // Creează notificarea în sistemul de notificări
      const [notificationResult] = await pool.execute(
        `INSERT INTO notifications (user_id, message, type, status, created_at) 
         VALUES (?, ?, 'alert', 'unread', NOW())`,
        [
          1, // Admin user
          `🚨 ALERTĂ: ${testAlertTitle} - ${testAlertMessage}`
        ]
      );
      
      const notificationId = (notificationResult as any).insertId;
      console.log(`📱 Created in-app notification ${notificationId} for test alert ${alertId}`);

      // Broadcast alerta prin WebSocket pentru real-time
      try {
        const { broadcastActivityLog } = require('../app');
        const { sendNotification } = require('../app');
        
        // Broadcast log de activitate
        broadcastActivityLog({
          id: alertId,
          user_id: 1,
          action_type: 'ALERT_CREATED',
          entity_type: 'ALERT',
          entity_id: alertId,
          description: `Alertă nouă: ${testAlertTitle}`,
          details: {
            alert_title: testAlertTitle,
            alert_severity: 'HIGH',
            alert_type: 'VEHICLE'
          },
          ip_address: '192.168.1.100',
          created_at: new Date().toISOString(),
          first_name: 'System',
          last_name: 'Alert',
          email: 'system@dspdolj.ro'
        });
        
        // Broadcast notificarea la toți utilizatorii conectați
        broadcastActivityLog({
          id: notificationId,
          user_id: 1,
          action_type: 'NOTIFICATION_SENT',
          entity_type: 'NOTIFICATION',
          entity_id: notificationId,
          description: `Notificare nouă: ${testAlertTitle}`,
          details: {
            notification_message: `🚨 ALERTĂ: ${testAlertTitle} - ${testAlertMessage}`,
            alert_severity: 'HIGH',
            alert_type: 'VEHICLE'
          },
          ip_address: '192.168.1.100',
          created_at: new Date().toISOString(),
          first_name: 'System',
          last_name: 'Alert',
          email: 'system@dspdolj.ro'
        });
        
        console.log(`📡 Broadcasted test alert ${alertId} and notification ${notificationId} via WebSocket`);
      } catch (wsError) {
        console.error('❌ Error broadcasting test alert:', wsError);
      }
      
      res.json({ 
        message: 'Alertă de test creată cu succes',
        alertId,
        title: testAlertTitle,
        realTimeBroadcasted: true
      });
    } catch (error) {
      console.error('Error creating test alert:', error);
      res.status(500).json({ message: 'Eroare la crearea alertei de test' });
    }
  },

  /**
   * Testează sistemul de scheduling inteligent
   */
  testScheduler: async (req: Request, res: Response) => {
    try {
      console.log('🧪 Testing Alert Scheduler...');
      
      const alertScheduler = AlertSchedulerService.getInstance();
      
      // Programează o alertă de test pentru peste 10 secunde
      const testTime = new Date(Date.now() + 10 * 1000); // 10 secunde de acum
      
      const alertId = await alertScheduler.addScheduledAlert({
        rule_id: 4, // ITP rule
        entity_id: 2, // Ford Transit (nu are alerte active)
        entity_type: 'VEHICLE',
        scheduled_time: testTime,
        alert_type: 'ITP_EXPIRY',
        days_before: 30
      });
      
      res.json({
        message: 'Alertă programată cu succes pentru test',
        alertId,
        scheduledTime: testTime.toISOString(),
        description: 'Această alertă va fi executată automat în 10 secunde'
      });
    } catch (error) {
      console.error('Error testing scheduler:', error);
      res.status(500).json({ message: 'Eroare la testarea scheduler-ului' });
    }
  },

  /**
   * Obține alertele programate
   */
  getScheduledAlerts: async (req: Request, res: Response) => {
    try {
      const [rows] = await pool.execute(`
        SELECT sa.*, ar.name as rule_name, ar.severity
        FROM scheduled_alerts sa
        JOIN alert_rules ar ON sa.rule_id = ar.id
        WHERE sa.status = 'PENDING'
        ORDER BY sa.scheduled_time ASC
      `);
      
      res.json(rows);
    } catch (error) {
      console.error('Error getting scheduled alerts:', error);
      res.status(500).json({ message: 'Eroare la obținerea alertelor programate' });
    }
  }
}; 