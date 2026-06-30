import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  HStack,
  Switch,
  FormHelperText,
  useColorModeValue,
  Box,
  Text,
  Badge,
  Divider,
  Flex,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Checkbox,
  Stack,
  Alert,
  AlertIcon,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  useToast,
  FormErrorMessage,
  AlertTitle,
  AlertDescription,
  IconButton,
  Tooltip,
  Progress,
  useDisclosure,
  Collapse,
  ScaleFade,
  SlideFade,
  Fade,
  Slide,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useState, useEffect, useCallback } from 'react';
import { EventType, EventStatus, CalendarEvent, Department, EventCategoryType, TransportEventData } from '../../types/calendar';
import { FiClock, FiUsers, FiTruck, FiMapPin, FiFileText, FiCalendar, FiUser, FiPackage, FiPlus, FiX, FiArrowRight, FiArrowLeft, FiCheck, FiAlertCircle, FiStar, FiZap } from 'react-icons/fi';
import { CalendarService } from '../../services/CalendarService';
import { useAuth } from '../../hooks/useAuth';
import LocationAutocomplete from './LocationAutocomplete';
import TimeRangePicker from './TimeRangePicker';
import DepartmentService from '../../services/DepartmentService';
import PersonnelSelector from './PersonnelSelector';
import VehicleSelector from './VehicleSelector';
import EventTypeSelector from './EventTypeSelector';
import TransportEventForm from './TransportEventForm';
import EventProductSelector from './EventProductSelector';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: {
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
  }) => void;
  startDate: Date;
  endDate: Date;
  editMode?: boolean;
  initialData?: CalendarEvent;
}

const calendarService = new CalendarService();

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
}

const formatDateForInput = (date: Date) => {
  return {
    date: date.toISOString().split('T')[0],
    time: date.toLocaleTimeString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  };
};

const combineDateAndTime = (date: Date, timeStr: string): Date => {
  if (!timeStr || !timeStr.includes(':')) {
    console.warn('Invalid time string:', timeStr, 'using default 09:00');
    timeStr = '09:00';
  }
  const [hours, minutes] = timeStr.split(':').map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours || 9, minutes || 0, 0, 0);
  return newDate;
};

// Animații moderne
const fadeInUp = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

const slideInRight = keyframes`
  from { 
    opacity: 0; 
    transform: translateX(30px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
`;

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(56, 178, 172, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(56, 178, 172, 0); }
  100% { box-shadow: 0 0 0 0 rgba(56, 178, 172, 0); }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

export default function EventModal({
  isOpen,
  onClose,
  onSubmit,
  startDate,
  endDate,
  editMode = false,
  initialData
}: EventModalProps) {
  const [existingEvents, setExistingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const toast = useToast();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EventType>('INSPECTION');
  const [status, setStatus] = useState<EventStatus>('PENDING');
  const [isPrivate, setIsPrivate] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [assignedUsers, setAssignedUsers] = useState<number[]>([]);
  const [vehicleId, setVehicleId] = useState<number | undefined>();
  const [needsVehicle, setNeedsVehicle] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuppliesModalOpen, setIsSuppliesModalOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Array<{
    productId: number;
    quantity: number;
    unitCost?: number;
    notes?: string;
  }>>([]);

  // New step-by-step flow state
  const [currentStep, setCurrentStep] = useState<'SELECT_TYPE' | 'CONFIGURE_EVENT'>('SELECT_TYPE');
  const [selectedCategory, setSelectedCategory] = useState<EventCategoryType | null>(null);
  const [transportData, setTransportData] = useState<TransportEventData | null>(null);



  // Debug effect pentru urmărirea stării
  // Debug log doar pentru probleme majore
  useEffect(() => {
    if (editMode && !selectedCategory) {
      console.log('⚠️ Edit mode without category');
    }
  }, [editMode, selectedCategory]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBgColor = useColorModeValue('gray.50', 'gray.700');
  const primaryColor = useColorModeValue('teal.500', 'teal.300');
  const secondaryColor = useColorModeValue('blue.500', 'blue.300');
  const accentColor = useColorModeValue('purple.500', 'purple.300');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.300');
  
  // Hook-uri pentru culori condiționale
  const transportBgColor = useColorModeValue('blue.50', 'blue.900');
  const transportBorderColor = useColorModeValue('blue.200', 'blue.700');

  // Verificăm dacă tipul de eveniment necesită gestionarea produselor
  const isStockEvent = ['STOCK_RECEPTION', 'STOCK_DISTRIBUTION', 'STOCK_MOVEMENT', 'INVENTORY_AUDIT'].includes(type);

  // Încărcăm evenimentele existente pentru ziua selectată
  useEffect(() => {
    if (isOpen && startDate) {
      loadExistingEvents();
    }
  }, [isOpen, startDate]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        if (user) {
          // Încerc să încărc departamentele utilizatorului
          const userDepartments = await DepartmentService.getUserDepartments(Number(user.id));
          // Transformăm departamentele pentru a fi compatibile cu tipul nostru
          const mappedDepartments = userDepartments.map(dept => ({
            ...dept,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
          setDepartments(mappedDepartments);
          if (mappedDepartments.length === 1) {
            setSelectedDepartment(mappedDepartments[0].id.toString());
          }
        }
      } catch (error) {
        console.error('Error loading departments:', error);
        // Folosesc departamente mock în caz de eroare
        const mockDepartments = [
          { id: 1, name: 'Administrativ', description: 'Departamentul administrativ', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: 5, name: 'Departamentul de Inspecție și Control', description: 'Responsabil cu inspecțiile și controalele în unitățile sanitare', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: 6, name: 'Departamentul de Epidemiologie', description: 'Monitorizarea și controlul bolilor transmisibile', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ];
        setDepartments(mockDepartments);
      }
    };

    if (isOpen) {
      // Încărcăm toate datele necesare
      loadDepartments();
      loadExistingEvents(); // Încărcăm evenimentele existente când se deschide modalul
      
      if (editMode && initialData) {
        // În modul edit, sărim peste selectorul de tip și mergem direct la configurare
        setCurrentStep('CONFIGURE_EVENT');
        
        // Determinăm categoria în funcție de tipul evenimentului
        if (['TRANSPORT_DELIVERY', 'TRANSPORT_PICKUP', 'SUPPLY_ORDER'].includes(initialData.type)) {
          setSelectedCategory('TRANSPORT');
        } else {
          setSelectedCategory('OPERATIONAL');
        }
        
        setTitle(initialData.title);
        setDescription(initialData.description || '');
        setType(initialData.type);
        setStatus(initialData.status || 'PENDING');
        setIsPrivate(initialData.isPrivate);
        setLocation(initialData.location || '');
        
        // Extract time from dates
        const startDateTime = new Date(initialData.start);
        const endDateTime = new Date(initialData.end);
        setStartTime(startDateTime.toTimeString().slice(0, 5));
        setEndTime(endDateTime.toTimeString().slice(0, 5));
        
        // Set other fields
        setSelectedDepartment(initialData.departmentId?.toString() || '');
        setVehicleId(initialData.vehicleId || undefined);
        setNeedsVehicle(!!initialData.vehicleId);
        
        // Load assigned users from event assignments if available
        if (initialData.assignmentsCount && initialData.assignmentsCount > 0) {
          // We'll load the assignments from the new components automatically
          setAssignedUsers([]); // Reset and let PersonnelSelector load them
        }
        
        // Pentru evenimentele de transport, preluăm datele din metadata și produsele din backend
        if (['TRANSPORT_DELIVERY', 'TRANSPORT_PICKUP', 'SUPPLY_ORDER'].includes(initialData.type) && initialData.metadata) {
          try {
            let metadata;
            if (typeof initialData.metadata === 'string') {
              metadata = JSON.parse(initialData.metadata);
            } else {
              metadata = initialData.metadata;
            }
            
            console.log('📦 Loading transport data from metadata for edit:', metadata);
            
            // Preluăm produsele din backend
            const loadTransportItems = async () => {
              try {
                console.log('📦 Loading transport items from backend for event:', initialData.id);
                const transportItems = await calendarService.getEventTransportItems(initialData.id);
                console.log('📦 Transport items loaded from backend:', transportItems);
                
                // Transformăm produsele din backend în formatul așteptat
                const orderItems = transportItems.map((item: any) => ({
                  productId: item.product_id,
                  productName: item.product_name,
                  productCode: item.product_code || '',
                  productUnit: item.product_unit || 'buc',
                  supplierPrice: item.unit_price,
                  quantity: item.quantity,
                  totalPrice: item.total_price,
                  currentStock: 0, // Va fi populat când se încarcă produsele
                  minOrderQuantity: 1,
                  deliveryTime: 1,
                  status: item.status,
                  notes: item.notes,
                  supplierId: item.supplier_id,
                  supplierName: item.supplier_name,
                  unitPrice: item.unit_price,
                  expectedDeliveryDate: item.expected_delivery_date
                }));
                
                console.log('📦 Transformed order items:', orderItems);
                
                // Setăm transportData cu datele din metadata și produsele din backend
                setTransportData({
                  supplierId: metadata.supplierId,
                  supplierName: metadata.supplierName,
                  supplierContact: metadata.supplierContact,
                  deliveryAddress: metadata.deliveryAddress,
                  totalValue: metadata.totalValue,
                  expectedDeliveryDate: metadata.expectedDeliveryDate,
                  deliveryStatus: metadata.deliveryStatus,
                  deliveryNotes: metadata.deliveryNotes,
                  orderId: metadata.orderId,
                  orderItems: orderItems,
                  isOverdue: metadata.isOverdue || false
                });
              } catch (error) {
                console.error('❌ Error loading transport items from backend:', error);
                // Fallback la datele din metadata dacă nu putem prelua din backend
                setTransportData({
                  supplierId: metadata.supplierId,
                  supplierName: metadata.supplierName,
                  supplierContact: metadata.supplierContact,
                  deliveryAddress: metadata.deliveryAddress,
                  totalValue: metadata.totalValue,
                  expectedDeliveryDate: metadata.expectedDeliveryDate,
                  deliveryStatus: metadata.deliveryStatus,
                  deliveryNotes: metadata.deliveryNotes,
                  orderId: metadata.orderId,
                  orderItems: metadata.orderItems || [],
                  isOverdue: metadata.isOverdue || false
                });
              }
            };
            
            loadTransportItems();
          } catch (error) {
            console.error('❌ Error parsing transport metadata for edit:', error);
            setTransportData(null);
          }
        } else {
          setTransportData(null);
        }
      } else {
        // În modul creare, începem cu selectorul de tip
        setCurrentStep('SELECT_TYPE');
        setSelectedCategory(null);
        
        // Doar resetez câmpurile de formular, nu toate datele
        setTitle('');
        setDescription('');
        setType('INSPECTION');
        setStatus('PENDING');
        setIsPrivate(false);
        setLocation('');
        setAssignedUsers([]);
        setVehicleId(undefined);
        setNeedsVehicle(false);
        setSelectedDepartment('');
        setTransportData(null);
      }
    }
  }, [isOpen, editMode, initialData?.id, user?.id]); // Simplified dependencies

  const loadExistingEvents = async () => {
    try {
      setLoading(true);
      
      // Formatăm data fără conversie UTC pentru a păstra timezone-ul local
      const selectedDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      // Loading events for selected date
      
      // Încărcăm toate evenimentele (pot avea formatul din backend cu underscore)
      const allEvents: any[] = await calendarService.getEvents();
      // All events loaded from API
      
      // Filtrăm doar evenimentele din ziua selectată cu gestionare robustă a datelor
      // Target date set
      
      const eventsForSelectedDate = allEvents.filter(event => {
        try {
          // Încercăm să parsăm data evenimentului în mai multe moduri
          let eventDate;
          
          if (event.start_time) {
            // Dacă avem start_time (din backend)
            eventDate = new Date(event.start_time);
          } else if (event.start) {
            // Dacă avem start (format frontend)
            eventDate = new Date(event.start);
          } else {
            console.warn('Event without valid start time:', event);
            return false;
          }
          
          // Verificăm dacă data este validă
          if (isNaN(eventDate.getTime())) {
            console.warn('Invalid date for event:', event);
            return false;
          }
          
          // Comparăm doar partea de dată (fără timp) folosind data locală
          const eventDateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
          const matches = eventDateStr === selectedDateStr;
          
          if (matches) {
            // Event matches date
          }
          
          return matches;
        } catch (error) {
          console.error('Error parsing event date:', error, event);
          return false;
        }
      });
      
      // Events filtered for selected date
      
      // Transformăm evenimentele pentru a avea formatul CalendarEvent corect
      const transformedEvents: CalendarEvent[] = eventsForSelectedDate.map(event => ({
        id: event.id?.toString() || Math.random().toString(),
        title: event.title || 'Eveniment fără titlu',
        description: event.description || '',
        start: event.start_time || event.start,
        end: event.end_time || event.end,
        type: event.type || 'OTHER',
        status: event.status || 'PENDING',
        userId: event.user_id || event.userId,
        departmentId: event.department_id || event.departmentId,
        isPrivate: Boolean(event.is_private || event.isPrivate),
        location: event.location || null,
        vehicleId: event.vehicle_id || event.vehicleId,
        categoryId: event.category_id || event.categoryId,
        priority: event.priority || 'MEDIUM',
        approvalStatus: event.approval_status || event.approvalStatus || 'APPROVED',
        approvedBy: event.approved_by || event.approvedBy,
        approvedAt: event.approved_at || event.approvedAt,
        parentEventId: event.parent_event_id || event.parentEventId,
        isRecurring: Boolean(event.is_recurring || event.isRecurring),
        metadata: event.metadata || null,
        dspMetadata: event.dsp_metadata || event.dspMetadata,
        createdAt: event.created_at || event.createdAt || new Date().toISOString(),
        updatedAt: event.updated_at || event.updatedAt || new Date().toISOString(),
        user: event.user,
        department: event.department,
        vehicle: event.vehicle,
        category: event.category,
        assignments: event.assignments || [],
        documents: event.documents || [],
        notifications: event.notifications || [],
        tags: event.tags || [],
        assignmentsCount: event.assignments_count || event.assignmentsCount || 0
      }));
      
      setExistingEvents(transformedEvents);
    } catch (error) {
      console.error('Error loading existing events:', error);
      setExistingEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Handlers pentru selecția tipului de eveniment
  const handleCategorySelect = (category: EventCategoryType) => {
    console.log('🔄 Category selected:', category);
    setSelectedCategory(category);
    // Setez un tip default în funcție de categorie
    const defaultType = category === 'TRANSPORT' ? 'SUPPLY_ORDER' : 'INSPECTION';
    setType(defaultType);
    setCurrentStep('CONFIGURE_EVENT');
    console.log('✅ Step changed to CONFIGURE_EVENT, category:', category, 'type:', defaultType);
    
    // Reset form data când schimbăm tipul
    setTitle('');
    setDescription('');
    setLocation(''); // Reset location when changing category
    setAssignedUsers([]);
    setVehicleId(undefined);
    setNeedsVehicle(false);
    setTransportData(null);
  };

  const handleBackToTypeSelection = () => {
    setCurrentStep('SELECT_TYPE');
    setSelectedCategory(null);
    setType('INSPECTION');
  };

  const handleTransportDataChange = useCallback((data: TransportEventData) => {
    // Verificăm dacă datele s-au schimbat pentru a evita loop-ul
    const currentDataString = JSON.stringify(transportData);
    const newDataString = JSON.stringify(data);
    
    if (currentDataString === newDataString) {
      return; // Datele sunt identice, nu facem nimic
    }
    
    console.log('🚛 TransportEventForm onSubmit called with data:', {
      orderId: data.orderId,
      supplierName: data.supplierName,
      orderItemsCount: data.orderItems?.length,
      totalValue: data.totalValue,
      deliveryAddress: data.deliveryAddress
    });
    
    setTransportData(data);
    // Actualizăm și alte câmpuri relevante doar pentru evenimentele de transport
    if (selectedCategory === 'TRANSPORT') {
      if (data.deliveryAddress) {
        setLocation(data.deliveryAddress);
      }
      if (data.deliveryNotes) {
        setDescription(data.deliveryNotes);
      }
    }
    
    // Transport data set successfully
  }, [transportData]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('INSPECTION');
    setStatus('PENDING');
    setIsPrivate(false);
    setStartTime('09:00');
    setEndTime('10:00');
    setLocation('');
    setAssignedUsers([]);
    setVehicleId(undefined);
    setNeedsVehicle(false);
    setExistingEvents([]);
    setSelectedDepartment('');
    setErrors({});
    // Reset step-by-step flow
    setCurrentStep('SELECT_TYPE');
    setSelectedCategory(null);
    setTransportData(null);
    // Nu resetez activeTab pentru a permite navigarea între tab-uri
    // setActiveTab(0);
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    // Pentru evenimentele de transport, nu validăm titlul manual - se setează automat
    if (selectedCategory !== 'TRANSPORT') {
    if (!title.trim()) {
      newErrors.title = 'Titlul este obligatoriu';
    }

    if (title.length < 3) {
      newErrors.title = 'Titlul trebuie să aibă cel puțin 3 caractere';
    }

    if (title.length > 100) {
      newErrors.title = 'Titlul nu poate depăși 100 de caractere';
      }
    }

    // Validare ore
    const eventStart = combineDateAndTime(startDate, startTime);
    const eventEnd = combineDateAndTime(startDate, endTime);

    if (eventEnd <= eventStart) {
      newErrors.time = 'Ora de sfârșit trebuie să fie după ora de început';
      setErrors(newErrors);
      return false;
    }

    const diffMs = eventEnd.getTime() - eventStart.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 15) {
      newErrors.time = 'Evenimentul trebuie să dureze cel puțin 15 minute';
      setErrors(newErrors);
      return false;
    }

    // Pentru evenimentele de transport, validăm că avem datele de transport
    if (selectedCategory === 'TRANSPORT') {
      if (!transportData) {
        newErrors.transport = 'Datele de transport sunt obligatorii';
        setErrors(newErrors);
        return false;
      }
      
      if (!transportData.supplierName) {
        newErrors.transport = 'Numele furnizorului este obligatoriu';
        setErrors(newErrors);
        return false;
          }
      
      if (!transportData.orderItems || transportData.orderItems.length === 0) {
        newErrors.transport = 'Cel puțin un produs trebuie selectat';
        setErrors(newErrors);
        return false;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Submitting event with transport data
    
    const isValid = await validateForm();
    if (!isValid) {
      console.log('❌ Form validation failed, not submitting');
      return;
    }

    // Combine the selected date with the time inputs
    const eventStart = combineDateAndTime(startDate, startTime);
    const eventEnd = combineDateAndTime(startDate, endTime); // Use startDate for both to ensure same day

    const eventData: any = {
      title,
      description,
      start: eventStart.toISOString(),
      end: eventEnd.toISOString(),
      type,
      status,
      isPrivate,
      location: location || null,
      departmentId: selectedDepartment ? parseInt(selectedDepartment) : null,
      vehicleId: needsVehicle ? vehicleId || null : null,
    };

    // IMPORTANT: Adăugăm assignedUsers chiar dacă este array gol pentru a se salva corect
    eventData.assignedUsers = assignedUsers;
    
    // Pentru evenimentele de stoc ȘI operaționale, adăugăm produsele selectate
    const operationalEventTypes = ['INSPECTION', 'MEETING', 'TRAINING', 'MAINTENANCE', 'TRAVEL'];
    if ((isStockEvent || operationalEventTypes.includes(type)) && selectedProducts.length > 0) {
      eventData.stockProducts = selectedProducts;
      console.log('📦 Adding stockProducts to event:', selectedProducts);
    }

    // Pentru evenimentele de transport, adăugăm datele de transport și setăm titlul automat
    if (selectedCategory === 'TRANSPORT' && transportData) {
      eventData.transportData = transportData;
      
      // Setăm titlul automat pentru evenimentele de transport
      const autoTitle = `${transportData.supplierName} - Comandă #${transportData.orderId || 'NOUĂ'}`;
      eventData.title = autoTitle;
      
      console.log('🚛 Transport data added to event:', {
        selectedCategory,
        transportDataKeys: Object.keys(transportData),
        orderItemsCount: transportData.orderItems?.length,
        eventType: eventData.type,
        autoTitle
      });
    }
    
    console.log('✅ Submitting event data to parent component:', {
      ...eventData,
      location: eventData.location, // Explicitly log location
      transportData: eventData.transportData ? 'PRESENT' : 'NOT_PRESENT',
      stockProducts: eventData.stockProducts ? `${eventData.stockProducts.length} items` : 'NOT_PRESENT'
    });

    try {
      await onSubmit(eventData);
      console.log('✅ Event submitted successfully to parent component');
      onClose();
      resetForm();
    } catch (error) {
      console.error('❌ Error submitting event:', error);
    }
  };

  const getEventTypeColor = (eventType: EventType) => {
    switch (eventType) {
      case 'INSPECTION': return 'blue';
      case 'TRAVEL': return 'green';
      case 'MEETING': return 'orange';
      default: return 'gray';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Oră invalidă';
      }
      return date.toLocaleTimeString('ro-RO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return 'Oră invalidă';
    }
  };

  // Determină dacă butonul de submit trebuie să fie disabled
  const isSubmitDisabled = () => {
    if (selectedCategory === 'TRANSPORT') {
      // Pentru transport, verifică dacă transportData este valid
      const isDisabled = !transportData || !transportData.supplierName || !transportData.orderItems || transportData.orderItems.length === 0;
      return isDisabled;
    } else {
      // Pentru evenimente operaționale, verifică titlul
      const isDisabled = !title.trim();
      return isDisabled;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay 
        backdropFilter="blur(12px)" 
        bg="blackAlpha.400"
        animation={`${fadeInUp} 0.3s ease-out`}
      />
      <ModalContent 
        bg={bgColor} 
        borderRadius="3xl" 
        maxH="90vh"
        boxShadow="2xl"
        border="1px solid"
        borderColor={borderColor}
        animation={`${slideInRight} 0.4s ease-out`}
        overflow="hidden"
      >
        {/* Header modernizat */}
        <ModalHeader 
          borderBottomWidth="1px" 
          borderColor={borderColor} 
          pb={6}
          bg={cardBgColor}
          position="relative"
          overflow="hidden"
        >
          {/* Background pattern */}
          <Box
            position="absolute"
            top={0}
            right={0}
            w="200px"
            h="200px"
            bg={`linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)`}
            borderRadius="full"
            transform="translate(50px, -50px)"
            opacity={0.6}
          />
          
          <Flex align="center" gap={4} position="relative" zIndex={1}>
            <Box
              p={3}
              borderRadius="xl"
              bg={`linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`}
              boxShadow="lg"
              animation={`${pulseGlow} 2s infinite`}
            >
              <Icon as={FiCalendar} color="white" boxSize={6} />
            </Box>
            <Box>
              <Heading 
                size="lg" 
                bgGradient={`linear(to-r, ${primaryColor}, ${secondaryColor})`}
                bgClip="text"
                fontWeight="bold"
              >
                {editMode ? 'Editare Eveniment' : 'Creare Eveniment Nou'}
              </Heading>
              <Text 
                fontSize="sm" 
                color="gray.500" 
                mt={1}
                fontWeight="medium"
              >
                {startDate.toLocaleDateString('ro-RO', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </Box>
          </Flex>
        </ModalHeader>
        
        <ModalCloseButton 
          size="lg"
          borderRadius="full"
          bg={cardBgColor}
          _hover={{
            bg: borderColor,
            transform: 'scale(1.1)',
          }}
          transition="all 0.2s"
        />
        
        <ModalBody py={8}>
          <ScaleFade in={isOpen} initialScale={0.95}>
            {(currentStep === 'SELECT_TYPE' || (!editMode && !selectedCategory)) && (
              // Pasul 1: Selectarea tipului de eveniment - modernizat
              <VStack spacing={8} align="stretch">
                <Box textAlign="center" py={4}>
                  <Heading 
                    size="lg" 
                    mb={3}
                    bgGradient={`linear(to-r, ${primaryColor}, ${secondaryColor})`}
                    bgClip="text"
                  >
                    Selectați tipul evenimentului
                  </Heading>
                                <Text 
                color={mutedTextColor} 
                fontSize="lg"
                fontWeight="medium"
              >
                Alegeți categoria pentru a continua cu configurarea evenimentului
              </Text>
                </Box>
                
                <SlideFade in={true} offsetY="20px">
                  <EventTypeSelector 
                    selectedCategory={selectedCategory}
                    onCategorySelect={handleCategorySelect}
                  />
                </SlideFade>
              </VStack>
            )}

            {currentStep === 'CONFIGURE_EVENT' && (
              // Pasul 2: Configurarea evenimentului - modernizat
              <VStack spacing={8} align="stretch">
                {!editMode && (
                  <SlideFade in={true} offsetY="20px">
                    <HStack justify="space-between">
                      <Button 
                        leftIcon={<Icon as={FiArrowLeft} />}
                        variant="outline" 
                        size="md"
                        onClick={handleBackToTypeSelection}
                        borderRadius="xl"
                        borderWidth="2px"
                        _hover={{
                          transform: 'translateX(-4px)',
                          boxShadow: 'lg',
                        }}
                        transition="all 0.3s"
                      >
                        ← Schimbă tipul evenimentului
                      </Button>
                    </HStack>
                  </SlideFade>
                )}

                <Tabs 
                  variant="enclosed" 
                  colorScheme="teal" 
                  index={activeTab} 
                  onChange={setActiveTab}
                  borderRadius="xl"
                  overflow="hidden"
                >
                  <TabList 
                    bg={cardBgColor}
                    borderBottom="2px solid"
                    borderColor={borderColor}
                  >
                    <Tab
                      _selected={{
                        bg: primaryColor,
                        color: 'white',
                        borderRadius: 'xl',
                        boxShadow: 'lg',
                      }}
                      borderRadius="xl"
                      mx={2}
                      my={2}
                      transition="all 0.3s"
                      _hover={{
                        transform: 'translateY(-2px)',
                      }}
                    >
                      <Icon as={FiFileText} mr={2} />
                      {selectedCategory === 'TRANSPORT' ? 'Configurare Transport' : 'Detalii Eveniment'}
                    </Tab>
                    <Tab
                      _selected={{
                        bg: secondaryColor,
                        color: 'white',
                        borderRadius: 'xl',
                        boxShadow: 'lg',
                      }}
                      borderRadius="xl"
                      mx={2}
                      my={2}
                      transition="all 0.3s"
                      _hover={{
                        transform: 'translateY(-2px)',
                      }}
                    >
                      <Icon as={FiCalendar} mr={2} />
                      Evenimente Existente ({existingEvents.length})
                    </Tab>
                  </TabList>

                  <TabPanels>
                    {/* Tab 1: Configurare - modernizat */}
                    <TabPanel px={0} py={6}>
                      <SlideFade in={true} offsetY="20px">
                        {selectedCategory === 'TRANSPORT' ? (
                          // Formular pentru transport - modernizat
                          <Box
                            borderRadius="2xl"
                            bg={transportBgColor}
                            p={6}
                            border="2px solid"
                            borderColor={transportBorderColor}
                          >
                            <TransportEventForm
                              onSubmit={handleTransportDataChange}
                              endDate={endDate}
                              initialData={transportData || undefined}
                              editMode={editMode}
                            />
                          </Box>
                        ) : (
                          // Formular clasic pentru evenimente operaționale - modernizat
                          <VStack spacing={8} align="stretch">
                            {/* Informații de bază - modernizat */}
                            <Card
                              borderRadius="2xl"
                              boxShadow="xl"
                              border="1px solid"
                              borderColor={borderColor}
                              overflow="hidden"
                              _hover={{
                                transform: 'translateY(-4px)',
                                boxShadow: '2xl',
                              }}
                              transition="all 0.3s"
                            >
                              <CardHeader 
                                pb={4}
                                bg={`linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)`}
                                borderBottom="1px solid"
                                borderColor={borderColor}
                              >
                                <HStack>
                                  <Box
                                    p={2}
                                    borderRadius="lg"
                                    bg={primaryColor}
                                    color="white"
                                  >
                                    <Icon as={FiFileText} boxSize={5} />
                                  </Box>
                                  <Heading size="md">Informații de Bază</Heading>
                                </HStack>
                              </CardHeader>
                              <CardBody pt={6}>
                                <VStack spacing={6}>
                                  <FormControl isRequired isInvalid={!!errors.title}>
                                    <FormLabel fontWeight="semibold" color={textColor}>
                                      Titlu Eveniment
                                    </FormLabel>
                                    <Input
                                      placeholder="ex: Inspecție Spital Județean"
                                      value={title}
                                      onChange={(e) => setTitle(e.target.value)}
                                      size="lg"
                                      borderRadius="xl"
                                      borderWidth="2px"
                                      _focus={{
                                        borderColor: primaryColor,
                                        boxShadow: `0 0 0 1px ${primaryColor}`,
                                      }}
                                      _hover={{
                                        borderColor: secondaryColor,
                                      }}
                                      transition="all 0.2s"
                                    />
                                    <FormErrorMessage>{errors.title}</FormErrorMessage>
                                  </FormControl>

                                  <FormControl>
                                    <FormLabel fontWeight="semibold" color={textColor}>
                                      Descriere Detaliată
                                    </FormLabel>
                                    <Textarea
                                      placeholder="Descrieți scopul și detaliile evenimentului..."
                                      value={description}
                                      onChange={(e) => setDescription(e.target.value)}
                                      size="lg"
                                      borderRadius="xl"
                                      borderWidth="2px"
                                      rows={4}
                                      _focus={{
                                        borderColor: primaryColor,
                                        boxShadow: `0 0 0 1px ${primaryColor}`,
                                      }}
                                      _hover={{
                                        borderColor: secondaryColor,
                                      }}
                                      transition="all 0.2s"
                                    />
                                  </FormControl>

                                  <FormControl isRequired>
                                    <FormLabel fontWeight="semibold" color={textColor}>
                                      Tip Activitate
                                    </FormLabel>
                                    <Select
                                      value={type}
                                      onChange={(e) => setType(e.target.value as EventType)}
                                      size="lg"
                                      borderRadius="xl"
                                      borderWidth="2px"
                                      _focus={{
                                        borderColor: primaryColor,
                                        boxShadow: `0 0 0 1px ${primaryColor}`,
                                      }}
                                      _hover={{
                                        borderColor: secondaryColor,
                                      }}
                                      transition="all 0.2s"
                                    >
                                      <option value="INSPECTION">🔍 Inspecție</option>
                                      <option value="TRAVEL">🚗 Deplasare</option>
                                      <option value="MEETING">👥 Ședință</option>
                                      <option value="TRAINING">📚 Formare</option>
                                      <option value="MAINTENANCE">🔧 Întreținere</option>
                                      <optgroup label="--- Gestionare Stoc ---">
                                        <option value="STOCK_RECEPTION">📦 Primire Marfă</option>
                                        <option value="STOCK_DISTRIBUTION">🚚 Distribuire Marfă</option>
                                        <option value="STOCK_MOVEMENT">↔️ Mutare Marfă</option>
                                        <option value="INVENTORY_AUDIT">📋 Inventariere</option>
                                      </optgroup>
                                      <option value="OTHER">📋 Altele</option>
                                    </Select>
                                  </FormControl>

                                  <FormControl>
                                    <FormLabel fontWeight="semibold" color={textColor}>
                                      Departament
                                    </FormLabel>
                                    <Select 
                                      value={selectedDepartment} 
                                      onChange={(e) => setSelectedDepartment(e.target.value)}
                                      placeholder="Selectați departamentul"
                                      size="lg"
                                      borderRadius="xl"
                                      borderWidth="2px"
                                      _focus={{
                                        borderColor: primaryColor,
                                        boxShadow: `0 0 0 1px ${primaryColor}`,
                                      }}
                                      _hover={{
                                        borderColor: secondaryColor,
                                      }}
                                      transition="all 0.2s"
                                    >
                                      {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                          {dept.name}
                                        </option>
                                      ))}
                                    </Select>
                                    <FormHelperText>
                                      Selectați departamentul responsabil pentru acest eveniment
                                    </FormHelperText>
                                  </FormControl>

                                  <LocationAutocomplete
                                    value={location}
                                    onChange={setLocation}
                                  />
                                </VStack>
                              </CardBody>
                            </Card>

                            {/* Program - modernizat */}
                            <Card
                              borderRadius="2xl"
                              boxShadow="xl"
                              border="1px solid"
                              borderColor={borderColor}
                              overflow="hidden"
                              _hover={{
                                transform: 'translateY(-4px)',
                                boxShadow: '2xl',
                              }}
                              transition="all 0.3s"
                            >
                              <CardHeader 
                                pb={4}
                                bg={`linear-gradient(135deg, ${secondaryColor}10, ${accentColor}10)`}
                                borderBottom="1px solid"
                                borderColor={borderColor}
                              >
                                <HStack>
                                  <Box
                                    p={2}
                                    borderRadius="lg"
                                    bg={secondaryColor}
                                    color="white"
                                  >
                                    <Icon as={FiClock} boxSize={5} />
                                  </Box>
                                  <Heading size="md">Program Eveniment</Heading>
                                </HStack>
                              </CardHeader>
                              <CardBody pt={6}>
                                <VStack spacing={4} align="stretch">
                                  <TimeRangePicker
                                    startTime={startTime}
                                    endTime={endTime}
                                    onStartTimeChange={setStartTime}
                                    onEndTimeChange={setEndTime}
                                    size="lg"
                                  />
                                  {errors.time && (
                                    <Alert 
                                      status="error" 
                                      borderRadius="xl"
                                      border="2px solid"
                                      borderColor="red.200"
                                    >
                                      <AlertIcon />
                                      <Box>
                                        <AlertTitle>Conflict de programare!</AlertTitle>
                                        <AlertDescription whiteSpace="pre-line" fontSize="sm">
                                          {errors.time}
                                        </AlertDescription>
                                      </Box>
                                    </Alert>
                                  )}
                                </VStack>
                              </CardBody>
                            </Card>

                            {/* Resurse și Personal - modernizat */}
                            <Card
                              borderRadius="2xl"
                              boxShadow="xl"
                              border="1px solid"
                              borderColor={borderColor}
                              overflow="hidden"
                              _hover={{
                                transform: 'translateY(-4px)',
                                boxShadow: '2xl',
                              }}
                              transition="all 0.3s"
                            >
                              <CardHeader 
                                pb={4}
                                bg={`linear-gradient(135deg, ${accentColor}10, ${primaryColor}10)`}
                                borderBottom="1px solid"
                                borderColor={borderColor}
                              >
                                <HStack>
                                  <Box
                                    p={2}
                                    borderRadius="lg"
                                    bg={accentColor}
                                    color="white"
                                  >
                                    <Icon as={FiUsers} boxSize={5} />
                                  </Box>
                                  <Heading size="md">Resurse și Personal</Heading>
                                </HStack>
                              </CardHeader>
                              <CardBody pt={6}>
                                <VStack spacing={8} align="stretch">
                                  {/* Personal cu dropdown și verificare disponibilitate */}
                                  <PersonnelSelector
                                    selectedPersonnel={assignedUsers}
                                    onPersonnelChange={setAssignedUsers}
                                    startTime={combineDateAndTime(startDate, startTime).toISOString()}
                                    endTime={combineDateAndTime(startDate, endTime).toISOString()}
                                    departmentId={selectedDepartment ? parseInt(selectedDepartment) : undefined}
                                    excludeEventId={editMode && initialData ? initialData.id : undefined}
                                    isDisabled={false}
                                  />

                                  {/* Vehicul cu verificare disponibilitate */}
                                  <VehicleSelector
                                    needsVehicle={needsVehicle}
                                    onNeedsVehicleChange={setNeedsVehicle}
                                    selectedVehicleId={vehicleId}
                                    onVehicleChange={setVehicleId}
                                    startTime={combineDateAndTime(startDate, startTime).toISOString()}
                                    endTime={combineDateAndTime(startDate, endTime).toISOString()}
                                    excludeEventId={editMode && initialData ? initialData.id : undefined}
                                    isDisabled={false}
                                  />

                                  {/* Produse din stoc pentru evenimente care au nevoie */}
                                  {(['INSPECTION', 'TRAINING', 'MEETING', 'MAINTENANCE'].includes(type)) && (
                                    <EventProductSelector
                                      eventType={type}
                                      selectedProducts={selectedProducts}
                                      onProductsChange={setSelectedProducts}
                                    />
                                  )}

                                  {/* Confidențialitate - modernizat */}
                                  <FormControl>
                                    <FormLabel fontWeight="semibold" color={textColor}>
                                      Confidențialitate
                                    </FormLabel>
                                    <HStack spacing={4}>
                                      <Switch
                                        size="lg"
                                        isChecked={isPrivate}
                                        onChange={(e) => setIsPrivate(e.target.checked)}
                                        colorScheme="teal"
                                      />
                                      <Text fontSize="sm" color={mutedTextColor}>
                                        Eveniment privat
                                      </Text>
                                    </HStack>
                                    <FormHelperText>
                                      Evenimentele private sunt vizibile doar pentru personal autorizat
                                    </FormHelperText>
                                  </FormControl>
                                </VStack>
                              </CardBody>
                            </Card>
                          </VStack>
                        )}
                      </SlideFade>
                    </TabPanel>

                    {/* Tab 2: Evenimente Existente - modernizat */}
                    <TabPanel px={0} py={6}>
                      <SlideFade in={true} offsetY="20px">
                        <VStack spacing={8} align="stretch">
                          {loading ? (
                            <Box textAlign="center" py={12}>
                              <Box
                                w="60px"
                                h="60px"
                                mx="auto"
                                mb={4}
                                borderRadius="full"
                                bg={`linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`}
                                animation={`${shimmer} 1.5s infinite`}
                              />
                              <Text fontSize="lg" color={mutedTextColor} fontWeight="medium">
                                Se încarcă evenimente...
                              </Text>
                            </Box>
                          ) : existingEvents.length === 0 ? (
                            <Box textAlign="center" py={12}>
                              <Box
                                w="80px"
                                h="80px"
                                mx="auto"
                                mb={6}
                                borderRadius="full"
                                bg={cardBgColor}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <Icon as={FiCalendar} boxSize={10} color={mutedTextColor} />
                              </Box>
                              <Text fontSize="xl" fontWeight="bold" color={mutedTextColor} mb={3}>
                                Niciun eveniment programat
                              </Text>
                              <Text fontSize="md" color={mutedTextColor} fontWeight="medium">
                                Pentru {startDate.toLocaleDateString('ro-RO', { 
                                  weekday: 'long', 
                                  day: 'numeric', 
                                  month: 'long', 
                                  year: 'numeric' 
                                })}
                              </Text>
                            </Box>
                          ) : (
                            <>
                              <Box
                                bg={`linear-gradient(135deg, ${secondaryColor}10, ${primaryColor}10)`}
                                p={6}
                                borderRadius="2xl"
                                border="2px solid"
                                borderColor={transportBorderColor}
                                position="relative"
                                overflow="hidden"
                              >
                                {/* Background pattern */}
                                <Box
                                  position="absolute"
                                  top={0}
                                  right={0}
                                  w="100px"
                                  h="100px"
                                  bg={`linear-gradient(135deg, ${secondaryColor}20, ${primaryColor}20)`}
                                  borderRadius="full"
                                  transform="translate(30px, -30px)"
                                />
                                
                                <HStack position="relative" zIndex={1}>
                                  <Box
                                    p={3}
                                    borderRadius="xl"
                                    bg={secondaryColor}
                                    color="white"
                                  >
                                    <Icon as={FiCalendar} boxSize={6} />
                                  </Box>
                                  <Box>
                                    <Text fontSize="xl" fontWeight="bold" color={textColor}>
                                      {existingEvents.length} evenimente programate
                                    </Text>
                                    <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">
                                      pentru {startDate.toLocaleDateString('ro-RO', { 
                                        weekday: 'long', 
                                        day: 'numeric', 
                                        month: 'long', 
                                        year: 'numeric' 
                                      })}
                                    </Text>
                                  </Box>
                                </HStack>
                              </Box>
                              
                              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                                {existingEvents.map((event, index) => (
                                  <Card 
                                    key={event.id || index} 
                                    bg={cardBgColor}
                                    borderRadius="2xl"
                                    border="2px solid"
                                    borderColor={borderColor}
                                    overflow="hidden"
                                    transition="all 0.3s"
                                    _hover={{
                                      transform: 'translateY(-8px) scale(1.02)',
                                      boxShadow: '2xl',
                                      borderColor: primaryColor,
                                    }}
                                    cursor="pointer"
                                    animation={`${fadeInUp} 0.5s ease-out ${index * 0.1}s both`}
                                  >
                                    <CardBody p={6}>
                                      <VStack align="start" spacing={4}>
                                        {/* Header cu tip și timp - modernizat */}
                                        <HStack justify="space-between" w="full">
                                          <Badge 
                                            colorScheme={getEventTypeColor(event.type)}
                                            fontSize="xs"
                                            px={4}
                                            py={2}
                                            borderRadius="full"
                                            fontWeight="bold"
                                            textTransform="uppercase"
                                            letterSpacing="wide"
                                          >
                                            {event.type}
                                          </Badge>
                                          <HStack spacing={2}>
                                            <Box
                                              p={1}
                                              borderRadius="full"
                                              bg={secondaryColor}
                                              color="white"
                                            >
                                              <Icon as={FiClock} boxSize={3} />
                                            </Box>
                                            <Text fontSize="sm" color={mutedTextColor} fontWeight="bold">
                                              {formatTime(event.start)} - {formatTime(event.end)}
                                            </Text>
                                          </HStack>
                                        </HStack>

                                        {/* Titlu și descriere - modernizat */}
                                        <Box>
                                          <Text 
                                            fontSize="lg" 
                                            fontWeight="bold" 
                                            mb={2} 
                                            lineHeight="1.3"
                                            color={textColor}
                                          >
                                            {event.title}
                                          </Text>
                                          {event.description && (
                                            <Text 
                                              fontSize="sm" 
                                              color={mutedTextColor} 
                                              fontWeight="medium" 
                                              lineHeight="1.5"
                                            >
                                              {event.description.length > 100 
                                                ? `${event.description.substring(0, 100)}...` 
                                                : event.description
                                              }
                                            </Text>
                                          )}
                                        </Box>

                                        {/* Detalii suplimentare - modernizat */}
                                        <VStack align="start" spacing={3} w="full">
                                          {/* Locație */}
                                          {event.location && (
                                            <HStack>
                                              <Box
                                                p={1}
                                                borderRadius="full"
                                                bg="orange.100"
                                                color="orange.600"
                                              >
                                                <Icon as={FiMapPin} boxSize={3} />
                                              </Box>
                                              <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">
                                                {event.location.length > 50 
                                                  ? `${event.location.substring(0, 50)}...` 
                                                  : event.location
                                                }
                                              </Text>
                                            </HStack>
                                          )}
                                          
                                          {/* Vehicul cu detalii */}
                                          {event.vehicle && event.vehicle.id && (
                                            <HStack>
                                              <Box
                                                p={1}
                                                borderRadius="full"
                                                bg="green.100"
                                                color="green.600"
                                              >
                                                <Icon as={FiTruck} boxSize={3} />
                                              </Box>
                                              <VStack align="start" spacing={0}>
                                                <Text fontSize="sm" color={mutedTextColor} fontWeight="bold">
                                                  {event.vehicle.brand} {event.vehicle.model}
                                                </Text>
                                                <Text fontSize="xs" color={mutedTextColor} fontWeight="medium">
                                                  {event.vehicle.registration_number}
                                                </Text>
                                              </VStack>
                                            </HStack>
                                          )}

                                          {/* Personal asignat */}
                                          {event.assignmentsCount && event.assignmentsCount > 0 && (
                                            <HStack>
                                              <Box
                                                p={1}
                                                borderRadius="full"
                                                bg="purple.100"
                                                color="purple.600"
                                              >
                                                <Icon as={FiUser} boxSize={3} />
                                              </Box>
                                              <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">
                                                {event.assignmentsCount} {event.assignmentsCount === 1 ? 'persoană asignată' : 'persoane asignate'}
                                              </Text>
                                            </HStack>
                                          )}
                                        </VStack>
                                      </VStack>
                                    </CardBody>
                                  </Card>
                                ))}
                              </SimpleGrid>
                            </>
                          )}
                        </VStack>
                      </SlideFade>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </VStack>
            )}
          </ScaleFade>
        </ModalBody>

        {/* Footer modernizat */}
        <ModalFooter 
          borderTopWidth="1px" 
          borderColor={borderColor}
          bg={cardBgColor}
          py={6}
        >
          <HStack spacing={4} w="full" justify="space-between">
            <Button 
              variant="outline" 
              onClick={() => { onClose(); resetForm(); }}
              size="lg"
              borderRadius="xl"
              borderWidth="2px"
              _hover={{
                transform: 'translateX(-4px)',
                boxShadow: 'lg',
              }}
              transition="all 0.3s"
              leftIcon={<Icon as={FiX} />}
            >
              Anulare
            </Button>
            
            <Button
              colorScheme="teal"
              onClick={handleSubmit}
              isDisabled={isSubmitDisabled()}
              size="lg"
              borderRadius="xl"
              px={10}
              py={7}
              fontWeight="bold"
              fontSize="xl"
              bg={`linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`}
              color="white"
              _hover={{ 
                transform: 'translateY(-3px) scale(1.05)', 
                boxShadow: '2xl',
                bg: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})`,
              }}
              _active={{
                transform: 'translateY(-1px) scale(1.02)',
              }}
              _disabled={{
                opacity: 0.6,
                cursor: 'not-allowed',
                transform: 'none',
              }}
              transition="all 0.3s"
              rightIcon={<Icon as={editMode ? FiCheck : FiPlus} boxSize={6} />}
              position="relative"
              overflow="hidden"
              boxShadow="lg"
            >
              {/* Shimmer effect */}
              <Box
                position="absolute"
                top={0}
                left={0}
                w="full"
                h="full"
                bg="white"
                opacity={0.3}
                transform="skewX(-20deg) translateX(-100%)"
                animation={`${shimmer} 2s infinite`}
              />
              <Text position="relative" zIndex={1}>
                {editMode ? 'Salvează Modificările' : 'Creează Eveniment'}
              </Text>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 