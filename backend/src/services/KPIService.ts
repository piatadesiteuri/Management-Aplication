import pool from '../config/database';

export interface DSPDKPI {
  // KPI-uri Epidemiologice
  epidemiologicalMetrics: {
    totalCasesMonitored: number;
    outbreakResponseRate: number;
    averageResponseTime: number;
    inspectionCompletionRate: number;
  };
  
  // KPI-uri de Inspecție și Control
  inspectionMetrics: {
    totalInspections: number;
    complianceRate: number;
    sanctionsApplied: number;
    averageProcessingTime: number;
  };
  
  // KPI-uri Operaționale
  operationalMetrics: {
    vehicleEfficiency: number; // cost/km
    resourceUtilization: number; // %
    averageResponseTime: number; // ore
    operationalCosts: number; // RON
  };
  
  // KPI-uri de Performanță
  performanceMetrics: {
    taskCompletionRate: number; // %
    reportCompletionRate: number; // %
    averageApprovalTime: number; // ore
    userSatisfaction: number; // 1-10
  };
  
  // KPI-uri pe Departamente
  departmentMetrics: {
    departmentId: number;
    departmentName: string;
    eventsCount: number;
    tasksCount: number;
    completionRate: number;
    costPerDepartment: number;
  }[];
  
  // KPI-uri pe Tipuri de Evenimente
  eventTypeMetrics: {
    eventType: string;
    count: number;
    completionRate: number;
    averageDuration: number;
  }[];
  
  // KPI-uri Vehicule
  vehicleMetrics: {
    totalVehicles: number;
    activeVehicles: number;
    totalDistance: number;
    totalFuelConsumption: number;
    averageEfficiency: number; // km/100L
    maintenanceCosts: number;
  };
}

export class KPIService {
  private static instance: KPIService;

  private constructor() {}

  public static getInstance(): KPIService {
    if (!KPIService.instance) {
      KPIService.instance = new KPIService();
    }
    return KPIService.instance;
  }

  /**
   * Calculează toate KPI-urile DSPD
   */
  async calculateAllKPIs(period?: { startDate: string; endDate: string }): Promise<DSPDKPI> {
    const startDate = period?.startDate || '2023-01-01';
    const endDate = period?.endDate || '2025-12-31';

    const [
      epidemiologicalMetrics,
      inspectionMetrics,
      operationalMetrics,
      performanceMetrics,
      departmentMetrics,
      eventTypeMetrics,
      vehicleMetrics
    ] = await Promise.all([
      this.calculateEpidemiologicalKPIs(startDate, endDate),
      this.calculateInspectionKPIs(startDate, endDate),
      this.calculateOperationalKPIs(startDate, endDate),
      this.calculatePerformanceKPIs(startDate, endDate),
      this.calculateDepartmentKPIs(startDate, endDate),
      this.calculateEventTypeKPIs(startDate, endDate),
      this.calculateVehicleKPIs(startDate, endDate)
    ]);

    return {
      epidemiologicalMetrics,
      inspectionMetrics,
      operationalMetrics,
      performanceMetrics,
      departmentMetrics,
      eventTypeMetrics,
      vehicleMetrics
    };
  }

  /**
   * KPI-uri Epidemiologice
   */
  private async calculateEpidemiologicalKPIs(startDate: string, endDate: string) {
    try {
      // Total cazuri monitorizate (evenimente epidemiologice)
      const [casesResult] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM calendar_events 
        WHERE type IN ('EPIDEMIOLOGICAL_CONTROL', 'HEALTH_EMERGENCY')
        AND start_time BETWEEN ? AND ?
      `, [startDate, endDate]);

      // Rata de răspuns la focare (evenimente completate în timp)
      const [responseResult] = await pool.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
        FROM calendar_events 
        WHERE type IN ('EPIDEMIOLOGICAL_CONTROL', 'HEALTH_EMERGENCY')
        AND start_time BETWEEN ? AND ?
      `, [startDate, endDate]);

      // Timp mediu de răspuns (diferenta intre created_at si start_time)
      const [timeResult] = await pool.execute(`
        SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, start_time)) as avg_response_time
        FROM calendar_events 
        WHERE type IN ('EPIDEMIOLOGICAL_CONTROL', 'HEALTH_EMERGENCY')
        AND start_time BETWEEN ? AND ?
      `, [startDate, endDate]);

      // Rata de completare inspecții
      const [inspectionResult] = await pool.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
        FROM calendar_events 
        WHERE type = 'INSPECTION'
        AND start_time BETWEEN ? AND ?
      `, [startDate, endDate]);

      const totalCases = (casesResult as any[])[0].total;
      const responseData = (responseResult as any[])[0];
      const avgResponseTime = (timeResult as any[])[0].avg_response_time || 0;
      const inspectionData = (inspectionResult as any[])[0];

      return {
        totalCasesMonitored: totalCases,
        outbreakResponseRate: responseData.total > 0 ? (responseData.completed / responseData.total) * 100 : 0,
        averageResponseTime: Math.round(avgResponseTime),
        inspectionCompletionRate: inspectionData.total > 0 ? (inspectionData.completed / inspectionData.total) * 100 : 0
      };
    } catch (error) {
      console.error('Error calculating epidemiological KPIs:', error);
      return {
        totalCasesMonitored: 0,
        outbreakResponseRate: 0,
        averageResponseTime: 0,
        inspectionCompletionRate: 0
      };
    }
  }

  /**
   * KPI-uri de Inspecție și Control
   */
  private async calculateInspectionKPIs(startDate: string, endDate: string) {
    try {
      // Total inspecții
      const [totalResult] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM calendar_events 
        WHERE type = 'INSPECTION'
        AND start_time BETWEEN ? AND ?
      `, [startDate, endDate]);

      // Rata de conformitate (evenimente cu status COMPLETED)
      const [complianceResult] = await pool.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as compliant
        FROM calendar_events 
        WHERE type = 'INSPECTION'
        AND start_time BETWEEN ? AND ?
      `, [startDate, endDate]);

      // Sancțiuni aplicate (evenimente cu status CANCELLED sau cu comentarii negative)
      const [sanctionsResult] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM calendar_events 
        WHERE type = 'INSPECTION'
        AND status = 'CANCELLED'
        AND start_time BETWEEN ? AND ?
      `, [startDate, endDate]);

      // Timp mediu de procesare (diferenta intre created_at si updated_at pentru evenimente completate)
      const [processingResult] = await pool.execute(`
        SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_processing_time
        FROM calendar_events 
        WHERE type = 'INSPECTION'
        AND status = 'COMPLETED'
        AND start_time BETWEEN ? AND ?
      `, [startDate, endDate]);

      const totalInspections = (totalResult as any[])[0].total;
      const complianceData = (complianceResult as any[])[0];
      const sanctionsApplied = (sanctionsResult as any[])[0].total;
      const avgProcessingTime = (processingResult as any[])[0].avg_processing_time || 0;

      return {
        totalInspections,
        complianceRate: complianceData.total > 0 ? (complianceData.compliant / complianceData.total) * 100 : 0,
        sanctionsApplied,
        averageProcessingTime: Math.round(avgProcessingTime)
      };
    } catch (error) {
      console.error('Error calculating inspection KPIs:', error);
      return {
        totalInspections: 0,
        complianceRate: 0,
        sanctionsApplied: 0,
        averageProcessingTime: 0
      };
    }
  }

  /**
   * KPI-uri Operaționale
   */
  private async calculateOperationalKPIs(startDate: string, endDate: string) {
    try {
      // Eficiența vehiculelor (cost/km)
      const [vehicleResult] = await pool.execute(`
        SELECT 
          SUM(vfr.cost) as total_cost,
          SUM(vfr.mileage) as total_mileage
        FROM vehicle_fuel_records vfr
        WHERE vfr.date BETWEEN ? AND ?
      `, [startDate, endDate]);

      // Utilizarea resurselor (vehicule active vs total)
      const [resourceResult] = await pool.execute(`
        SELECT 
          COUNT(*) as total_vehicles,
          SUM(CASE WHEN status IN ('AVAILABLE', 'IN_USE') THEN 1 ELSE 0 END) as active_vehicles
        FROM vehicles
      `);

      // Timp mediu de răspuns la evenimente
      const [responseResult] = await pool.execute(`
        SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, start_time)) as avg_response_time
        FROM calendar_events 
        WHERE start_time BETWEEN ? AND ?
      `, [startDate, endDate]);

      // Costuri operaționale
      const [costResult] = await pool.execute(`
        SELECT 
          SUM(vfr.cost) as fuel_cost,
          SUM(vm.cost) as maintenance_cost
        FROM vehicle_fuel_records vfr
        LEFT JOIN vehicle_maintenance vm ON DATE(vm.date) BETWEEN ? AND ?
        WHERE vfr.date BETWEEN ? AND ?
      `, [startDate, endDate, startDate, endDate]);

      const vehicleData = (vehicleResult as any[])[0];
      const resourceData = (resourceResult as any[])[0];
      const avgResponseTime = (responseResult as any[])[0].avg_response_time || 0;
      const costData = (costResult as any[])[0];

      const vehicleEfficiency = vehicleData.total_mileage > 0 ? 
        vehicleData.total_cost / vehicleData.total_mileage : 0;
      const resourceUtilization = resourceData.total_vehicles > 0 ? 
        (Number(resourceData.active_vehicles) / resourceData.total_vehicles) * 100 : 0;
      const operationalCosts = (costData.fuel_cost || 0) + (costData.maintenance_cost || 0);

      return {
        vehicleEfficiency: Math.round(vehicleEfficiency * 100) / 100,
        resourceUtilization: Math.round(resourceUtilization),
        averageResponseTime: Math.round(avgResponseTime),
        operationalCosts: Math.round(operationalCosts)
      };
    } catch (error) {
      console.error('Error calculating operational KPIs:', error);
      return {
        vehicleEfficiency: 0,
        resourceUtilization: 0,
        averageResponseTime: 0,
        operationalCosts: 0
      };
    }
  }

  /**
   * KPI-uri de Performanță
   */
  private async calculatePerformanceKPIs(startDate: string, endDate: string) {
    try {
      // Rata de completare task-uri
      const [taskResult] = await pool.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
        FROM tasks 
        WHERE created_at BETWEEN ? AND ?
      `, [startDate, endDate]);

      // Rata de completare rapoarte (evenimente cu status COMPLETED)
      const [reportResult] = await pool.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
        FROM calendar_events 
        WHERE type = 'REPORTING'
        AND start_time BETWEEN ? AND ?
      `, [startDate, endDate]);

      // Timp mediu de aprobare (pentru evenimente cu workflow de aprobare)
      const [approvalResult] = await pool.execute(`
        SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_approval_time
        FROM calendar_events 
        WHERE status IN ('APPROVED', 'COMPLETED')
        AND start_time BETWEEN ? AND ?
      `, [startDate, endDate]);

      const taskData = (taskResult as any[])[0];
      const reportData = (reportResult as any[])[0];
      const avgApprovalTime = (approvalResult as any[])[0].avg_approval_time || 0;

      return {
        taskCompletionRate: taskData.total > 0 ? (taskData.completed / taskData.total) * 100 : 0,
        reportCompletionRate: reportData.total > 0 ? (reportData.completed / reportData.total) * 100 : 0,
        averageApprovalTime: Math.round(avgApprovalTime),
        userSatisfaction: 8.5 // Placeholder - ar trebui implementat un sistem de feedback
      };
    } catch (error) {
      console.error('Error calculating performance KPIs:', error);
      return {
        taskCompletionRate: 0,
        reportCompletionRate: 0,
        averageApprovalTime: 0,
        userSatisfaction: 8.5
      };
    }
  }

  /**
   * KPI-uri pe Departamente
   */
  private async calculateDepartmentKPIs(startDate: string, endDate: string) {
    try {
      const [result] = await pool.execute(`
        SELECT 
          d.id,
          d.name as department_name,
          COUNT(DISTINCT ce.id) as events_count,
          COUNT(DISTINCT t.id) as tasks_count,
          SUM(CASE WHEN ce.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_events,
          SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
          COALESCE(SUM(vfr.cost), 0) as fuel_cost,
          COALESCE(SUM(vm.cost), 0) as maintenance_cost
        FROM departments d
        LEFT JOIN calendar_events ce ON d.id = ce.department_id 
          AND ce.start_time BETWEEN ? AND ?
        LEFT JOIN tasks t ON d.id = t.department_id 
          AND t.created_at BETWEEN ? AND ?
        LEFT JOIN vehicles v ON d.id = v.assigned_department_id
        LEFT JOIN vehicle_fuel_records vfr ON v.id = vfr.vehicle_id 
          AND vfr.date BETWEEN ? AND ?
        LEFT JOIN vehicle_maintenance vm ON v.id = vm.vehicle_id 
          AND vm.date BETWEEN ? AND ?
        GROUP BY d.id, d.name
        ORDER BY d.name
      `, [startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate]);

      return (result as any[]).map(row => ({
        departmentId: row.id,
        departmentName: row.department_name,
        eventsCount: row.events_count || 0,
        tasksCount: row.tasks_count || 0,
        completionRate: row.events_count > 0 ? 
          ((row.completed_events || 0) / row.events_count) * 100 : 0,
        costPerDepartment: (row.fuel_cost || 0) + (row.maintenance_cost || 0)
      }));
    } catch (error) {
      console.error('Error calculating department KPIs:', error);
      return [];
    }
  }

  /**
   * KPI-uri pe Tipuri de Evenimente
   */
  private async calculateEventTypeKPIs(startDate: string, endDate: string) {
    try {
      const [result] = await pool.execute(`
        SELECT 
          type as event_type,
          COUNT(*) as count,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
          AVG(TIMESTAMPDIFF(HOUR, start_time, end_time)) as avg_duration
        FROM calendar_events 
        WHERE start_time BETWEEN ? AND ?
        GROUP BY type
        ORDER BY count DESC
      `, [startDate, endDate]);

      return (result as any[]).map(row => ({
        eventType: row.event_type,
        count: row.count,
        completionRate: row.count > 0 ? (row.completed / row.count) * 100 : 0,
        averageDuration: Math.round(row.avg_duration || 0)
      }));
    } catch (error) {
      console.error('Error calculating event type KPIs:', error);
      return [];
    }
  }

  /**
   * KPI-uri Vehicule
   */
  private async calculateVehicleKPIs(startDate: string, endDate: string) {
    // Total vehicule și vehicule active
    const [vehicleResult] = await pool.execute(`
      SELECT 
        COUNT(*) as total_vehicles,
        SUM(CASE WHEN status IN ('AVAILABLE', 'IN_USE') THEN 1 ELSE 0 END) as active_vehicles
      FROM vehicles
    `);

    // Distanța totală și consumul de combustibil
    const [fuelResult] = await pool.execute(`
      SELECT 
        SUM(mileage) as total_distance,
        SUM(quantity) as total_fuel_consumption,
        AVG(efficiency) as avg_efficiency
      FROM vehicle_fuel_records 
      WHERE date BETWEEN ? AND ?
    `, [startDate, endDate]);

    // Costuri de mentenanță
    const [maintenanceResult] = await pool.execute(`
      SELECT SUM(cost) as maintenance_costs
      FROM vehicle_maintenance 
      WHERE date BETWEEN ? AND ?
    `, [startDate, endDate]);

    const vehicleData = (vehicleResult as any[])[0];
    const fuelData = (fuelResult as any[])[0];
    const maintenanceData = (maintenanceResult as any[])[0];

    return {
      totalVehicles: vehicleData.total_vehicles,
      activeVehicles: Number(vehicleData.active_vehicles),
      totalDistance: fuelData.total_distance || 0,
      totalFuelConsumption: fuelData.total_fuel_consumption || 0,
      averageEfficiency: Math.round((fuelData.avg_efficiency || 0) * 100) / 100,
      maintenanceCosts: maintenanceData.maintenance_costs || 0
    };
  }

  /**
   * Generează raport KPI în format JSON
   */
  async generateKPIReport(period?: { startDate: string; endDate: string }): Promise<{
    kpis: DSPDKPI;
    generatedAt: string;
    period: { startDate: string; endDate: string };
  }> {
    const kpis = await this.calculateAllKPIs(period);
    const startDate = period?.startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const endDate = period?.endDate || new Date().toISOString().split('T')[0];

    return {
      kpis,
      generatedAt: new Date().toISOString(),
      period: { startDate, endDate }
    };
  }
} 