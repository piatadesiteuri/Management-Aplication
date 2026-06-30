import pool from '../config/database';
import { GeneratedReport } from './AutomatedReportService';

export class ReportNotificationService {
  private static instance: ReportNotificationService;

  private constructor() {}

  public static getInstance(): ReportNotificationService {
    if (!ReportNotificationService.instance) {
      ReportNotificationService.instance = new ReportNotificationService();
    }
    return ReportNotificationService.instance;
  }

  /**
   * Trimite notificare pentru raportul generat
   */
  async sendNotification(userId: number, report: GeneratedReport): Promise<void> {
    try {
      console.log('🔔 ReportNotificationService: Sending notification for report:', report.id);
      
      // 1. Salvează notificarea în baza de date
      await this.saveNotification(userId, report);
      
      // 2. Trimite notificare prin WebSocket
      await this.sendWebSocketNotification(userId, report);
      
      // 3. Actualizează statusul raportului
      await this.updateReportStatus(report.id, 'SENT');
      
      console.log('✅ ReportNotificationService: Notification sent successfully');
      
    } catch (error) {
      console.error('❌ ReportNotificationService: Error sending notification:', error);
      await this.updateReportStatus(report.id, 'FAILED');
      throw error;
    }
  }

  /**
   * Salvează notificarea în baza de date
   */
  private async saveNotification(userId: number, report: GeneratedReport): Promise<void> {
    try {
      const notificationData = {
        type: 'AUTOMATED_REPORT',
        title: `Raport automat: ${report.title}`,
        message: this.generateNotificationMessage(report),
        data: {
          reportId: report.id,
          reportType: report.type,
          generatedAt: report.generatedAt,
          action: 'VIEW_REPORT'
        }
      };

      await pool.execute(`
        INSERT INTO notifications (
          user_id, type, title, message, data, is_read, created_at
        ) VALUES (?, ?, ?, ?, ?, FALSE, NOW())
      `, [
        userId,
        notificationData.type,
        notificationData.title,
        notificationData.message,
        JSON.stringify(notificationData.data)
      ]);

    } catch (error) {
      console.error('Error saving notification:', error);
      throw error;
    }
  }

  /**
   * Trimite notificare prin WebSocket
   */
  private async sendWebSocketNotification(userId: number, report: GeneratedReport): Promise<void> {
    try {
      // Importă funcția de sendNotification din app.ts
      const { sendNotification } = require('../app');
      
      const notificationPayload = {
        id: `notification_${Date.now()}`,
        type: 'AUTOMATED_REPORT',
        title: `Raport automat: ${report.title}`,
        message: this.generateNotificationMessage(report),
        data: {
          reportId: report.id,
          reportType: report.type,
          generatedAt: report.generatedAt,
          action: 'VIEW_REPORT'
        },
        createdAt: new Date().toISOString(),
        isRead: false
      };

      // Trimite notificarea la utilizatorul specific
      sendNotification(userId, {
        type: 'notification',
        data: notificationPayload
      });

    } catch (error) {
      console.error('Error sending WebSocket notification:', error);
      // Nu aruncăm eroarea pentru că notificarea prin WebSocket nu este critică
    }
  }

  /**
   * Actualizează statusul raportului
   */
  private async updateReportStatus(reportId: string, status: 'SENT' | 'FAILED'): Promise<void> {
    try {
      await pool.execute(`
        UPDATE user_reports 
        SET status = ?, updated_at = NOW()
        WHERE template_id = ?
      `, [status, reportId]);
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  }

  /**
   * Generează mesajul pentru notificare
   */
  private generateNotificationMessage(report: GeneratedReport): string {
    const content = report.content;
    
    switch (report.type) {
      case 'DAILY_EVENTS_SUMMARY':
        return `Raportul zilnic pentru ${content.date} conține ${content.statistics.totalEvents} evenimente programate.`;
        
      case 'WEEKLY_DEPARTMENT_ACTIVITY':
        return `Raportul săptămânal conține ${content.eventStatistics.total} evenimente și ${content.taskStatistics.total} task-uri.`;
        
      case 'MONTHLY_DSPD_PERFORMANCE':
        return `Raportul lunar DSPD: ${content.performanceScore}% performanță, ${content.eventMetrics.total_events} evenimente.`;
        
      case 'VEHICLE_MAINTENANCE_ALERT':
        return `Mentenanță vehicule: ${content.totalAlerts} vehicule necesită atenție.`;
        
      case 'LOW_STOCK_ALERT':
        return `Stoc scăzut: ${content.totalAlerts} produse sunt sub prag.`;
        
      case 'TASK_COMPLETION_SUMMARY':
        return `Sumar task-uri: ${content.statistics.completed}/${content.statistics.total} completate (${content.completionRate.toFixed(1)}%).`;
        
      case 'USER_ACTIVITY_SUMMARY':
        return `Activitatea ta: ${content.statistics.events.total} evenimente, ${content.statistics.tasks.total} task-uri în ultima lună.`;
        
      default:
        return `Raportul "${report.title}" a fost generat cu succes.`;
    }
  }

  /**
   * Trimite notificare de alertă pentru vehicule
   */
  async sendVehicleMaintenanceAlert(vehicles: any[]): Promise<void> {
    try {
      if (vehicles.length === 0) return;

      // Găsește utilizatorii care trebuie să primească alerta
      const [users] = await pool.execute(`
        SELECT DISTINCT u.id, u.email, u.first_name, u.last_name
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name IN ('ADMIN', 'MANAGER', 'DEPARTMENT_ADMIN')
        AND u.is_active = TRUE
      `);

      const alertMessage = `Alertă mentenanță vehicule: ${vehicles.length} vehicule necesită atenție.`;

      for (const user of users as any[]) {
        await this.saveNotification(user.id, {
          id: `alert_${Date.now()}`,
          type: 'VEHICLE_MAINTENANCE_ALERT' as any,
          userId: user.id,
          title: 'Mentenanță vehicule',
          content: { vehicles, totalAlerts: vehicles.length },
          generatedAt: new Date(),
          parameters: {},
          status: 'GENERATED'
        });

        // Trimite și prin WebSocket
        await this.sendWebSocketNotification(user.id, {
          id: `alert_${Date.now()}`,
          type: 'VEHICLE_MAINTENANCE_ALERT' as any,
          userId: user.id,
          title: 'Mentenanță vehicule',
          content: { vehicles, totalAlerts: vehicles.length },
          generatedAt: new Date(),
          parameters: {},
          status: 'GENERATED'
        });
      }

    } catch (error) {
      console.error('Error sending vehicle maintenance alert:', error);
    }
  }

  /**
   * Trimite notificare de alertă pentru stoc scăzut
   */
  async sendLowStockAlert(products: any[]): Promise<void> {
    try {
      if (products.length === 0) return;

      // Găsește utilizatorii responsabili pentru stocuri
      const [users] = await pool.execute(`
        SELECT DISTINCT u.id, u.email, u.first_name, u.last_name
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name IN ('ADMIN', 'MANAGER', 'OPERATOR')
        AND u.is_active = TRUE
      `);

      const alertMessage = `Alertă stoc scăzut: ${products.length} produse necesită reîncărcare.`;

      for (const user of users as any[]) {
        await this.saveNotification(user.id, {
          id: `alert_${Date.now()}`,
          type: 'LOW_STOCK_ALERT' as any,
          userId: user.id,
          title: 'Stoc scăzut',
          content: { products, totalAlerts: products.length },
          generatedAt: new Date(),
          parameters: {},
          status: 'GENERATED'
        });

        // Trimite și prin WebSocket
        await this.sendWebSocketNotification(user.id, {
          id: `alert_${Date.now()}`,
          type: 'LOW_STOCK_ALERT' as any,
          userId: user.id,
          title: 'Stoc scăzut',
          content: { products, totalAlerts: products.length },
          generatedAt: new Date(),
          parameters: {},
          status: 'GENERATED'
        });
      }

    } catch (error) {
      console.error('Error sending low stock alert:', error);
    }
  }

  /**
   * Marchează notificarea ca citită
   */
  async markNotificationAsRead(notificationId: number, userId: number): Promise<void> {
    try {
      await pool.execute(`
        UPDATE notifications 
        SET is_read = TRUE, updated_at = NOW()
        WHERE id = ? AND user_id = ?
      `, [notificationId, userId]);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Obține notificările pentru un utilizator
   */
  async getUserNotifications(userId: number, limit: number = 50): Promise<any[]> {
    try {
      const [notifications] = await pool.execute(`
        SELECT 
          id, type, title, message, data, is_read, created_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `, [userId, limit]);

      return (notifications as any[]).map(notification => ({
        ...notification,
        data: JSON.parse(notification.data || '{}')
      }));
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  /**
   * Șterge notificările vechi (mai vechi de 30 zile)
   */
  async cleanupOldNotifications(): Promise<void> {
    try {
      await pool.execute(`
        DELETE FROM notifications 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND is_read = TRUE
      `);
      
      console.log('🧹 Cleaned up old notifications');
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }
} 