import api from './api';

export interface DSPDKPI {
  epidemiologicalMetrics: {
    totalCasesMonitored: number;
    outbreakResponseRate: number;
    averageResponseTime: number;
    inspectionCompletionRate: number;
  };
  
  inspectionMetrics: {
    totalInspections: number;
    complianceRate: number;
    sanctionsApplied: number;
    averageProcessingTime: number;
  };
  
  operationalMetrics: {
    vehicleEfficiency: number;
    resourceUtilization: number;
    averageResponseTime: number;
    operationalCosts: number;
  };
  
  performanceMetrics: {
    taskCompletionRate: number;
    reportCompletionRate: number;
    averageApprovalTime: number;
    userSatisfaction: number;
  };
  
  departmentMetrics: {
    departmentId: number;
    departmentName: string;
    eventsCount: number;
    tasksCount: number;
    completionRate: number;
    costPerDepartment: number;
  }[];
  
  eventTypeMetrics: {
    eventType: string;
    count: number;
    completionRate: number;
    averageDuration: number;
  }[];
  
  vehicleMetrics: {
    totalVehicles: number;
    activeVehicles: number;
    totalDistance: number;
    totalFuelConsumption: number;
    averageEfficiency: number;
    maintenanceCosts: number;
  };
}

export interface DashboardKPIs {
  epidemiological: {
    totalCases: number;
    responseRate: number;
    avgResponseTime: number;
  };
  inspection: {
    totalInspections: number;
    complianceRate: number;
    sanctionsApplied: number;
  };
  operational: {
    vehicleEfficiency: number;
    resourceUtilization: number;
    operationalCosts: number;
  };
  performance: {
    taskCompletionRate: number;
    reportCompletionRate: number;
    userSatisfaction: number;
  };
  summary: {
    totalEvents: number;
    totalTasks: number;
    totalVehicles: number;
    activeVehicles: number;
  };
}

export class KPIService {
  /**
   * Obține toate KPI-urile DSPD
   */
  static async getAllKPIs(period?: { startDate: string; endDate: string }): Promise<DSPDKPI> {
    const params = new URLSearchParams();
    if (period) {
      params.append('startDate', period.startDate);
      params.append('endDate', period.endDate);
    }

    const response = await api.get(`/kpis?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Generează raport KPI complet
   */
  static async generateKPIReport(period?: { startDate: string; endDate: string }): Promise<{
    kpis: DSPDKPI;
    generatedAt: string;
    period: { startDate: string; endDate: string };
  }> {
    const params = new URLSearchParams();
    if (period) {
      params.append('startDate', period.startDate);
      params.append('endDate', period.endDate);
    }

    const response = await api.get(`/kpis/report?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Obține KPI-uri pentru dashboard
   */
  static async getDashboardKPIs(): Promise<DashboardKPIs> {
    const response = await api.get('/kpis/dashboard');
    return response.data.data;
  }

  /**
   * Obține KPI-uri pe departamente
   */
  static async getDepartmentKPIs(period?: { startDate: string; endDate: string }): Promise<DSPDKPI['departmentMetrics']> {
    const params = new URLSearchParams();
    if (period) {
      params.append('startDate', period.startDate);
      params.append('endDate', period.endDate);
    }

    const response = await api.get(`/kpis/departments?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Obține KPI-uri pe tipuri de evenimente
   */
  static async getEventTypeKPIs(period?: { startDate: string; endDate: string }): Promise<DSPDKPI['eventTypeMetrics']> {
    const params = new URLSearchParams();
    if (period) {
      params.append('startDate', period.startDate);
      params.append('endDate', period.endDate);
    }

    const response = await api.get(`/kpis/event-types?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Obține KPI-uri vehicule
   */
  static async getVehicleKPIs(period?: { startDate: string; endDate: string }): Promise<DSPDKPI['vehicleMetrics']> {
    const params = new URLSearchParams();
    if (period) {
      params.append('startDate', period.startDate);
      params.append('endDate', period.endDate);
    }

    const response = await api.get(`/kpis/vehicles?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Formatează procentaj pentru afișare
   */
  static formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
  }

  /**
   * Formatează numărul pentru afișare
   */
  static formatNumber(value: number): string {
    return value.toLocaleString('ro-RO');
  }

  /**
   * Formatează costul pentru afișare
   */
  static formatCost(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(Number(value))) return '—';
    return `${Number(value).toLocaleString('ro-RO')} RON`;
  }

  /**
   * Formatează timpul pentru afișare
   */
  static formatTime(hours: number): string {
    if (hours < 24) {
      return `${Math.round(hours)}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}z ${Math.round(remainingHours)}h`;
    }
  }

  /**
   * Obține culoarea pentru KPI bazată pe valoare
   */
  static getKPIColor(value: number, type: 'percentage' | 'time' | 'cost' | 'number'): string {
    if (type === 'percentage') {
      if (value >= 80) return 'green';
      if (value >= 60) return 'yellow';
      return 'red';
    }
    if (type === 'time') {
      if (value <= 2) return 'green';
      if (value <= 6) return 'yellow';
      return 'red';
    }
    return 'blue';
  }
} 