import api from './api';

export interface Notification {
  id: number;
  user_id: number;
  message: string;
  type: string;
  status: 'unread' | 'read';
  created_at: string;
}

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await api.get('/notifications');
  return res.data;
}

export async function markAllAsRead() {
  await api.post('/notifications/read');
}

export async function markAsRead(id: number) {
  await api.put(`/notifications/${id}/read`);
}

export async function deleteNotification(id: number) {
  await api.delete(`/notifications/${id}`);
}

// WebSocket client
export function connectNotificationsWS(userId: number, onMessage: (notif: any) => void): WebSocket {
    const wsProto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const devBackendPort = (import.meta as any).env?.VITE_BACKEND_PORT || 3100;
  const wsUrl = (import.meta as any).env?.DEV
    ? `${wsProto}://${window.location.hostname}:${devBackendPort}/api/ws`
    : `${wsProto}://${window.location.host}/api/ws`;

  const ws = new WebSocket(wsUrl);

  
  ws.onopen = () => {
    console.log('🔌 Notifications WebSocket connected for user:', userId);
    ws.send(JSON.stringify({ type: 'auth', userId }));
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('📨 Received WebSocket notification:', data);
      
      // Validare suplimentară înainte de trimitere
      if (!data || typeof data !== 'object') {
        console.warn('🚫 NotificationsService: Invalid data object:', data);
        return;
      }
      
      // Pentru activity_log, validează că are datele necesare
      if (data.type === 'activity_log' && data.data) {
        if (!data.data.description || typeof data.data.description !== 'string') {
          console.warn('🚫 NotificationsService: Activity log without valid description:', data);
          return;
        }
        
        // Filtrează activity logs care nu ar trebui să fie notificări pentru utilizatori
        const excludedActionTypes = [
          'LOGIN',
          'LOGOUT',
          'PASSWORD_CHANGE',
          'PROFILE_UPDATE',
          'VIEW_PAGE',
          'CLICK_BUTTON',
          'LOAD_DATA',
          'SEARCH',
          'FILTER',
          'SORT'
        ];
        
        if (data.data.action_type && excludedActionTypes.includes(data.data.action_type)) {
          console.log('📋 Activity log filtered (not for user notification):', data.data.action_type, '-', data.data.description);
          return;
        }
        
        // Doar pentru activity logs importante (asignări, alerte, etc.)
        const importantActionTypes = [
          'ASSIGNMENT_CREATED',
          'ASSIGNMENT_DELETED', 
          'ALERT_CREATED',
          'NOTIFICATION_SENT',
          'EVENT_ASSIGNED',
          'EVENT_UNASSIGNED',
          'REPORT_GENERATED'
        ];
        
        if (data.data.action_type && !importantActionTypes.includes(data.data.action_type)) {
          console.log('📋 Activity log not important for notification:', data.data.action_type);
          return;
        }
        
        // Transformă activity_log în notification format
        const notificationData = {
          type: 'notification',
          message: data.data.description,
          timestamp: data.data.created_at || new Date().toISOString()
        };
        onMessage(notificationData);
        return;
      }
      
      // Pentru notification directă
      if (data.type === 'notification') {
        if (!data.message || typeof data.message !== 'string' || data.message.trim() === '') {
          console.warn('🚫 NotificationsService: Notification without valid message:', data);
          return;
        }
      }
      
      onMessage(data);
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('❌ Notifications WebSocket error:', error);
  };
  
  ws.onclose = () => {
    console.log('🔌 Notifications WebSocket disconnected');
  };
  
  return ws;
} 