import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ApprovalRequest {
  id: number;
  event_id: number;
  step_id: string;
  workflow_type: string;
  requester_id: number;
  approver_id?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'TIMEOUT' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  requested_at: string;
  responded_at?: string;
  deadline?: string;
  comments?: string;
  rejection_reason?: string;
  escalated_to?: number;
  escalated_at?: string;
}

interface ApprovalHistory {
  id: number;
  event_id: number;
  request_id?: number;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'CANCELLED' | 'TIMEOUT';
  performed_by: number;
  performed_at: string;
  comments?: string;
  from_status?: string;
  to_status?: string;
  step_name?: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  required_role: string;
  step_order: number;
  is_required: boolean;
  auto_approve: boolean;
  timeout_hours: number;
}

export const ApprovalWorkflowController = {
  // Obține workflow-ul pentru un eveniment
  getEventWorkflow: async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      
      console.log('📋 Getting workflow for event:', eventId);
      
      // Obține informațiile evenimentului
      const [eventRows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, title, type, status, workflow_type, workflow_status, 
                current_step_id, workflow_started_at, workflow_completed_at,
                approval_status, approved_by, approved_at
         FROM calendar_events 
         WHERE id = ?`,
        [eventId]
      );
      
      if (eventRows.length === 0) {
        return res.status(404).json({ error: 'Eveniment negăsit' });
      }
      
      const event = eventRows[0];
      
      // Obține pașii workflow-ului
      const [stepRows] = await pool.execute<RowDataPacket[]>(
        `SELECT step_id, name, description, required_role, step_order, 
                is_required, auto_approve, timeout_hours
         FROM approval_steps 
         WHERE workflow_type = ? 
         ORDER BY step_order ASC`,
        [event.workflow_type]
      );
      
      // Obține cererile de aprobare
      const [requestRows] = await pool.execute<RowDataPacket[]>(
        `SELECT ar.*, 
                u1.first_name as requester_first_name, u1.last_name as requester_last_name,
                u2.first_name as approver_first_name, u2.last_name as approver_last_name,
                u3.first_name as escalated_first_name, u3.last_name as escalated_last_name
         FROM approval_requests ar
         LEFT JOIN users u1 ON ar.requester_id = u1.id
         LEFT JOIN users u2 ON ar.approver_id = u2.id
         LEFT JOIN users u3 ON ar.escalated_to = u3.id
         WHERE ar.event_id = ? 
         ORDER BY ar.created_at DESC`,
        [eventId]
      );
      
      // Obține istoricul aprobărilor
      const [historyRows] = await pool.execute<RowDataPacket[]>(
        `SELECT ah.*, 
                u.first_name, u.last_name, u.email,
                ur.name as role_name
         FROM approval_history ah
         JOIN users u ON ah.performed_by = u.id
         LEFT JOIN user_roles ur_link ON u.id = ur_link.user_id
         LEFT JOIN roles ur ON ur_link.role_id = ur.id
         WHERE ah.event_id = ? 
         ORDER BY ah.performed_at DESC`,
        [eventId]
      );
      
      // Formatează istoricul
      const history = historyRows.map(row => ({
        id: row.id,
        eventId: row.event_id,
        action: row.action,
        performedBy: row.performed_by,
        performedAt: row.performed_at,
        comments: row.comments,
        fromStatus: row.from_status,
        toStatus: row.to_status,
        stepName: row.step_name,
        user: {
          id: row.performed_by,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          role: row.role_name
        }
      }));
      
      res.json({
        event: {
          id: event.id,
          title: event.title,
          type: event.type,
          status: event.status,
          workflowType: event.workflow_type,
          workflowStatus: event.workflow_status,
          currentStepId: event.current_step_id,
          workflowStartedAt: event.workflow_started_at,
          workflowCompletedAt: event.workflow_completed_at,
          approvalStatus: event.approval_status,
          approvedBy: event.approved_by,
          approvedAt: event.approved_at
        },
        steps: stepRows,
        requests: requestRows,
        history: history
      });
      
    } catch (error) {
      console.error('❌ Error getting event workflow:', error);
      res.status(500).json({ error: 'Eroare la obținerea workflow-ului' });
    }
  },
  
  // Inițializează workflow-ul pentru un eveniment
  initializeWorkflow: async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const { workflowType } = req.body;
      const userId = req.user?.id;
      
      console.log('🚀 Initializing workflow for event:', { eventId, workflowType, userId });
      
      // Apelează procedura stocată pentru inițializarea workflow-ului
      await pool.execute(
        'CALL InitializeEventWorkflow(?, ?, ?)',
        [eventId, workflowType, userId]
      );
      
      res.json({ 
        message: 'Workflow inițializat cu succes',
        eventId: eventId,
        workflowType: workflowType
      });
      
    } catch (error) {
      console.error('❌ Error initializing workflow:', error);
      res.status(500).json({ error: 'Eroare la inițializarea workflow-ului' });
    }
  },
  
  // Procesează o acțiune de aprobare
  processApprovalAction: async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;
      const { action, comments, rejectionReason, escalatedTo } = req.body;
      const userId = req.user?.id;
      
      console.log('⚡ Processing approval action:', {
        requestId,
        action,
        comments,
        rejectionReason,
        escalatedTo,
        userId
      });
      
      // Verifică dacă cererea există și este în starea PENDING
      const [requestRows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM approval_requests WHERE id = ? AND status = "PENDING"',
        [requestId]
      );
      
      if (requestRows.length === 0) {
        return res.status(404).json({ error: 'Cererea de aprobare nu a fost găsită sau nu este în starea PENDING' });
      }
      
      const request = requestRows[0];
      
      // Verifică permisiunile utilizatorului
      const [stepRows] = await pool.execute<RowDataPacket[]>(
        'SELECT required_role FROM approval_steps WHERE step_id = ? AND workflow_type = ?',
        [request.step_id, request.workflow_type]
      );
      
      if (stepRows.length === 0) {
        return res.status(400).json({ error: 'Pasul de aprobare nu a fost găsit' });
      }
      
      // TODO: Verifică rolul utilizatorului față de rolul necesar
      // Pentru moment permitem toate acțiunile
      
      // Apelează procedura stocată pentru procesarea acțiunii
      await pool.execute(
        'CALL ProcessApprovalAction(?, ?, ?, ?, ?, ?)',
        [requestId, action, userId, comments, rejectionReason, escalatedTo]
      );
      
      // Obține evenimentul actualizat
      const [eventRows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM calendar_events WHERE id = ?',
        [request.event_id]
      );
      
      const event = eventRows[0];
      
      res.json({
        message: 'Acțiunea de aprobare a fost procesată cu succes',
        action: action,
        requestId: requestId,
        eventId: request.event_id,
        newWorkflowStatus: event.workflow_status,
        newApprovalStatus: event.approval_status
      });
      
    } catch (error) {
      console.error('❌ Error processing approval action:', error);
      res.status(500).json({ error: 'Eroare la procesarea acțiunii de aprobare' });
    }
  },
  
  // Obține cererile de aprobare pentru un utilizator
  getUserApprovalRequests: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { status, priority, limit = 50 } = req.query;
      
      console.log('📋 Getting approval requests for user:', { userId, status, priority, limit });
      
      let query = `
        SELECT ar.*, 
               ce.title as event_title, ce.type as event_type, ce.start_time, ce.end_time,
               aps.name as step_name, aps.description as step_description,
               u.first_name as requester_first_name, u.last_name as requester_last_name
        FROM approval_requests ar
        JOIN calendar_events ce ON ar.event_id = ce.id
        JOIN approval_steps aps ON ar.step_id = aps.step_id AND ar.workflow_type = aps.workflow_type
        JOIN users u ON ar.requester_id = u.id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      
      // Filtrează după utilizator (cereri care îi sunt adresate)
      // TODO: Implementează logica pentru a determina cererile adresate utilizatorului
      // Pentru moment returnăm toate cererile
      
      if (status) {
        query += ' AND ar.status = ?';
        params.push(status);
      }
      
      if (priority) {
        query += ' AND ar.priority = ?';
        params.push(priority);
      }
      
      query += ' ORDER BY ar.created_at DESC LIMIT ?';
      params.push(parseInt(limit as string));
      
      const [rows] = await pool.execute<RowDataPacket[]>(query, params);
      
      res.json(rows);
      
    } catch (error) {
      console.error('❌ Error getting user approval requests:', error);
      res.status(500).json({ error: 'Eroare la obținerea cererilor de aprobare' });
    }
  },
  
  // Obține statistici workflow
  getWorkflowStatistics: async (req: Request, res: Response) => {
    try {
      const { timeframe = '30' } = req.query;
      
      console.log('📊 Getting workflow statistics for timeframe:', timeframe);
      
      // Statistici generale
      const [statsRows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
           COUNT(*) as total_requests,
           SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_requests,
           SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_requests,
           SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_requests,
           SUM(CASE WHEN status = 'TIMEOUT' THEN 1 ELSE 0 END) as timeout_requests,
           AVG(CASE WHEN status = 'APPROVED' AND responded_at IS NOT NULL 
               THEN TIMESTAMPDIFF(HOUR, requested_at, responded_at) 
               ELSE NULL END) as avg_approval_time_hours
         FROM approval_requests 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [timeframe]
      );
      
      // Statistici pe tipuri de workflow
      const [workflowTypeStats] = await pool.execute<RowDataPacket[]>(
        `SELECT 
           workflow_type,
           COUNT(*) as total_requests,
           SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_requests,
           SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_requests,
           AVG(CASE WHEN status = 'APPROVED' AND responded_at IS NOT NULL 
               THEN TIMESTAMPDIFF(HOUR, requested_at, responded_at) 
               ELSE NULL END) as avg_approval_time_hours
         FROM approval_requests 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY workflow_type
         ORDER BY total_requests DESC`,
        [timeframe]
      );
      
      // Statistici pe utilizatori (cei mai activi aprobatori)
      const [userStats] = await pool.execute<RowDataPacket[]>(
        `SELECT 
           u.id, u.first_name, u.last_name, u.email,
           COUNT(*) as total_approvals,
           SUM(CASE WHEN ar.status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
           SUM(CASE WHEN ar.status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count,
           AVG(CASE WHEN ar.status IN ('APPROVED', 'REJECTED') AND ar.responded_at IS NOT NULL 
               THEN TIMESTAMPDIFF(HOUR, ar.requested_at, ar.responded_at) 
               ELSE NULL END) as avg_response_time_hours
         FROM approval_requests ar
         JOIN users u ON ar.approver_id = u.id
         WHERE ar.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
           AND ar.status IN ('APPROVED', 'REJECTED')
         GROUP BY u.id, u.first_name, u.last_name, u.email
         ORDER BY total_approvals DESC
         LIMIT 10`,
        [timeframe]
      );
      
      res.json({
        timeframe: timeframe,
        general: statsRows[0],
        byWorkflowType: workflowTypeStats,
        topApprovers: userStats
      });
      
    } catch (error) {
      console.error('❌ Error getting workflow statistics:', error);
      res.status(500).json({ error: 'Eroare la obținerea statisticilor workflow' });
    }
  },
  
  // Obține configurația workflow-urilor
  getWorkflowConfigurations: async (req: Request, res: Response) => {
    try {
      console.log('⚙️ Getting workflow configurations');
      
      const [configRows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM workflow_configurations WHERE is_active = TRUE ORDER BY workflow_type`
      );
      
      const [stepRows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM approval_steps ORDER BY workflow_type, step_order`
      );
      
      // Grupează pașii pe tipuri de workflow
      const stepsByWorkflow = stepRows.reduce((acc, step) => {
        if (!acc[step.workflow_type]) {
          acc[step.workflow_type] = [];
        }
        acc[step.workflow_type].push(step);
        return acc;
      }, {} as Record<string, any[]>);
      
      // Combină configurațiile cu pașii
      const configurations = configRows.map(config => ({
        ...config,
        steps: stepsByWorkflow[config.workflow_type] || []
      }));
      
      res.json(configurations);
      
    } catch (error) {
      console.error('❌ Error getting workflow configurations:', error);
      res.status(500).json({ error: 'Eroare la obținerea configurațiilor workflow' });
    }
  },
  
  // Escalează o cerere de aprobare
  escalateApprovalRequest: async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;
      const { escalatedTo, comments } = req.body;
      const userId = req.user?.id;
      
      console.log('⬆️ Escalating approval request:', { requestId, escalatedTo, comments, userId });
      
      // Actualizează cererea
      await pool.execute(
        `UPDATE approval_requests 
         SET escalated_to = ?, escalated_at = NOW(), comments = ?
         WHERE id = ? AND status = 'PENDING'`,
        [escalatedTo, comments, requestId]
      );
      
      // Adaugă în istoric
      const [requestRows] = await pool.execute<RowDataPacket[]>(
        'SELECT event_id FROM approval_requests WHERE id = ?',
        [requestId]
      );
      
      if (requestRows.length > 0) {
        await pool.execute(
          `INSERT INTO approval_history (event_id, request_id, action, performed_by, comments)
           VALUES (?, ?, 'ESCALATED', ?, ?)`,
          [requestRows[0].event_id, requestId, userId, comments]
        );
      }
      
      res.json({ message: 'Cererea a fost escaladată cu succes' });
      
    } catch (error) {
      console.error('❌ Error escalating approval request:', error);
      res.status(500).json({ error: 'Eroare la escaladarea cererii' });
    }
  },
  
  // Anulează o cerere de aprobare
  cancelApprovalRequest: async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;
      
      console.log('❌ Cancelling approval request:', { requestId, reason, userId });
      
      // Actualizează cererea
      await pool.execute(
        `UPDATE approval_requests 
         SET status = 'CANCELLED', responded_at = NOW(), comments = ?
         WHERE id = ? AND status = 'PENDING'`,
        [reason, requestId]
      );
      
      // Adaugă în istoric
      const [requestRows] = await pool.execute<RowDataPacket[]>(
        'SELECT event_id FROM approval_requests WHERE id = ?',
        [requestId]
      );
      
      if (requestRows.length > 0) {
        await pool.execute(
          `INSERT INTO approval_history (event_id, request_id, action, performed_by, comments)
           VALUES (?, ?, 'CANCELLED', ?, ?)`,
          [requestRows[0].event_id, requestId, userId, reason]
        );
      }
      
      res.json({ message: 'Cererea a fost anulată cu succes' });
      
    } catch (error) {
      console.error('❌ Error cancelling approval request:', error);
      res.status(500).json({ error: 'Eroare la anularea cererii' });
    }
  }
};

export default ApprovalWorkflowController; 