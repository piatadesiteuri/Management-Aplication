const pool = require('../config/database').default;

export interface TaskTemplate {
  id: number;
  name: string;
  description?: string;
  event_type: string;
  task_steps: any[];
  estimated_duration_hours: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskWorkflow {
  id: number;
  event_id: number;
  template_id: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  current_step: string | null;
  started_at: string;
  completed_at: string | null;
  created_by: number;
}

export interface WorkflowStep {
  step: string;
  name: string;
  description: string;
  estimated_hours: number;
}

export class TaskWorkflowService {
  private static instance: TaskWorkflowService;

  private constructor() {}

  public static getInstance(): TaskWorkflowService {
    if (!TaskWorkflowService.instance) {
      TaskWorkflowService.instance = new TaskWorkflowService();
    }
    return TaskWorkflowService.instance;
  }

  /**
   * Obține toate template-urile de task-uri
   */
  async getTaskTemplates(): Promise<TaskTemplate[]> {
    try {
      console.log('🔍 TaskWorkflowService.getTaskTemplates: Testing pool connection...');
      const [rows] = await pool.execute(
        'SELECT * FROM task_templates WHERE is_active = TRUE ORDER BY name'
      );
      console.log('✅ TaskWorkflowService.getTaskTemplates: Query successful, rows:', (rows as any[]).length);
      return rows as TaskTemplate[];
    } catch (error) {
      console.error('❌ TaskWorkflowService.getTaskTemplates: Error:', error);
      throw error;
    }
  }

  /**
   * Obține template-ul pentru un tip de eveniment
   */
  async getTemplateByEventType(eventType: string): Promise<TaskTemplate | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM task_templates WHERE event_type = ? AND is_active = TRUE',
      [eventType]
    );
    const templates = rows as TaskTemplate[];
    return templates.length > 0 ? templates[0] : null;
  }

  /**
   * Generează task-uri automat pentru un eveniment (versiune simplificată)
   */
  async generateTasksForEvent(eventId: number, eventType: string, assignedUserId: number, createdBy: number): Promise<number[]> {
    console.log('🎯 TaskWorkflowService.generateTasksForEvent called with:', { eventId, eventType, assignedUserId, createdBy });
    
    try {
      // Obține template-ul pentru tipul de eveniment
      console.log('🔍 Getting template for event type:', eventType);
      const template = await this.getTemplateByEventType(eventType);
      if (!template) {
        throw new Error(`Nu există template pentru tipul de eveniment: ${eventType}`);
      }
      console.log('✅ Template found:', template.name);

      // Creează workflow-ul
      console.log('🔄 Creating workflow...');
      const [workflowResult] = await pool.execute(
        'INSERT INTO task_workflows (event_id, template_id, status, current_step, created_by) VALUES (?, ?, ?, ?, ?)',
        [eventId, template.id, 'ACTIVE', template.task_steps[0]?.step || null, createdBy]
      );
      
      const workflowId = (workflowResult as any).insertId;
      console.log('✅ Workflow created with ID:', workflowId);

      // Generează task-urile pentru fiecare pas
      const taskIds: number[] = [];
      console.log('🔄 Generating tasks for', template.task_steps.length, 'steps...');

      for (let i = 0; i < template.task_steps.length; i++) {
        const step = template.task_steps[i] as WorkflowStep;
        console.log(`📝 Processing step ${i + 1}:`, step.name);
        
        const taskData = {
          title: `${step.name} - ${template.name}`,
          description: step.description,
          assigned_to: assignedUserId,
          assigned_by: createdBy,
          priority: template.priority,
          status: 'PENDING' as const,
          due_date: undefined,
          estimated_hours: step.estimated_hours,
          event_id: eventId,
          task_type: 'AUTO_GENERATED' as const,
          workflow_step: step.step,
          parent_task_id: i > 0 ? taskIds[i - 1] : undefined
        };

        console.log('📝 Creating task with data:', taskData);
        const [taskResult] = await pool.execute(
          'INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, status, due_date, estimated_hours, event_id, task_type, workflow_step, parent_task_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [taskData.title, taskData.description, taskData.assigned_to, taskData.assigned_by, taskData.priority, taskData.status, taskData.due_date, taskData.estimated_hours, taskData.event_id, taskData.task_type, taskData.workflow_step, taskData.parent_task_id]
        );
        const taskId = (taskResult as any).insertId;
        taskIds.push(taskId);
        console.log(`✅ Task ${i + 1} created with ID:`, taskId);
      }

      // Actualizează workflow-ul cu primul task activ
      console.log('🔄 Updating workflow with current step...');
      await pool.execute(
        'UPDATE task_workflows SET current_step = ? WHERE id = ?',
        [template.task_steps[0]?.step, workflowId]
      );

      console.log('✅ All operations completed successfully');
      console.log('🎯 Generated task IDs:', taskIds);
      return taskIds;
    } catch (error) {
      console.error('❌ Error in generateTasksForEvent:', error);
      throw error;
    }
  }

  /**
   * Obține workflow-ul pentru un eveniment
   */
  async getWorkflowForEvent(eventId: number): Promise<TaskWorkflow | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM task_workflows WHERE event_id = ? ORDER BY created_at DESC LIMIT 1',
      [eventId]
    );
    const workflows = rows as TaskWorkflow[];
    return workflows.length > 0 ? workflows[0] : null;
  }

  /**
   * Avansează workflow-ul când un task este completat
   */
  async advanceWorkflow(taskId: number, userId: number): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Obține task-ul completat
      const [taskResult] = await connection.execute(
        'SELECT * FROM tasks WHERE id = ?',
        [taskId]
      );
      const completedTask = (taskResult as any)[0];

      if (!completedTask || !completedTask.event_id) {
        throw new Error('Task-ul nu este asociat cu un eveniment');
      }

      // Obține workflow-ul
      const workflow = await this.getWorkflowForEvent(completedTask.event_id);
      if (!workflow) {
        throw new Error('Nu s-a găsit workflow-ul pentru eveniment');
      }

      // Obține template-ul
      const template = await this.getTaskTemplateById(workflow.template_id);
      if (!template) {
        throw new Error('Nu s-a găsit template-ul pentru workflow');
      }

      // Găsește următorul pas
      const currentStepIndex = template.task_steps.findIndex((step: any) => step.step === completedTask.workflow_step);
      const nextStep = template.task_steps[currentStepIndex + 1];

      if (nextStep) {
        // Activează următorul task
        const nextTask = await this.getTaskByWorkflowStep(completedTask.event_id, nextStep.step);
        if (nextTask) {
          await connection.execute(
            'UPDATE tasks SET status = ? WHERE id = ?',
            ['PENDING', nextTask.id]
          );
          
          // Actualizează workflow-ul
          await connection.execute(
            'UPDATE task_workflows SET current_step = ? WHERE id = ?',
            [nextStep.step, workflow.id]
          );
        }
      } else {
        // Workflow-ul este complet
        await connection.execute(
          'UPDATE task_workflows SET status = ?, completed_at = NOW() WHERE id = ?',
          ['COMPLETED', workflow.id]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obține template-ul după ID
   */
  async getTaskTemplateById(templateId: number): Promise<TaskTemplate | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM task_templates WHERE id = ?',
      [templateId]
    );
    const templates = rows as TaskTemplate[];
    return templates.length > 0 ? templates[0] : null;
  }

  /**
   * Obține task-ul pentru un pas specific din workflow
   */
  async getTaskByWorkflowStep(eventId: number, workflowStep: string): Promise<any | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM tasks WHERE event_id = ? AND workflow_step = ?',
      [eventId, workflowStep]
    );
    const tasks = rows as any[];
    return tasks.length > 0 ? tasks[0] : null;
  }

  /**
   * Obține toate task-urile pentru un eveniment
   */
  async getTasksForEvent(eventId: number): Promise<any[]> {
    const [rows] = await pool.execute(
      `SELECT t.*, 
              JSON_OBJECT(
                'id', at.id,
                'first_name', at.first_name,
                'last_name', at.last_name,
                'email', at.email
              ) as assigned_to_user
       FROM tasks t
       LEFT JOIN users at ON t.assigned_to = at.id
       WHERE t.event_id = ?
       ORDER BY t.created_at ASC`,
      [eventId]
    );
    return rows as any[];
  }

  /**
   * Obține progresul workflow-ului pentru un eveniment
   */
  async getWorkflowProgress(eventId: number): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    currentStep: string | null;
  }> {
    const tasks = await this.getTasksForEvent(eventId);
    const workflow = await this.getWorkflowForEvent(eventId);

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const pending = tasks.filter(t => t.status === 'PENDING').length;

    return {
      total,
      completed,
      inProgress,
      pending,
      currentStep: workflow?.current_step || null
    };
  }
} 