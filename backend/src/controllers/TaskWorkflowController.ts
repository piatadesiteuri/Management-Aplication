import { Request, Response } from 'express';
import { TaskWorkflowService } from '../services/TaskWorkflowService';

export const TaskWorkflowController = {
  // Test endpoint pentru verificarea TaskWorkflowService
  testService: async (req: Request, res: Response) => {
    try {
      console.log('🧪 Testing TaskWorkflowService...');
      const workflowService = TaskWorkflowService.getInstance();
      console.log('✅ TaskWorkflowService instance created');
      
      const templates = await workflowService.getTaskTemplates();
      console.log('✅ Templates retrieved:', templates.length);
      
      // Test getTemplateByEventType
      const inspectionTemplate = await workflowService.getTemplateByEventType('INSPECTION');
      console.log('✅ Inspection template found:', inspectionTemplate ? 'YES' : 'NO');
      
      // Test inserare directă în baza de date
      console.log('🧪 Testing direct database insertion...');
      const pool = require('../config/database').default;
      
      // Test inserare workflow
      const [workflowResult] = await pool.execute(
        'INSERT INTO task_workflows (event_id, template_id, status, current_step, created_by) VALUES (?, ?, ?, ?, ?)',
        [57, 1, 'ACTIVE', 'PREPARATION', 1]
      );
      const workflowId = (workflowResult as any).insertId;
      console.log('✅ Workflow inserted with ID:', workflowId);
      
      // Test inserare task
      const [taskResult] = await pool.execute(
        'INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, status, estimated_hours, event_id, task_type, workflow_step) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['Test Task from API', 'Test Description', 5, 1, 'HIGH', 'PENDING', 2, 57, 'AUTO_GENERATED', 'PREPARATION']
      );
      const taskId = (taskResult as any).insertId;
      console.log('✅ Task inserted with ID:', taskId);
      
      res.json({ 
        message: 'TaskWorkflowService funcționează corect',
        templatesCount: templates.length,
        inspectionTemplateFound: !!inspectionTemplate,
        workflowInserted: workflowId,
        taskInserted: taskId
      });
    } catch (error) {
      console.error('❌ Error testing TaskWorkflowService:', error);
      res.status(500).json({ 
        message: 'Eroare la testarea TaskWorkflowService',
        error: (error as any)?.message
      });
    }
  },

  // Obține toate template-urile de task-uri
  getTaskTemplates: async (req: Request, res: Response) => {
    try {
      const workflowService = TaskWorkflowService.getInstance();
      const templates = await workflowService.getTaskTemplates();
      
      res.json(templates);
    } catch (error) {
      console.error('Error getting task templates:', error);
      res.status(500).json({ message: 'Eroare la obținerea template-urilor' });
    }
  },

  // Generează task-uri pentru un eveniment
  generateTasksForEvent: async (req: Request, res: Response) => {
    try {
      console.log('🎯 TaskWorkflowController.generateTasksForEvent called');
      console.log('📝 Request body:', req.body);
      
      const { eventId, eventType, assignedUserId } = req.body;
      const userId = (req as any).user.id;

      console.log('🔍 Parameters:', { eventId, eventType, assignedUserId, userId });

      if (!eventId || !eventType || !assignedUserId) {
        console.log('❌ Missing required parameters');
        return res.status(400).json({ 
          message: 'eventId, eventType și assignedUserId sunt obligatorii' 
        });
      }

      console.log('🔄 Getting TaskWorkflowService instance...');
      const workflowService = TaskWorkflowService.getInstance();
      
      console.log('🚀 Calling generateTasksForEvent...');
      const taskIds = await workflowService.generateTasksForEvent(
        eventId, 
        eventType, 
        assignedUserId, 
        userId
      );

      console.log('✅ Tasks generated successfully:', taskIds);
      res.json({ 
        message: 'Task-urile au fost generate cu succes',
        taskIds 
      });
    } catch (error) {
      console.error('❌ Error generating tasks for event:', error);
      console.error('❌ Error details:', {
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      res.status(500).json({ 
        message: 'Eroare la generarea task-urilor pentru eveniment' 
      });
    }
  },

  // Obține task-urile pentru un eveniment
  getTasksForEvent: async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      
      const workflowService = TaskWorkflowService.getInstance();
      const tasks = await workflowService.getTasksForEvent(Number(eventId));
      
      res.json(tasks);
    } catch (error) {
      console.error('Error getting tasks for event:', error);
      res.status(500).json({ 
        message: 'Eroare la obținerea task-urilor pentru eveniment' 
      });
    }
  },

  // Obține progresul workflow-ului pentru un eveniment
  getWorkflowProgress: async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      
      const workflowService = TaskWorkflowService.getInstance();
      const progress = await workflowService.getWorkflowProgress(Number(eventId));
      
      res.json(progress);
    } catch (error) {
      console.error('Error getting workflow progress:', error);
      res.status(500).json({ 
        message: 'Eroare la obținerea progresului workflow-ului' 
      });
    }
  },

  // Avansează workflow-ul (când un task este completat)
  advanceWorkflow: async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const userId = (req as any).user.id;

      const workflowService = TaskWorkflowService.getInstance();
      await workflowService.advanceWorkflow(Number(taskId), userId);

      res.json({ 
        message: 'Workflow-ul a fost avansat cu succes' 
      });
    } catch (error) {
      console.error('Error advancing workflow:', error);
      res.status(500).json({ 
        message: 'Eroare la avansarea workflow-ului' 
      });
    }
  },

  // Obține workflow-ul pentru un eveniment
  getWorkflowForEvent: async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      
      const workflowService = TaskWorkflowService.getInstance();
      const workflow = await workflowService.getWorkflowForEvent(Number(eventId));
      
      if (!workflow) {
        return res.status(404).json({ 
          message: 'Nu s-a găsit workflow-ul pentru acest eveniment' 
        });
      }

      res.json(workflow);
    } catch (error) {
      console.error('Error getting workflow for event:', error);
      res.status(500).json({ 
        message: 'Eroare la obținerea workflow-ului pentru eveniment' 
      });
    }
  }
}; 