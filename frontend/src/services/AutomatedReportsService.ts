import api from './api';

// --- Types ---
export interface AutomatedReportType {
  type: string;
  name: string;
  description: string;
  frequency: string[];
  icon: string;
  includes?: string[];
  whenToUse?: string;
}

export interface AutomatedReportSchedule {
  id: number;
  type: string;
  title?: string;
  user_id: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  time: string; // 'HH:mm:ss'
  day_of_week?: number; // 0-6 (Sunday-Saturday)
  day_of_month?: number; // 1-31
  is_active: boolean;
  parameters?: any;
  created_at: string;
  updated_at: string;
}

export interface AutomatedReport {
  id: number;
  template_id: string;
  name: string;
  user_id: number;
  data: any;
  status: string;
  export_format?: string;
  created_at: string;
  exported?: boolean;
}

export interface AutomatedReportDetails extends AutomatedReport {
  schedule_id?: number;
  parameters?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// --- Service ---
class AutomatedReportsService {
  /**
   * Get available automated report types
   */
  static async getReportTypes(): Promise<AutomatedReportType[]> {
    try {
      const res = await api.get<ApiResponse<AutomatedReportType[]>>('/automated-reports/types');
      return res.data.data || [];
    } catch (error) {
      console.error('Error fetching report types:', error);
      return [];
    }
  }

  /**
   * Manually generate a report of a given type
   */
  static async generateReport(type: string, parameters?: any): Promise<AutomatedReport> {
    try {
      const res = await api.post<ApiResponse<{ reportId: number; title: string; type: string; generatedAt: string; status: string }>>('/automated-reports/generate', { type, parameters });
      return {
        id: res.data.data!.reportId,
        template_id: `report_${type}`,
        name: res.data.data!.title,
        user_id: 0, // Will be set by backend
        data: {},
        status: res.data.data!.status,
        created_at: res.data.data!.generatedAt
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Get all report schedules for the current user
   */
  static async getUserSchedules(): Promise<AutomatedReportSchedule[]> {
    try {
      const res = await api.get<ApiResponse<AutomatedReportSchedule[]>>('/automated-reports/schedules');
      return res.data.data || [];
    } catch (error) {
      console.error('Error fetching user schedules:', error);
      return [];
    }
  }

  /**
   * Create a new report schedule
   */
  static async createSchedule(scheduleData: Partial<AutomatedReportSchedule>): Promise<AutomatedReportSchedule> {
    try {
      const res = await api.post<ApiResponse<AutomatedReportSchedule>>('/automated-reports/schedules', scheduleData);
      return res.data.data!;
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  }

  /**
   * Update an existing report schedule
   */
  static async updateSchedule(scheduleId: number, scheduleData: Partial<AutomatedReportSchedule>): Promise<AutomatedReportSchedule> {
    try {
      const res = await api.put<ApiResponse<AutomatedReportSchedule>>(`/automated-reports/schedules/${scheduleId}`, scheduleData);
      return res.data.data!;
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw error;
    }
  }

  /**
   * Delete a report schedule
   */
  static async deleteSchedule(scheduleId: number): Promise<{ success: boolean }> {
    try {
      const res = await api.delete<ApiResponse<{ success: boolean }>>(`/automated-reports/schedules/${scheduleId}`);
      return res.data.data!;
    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  }

  /**
   * Manually execute a scheduled report
   */
  static async executeScheduledReport(scheduleId: number): Promise<AutomatedReport> {
    try {
      const res = await api.post<ApiResponse<{ reportId: number; title: string; type: string; generatedAt: string; status: string }>>(`/automated-reports/schedules/${scheduleId}/execute`);
      return {
        id: res.data.data!.reportId,
        template_id: `report_${res.data.data!.type}`,
        name: res.data.data!.title,
        user_id: 0, // Will be set by backend
        data: {},
        status: res.data.data!.status,
        created_at: res.data.data!.generatedAt
      };
    } catch (error) {
      console.error('Error executing scheduled report:', error);
      throw error;
    }
  }

  /**
   * Get all generated reports for the current user
   */
  static async getUserReports(page = 1, limit = 20): Promise<{ reports: AutomatedReport[]; pagination: any }> {
    try {
      const res = await api.get<ApiResponse<{ reports: AutomatedReport[]; pagination: any }>>(`/automated-reports/reports?page=${page}&limit=${limit}`);
      return res.data.data || { reports: [], pagination: {} };
    } catch (error) {
      console.error('Error fetching user reports:', error);
      return { reports: [], pagination: {} };
    }
  }

  /**
   * Get details for a specific report
   */
  static async getReportDetails(reportId: number): Promise<AutomatedReportDetails> {
    try {
      const res = await api.get<ApiResponse<AutomatedReportDetails>>(`/automated-reports/reports/${reportId}`);
      return res.data.data!;
    } catch (error) {
      console.error('Error fetching report details:', error);
      throw error;
    }
  }

  /**
   * Delete a generated report
   */
  static async deleteReport(reportId: number): Promise<{ success: boolean }> {
    try {
      const res = await api.delete<ApiResponse<{ success: boolean }>>(`/automated-reports/reports/${reportId}`);
      return res.data.data!;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  /**
   * Export a report as CSV (returns a Blob)
   */
  static async exportReport(reportId: number): Promise<Blob> {
    try {
      const res = await api.get(`/automated-reports/reports/${reportId}/export`, {
        responseType: 'blob',
      });
      return res.data;
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }
}

export default AutomatedReportsService; 