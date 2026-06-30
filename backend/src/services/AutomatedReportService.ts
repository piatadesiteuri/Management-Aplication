import pool from '../config/database';
import { ActivityLogService } from './ActivityLogService';

// Interfețe conform ISP (Interface Segregation Principle)
export interface IReportGenerator {
  generateReport(userId: number, parameters: any): Promise<GeneratedReport>;
}

export interface INotificationSender {
  sendNotification(userId: number, report: GeneratedReport): Promise<void>;
}

export interface IScheduler {
  scheduleReport(reportConfig: ReportSchedule): Promise<void>;
}

// Tipuri pentru rapoarte
export interface GeneratedReport {
  id: string;
  type: ReportType;
  userId: number;
  title: string;
  content: any;
  generatedAt: Date;
  parameters: any;
  status: 'GENERATED' | 'SENT' | 'FAILED';
  filePath?: string;
}

export type ReportType = 
  | 'DAILY_EVENTS_SUMMARY'
  | 'WEEKLY_DEPARTMENT_ACTIVITY'
  | 'MONTHLY_DSPD_PERFORMANCE'
  | 'VEHICLE_MAINTENANCE_ALERT'
  | 'LOW_STOCK_ALERT'
  | 'TASK_COMPLETION_SUMMARY'
  | 'USER_ACTIVITY_SUMMARY';

export interface ReportSchedule {
  id: string;
  type: ReportType;
  userId: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 pentru săptămânal
  dayOfMonth?: number; // 1-31 pentru lunar
  isActive: boolean;
  parameters?: any;
}

export interface UserContext {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  departments: number[];
  isAdmin: boolean;
  isManager: boolean;
}

export class AutomatedReportService implements IReportGenerator {
  private static instance: AutomatedReportService;

  private constructor() {}

  public static getInstance(): AutomatedReportService {
    if (!AutomatedReportService.instance) {
      AutomatedReportService.instance = new AutomatedReportService();
    }
    return AutomatedReportService.instance;
  }

  /**
   * Generează raportul în funcție de tip și contextul utilizatorului
   */
  async generateReport(userId: number, parameters: any): Promise<GeneratedReport> {
    try {
      console.log('📊 AutomatedReportService: Generating report for user:', userId, 'with parameters:', parameters);
      
      // Obține contextul utilizatorului
      const userContext = await this.getUserContext(userId);
      console.log('📊 User context:', userContext);
      if (!userContext) {
        throw new Error('User context not found');
      }

      const reportType = parameters.type as ReportType;
      const reportId = `report_${Date.now()}_${userId}`;
      
      let content: any;
      let title: string;

      // Generează conținutul în funcție de tipul raportului
      switch (reportType) {
        case 'DAILY_EVENTS_SUMMARY':
          content = await this.generateDailyEventsSummary(userContext, parameters);
          title = 'Raport Zilnic Evenimente DSPD';
          break;
          
        case 'WEEKLY_DEPARTMENT_ACTIVITY':
          content = await this.generateWeeklyDepartmentActivity(userContext, parameters);
          title = 'Raport Săptămânal Activitate Departament';
          break;
          
        case 'MONTHLY_DSPD_PERFORMANCE':
          content = await this.generateMonthlyDSPDPerformance(userContext, parameters);
          title = 'Raport Lunar Performanță DSPD';
          break;
          
        case 'VEHICLE_MAINTENANCE_ALERT':
          content = await this.generateVehicleMaintenanceAlert(userContext, parameters);
          title = 'Alertă Mentenanță Vehicule';
          break;
          
        case 'LOW_STOCK_ALERT':
          content = await this.generateLowStockAlert(userContext, parameters);
          title = 'Alertă Stoc Scăzut';
          break;
          
        case 'TASK_COMPLETION_SUMMARY':
          content = await this.generateTaskCompletionSummary(userContext, parameters);
          title = 'Sumar Completare Task-uri';
          break;
          
        case 'USER_ACTIVITY_SUMMARY':
          content = await this.generateUserActivitySummary(userContext, parameters);
          if (String(content?.scope || '').toUpperCase() === 'ALL_USERS') {
            title = 'Sumar Activitate Utilizatori';
          } else if (content?.user?.name) {
            title = `Sumar Activitate: ${content.user.name}`;
          } else {
            title = 'Sumar Activitate Personală';
          }
          break;
          
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      const report: GeneratedReport = {
        id: reportId,
        type: reportType,
        userId,
        title,
        content,
        generatedAt: new Date(),
        parameters,
        status: 'GENERATED'
      };

      // Salvează raportul în baza de date
      await this.saveReport(report);

      // Log activitatea
      await ActivityLogService.createLog({
        user_id: userId,
        action_type: 'AUTOMATED_REPORT_GENERATED',
        entity_type: 'SYSTEM',
        entity_id: null,
        description: `S-a generat raportul automat "${title}"`,
        details: {
          report_id: reportId,
          report_type: reportType,
          content_summary: this.getContentSummary(content)
        }
      });

      console.log('✅ AutomatedReportService: Report generated successfully:', reportId);
      return report;

    } catch (error) {
      console.error('❌ AutomatedReportService: Error generating report:', error);
      throw error;
    }
  }

  /**
   * Generează raport zilnic cu evenimentele pentru ziua următoare
   */
  private async generateDailyEventsSummary(userContext: UserContext, parameters: any) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    let query = `
      SELECT 
        ce.id,
        ce.title,
        ce.type,
        ce.start_time,
        ce.end_time,
        ce.location,
        ce.priority,
        ce.status,
        d.name as department_name,
        CONCAT(u.first_name, ' ', u.last_name) as created_by,
        v.registration_number as vehicle
      FROM calendar_events ce
      LEFT JOIN departments d ON ce.department_id = d.id
      LEFT JOIN users u ON ce.user_id = u.id
      LEFT JOIN vehicles v ON ce.vehicle_id = v.id
      WHERE DATE(ce.start_time) = ?
    `;

    const params: any[] = [tomorrowStr];

    // Filtrare în funcție de rolul utilizatorului
    if (!userContext.isAdmin) {
      if (userContext.isManager) {
        // Manager vede evenimentele din departamentele sale
        query += ' AND ce.department_id IN (?)';
        params.push(userContext.departments);
      } else {
        // Utilizator normal vede doar evenimentele la care participă
        query += ` AND ce.id IN (
          SELECT event_id FROM event_assignments WHERE user_id = ?
        )`;
        params.push(userContext.id);
      }
    }

    query += ' ORDER BY ce.start_time ASC';

    const [events] = await pool.execute(query, params);
    
    // Statistici
    const stats = {
      totalEvents: (events as any[]).length,
      byType: (events as any[]).reduce((acc: any, event: any) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {}),
      byPriority: (events as any[]).reduce((acc: any, event: any) => {
        acc[event.priority] = (acc[event.priority] || 0) + 1;
        return acc;
      }, {}),
      withVehicles: (events as any[]).filter((e: any) => e.vehicle).length
    };

    return {
      date: tomorrowStr,
      events: events,
      statistics: stats,
      userContext: {
        name: `${userContext.firstName} ${userContext.lastName}`,
        role: userContext.roles[0] || 'USER',
        department: userContext.departments.length > 0 ? 'Multiple' : 'N/A'
      }
    };
  }

  /**
   * Generează raport săptămânal pentru activitatea departamentului
   */
  private async generateWeeklyDepartmentActivity(userContext: UserContext, parameters: any) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    const startTs = `${startDateStr} 00:00:00`;
    const endTs = `${endDateStr} 23:59:59`;

    // Evenimente din ultima săptămână
    const [events] = await pool.execute(`
      SELECT 
        ce.id,
        ce.title,
        ce.type,
        ce.start_time,
        ce.end_time,
        ce.status,
        d.name as department_name
      FROM calendar_events ce
      LEFT JOIN departments d ON ce.department_id = d.id
      WHERE ce.start_time BETWEEN ? AND ?
      AND ce.department_id IN (?)
      ORDER BY ce.start_time DESC
    `, [startTs, endTs, userContext.departments]);

    // Task-uri din ultima săptămână
    const [tasks] = await pool.execute(`
      SELECT 
        t.id,
        t.title,
        t.status,
        t.priority,
        t.created_at,
        CONCAT(u.first_name, ' ', u.last_name) as assigned_to
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.created_at BETWEEN ? AND ?
      AND t.department_id IN (?)
      ORDER BY t.created_at DESC
    `, [startTs, endTs, userContext.departments]);

    // Statistici
    const eventStats = (events as any[]).reduce((acc: any, event: any) => {
      acc.total++;
      acc.byType[event.type] = (acc.byType[event.type] || 0) + 1;
      acc.byStatus[event.status] = (acc.byStatus[event.status] || 0) + 1;
      return acc;
    }, { total: 0, byType: {}, byStatus: {} });

    const taskStats = (tasks as any[]).reduce((acc: any, task: any) => {
      acc.total++;
      acc.byStatus[task.status] = (acc.byStatus[task.status] || 0) + 1;
      acc.byPriority[task.priority] = (acc.byPriority[task.priority] || 0) + 1;
      return acc;
    }, { total: 0, byStatus: {}, byPriority: {} });

    return {
      period: { startDate: startDateStr, endDate: endDateStr },
      events: events,
      tasks: tasks,
      eventStatistics: eventStats,
      taskStatistics: taskStats,
      department: userContext.departments.length > 0 ? 'Multiple Departments' : 'N/A'
    };
  }

  /**
   * Generează raport lunar pentru performanța DSPD
   */
  private async generateMonthlyDSPDPerformance(userContext: UserContext, parameters: any) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // KPI-uri pentru DSPD
    const [eventStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_events,
        COUNT(CASE WHEN type = 'INSPECTION' THEN 1 END) as inspections,
        COUNT(CASE WHEN type = 'EPIDEMIOLOGICAL_CONTROL' THEN 1 END) as epidemiological_controls
      FROM calendar_events 
      WHERE start_time BETWEEN ? AND ?
    `, [startDateStr, endDateStr]);

    const [taskStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_tasks,
        AVG(CASE WHEN status = 'COMPLETED' THEN actual_hours END) as avg_completion_time
      FROM tasks 
      WHERE created_at BETWEEN ? AND ?
    `, [startDateStr, endDateStr]);

    const [vehicleStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_vehicles,
        COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) as available_vehicles,
        COUNT(CASE WHEN status = 'MAINTENANCE' THEN 1 END) as maintenance_vehicles
      FROM vehicles
    `);

    return {
      period: { startDate: startDateStr, endDate: endDateStr },
      eventMetrics: (eventStats as any[])[0],
      taskMetrics: (taskStats as any[])[0],
      vehicleMetrics: (vehicleStats as any[])[0],
      performanceScore: this.calculatePerformanceScore((eventStats as any[])[0], (taskStats as any[])[0])
    };
  }

  /**
   * Generează alertă pentru vehicule care necesită mentenanță
   */
  private async generateVehicleMaintenanceAlert(userContext: UserContext, parameters: any) {
    const [vehicles] = await pool.execute(`
      SELECT 
        v.id,
        v.brand,
        v.model,
        v.registration_number,
        v.current_mileage,
        v.status,
        d.name as department_name,
        MAX(vm.date) as last_maintenance_date,
        MAX(vm.mileage) as last_maintenance_mileage
      FROM vehicles v
      LEFT JOIN departments d ON v.assigned_department_id = d.id
      LEFT JOIN vehicle_maintenance vm ON v.id = vm.vehicle_id
      WHERE v.status IN ('AVAILABLE', 'IN_USE')
      GROUP BY v.id, v.brand, v.model, v.registration_number, v.current_mileage, v.status, d.name
      HAVING 
        (v.current_mileage - COALESCE(MAX(vm.mileage), 0)) > 10000
        OR DATEDIFF(NOW(), COALESCE(MAX(vm.date), '2020-01-01')) > 90
    `);

    return {
      alertType: 'VEHICLE_MAINTENANCE',
      vehicles: vehicles,
      totalAlerts: (vehicles as any[]).length,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generează alertă pentru produse cu stoc scăzut
   */
  private async generateLowStockAlert(userContext: UserContext, parameters: any) {
    // NOTE: Stocul "adevărat" pentru modul Supply este în `inventory` (sumat pe produs).
    // Afișăm atât pragurile (min_stock / reorder_point / max_stock), cât și severitatea + recomandarea.
    const [products] = await pool.execute(`
      SELECT 
        p.id,
        p.name,
        p.code,
        p.unit,
        p.min_stock,
        p.max_stock,
        p.reorder_point,
        pc.name as category_name,
        COALESCE(SUM(i.quantity), 0) as current_stock_raw,
        GREATEST(COALESCE(SUM(i.quantity), 0), 0) as current_stock,
        CASE
          WHEN GREATEST(COALESCE(SUM(i.quantity), 0), 0) <= 0 THEN 'CRITICAL'
          WHEN GREATEST(COALESCE(SUM(i.quantity), 0), 0) <= COALESCE(p.min_stock, 0) THEN 'HIGH'
          WHEN GREATEST(COALESCE(SUM(i.quantity), 0), 0) <= COALESCE(p.reorder_point, 0) THEN 'MEDIUM'
          ELSE 'LOW'
        END as severity,
        GREATEST(COALESCE(p.min_stock, 0), COALESCE(p.reorder_point, 0), 0) as target_level,
        GREATEST(
          GREATEST(COALESCE(p.min_stock, 0), COALESCE(p.reorder_point, 0), 0) - GREATEST(COALESCE(SUM(i.quantity), 0), 0),
          0
        ) as suggested_order_qty,
        CASE
          WHEN COALESCE(SUM(i.quantity), 0) < 0 THEN 1
          ELSE 0
        END as negative_stock_flag
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_active = TRUE
      GROUP BY 
        p.id, p.name, p.code, p.unit,
        p.min_stock, p.max_stock, p.reorder_point,
        pc.name
      HAVING GREATEST(COALESCE(SUM(i.quantity), 0), 0) <= GREATEST(COALESCE(p.min_stock, 0), COALESCE(p.reorder_point, 0), 0)
      ORDER BY 
        FIELD(
          CASE
            WHEN GREATEST(COALESCE(SUM(i.quantity), 0), 0) <= 0 THEN 'CRITICAL'
            WHEN GREATEST(COALESCE(SUM(i.quantity), 0), 0) <= COALESCE(p.min_stock, 0) THEN 'HIGH'
            WHEN GREATEST(COALESCE(SUM(i.quantity), 0), 0) <= COALESCE(p.reorder_point, 0) THEN 'MEDIUM'
            ELSE 'LOW'
          END,
          'CRITICAL','HIGH','MEDIUM','LOW'
        ),
        current_stock ASC
    `);

    return {
      alertType: 'LOW_STOCK',
      products: products,
      totalAlerts: (products as any[]).length,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generează sumar pentru completarea task-urilor
   */
  private async generateTaskCompletionSummary(userContext: UserContext, parameters: any) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    const startTs = `${startDateStr} 00:00:00`;
    const endTs = `${endDateStr} 23:59:59`;

    let query = `
      SELECT 
        t.id,
        t.title,
        t.status,
        t.priority,
        t.created_at,
        t.completed_at,
        CONCAT(u.first_name, ' ', u.last_name) as assigned_to,
        d.name as department_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE t.created_at BETWEEN ? AND ?
    `;

    const params: any[] = [startTs, endTs];

    // Filtrare în funcție de rol
    if (!userContext.isAdmin) {
      if (userContext.isManager) {
        query += ' AND t.department_id IN (?)';
        params.push(userContext.departments);
      } else {
        query += ' AND t.assigned_to = ?';
        params.push(userContext.id);
      }
    }

    query += ' ORDER BY t.created_at DESC';

    const [tasks] = await pool.execute(query, params);

    const stats = (tasks as any[]).reduce((acc: any, task: any) => {
      acc.total++;
      acc.byStatus[task.status] = (acc.byStatus[task.status] || 0) + 1;
      acc.byPriority[task.priority] = (acc.byPriority[task.priority] || 0) + 1;
      if (task.status === 'COMPLETED') {
        acc.completed++;
        const created = new Date(task.created_at);
        const completed = new Date(task.completed_at);
        acc.avgCompletionTime += (completed.getTime() - created.getTime()) / (1000 * 60 * 60); // ore
      }
      return acc;
    }, { total: 0, completed: 0, byStatus: {}, byPriority: {}, avgCompletionTime: 0 });

    if (stats.completed > 0) {
      stats.avgCompletionTime = stats.avgCompletionTime / stats.completed;
    }

    return {
      period: { startDate: startDateStr, endDate: endDateStr },
      tasks: tasks,
      statistics: stats,
      completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
    };
  }

  /**
   * Generează sumar pentru activitatea personală
   */
  private async generateUserActivitySummary(userContext: UserContext, parameters: any) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    const startTs = `${startDateStr} 00:00:00`;
    const endTs = `${endDateStr} 23:59:59`;

    // Scop: implicit SELF (inclusiv pentru admin). Admin poate cere explicit ALL_USERS
    // sau poate cere un user specific prin targetUserId.
    const requestedScope = String(parameters?.scope || '').toUpperCase();
    const rawTargetUserId = parameters?.targetUserId ?? parameters?.target_user_id ?? parameters?.userId ?? parameters?.user_id;
    const parsedTargetUserId = rawTargetUserId !== undefined && rawTargetUserId !== null && String(rawTargetUserId).trim() !== ''
      ? Number(rawTargetUserId)
      : undefined;

    if (parsedTargetUserId !== undefined && (!Number.isFinite(parsedTargetUserId) || parsedTargetUserId <= 0)) {
      throw new Error('Invalid targetUserId');
    }

    const isAllUsers = userContext.isAdmin && requestedScope === 'ALL_USERS' && parsedTargetUserId === undefined;
    const effectiveUserId = parsedTargetUserId ?? userContext.id;

    // security: only admin can generate for another user / all users
    if ((effectiveUserId !== userContext.id || isAllUsers) && !userContext.isAdmin) {
      throw new Error('Not allowed to generate activity report for other users');
    }

    let events: any[] = [];
    let tasks: any[] = [];
    let activities: any[] = [];
    const targetContext = isAllUsers ? null : await this.getUserContext(effectiveUserId);

    if (!isAllUsers && !targetContext) {
      throw new Error('Target user context not found');
    }

    if (isAllUsers) {
      const [rows] = await pool.execute(`
        SELECT
          al.id,
          al.user_id,
          CONCAT(u.first_name, ' ', u.last_name) as user_name,
          u.email as user_email,
          al.action_type,
          al.entity_type,
          al.entity_id,
          ce.title as event_title,
          t.title as task_title,
          ed.title as document_title,
          al.description,
          al.created_at
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        LEFT JOIN calendar_events ce ON al.entity_type = 'EVENT' AND al.entity_id = ce.id
        LEFT JOIN tasks t ON al.entity_type = 'TASK' AND al.entity_id = t.id
        LEFT JOIN event_documents ed ON al.entity_type = 'DOCUMENT' AND al.entity_id = ed.id
        WHERE al.created_at BETWEEN ? AND ?
        ORDER BY al.created_at DESC
        LIMIT 500
      `, [startTs, endTs]);
      activities = rows as any[];
    } else {
      // Evenimente la care a participat (target user)
      const [ev] = await pool.execute(`
        SELECT 
          ce.id,
          ce.title,
          ce.type,
          ce.start_time,
          ce.end_time,
          ce.status,
          ea.role
        FROM calendar_events ce
        INNER JOIN event_assignments ea ON ce.id = ea.event_id
        WHERE ea.user_id = ? AND ce.start_time BETWEEN ? AND ?
        ORDER BY ce.start_time DESC
      `, [effectiveUserId, startTs, endTs]);
      events = ev as any[];

      // Task-uri asignate (target user)
      const [tk] = await pool.execute(`
        SELECT 
          t.id,
          t.title,
          t.status,
          t.priority,
          t.created_at,
          t.completed_at
        FROM tasks t
        WHERE t.assigned_to = ? AND t.created_at BETWEEN ? AND ?
        ORDER BY t.created_at DESC
      `, [effectiveUserId, startTs, endTs]);
      tasks = tk as any[];

      // Activitate din loguri (target user)
      const [act] = await pool.execute(`
        SELECT 
          al.id,
          al.action_type,
          al.entity_type,
          al.entity_id,
          ce.title as event_title,
          t.title as task_title,
          ed.title as document_title,
          al.description,
          al.created_at
        FROM activity_logs al
        LEFT JOIN calendar_events ce ON al.entity_type = 'EVENT' AND al.entity_id = ce.id
        LEFT JOIN tasks t ON al.entity_type = 'TASK' AND al.entity_id = t.id
        LEFT JOIN event_documents ed ON al.entity_type = 'DOCUMENT' AND al.entity_id = ed.id
        WHERE al.user_id = ? AND al.created_at BETWEEN ? AND ?
        ORDER BY al.created_at DESC
        LIMIT 300
      `, [effectiveUserId, startTs, endTs]);
      activities = act as any[];
    }

    const stats = {
      events: {
        total: (events as any[]).length,
        byType: (events as any[]).reduce((acc: any, event: any) => {
          acc[event.type] = (acc[event.type] || 0) + 1;
          return acc;
        }, {}),
        byRole: (events as any[]).reduce((acc: any, event: any) => {
          acc[event.role] = (acc[event.role] || 0) + 1;
          return acc;
        }, {})
      },
      tasks: {
        total: (tasks as any[]).length,
        completed: (tasks as any[]).filter((t: any) => t.status === 'COMPLETED').length,
        byPriority: (tasks as any[]).reduce((acc: any, task: any) => {
          acc[task.priority] = (acc[task.priority] || 0) + 1;
          return acc;
        }, {})
      },
      activities: {
        total: (activities as any[]).length,
        byType: (activities as any[]).reduce((acc: any, activity: any) => {
          acc[activity.action_type] = (acc[activity.action_type] || 0) + 1;
          return acc;
        }, {})
      }
    };

    return {
      period: { startDate: startDateStr, endDate: endDateStr },
      scope: isAllUsers ? 'ALL_USERS' : (effectiveUserId === userContext.id ? 'SELF' : 'TARGET_USER'),
      user: {
        name: isAllUsers ? 'Toți utilizatorii' : `${targetContext!.firstName} ${targetContext!.lastName}`.trim(),
        email: isAllUsers ? '' : (targetContext!.email || ''),
        roles: isAllUsers ? [] : (targetContext!.roles || [])
      },
      events: events,
      tasks: tasks,
      activities: activities,
      statistics: stats
    };
  }

  /**
   * Obține contextul utilizatorului (roluri, departamente, etc.)
   */
  private async getUserContext(userId: number): Promise<UserContext | null> {
    try {
      console.log('🔍 Getting user context for userId:', userId);
      const [users] = await pool.execute(`
        SELECT 
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.is_active
        FROM users u
        WHERE u.id = ? AND u.is_active = TRUE
      `, [userId]);
      
      console.log('🔍 Users found:', users);

      if ((users as any[]).length === 0) {
        return null;
      }

      const user = (users as any[])[0];

      // Obține rolurile
      const [roles] = await pool.execute(`
        SELECT r.name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ?
      `, [userId]);
      
      console.log('🔍 Roles found:', roles);

      // Obține departamentele
      const [departments] = await pool.execute(`
        SELECT department_id
        FROM department_users
        WHERE user_id = ?
      `, [userId]);
      
      console.log('🔍 Departments found:', departments);

      const roleNames = (roles as any[]).map((r: any) => r.name);
      const departmentIds = (departments as any[]).map((d: any) => d.department_id);

      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles: roleNames,
        departments: departmentIds,
        isAdmin: roleNames.includes('ADMIN') || roleNames.includes('SUPER_ADMIN'),
        isManager: roleNames.includes('MANAGER') || roleNames.includes('DEPARTMENT_ADMIN')
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return null;
    }
  }

  /**
   * Salvează raportul în baza de date
   */
  private async saveReport(report: GeneratedReport): Promise<void> {
    try {
      // Mapează statusul la valorile din baza de date
      let dbStatus = 'PENDING';
      if (report.status === 'GENERATED') dbStatus = 'COMPLETED';
      else if (report.status === 'FAILED') dbStatus = 'FAILED';
      
      await pool.execute(`
        INSERT INTO user_reports (
          user_id, template_id, name, data, parameters, 
          export_format, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        report.userId,
        report.type,
        report.title,
        JSON.stringify(report.content),
        JSON.stringify(report.parameters),
        'AUTOMATED',
        dbStatus
      ]);
    } catch (error) {
      console.error('Error saving report:', error);
      throw error;
    }
  }

  /**
   * Calculează scorul de performanță
   */
  private calculatePerformanceScore(eventMetrics: any, taskMetrics: any): number {
    const eventCompletionRate = eventMetrics.total_events > 0 ? 
      (eventMetrics.completed_events / eventMetrics.total_events) * 100 : 0;
    
    const taskCompletionRate = taskMetrics.total_tasks > 0 ? 
      (taskMetrics.completed_tasks / taskMetrics.total_tasks) * 100 : 0;

    return Math.round((eventCompletionRate + taskCompletionRate) / 2);
  }

  /**
   * Obține un sumar al conținutului pentru logging
   */
  private getContentSummary(content: any): string {
    if (content.events) {
      return `${content.events.length} evenimente`;
    }
    if (content.tasks) {
      return `${content.tasks.length} task-uri`;
    }
    if (content.vehicles) {
      return `${content.vehicles.length} vehicule`;
    }
    if (content.products) {
      return `${content.products.length} produse`;
    }
    return 'Raport generat';
  }
} 