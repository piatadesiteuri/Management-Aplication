import { 
  Box, 
  useColorModeValue, 
  useToast, 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalCloseButton,
  Button,
  VStack,
  Text,
  HStack,
  Badge,
  Icon,
  Flex,
  ModalFooter,
  Heading,
  SimpleGrid,
  ScaleFade,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  FormControl,
  FormLabel,
  Select,
  Textarea,
} from '@chakra-ui/react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { CalendarEvent, EventType, EventStatus } from '../../types/calendar'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarService } from '../../services/CalendarService'
import api from '../../services/api'
import { DSPPermissionService } from '../../services/DSPPermissionService'
import { useAuth } from '../../hooks/useAuth'
import EventModal from './EventModal'
import TransportOrderDocumentWithData from './TransportOrderDocumentWithData'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import EventAssignments from './EventAssignments'
import EventDocuments from './EventDocuments'
import EventNotifications from './EventNotifications'
import EventApprovalWorkflow from './EventApprovalWorkflow'
import EventReportingSystem from './EventReportingSystem'
import EventSupplies from './EventSupplies'
import AdvancedEventSearch from './AdvancedEventSearch'
import { FiClock, FiMapPin, FiUser, FiCalendar, FiTag, FiEdit2, FiTrash2, FiX, FiUsers, FiSearch, FiTruck, FiFile, FiBell, FiCheckCircle, FiBarChart, FiPackage, FiChevronDown, FiFilter, FiSettings, FiFileText, FiAlertTriangle } from 'react-icons/fi'
import DocumentViewerModal from './DocumentViewerModal'

const calendarService = new CalendarService()
const permissionService = DSPPermissionService.getInstance()

const TRANSPORT_EVENT_TYPES = ['SUPPLY_ORDER', 'TRANSPORT_DELIVERY', 'TRANSPORT_PICKUP'];

const isTransportEventType = (type?: string) => !!type && TRANSPORT_EVENT_TYPES.includes(type);

const EVENT_TYPE_LABELS: Record<string, string> = {
  SUPPLY_ORDER: 'Comandă aprovizionare',
  TRANSPORT_DELIVERY: 'Livrare transport',
  TRANSPORT_PICKUP: 'Ridicare transport',
  INSPECTION: 'Inspecție',
  MEETING: 'Ședință',
  TRAINING: 'Formare',
  TRAVEL: 'Deplasare',
  MAINTENANCE: 'Întreținere',
  STOCK_RECEPTION: 'Primire marfă',
  STOCK_DISTRIBUTION: 'Distribuire marfă',
  STOCK_MOVEMENT: 'Mutare marfă',
  INVENTORY_AUDIT: 'Inventariere',
  OTHER: 'Altele',
};

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Ciornă',
  PENDING: 'În aprobare',
  APPROVED: 'Aprobat',
  REJECTED: 'Respins',
};

const getEventTypeLabel = (type?: string) =>
  (type && EVENT_TYPE_LABELS[type]) || type || '—';

const formatEventDuration = (startStr?: string, endStr?: string) => {
  if (!startStr || !endStr) return '—';
  try {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return '—';
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes} min`;
  } catch {
    return '—';
  }
};

const mapApiEventToCalendarEvent = (event: any): CalendarEvent => {
  const safeJSONParse = (value: any, fallback: any = null) => {
    if (!value) return fallback;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return fallback; }
    }
    return value;
  };

  return {
    id: event.id.toString(),
    title: event.title || 'Eveniment fără titlu',
    start: event.start_time || event.start,
    end: event.end_time || event.end,
    description: event.description || '',
    type: event.type as EventType || 'OTHER',
    status: event.status as EventStatus || 'PENDING',
    userId: event.user_id || event.userId,
    departmentId: event.department_id || event.departmentId,
    isPrivate: Boolean(event.is_private === 1 || event.isPrivate),
    location: event.location || null,
    vehicleId: event.vehicle_id || event.vehicleId,
    categoryId: event.category_id || event.categoryId,
    priority: event.priority || 'MEDIUM',
    approvalStatus: event.approval_status || event.approvalStatus || 'APPROVED',
    approvedBy: event.approved_by || event.approvedBy,
    approvedAt: event.approved_at || event.approvedAt,
    parentEventId: event.parent_event_id || event.parentEventId,
    isRecurring: Boolean(event.is_recurring || event.isRecurring),
    metadata: event.metadata,
    createdAt: event.created_at || event.createdAt || new Date().toISOString(),
    updatedAt: event.updated_at || event.updatedAt || new Date().toISOString(),
    user: safeJSONParse(event.user),
    department: safeJSONParse(event.department),
    vehicle: safeJSONParse(event.vehicle),
    assignmentsCount: event.assignments_count || event.assignmentsCount || 0,
  };
};

const parseEventMetadata = (metadata: unknown): Record<string, any> => {
  if (!metadata) return {};
  if (typeof metadata === 'string') {
    try { return JSON.parse(metadata); } catch { return {}; }
  }
  return metadata as Record<string, any>;
};

const isEventFinalized = (metadata: unknown): boolean => {
  const m = parseEventMetadata(metadata);
  return m?.stockUpdated === true || m?.deliveryStatus === 'DELIVERED';
};

const formatEventInterval = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('ro-RO', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return '—'; }
};

const formatRoDateTime = (dateStr?: string) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('ro-RO', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return null; }
};

const eventColors: Record<EventType, { bg: string; border: string }> = {
  INSPECTION: { bg: 'rgba(66, 153, 225, 0.9)', border: '#3182ce' }, // Albastru - Inspecții
  EPIDEMIOLOGICAL_CONTROL: { bg: 'rgba(236, 72, 153, 0.9)', border: '#be185d' }, // Roz - Control epidemiologic
  MEETING: { bg: 'rgba(168, 85, 247, 0.9)', border: '#7c3aed' }, // Violet - Ședințe
  REPORTING: { bg: 'rgba(34, 197, 94, 0.9)', border: '#16a34a' }, // Verde - Raportări
  HEALTH_EMERGENCY: { bg: 'rgba(239, 68, 68, 0.9)', border: '#dc2626' }, // Roșu - Urgențe
  ADMINISTRATIVE: { bg: 'rgba(107, 114, 128, 0.9)', border: '#6b7280' }, // Gri - Administrativ
  TRAVEL: { bg: 'rgba(72, 187, 120, 0.9)', border: '#38a169' }, // Verde deschis - Deplasări
  TRAINING: { bg: 'rgba(251, 146, 60, 0.9)', border: '#ea580c' }, // Portocaliu - Formare
  PUBLIC_HEALTH_ACTION: { bg: 'rgba(14, 165, 233, 0.9)', border: '#0284c7' }, // Albastru deschis - Acțiuni
  MAINTENANCE: { bg: 'rgba(245, 158, 11, 0.9)', border: '#d97706' }, // Galben - Întreținere
  STOCK_RECEPTION: { bg: 'rgba(16, 185, 129, 0.9)', border: '#059669' }, // Verde închis - Primire marfă
  STOCK_DISTRIBUTION: { bg: 'rgba(99, 102, 241, 0.9)', border: '#6366f1' }, // Indigo - Distribuire marfă
  STOCK_MOVEMENT: { bg: 'rgba(139, 92, 246, 0.9)', border: '#8b5cf6' }, // Purple - Mutare marfă
  INVENTORY_AUDIT: { bg: 'rgba(244, 63, 94, 0.9)', border: '#f43f5e' }, // Roz roșu - Inventariere
  TRANSPORT_DELIVERY: { bg: 'rgba(76, 175, 80, 0.9)', border: '#4caf50' }, // Verde - Livrare transport
  TRANSPORT_PICKUP: { bg: 'rgba(255, 152, 0, 0.9)', border: '#ff9800' }, // Portocaliu - Ridicare transport
  SUPPLY_ORDER: { bg: 'rgba(156, 39, 176, 0.9)', border: '#9c27b0' }, // Mov - Comandă aprovizionare
  OTHER: { bg: 'rgba(160, 174, 192, 0.9)', border: '#718096' } // Gri deschis - Altele
}


interface CalendarProps {
  departmentId?: number;
}

export default function Calendar({ departmentId }: CalendarProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([])
  const [eventFilter, setEventFilter] = useState<'all' | 'transport' | 'operational' | 'personal'>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedDates, setSelectedDates] = useState<{ start: Date; end: Date } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [isAssignmentsModalOpen, setIsAssignmentsModalOpen] = useState(false)
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false)
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false)
  const [isApprovalWorkflowModalOpen, setIsApprovalWorkflowModalOpen] = useState(false)
  const [isReportingSystemModalOpen, setIsReportingSystemModalOpen] = useState(false)
  const [isStockManagementModalOpen, setIsStockManagementModalOpen] = useState(false)
  const [viewEventAssignments, setViewEventAssignments] = useState<any[]>([])
  const [viewEventMaterials, setViewEventMaterials] = useState<any[]>([])
  const [viewDetailsLoading, setViewDetailsLoading] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [statusComments, setStatusComments] = useState<string>('')
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)
  const [finalizeLoading, setFinalizeLoading] = useState(false)
  const [isFinalizeConfirmModalOpen, setIsFinalizeConfirmModalOpen] = useState(false)

  const [eventNotifications, setEventNotifications] = useState<any[]>([])
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.800', 'white')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const toast = useToast()
  const { user, isAuthenticated } = useAuth()

  const openEventById = useCallback(async (eventId: number) => {
    if (!Number.isFinite(eventId)) return;

    let eventToOpen = events.find((e) => parseInt(String(e.id), 10) === eventId);

    if (!eventToOpen) {
      try {
        const fetched = await calendarService.getEvents({});
        const mapped = fetched.find((e: any) => Number(e.id) === eventId);
        if (mapped) {
          eventToOpen = mapApiEventToCalendarEvent(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch event for deep link:', error);
      }
    }

    if (eventToOpen) {
      setSelectedEvent(eventToOpen);
      setIsViewModalOpen(true);
    }
  }, [events]);

  // Verificăm dacă există parametrul ?event= în URL pentru a deschide evenimentul automat
  useEffect(() => {
    const eventIdParam = searchParams.get('event');
    if (!eventIdParam) return;

    const eventId = parseInt(eventIdParam, 10);
    if (!Number.isFinite(eventId)) return;

    openEventById(eventId).then(() => {
      searchParams.delete('event');
      setSearchParams(searchParams, { replace: true });
    });
  }, [events, searchParams, setSearchParams, openEventById]);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ eventId: number }>;
      const eventId = custom.detail?.eventId;
      if (eventId) {
        openEventById(eventId);
      }
    };
    window.addEventListener('openCalendarEvent', handler);
    return () => window.removeEventListener('openCalendarEvent', handler);
  }, [openEventById]);

  // Adaug state global pentru documentul PDF de vizualizat
  const [pdfViewerDoc, setPdfViewerDoc] = useState<null | { id: number; file_name: string; mime_type: string }>(null)

  // Calendar component rendered

  // Handler pentru actualizarea statusului de aprobare
  const handleApprovalStatusChange = (newStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED') => {
    if (selectedEvent) {
      setSelectedEvent({
        ...selectedEvent,
        approvalStatus: newStatus
      });
      
      // Actualizează și în lista de evenimente
      setEvents(prev => prev.map(event => 
        event.id === selectedEvent.id 
          ? { ...event, approvalStatus: newStatus }
          : event
      ));
      
      // Reîncarcă evenimentele pentru a avea datele actualizate
      loadEvents();
    }
  };

  // Handler pentru actualizarea statusului comenzii de transport
  const handleTransportStatusUpdate = async () => {
    if (!selectedEvent || !selectedStatus) {
      toast({
        title: '❌ Eroare',
        description: 'Vă rugăm să selectați un status nou.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setStatusUpdateLoading(true);

    try {
      console.log('🔄 Actualizare status transport:', {
        eventId: selectedEvent.id,
        newStatus: selectedStatus,
        comments: statusComments
      });

      // Apelăm endpoint-ul backend pentru actualizarea statusului
      const response = await calendarService.updateTransportEventStatus(
        selectedEvent.id,
        selectedStatus,
        statusComments
      );

      console.log('📥 Backend response:', response);

      if (response.success) {
        // Actualizăm evenimentul în interfață cu datele de la backend
        const updatedEvent = {
          ...selectedEvent,
          status: selectedStatus as EventStatus,
          metadata: response.updatedMetadata
        };

        setSelectedEvent(updatedEvent);
        
        // Actualizăm și în lista de evenimente
        setEvents(prev => prev.map(event => 
          event.id === selectedEvent.id 
            ? updatedEvent
            : event
        ));

        // Închidem modalul de status
        setIsStatusModalOpen(false);
        
        // Resetăm state-ul
        setSelectedStatus('');
        setStatusComments('');

        toast({
          title: '✅ Status Actualizat',
          description: `Statusul comenzii a fost actualizat la: ${selectedStatus}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        console.log('✅ Status transport actualizat cu succes în backend');
      } else {
        throw new Error('Backend nu a returnat success');
      }
    } catch (error) {
      console.error('❌ Eroare la actualizarea statusului:', error);
      toast({
        title: '❌ Eroare',
        description: 'Nu s-a putut actualiza statusul comenzii. Vă rugăm să încercați din nou.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Handler pentru deschiderea modalului de status
  const handleOpenStatusModal = () => {
    if (selectedEvent) {
      // Setăm statusul curent ca valoare inițială
      const currentStatus = selectedEvent.metadata?.deliveryStatus || selectedEvent.status || 'PENDING';
      setSelectedStatus(currentStatus);
      setStatusComments('');
      setIsStatusModalOpen(true);
    }
  };

  // Handler pentru finalizarea comenzii de transport
  const handleFinalizeOrder = async () => {
    if (!selectedEvent) return;

    setFinalizeLoading(true);

    try {
      console.log('🎯 Finalizing transport order:', selectedEvent.id);

      const response = await calendarService.finalizeTransportOrder(selectedEvent.id);
      const finalizedAt = response.finalizedAt || new Date().toISOString();
      const formattedTime = formatRoDateTime(finalizedAt);

      toast({
        title: '✅ Livrare Finalizată',
        description: formattedTime
          ? `Stocul a fost actualizat. Finalizat la ${formattedTime}.`
          : 'Comanda a fost finalizată cu succes! Stocul a fost actualizat automat.',
        status: 'success',
        duration: 6000,
        isClosable: true,
      });

      const updatedMetadata = {
        ...parseEventMetadata(selectedEvent.metadata),
        deliveryStatus: 'DELIVERED',
        stockUpdated: true,
        finalizedAt,
        completedAt: finalizedAt,
      };

      setSelectedEvent({
        ...selectedEvent,
        status: 'COMPLETED',
        metadata: updatedMetadata,
      });

      loadEvents();
      setIsFinalizeConfirmModalOpen(false);

      console.log('✅ Transport order finalized successfully:', response);
    } catch (error: any) {
      console.error('❌ Error finalizing transport order:', error);
      toast({
        title: '❌ Eroare',
        description: error.message || 'Nu s-a putut finaliza comanda. Încercați din nou.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setFinalizeLoading(false);
    }
  };

  const loadEvents = useCallback(async () => {
    try {
      console.log('📅 loadEvents called:', {
        isAuthenticated,
        user,
        departmentId
      });

      if (!isAuthenticated || !user) {
        console.log('❌ Cannot load events - no authenticated user');
        return;
      }

      let fetchedEvents: any[];
      
      // Pentru toți utilizatorii, folosim aceeași metodă getEvents()
      // Backend-ul va gestiona automat vizibilitatea în funcție de roluri
      console.log('🔍 Fetching events for user:', {
          userId: user.id,
        roles: user.roles,
          departmentId: departmentId
        });
      
      const filters: any = {};
      if (departmentId) {
        filters.departmentId = departmentId;
      }
      
      // Adăugăm filtrul personal dacă este selectat
      if (eventFilter === 'personal') {
        filters.personal = true;
      }
      
      fetchedEvents = await calendarService.getEvents(filters);
      
      console.log('📥 Raw events from API:', fetchedEvents);
      
      // Remove duplicate events by ID
      const uniqueEvents = fetchedEvents.reduce((acc: any[], current: any) => {
        const exists = acc.find(event => event.id === current.id);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      const mappedEvents: CalendarEvent[] = uniqueEvents.map((event: any) => {
        // Funcție helper pentru parsarea sigură a JSON-ului
        const safeJSONParse = (value: any, fallback: any = null) => {
          if (!value) return fallback;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (error) {
              console.warn('Failed to parse JSON:', value);
              return fallback;
            }
          }
          return value;
        };

        return {
          id: event.id.toString(),
          title: event.title || 'Eveniment fără titlu',
          start: event.start_time || event.start,
          end: event.end_time || event.end,
          description: event.description || '',
          type: event.type as EventType || 'OTHER',
          status: event.status as EventStatus || 'PENDING',
          userId: event.user_id || event.userId,
          departmentId: event.department_id || event.departmentId,
          isPrivate: Boolean(event.is_private === 1 || event.isPrivate),
          location: event.location || null,
          vehicleId: event.vehicle_id || event.vehicleId,
          categoryId: event.category_id || event.categoryId,
          priority: event.priority || 'MEDIUM',
          approvalStatus: event.approval_status || event.approvalStatus || 'APPROVED',
          approvedBy: event.approved_by || event.approvedBy,
          approvedAt: event.approved_at || event.approvedAt,
          parentEventId: event.parent_event_id || event.parentEventId,
          isRecurring: Boolean(event.is_recurring || event.isRecurring),
          metadata: event.metadata,
          createdAt: event.created_at || event.createdAt || new Date().toISOString(),
          updatedAt: event.updated_at || event.updatedAt || new Date().toISOString(),
          user: safeJSONParse(event.user),
          department: safeJSONParse(event.department),
          vehicle: safeJSONParse(event.vehicle),
          assignments: [], // Va fi populat cu assignments_count
          assignmentsCount: event.assignments_count || event.assignmentsCount || 0,
          isAssignedToCurrentUser: Boolean(event.is_assigned_to_current_user)
        };
      });
      
      console.log('📅 Mapped events:', mappedEvents);
      
      // Filtrează evenimentele pe baza rolului utilizatorului
      let filteredEvents = mappedEvents;
      
      if (user?.roles?.includes('WAREHOUSE_KEEPER')) {
        // Magazionerul vede doar evenimentele de transport/comandă
        filteredEvents = mappedEvents.filter(event => 
          event.type === 'SUPPLY_ORDER' || 
          event.type === 'TRANSPORT_DELIVERY' ||
          event.type === 'TRANSPORT_PICKUP'
        );
        console.log('🏪 Filtered events for warehouse keeper:', filteredEvents);
      }
      
      setEvents(filteredEvents);
    } catch (error) {
      console.error('❌ Error loading events:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca evenimentele.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast, user, departmentId, isAuthenticated]);

  // Funcție pentru filtrarea evenimentelor
  const filterEvents = useCallback(() => {
    console.log('🔍 Filtering events with filter:', eventFilter);
    
    let filtered: CalendarEvent[];
    
    switch (eventFilter) {
      case 'transport':
        // Evenimente de transport
        filtered = events.filter(event => 
          ['SUPPLY_ORDER', 'TRANSPORT_DELIVERY', 'TRANSPORT_PICKUP'].includes(event.type)
        );
        console.log('🚛 Transport events filtered:', filtered.length);
        break;
        
      case 'operational':
        // Evenimente operaționale (toate în afară de transport)
        filtered = events.filter(event => 
          !['SUPPLY_ORDER', 'TRANSPORT_DELIVERY', 'TRANSPORT_PICKUP'].includes(event.type)
        );
        console.log('⚙️ Operational events filtered:', filtered.length);
        break;
        
      case 'personal':
        // Evenimente la care utilizatorul este asignat
        filtered = events.filter(event => event.isAssignedToCurrentUser);
        console.log('👤 Personal events filtered:', filtered.length);
        break;
        
      default:
        // Toate evenimentele
        filtered = events;
        console.log('📅 All events shown:', filtered.length);
        break;
    }
    
    setFilteredEvents(filtered);
  }, [events, eventFilter]);

  // Aplicăm filtrarea când se schimbă evenimentele sau filtrul
  useEffect(() => {
    filterEvents();
  }, [filterEvents]);

  useEffect(() => {
    // Calendar useEffect triggered
    
    if (isAuthenticated && user) {
      loadEvents();
    }
  }, [loadEvents, user, isAuthenticated]);

  useEffect(() => {
    if (!isViewModalOpen || !selectedEvent?.id) {
      setViewEventAssignments([]);
      setViewEventMaterials([]);
      return;
    }

    let cancelled = false;

    const loadViewDetails = async () => {
      setViewDetailsLoading(true);
      try {
        const [assignments, materialsRes] = await Promise.all([
          calendarService.getEventAssignments(selectedEvent.id).catch(() => []),
          api.get(`/calendar/events/${selectedEvent.id}/materials`).catch(() => ({ data: [] })),
        ]);

        if (!cancelled) {
          setViewEventAssignments(Array.isArray(assignments) ? assignments : []);
          const materials = materialsRes?.data;
          setViewEventMaterials(Array.isArray(materials) ? materials : []);
        }
      } finally {
        if (!cancelled) setViewDetailsLoading(false);
      }
    };

    loadViewDetails();
    return () => { cancelled = true; };
  }, [isViewModalOpen, selectedEvent?.id]);

  const handleEventClick = useCallback((info: any) => {
    const event = info.event;
    const eventData: CalendarEvent = {
      id: event.id,
      title: event.title,
      start: event.start ? event.start.toISOString() : new Date().toISOString(),
      end: event.end ? event.end.toISOString() : new Date().toISOString(),
      description: event.extendedProps.description || '',
      type: event.extendedProps.type,
      status: event.extendedProps.status,
      userId: event.extendedProps.userId,
      departmentId: event.extendedProps.departmentId,
      isPrivate: event.extendedProps.isPrivate,
      location: event.extendedProps.location,
      vehicleId: event.extendedProps.vehicleId,
      categoryId: event.extendedProps.categoryId,
      priority: event.extendedProps.priority || 'MEDIUM',
      approvalStatus: event.extendedProps.approvalStatus || 'APPROVED',
      approvedBy: event.extendedProps.approvedBy,
      approvedAt: event.extendedProps.approvedAt,
      parentEventId: event.extendedProps.parentEventId,
      isRecurring: event.extendedProps.isRecurring || false,
      metadata: event.extendedProps.metadata,
      createdAt: event.extendedProps.createdAt || (event.start ? event.start.toISOString() : new Date().toISOString()),
      updatedAt: event.extendedProps.updatedAt || (event.start ? event.start.toISOString() : new Date().toISOString()),
      user: event.extendedProps.user,
      department: event.extendedProps.department,
      vehicle: event.extendedProps.vehicle,
      assignmentsCount: event.extendedProps.assignmentsCount || 0
    };

    setSelectedEvent(eventData);
    setIsViewModalOpen(true);
  }, []);

  const handleDateSelect = useCallback((selectInfo: any) => {
    if (!user) {
      toast({
        title: 'Autentificare necesară',
        description: 'Trebuie să fiți autentificat pentru a crea evenimente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Verificăm permisiunile DSP pentru crearea de evenimente
    // Verificăm dacă utilizatorul are rol administrativ sau verificăm primul rol
    const hasAdminRole = user.roles.some(role => 
      ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER'].includes(role)
    );
    
    const userRole = user.roles[0] as any; // Primul rol pentru verificări specifice
    const canCreateEvent = hasAdminRole || permissionService.canPerformAction(userRole, 'CREATE_EVENT');
    
    console.log('🔐 Permission check for event creation:', { 
      userId: user.id, 
      roles: user.roles, 
      firstRole: userRole,
      hasAdminRole,
      canCreateEvent
    });
    
    if (!canCreateEvent) {
      console.log('❌ Permission denied for user:', { 
        userId: user.id, 
        roles: user.roles, 
        firstRole: userRole,
        hasAdminRole 
      });
      toast({
        title: 'Acces interzis',
        description: 'Nu aveți permisiunea de a crea evenimente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Ensure we're working with the local timezone
    const start = new Date(selectInfo.start);

    setSelectedDates({
      start,
      end: new Date(start) // Use same date for end to ensure single-day events
    });
    setIsCreateModalOpen(true);
    selectInfo.view.calendar.unselect();
  }, [user, toast, permissionService]);

  const handleEventCreate = async (eventData: {
    title: string;
    description: string;
    start: string;
    end: string;
    type: EventType;
    status: EventStatus;
    isPrivate: boolean;
    assignedUsers?: number[];
    vehicleId?: number | null;
    location?: string | null;
    documents?: string[];
    departmentId?: number | null;
    transportData?: any;
  }) => {
    try {
      // Creating event with transport data

      const { documents, ...eventDataWithoutDocs } = eventData;
      const finalEventData = {
        ...eventDataWithoutDocs,
        userId: Number(user!.id),
        departmentId: eventData.departmentId || null,
        location: eventData.location || null,
        vehicleId: eventData.vehicleId || null,
        priority: 'MEDIUM' as const,
        approvalStatus: 'DRAFT' as const,
        isRecurring: false,
        transportData: eventData.transportData || null
      };
      
      console.log('📤 Sending to calendarService.createEvent:', {
        ...finalEventData,
        transportData: finalEventData.transportData ? 'PRESENT' : 'NOT_PRESENT'
      });
      
      await calendarService.createEvent(finalEventData);

      toast({
        title: 'Eveniment creat cu succes! 🎉',
        description: `Evenimentul "${eventData.title}" a fost programat.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      loadEvents();
    } catch (error: any) {
      console.error('❌ Error creating event:', error);
      toast({
        title: 'Eroare la creare',
        description: error?.response?.data?.message || error?.message || 'Nu s-a putut crea evenimentul. Încercați din nou.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };

  const getEventStatusName = (status: EventStatus) => {
    switch (status) {
      case 'DRAFT': return 'Ciornă';
      case 'PENDING': return 'În așteptare';
      case 'APPROVED': return 'Aprobat';
      case 'IN_PROGRESS': return 'În desfășurare';
      case 'COMPLETED': return 'Finalizat';
      case 'CANCELLED': return 'Anulat';
      case 'POSTPONED': return 'Amânat';
      case 'URGENT': return 'Urgent';
      default: return 'Necunoscut';
    }
  };

  const handleEventDrop = useCallback(async (dropInfo: any) => {
    const event = dropInfo.event;
    const canEdit = user?.roles.some(role => 
      ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER'].includes(role)
    ) || event.extendedProps.userId === Number(user?.id);

    if (!canEdit) {
      dropInfo.revert();
      toast({
        title: 'Acces interzis',
        description: 'Nu aveți permisiunea de a modifica acest eveniment.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await calendarService.updateEvent(event.id, {
        start: event.startStr,
        end: event.endStr
      });

      toast({
        title: 'Eveniment actualizat',
        description: 'Evenimentul a fost mutat cu succes.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating event:', error);
      dropInfo.revert();
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza evenimentul.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast, user]);

  const handleEventEdit = async (eventData: {
    id: string;
    title: string;
    description: string;
    start: string;
    end: string;
    type: EventType;
    status: EventStatus;
    isPrivate: boolean;
    assignedUsers?: number[];
    vehicleId?: number | null;
    location?: string | null;
    documents?: string[];
    departmentId?: number | null;
    transportData?: any;
  }) => {
    try {
      console.log('📝 Updating event with data:', {
        ...eventData,
        transportData: eventData.transportData ? 'PRESENT' : 'NOT_PRESENT'
      });
      
      const updatedData = {
        title: eventData.title,
        description: eventData.description,
        start: eventData.start,
        end: eventData.end,
        type: eventData.type,
        status: eventData.status,
        isPrivate: eventData.isPrivate,
        departmentId: eventData.departmentId,
        vehicleId: eventData.vehicleId,
        location: eventData.location,
        transportData: eventData.transportData || null
      };
      
      console.log('📤 Sending updated data to backend:', {
        id: eventData.id,
        transportData: eventData.transportData,
        orderItems: eventData.transportData?.orderItems,
        totalValue: eventData.transportData?.totalValue
      });

      await calendarService.updateEvent(eventData.id, updatedData);

      toast({
        title: 'Eveniment actualizat! 🎉',
        description: `Evenimentul "${eventData.title}" a fost actualizat cu succes.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      loadEvents();
      setIsViewModalOpen(false);
      setSelectedEvent(null);
    } catch (error: any) {
      console.error('❌ Error updating event:', error);
      toast({
        title: 'Eroare la actualizare',
        description: error?.response?.data?.message || error?.message || 'Nu s-a putut actualiza evenimentul. Încercați din nou.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      setDeleteLoading(true)
      await calendarService.deleteEvent(eventId);
      toast({
        title: 'Eveniment șters cu succes! ✅',
        description: 'Evenimentul a fost șters din calendar.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadEvents();
      setIsViewModalOpen(false);
      setSelectedEvent(null);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Eroare la ștergere',
        description: 'Nu s-a putut șterge evenimentul. Încercați din nou.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeleteLoading(false)
    }
  };

  const handleAdvancedSearchEventSelect = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsViewModalOpen(true);
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Header cu butoane de filtrare și căutare */}
      <Flex 
        justify="space-between" 
        align="center" 
        bg={bgColor}
        p={4}
        borderRadius="xl"
        shadow="sm"
        mx={4}
      >
        <VStack align="start" spacing={1}>
          <Heading size="lg" color={textColor}>
            Calendar Evenimente
          </Heading>
          <HStack spacing={2}>
            <Badge 
              colorScheme={
                eventFilter === 'all' ? 'blue' : 
                eventFilter === 'transport' ? 'green' : 'orange'
              }
              variant="subtle"
              fontSize="sm"
            >
              {filteredEvents.length} evenimente afișate
            </Badge>
            {eventFilter !== 'all' && (
              <Badge 
                colorScheme="gray" 
                variant="outline" 
                fontSize="xs"
                cursor="pointer"
                onClick={() => setEventFilter('all')}
                _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
              >
                Arată toate
              </Badge>
            )}
          </HStack>
        </VStack>
        
        <HStack spacing={4}>
          {/* Buton de filtrare evenimente */}
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<FiChevronDown />}
              leftIcon={<FiFilter />}
              colorScheme="blue"
              variant="outline"
              size="lg"
              borderRadius="xl"
              px={6}
              _hover={{
                bg: useColorModeValue('blue.50', 'blue.900'),
                transform: 'translateY(-2px)',
                shadow: 'lg'
              }}
              transition="all 0.3s ease"
            >
              {eventFilter === 'all' && 'Toate Evenimentele'}
              {eventFilter === 'transport' && '🚛 Transport'}
              {eventFilter === 'operational' && '⚙️ Operaționale'}
              {eventFilter === 'personal' && '👤 Personale'}
            </MenuButton>
            <MenuList
              bg={useColorModeValue('white', 'gray.800')}
              borderColor={borderColor}
              shadow="xl"
            >
              <MenuItem
                icon={<FiCalendar />}
                onClick={() => setEventFilter('all')}
                bg={eventFilter === 'all' ? useColorModeValue('blue.50', 'blue.900') : 'transparent'}
                _hover={{
                  bg: useColorModeValue('blue.50', 'blue.900')
                }}
              >
                <HStack>
                  <Text>📅 Toate Evenimentele</Text>
                  <Badge colorScheme="blue" variant="subtle" ml="auto">
                    {events.length}
                  </Badge>
                </HStack>
              </MenuItem>
              <MenuDivider />
              <MenuItem
                icon={<FiTruck />}
                onClick={() => setEventFilter('transport')}
                bg={eventFilter === 'transport' ? useColorModeValue('green.50', 'green.900') : 'transparent'}
                _hover={{
                  bg: useColorModeValue('green.50', 'green.900')
                }}
              >
                <HStack>
                  <Text>🚛 Evenimente Transport</Text>
                  <Badge colorScheme="green" variant="subtle" ml="auto">
                    {events.filter(e => ['SUPPLY_ORDER', 'TRANSPORT_DELIVERY', 'TRANSPORT_PICKUP'].includes(e.type)).length}
                  </Badge>
                </HStack>
              </MenuItem>
              <MenuItem
                icon={<FiSettings />}
                onClick={() => setEventFilter('operational')}
                bg={eventFilter === 'operational' ? useColorModeValue('orange.50', 'orange.900') : 'transparent'}
                _hover={{
                  bg: useColorModeValue('orange.50', 'orange.900')
                }}
              >
                <HStack>
                  <Text>⚙️ Evenimente Operaționale</Text>
                  <Badge colorScheme="orange" variant="subtle" ml="auto">
                    {events.filter(e => !['SUPPLY_ORDER', 'TRANSPORT_DELIVERY', 'TRANSPORT_PICKUP'].includes(e.type)).length}
                  </Badge>
                </HStack>
              </MenuItem>
              <MenuItem
                icon={<FiUser />}
                onClick={() => setEventFilter('personal')}
                bg={eventFilter === 'personal' ? useColorModeValue('yellow.50', 'yellow.900') : 'transparent'}
                _hover={{
                  bg: useColorModeValue('yellow.50', 'yellow.900')
                }}
              >
                <HStack>
                  <Text>👤 Evenimente Personale</Text>
                  <Badge colorScheme="yellow" variant="subtle" ml="auto">
                    {events.filter(e => e.isAssignedToCurrentUser).length}
                  </Badge>
                </HStack>
              </MenuItem>
            </MenuList>
          </Menu>
          
          <Button
            leftIcon={<FiSearch />}
            colorScheme="purple"
            variant="outline"
            size="lg"
            borderRadius="xl"
            px={6}
            _hover={{
              bg: useColorModeValue('purple.50', 'purple.900'),
              transform: 'translateY(-2px)',
              shadow: 'lg'
            }}
            transition="all 0.3s ease"
            onClick={() => setIsAdvancedSearchOpen(true)}
          >
            Căutare Avansată
          </Button>
        </HStack>
      </Flex>

      <Box 
        bg={bgColor} 
        p={4} 
        borderRadius="xl" 
        shadow="lg"
        mx={4}
        className="calendar-container"
      sx={{
        '@keyframes shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        '.fc': {
          height: 'calc(100vh - 100px)',
          color: textColor,
        },
        '.fc-toolbar-title': {
          color: textColor,
          fontSize: '1.5rem !important',
          fontWeight: 'bold',
        },
        '.fc-button': {
          backgroundColor: 'brand.primary.500 !important',
          borderColor: 'brand.primary.600 !important',
          transition: 'all 0.2s',
          '&:hover': {
            backgroundColor: 'brand.primary.600 !important',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&:disabled': {
            backgroundColor: 'gray.300 !important',
            opacity: 0.7,
          },
        },
        '.fc-day': {
          transition: 'all 0.2s',
          backgroundColor: bgColor,
          borderColor: useColorModeValue('gray.100', 'gray.700'),
          '&:hover': {
            backgroundColor: useColorModeValue('gray.50', 'gray.700'),
          },
        },
        '.fc-day-today': {
          backgroundColor: useColorModeValue('blue.50', 'blue.900') + '!important',
        },
        '.fc-event': {
          borderRadius: '6px',
          padding: '4px 6px',
          transition: 'all 0.2s',
          cursor: 'pointer',
          border: '2px solid rgba(255, 255, 255, 0.3) !important',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            border: '2px solid rgba(255, 255, 255, 0.6) !important',
          },
        },
        // Stiluri pentru evenimentele la care utilizatorul este asignat
        '.assigned-event': {
          border: '3px solid #3B82F6 !important',
          backgroundColor: 'rgba(59, 130, 246, 0.15) !important',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25) !important',
          position: 'relative',
          '&::before': {
            content: '"👤"',
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            background: '#3B82F6',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            fontWeight: 'bold',
            boxShadow: '0 2px 6px rgba(59, 130, 246, 0.4)',
            zIndex: '10',
            border: '2px solid white',
          },
          '&:hover': {
            backgroundColor: 'rgba(59, 130, 246, 0.25) !important',
            boxShadow: '0 6px 16px rgba(59, 130, 246, 0.35) !important',
            transform: 'translateY(-1px)',
            transition: 'all 0.2s ease-in-out',
            '&::before': {
              background: '#2563EB',
              boxShadow: '0 3px 8px rgba(37, 99, 235, 0.5)',
            },
          },
        },
        '.fc-event-main': {
          padding: '4px 6px',
        },
        '.fc-event-time': {
          fontSize: '0.8em',
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
          color: 'white !important',
          marginBottom: '2px',
          display: 'block',
        },
        '.fc-event-title': {
          fontSize: '0.85em',
          fontWeight: 'semibold',
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
          color: 'white !important',
          lineHeight: '1.2',
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-line-clamp': '2',
          '-webkit-box-orient': 'vertical',
        },
        '.fc-event-title:contains("🚛")': {
          fontSize: '0.9em',
          fontWeight: 'bold',
        },
        '.fc-event-main-frame': {
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        },
        '.fc-v-event': {
          borderWidth: '0 0 0 4px',
          backgroundColor: 'transparent',
          '.fc-event-main': {
            padding: '4px',
          },
        },
        '.fc-h-event': {
          borderWidth: '0 0 0 4px',
          backgroundColor: 'transparent',
          '.fc-event-main': {
            padding: '2px 4px',
          },
        },
        '.fc-timegrid-slot': {
          backgroundColor: bgColor,
          borderColor: useColorModeValue('gray.100', 'gray.700'),
        },
        '.fc-list-day': {
          backgroundColor: useColorModeValue('gray.50', 'gray.700'),
        },
        '.fc-list-event': {
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: useColorModeValue('gray.100', 'gray.600'),
          },
        },
      }}
    >
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={filteredEvents.filter(event => {
          // Filter out events with invalid dates or missing required fields
          try {
            return event.id && event.title && event.start && event.end && 
                   !isNaN(new Date(event.start).getTime()) && 
                   !isNaN(new Date(event.end).getTime());
          } catch (error) {
            console.warn('Invalid event filtered out:', event, error);
            return false;
          }
        }).map(event => {
          // Use fallback colors if event type is not found
          const colors = eventColors[event.type] || eventColors.OTHER;
          
          // Funcție pentru a extrage informațiile de transport din metadata
          const getTransportInfo = (metadata: any) => {
            if (!metadata) return null;
            
            try {
              // MySQL poate returna metadata ca obiect JavaScript sau ca JSON string
              let parsedMetadata;
              if (typeof metadata === 'string') {
                parsedMetadata = JSON.parse(metadata);
              } else if (typeof metadata === 'object' && metadata !== null) {
                // Dacă este deja un obiect (cazul cu MySQL)
                parsedMetadata = metadata;
              } else {
                return null;
              }
              
              // Verificăm dacă este eveniment de transport
              if (parsedMetadata.transportType && 
                  ['SUPPLY_ORDER', 'TRANSPORT_DELIVERY', 'TRANSPORT_PICKUP'].includes(parsedMetadata.transportType)) {
                return {
                  supplierName: parsedMetadata.supplierName || 'Furnizor necunoscut',
                  totalValue: parsedMetadata.totalValue || 0,
                  deliveryStatus: parsedMetadata.deliveryStatus || 'ORDERED',
                  orderId: parsedMetadata.orderId || 'N/A'
                };
              }
            } catch (error) {
              console.warn('Failed to parse transport metadata:', error);
            }
            
            return null;
          };

          const transportInfo = getTransportInfo(event.metadata);
          const isTransportEvent = transportInfo !== null;
          
          // Pentru evenimentele de transport, modificăm titlul și adăugăm informații suplimentare
          let displayTitle = event.title;
          let displayDescription = event.description;
          
          if (isTransportEvent) {
            // Adăugăm icon și numele furnizorului în titlu
            displayTitle = `🚛 ${transportInfo.supplierName}`;
            displayDescription = `Comandă #${transportInfo.orderId} • ${Number(transportInfo.totalValue || 0).toFixed(2)} lei • ${transportInfo.deliveryStatus}`;
          }
          
          return {
          id: event.id,
            title: displayTitle,
          start: new Date(event.start),
          end: new Date(event.end),
            description: displayDescription,
            backgroundColor: colors.bg,
            borderColor: colors.border,
          textColor: 'white',
            // Adăugăm efect de glow pentru evenimentele la care utilizatorul este asignat
            className: event.isAssignedToCurrentUser ? 'assigned-event' : '',
          extendedProps: {
            type: event.type,
            status: event.status,
            description: event.description,
            userId: event.userId,
            departmentId: event.departmentId,
            isPrivate: event.isPrivate,
            location: event.location,
            vehicleId: event.vehicleId,
            createdAt: event.createdAt || event.start,
            updatedAt: event.updatedAt || event.start,
            user: event.user,
            department: event.department,
            vehicle: event.vehicle,
            assignmentsCount: event.assignmentsCount,
            priority: event.priority,
            approvalStatus: event.approvalStatus,
            approvedBy: event.approvedBy,
            approvedAt: event.approvedAt,
            parentEventId: event.parentEventId,
            isRecurring: event.isRecurring,
            metadata: event.metadata,
              categoryId: event.categoryId,
              // Adăugăm informații suplimentare pentru evenimentele de transport
              transportInfo: transportInfo,
              isTransportEvent: isTransportEvent,
              originalTitle: event.title
          },
          };
        })}
        editable={user?.roles.some(role => 
          ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'INSPECTOR'].includes(role)
        )}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={3}
        weekends={true}
        eventClick={handleEventClick}
        select={handleDateSelect}
        eventDrop={handleEventDrop}
        timeZone="local"
        firstDay={1}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        slotDuration="00:30:00"
        locale="ro"
        buttonText={{
          today: 'Astăzi',
          month: 'Lună',
          week: 'Săptămână',
          day: 'Zi',
        }}
      />

      <Modal 
        isOpen={isViewModalOpen && !!selectedEvent} 
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedEvent(null);
        }}
        size={isTransportEventType(selectedEvent?.type) ? "6xl" : "2xl"}
        motionPreset="slideInBottom"
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay 
          backdropFilter="blur(20px)" 
          bg="blackAlpha.700"
        />
        <ModalContent
          borderRadius="3xl"
          border="none"
          shadow="2xl"
          overflow="hidden"
          mx={4}
          my={4}
          bg={useColorModeValue('white', 'gray.800')}
          maxH="92vh"
          display="flex"
          flexDirection="column"
        >
          {selectedEvent && (
            <>
              <ModalHeader borderBottomWidth="1px" borderColor={borderColor} py={4}>
                <VStack align="start" spacing={1}>
                  <Heading size="md">{selectedEvent.title}</Heading>
                  <HStack spacing={2} flexWrap="wrap">
                    <Badge variant="outline">{getEventTypeLabel(selectedEvent.type)}</Badge>
                    <Badge colorScheme={
                      selectedEvent.status === 'COMPLETED' ? 'green' :
                      selectedEvent.status === 'IN_PROGRESS' ? 'blue' :
                      selectedEvent.status === 'CANCELLED' ? 'red' : 'orange'
                    }>
                      {getEventStatusName(selectedEvent.status)}
                    </Badge>
                    {selectedEvent.priority && (
                      <Badge colorScheme="gray">{selectedEvent.priority}</Badge>
                    )}
                    {selectedEvent.isPrivate && (
                      <Badge colorScheme="purple" variant="subtle">Privat</Badge>
                    )}
                    {selectedEvent.approvalStatus && selectedEvent.approvalStatus !== 'APPROVED' && (
                      <Badge colorScheme="yellow" variant="subtle">
                        {APPROVAL_STATUS_LABELS[selectedEvent.approvalStatus] || selectedEvent.approvalStatus}
                      </Badge>
                    )}
                  </HStack>
                </VStack>
              </ModalHeader>
              <ModalCloseButton />

              <ModalBody p={5}>
                <VStack spacing={4} align="stretch">
                  {/* Pentru evenimente de transport, afișăm informații relevante într-un design modern */}
                  {selectedEvent.type === 'SUPPLY_ORDER' ? (
                    <Box
                      bg={useColorModeValue('white', 'gray.800')}
                      borderRadius="xl"
                      p={6}
                      mb={6}
                      border="1px solid"
                      borderColor={useColorModeValue('gray.200', 'gray.600')}
                      boxShadow="lg"
                      position="relative"
                      overflow="hidden"
                    >
                      {/* Gradient background */}
                      <Box
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        height="4px"
                        bg="linear-gradient(90deg, #667eea 0%, #764ba2 100%)"
                      />
                      
                      {/* Header cu numele furnizorului */}
                      <HStack justify="space-between" align="start" mb={6}>
                        <VStack align="start" spacing={2}>
                          <HStack spacing={3}>
                            <Box
                              p={2}
                      borderRadius="lg"
                              bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                              color="white"
                            >
                              <Icon as={FiTruck} boxSize={5} />
                            </Box>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="lg" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
                                {(() => {
                                  try {
                                    const metadata = typeof selectedEvent.metadata === 'string' 
                                      ? JSON.parse(selectedEvent.metadata) 
                                      : selectedEvent.metadata;
                                    return metadata?.supplierName || 'Furnizor necunoscut';
                                  } catch {
                                    return 'Furnizor necunoscut';
                                  }
                                })()}
                              </Text>
                              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                                Comandă de aprovizionare
                              </Text>
                            </VStack>
                          </HStack>
                        </VStack>
                        
                        {/* Status badge modern */}
                        <Badge
                          size="lg"
                          colorScheme={
                            selectedEvent.metadata && (() => {
                              try {
                                const metadata = typeof selectedEvent.metadata === 'string' 
                                  ? JSON.parse(selectedEvent.metadata) 
                                  : selectedEvent.metadata;
                                return metadata.deliveryStatus === 'DELIVERED' ? 'green' :
                                       metadata.deliveryStatus === 'IN_TRANSIT' ? 'orange' :
                                       metadata.deliveryStatus === 'CONFIRMED' ? 'blue' : 'yellow';
                              } catch {
                                return 'gray';
                              }
                            })()
                          }
                          variant="solid"
                          px={4}
                          py={2}
                          borderRadius="full"
                          fontSize="sm"
                          fontWeight="semibold"
                        >
                          {(() => {
                            try {
                              const metadata = typeof selectedEvent.metadata === 'string' 
                                ? JSON.parse(selectedEvent.metadata) 
                                : selectedEvent.metadata;
                              const status = metadata?.deliveryStatus || 'PENDING';
                              return status === 'DELIVERED' ? 'Livrat' :
                                     status === 'IN_TRANSIT' ? 'În transport' :
                                     status === 'CONFIRMED' ? 'Confirmat' : 'În așteptare';
                            } catch {
                              return 'În așteptare';
                            }
                          })()}
                        </Badge>
                      </HStack>
                      
                      {/* Informații relevante într-un layout modern */}
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                        {/* Data și ora comenzii */}
                        <Box>
                          <HStack spacing={3} mb={2}>
                            <Icon as={FiCalendar} boxSize={4} color={useColorModeValue('blue.500', 'blue.300')} />
                            <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('gray.700', 'gray.300')}>
                              Data comenzii
                            </Text>
                          </HStack>
                          <Text fontSize="lg" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
                            {new Date(selectedEvent.createdAt).toLocaleDateString('ro-RO')}
                          </Text>
                          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                            {new Date(selectedEvent.createdAt).toLocaleTimeString('ro-RO', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </Box>
                        
                        {/* Termen livrare */}
                        <Box>
                          <HStack spacing={3} mb={2}>
                            <Icon as={FiTruck} boxSize={4} color={useColorModeValue('green.500', 'green.300')} />
                            <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('gray.700', 'gray.300')}>
                              Termen livrare
                            </Text>
                          </HStack>
                          <Text fontSize="lg" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
                            {new Date(selectedEvent.end).toLocaleDateString('ro-RO')}
                          </Text>
                          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                            {(() => {
                              const deliveryDate = new Date(selectedEvent.end);
                              const today = new Date();
                              const diffTime = deliveryDate.getTime() - today.getTime();
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              
                              if (diffDays < 0) return 'Întârziat';
                              if (diffDays === 0) return 'Astăzi';
                              if (diffDays === 1) return 'Mâine';
                              return `În ${diffDays} zile`;
                            })()}
                          </Text>
                        </Box>
                        
                        {/* Valoare comandă */}
                        <Box>
                          <HStack spacing={3} mb={2}>
                            <Icon as={FiPackage} boxSize={4} color={useColorModeValue('purple.500', 'purple.300')} />
                            <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('gray.700', 'gray.300')}>
                              Valoare comandă
                            </Text>
                          </HStack>
                          <Text fontSize="lg" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
                            {(() => {
                              try {
                                const metadata = typeof selectedEvent.metadata === 'string' 
                                  ? JSON.parse(selectedEvent.metadata) 
                                  : selectedEvent.metadata;
                                return metadata?.totalValue ? `${Number(metadata.totalValue).toFixed(2)} lei` : 'N/A';
                              } catch {
                                return 'N/A';
                              }
                            })()}
                          </Text>
                          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                            {(() => {
                              try {
                                const metadata = typeof selectedEvent.metadata === 'string' 
                                  ? JSON.parse(selectedEvent.metadata) 
                                  : selectedEvent.metadata;
                                return metadata?.orderItems?.length ? `${metadata.orderItems.length} produse` : 'N/A';
                              } catch {
                                return 'N/A';
                              }
                            })()}
                          </Text>
                        </Box>
                      </SimpleGrid>
                    </Box>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Box p={4} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                        <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} mb={2}>Interval orar</Text>
                        <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>Început</Text>
                        <Text fontWeight="semibold" mb={2}>{formatEventInterval(selectedEvent.start)}</Text>
                        <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>Sfârșit</Text>
                        <Text fontWeight="semibold" mb={2}>{formatEventInterval(selectedEvent.end)}</Text>
                        <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                          Durată: {formatEventDuration(selectedEvent.start, selectedEvent.end)}
                        </Text>
                      </Box>

                      <Box p={4} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                        <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} mb={2}>Echipă</Text>
                        {viewDetailsLoading ? (
                          <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>Se încarcă...</Text>
                        ) : viewEventAssignments.length > 0 ? (
                          <VStack align="start" spacing={1}>
                            {viewEventAssignments.slice(0, 4).map((assignment: any) => {
                              let userData = assignment.user;
                              if (typeof userData === 'string') {
                                try { userData = JSON.parse(userData); } catch { userData = null; }
                              }
                              const name = userData
                                ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
                                : 'Utilizator';
                              return (
                                <Text key={assignment.id} fontSize="sm">
                                  {name}{assignment.role ? ` · ${assignment.role}` : ''}
                                </Text>
                              );
                            })}
                            {viewEventAssignments.length > 4 && (
                              <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                                +{viewEventAssignments.length - 4} altele
                              </Text>
                            )}
                          </VStack>
                        ) : (
                          <Text fontWeight="semibold">
                            {(selectedEvent.assignmentsCount || 0) === 1 ? '1 persoană' : `${selectedEvent.assignmentsCount || 0} persoane`}
                          </Text>
                        )}
                        {(selectedEvent.assignmentsCount || 0) > 0 && (
                          <Button size="xs" variant="link" mt={2} onClick={() => setIsAssignmentsModalOpen(true)}>
                            Vezi echipa
                          </Button>
                        )}
                      </Box>

                      {(selectedEvent.user?.firstName || selectedEvent.user?.lastName || selectedEvent.user?.email) && (
                        <Box p={4} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} mb={2}>Creat de</Text>
                          <Text fontWeight="semibold">
                            {[selectedEvent.user?.firstName, selectedEvent.user?.lastName].filter(Boolean).join(' ') || '—'}
                          </Text>
                          {selectedEvent.user?.email && (
                            <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>
                              {selectedEvent.user.email}
                            </Text>
                          )}
                        </Box>
                      )}

                      {viewEventMaterials.length > 0 && (
                        <Box p={4} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} mb={2}>
                            Materiale ({viewEventMaterials.length})
                          </Text>
                          <VStack align="start" spacing={1}>
                            {viewEventMaterials.slice(0, 3).map((material: any) => (
                              <Text key={material.id} fontSize="sm">
                                {material.product_name || material.productName || 'Produs'} · {material.quantity} {material.product_unit || material.productUnit || ''}
                              </Text>
                            ))}
                            {viewEventMaterials.length > 3 && (
                              <Button size="xs" variant="link" onClick={() => setIsStockManagementModalOpen(true)}>
                                Vezi toate materialele
                              </Button>
                            )}
                          </VStack>
                        </Box>
                      )}

                      {selectedEvent.vehicle?.id && (
                        <Box p={4} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} mb={2}>Vehicul</Text>
                          <Text fontWeight="semibold">{selectedEvent.vehicle.brand} {selectedEvent.vehicle.model}</Text>
                          <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>{selectedEvent.vehicle.registration_number}</Text>
                        </Box>
                      )}

                      {selectedEvent.department?.id && (
                        <Box p={4} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} mb={2}>Departament</Text>
                          <Text fontWeight="semibold">{selectedEvent.department.name}</Text>
                          {selectedEvent.department.description && (
                            <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')} mt={1}>
                              {selectedEvent.department.description}
                            </Text>
                          )}
                        </Box>
                      )}

                      {selectedEvent.location && (
                        <Box p={4} borderWidth="1px" borderColor={borderColor} borderRadius="md" gridColumn={{ md: 'span 2' }}>
                          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} mb={2}>Locație</Text>
                          <Text>{selectedEvent.location}</Text>
                        </Box>
                      )}

                      {selectedEvent.description && (
                        <Box p={4} borderWidth="1px" borderColor={borderColor} borderRadius="md" gridColumn={{ md: 'span 2' }}>
                          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} mb={2}>Descriere</Text>
                          <Text whiteSpace="pre-wrap">{selectedEvent.description}</Text>
                        </Box>
                      )}
                    </SimpleGrid>
                  )}

                    {/* Pentru evenimentele de transport, afișăm informații relevante */}
                    {selectedEvent.type === 'SUPPLY_ORDER' && (
                      <>
                        {/* Status Comandă */}
                        <Box
                          bg={useColorModeValue('gray.50', 'gray.700')}
                          borderRadius="lg"
                          p={4}
                          border="1px solid"
                          borderColor={borderColor}
                        >
                          <HStack mb={2}>
                            <Icon as={FiPackage} boxSize={4} color="orange.500" />
                            <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('gray.600', 'gray.300')}>
                              Status Comandă
                            </Text>
                          </HStack>
                          <VStack align="start" spacing={1}>
                            <Badge 
                              colorScheme={
                                selectedEvent.metadata && (() => {
                                  try {
                                    const metadata = typeof selectedEvent.metadata === 'string' 
                                      ? JSON.parse(selectedEvent.metadata) 
                                      : selectedEvent.metadata;
                                            return metadata.deliveryStatus === 'DELIVERED' ? 'green' :
               metadata.deliveryStatus === 'IN_TRANSIT' ? 'orange' :
               metadata.deliveryStatus === 'CONFIRMED' ? 'blue' :
               metadata.deliveryStatus === 'ORDERED' ? 'yellow' : 'gray';
                                  } catch {
                                    return 'gray';
                                  }
                                })()
                              }
                              size="md"
                              fontSize="sm"
                              px={3}
                              py={1}
                            >
                              {(() => {
                                try {
                                  const metadata = typeof selectedEvent.metadata === 'string' 
                                    ? JSON.parse(selectedEvent.metadata) 
                                    : selectedEvent.metadata;
                                                                  return metadata?.deliveryStatus || 'ORDERED';
                              } catch {
                                return 'ORDERED';
                              }
                              })()}
                            </Badge>
                            <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                              Ultima actualizare: {new Date().toLocaleDateString('ro-RO')}
                            </Text>
                          </VStack>
                        </Box>

                        {/* Tip Comandă */}
                        <Box
                          bg={useColorModeValue('gray.50', 'gray.700')}
                          borderRadius="lg"
                          p={4}
                          border="1px solid"
                          borderColor={borderColor}
                        >
                          <HStack mb={2}>
                            <Icon as={FiTruck} boxSize={4} color="purple.500" />
                            <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('gray.600', 'gray.300')}>
                              Tip Comandă
                            </Text>
                          </HStack>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm" color="purple.600" fontWeight="medium">
                              Comandă Aprovizionare
                            </Text>
                            <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                              Livrare la depozit
                            </Text>
                          </VStack>
                        </Box>
                      </>
                    )}

                  {/* Locație - doar dacă există */}
                  {selectedEvent.location && (
                    <Box
                      bg={useColorModeValue('gray.50', 'gray.700')}
                      borderRadius="lg"
                      p={4}
                      border="1px solid"
                      borderColor={borderColor}
                    >
                      <HStack mb={2} justify="space-between">
                        <HStack>
                          <Icon as={FiMapPin} boxSize={4} color="teal.500" />
                          <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('gray.600', 'gray.300')}>
                            {selectedEvent.type === 'SUPPLY_ORDER' ? 'Adresa de Livrare' : 'Locație'}
                          </Text>
                        </HStack>
                        <Button
                          size="xs"
                          colorScheme="teal"
                          variant="outline"
                          onClick={() => {
                            const encodedLocation = encodeURIComponent(selectedEvent.location || '');
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
                          }}
                          leftIcon={<FiMapPin />}
                          _hover={{
                            bg: useColorModeValue('teal.50', 'teal.900'),
                            transform: 'translateY(-1px)',
                            shadow: 'md'
                          }}
                          transition="all 0.2s ease"
                        >
                          Vezi pe hartă
                        </Button>
                      </HStack>
                      <Text fontSize="sm" color={useColorModeValue('gray.800', 'gray.200')} fontWeight="medium" lineHeight="1.4">
                        📍 {selectedEvent.location}
                      </Text>
                    </Box>
                  )}

                  {/* Descriere - doar pentru evenimente non-transport */}
                  {/* Document oficial pentru evenimente de transport */}
                  {(selectedEvent.type === 'SUPPLY_ORDER' || selectedEvent.type === 'TRANSPORT_DELIVERY' || selectedEvent.type === 'TRANSPORT_PICKUP') && selectedEvent.metadata && (
                    <ScaleFade in={true} initialScale={0.9}>
                        {(() => {
                          try {
                            // MySQL poate returna metadata ca obiect JavaScript sau ca JSON string
                            let metadata;
                            if (typeof selectedEvent.metadata === 'string') {
                              metadata = JSON.parse(selectedEvent.metadata);
                            } else if (typeof selectedEvent.metadata === 'object' && selectedEvent.metadata !== null) {
                              metadata = selectedEvent.metadata;
                            } else {
                              return (
                                <Box textAlign="center" py={8}>
                                  <Icon as={FiX} boxSize={8} color="red.500" mb={3} />
                                  <Text fontSize="md" color="red.500" fontWeight="semibold">
                                    Eroare la încărcarea detaliilor comenzii
                                  </Text>
                                </Box>
                              );
                            }
                            
                             // Datele furnizorului
                            const supplierData = {
                              name: metadata.supplier_name || metadata.supplierName || 'Necunoscut',
                              city: 'CRAIOVA',
                              address: metadata.supplier_address || metadata.deliveryAddress || 'STRADA TABACI NR. 1',
                              county: 'DOLJ',
                              phone: metadata.supplier_phone || metadata.supplierContact || '0251-310067',
                              email: metadata.supplier_email || metadata.supplierContact || '',
                              tax_number: metadata.supplierTaxNumber || '',
                              registration_number: metadata.supplierRegNumber || '',
                              code: metadata.supplierCode || ''
                            };
                            
                            // Datele comenzii
                            const orderData = {
                              orderNumber: `${metadata.orderId || '175922959083'}`,
                              orderDate: new Date(selectedEvent.createdAt),
                              deliveryDate: new Date(selectedEvent.end),
                              totalValue: metadata.totalValue || 0,
                              deliveryStatus: metadata.deliveryStatus || 'PENDING'
                            };
                            
                            // Debug: metadata loaded
                            
                            // Produsele vor fi încărcate din backend în TransportOrderDocumentWithData
                            
                            return (
                              <TransportOrderDocumentWithData
                                orderData={orderData}
                                supplierData={supplierData}
                                eventId={Number(selectedEvent.id)}
                              />
                            );
                          } catch (error) {
                            console.error('Error rendering transport document:', error);
                            return (
                              <Box textAlign="center" py={8}>
                                <Icon as={FiX} boxSize={8} color="red.500" mb={3} />
                                <Text fontSize="md" color="red.500" fontWeight="semibold">
                                  Eroare la încărcarea documentului de comandă
                                </Text>
                              </Box>
                            );
                          }
                        })()}
                    </ScaleFade>
                  )}


                  {/* Istoric și Timestamps */}
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box textAlign="center">
                      <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} mb={1}>📅 Creat la</Text>
                      <Text fontSize="xs" color={useColorModeValue('gray.700', 'gray.300')} fontWeight="medium">
                        {formatRoDateTime(selectedEvent.createdAt) || '—'}
                      </Text>
                    </Box>

                    {selectedEvent.updatedAt !== selectedEvent.createdAt && (
                      <Box textAlign="center">
                        <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} mb={1}>🔄 Actualizat la</Text>
                        <Text fontSize="xs" color={useColorModeValue('gray.700', 'gray.300')} fontWeight="medium">
                          {(() => {
                            try {
                              const updatedDate = new Date(selectedEvent.updatedAt);
                              if (isNaN(updatedDate.getTime())) {
                                return 'Dată invalidă';
                              }
                              return updatedDate.toLocaleDateString('ro-RO', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                            } catch (error) {
                              return 'Dată invalidă';
                            }
                          })()}
                        </Text>
                      </Box>
                    )}

                    {(() => {
                      const meta = parseEventMetadata(selectedEvent.metadata);
                      const finalizedTime = formatRoDateTime(meta.finalizedAt || meta.completedAt);
                      if (!finalizedTime) return null;
                      return (
                        <Box textAlign="center">
                          <Text fontSize="xs" color={useColorModeValue('green.500', 'green.300')} mb={1}>✅ Finalizat la</Text>
                          <Text fontSize="xs" color={useColorModeValue('green.700', 'green.200')} fontWeight="semibold">
                            {finalizedTime}
                          </Text>
                          {selectedEvent.end && (
                            <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} mt={1}>
                              Planificat: {formatRoDateTime(selectedEvent.end) || '—'}
                            </Text>
                          )}
                        </Box>
                      );
                    })()}
                  </SimpleGrid>
                </VStack>
              </ModalBody>

              <ModalFooter 
                bg={useColorModeValue('gray.50', 'gray.700')} 
                borderTop="1px solid"
                borderColor={borderColor}
                p={6}
                flexDirection="column"
                gap={4}
              >
                {/* Prima linie - butoane principale */}
                <SimpleGrid columns={{ base: 2, md: 3, lg: isTransportEventType(selectedEvent?.type) ? 4 : 5 }} spacing={3} w="full">
                  {isTransportEventType(selectedEvent?.type) ? (
                    <>
                      {user?.roles?.some(role => ['INSPECTOR', 'ADMIN', 'SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'WAREHOUSE_KEEPER'].includes(role)) && (
                        <Button
                          leftIcon={<FiPackage />}
                          variant="solid"
                          size="md"
                          borderRadius="xl"
                          px={4}
                          py={3}
                          colorScheme="green"
                          color="white"
                          _hover={{ transform: "translateY(-1px)", shadow: "lg" }}
                          transition="all 0.2s ease"
                          fontSize="sm"
                          fontWeight="semibold"
                          onClick={() => setIsFinalizeConfirmModalOpen(true)}
                          isLoading={finalizeLoading}
                          loadingText="Finalizare..."
                          isDisabled={isEventFinalized(selectedEvent?.metadata)}
                        >
                          {isEventFinalized(selectedEvent?.metadata) ? 'Livrare Finalizată ✓' : 'Finalizează Livrare'}
                        </Button>
                      )}

                      <Button
                        leftIcon={<FiPackage />}
                        variant="outline"
                        size="md"
                        borderRadius="xl"
                        px={4}
                        py={3}
                        bg={useColorModeValue('white', 'gray.700')}
                        borderColor={useColorModeValue('gray.300', 'gray.500')}
                        color={useColorModeValue('gray.800', 'gray.100')}
                        _hover={{ bg: useColorModeValue('gray.50', 'gray.600') }}
                        transition="all 0.2s ease"
                        fontSize="sm"
                        fontWeight="semibold"
                        onClick={() => setIsStockManagementModalOpen(true)}
                      >
                        Materiale
                      </Button>

                      <Button
                        leftIcon={<FiUsers />}
                        variant="outline"
                        size="md"
                        borderRadius="xl"
                        px={4}
                        py={3}
                        bg={useColorModeValue('white', 'gray.700')}
                        borderColor={useColorModeValue('gray.300', 'gray.500')}
                        color={useColorModeValue('gray.800', 'gray.100')}
                        _hover={{ bg: useColorModeValue('gray.50', 'gray.600') }}
                        transition="all 0.2s ease"
                        fontSize="sm"
                        fontWeight="semibold"
                        onClick={() => setIsAssignmentsModalOpen(true)}
                      >
                        Asignări
                      </Button>

                      <Button
                        leftIcon={<FiFile />}
                        variant="outline"
                        size="md"
                        borderRadius="xl"
                        px={4}
                        py={3}
                        bg={useColorModeValue('white', 'gray.700')}
                        borderColor={useColorModeValue('gray.300', 'gray.500')}
                        color={useColorModeValue('gray.800', 'gray.100')}
                        _hover={{ bg: useColorModeValue('gray.50', 'gray.600') }}
                        transition="all 0.2s ease"
                        fontSize="sm"
                        fontWeight="semibold"
                        onClick={() => setIsDocumentsModalOpen(true)}
                      >
                        Documente
                      </Button>

                      <Button
                        leftIcon={<FiBarChart />}
                        variant="outline"
                        size="md"
                        borderRadius="xl"
                        px={4}
                        py={3}
                        bg={useColorModeValue('white', 'gray.700')}
                        borderColor={useColorModeValue('gray.300', 'gray.500')}
                        color={useColorModeValue('gray.800', 'gray.100')}
                        _hover={{ bg: useColorModeValue('gray.50', 'gray.600') }}
                        transition="all 0.2s ease"
                        fontSize="sm"
                        fontWeight="semibold"
                        onClick={() => setIsReportingSystemModalOpen(true)}
                      >
                        Rapoarte
                      </Button>
                    </>
                  ) : (
                    <>
                      {[
                        { icon: FiUsers, label: 'Asignări', onClick: () => setIsAssignmentsModalOpen(true) },
                        { icon: FiFile, label: 'Documente', onClick: () => setIsDocumentsModalOpen(true) },
                        { icon: FiPackage, label: 'Materiale', onClick: () => setIsStockManagementModalOpen(true) },
                        { icon: FiCheckCircle, label: 'Aprobare', onClick: () => setIsApprovalWorkflowModalOpen(true) },
                        { icon: FiBarChart, label: 'Rapoarte', onClick: () => setIsReportingSystemModalOpen(true) },
                      ].map((btn) => (
                        <Button
                          key={btn.label}
                          leftIcon={<btn.icon />}
                          variant="outline"
                          size="sm"
                          borderRadius="md"
                          bg={useColorModeValue('white', 'gray.700')}
                          borderColor={useColorModeValue('gray.300', 'gray.500')}
                          color={useColorModeValue('gray.800', 'gray.100')}
                          _hover={{ bg: useColorModeValue('gray.50', 'gray.600') }}
                          onClick={btn.onClick}
                        >
                          {btn.label}
                        </Button>
                      ))}
                    </>
                  )}
                </SimpleGrid>

                {/* A doua linie - butoane de editare/ștergere */}
                {(() => {
                  if (!user || !selectedEvent) return null;
                  
                  const userRole = user.roles[0] as any;
                  const canEdit = permissionService.canPerformAction(userRole, 'EDIT_EVENT', {
                    eventUserId: selectedEvent.userId,
                    currentUserId: Number(user.id)
                  });
                  const canDelete = permissionService.canPerformAction(userRole, 'DELETE_EVENT', {
                    eventUserId: selectedEvent.userId,
                    currentUserId: Number(user.id)
                  });

                  if (!canEdit && !canDelete) return null;

                  return (
                    <HStack spacing={3} w="full" justify="center">
                      {canEdit && (
                        <Button
                          leftIcon={<FiEdit2 />}
                          size="sm"
                          colorScheme="blue"
                          onClick={() => {
                            console.log('🔧 Edit button clicked for event:', {
                              eventId: selectedEvent.id,
                              eventType: selectedEvent.type,
                              hasMetadata: !!selectedEvent.metadata,
                              metadata: selectedEvent.metadata
                            });
                            
                            setIsViewModalOpen(false);
                            setSelectedDates({
                              start: new Date(selectedEvent.start),
                              end: new Date(selectedEvent.end)
                            });
                            
                            // Pentru evenimentele de transport, preluăm datele din metadata
                            if (selectedEvent.type === 'SUPPLY_ORDER' && selectedEvent.metadata) {
                              try {
                                let metadata;
                                if (typeof selectedEvent.metadata === 'string') {
                                  metadata = JSON.parse(selectedEvent.metadata);
                                } else {
                                  metadata = selectedEvent.metadata;
                                }
                                
                                console.log('📦 Transport metadata for edit:', metadata);
                                
                                // Setăm evenimentul selectat cu datele complete pentru editare
                                setSelectedEvent({
                                  ...selectedEvent,
                                  // Preluăm datele de transport din metadata
                                  transportData: {
                                    supplierId: metadata.supplierId,
                                    supplierName: metadata.supplierName,
                                    supplierContact: metadata.supplierContact,
                                    deliveryAddress: metadata.deliveryAddress,
                                    totalValue: metadata.totalValue,
                                    expectedDeliveryDate: metadata.expectedDeliveryDate,
                                    deliveryStatus: metadata.deliveryStatus,
                                    deliveryNotes: metadata.deliveryNotes,
                                    orderId: metadata.orderId,
                                    // Alte câmpuri necesare pentru editare
                                    orderItems: [], // Va fi populat din backend dacă este necesar
                                  }
                                });
                              } catch (error) {
                                console.error('❌ Error parsing transport metadata for edit:', error);
                              }
                            }
                            
                            setIsCreateModalOpen(true);
                          }}
                        >
                          Editează Eveniment
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          leftIcon={<FiTrash2 />}
                          variant="outline"
                          size="md"
                          borderRadius="xl"
                          px={6}
                          py={3}
                          bg={useColorModeValue('white', 'gray.800')}
                          borderColor={useColorModeValue('red.200', 'red.600')}
                          color={useColorModeValue('red.600', 'red.300')}
                          _hover={{ 
                            bg: useColorModeValue('red.50', 'red.900'),
                            borderColor: useColorModeValue('red.300', 'red.500'),
                            transform: "translateY(-1px)",
                            shadow: "md"
                          }}
                          transition="all 0.2s ease"
                          fontSize="sm"
                          fontWeight="semibold"
                          onClick={() => {
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          Șterge Eveniment
                        </Button>
                      )}
                    </HStack>
                  );
                })()}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {selectedDates && (
        <EventModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedDates(null);
            setSelectedEvent(null);
          }}
          onSubmit={async (eventData) => {
            if (selectedEvent) {
              // Edit mode
              await handleEventEdit({
                ...eventData,
                id: selectedEvent.id,
                departmentId: selectedEvent.departmentId || undefined,
                vehicleId: selectedEvent.vehicleId || undefined,
                transportData: eventData.transportData || selectedEvent.transportData || null
              });
            } else {
              // Create mode
              await handleEventCreate({
                ...eventData,
                // Trimitem datele direct fără conversie UTC
                start: eventData.start,
                end: eventData.end
              });
            }
            setIsCreateModalOpen(false);
            setSelectedDates(null);
            setSelectedEvent(null);
          }}
          startDate={selectedDates.start}
          endDate={selectedDates.end}
          editMode={!!selectedEvent}
          initialData={selectedEvent ? {
            ...selectedEvent,
            start: selectedEvent.start,
            end: selectedEvent.end,
            transportData: selectedEvent.transportData || null
          } : undefined}
        />
      )}

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          if (selectedEvent) {
            handleEventDelete(selectedEvent.id);
          }
        }}
        event={selectedEvent}
        isLoading={deleteLoading}
      />

      <Modal
        isOpen={isFinalizeConfirmModalOpen}
        onClose={() => setIsFinalizeConfirmModalOpen(false)}
        isCentered
        size="md"
      >
        <ModalOverlay backdropFilter="blur(8px)" />
        <ModalContent borderRadius="2xl">
          <ModalHeader>
            <HStack spacing={3}>
              <Icon as={FiAlertTriangle} color="orange.400" boxSize={5} />
              <Text>Confirmare finalizare livrare</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="start" spacing={3}>
              <Text>
                Sigur doriți să finalizați livrarea pentru <strong>{selectedEvent?.title}</strong>?
              </Text>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                Stocul va fi actualizat automat cu produsele din comandă. Ora finalizării va fi înregistrată — util dacă produsele au sosit mai devreme decât data planificată.
              </Text>
              {selectedEvent?.end && (
                <Badge colorScheme="blue" fontSize="sm">
                  Planificat: {formatRoDateTime(selectedEvent.end) || selectedEvent.end}
                </Badge>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsFinalizeConfirmModalOpen(false)}>
              Anulează
            </Button>
            <Button
              colorScheme="green"
              leftIcon={<FiCheckCircle />}
              onClick={handleFinalizeOrder}
              isLoading={finalizeLoading}
              loadingText="Se finalizează..."
            >
              Da, finalizează livrarea
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {selectedEvent && (
        <EventAssignments
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
          eventDate={selectedEvent.start}
          eventStatus={selectedEvent.status}
          isOpen={isAssignmentsModalOpen}
          onClose={() => setIsAssignmentsModalOpen(false)}
          canEdit={(() => {
            if (!user) return false;
            const userRole = user.roles[0] as any;
            return permissionService.canPerformAction(userRole, 'ASSIGN_PERSONNEL', {
              eventUserId: selectedEvent.userId,
              currentUserId: Number(user.id)
            });
          })()}
        />
      )}

      {selectedEvent && !pdfViewerDoc && (
        <Modal
          isOpen={isDocumentsModalOpen}
          onClose={() => setIsDocumentsModalOpen(false)}
          size="4xl"
          motionPreset="slideInBottom"
          isCentered
        >
          <ModalOverlay backdropFilter="blur(20px)" bg="blackAlpha.700" />
          <ModalContent
            borderRadius="3xl"
            border="none"
            shadow="2xl"
            overflow="hidden"
            mx={4}
            bg={useColorModeValue('white', 'gray.800')}
          >
            <ModalHeader
              bgGradient={useColorModeValue(
                'linear(135deg, teal.500, cyan.600)',
                'linear(135deg, teal.600, cyan.700)'
              )}
              color="white"
              p={8}
            >
              <HStack spacing={4}>
                <Box
                  bg="whiteAlpha.200"
                  p={3}
                  borderRadius="xl"
                  backdropFilter="blur(10px)"
                >
                  <Icon as={FiFile} boxSize={6} />
                </Box>
                <VStack align="start" spacing={1}>
                  <Heading size="lg" fontWeight="bold">
                    Documente Evenimente
                  </Heading>
                  <Text fontSize="md" opacity={0.9}>
                    {selectedEvent.title}
                  </Text>
                </VStack>
              </HStack>
            </ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody p={6}>
              <EventDocuments
                eventId={selectedEvent.id}
                canEdit={(() => {
                  if (!user) return false;
                  const userRole = user.roles[0] as any;
                  return permissionService.canPerformAction(userRole, 'MANAGE_DOCUMENTS', {
                    eventUserId: selectedEvent.userId,
                    currentUserId: Number(user.id)
                  });
                })()}
                open={isDocumentsModalOpen}
                onclose={() => setIsDocumentsModalOpen(false)}
                onViewDocument={doc => setPdfViewerDoc(doc)}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Modal pentru notificări */}
      {selectedEvent && (
        <Modal
          isOpen={isNotificationsModalOpen}
          onClose={() => setIsNotificationsModalOpen(false)}
          size="4xl"
          motionPreset="slideInBottom"
          isCentered
        >
          <ModalOverlay backdropFilter="blur(20px)" bg="blackAlpha.700" />
          <ModalContent
            borderRadius="3xl"
            border="none"
            shadow="2xl"
            overflow="hidden"
            mx={4}
            bg={useColorModeValue('white', 'gray.800')}
          >
            <ModalHeader
              bgGradient={useColorModeValue(
                'linear(135deg, orange.500, red.600)',
                'linear(135deg, orange.600, red.700)'
              )}
              color="white"
              p={8}
            >
              <HStack spacing={4}>
                <Box
                  bg="whiteAlpha.200"
                  p={3}
                  borderRadius="xl"
                  backdropFilter="blur(10px)"
                >
                  <Icon as={FiBell} boxSize={6} />
                </Box>
                <VStack align="start" spacing={1}>
                  <Heading size="lg" fontWeight="bold">
                    Notificări Evenimente
                  </Heading>
                  <Text fontSize="md" opacity={0.9}>
                    {selectedEvent.title}
                  </Text>
                </VStack>
              </HStack>
            </ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody p={6}>
              <EventNotifications
                eventId={selectedEvent.id}
                eventTitle={selectedEvent.title}
                eventStart={selectedEvent.start}
                notifications={eventNotifications}
                canEdit={(() => {
                  if (!user) return false;
                  const userRole = user.roles[0] as any;
                  return permissionService.canPerformAction(userRole, 'MANAGE_NOTIFICATIONS', {
                    eventUserId: selectedEvent.userId,
                    currentUserId: Number(user.id)
                  });
                })()}
                onNotificationAdd={(notification) => {
                  setEventNotifications(prev => [...prev, notification]);
                }}
                onNotificationUpdate={(notification) => {
                  setEventNotifications(prev => 
                    prev.map(n => n.id === notification.id ? notification : n)
                  );
                }}
                onNotificationRemove={(notificationId) => {
                  setEventNotifications(prev => prev.filter(n => n.id !== notificationId));
                }}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Modal pentru aprobare workflow */}
      {selectedEvent && (
        <Modal
          isOpen={isApprovalWorkflowModalOpen}
          onClose={() => setIsApprovalWorkflowModalOpen(false)}
          size="6xl"
          motionPreset="slideInBottom"
          isCentered
        >
          <ModalOverlay backdropFilter="blur(20px)" bg="blackAlpha.700" />
          <ModalContent
            borderRadius="3xl"
            border="none"
            shadow="2xl"
            overflow="hidden"
            mx={4}
            bg={useColorModeValue('white', 'gray.800')}
          >
            <ModalHeader
              bgGradient={useColorModeValue(
                'linear(135deg, purple.500, indigo.600)',
                'linear(135deg, purple.600, indigo.700)'
              )}
              color="white"
              p={8}
            >
              <HStack spacing={4}>
                <Box
                  bg="whiteAlpha.200"
                  p={3}
                  borderRadius="xl"
                  backdropFilter="blur(10px)"
                >
                  <Icon as={FiCheckCircle} boxSize={6} />
                </Box>
                <VStack align="start" spacing={1}>
                  <Heading size="lg" fontWeight="bold">
                    Flux de Aprobare
                  </Heading>
                  <Text fontSize="md" opacity={0.9}>
                    {selectedEvent.title}
                  </Text>
                </VStack>
              </HStack>
            </ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody p={6}>
              <EventApprovalWorkflow
                eventId={selectedEvent.id}
                eventTitle={selectedEvent.title}
                eventType={selectedEvent.type}
                eventStatus={selectedEvent.status}
                approvalStatus={selectedEvent.approvalStatus || 'DRAFT'}
                approvedBy={selectedEvent.approvedBy || undefined}
                approvedAt={selectedEvent.approvedAt || undefined}
                isOpen={isApprovalWorkflowModalOpen}
                onClose={() => setIsApprovalWorkflowModalOpen(false)}
                onApprovalChange={handleApprovalStatusChange}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Modal pentru raportare */}
      <Modal
        isOpen={isReportingSystemModalOpen}
        onClose={() => setIsReportingSystemModalOpen(false)}
        size="6xl"
        motionPreset="slideInBottom"
        isCentered
      >
        <ModalOverlay backdropFilter="blur(20px)" bg="blackAlpha.700" />
        <ModalContent
          borderRadius="3xl"
          border="none"
          shadow="2xl"
          overflow="hidden"
          mx={4}
          bg={useColorModeValue('white', 'gray.800')}
        >
          <ModalHeader
            bgGradient={useColorModeValue(
              'linear(135deg, blue.500, purple.600)',
              'linear(135deg, blue.600, purple.700)'
            )}
            color="white"
            p={8}
          >
            <HStack spacing={4}>
              <Box
                bg="whiteAlpha.200"
                p={3}
                borderRadius="xl"
                backdropFilter="blur(10px)"
              >
                <Icon as={FiBarChart} boxSize={6} />
              </Box>
              <VStack align="start" spacing={1}>
                <Heading size="lg" fontWeight="bold">
                  Sistem de Raportare DSP
                </Heading>
                <Text fontSize="md" opacity={0.9}>
                  Analize și Statistici Evenimente
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={6}>
            <EventReportingSystem
              departmentId={departmentId}
              userId={user?.id ? Number(user.id) : undefined}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {selectedEvent && (
        <EventSupplies
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
          eventDate={selectedEvent.start}
          eventStatus={selectedEvent.status || 'PENDING'}
          isOpen={isStockManagementModalOpen}
          onClose={() => setIsStockManagementModalOpen(false)}
          canEdit={(() => {
            if (!user) return false;
            const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER'];
            const isAdmin = user.roles.some(role => adminRoles.includes(role));
            if (isAdmin) return true;
            const userRole = user.roles[0] as any;
            return permissionService.canPerformAction(userRole, 'MANAGE_STOCK', {
              eventUserId: selectedEvent.userId,
              currentUserId: Number(user.id)
            });
          })()}
        />
      )}

      {/* Modal pentru schimbarea statusului comenzii de transport */}
      {selectedEvent && selectedEvent.type === 'SUPPLY_ORDER' && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          size="md"
          motionPreset="slideInBottom"
          isCentered
        >
          <ModalOverlay backdropFilter="blur(20px)" bg="blackAlpha.700" />
          <ModalContent
            borderRadius="3xl"
            border="none"
            shadow="2xl"
            overflow="hidden"
            mx={4}
            bg={useColorModeValue('white', 'gray.800')}
          >
            <ModalHeader
              bgGradient={useColorModeValue(
                'linear(135deg, orange.500, red.600)',
                'linear(135deg, orange.600, red.700)'
              )}
              color="white"
              p={6}
            >
              <HStack spacing={4}>
                <Box
                  bg="whiteAlpha.200"
                  p={3}
                  borderRadius="xl"
                  backdropFilter="blur(10px)"
                >
                  <Icon as={FiCheckCircle} boxSize={6} />
                </Box>
                <VStack align="start" spacing={1}>
                  <Heading size="lg" fontWeight="bold">
                    Status Comandă Transport
                  </Heading>
                  <Text fontSize="md" opacity={0.9}>
                    {selectedEvent.title}
                  </Text>
                </VStack>
              </HStack>
            </ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody p={6}>
              <VStack spacing={6} align="stretch">
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Status Actual</AlertTitle>
                    <AlertDescription>
                      Statusul curent al comenzii: <Badge colorScheme="orange" ml={2}>
                        {selectedEvent?.metadata?.deliveryStatus || selectedEvent?.status || 'ORDERED'}
                      </Badge>
                    </AlertDescription>
                  </Box>
                </Alert>

                <FormControl>
                  <FormLabel fontWeight="semibold">Schimbă Statusul</FormLabel>
                  <Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    placeholder="Selectează noul status"
                    size="lg"
                    borderRadius="xl"
                  >
                                    <option value="ORDERED">ORDERED - Comandat</option>
                <option value="CONFIRMED">CONFIRMED - Confirmat</option>
                <option value="IN_TRANSIT">IN_TRANSIT - În curs de livrare</option>
                <option value="DELIVERED">DELIVERED - Livrat</option>
                <option value="CANCELLED">CANCELLED - Anulat</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel fontWeight="semibold">Comentarii</FormLabel>
                  <Textarea
                    value={statusComments}
                    onChange={(e) => setStatusComments(e.target.value)}
                    placeholder="Adaugă comentarii despre schimbarea statusului..."
                    rows={3}
                    borderRadius="xl"
                  />
                </FormControl>

                <HStack justify="space-between" pt={4}>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsStatusModalOpen(false);
                      setSelectedStatus('');
                      setStatusComments('');
                    }}
                    borderRadius="xl"
                    isDisabled={statusUpdateLoading}
                  >
                    Anulează
                  </Button>
                  <Button
                    colorScheme="orange"
                    borderRadius="xl"
                    onClick={handleTransportStatusUpdate}
                    isLoading={statusUpdateLoading}
                    loadingText="Actualizare..."
                    isDisabled={!selectedStatus}
                  >
                    Actualizează Status
                  </Button>
                </HStack>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Modal pentru căutarea avansată */}
      <AdvancedEventSearch
        isOpen={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        onEventSelect={handleAdvancedSearchEventSelect}
      />

      {pdfViewerDoc && (
        <DocumentViewerModal
          isOpen={!!pdfViewerDoc}
          onClose={() => {
            setPdfViewerDoc(null);
            // Nu mai reafișăm lista de documente - închidem complet
          }}
          documentId={pdfViewerDoc.id}
          fileName={pdfViewerDoc.file_name}
          mimeType={pdfViewerDoc.mime_type}
        />
      )}
    </Box>
    </VStack>
  )
} 