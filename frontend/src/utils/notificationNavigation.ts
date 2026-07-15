import { Notification } from '../services/NotificationsService';
import { StockService } from '../services/StockService';
import { CalendarService } from '../services/CalendarService';
import { ADMIN_ENTRY_ROLES } from '../config/permissions';

const calendarService = new CalendarService();

function parseNotificationData(notification: Notification): Record<string, unknown> {
  if (!notification.data) return {};
  if (typeof notification.data === 'string') {
    try {
      return JSON.parse(notification.data);
    } catch {
      return {};
    }
  }
  return notification.data as Record<string, unknown>;
}

function extractEventTitleFromAlertMessage(message: string): string | null {
  const match = message.match(/Eveniment:\s*(.+?)\s*-/i);
  return match?.[1]?.trim() || null;
}

async function resolveEventIdFromNotification(notification: Notification): Promise<number | null> {
  if (notification.event_id) {
    return notification.event_id;
  }

  const data = parseNotificationData(notification);
  const fromData =
    (data.event_id as number | undefined) ??
    (data.entity_type === 'EVENT' ? (data.entity_id as number | undefined) : undefined);

  if (fromData) {
    return fromData;
  }

  const title = extractEventTitleFromAlertMessage(notification.message);
  if (!title) {
    return null;
  }

  try {
    const events = await calendarService.getEvents();
    const normalizedTitle = title.toLowerCase();
    const match = events.find((event: any) => {
      const eventTitle = String(event.title || '').trim().toLowerCase();
      return eventTitle === normalizedTitle;
    });
    return match ? Number(match.id) : null;
  } catch {
    return null;
  }
}

export async function resolveNotificationPath(
  notification: Notification,
  roles: string[] = []
): Promise<string> {
  const isAdmin = roles.some((role) => ADMIN_ENTRY_ROLES.includes(role));
  const basePath = isAdmin ? '/admin' : '/user';

  if (notification.type === 'INTERNAL_NOTE') {
    const taskId = notification.task_id;
    return taskId ? `${basePath}/tasks?note=${taskId}` : `${basePath}/tasks`;
  }

  if (notification.type === 'MATERIAL_REQUEST') {
    const requestId = notification.request_id;
    return requestId ? `${basePath}/material-requests?request=${requestId}` : `${basePath}/material-requests`;
  }

  if (notification.type === 'MATERIAL_REQUEST_UPDATE') {
    let eventId = notification.event_id;
    const requestId = notification.request_id;

    if (!eventId && requestId) {
      try {
        const response = await StockService.getMaterialRequestById(requestId);
        eventId = response.data?.transport_event_id;
      } catch {
        // fallback below
      }
    }

    if (eventId) {
      return `${basePath}/calendar?event=${eventId}`;
    }

    if (requestId) {
      return `${basePath}/material-requests?request=${requestId}`;
    }

    return `${basePath}/material-requests`;
  }

  if (notification.type === 'AUTOMATED_REPORT') {
    const reportData = typeof notification.data === 'object' ? notification.data : null;
    if (reportData && (reportData as any).reportId) {
      const reportId = String((reportData as any).reportId).replace('report_', '').split('_')[0];
      return `${basePath}/automated-reports?report=${reportId}`;
    }
    return `${basePath}/automated-reports`;
  }

  if (notification.type === 'alert' || notification.type === 'ALERT') {
    const eventId = await resolveEventIdFromNotification(notification);
    if (eventId) {
      return `${basePath}/calendar?event=${eventId}`;
    }
    return `${basePath}/calendar`;
  }

  const eventId = await resolveEventIdFromNotification(notification);
  if (eventId) {
    return `${basePath}/calendar?event=${eventId}`;
  }

  return `${basePath}/calendar`;
}

export async function resolveNotificationEventId(
  notification: Notification
): Promise<number | null> {
  return resolveEventIdFromNotification(notification);
}
