import pool from '../config/database';
import { AutomatedReportService, ReportSchedule, ReportType } from './AutomatedReportService';
import { ReportNotificationService } from './ReportNotificationService';

export class ReportSchedulerService {
  private static instance: ReportSchedulerService;
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.initializeScheduledReports();
  }

  public static getInstance(): ReportSchedulerService {
    if (!ReportSchedulerService.instance) {
      ReportSchedulerService.instance = new ReportSchedulerService();
    }
    return ReportSchedulerService.instance;
  }

  /**
   * Inițializează rapoartele programate din baza de date
   */
  private async initializeScheduledReports(): Promise<void> {
    try {
      console.log('📅 ReportSchedulerService: Initializing scheduled reports...');
      
      const [schedules] = await pool.execute(`
        SELECT * FROM automated_report_schedules WHERE is_active = TRUE
      `);

      for (const schedule of schedules as any[]) {
        await this.scheduleReport(schedule);
      }

      console.log(`✅ ReportSchedulerService: Initialized ${(schedules as any[]).length} scheduled reports`);
    } catch (error) {
      console.error('❌ ReportSchedulerService: Error initializing scheduled reports:', error);
    }
  }

  /**
   * Programează un raport automat
   */
  async scheduleReport(scheduleConfig: ReportSchedule): Promise<void> {
    try {
      console.log('📅 ReportSchedulerService: Scheduling report:', scheduleConfig.id);
      
      // Calculează următoarea execuție
      const nextExecution = this.calculateNextExecution(scheduleConfig);
      
      if (!nextExecution) {
        console.log('⚠️ ReportSchedulerService: Invalid schedule configuration');
        return;
      }

      // Calculează timpul până la următoarea execuție
      const timeUntilNext = nextExecution.getTime() - Date.now();
      
      if (timeUntilNext <= 0) {
        console.log('⚠️ ReportSchedulerService: Next execution is in the past, skipping');
        return;
      }

      // Programează job-ul
      const jobId = `report_${scheduleConfig.id}`;
      
      // Anulează job-ul existent dacă există
      if (this.scheduledJobs.has(jobId)) {
        clearTimeout(this.scheduledJobs.get(jobId)!);
      }

      const job = setTimeout(async () => {
        await this.executeScheduledReport(scheduleConfig);
        // Reprogramează pentru următoarea execuție
        await this.scheduleReport(scheduleConfig);
      }, timeUntilNext);

      this.scheduledJobs.set(jobId, job);

      console.log(`✅ ReportSchedulerService: Scheduled report ${scheduleConfig.id} for ${nextExecution.toISOString()}`);

    } catch (error) {
      console.error('❌ ReportSchedulerService: Error scheduling report:', error);
    }
  }

  /**
   * Execută un raport programat
   */
  private async executeScheduledReport(schedule: ReportSchedule): Promise<void> {
    try {
      console.log('🚀 ReportSchedulerService: Executing scheduled report:', schedule.id);
      
      const reportService = AutomatedReportService.getInstance();
      const notificationService = ReportNotificationService.getInstance();

      // Generează raportul
      const report = await reportService.generateReport(schedule.userId, {
        type: schedule.type,
        ...schedule.parameters
      });

      // Trimite notificarea
      await notificationService.sendNotification(schedule.userId, report);

      console.log('✅ ReportSchedulerService: Scheduled report executed successfully');

    } catch (error) {
      console.error('❌ ReportSchedulerService: Error executing scheduled report:', error);
    }
  }

  /**
   * Calculează următoarea execuție pentru un program
   */
  private calculateNextExecution(schedule: ReportSchedule): Date | null {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    let nextExecution = new Date();
    nextExecution.setHours(hours, minutes, 0, 0);

    switch (schedule.frequency) {
      case 'DAILY':
        // Dacă ora de azi a trecut, programează pentru mâine
        if (nextExecution <= now) {
          nextExecution.setDate(nextExecution.getDate() + 1);
        }
        break;

      case 'WEEKLY':
        if (schedule.dayOfWeek === undefined) {
          return null;
        }
        
        // Calculează următoarea zi a săptămânii
        const currentDay = now.getDay();
        const targetDay = schedule.dayOfWeek;
        
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd <= 0) {
          daysToAdd += 7;
        }
        
        nextExecution.setDate(nextExecution.getDate() + daysToAdd);
        
        // Dacă ora a trecut, programează pentru săptămâna următoare
        if (nextExecution <= now) {
          nextExecution.setDate(nextExecution.getDate() + 7);
        }
        break;

      case 'MONTHLY':
        if (schedule.dayOfMonth === undefined) {
          return null;
        }
        
        // Calculează următoarea zi a lunii
        const currentDayOfMonth = now.getDate();
        const targetDayOfMonth = schedule.dayOfMonth;
        
        if (currentDayOfMonth >= targetDayOfMonth) {
          // Programează pentru luna următoare
          nextExecution.setMonth(nextExecution.getMonth() + 1);
        }
        
        nextExecution.setDate(targetDayOfMonth);
        
        // Dacă ora a trecut, programează pentru luna următoare
        if (nextExecution <= now) {
          nextExecution.setMonth(nextExecution.getMonth() + 1);
        }
        break;

      default:
        return null;
    }

    return nextExecution;
  }

  /**
   * Creează un program nou pentru raport
   */
  async createSchedule(schedule: Omit<ReportSchedule, 'id'>): Promise<string> {
    try {
      const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await pool.execute(`
        INSERT INTO automated_report_schedules (
          id, type, user_id, frequency, time, day_of_week, day_of_month, 
          is_active, parameters, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        scheduleId,
        schedule.type,
        schedule.userId,
        schedule.frequency,
        schedule.time,
        schedule.dayOfWeek || null,
        schedule.dayOfMonth || null,
        schedule.isActive,
        JSON.stringify(schedule.parameters || {})
      ]);

      // Programează raportul dacă este activ
      if (schedule.isActive) {
        await this.scheduleReport({ ...schedule, id: scheduleId });
      }

      console.log('✅ ReportSchedulerService: Created new schedule:', scheduleId);
      return scheduleId;

    } catch (error) {
      console.error('❌ ReportSchedulerService: Error creating schedule:', error);
      throw error;
    }
  }

  /**
   * Actualizează un program existent
   */
  async updateSchedule(scheduleId: string, updates: Partial<ReportSchedule>): Promise<void> {
    try {
      // Construiește query-ul de update
      const updateFields: string[] = [];
      const updateParams: any[] = [];

      if (updates.type !== undefined) {
        updateFields.push('type = ?');
        updateParams.push(updates.type);
      }

      if (updates.frequency !== undefined) {
        updateFields.push('frequency = ?');
        updateParams.push(updates.frequency);
      }

      if (updates.time !== undefined) {
        updateFields.push('time = ?');
        updateParams.push(updates.time);
      }

      if (updates.dayOfWeek !== undefined) {
        updateFields.push('day_of_week = ?');
        updateParams.push(updates.dayOfWeek);
      }

      if (updates.dayOfMonth !== undefined) {
        updateFields.push('day_of_month = ?');
        updateParams.push(updates.dayOfMonth);
      }

      if (updates.isActive !== undefined) {
        updateFields.push('is_active = ?');
        updateParams.push(updates.isActive);
      }

      if (updates.parameters !== undefined) {
        updateFields.push('parameters = ?');
        updateParams.push(JSON.stringify(updates.parameters));
      }

      if (updateFields.length === 0) {
        return;
      }

      updateFields.push('updated_at = NOW()');
      updateParams.push(scheduleId);

      await pool.execute(`
        UPDATE automated_report_schedules 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `, updateParams);

      // Reprogramează dacă este activ
      if (updates.isActive !== false) {
        const [schedules] = await pool.execute(`
          SELECT * FROM automated_report_schedules WHERE id = ?
        `, [scheduleId]);

        if ((schedules as any[]).length > 0) {
          await this.scheduleReport((schedules as any[])[0]);
        }
      } else {
        // Anulează job-ul dacă este dezactivat
        const jobId = `report_${scheduleId}`;
        if (this.scheduledJobs.has(jobId)) {
          clearTimeout(this.scheduledJobs.get(jobId)!);
          this.scheduledJobs.delete(jobId);
        }
      }

      console.log('✅ ReportSchedulerService: Updated schedule:', scheduleId);

    } catch (error) {
      console.error('❌ ReportSchedulerService: Error updating schedule:', error);
      throw error;
    }
  }

  /**
   * Șterge un program
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    try {
      // Anulează job-ul
      const jobId = `report_${scheduleId}`;
      if (this.scheduledJobs.has(jobId)) {
        clearTimeout(this.scheduledJobs.get(jobId)!);
        this.scheduledJobs.delete(jobId);
      }

      // Șterge din baza de date
      await pool.execute(`
        DELETE FROM automated_report_schedules WHERE id = ?
      `, [scheduleId]);

      console.log('✅ ReportSchedulerService: Deleted schedule:', scheduleId);

    } catch (error) {
      console.error('❌ ReportSchedulerService: Error deleting schedule:', error);
      throw error;
    }
  }

  /**
   * Obține toate programele pentru un utilizator
   */
  async getUserSchedules(userId: number): Promise<ReportSchedule[]> {
    try {
      const [schedules] = await pool.execute(`
        SELECT * FROM automated_report_schedules 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `, [userId]);

      return (schedules as any[]).map(schedule => ({
        id: schedule.id,
        type: schedule.type,
        userId: schedule.user_id,
        frequency: schedule.frequency,
        time: schedule.time,
        dayOfWeek: schedule.day_of_week,
        dayOfMonth: schedule.day_of_month,
        isActive: schedule.is_active === 1,
        parameters: JSON.parse(schedule.parameters || '{}')
      }));

    } catch (error) {
      console.error('❌ ReportSchedulerService: Error getting user schedules:', error);
      return [];
    }
  }

  /**
   * Obține toate programele active
   */
  async getAllActiveSchedules(): Promise<ReportSchedule[]> {
    try {
      const [schedules] = await pool.execute(`
        SELECT * FROM automated_report_schedules 
        WHERE is_active = TRUE 
        ORDER BY created_at DESC
      `);

      return (schedules as any[]).map(schedule => ({
        id: schedule.id,
        type: schedule.type,
        userId: schedule.user_id,
        frequency: schedule.frequency,
        time: schedule.time,
        dayOfWeek: schedule.day_of_week,
        dayOfMonth: schedule.day_of_month,
        isActive: schedule.is_active === 1,
        parameters: JSON.parse(schedule.parameters || '{}')
      }));

    } catch (error) {
      console.error('❌ ReportSchedulerService: Error getting all schedules:', error);
      return [];
    }
  }

  /**
   * Execută toate rapoartele programate pentru ziua curentă
   */
  async executeDailyReports(): Promise<void> {
    try {
      console.log('🌅 ReportSchedulerService: Executing daily reports...');
      
      const today = new Date();
      const dayOfWeek = today.getDay();
      const dayOfMonth = today.getDate();
      const currentTime = today.toTimeString().substr(0, 5);

      const [schedules] = await pool.execute(`
        SELECT * FROM automated_report_schedules 
        WHERE is_active = TRUE 
        AND (
          (frequency = 'DAILY' AND time <= ?) OR
          (frequency = 'WEEKLY' AND day_of_week = ? AND time <= ?) OR
          (frequency = 'MONTHLY' AND day_of_month = ? AND time <= ?)
        )
      `, [currentTime, dayOfWeek, currentTime, dayOfMonth, currentTime]);

      console.log(`📊 ReportSchedulerService: Found ${(schedules as any[]).length} reports to execute today`);

      for (const schedule of schedules as any[]) {
        try {
          await this.executeScheduledReport({
            id: schedule.id,
            type: schedule.type,
            userId: schedule.user_id,
            frequency: schedule.frequency,
            time: schedule.time,
            dayOfWeek: schedule.day_of_week,
            dayOfMonth: schedule.day_of_month,
            isActive: schedule.is_active === 1,
            parameters: JSON.parse(schedule.parameters || '{}')
          });
        } catch (error) {
          console.error(`❌ ReportSchedulerService: Error executing schedule ${schedule.id}:`, error);
        }
      }

      console.log('✅ ReportSchedulerService: Daily reports execution completed');

    } catch (error) {
      console.error('❌ ReportSchedulerService: Error executing daily reports:', error);
    }
  }

  /**
   * Oprește serviciul și curăță job-urile
   */
  stop(): void {
    console.log('🛑 ReportSchedulerService: Stopping scheduler...');
    
    for (const [jobId, job] of this.scheduledJobs) {
      clearTimeout(job);
      console.log(`🛑 Cleared job: ${jobId}`);
    }
    
    this.scheduledJobs.clear();
  }
} 