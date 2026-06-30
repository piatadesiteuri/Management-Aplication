import api from './api';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  popularity: number;
  estimatedTime: string;
  parameters: ReportParameter[];
}

export interface ReportParameter {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect';
  required: boolean;
  defaultValue?: any;
  options?: Array<{ value: string; label: string }>;
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  templateName: string;
  generatedAt: string;
  generatedBy: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  parameters: Record<string, any>;
  data?: any;
}

// 📊 Interfețe pentru rapoarte specifice
export interface ProductSalesAnalysis {
  products: Array<{
    product_id: number;
    product_name: string;
    product_code: string;
    category_name: string;
    total_sold: number;
    total_sales_value: number;
    current_stock: number;
    daily_avg_sales: number;
  }>;
  summary: {
    totalProducts: number;
    totalSalesValue: number;
    totalQuantitySold: number;
    avgDailySales: number;
    topSellingProduct: any;
    lowStockProducts: number;
  };
  generatedAt: string;
  reportType: string;
}

export interface VehicleMaintenanceAnalysis {
  vehicles: Array<{
    vehicle_id: number;
    brand: string;
    model: string;
    registration_number: string;
    maintenance_count: number;
    total_maintenance_cost: number;
    avg_maintenance_cost: number;
    monthly_maintenance_frequency: number;
    cost_per_1000km: number;
    maintenance_types: string;
  }>;
  summary: {
    totalVehicles: number;
    totalMaintenanceCost: number;
    avgCostPerVehicle: number;
    mostExpensiveVehicle: any;
    maintenanceTypes: Array<{
      type: string;
      frequency: number;
      total_cost: number;
      avg_cost: number;
    }>;
  };
  generatedAt: string;
  reportType: string;
}

export interface VehicleUsageAnalysis {
  vehicles: Array<{
    vehicle_id: number;
    brand: string;
    model: string;
    registration_number: string;
    total_trips: number;
    total_distance: number;
    avg_trip_distance: number;
    total_usage_hours: number;
    unique_drivers: number;
    efficiency_km_per_trip: number;
  }>;
  summary: {
    totalVehicles: number;
    totalDistance: number;
    totalTrips: number;
    avgDistancePerTrip: number;
    mostUsedVehicle: any;
    purposeAnalysis: Array<{
      purpose: string;
      frequency: number;
      total_distance: number;
      avg_distance: number;
    }>;
  };
  generatedAt: string;
  reportType: string;
}

export interface EventsActivityAnalysis {
  events: Array<{
    id: number;
    title: string;
    type: string;
    duration_hours: number;
    department_name: string;
    created_by: string;
    vehicle_used: string;
    event_date: string;
    day_of_week: string;
  }>;
  summary: {
    totalEvents: number;
    totalDuration: number;
    avgEventDuration: number;
    eventsWithVehicles: number;
    eventTypesAnalysis: Record<string, {
      count: number;
      totalDuration: number;
      avgDuration: number;
    }>;
    dayOfWeekAnalysis: Record<string, number>;
    hourAnalysis: Record<string, number>;
    busyDays: Array<[string, number]>;
  };
  generatedAt: string;
  reportType: string;
}

export interface MyEvent {
  id: number;
  title: string;
  type: string;
  start_time: string;
  end_time: string;
  status: string;
  role: string;
  department: string;
  vehicle?: string;
  materials?: string;
  feedback?: string;
}

export interface MyMaterial {
  eventId: number;
  eventTitle: string;
  productName: string;
  quantity: number;
  unit: string;
  date: string;
}

export interface MyVehicleUsage {
  eventId: number;
  eventTitle: string;
  vehicle: string;
  distance: number;
  start_time: string;
  end_time: string;
}

export interface MyPresenceSummary {
  totalEvents: number;
  totalHours: number;
  types: Record<string, number>;
  topEvents: MyEvent[];
}

export interface MyFeedback {
  eventId: number;
  eventTitle: string;
  feedback: string;
  date: string;
}

export interface SavedReport {
  id: number;
  template_id: string;
  name: string;
  status: string;
  export_format: string;
  created_at: string;
  data_size?: number;
  data?: any;
}

export const ReportsService = {
  // 📋 Obține template-urile de rapoarte
  getReportTemplates: async (): Promise<ReportTemplate[]> => {
    try {
      console.log('📋 Fetching report templates from API...');
      const response = await api.get('/reports/templates');
      console.log('📋 Received templates:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching report templates:', error);
      throw error;
    }
  },

  // 📊 Generează raport analiză vânzări produse
  generateProductSalesAnalysis: async (parameters: {
    startDate: string;
    endDate: string;
    categoryId?: string;
  }): Promise<ProductSalesAnalysis> => {
    try {
      console.log('📊 Generating product sales analysis with params:', parameters);
      const response = await api.get('/reports/product-sales-analysis', {
        params: parameters
      });
      console.log('📊 Received product sales data:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error generating product sales analysis:', error);
      throw error;
    }
  },

  // 🚗 Generează raport analiză mentenanță vehicule
  generateVehicleMaintenanceAnalysis: async (parameters: {
    startDate: string;
    endDate: string;
    vehicleId?: string;
  }): Promise<VehicleMaintenanceAnalysis> => {
    try {
      console.log('🚗 Generating vehicle maintenance analysis with params:', parameters);
      const response = await api.get('/reports/vehicle-maintenance-analysis', {
        params: parameters
      });
      console.log('🚗 Received vehicle maintenance data:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error generating vehicle maintenance analysis:', error);
      throw error;
    }
  },

  // 🛣️ Generează raport analiză trasee și utilizare
  generateVehicleUsageAnalysis: async (parameters: {
    startDate: string;
    endDate: string;
    departmentId?: string;
  }): Promise<VehicleUsageAnalysis> => {
    try {
      console.log('🛣️ Generating vehicle usage analysis with params:', parameters);
      const response = await api.get('/reports/vehicle-usage-analysis', {
        params: parameters
      });
      console.log('🛣️ Received vehicle usage data:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error generating vehicle usage analysis:', error);
      throw error;
    }
  },

  // 📅 Generează raport analiză evenimente și activități
  generateEventsActivityAnalysis: async (parameters: {
    startDate: string;
    endDate: string;
    departmentId?: string;
    eventType?: string;
  }): Promise<EventsActivityAnalysis> => {
    try {
      console.log('📅 Generating events activity analysis with params:', parameters);
      const response = await api.get('/reports/events-activity-analysis', {
        params: parameters
      });
      console.log('📅 Received events activity data:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error generating events activity analysis:', error);
      throw error;
    }
  },

  // 📈 Exportă raport în format specific
  exportReport: async (reportData: any, format: 'PDF' | 'EXCEL' | 'CSV' = 'PDF'): Promise<Blob> => {
    try {
      console.log('📈 Exporting report in format:', format);
      const response = await api.post('/reports/export', {
        data: reportData,
        format
      }, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error exporting report:', error);
      throw error;
    }
  },

  // 📊 Obține statistici generale pentru dashboard
  getDashboardStats: async (): Promise<{
    totalReportsGenerated: number;
    totalProductsSold: number;
    totalMaintenanceCost: number;
    totalVehicleUsage: number;
    totalEvents: number;
  }> => {
    try {
      const response = await api.get('/reports/dashboard-stats');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      throw error;
    }
  },

  saveReport: async (reportData: {
    templateId: string;
    name: string;
    data: any;
    parameters: any;
    customization: any;
    exportFormat: string;
  }): Promise<SavedReport> => {
    const response = await api.post('/reports/save', reportData);
    return response.data;
  },

  getSavedReports: async (): Promise<SavedReport[]> => {
    const response = await api.get('/reports/saved');
    return response.data;
  },

  getSavedReportDetails: async (reportId: number): Promise<any> => {
    const response = await api.get(`/reports/saved/${reportId}`);
    return response.data;
  },

  getMyEvents: async (params: any = {}): Promise<{ events: MyEvent[]; summary: MyPresenceSummary }> => {
    const response = await api.get('/reports/my-events', { params });
    return response.data;
  },
  getMyMaterials: async (params: any = {}): Promise<{ materials: MyMaterial[] }> => {
    const response = await api.get('/reports/my-materials', { params });
    return response.data;
  },
  getMyVehicles: async (params: any = {}): Promise<{ usages: MyVehicleUsage[] }> => {
    const response = await api.get('/reports/my-vehicles', { params });
    return response.data;
  },
  getMyPresenceSummary: async (params: any = {}): Promise<MyPresenceSummary> => {
    const response = await api.get('/reports/my-presence-summary', { params });
    return response.data;
  },
  getMyFeedback: async (params: any = {}): Promise<{ feedbacks: MyFeedback[] }> => {
    const response = await api.get('/reports/my-feedback', { params });
    return response.data;
  },
}; 