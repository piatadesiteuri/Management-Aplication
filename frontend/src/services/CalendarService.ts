import { CalendarEvent, CalendarPermissions, UserRole, EventType, EventStatus } from '../types/calendar'
import api from './api'

export interface CalendarFilters {
  departmentId?: number
  startDate?: string
  endDate?: string
  userId?: number
  type?: EventType[]
  status?: EventStatus[]
  personal?: boolean
}

interface ICalendarService {
  getEvents(filters?: CalendarFilters): Promise<CalendarEvent[]>
  createEvent(event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent>
  updateEvent(id: string, event: Partial<CalendarEvent>): Promise<CalendarEvent>
  deleteEvent(id: string): Promise<void>
  getEventById(id: string): Promise<CalendarEvent>
}

// Mock implementation for development
export class CalendarService implements ICalendarService {
  private events: CalendarEvent[] = [
    {
      id: '1',
      title: 'Inspecție Tehnică',
      start: '2024-02-15T10:00:00.000Z',
      end: '2024-02-15T12:00:00.000Z',
      description: 'Inspecție tehnică periodică pentru vehiculul DJ01DSP',
      type: 'INSPECTION' as EventType,
      status: 'PLANNED' as EventStatus,
      userId: 1,
      isPrivate: false,
      location: 'Bucuresti',
      vehicleId: 1,
      priority: 'MEDIUM',
      approvalStatus: 'APPROVED',
      isRecurring: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Deplasare Craiova',
      start: '2024-02-16T09:00:00.000Z',
      end: '2024-02-16T17:00:00.000Z',
      description: 'Deplasare pentru inspecție unități sanitare',
      type: 'TRAVEL' as EventType,
      status: 'PLANNED' as EventStatus,
      userId: 1,
      isPrivate: false,
      location: 'Craiova',
      vehicleId: 2,
      priority: 'MEDIUM',
      approvalStatus: 'APPROVED',
      isRecurring: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  private getPermissionsForRole(role: UserRole): CalendarPermissions {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canViewPrivate: true,
          canManageDepartment: true,
        };
      case 'DEPARTMENT_ADMIN':
        return {
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canViewPrivate: true,
          canManageDepartment: true,
        };
      case 'MANAGER':
        return {
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canViewPrivate: true,
          canManageDepartment: false,
        };
      case 'INSPECTOR':
        return {
          canCreate: true,
          canEdit: true,
          canDelete: false,
          canViewPrivate: false,
          canManageDepartment: false,
        };
      case 'OPERATOR':
        return {
          canCreate: true,
          canEdit: false,
          canDelete: false,
          canViewPrivate: false,
          canManageDepartment: false,
        };
      case 'VIEWER':
        return {
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canViewPrivate: false,
          canManageDepartment: false,
        };
      default:
        return {
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canViewPrivate: false,
          canManageDepartment: false,
        };
    }
  }

  async getEvents(filters?: CalendarFilters): Promise<CalendarEvent[]> {
    try {
      const response = await api.get('/calendar/events', { params: filters });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching events:', {
        error,
        config: (error as any)?.config,
        response: (error as any)?.response?.data,
        status: (error as any)?.response?.status
      });
      throw error;
    }
  }

  async createEvent(eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> {
    try {
      // Creating event
      
      const response = await api.post('/calendar/events', eventData);
      // Event created successfully
      return response.data;
    } catch (error) {
      console.error('❌ Error creating event:', {
        error,
        eventData: {
          title: eventData.title,
          type: eventData.type,
          hasTransportData: !!eventData.transportData
        },
        config: (error as any)?.config,
        response: (error as any)?.response?.data
      });
      throw error;
    }
  }

  async updateEvent(id: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      // Updating event
      const response = await api.put(`/calendar/events/${id}`, eventData);
      // Event updated successfully
      return response.data;
    } catch (error) {
      console.error('❌ Error updating event:', {
        error,
        id,
        eventData,
        config: (error as any)?.config,
        response: (error as any)?.response?.data
      });
      throw error;
    }
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      console.log('🗑️ Deleting event:', id);
      await api.delete(`/calendar/events/${id}`);
      console.log('✅ Event deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting event:', {
        error,
        id,
        config: (error as any)?.config,
        response: (error as any)?.response?.data
      });
      throw error;
    }
  }

  async getEventById(id: string): Promise<CalendarEvent> {
    const event = this.events.find(event => event.id === id)
    if (!event) {
      throw new Error('Event not found')
    }
    return event
  }

  async getDepartmentEvents(departmentId: number): Promise<CalendarEvent[]> {
    try {
      console.log('🔍 Fetching department events:', { departmentId });
      const response = await api.get(`/calendar/events/department/${departmentId}`);
      console.log('📥 Received department events:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching department events:', {
        error,
        departmentId,
        config: (error as any)?.config,
        response: (error as any)?.response?.data
      });
      throw error;
    }
  }

  async getUserEvents(userId: number): Promise<CalendarEvent[]> {
    try {
      const response = await api.get<CalendarEvent[]>(`/api/calendar/users/${userId}/events`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user events:', error);
      throw error;
    }
  }

  // Metode pentru asignări
  async getEventAssignments(eventId: string): Promise<any[]> {
    try {
      const response = await api.get(`/calendar/events/${eventId}/assignments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event assignments:', error);
      throw error;
    }
  }

  async createEventAssignment(eventId: string, assignment: { userId: number; role: string; notes?: string }): Promise<any> {
    try {
      const response = await api.post(`/calendar/events/${eventId}/assignments`, assignment);
      return response.data;
    } catch (error) {
      console.error('Error creating event assignment:', error);
      throw error;
    }
  }

  async updateEventAssignment(eventId: string, assignmentId: string, update: { status: string; notes?: string }): Promise<any> {
    try {
      const response = await api.put(`/calendar/events/${eventId}/assignments/${assignmentId}`, update);
      return response.data;
    } catch (error) {
      console.error('Error updating event assignment:', error);
      throw error;
    }
  }

  async deleteEventAssignment(eventId: string, assignmentId: string): Promise<void> {
    try {
      await api.delete(`/calendar/events/${eventId}/assignments/${assignmentId}`);
    } catch (error) {
      console.error('Error deleting event assignment:', error);
      throw error;
    }
  }

  // Metode pentru documente
  async getEventDocuments(eventId: string): Promise<any[]> {
    try {
      const response = await api.get(`/calendar/events/${eventId}/documents`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event documents:', error);
      throw error;
    }
  }

  // Metode pentru categorii
  async getEventCategories(): Promise<any[]> {
    try {
      const response = await api.get('/calendar/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching event categories:', error);
      throw error;
    }
  }

  // Metode pentru template-uri
  async getEventTemplates(departmentId?: number): Promise<any[]> {
    try {
      const params = departmentId ? { departmentId } : {};
      const response = await api.get('/calendar/templates', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching event templates:', error);
      throw error;
    }
  }

  // Metode pentru notificări
  async getEventNotifications(): Promise<any[]> {
    try {
      const response = await api.get('/calendar/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching event notifications:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await api.put(`/calendar/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Metode pentru verificarea disponibilității
  async checkVehicleAvailability(startTime: string, endTime: string, excludeEventId?: string): Promise<any[]> {
    try {
      console.log('🚗 Checking vehicle availability:', { startTime, endTime, excludeEventId });
      const params: any = { startTime, endTime };
      if (excludeEventId) {
        params.excludeEventId = excludeEventId;
      }
      
      const response = await api.get('/calendar/availability/vehicles', { params });
      console.log('📥 Vehicle availability response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error checking vehicle availability:', error);
      throw error;
    }
  }

  async checkPersonnelAvailability(
    startTime: string, 
    endTime: string, 
    excludeEventId?: string, 
    departmentId?: number
  ): Promise<any[]> {
    try {
      console.log('👥 Checking personnel availability:', { startTime, endTime, excludeEventId, departmentId });
      const params: any = { startTime, endTime };
      if (excludeEventId) {
        params.excludeEventId = excludeEventId;
      }
      if (departmentId) {
        params.departmentId = departmentId;
      }
      
      const response = await api.get('/calendar/availability/personnel', { params });
      console.log('📥 Personnel availability response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error checking personnel availability:', error);
      throw error;
    }
  }

  async getTimeSlotConflicts(startTime: string, endTime: string, excludeEventId?: string): Promise<any> {
    try {
      console.log('⚠️ Checking time slot conflicts:', { startTime, endTime, excludeEventId });
      const params: any = { startTime, endTime };
      if (excludeEventId) {
        params.excludeEventId = excludeEventId;
      }
      
      const response = await api.get('/calendar/availability/conflicts', { params });
      console.log('📥 Time slot conflicts response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error checking time slot conflicts:', error);
      throw error;
    }
  }

  // Metodă pentru a prelua produsele unui eveniment de transport
  async getEventTransportItems(eventId: string): Promise<any[]> {
    try {
      const response = await api.get(`/calendar/events/${eventId}/transport-items`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching transport items for event:', error);
      throw error;
    }
  }

  // Metodă pentru actualizarea statusului evenimentului de transport
  async updateTransportEventStatus(eventId: string, status: string, comments?: string): Promise<any> {
    try {
      console.log('🔄 Updating transport event status:', { eventId, status, comments });
      const response = await api.put(`/calendar/events/${eventId}/transport-status`, {
        status,
        comments
      });
      console.log('📥 Transport status update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating transport event status:', error);
      throw error;
    }
  }

  // Metodă pentru crearea unui document pentru eveniment
  async createEventDocument(eventId: string, formData: FormData): Promise<any> {
    try {
      // Verific token JWT explicit
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        console.error('❌ [CalendarService] JWT token missing at upload!');
        throw new Error('Nu sunteți autentificat. Reîncercați login.');
      }
      console.log('🔑 [CalendarService] JWT token used at upload:', token.substring(0, 10) + '...');
      // Nu setez manual Content-Type, axios îl setează corect pentru FormData
      const response = await api.post(`/calendar/events/${eventId}/documents`, formData);
      console.log('📥 [CalendarService] Event document created:', response.data);
      return response.data;
    } catch (error: any) {
      // Extrage mesajul de eroare clar pentru UI
      const msg = error?.response?.data?.message || error.message || 'Eroare la crearea documentului';
      console.error('❌ [CalendarService] Error creating event document:', msg, error);
      throw new Error(msg);
    }
  }

  // Metodă pentru ștergerea unui document de eveniment
  async deleteEventDocument(documentId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting event document:', documentId);
      await api.delete(`/calendar/documents/${documentId}`);
      console.log('✅ Event document deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting event document:', error);
      throw error;
    }
  }

  // Metodă pentru finalizarea comenzii de transport și actualizarea stocului
  async finalizeTransportOrder(eventId: string): Promise<any> {
    try {
      console.log('🎯 Finalizing transport order:', eventId);
      const response = await api.post(`/calendar/events/${eventId}/finalize`);
      console.log('✅ Transport order finalized successfully:', response.data);
      return response.data;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || 'Eroare la finalizarea comenzii';
      console.error('❌ Error finalizing transport order:', msg, error);
      throw new Error(msg);
    }
  }
} 