import { Request, Response } from 'express';
import { KPIService } from '../services/KPIService';

export const KPIController = {
  /**
   * Obține toate KPI-urile DSPD
   */
  getAllKPIs: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      const period = startDate && endDate ? {
        startDate: startDate as string,
        endDate: endDate as string
      } : undefined;

      const kpiService = KPIService.getInstance();
      const kpis = await kpiService.calculateAllKPIs(period);

      res.json({
        success: true,
        data: kpis,
        period: period || {
          startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }
      });
    } catch (error) {
      console.error('Error calculating KPIs:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la calcularea KPI-urilor'
      });
    }
  },

  /**
   * Generează raport KPI complet
   */
  generateKPIReport: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      const period = startDate && endDate ? {
        startDate: startDate as string,
        endDate: endDate as string
      } : undefined;

      const kpiService = KPIService.getInstance();
      const report = await kpiService.generateKPIReport(period);

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error generating KPI report:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la generarea raportului KPI'
      });
    }
  },

  /**
   * Obține KPI-uri pentru dashboard
   */
  getDashboardKPIs: async (req: Request, res: Response) => {
    try {
      const kpiService = KPIService.getInstance();
      const kpis = await kpiService.calculateAllKPIs();

      // Extrage doar KPI-urile importante pentru dashboard
      const dashboardKPIs = {
        epidemiological: {
          totalCases: kpis.epidemiologicalMetrics.totalCasesMonitored,
          responseRate: kpis.epidemiologicalMetrics.outbreakResponseRate,
          avgResponseTime: kpis.epidemiologicalMetrics.averageResponseTime
        },
        inspection: {
          totalInspections: kpis.inspectionMetrics.totalInspections,
          complianceRate: kpis.inspectionMetrics.complianceRate,
          sanctionsApplied: kpis.inspectionMetrics.sanctionsApplied
        },
        operational: {
          vehicleEfficiency: kpis.operationalMetrics.vehicleEfficiency,
          resourceUtilization: kpis.operationalMetrics.resourceUtilization,
          operationalCosts: kpis.operationalMetrics.operationalCosts
        },
        performance: {
          taskCompletionRate: kpis.performanceMetrics.taskCompletionRate,
          reportCompletionRate: kpis.performanceMetrics.reportCompletionRate,
          userSatisfaction: kpis.performanceMetrics.userSatisfaction
        },
        summary: {
          totalEvents: kpis.eventTypeMetrics.reduce((sum, item) => sum + item.count, 0),
          totalTasks: kpis.performanceMetrics.taskCompletionRate > 0 ? 
            Math.round(kpis.performanceMetrics.taskCompletionRate * 10) : 0, // Placeholder
          totalVehicles: kpis.vehicleMetrics.totalVehicles,
          activeVehicles: kpis.vehicleMetrics.activeVehicles
        }
      };

      res.json({
        success: true,
        data: dashboardKPIs
      });
    } catch (error) {
      console.error('Error getting dashboard KPIs:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la obținerea KPI-urilor pentru dashboard'
      });
    }
  },

  /**
   * Obține KPI-uri pe departamente
   */
  getDepartmentKPIs: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      const period = startDate && endDate ? {
        startDate: startDate as string,
        endDate: endDate as string
      } : undefined;

      const kpiService = KPIService.getInstance();
      const kpis = await kpiService.calculateAllKPIs(period);

      res.json({
        success: true,
        data: kpis.departmentMetrics
      });
    } catch (error) {
      console.error('Error getting department KPIs:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la obținerea KPI-urilor pe departamente'
      });
    }
  },

  /**
   * Obține KPI-uri pe tipuri de evenimente
   */
  getEventTypeKPIs: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      const period = startDate && endDate ? {
        startDate: startDate as string,
        endDate: endDate as string
      } : undefined;

      const kpiService = KPIService.getInstance();
      const kpis = await kpiService.calculateAllKPIs(period);

      res.json({
        success: true,
        data: kpis.eventTypeMetrics
      });
    } catch (error) {
      console.error('Error getting event type KPIs:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la obținerea KPI-urilor pe tipuri de evenimente'
      });
    }
  },

  /**
   * Obține KPI-uri vehicule
   */
  getVehicleKPIs: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      const period = startDate && endDate ? {
        startDate: startDate as string,
        endDate: endDate as string
      } : undefined;

      const kpiService = KPIService.getInstance();
      const kpis = await kpiService.calculateAllKPIs(period);

      res.json({
        success: true,
        data: kpis.vehicleMetrics
      });
    } catch (error) {
      console.error('Error getting vehicle KPIs:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la obținerea KPI-urilor vehicule'
      });
    }
  }
}; 