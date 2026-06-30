import api from './api';

export interface ActivityLog {
  id: number;
  user_id: number;
  action_type: string;
  entity_type: string;
  entity_id: number;
  description: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface ActivityLogResponse {
  logs: ActivityLog[];
  total: number;
}

export class ActivityLogService {
  /**
   * Obține logurile de activitate pentru un eveniment specific
   */
  static async getEventActivityLogs(eventId: number): Promise<ActivityLog[]> {
    try {
      const response = await api.get(`/activity-logs?entityType=EVENT&entityId=${eventId}&limit=50`);
      return response.data.logs || [];
    } catch (error) {
      console.error('Error fetching event activity logs:', error);
      return [];
    }
  }

  /**
   * Obține logurile de activitate cu filtrare
   */
  static async getActivityLogs(filters: {
    actionType?: string;
    entityType?: string;
    userId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ActivityLogResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.actionType) params.append('actionType', filters.actionType);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.userId) params.append('userId', filters.userId.toString());
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await api.get(`/activity-logs?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return { logs: [], total: 0 };
    }
  }
}
