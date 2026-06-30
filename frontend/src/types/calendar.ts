import type { User } from './user'

export type EventType = 
  // Transport & Aprovizionare
  | 'TRANSPORT_DELIVERY'     // Livrare de la furnizor
  | 'TRANSPORT_PICKUP'       // Ridicare produse
  | 'SUPPLY_ORDER'           // Comandă aprovizionare
  
  // Evenimente Operaționale (existente)
  | 'INSPECTION' 
  | 'EPIDEMIOLOGICAL_CONTROL'
  | 'MEETING'
  | 'REPORTING'
  | 'HEALTH_EMERGENCY'
  | 'ADMINISTRATIVE'
  | 'TRAVEL'
  | 'TRAINING'
  | 'PUBLIC_HEALTH_ACTION'
  | 'MAINTENANCE'
  | 'STOCK_RECEPTION'
  | 'STOCK_DISTRIBUTION'
  | 'STOCK_MOVEMENT'
  | 'INVENTORY_AUDIT'
  | 'OTHER'

export type EventCategoryType = 'TRANSPORT' | 'OPERATIONAL'

export type EventStatus = 
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'IN_TRANSIT'        // Pentru transport
  | 'DELIVERED'         // Pentru transport  
  | 'COMPLETED'
  | 'CANCELLED'
  | 'POSTPONED'
  | 'URGENT'
  | 'OVERDUE'           // Pentru reminders

export const EventPriority = {
  LOW: 'LOW', // Scăzută
  MEDIUM: 'MEDIUM', // Medie
  HIGH: 'HIGH', // Ridicată
  CRITICAL: 'CRITICAL', // Critică
  EMERGENCY: 'EMERGENCY' // Urgență
} as const

export type EventPriority = typeof EventPriority[keyof typeof EventPriority]

export const DocumentType = {
  PLANNING: 'PLANNING', // Planificare
  DECISION: 'DECISION', // Decizie
  REPORT: 'REPORT', // Referat
  AUTHORIZATION: 'AUTHORIZATION', // Autorizație
  INSPECTION_REPORT: 'INSPECTION_REPORT', // Raport de inspecție
  EPIDEMIOLOGICAL_REPORT: 'EPIDEMIOLOGICAL_REPORT', // Raport epidemiologic
  CORRESPONDENCE: 'CORRESPONDENCE', // Corespondență
  LEGAL_DOCUMENT: 'LEGAL_DOCUMENT', // Document legal
  PROTOCOL: 'PROTOCOL', // Protocol
  CHECKLIST: 'CHECKLIST', // Listă de verificare
  OTHER: 'OTHER' // Altele
} as const

export type DocumentType = typeof DocumentType[keyof typeof DocumentType]

// Metadate specifice DSP
export interface DSPMetadata {
  inspectionType?: 'FOOD_SAFETY' | 'WATER_QUALITY' | 'ENVIRONMENTAL' | 'OCCUPATIONAL_HEALTH' | 'COMMUNICABLE_DISEASES'
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  affectedPopulation?: number
  legalBasis?: string // Baza legală pentru acțiune
  followUpRequired?: boolean
  reportingDeadline?: string
  responsibleAuthority?: string
  externalParticipants?: string[]
  complianceStatus?: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'PENDING'
  sanctionsApplied?: boolean
  followUpDate?: string
}

export interface Attachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: Date
}

export interface EventDocument {
  id: number
  eventId: number
  documentType: DocumentType
  title: string
  description?: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  version: number
  isActive: boolean
  uploadedBy: number
  createdAt: string
  updatedAt: string
}

export interface EventAssignment {
  id: number
  eventId: number
  userId: number
  role: 'ORGANIZER' | 'PARTICIPANT' | 'OBSERVER' | 'DRIVER' | 'RESPONSIBLE'
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'MAYBE'
  responseDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
  user?: {
    id: number
    email: string
    firstName: string
    lastName: string
  }
}

export interface EventNotification {
  id: number
  eventId: number
  userId: number
  notificationType: 'REMINDER' | 'ASSIGNMENT' | 'CHANGE' | 'CANCELLATION' | 'APPROVAL_REQUEST'
  title: string
  message: string
  sendTime: string
  sentAt?: string
  isRead: boolean
  deliveryMethod: 'EMAIL' | 'SYSTEM' | 'BOTH'
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
}

export interface EventCategory {
  id: number
  name: string
  description?: string
  color: string
  icon?: string
  departmentId?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface EventTag {
  id: number
  name: string
  color: string
  createdAt: string
}

export interface EventTemplate {
  id: number
  name: string
  description?: string
  eventType: string
  durationMinutes: number
  defaultLocation?: string
  templateData: any
  departmentId?: number
  createdBy: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RecurringEvent {
  id: number
  parentEventId: number
  recurrencePattern: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  recurrenceInterval: number
  daysOfWeek?: string
  dayOfMonth?: number
  monthOfYear?: number
  endDate?: string
  maxOccurrences?: number
  createdOccurrences: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  description: string
  start: string
  end: string
  type: EventType
  status: EventStatus
  userId: number
  departmentId?: number | null
  isPrivate: boolean
  location: string | null
  vehicleId: number | null
  categoryId?: number | null
  priority: EventPriority
  approvalStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedBy?: number | null
  approvedAt?: string | null
  parentEventId?: number | null
  isRecurring: boolean
  metadata?: any
  dspMetadata?: DSPMetadata // Metadate specifice DSP
  transportData?: any // Date pentru evenimente de transport
  createdAt: string
  updatedAt: string
  user?: {
    id: number
    email: string
    firstName: string
    lastName: string
  }
  department?: {
    id: number
    name: string
    description?: string
  }
  vehicle?: {
    id: number
    brand: string
    model: string
    registration_number: string
    status: string
  }
  category?: EventCategory
  assignments?: EventAssignment[]
  documents?: EventDocument[]
  notifications?: EventNotification[]
  tags?: EventTag[]
  assignmentsCount?: number
  isAssignedToCurrentUser?: boolean
}

export interface CalendarViewState {
  view: 'day' | 'week' | 'month'
  date: Date
  events: CalendarEvent[]
}

export interface CalendarFilters {
  departmentId?: number
  startDate?: string
  endDate?: string
  userId?: number
  type?: EventType[]
  status?: EventStatus[]
}

export interface Department {
  id: number
  name: string
  description?: string
  parentId?: number
  createdAt: string
  updatedAt: string
}

export interface DepartmentUser {
  departmentId: number
  userId: number
  isManager: boolean
}

export type UserRole = 
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'DEPARTMENT_ADMIN'
  | 'MANAGER'
  | 'INSPECTOR'
  | 'OPERATOR'
  | 'VIEWER'

export interface CalendarPermissions {
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canViewPrivate: boolean
  canManageDepartment: boolean
}

export interface CalendarVehicle {
  id: number
  name: string
  registrationNumber: string
  type: string
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE'
  departmentId?: number
  createdAt: string
  updatedAt: string
} 

// Interfețe pentru sistemul de transport
export interface SupplierOrderItem {
  id?: number
  productId: number
  productName: string
  supplierId: number
  supplierName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  expectedDeliveryDate: string
  status: 'ORDERED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  notes?: string
}

export interface TransportEventData {
  orderId?: number
  supplierId: number
  supplierName: string
  supplierContact?: string
  deliveryAddress: string
  orderItems: SupplierOrderItem[]
  totalValue: number
  expectedDeliveryDate: string
  actualDeliveryDate?: string
  deliveryStatus: 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED'
  trackingNumber?: string
  deliveryNotes?: string
  receivedBy?: string
  isOverdue?: boolean
} 