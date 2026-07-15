import pool from '../config/database';
import { ActivityLogService } from './ActivityLogService';

export interface Task {
  id: number;
  title: string;
  description?: string;
  assigned_to: number;
  assigned_by: number;
  department_id?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  due_date?: string;
  estimated_hours?: number;
  actual_hours: number;
  dependencies?: number[];
  attachments?: string[];
  tags?: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
  // New fields for event integration
  event_id?: number;
  task_type?: 'MANUAL' | 'AUTO_GENERATED' | 'EVENT_RELATED';
  workflow_step?: string;
  parent_task_id?: number;
  completion_notes?: string;
  // Joined fields
  assigned_to_user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  assigned_by_user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  department?: {
    id: number;
    name: string;
  };
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface TaskHistory {
  id: number;
  task_id: number;
  user_id: number;
  action: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  due_today: number;
  due_this_week: number;
  by_priority: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  by_department: Array<{
    department_id: number;
    department_name: string;
    count: number;
  }>;
}

export class TaskService {
  private static instance: TaskService;

  private constructor() {}

  public static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('TaskService: Testing database connection...');
      const [result] = await pool.execute('SELECT 1 as test');
      console.log('TaskService: Database connection successful:', result);
      return true;
    } catch (error) {
      console.error('TaskService: Database connection failed:', error);
      return false;
    }
  }

  /**
   * Creează un task nou
   */
  async createTask(taskData: Partial<Task>, userId: number): Promise<Task> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `INSERT INTO tasks (
          title, description, assigned_to, assigned_by, department_id,
          priority, status, due_date, estimated_hours, dependencies, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          taskData.title || 'Task fără titlu',
          taskData.description ?? null,
          taskData.assigned_to,
          userId,
          taskData.department_id ?? null,
          taskData.priority || 'MEDIUM',
          taskData.status || 'PENDING',
          taskData.due_date ?? null,
          taskData.estimated_hours ?? null,
          taskData.dependencies ? JSON.stringify(taskData.dependencies) : null,
          taskData.tags ? JSON.stringify(taskData.tags) : null
        ]
      );

      const taskId = (result as any).insertId;

      // Adaugă în istoric
      await this.addTaskHistory(taskId, userId, 'CREATED', undefined, taskData.title);

      await connection.commit();

      const task = await this.getTaskById(taskId);
      if (!task) {
        throw new Error('Failed to create task');
      }

      await this.sendTaskNotification(taskId, 'ASSIGNED', userId);
      return task;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obține un task după ID
   */
  async getTaskById(taskId: number): Promise<Task | null> {
    console.log('🔍 TaskService.getTaskById called with id:', taskId);
    
    try {
      const [rows] = await pool.execute(
        `SELECT 
          t.*,
          JSON_OBJECT(
            'id', at.id,
            'first_name', at.first_name,
            'last_name', at.last_name,
            'email', at.email
          ) as assigned_to_user,
          JSON_OBJECT(
            'id', ab.id,
            'first_name', ab.first_name,
            'last_name', ab.last_name,
            'email', ab.email
          ) as assigned_by_user,
          JSON_OBJECT(
            'id', d.id,
            'name', d.name
          ) as department
        FROM tasks t
        LEFT JOIN users at ON t.assigned_to = at.id
        LEFT JOIN users ab ON t.assigned_by = ab.id
        LEFT JOIN departments d ON t.department_id = d.id
        WHERE t.id = ?`,
        [taskId]
      );

      const tasks = rows as Task[];
      console.log('🔍 TaskService.getTaskById result:', tasks.length > 0 ? 'Found' : 'Not found');
      return tasks.length > 0 ? tasks[0] : null;
    } catch (error) {
      console.error('❌ TaskService.getTaskById error:', error);
      throw error;
    }
  }

  /**
   * Obține toate task-urile cu filtrare
   */
  async getTasks(filters: {
    assigned_to?: number;
    assigned_by?: number;
    department_id?: number;
    status?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ tasks: Task[]; total: number }> {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    try {
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (filters.assigned_to !== undefined) {
        conditions.push('assigned_to = ?');
        params.push(filters.assigned_to);
      }
      if (filters.assigned_by !== undefined) {
        conditions.push('assigned_by = ?');
        params.push(filters.assigned_by);
      }
      if (filters.department_id !== undefined) {
        conditions.push('department_id = ?');
        params.push(filters.department_id);
      }
      if (filters.status) {
        conditions.push('status = ?');
        params.push(filters.status);
      }
      if (filters.priority) {
        conditions.push('priority = ?');
        params.push(filters.priority);
      }
      if (filters.search) {
        conditions.push('(title LIKE ? OR description LIKE ?)');
        const term = `%${filters.search}%`;
        params.push(term, term);
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM tasks ${whereClause}`,
        params
      );
      const total = (countRows as any[])[0].total;

      const [rows] = await pool.execute(
        `SELECT * FROM tasks ${whereClause} ORDER BY created_at DESC LIMIT ${parseInt(offset.toString())}, ${parseInt(limit.toString())}`,
        params
      );

      return {
        tasks: rows as Task[],
        total
      };
    } catch (error) {
      console.error('TaskService.getTasks: Error occurred:', error);
      console.error('TaskService.getTasks: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  /**
   * Actualizează un task
   */
  async updateTask(taskId: number, updates: Partial<Task>, userId: number): Promise<Task> {
    console.log('🔄 TaskService.updateTask called with:', { taskId, updates, userId });
    
    try {
      console.log('🔍 Getting current task...');
      const currentTask = await this.getTaskById(taskId);
      if (!currentTask) {
        throw new Error('Task not found');
      }
      console.log('✅ Current task found:', currentTask.title);

      // Construiește query-ul de update
      const updateFields: string[] = [];
      const updateParams: any[] = [];

      if (updates.title !== undefined) {
        updateFields.push('title = ?');
        updateParams.push(updates.title);
      }

      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        updateParams.push(updates.description);
      }

      if (updates.assigned_to !== undefined) {
        updateFields.push('assigned_to = ?');
        updateParams.push(updates.assigned_to);
      }

      if (updates.department_id !== undefined) {
        updateFields.push('department_id = ?');
        updateParams.push(updates.department_id);
      }

      if (updates.priority !== undefined) {
        updateFields.push('priority = ?');
        updateParams.push(updates.priority);
      }

      if (updates.status !== undefined) {
        updateFields.push('status = ?');
        updateParams.push(updates.status);
        
        if (updates.status === 'COMPLETED') {
          updateFields.push('completed_at = NOW()');
        } else if (currentTask.status === 'COMPLETED' || currentTask.status === 'CANCELLED') {
          updateFields.push('completed_at = NULL');
        }
      }

      if (updates.due_date !== undefined) {
        updateFields.push('due_date = ?');
        updateParams.push(updates.due_date);
      }

      if (updates.estimated_hours !== undefined) {
        updateFields.push('estimated_hours = ?');
        updateParams.push(updates.estimated_hours);
      }

      if (updates.actual_hours !== undefined) {
        updateFields.push('actual_hours = ?');
        updateParams.push(updates.actual_hours);
      }

      if (updates.dependencies !== undefined) {
        updateFields.push('dependencies = ?');
        updateParams.push(JSON.stringify(updates.dependencies));
      }

      if (updates.tags !== undefined) {
        updateFields.push('tags = ?');
        updateParams.push(JSON.stringify(updates.tags));
      }

      if (updateFields.length === 0) {
        console.log('ℹ️ No fields to update');
        return currentTask;
      }

      updateFields.push('updated_at = NOW()');
      updateParams.push(taskId);

      console.log('🔄 Executing update query...');
      console.log('📝 Update fields:', updateFields);
      console.log('📝 Update params:', updateParams);

      await pool.execute(
        `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`,
        updateParams
      );

      console.log('✅ Update query executed successfully');

      // Adaugă în istoric pentru modificările importante (opțional)
      if (updates.status && updates.status !== currentTask.status) {
        console.log('📝 Adding status change to history...');
        await this.addTaskHistory(taskId, userId, 'STATUS_CHANGED', currentTask.status, updates.status);
        await this.sendTaskNotification(taskId, 'STATUS_CHANGED', userId);
      }

      if (updates.priority && updates.priority !== currentTask.priority) {
        console.log('📝 Adding priority change to history...');
        await this.addTaskHistory(taskId, userId, 'PRIORITY_CHANGED', currentTask.priority, updates.priority);
      }

      if (updates.assigned_to && updates.assigned_to !== currentTask.assigned_to) {
        console.log('📝 Adding assignment change to history...');
        await this.addTaskHistory(taskId, userId, 'ASSIGNED', currentTask.assigned_to.toString(), updates.assigned_to.toString());
        await this.sendTaskNotification(taskId, 'REASSIGNED', userId);
      }

      console.log('🔍 Getting updated task...');
      const task = await this.getTaskById(taskId);
      if (!task) {
        throw new Error('Failed to update task');
      }
      
      console.log('✅ Task updated successfully:', task.title);
      return task;
    } catch (error) {
      console.error('❌ Error in updateTask:', error);
      throw error;
    }
  }

  /**
   * Șterge un task
   */
  async deleteTask(taskId: number, userId: number): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verifică dacă task-ul există
      const task = await this.getTaskById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Adaugă în istoric înainte de ștergere
      await this.addTaskHistory(taskId, userId, 'DELETED', task.title, undefined);

      // Șterge task-ul
      await connection.execute('DELETE FROM tasks WHERE id = ?', [taskId]);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Adaugă un comentariu la task
   */
  async addComment(taskId: number, userId: number, comment: string): Promise<TaskComment> {
    const [result] = await pool.execute(
      'INSERT INTO task_comments (task_id, user_id, comment) VALUES (?, ?, ?)',
      [taskId, userId, comment]
    );

    const commentId = (result as any).insertId;

    // Adaugă în istoric
    await this.addTaskHistory(taskId, userId, 'COMMENTED', undefined, comment.substring(0, 100));

    // Trimite notificare
    await this.sendTaskNotification(taskId, 'COMMENTED', userId);

    const commentData = await this.getCommentById(commentId);
    if (!commentData) {
      throw new Error('Failed to create comment');
    }
    return commentData;
  }

  /**
   * Obține comentariile unui task
   */
  async getTaskComments(taskId: number): Promise<TaskComment[]> {
    const [rows] = await pool.execute(
      `SELECT 
        tc.*,
        JSON_OBJECT(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name
        ) as user
      FROM task_comments tc
      LEFT JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id = ?
      ORDER BY tc.created_at ASC`,
      [taskId]
    );

    return rows as TaskComment[];
  }

  /**
   * Obține un comentariu după ID
   */
  async getCommentById(commentId: number): Promise<TaskComment | null> {
    const [rows] = await pool.execute(
      `SELECT 
        tc.*,
        JSON_OBJECT(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name
        ) as user
      FROM task_comments tc
      LEFT JOIN users u ON tc.user_id = u.id
      WHERE tc.id = ?`,
      [commentId]
    );

    const comments = rows as TaskComment[];
    return comments.length > 0 ? comments[0] : null;
  }

  /**
   * Obține istoricul unui task
   */
  async getTaskHistory(taskId: number): Promise<TaskHistory[]> {
    const [rows] = await pool.execute(
      `SELECT 
        th.*,
        JSON_OBJECT(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name
        ) as user
      FROM task_history th
      LEFT JOIN users u ON th.user_id = u.id
      WHERE th.task_id = ?
      ORDER BY th.created_at DESC`,
      [taskId]
    );

    return rows as TaskHistory[];
  }

  /**
   * Adaugă o intrare în istoricul task-ului
   */
  private async addTaskHistory(taskId: number, userId: number, action: string, oldValue?: string, newValue?: string): Promise<void> {
    try {
      console.log('📝 Adding task history:', { taskId, userId, action, oldValue, newValue });
      await pool.execute(
        'INSERT INTO task_history (task_id, user_id, action, old_value, new_value) VALUES (?, ?, ?, ?, ?)',
        [taskId, userId, action, oldValue, newValue]
      );
      console.log('✅ Task history added successfully');
    } catch (error) {
      console.error('❌ Error adding task history:', error);
      // Nu aruncăm eroarea pentru a nu afecta operațiunea principală
    }
  }

  /**
   * Obține statisticile task-urilor
   */
  async getTaskStats(userId?: number): Promise<TaskStats> {
    let whereClause = '';
    const params: any[] = [];

    if (userId) {
      whereClause = 'WHERE assigned_to = ?';
      params.push(userId);
    }

    // Statistici generale
    const [generalStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN due_date < NOW() AND status NOT IN ('COMPLETED', 'CANCELLED') THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN DATE(due_date) = CURDATE() AND status NOT IN ('COMPLETED', 'CANCELLED') THEN 1 ELSE 0 END) as due_today,
        SUM(CASE WHEN due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY) AND status NOT IN ('COMPLETED', 'CANCELLED') THEN 1 ELSE 0 END) as due_this_week
      FROM tasks ${whereClause}`,
      params
    );

    // Statistici pe prioritate
    const [priorityStats] = await pool.execute(
      `SELECT 
        priority,
        COUNT(*) as count
      FROM tasks ${whereClause}
      GROUP BY priority`,
      params
    );

    // Statistici pe departament
    const [departmentStats] = await pool.execute(
      `SELECT 
        d.id as department_id,
        d.name as department_name,
        COUNT(t.id) as count
      FROM tasks t
      LEFT JOIN departments d ON t.department_id = d.id
      ${whereClause}
      GROUP BY d.id, d.name
      ORDER BY count DESC`,
      params
    );

    const stats = (generalStats as any[])[0];
    const priorityMap = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0
    };

    (priorityStats as any[]).forEach((stat: any) => {
      priorityMap[stat.priority as keyof typeof priorityMap] = stat.count;
    });

    return {
      total: stats.total,
      pending: stats.pending,
      in_progress: stats.in_progress,
      completed: stats.completed,
      cancelled: stats.cancelled,
      overdue: stats.overdue,
      due_today: stats.due_today,
      due_this_week: stats.due_this_week,
      by_priority: priorityMap,
      by_department: departmentStats as any[]
    };
  }

  /**
   * Număr note interne nefinalizate primite de utilizator
   */
  async getInboxCount(userId: number): Promise<number> {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM tasks
       WHERE assigned_to = ? AND status IN ('PENDING', 'IN_PROGRESS')`,
      [userId]
    );
    return Number((rows as any[])[0]?.count || 0);
  }

  /**
   * Trimite notificare pentru notă internă (DB + WebSocket)
   */
  private async sendTaskNotification(
    taskId: number,
    type: string,
    actorUserId?: number
  ): Promise<void> {
    try {
      const task = await this.getTaskById(taskId);
      if (!task) return;

      const { sendNotification } = require('../app');
      const senderName = task.assigned_by_user
        ? `${task.assigned_by_user.last_name || ''} ${task.assigned_by_user.first_name || ''}`.trim()
        : 'Un coleg';
      const recipientName = task.assigned_to_user
        ? `${task.assigned_to_user.last_name || ''} ${task.assigned_to_user.first_name || ''}`.trim()
        : 'Destinatarul';

      let targetUserId: number | null = null;
      let message = '';

      switch (type) {
        case 'ASSIGNED':
          targetUserId = task.assigned_to;
          message = `📝 Notă internă nouă de la ${senderName}: ${task.title}`;
          break;
        case 'REASSIGNED':
          targetUserId = task.assigned_to;
          message = `📝 Ți-a fost alocată nota „${task.title}”`;
          break;
        case 'COMMENTED':
          targetUserId = actorUserId === task.assigned_to ? task.assigned_by : task.assigned_to;
          message = `💬 Răspuns nou la nota „${task.title}”`;
          break;
        case 'STATUS_CHANGED': {
          targetUserId = actorUserId === task.assigned_to ? task.assigned_by : task.assigned_to;
          const statusLabel: Record<string, string> = {
            PENDING: 'nouă',
            IN_PROGRESS: 'în lucru',
            COMPLETED: 'rezolvată',
            CANCELLED: 'închisă',
          };
          const actorName = actorUserId === task.assigned_to ? recipientName : senderName;
          message = `📋 Nota „${task.title}” marcată ${statusLabel[task.status] || task.status} de ${actorName}`;
          break;
        }
        default:
          targetUserId = task.assigned_to;
          message = `📋 Actualizare notă internă: ${task.title}`;
      }

      if (!targetUserId || (actorUserId && targetUserId === actorUserId)) {
        return;
      }

      await pool.execute(
        `INSERT INTO notifications (user_id, type, message, status, title, data, created_at)
         VALUES (?, 'INTERNAL_NOTE', ?, 'unread', ?, ?, NOW())`,
        [
          targetUserId,
          message.substring(0, 255),
          task.title.substring(0, 255),
          JSON.stringify({ task_id: task.id }),
        ]
      );

      sendNotification(targetUserId, {
        type: 'INTERNAL_NOTE',
        message,
        task_id: task.id,
        title: task.title,
      });

      await ActivityLogService.logTaskAction(
        targetUserId,
        taskId,
        type,
        message,
        '127.0.0.1'
      );
    } catch (error) {
      console.error('Error sending task notification:', error);
    }
  }
} 