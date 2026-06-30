import pool from '../config/database';
import { AutomatedReportService } from './AutomatedReportService';
import { ReportNotificationService } from './ReportNotificationService';

interface ScheduledTask {
  id: string;
  schedule: any;
  task: () => Promise<void>;
  isActive: boolean;
  nextRun: Date;
  interval?: NodeJS.Timeout;
  lastRun?: Date;
  lastStatus?: 'SUCCESS' | 'FAILED';
  errorCount?: number;
}

interface TaskStatus {
  id: string;
  active: boolean;
  nextRun?: Date;
  lastRun?: Date;
  lastStatus?: 'SUCCESS' | 'FAILED';
  errorCount: number;
}

export class TaskSchedulerService {
  private static instance: TaskSchedulerService;
  private tasks: Map<string, ScheduledTask> = new Map();
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): TaskSchedulerService {
    if (!TaskSchedulerService.instance) {
      TaskSchedulerService.instance = new TaskSchedulerService();
    }
    return TaskSchedulerService.instance;
  }

  /**
   * Inițializează Task Scheduler-ul
   */
  async initialize(): Promise<void> {
    console.log('🕐 Inițializez Task Scheduler-ul pentru rapoarte automate...');
    
    try {
      // Încarcă programele active din baza de date
      const [schedules] = await pool.execute(`
        SELECT * FROM automated_report_schedules 
        WHERE is_active = TRUE
      `);
      
      console.log(`📅 Găsit ${(schedules as any[]).length} programe active`);
      
      // Creează task-uri pentru fiecare program
      for (const schedule of schedules as any[]) {
        await this.createTask(schedule);
      }
      
      // Creează task-ul de curățare
      this.createCleanupTask();
      
      // Pornește scheduler-ul
      this.startScheduler();
      
      console.log('✅ Task Scheduler-ul a fost inițializat cu succes');
    } catch (error) {
      console.error('❌ Eroare la inițializarea Task Scheduler-ului:', error);
    }
  }

  /**
   * Creează un task pentru un program
   */
  async createTask(schedule: any): Promise<void> {
    try {
      const taskId = `report_${schedule.id}`;
      console.log(`🕐 Creez task pentru programul ${schedule.id}`);
      
      // Oprește task-ul existent dacă există
      if (this.tasks.has(taskId)) {
        await this.removeTask(taskId);
      }
      
      // Calculează următoarea execuție
      const nextRun = this.calculateNextRun(schedule);
      
      // Creează task-ul
      const task: ScheduledTask = {
        id: taskId,
        schedule: schedule,
        task: async () => {
          console.log(`🚀 Execut raportul automat pentru programul ${schedule.id}`);
          await this.executeScheduledReport(schedule);
        },
        isActive: true,
        nextRun: nextRun
      };
      
      this.tasks.set(taskId, task);
      console.log(`✅ Task creat pentru programul ${schedule.id}, următoarea execuție: ${nextRun.toLocaleString('ro-RO')}`);
      
    } catch (error) {
      console.error(`❌ Eroare la crearea task pentru programul ${schedule.id}:`, error);
    }
  }

  /**
   * Calculează următoarea execuție pentru un program
   */
  private calculateNextRun(schedule: any): Date {
    const now = new Date();
    const time = schedule.time.split(':');
    const hour = parseInt(time[0]);
    const minute = parseInt(time[1]);
    
    let nextRun = new Date();
    nextRun.setHours(hour, minute, 0, 0);
    
    // Dacă ora a trecut deja astăzi, programează pentru mâine
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    switch (schedule.frequency) {
      case 'DAILY':
        // Zilnic - deja calculat
        break;
      case 'WEEKLY':
        const dayOfWeek = schedule.day_of_week || 1;
        const currentDay = nextRun.getDay();
        const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
        nextRun.setDate(nextRun.getDate() + daysToAdd);
        break;
      case 'MONTHLY':
        const dayOfMonth = schedule.day_of_month || 1;
        nextRun.setDate(dayOfMonth);
        // Dacă ziua a trecut deja, programează pentru luna următoare
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
          nextRun.setDate(dayOfMonth);
        }
        break;
    }
    
    return nextRun;
  }

  /**
   * Execută un raport programat
   */
  private async executeScheduledReport(schedule: any): Promise<void> {
    try {
      console.log(`📊 Execut raportul programat: ${schedule.type}`);
      
      const report = await AutomatedReportService.getInstance().generateReport(schedule.user_id, {
        type: schedule.type,
        parameters: schedule.parameters || {}
      });
      
      await ReportNotificationService.getInstance().sendNotification(
        schedule.user_id,
        report
      );
      
      console.log(`✅ Raportul programat ${schedule.type} a fost generat cu succes`);
      
      // Actualizează următoarea execuție
      const task = this.tasks.get(`report_${schedule.id}`);
      if (task) {
        task.nextRun = this.calculateNextRun(schedule);
        task.lastRun = new Date();
        task.lastStatus = 'SUCCESS';
      }
      
    } catch (error) {
      console.error(`❌ Eroare la executarea raportului programat ${schedule.type}:`, error);
      
      // Trimite notificare de eroare
      try {
        // Trimite notificare de eroare prin WebSocket
        const { sendNotification } = require('../app');
        sendNotification(schedule.user_id, {
          id: `error_${Date.now()}`,
          type: 'ERROR',
          title: `Eroare Raport Automat: ${schedule.type}`,
          message: `A apărut o eroare la generarea raportului "${schedule.type}": ${error instanceof Error ? error.message : 'Eroare necunoscută'}`,
          createdAt: new Date().toISOString(),
          isRead: false
        });
      } catch (notifError) {
        console.error('❌ Eroare la trimiterea notificării de eroare:', notifError);
      }
      
      // Actualizează statusul task-ului
      const task = this.tasks.get(`report_${schedule.id}`);
      if (task) {
        task.lastRun = new Date();
        task.lastStatus = 'FAILED';
        task.errorCount = (task.errorCount || 0) + 1;
      }
    }
  }

  /**
   * Creează task-ul de curățare
   */
  private createCleanupTask(): void {
    const cleanupTask: ScheduledTask = {
      id: 'cleanup',
      schedule: { frequency: 'DAILY', time: '02:00' },
      task: async () => {
        console.log('🧹 Execut curățarea rapoartelor vechi...');
        await this.cleanupOldReports();
      },
      isActive: true,
      nextRun: this.calculateNextRun({ frequency: 'DAILY', time: '02:00' })
    };
    
    this.tasks.set('cleanup', cleanupTask);
    console.log('✅ Task de curățare creat (zilnic la 02:00)');
  }

  /**
   * Curăță rapoartele vechi
   */
  private async cleanupOldReports(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const [result] = await pool.execute(`
        DELETE FROM user_reports 
        WHERE created_at < ? AND status = 'COMPLETED'
      `, [thirtyDaysAgo]);
      
      console.log(`🧹 Șterse ${(result as any).affectedRows} rapoarte vechi`);
      
      // Actualizează următoarea execuție
      const task = this.tasks.get('cleanup');
      if (task) {
        task.nextRun = this.calculateNextRun({ frequency: 'DAILY', time: '02:00' });
        task.lastRun = new Date();
        task.lastStatus = 'SUCCESS';
      }
      
    } catch (error) {
      console.error('❌ Eroare la curățarea rapoartelor vechi:', error);
      
      const task = this.tasks.get('cleanup');
      if (task) {
        task.lastRun = new Date();
        task.lastStatus = 'FAILED';
        task.errorCount = (task.errorCount || 0) + 1;
      }
    }
  }

  /**
   * Pornește scheduler-ul
   */
  private startScheduler(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 Task Scheduler pornit');
    
    // Verifică la fiecare minut dacă sunt task-uri de executat
    this.checkInterval = setInterval(() => {
      this.checkAndExecuteTasks();
    }, 60000); // 1 minut
    
    // Execută imediat prima verificare
    this.checkAndExecuteTasks();
  }

  /**
   * Verifică și execută task-urile care trebuie să ruleze
   */
  private async checkAndExecuteTasks(): Promise<void> {
    const now = new Date();
    
    for (const [taskId, task] of this.tasks) {
      if (task.isActive && task.nextRun <= now) {
        console.log(`⏰ Execut task: ${taskId}`);
        
        try {
          await task.task();
        } catch (error) {
          console.error(`❌ Eroare la executarea task-ului ${taskId}:`, error);
        }
      }
    }
  }

  /**
   * Adaugă un nou program
   */
  async addSchedule(schedule: any): Promise<void> {
    await this.createTask(schedule);
  }

  /**
   * Șterge un program
   */
  async removeSchedule(scheduleId: number): Promise<void> {
    const taskId = `report_${scheduleId}`;
    await this.removeTask(taskId);
  }

  /**
   * Actualizează un program
   */
  async updateSchedule(schedule: any): Promise<void> {
    await this.removeSchedule(schedule.id);
    await this.addSchedule(schedule);
  }

  /**
   * Șterge un task
   */
  private async removeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      task.isActive = false;
      this.tasks.delete(taskId);
      console.log(`🗑️ Task șters: ${taskId}`);
    }
  }

  /**
   * Oprește toate task-urile
   */
  stopAllTasks(): void {
    console.log('🛑 Oprește toate task-urile...');
    
    this.isRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.tasks.forEach((task, taskId) => {
      task.isActive = false;
      console.log(`🛑 Task oprit: ${taskId}`);
    });
    
    this.tasks.clear();
  }

  /**
   * Returnează statusul tuturor task-urilor
   */
  getTasksStatus(): TaskStatus[] {
    const status: TaskStatus[] = [];
    
    this.tasks.forEach((task, taskId) => {
      status.push({
        id: taskId,
        active: task.isActive,
        nextRun: task.nextRun,
        lastRun: task.lastRun,
        lastStatus: task.lastStatus,
        errorCount: task.errorCount || 0
      });
    });
    
    return status;
  }

  /**
   * Testează un task specific
   */
  async testTask(scheduleId: string | number): Promise<void> {
    const taskId = `report_${scheduleId}`;
    const task = this.tasks.get(taskId);
    
    if (!task) {
      throw new Error(`Task-ul ${taskId} nu a fost găsit`);
    }
    
    console.log(`🧪 Testez task-ul: ${taskId}`);
    await task.task();
  }

  /**
   * Repornește toate task-urile
   */
  async restartAllTasks(): Promise<void> {
    console.log('🔄 Repornește toate task-urile...');
    
    // Oprește scheduler-ul curent
    this.stopAllTasks();
    
    // Reinițializează
    await this.initialize();
  }
} 