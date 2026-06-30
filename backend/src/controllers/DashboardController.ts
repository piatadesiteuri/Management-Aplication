import { Request, Response } from 'express';
import pool from '../config/database';

export const DashboardController = {
  /**
   * Obține statisticile pentru dashboard
   */
  getDashboardStats: async (req: Request, res: Response) => {
    try {
      // Utilizatori activi
      let activeUsersTotal = 0;
      let activeUsersPercentage = '0.00';
      try {
        const [activeUsersResult] = await pool.execute(`
          SELECT 
            COUNT(*) as total_active,
            COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as new_last_month
          FROM users 
          WHERE is_active = 1
        `);
        const activeUsers = (activeUsersResult as any[])[0];
        activeUsersTotal = activeUsers?.total_active || 0;
        const activeUsersLastMonth = activeUsers?.new_last_month || 0;
        activeUsersPercentage = activeUsersLastMonth > 0 
          ? ((activeUsersTotal - activeUsersLastMonth) / activeUsersLastMonth * 100).toFixed(2)
          : '0.00';
      } catch (error) {
        console.warn('Could not load active users:', error);
      }

      // Documente procesate (din registry_entries și event_documents)
      let documentsTotal = 0;
      let documentsPercentage = '0.00';
      try {
        const [documentsResult] = await pool.execute(`
          SELECT 
            COUNT(*) as total_documents,
            COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as new_last_month
          FROM (
            SELECT created_at FROM registry_entries
            UNION ALL
            SELECT created_at FROM event_documents WHERE is_active = 1
          ) as all_docs
        `);
        const documents = (documentsResult as any[])[0];
        documentsTotal = documents?.total_documents || 0;
        const documentsLastMonth = documents?.new_last_month || 0;
        documentsPercentage = documentsLastMonth > 0
          ? ((documentsTotal - documentsLastMonth) / documentsLastMonth * 100).toFixed(2)
          : '0.00';
      } catch (error) {
        console.warn('Could not load documents:', error);
      }

      // Cereri în așteptare (din approval_requests, material_requests, workflow_instances)
      let requestsTotal = 0;
      let requestsPercentage = '0.00';
      try {
        const [requestsResult] = await pool.execute(`
          SELECT 
            COUNT(*) as total_pending
          FROM (
            SELECT id FROM approval_requests WHERE status = 'PENDING'
            UNION ALL
            SELECT id FROM material_requests WHERE status = 'PENDING'
            UNION ALL
            SELECT id FROM workflow_instances WHERE status = 'ACTIVE' OR status = 'WAITING_SIGNATURE'
          ) as all_pending
        `);
        const requests = (requestsResult as any[])[0];
        requestsTotal = requests?.total_pending || 0;

        // Calculăm cereri de luna trecută pentru comparație
        const [requestsLastMonthResult] = await pool.execute(`
          SELECT COUNT(*) as total_last_month
          FROM (
            SELECT id FROM approval_requests 
            WHERE status = 'PENDING' AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) 
              AND DATE(created_at) < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            UNION ALL
            SELECT id FROM material_requests 
            WHERE status = 'PENDING' AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) 
              AND DATE(created_at) < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          ) as all_pending_last_month
        `);
        const requestsLastMonth = (requestsLastMonthResult as any[])[0]?.total_last_month || 0;
        requestsPercentage = requestsLastMonth > 0
          ? ((requestsTotal - requestsLastMonth) / requestsLastMonth * 100).toFixed(2)
          : '0.00';
      } catch (error) {
        console.warn('Could not load pending requests:', error);
      }

      // Activitate recentă (ultimele 10 activități)
      let recentActivity: any[] = [];
      try {
        const [activityResult] = await pool.execute(`
          SELECT 
            al.id,
            al.action_type,
            al.entity_type,
            al.description,
            al.created_at,
            u.first_name,
            u.last_name,
            u.email
          FROM activity_logs al
          LEFT JOIN users u ON al.user_id = u.id
          ORDER BY al.created_at DESC
          LIMIT 10
        `);
        recentActivity = activityResult as any[];
        console.log('📊 Recent activity loaded:', recentActivity.length, 'items');
      } catch (error) {
        console.warn('Could not load recent activity:', error);
        recentActivity = [];
      }

      // Alerte urgente (HIGH severity, nerezolvate)
      let urgentAlerts: any[] = [];
      try {
        const [alertsResult] = await pool.execute(`
          SELECT id, title, severity, message, created_at
          FROM alerts
          WHERE status = 'ACTIVE' AND severity IN ('HIGH', 'CRITICAL')
          ORDER BY created_at DESC
          LIMIT 5
        `);
        urgentAlerts = alertsResult as any[];
      } catch (error) {
        console.warn('Could not load urgent alerts:', error);
        urgentAlerts = [];
      }

      // Cereri care așteaptă aprobare
      let pendingApprovals: any[] = [];
      try {
        const [approvalsResult] = await pool.execute(`
          SELECT 
            ar.id,
            ar.status,
            ar.description,
            ar.created_at,
            CASE 
              WHEN ar.entity_type = 'EVENT' THEN ce.title
              ELSE CONCAT('Cerere aprobare #', ar.id)
            END as event_title,
            ar.entity_type,
            u.first_name as requester_first_name,
            u.last_name as requester_last_name
          FROM approval_requests ar
          LEFT JOIN calendar_events ce ON ar.entity_type = 'EVENT' AND ar.entity_id = ce.id
          LEFT JOIN users u ON ar.requester_id = u.id
          WHERE ar.status = 'PENDING'
          ORDER BY ar.created_at ASC
          LIMIT 5
        `);
        pendingApprovals = approvalsResult as any[];
        console.log('📊 Pending approvals loaded:', pendingApprovals.length, 'items');
      } catch (error) {
        console.warn('Could not load pending approvals:', error);
        pendingApprovals = [];
      }

      // Task-uri urgente (din tasks)
      let urgentTasks: any[] = [];
      try {
        const [tasksResult] = await pool.execute(`
          SELECT 
            t.id,
            t.title,
            t.status,
            t.priority,
            t.due_date,
            ce.title as event_title,
            u.first_name as assigned_first_name,
            u.last_name as assigned_last_name
          FROM tasks t
          LEFT JOIN calendar_events ce ON t.event_id = ce.id
          LEFT JOIN users u ON t.assigned_to = u.id
          WHERE t.status IN ('PENDING', 'IN_PROGRESS') 
            AND (t.priority = 'HIGH' OR t.due_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY))
          ORDER BY t.priority DESC, t.due_date ASC
          LIMIT 5
        `);
        urgentTasks = tasksResult as any[];
      } catch (error) {
        console.warn('Could not load urgent tasks:', error);
        urgentTasks = [];
      }

      // Utilizatori noi (ultimele 7 zile)
      let newUsers: any[] = [];
      try {
        const [usersResult] = await pool.execute(`
          SELECT id, first_name, last_name, email, created_at
          FROM users
          WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          ORDER BY created_at DESC
          LIMIT 5
        `);
        newUsers = usersResult as any[];
        console.log('📊 New users loaded:', newUsers.length, 'items');
      } catch (error) {
        console.warn('Could not load new users:', error);
        newUsers = [];
      }

      // Documente recente (ultimele documente încărcate)
      let expiringDocuments: any[] = [];
      try {
        const [docsResult] = await pool.execute(`
          SELECT 
            ed.id,
            COALESCE(ed.title, ed.file_name) as original_name,
            ed.created_at,
            ce.title as event_title
          FROM event_documents ed
          LEFT JOIN calendar_events ce ON ed.event_id = ce.id
          WHERE ed.is_active = 1
          ORDER BY ed.created_at DESC
          LIMIT 5
        `);
        expiringDocuments = docsResult as any[];
      } catch (error) {
        console.warn('Could not load recent documents:', error);
        expiringDocuments = [];
      }

      // Statistici rapide
      let quickStats: any = {};
      try {
        const [statsResult] = await pool.execute(`
          SELECT 
            (SELECT COUNT(*) FROM alerts WHERE status = 'ACTIVE' AND severity IN ('HIGH', 'CRITICAL')) as active_alerts,
            (SELECT COUNT(*) FROM approval_requests WHERE status = 'PENDING') as pending_approvals,
            (SELECT COUNT(*) FROM tasks WHERE status IN ('PENDING', 'IN_PROGRESS')) as active_tasks,
            (SELECT COUNT(*) FROM users WHERE DATE(last_login) = CURDATE() OR DATE(created_at) = CURDATE()) as today_logins,
            (SELECT COUNT(*) FROM activity_logs WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)) as today_activities
        `);
        const stats = (statsResult as any[])[0] || {};
        quickStats = {
          active_alerts: Number(stats.active_alerts) || 0,
          pending_approvals: Number(stats.pending_approvals) || 0,
          active_tasks: Number(stats.active_tasks) || 0,
          today_logins: Number(stats.today_logins) || 0,
          today_activities: Number(stats.today_activities) || 0
        };
        console.log('📊 Quick stats loaded:', quickStats);
      } catch (error) {
        console.error('Could not load quick stats:', error);
        quickStats = {
          active_alerts: 0,
          pending_approvals: 0,
          active_tasks: 0,
          today_logins: 0,
          today_activities: 0
        };
      }

      res.json({
        stats: {
          activeUsers: {
            total: activeUsersTotal,
            percentage: activeUsersPercentage,
            isIncrease: parseFloat(activeUsersPercentage) > 0
          },
          documentsProcessed: {
            total: documentsTotal,
            percentage: documentsPercentage,
            isIncrease: parseFloat(documentsPercentage) > 0
          },
          pendingRequests: {
            total: requestsTotal,
            percentage: requestsPercentage,
            isIncrease: parseFloat(requestsPercentage) > 0
          }
        },
        urgentAlerts: urgentAlerts || [],
        pendingApprovals: pendingApprovals || [],
        urgentTasks: urgentTasks || [],
        newUsers: newUsers || [],
        expiringDocuments: expiringDocuments || [],
        quickStats: quickStats || {},
        recentActivity: recentActivity || []
      });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({ 
        message: 'Eroare la obținerea statisticilor dashboard', 
        error: (error as Error).message 
      });
    }
  }
};

