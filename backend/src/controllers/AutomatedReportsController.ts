import { Request, Response } from 'express';
import { AutomatedReportService, ReportType } from '../services/AutomatedReportService';
import { ReportNotificationService } from '../services/ReportNotificationService';
import { ReportSchedulerService } from '../services/ReportSchedulerService';
import pool from '../config/database';

// Funcții helper pentru generarea CSV-urilor
const generateDailyEventsCSV = (data: any): string => {
  let csv = '\uFEFF'; // BOM pentru UTF-8
  csv += `"Raport Zilnic Evenimente DSPD"\n`;
  csv += `"Data: ${data.date}"\n`;
  csv += `"Generat pentru: ${data.userContext?.name || 'N/A'}"\n\n`;
  
  csv += 'ID,Titlu,Tip,Data început,Data sfârșit,Locație,Prioritate,Status,Departament,Organizator,Vehicul\n';
  
  if (data.events) {
    data.events.forEach((event: any) => {
      csv += `${event.id},"${event.title}","${event.type}","${event.start_time}","${event.end_time}","${event.location || ''}","${event.priority}","${event.status}","${event.department_name || ''}","${event.created_by || ''}","${event.vehicle || ''}"\n`;
    });
  }
  
  return csv;
};

const generateWeeklyActivityCSV = (data: any): string => {
  let csv = '\uFEFF';
  csv += `"Raport Săptămânal Activitate Departament"\n`;
  csv += `"Perioada: ${data.period?.startDate} - ${data.period?.endDate}"\n\n`;
  
  csv += '"=== EVENIMENTE ===\n';
  csv += 'ID,Titlu,Tip,Data început,Data sfârșit,Status,Departament\n';
  
  if (data.events) {
    data.events.forEach((event: any) => {
      csv += `${event.id},"${event.title}","${event.type}","${event.start_time}","${event.end_time}","${event.status}","${event.department_name || ''}"\n`;
    });
  }
  
  csv += '\n"=== TASK-URI ===\n';
  csv += 'ID,Titlu,Status,Prioritate,Data creare,Asignat la\n';
  
  if (data.tasks) {
    data.tasks.forEach((task: any) => {
      csv += `${task.id},"${task.title}","${task.status}","${task.priority}","${task.created_at}","${task.assigned_to || ''}"\n`;
    });
  }
  
  return csv;
};

const generateMonthlyPerformanceCSV = (data: any): string => {
  let csv = '\uFEFF';
  csv += `"Raport Lunar Performanță DSPD"\n`;
  csv += `"Perioada: ${data.period?.startDate} - ${data.period?.endDate}"\n\n`;
  
  csv += '"=== METRICI EVENIMENTE ===\n';
  csv += `"Total evenimente","${data.eventMetrics?.total_events || 0}"\n`;
  csv += `"Evenimente completate","${data.eventMetrics?.completed_events || 0}"\n`;
  csv += `"Inspecții","${data.eventMetrics?.inspections || 0}"\n`;
  csv += `"Controale epidemiologice","${data.eventMetrics?.epidemiological_controls || 0}"\n\n`;
  
  csv += '"=== METRICI TASK-URI ===\n';
  csv += `"Total task-uri","${data.taskMetrics?.total_tasks || 0}"\n`;
  csv += `"Task-uri completate","${data.taskMetrics?.completed_tasks || 0}"\n`;
  csv += `"Timp mediu completare","${data.taskMetrics?.avg_completion_time || 0} ore"\n\n`;
  
  csv += '"=== METRICI VEHICULE ===\n';
  csv += `"Total vehicule","${data.vehicleMetrics?.total_vehicles || 0}"\n`;
  csv += `"Vehicule disponibile","${data.vehicleMetrics?.available_vehicles || 0}"\n`;
  csv += `"Vehicule în mentenanță","${data.vehicleMetrics?.maintenance_vehicles || 0}"\n\n`;
  
  csv += `"Scor performanță generală","${data.performanceScore || 0}%"\n`;
  
  return csv;
};

const generateVehicleMaintenanceCSV = (data: any): string => {
  let csv = '\uFEFF';
  csv += `"Alertă Mentenanță Vehicule"\n`;
  csv += `"Generat la: ${data.generatedAt}"\n\n`;
  
  csv += 'ID,Marca,Model,Număr,Kilometraj,Status,Departament,Ultima mentenanță,Kilometraj mentenanță\n';
  
  if (data.vehicles) {
    data.vehicles.forEach((vehicle: any) => {
      csv += `${vehicle.id},"${vehicle.brand}","${vehicle.model}","${vehicle.registration_number}",${vehicle.current_mileage},"${vehicle.status}","${vehicle.department_name || ''}","${vehicle.last_maintenance_date || 'N/A'}","${vehicle.last_maintenance_mileage || 'N/A'}"\n`;
    });
  }
  
  return csv;
};

const generateLowStockCSV = (data: any): string => {
  let csv = '\uFEFF';
  csv += `"Alertă Stoc Scăzut"\n`;
  csv += `"Generat la: ${data.generatedAt}"\n\n`;
  
  csv += 'ID,Nume Produs,Cod,Categorie,Unitate,Stoc Curent,Stoc Curent (raw),Min,Reorder Point,Target,De comandat,Severitate\n';
  
  if (data.products) {
    data.products.forEach((product: any) => {
      csv += `${product.id},"${product.name}","${product.code}","${product.category_name || ''}","${product.unit || ''}",${product.current_stock},${product.current_stock_raw ?? ''},${product.min_stock ?? ''},${product.reorder_point ?? ''},${product.target_level ?? ''},${product.suggested_order_qty ?? ''},"${product.severity || ''}"\n`;
    });
  }
  
  return csv;
};

const generateTaskSummaryCSV = (data: any): string => {
  let csv = '\uFEFF';
  csv += `"Sumar Completare Task-uri"\n`;
  csv += `"Perioada: ${data.period?.startDate} - ${data.period?.endDate}"\n\n`;
  
  csv += 'ID,Titlu,Status,Prioritate,Data creare,Data completare,Timp completare,Asignat la,Departament\n';
  
  if (data.tasks) {
    data.tasks.forEach((task: any) => {
      csv += `${task.id},"${task.title}","${task.status}","${task.priority}","${task.created_at}","${task.completed_at || 'N/A'}","${task.completion_time || 'N/A'}","${task.assigned_to_name || ''}","${task.department_name || ''}"\n`;
    });
  }
  
  return csv;
};

const generateUserActivityCSV = (data: any): string => {
  let csv = '\uFEFF';
  csv += `"Activitate Personală"\n`;
  csv += `"Utilizator: ${data.user?.name || data.userContext?.name || 'N/A'}"\n`;
  csv += `"Perioada: ${data.period?.startDate} - ${data.period?.endDate}"\n\n`;
  
  csv += 'ID,Utilizator,Tip Activitate,Entitate,Descriere,Data\n';
  
  if (data.activities) {
    data.activities.forEach((activity: any) => {
      const id = activity.id ?? '';
      const user = activity.user_name || activity.user_email || '';
      const type = activity.action_type || activity.type || '';
      const entity = activity.entity_type || '';
      const desc = activity.description || '';
      const created = activity.created_at || '';
      csv += `${id},"${user}","${type}","${entity}","${desc}","${created}"\n`;
    });
  }
  
  return csv;
};

export const AutomatedReportsController = {
  /**
   * Generează un raport automat
   */
  generateReport: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Utilizator neautentificat' });
      }

      const { type, parameters } = req.body;

      if (!type) {
        return res.status(400).json({ message: 'Tipul raportului este obligatoriu' });
      }

      const reportService = AutomatedReportService.getInstance();
      const notificationService = ReportNotificationService.getInstance();

      // Generează raportul
      const report = await reportService.generateReport(userId, {
        type,
        ...parameters
      });

      // Trimite notificarea
      await notificationService.sendNotification(userId, report);

      res.json({
        success: true,
        data: {
          reportId: report.id,
          title: report.title,
          type: report.type,
          generatedAt: report.generatedAt,
          status: report.status
        }
      });

    } catch (error) {
      console.error('Error generating automated report:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la generarea raportului automat'
      });
    }
  },

  /**
   * Creează un program pentru raport automat
   */
  createSchedule: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Utilizator neautentificat' });
      }

      const { type, frequency, time, dayOfWeek, dayOfMonth, parameters } = req.body;

      // Validare
      if (!type || !frequency || !time) {
        return res.status(400).json({ 
          message: 'Tipul, frecvența și ora sunt obligatorii' 
        });
      }

      // Validare frecvență
      if (frequency === 'WEEKLY' && dayOfWeek === undefined) {
        return res.status(400).json({ 
          message: 'Ziua săptămânii este obligatorie pentru rapoartele săptămânale' 
        });
      }

      if (frequency === 'MONTHLY' && dayOfMonth === undefined) {
        return res.status(400).json({ 
          message: 'Ziua lunii este obligatorie pentru rapoartele lunare' 
        });
      }

      const schedulerService = ReportSchedulerService.getInstance();
      
      const scheduleId = await schedulerService.createSchedule({
        type,
        userId,
        frequency,
        time,
        dayOfWeek,
        dayOfMonth,
        isActive: true,
        parameters: parameters || {}
      });

      res.status(201).json({
        success: true,
        data: { scheduleId }
      });

    } catch (error) {
      console.error('Error creating schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la crearea programului'
      });
    }
  },

  /**
   * Obține programele utilizatorului
   */
  getUserSchedules: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Utilizator neautentificat' });
      }

      const schedulerService = ReportSchedulerService.getInstance();
      const schedules = await schedulerService.getUserSchedules(userId);

      res.json({
        success: true,
        data: schedules
      });

    } catch (error) {
      console.error('Error getting user schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la obținerea programelor'
      });
    }
  },

  /**
   * Actualizează un program
   */
  updateSchedule: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { scheduleId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: 'Utilizator neautentificat' });
      }

      const updates = req.body;
      const schedulerService = ReportSchedulerService.getInstance();

      await schedulerService.updateSchedule(scheduleId, updates);

      res.json({
        success: true,
        message: 'Program actualizat cu succes'
      });

    } catch (error) {
      console.error('Error updating schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la actualizarea programului'
      });
    }
  },

  /**
   * Șterge un program
   */
  deleteSchedule: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { scheduleId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: 'Utilizator neautentificat' });
      }

      const schedulerService = ReportSchedulerService.getInstance();
      await schedulerService.deleteSchedule(scheduleId);

      res.json({
        success: true,
        message: 'Program șters cu succes'
      });

    } catch (error) {
      console.error('Error deleting schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la ștergerea programului'
      });
    }
  },

  /**
   * Obține tipurile de rapoarte disponibile
   */
  getReportTypes: async (req: Request, res: Response) => {
    try {
      const reportTypes = [
        {
          type: 'DAILY_EVENTS_SUMMARY',
          name: 'Raport Zilnic Evenimente',
          description: 'Listă + status pentru evenimentele din ziua curentă (și ce urmează imediat). Util pentru briefing-ul de dimineață.',
          frequency: ['DAILY'],
          icon: '📅',
          includes: [
            'Evenimente: titlu, tip, interval, status, departament, prioritate',
            'Totaluri rapide (câte evenimente sunt, câte sunt urgente)'
          ],
          whenToUse: 'Când vrei să vezi rapid ce e planificat azi și ce necesită atenție.'
        },
        {
          type: 'WEEKLY_DEPARTMENT_ACTIVITY',
          name: 'Raport Săptămânal Activitate Departamente',
          description: 'Activitate pe ultima săptămână: evenimente + task-uri, cu statistici pe status/prioritate. Bun pentru management.',
          frequency: ['WEEKLY'],
          icon: '📊',
          includes: [
            'Evenimente din perioadă (listă scurtă + statistici)',
            'Task-uri din perioadă (listă scurtă + statistici)',
            'Perioadă raport (start/end)'
          ],
          whenToUse: 'Când vrei o imagine săptămânală: ce s-a făcut și ce a rămas în urmă.'
        },
        {
          type: 'MONTHLY_DSPD_PERFORMANCE',
          name: 'Raport Lunar Performanță Operațională',
          description: 'KPI-uri lunare (evenimente/task-uri/vehicule) + scor agregat. Util pentru rapoarte către conducere.',
          frequency: ['MONTHLY'],
          icon: '📈',
          includes: [
            'KPI evenimente (total, completate, categorii)',
            'KPI task-uri (total, completate, timp mediu)',
            'KPI vehicule (disponibile/mentenanță)',
            'Scor performanță (agregat)'
          ],
          whenToUse: 'Când vrei să compari luna curentă cu lunile anterioare (tendințe).'
        },
        {
          type: 'VEHICLE_MAINTENANCE_ALERT',
          name: 'Alertă Mentenanță Vehicule',
          description: 'Avertizări pentru vehicule ce necesită revizie/mentenanță (kilometraj, status, ultimă revizie).',
          frequency: ['DAILY', 'WEEKLY'],
          icon: '🚗',
          includes: [
            'Vehicule în mentenanță / aproape de prag',
            'Ultima revizie + kilometraj'
          ],
          whenToUse: 'Când vrei să previi indisponibilități neplanificate.'
        },
        {
          type: 'LOW_STOCK_ALERT',
          name: 'Alertă Stoc Scăzut',
          description: 'Produse sub prag (reorder point). Ajută magazionerul și adminul să evite lipsurile.',
          frequency: ['DAILY', 'WEEKLY'],
          icon: '📦',
          includes: [
            'Produse cu stoc curent + prag reîncărcare',
            'Prioritizare pe cât de critic e deficitul'
          ],
          whenToUse: 'Când vrei să vezi ce trebuie comandat urgent.'
        },
        {
          type: 'TASK_COMPLETION_SUMMARY',
          name: 'Sumar Completare Task-uri',
          description: 'Statistici task-uri pe perioadă: completate, întârzieri, priorități. Bun pentru follow-up.',
          frequency: ['WEEKLY', 'MONTHLY'],
          icon: '✅',
          includes: [
            'Task-uri (status/prioritate)',
            'Timp completare + eventual întârzieri',
            'Totaluri pe departament'
          ],
          whenToUse: 'Când vrei să verifici execuția și disciplinele operaționale.'
        },
        {
          type: 'USER_ACTIVITY_SUMMARY',
          name: 'Sumar Activitate Personală',
          description: 'Activitatea utilizatorului (acțiuni relevante/log-uri) pe perioadă. Util pentru audit.',
          frequency: ['MONTHLY'],
          icon: '👤',
          includes: [
            'Acțiuni/activități (descriere, dată, status)',
            'Perioadă raport'
          ],
          whenToUse: 'Când ai nevoie de trasabilitate (cine a făcut ce și când).'
        }
      ];

      res.json({
        success: true,
        data: reportTypes
      });

    } catch (error) {
      console.error('Error getting report types:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la obținerea tipurilor de rapoarte'
      });
    }
  },

  /**
   * Execută manual un raport programat
   */
  executeScheduledReport: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { scheduleId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: 'Utilizator neautentificat' });
      }

      const schedulerService = ReportSchedulerService.getInstance();
      const schedules = await schedulerService.getUserSchedules(userId);
      
      const schedule = schedules.find(s => s.id === scheduleId);
      if (!schedule) {
        return res.status(404).json({ message: 'Programul nu a fost găsit' });
      }

      // Execută raportul manual
      const reportService = AutomatedReportService.getInstance();
      const notificationService = ReportNotificationService.getInstance();

      const report = await reportService.generateReport(schedule.userId, {
        type: schedule.type,
        ...schedule.parameters
      });

      await notificationService.sendNotification(schedule.userId, report);

      res.json({
        success: true,
        data: {
          reportId: report.id,
          title: report.title,
          executedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error executing scheduled report:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la executarea raportului programat'
      });
    }
  },

  /**
   * Obține rapoartele generate pentru un utilizator
   */
  getUserReports: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      console.log('🔍 getUserReports: userId =', userId);
      
      if (!userId) {
        return res.status(401).json({ message: 'Utilizator neautentificat' });
      }

      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
      const limitRaw = parseInt(String(req.query.limit || '10'), 10) || 10;
      const limit = Math.min(Math.max(1, limitRaw), 100);
      const offset = (page - 1) * limit;

      console.log('🔍 getUserReports: Executing paginated query...', { page, limit, offset });

      // NOTE: Some MySQL setups/drivers reject bound parameters for LIMIT/OFFSET.
      // We clamp and interpolate safe integers to avoid ER_WRONG_ARGUMENTS.
      const [reports] = await pool.execute(`
        SELECT id, template_id, name, status, created_at
        FROM user_reports 
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ${Number(offset)}, ${Number(limit)}
      `, [userId]);
      
      const [totalRows] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM user_reports
        WHERE user_id = ?
      `, [userId]);
      const total = (totalRows as any[])[0]?.total ?? 0;
      const pages = Math.max(1, Math.ceil(total / limit));
      
      console.log('🔍 getUserReports: reports found =', reports);

      res.json({
        success: true,
        data: {
          reports,
          pagination: {
            page,
            limit,
            total,
            pages
          }
        }
      });

    } catch (error) {
      console.error('❌ Error getting user reports:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la obținerea rapoartelor'
      });
    }
  },

  /**
   * Obține detaliile unui raport
   */
  getReportDetails: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { reportId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: 'Utilizator neautentificat' });
      }

      const [reports] = await pool.execute(`
        SELECT * FROM user_reports 
        WHERE id = ? AND user_id = ?
      `, [reportId, userId]);

      if ((reports as any[]).length === 0) {
        return res.status(404).json({ message: 'Raportul nu a fost găsit' });
      }

      const report = (reports as any[])[0];
      
      // Parsează datele JSON
      try {
        if (typeof report.data === 'string') {
          report.data = JSON.parse(report.data);
        }
        if (typeof report.parameters === 'string') {
          report.parameters = JSON.parse(report.parameters);
        }
      } catch (parseError) {
        console.warn('Error parsing report JSON data:', parseError);
      }

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      console.error('Error getting report details:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la obținerea detaliilor raportului'
      });
    }
  },

  /**
   * Șterge un raport
   */
  deleteReport: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { reportId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: 'Utilizator neautentificat' });
      }

      await pool.execute(`
        DELETE FROM user_reports 
        WHERE id = ? AND user_id = ?
      `, [reportId, userId]);

      res.json({
        success: true,
        message: 'Raport șters cu succes'
      });

    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la ștergerea raportului'
      });
    }
  },

  /**
   * Exportă un raport în format CSV
   */
  exportReport: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { reportId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: 'Utilizator neautentificat' });
      }

      const [reports] = await pool.execute(`
        SELECT * FROM user_reports 
        WHERE id = ? AND user_id = ?
      `, [reportId, userId]);

      if ((reports as any[]).length === 0) {
        return res.status(404).json({ message: 'Raportul nu a fost găsit' });
      }

      const report = (reports as any[])[0];
      let reportData;
      
      try {
        console.log('🔍 Report data type:', typeof report.data);
        console.log('🔍 Report data:', report.data);
        
        // Verifică dacă datele sunt deja un obiect sau un string JSON
        if (typeof report.data === 'string') {
          reportData = JSON.parse(report.data);
        } else {
          reportData = report.data;
        }
        
        console.log('🔍 Report data after processing:', reportData);
      } catch (parseError) {
        console.error('❌ Error parsing report data:', parseError);
        return res.status(500).json({ message: 'Datele raportului sunt corupte' });
      }

      // Verifică că reportData nu este undefined
      if (!reportData) {
        return res.status(500).json({ message: 'Datele raportului sunt invalide' });
      }

      // Generează CSV în funcție de tipul raportului
      let csvContent = '';
      let fileName = '';

      // TypeScript nu înțelege că reportData nu este undefined după verificare
      const safeReportData = reportData as any;

      switch (report.template_id) {
        case 'DAILY_EVENTS_SUMMARY':
          fileName = `raport-zilnic-evenimente-${new Date().toISOString().split('T')[0]}.csv`;
          csvContent = generateDailyEventsCSV(safeReportData);
          break;
          
        case 'WEEKLY_DEPARTMENT_ACTIVITY':
          fileName = `raport-saptamanal-activitate-${new Date().toISOString().split('T')[0]}.csv`;
          csvContent = generateWeeklyActivityCSV(safeReportData);
          break;
          
        case 'MONTHLY_DSPD_PERFORMANCE':
          fileName = `raport-lunar-performanta-${new Date().toISOString().split('T')[0]}.csv`;
          csvContent = generateMonthlyPerformanceCSV(safeReportData);
          break;
          
        case 'VEHICLE_MAINTENANCE_ALERT':
          fileName = `alerta-mentenanta-vehicule-${new Date().toISOString().split('T')[0]}.csv`;
          csvContent = generateVehicleMaintenanceCSV(safeReportData);
          break;
          
        case 'LOW_STOCK_ALERT':
          fileName = `alerta-stoc-scazut-${new Date().toISOString().split('T')[0]}.csv`;
          csvContent = generateLowStockCSV(safeReportData);
          break;
          
        case 'TASK_COMPLETION_SUMMARY':
          fileName = `sumar-task-uri-${new Date().toISOString().split('T')[0]}.csv`;
          csvContent = generateTaskSummaryCSV(safeReportData);
          break;
          
        case 'USER_ACTIVITY_SUMMARY':
          fileName = `activitate-personala-${new Date().toISOString().split('T')[0]}.csv`;
          csvContent = generateUserActivityCSV(safeReportData);
          break;
          
        default:
          return res.status(400).json({ message: 'Tip de raport necunoscut' });
      }

      // Setez headerele pentru download
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'no-cache');

      // Trimitem conținutul CSV
      res.send(csvContent);

    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la exportul raportului'
      });
    }
  },

  // Obține statusul task-urilor programate
  getCronJobsStatus: async (req: Request, res: Response) => {
    try {
      const { TaskSchedulerService } = require('../services/TaskSchedulerService');
      const taskScheduler = TaskSchedulerService.getInstance();
      const status = taskScheduler.getTasksStatus();
      
      res.json({
        jobs: status,
        totalJobs: status.length,
        activeJobs: status.filter((job: any) => job.active).length
      });
    } catch (error) {
      console.error('Error getting task scheduler status:', error);
      res.status(500).json({ message: 'Eroare la obținerea statusului task-urilor programate' });
    }
  },

  // Testează un task specific
  testCronJob: async (req: Request, res: Response) => {
    try {
      const { scheduleId } = req.params;
      const { TaskSchedulerService } = require('../services/TaskSchedulerService');
      const taskScheduler = TaskSchedulerService.getInstance();
      
      // Obțin programul din baza de date
      const [schedules] = await pool.execute(`
        SELECT * FROM automated_report_schedules 
        WHERE id = ?
      `, [scheduleId]);

      if ((schedules as any[]).length === 0) {
        return res.status(404).json({ message: 'Programul nu a fost găsit' });
      }

      const schedule = (schedules as any[])[0];
      
      // Testez task-ul
      console.log(`🧪 Testez execuția task-ului pentru programul ${scheduleId}`);
      await taskScheduler.testTask(schedule.id);

      res.json({
        message: 'Test executat cu succes',
        schedule: {
          id: schedule.id,
          type: schedule.type,
          frequency: schedule.frequency,
          time: schedule.time
        }
      });
    } catch (error) {
      console.error('Error testing task:', error);
      res.status(500).json({ message: 'Eroare la testarea task-ului' });
    }
  },

  // Oprește toate task-urile
  stopAllCronJobs: async (req: Request, res: Response) => {
    try {
      const { TaskSchedulerService } = require('../services/TaskSchedulerService');
      const taskScheduler = TaskSchedulerService.getInstance();
      taskScheduler.stopAllTasks();
      
      res.json({ message: 'Toate task-urile au fost oprite' });
    } catch (error) {
      console.error('Error stopping tasks:', error);
      res.status(500).json({ message: 'Eroare la oprirea task-urilor' });
    }
  },

  // Repornește task-urile
  restartCronJobs: async (req: Request, res: Response) => {
    try {
      const { TaskSchedulerService } = require('../services/TaskSchedulerService');
      const taskScheduler = TaskSchedulerService.getInstance();
      
      // Repornește toate task-urile
      await taskScheduler.restartAllTasks();
      
      res.json({ message: 'Task-urile au fost repornite cu succes' });
    } catch (error) {
      console.error('Error restarting tasks:', error);
      res.status(500).json({ message: 'Eroare la repornirea task-urilor' });
    }
  }
}; 