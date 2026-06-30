export type EventType = 'INSPECTION' | 'TRAVEL' | 'MEETING' | 'OTHER';

export type EventStatus = 'pending' | 'active' | 'cancelled' | 'completed';

export interface EventDocument {
  id: number;
  eventId: number;
  documentType: 'PLANNING' | 'DECISION' | 'REPORT' | 'AUTHORIZATION' | 'CHECKLIST' | 'OTHER';
  title: string;
  description?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  version: number;
  isActive: boolean;
  uploadedBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventAssignment {
  id: number;
  eventId: number;
  userId: number;
  role: 'ORGANIZER' | 'PARTICIPANT' | 'OBSERVER' | 'DRIVER' | 'RESPONSIBLE';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'MAYBE';
  responseDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventNotification {
  id: number;
  eventId: number;
  userId: number;
  notificationType: 'REMINDER' | 'ASSIGNMENT' | 'CHANGE' | 'CANCELLATION' | 'APPROVAL_REQUEST';
  title: string;
  message: string;
  sendTime: Date;
  sentAt?: Date;
  isRead: boolean;
  deliveryMethod: 'EMAIL' | 'SYSTEM' | 'BOTH';
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

export interface EventCategory {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  departmentId?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventTag {
  id: number;
  name: string;
  color: string;
  createdAt: Date;
}

export interface EventTemplate {
  id: number;
  name: string;
  description?: string;
  eventType: string;
  durationMinutes: number;
  defaultLocation?: string;
  templateData: any;
  departmentId?: number;
  createdBy: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringEvent {
  id: number;
  parentEventId: number;
  recurrencePattern: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  recurrenceInterval: number;
  daysOfWeek?: string;
  dayOfMonth?: number;
  monthOfYear?: number;
  endDate?: Date;
  maxOccurrences?: number;
  createdOccurrences: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: EventType;
  status: EventStatus;
  userId: number;
  departmentId?: number;
  isPrivate: boolean;
  location?: string;
  vehicleId?: number;
  categoryId?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  approvalStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: number;
  approvedAt?: Date;
  parentEventId?: number;
  isRecurring: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  assignments?: EventAssignment[];
  documents?: EventDocument[];
  notifications?: EventNotification[];
  category?: EventCategory;
  tags?: EventTag[];
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentUser {
  departmentId: number;
  userId: number;
  isManager: boolean;
  createdAt: Date;
}

export interface CalendarFilters {
  departmentId?: number;
  startDate?: Date;
  endDate?: Date;
  userId?: number;
  type?: EventType[];
  status?: EventStatus[];
} 