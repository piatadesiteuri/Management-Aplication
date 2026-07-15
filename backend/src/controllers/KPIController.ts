import { Request, Response } from 'express';
import { KPIService } from '../services/KPIService';

function resolvePeriod(query: Request['query']): { startDate: string; endDate: string } | undefined {
  const { startDate, endDate, period } = query;
  if (startDate && endDate) {
    return { startDate: String(startDate), endDate: String(endDate) };
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  switch (period) {
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    }
    case 'last_quarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3 - 3;
      const start = new Date(now.getFullYear(), quarterStartMonth, 1);
      const end = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    }
    case 'current':
    default:
      return {
        startDate: `${now.getFullYear()}-01-01`,
        endDate: today,
      };
  }
}

export const KPIController = {
  /**
   * Obține toate KPI-urile
   */
  getAllKPIs: async (req: Request, res: Response) => {
    try {
      const period = resolvePeriod(req.query);
      const kpiService = KPIService.getInstance();
      const kpis = await kpiService.calculateAllKPIs(period);

      res.json({
        success: true,
        data: kpis,
        period: period || {
          startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        },
      });
    } catch (error) {
      console.error('Error calculating KPIs:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la calcularea KPI-urilor',
      });
    }
  },

  /**
   * Generează raport KPI complet
   */
  generateKPIReport: async (req: Request, res: Response) => {
    try {
      const period = resolvePeriod(req.query);
      const kpiService = KPIService.getInstance();
      const report = await kpiService.generateKPIReport(period);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Error generating KPI report:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la generarea raportului KPI',
      });
    }
  },

  /**
   * Obține KPI-uri pentru dashboard executive
   */
  getDashboardKPIs: async (req: Request, res: Response) => {
    try {
      const period = resolvePeriod(req.query);
      const kpiService = KPIService.getInstance();
      const dashboardKPIs = await kpiService.calculateDashboardKPIs(period);

      res.json({
        success: true,
        data: dashboardKPIs,
      });
    } catch (error) {
      console.error('Error getting dashboard KPIs:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la obținerea KPI-urilor pentru dashboard',
      });
    }
  },

  /**
   * Obține KPI-uri pe departamente
   */
  getDepartmentKPIs: async (req: Request, res: Response) => {
    try {
      const period = resolvePeriod(req.query);
      const kpiService = KPIService.getInstance();
      const kpis = await kpiService.calculateAllKPIs(period);

      res.json({
        success: true,
        data: kpis.departmentMetrics,
      });
    } catch (error) {
      console.error('Error getting department KPIs:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la obținerea KPI-urilor pe departamente',
      });
    }
  },

  /**
   * Obține KPI-uri pe tipuri de evenimente
   */
  getEventTypeKPIs: async (req: Request, res: Response) => {
    try {
      const period = resolvePeriod(req.query);
      const kpiService = KPIService.getInstance();
      const kpis = await kpiService.calculateAllKPIs(period);

      res.json({
        success: true,
        data: kpis.eventTypeMetrics,
      });
    } catch (error) {
      console.error('Error getting event type KPIs:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la obținerea KPI-urilor pe tipuri de evenimente',
      });
    }
  },

  /**
   * Obține KPI-uri vehicule
   */
  getVehicleKPIs: async (req: Request, res: Response) => {
    try {
      const period = resolvePeriod(req.query);
      const kpiService = KPIService.getInstance();
      const kpis = await kpiService.calculateAllKPIs(period);

      res.json({
        success: true,
        data: kpis.vehicleMetrics,
      });
    } catch (error) {
      console.error('Error getting vehicle KPIs:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la obținerea KPI-urilor vehicule',
      });
    }
  },
};
