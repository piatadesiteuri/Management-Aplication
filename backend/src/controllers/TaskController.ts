import { Request, Response } from 'express';
import { TaskService } from '../services/TaskService';

export const TaskController = {
  // Test database connection
  testConnection: async (req: Request, res: Response) => {
    try {
      console.log('TaskController.testConnection called');
      const taskService = TaskService.getInstance();
      const isConnected = await taskService.testConnection();
      
      if (isConnected) {
        res.json({ success: true, message: 'Database connection successful' });
      } else {
        res.status(500).json({ success: false, message: 'Database connection failed' });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      res.status(500).json({ success: false, message: 'Error testing connection' });
    }
  },

  // Obține toate task-urile cu filtrare
  getAllTasks: async (req: Request, res: Response) => {
    try {
      console.log('=== TaskController.getAllTasks START ===');
      console.log('TaskController.getAllTasks called');
      const {
        assigned_to,
        assigned_by,
        department_id,
        status,
        priority,
        search,
        page = 1,
        limit = 20
      } = req.query;

      console.log('Filters:', { assigned_to, assigned_by, department_id, status, priority, search, page, limit });

      console.log('Getting TaskService instance...');
      const taskService = TaskService.getInstance();
      console.log('TaskService instance obtained:', taskService);
      
      console.log('Calling taskService.getTasks...');
      const result = await taskService.getTasks({
        assigned_to: assigned_to ? Number(assigned_to) : undefined,
        assigned_by: assigned_by ? Number(assigned_by) : undefined,
        department_id: department_id ? Number(department_id) : undefined,
        status: status as string,
        priority: priority as string,
        search: search as string,
        page: Number(page),
        limit: Number(limit)
      });

      console.log('TaskService.getTasks completed successfully');
      console.log('Result:', result);
      console.log('=== TaskController.getAllTasks END ===');
      res.json(result);
    } catch (error) {
      console.error('=== TaskController.getAllTasks ERROR ===');
      console.error('Error getting tasks:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('=== TaskController.getAllTasks ERROR END ===');
      res.status(500).json({ message: 'Eroare la obținerea task-urilor' });
    }
  },

  // Obține un task după ID
  getTaskById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const taskService = TaskService.getInstance();
      const task = await taskService.getTaskById(Number(id));

      if (!task) {
        return res.status(404).json({ message: 'Task-ul nu a fost găsit' });
      }

      res.json(task);
    } catch (error) {
      console.error('Error getting task:', error);
      res.status(500).json({ message: 'Eroare la obținerea task-ului' });
    }
  },

  // Creează un task nou
  createTask: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const taskData = req.body;

      // Validare
      if (!taskData.title || !taskData.assigned_to) {
        return res.status(400).json({ 
          message: 'Titlul și utilizatorul asignat sunt obligatorii' 
        });
      }

      const taskService = TaskService.getInstance();
      const task = await taskService.createTask(taskData, userId);

      res.status(201).json(task);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ message: 'Eroare la crearea task-ului' });
    }
  },

  // Actualizează un task
  updateTask: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const updates = req.body;

      const taskService = TaskService.getInstance();
      const task = await taskService.updateTask(Number(id), updates, userId);

      res.json(task);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ message: 'Eroare la actualizarea task-ului' });
    }
  },

  // Șterge un task
  deleteTask: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const taskService = TaskService.getInstance();
      await taskService.deleteTask(Number(id), userId);

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ message: 'Eroare la ștergerea task-ului' });
    }
  },

  // Obține comentariile unui task
  getTaskComments: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const taskService = TaskService.getInstance();
      const comments = await taskService.getTaskComments(Number(id));

      res.json(comments);
    } catch (error) {
      console.error('Error getting task comments:', error);
      res.status(500).json({ message: 'Eroare la obținerea comentariilor' });
    }
  },

  // Adaugă un comentariu la task
  addTaskComment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const { comment } = req.body;

      if (!comment || comment.trim() === '') {
        return res.status(400).json({ message: 'Comentariul este obligatoriu' });
      }

      const taskService = TaskService.getInstance();
      const taskComment = await taskService.addComment(Number(id), userId, comment);

      res.status(201).json(taskComment);
    } catch (error) {
      console.error('Error adding task comment:', error);
      res.status(500).json({ message: 'Eroare la adăugarea comentariului' });
    }
  },

  // Obține istoricul unui task
  getTaskHistory: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const taskService = TaskService.getInstance();
      const history = await taskService.getTaskHistory(Number(id));

      res.json(history);
    } catch (error) {
      console.error('Error getting task history:', error);
      res.status(500).json({ message: 'Eroare la obținerea istoricului' });
    }
  },

  // Obține statisticile task-urilor
  getTaskStats: async (req: Request, res: Response) => {
    try {
      const { user_id } = req.query;
      const taskService = TaskService.getInstance();
      const stats = await taskService.getTaskStats(
        user_id ? Number(user_id) : undefined
      );

      res.json(stats);
    } catch (error) {
      console.error('Error getting task stats:', error);
      res.status(500).json({ message: 'Eroare la obținerea statisticilor' });
    }
  },

  // Marchează un task ca completat
  completeTask: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const { actual_hours } = req.body;

      const taskService = TaskService.getInstance();
      const task = await taskService.updateTask(Number(id), {
        status: 'COMPLETED',
        actual_hours: actual_hours || 0
      }, userId);

      res.json(task);
    } catch (error) {
      console.error('Error completing task:', error);
      res.status(500).json({ message: 'Eroare la completarea task-ului' });
    }
  },

  // Marchează un task ca în progres
  startTask: async (req: Request, res: Response) => {
    try {
      console.log('🚀 TaskController.startTask called');
      console.log('👤 Request user:', req.user);
      console.log('📝 Request params:', req.params);
      
      const { id } = req.params;
      const userId = (req as any).user.id;

      console.log('🆔 Task ID:', id, 'User ID:', userId);

      const taskService = TaskService.getInstance();
      const task = await taskService.updateTask(Number(id), {
        status: 'IN_PROGRESS'
      }, userId);

      console.log('✅ Task started successfully:', task);
      res.json(task);
    } catch (error) {
      console.error('❌ Error starting task:', error);
      res.status(500).json({ message: 'Eroare la pornirea task-ului' });
    }
  },

  // Anulează un task
  cancelTask: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const { reason } = req.body;

      const taskService = TaskService.getInstance();
      const task = await taskService.updateTask(Number(id), {
        status: 'CANCELLED'
      }, userId);

      // Adaugă un comentariu cu motivul anulării
      if (reason) {
        await taskService.addComment(Number(id), userId, `Task anulat: ${reason}`);
      }

      res.json(task);
    } catch (error) {
      console.error('Error cancelling task:', error);
      res.status(500).json({ message: 'Eroare la anularea task-ului' });
    }
  },

  // Obține task-urile pentru un utilizator
  getMyTasks: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const {
        status,
        priority,
        search,
        page = 1,
        limit = 20
      } = req.query;

      const taskService = TaskService.getInstance();
      const result = await taskService.getTasks({
        assigned_to: userId,
        status: status as string,
        priority: priority as string,
        search: search as string,
        page: Number(page),
        limit: Number(limit)
      });

      res.json(result);
    } catch (error) {
      console.error('Error getting my tasks:', error);
      res.status(500).json({ message: 'Eroare la obținerea task-urilor' });
    }
  },

  // Obține task-urile create de un utilizator
  getTasksCreatedByMe: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const {
        status,
        priority,
        search,
        page = 1,
        limit = 20
      } = req.query;

      const taskService = TaskService.getInstance();
      const result = await taskService.getTasks({
        assigned_by: userId,
        status: status as string,
        priority: priority as string,
        search: search as string,
        page: Number(page),
        limit: Number(limit)
      });

      res.json(result);
    } catch (error) {
      console.error('Error getting tasks created by me:', error);
      res.status(500).json({ message: 'Eroare la obținerea task-urilor' });
    }
  }
}; 