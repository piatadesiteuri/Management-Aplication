import api from './api';

export interface ActivityLog {
  id: number;
  user_id: number;
  action_type: string;
  entity_type: string;
  entity_id: number | null;
  description: string;
  details: any;
  ip_address: string;
  user_agent: string | null;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface LogStats {
  general: {
    total_logs: number;
    unique_users: number;
    today_logs: number;
    week_logs: number;
  };
  actionStats: Array<{
    action_type: string;
    count: number;
  }>;
  entityStats: Array<{
    entity_type: string;
    count: number;
  }>;
  userStats: Array<{
    first_name: string;
    last_name: string;
    activity_count: number;
  }>;
}

export interface ActivityLogsResponse {
  logs: ActivityLog[];
  total: number;
}

export class ActivityLogsService {
  /**
   * Obține logurile de activitate cu filtrare și pagination
   */
  static async getActivityLogs(params: string): Promise<ActivityLogsResponse> {
    const response = await api.get(`/activity-logs?${params}`);
    return response.data;
  }

  /**
   * Obține statisticile pentru loguri
   */
  static async getLogStats(): Promise<LogStats> {
    const response = await api.get('/activity-logs/stats');
    return response.data;
  }

  /**
   * Șterge logurile vechi
   */
  static async cleanupOldLogs(daysToKeep: number = 90): Promise<{ message: string }> {
    const response = await api.post('/activity-logs/cleanup', { daysToKeep });
    return response.data;
  }

  /**
   * Conectare WebSocket pentru real-time logging
   */
  static connectActivityLogsWS(userId: number, onNewLog: (log: ActivityLog) => void): WebSocket {
      const wsProto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const devBackendPort = (import.meta as any).env?.VITE_BACKEND_PORT || 3100;
  const wsUrl = (import.meta as any).env?.DEV
    ? `${wsProto}://${window.location.hostname}:${devBackendPort}/api/ws`
    : `${wsProto}://${window.location.host}/api/ws`;

  const ws = new WebSocket(wsUrl);

    
    ws.onopen = () => {
      console.log('🔌 Activity Logs WebSocket connected');
      ws.send(JSON.stringify({ type: 'auth', userId }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'activity_log') {
          console.log('📝 Real-time activity log received:', data.data);
          onNewLog(data.data);
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('❌ Activity Logs WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('🔌 Activity Logs WebSocket disconnected');
    };
    
    return ws;
  }
} 