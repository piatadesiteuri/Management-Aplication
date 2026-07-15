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
} from '@chakra-ui/react';
import { useState, useEffect, useCallback, type ReactNode } from 'react';
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

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={3}>
        {title}
      </Text>
      {children}
    </Box>
  );
}

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
    const eventEnd = combineDateAndTime(startDate, endTime);

    if (selectedCategory !== 'TRANSPORT') {
      const excludeId = editMode && initialData?.id ? String(initialData.id) : undefined;
      try {
        if (needsVehicle && vehicleId) {
          const vehicles = await calendarService.checkVehicleAvailability(
            eventStart.toISOString(),
            eventEnd.toISOString(),
            excludeId
          );
          const selectedVehicle = vehicles.find((v: any) => v.id === vehicleId);
          if (selectedVehicle && !selectedVehicle.isAvailable) {
            toast({
              title: 'Conflict de programare',
              description: selectedVehicle.conflictReason || 'Vehiculul este deja folosit în acest interval.',
              status: 'error',
              duration: 6000,
              isClosable: true,
            });
            return;
          }
        }

        if (assignedUsers.length > 0) {
          const personnel = await calendarService.checkPersonnelAvailability(
            eventStart.toISOString(),
            eventEnd.toISOString(),
            excludeId,
            selectedDepartment ? parseInt(selectedDepartment) : undefined
          );
          const conflicted = assignedUsers
            .map((uid) => personnel.find((p: any) => p.id === uid))
            .find((p) => p && !p.isAvailable);
          if (conflicted) {
            toast({
              title: 'Conflict de programare',
              description: conflicted.conflictReason || 'Un membru al echipei are deja alt eveniment în acest interval.',
              status: 'error',
              duration: 6000,
              isClosable: true,
            });
            return;
          }
        }
      } catch (conflictError) {
        console.error('Conflict check failed:', conflictError);
      }
    }

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
      case 'MEETING': return 'purple';
      case 'TRAINING': return 'orange';
      case 'SUPPLY_ORDER':
      case 'TRANSPORT_DELIVERY':
      case 'TRANSPORT_PICKUP':
        return 'teal';
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

  const getEventTypeLabel = (eventType: EventType) =>
    EVENT_TYPE_LABELS[eventType] || eventType;

  const getEventStatusLabel = (status: EventStatus) => {
    switch (status) {
      case 'DRAFT': return 'Ciornă';
      case 'PENDING': return 'În așteptare';
      case 'APPROVED': return 'Aprobat';
      case 'IN_PROGRESS': return 'În desfășurare';
      case 'COMPLETED': return 'Finalizat';
      case 'CANCELLED': return 'Anulat';
      case 'POSTPONED': return 'Amânat';
      case 'URGENT': return 'Urgent';
      default: return status;
    }
  };

  const sortedDayEvents = [...existingEvents].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const renderDayEventsPanel = () => (
    <Box
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      p={3}
    >
      <Text fontSize="sm" fontWeight="semibold" mb={2}>
        Programul zilei ({sortedDayEvents.length})
      </Text>
      {loading ? (
        <Text fontSize="sm" color={mutedTextColor} py={2}>
          Se încarcă evenimentele...
        </Text>
      ) : sortedDayEvents.length === 0 ? (
        <Text fontSize="sm" color={mutedTextColor} py={2}>
          Niciun eveniment programat în această zi.
        </Text>
      ) : (
        <VStack spacing={2} align="stretch" maxH="220px" overflowY="auto">
          {sortedDayEvents.map((event, index) => (
            <Box
              key={event.id || index}
              p={2}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="md"
              bg={cardBgColor}
            >
              <HStack justify="space-between" align="start" spacing={2}>
                <Box flex={1} minW={0}>
                  <HStack spacing={2} mb={1} flexWrap="wrap">
                    <Text fontSize="xs" fontWeight="semibold" color={primaryColor}>
                      {formatTime(event.start)} – {formatTime(event.end)}
                    </Text>
                    <Badge colorScheme={getEventTypeColor(event.type)} fontSize="xs">
                      {getEventTypeLabel(event.type)}
                    </Badge>
                    <Badge
                      colorScheme={
                        event.status === 'COMPLETED' ? 'green' :
                        event.status === 'IN_PROGRESS' ? 'blue' :
                        event.status === 'CANCELLED' ? 'red' : 'orange'
                      }
                      fontSize="xs"
                      variant="subtle"
                    >
                      {getEventStatusLabel(event.status)}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                    {event.title}
                  </Text>
                  <HStack spacing={3} mt={1} flexWrap="wrap">
                    {event.location && (
                      <HStack spacing={1}>
                        <Icon as={FiMapPin} boxSize={3} color={mutedTextColor} />
                        <Text fontSize="xs" color={mutedTextColor} noOfLines={1}>
                          {event.location}
                        </Text>
                      </HStack>
                    )}
                    {(event.assignmentsCount || 0) > 0 && (
                      <HStack spacing={1}>
                        <Icon as={FiUsers} boxSize={3} color={mutedTextColor} />
                        <Text fontSize="xs" color={mutedTextColor}>
                          {event.assignmentsCount} {event.assignmentsCount === 1 ? 'persoană' : 'persoane'}
                        </Text>
                      </HStack>
                    )}
                    {event.vehicle?.registration_number && (
                      <HStack spacing={1}>
                        <Icon as={FiTruck} boxSize={3} color={mutedTextColor} />
                        <Text fontSize="xs" color={mutedTextColor}>
                          {event.vehicle.brand} {event.vehicle.model}
                        </Text>
                      </HStack>
                    )}
                  </HStack>
                  {event.description && (
                    <Text fontSize="xs" color={mutedTextColor} mt={1} noOfLines={2}>
                      {event.description}
                    </Text>
                  )}
                </Box>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );

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
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={bgColor} maxH="90vh">
        <ModalHeader borderBottomWidth="1px" borderColor={borderColor} py={4}>
          <Flex align="center" gap={3}>
            <Icon as={FiCalendar} color={mutedTextColor} boxSize={5} />
            <Box>
              <Heading size="md" fontWeight="semibold">
                {editMode ? 'Editare eveniment' : 'Creare eveniment nou'}
              </Heading>
              <Text fontSize="sm" color={mutedTextColor} mt={0.5}>
                {startDate.toLocaleDateString('ro-RO', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </Box>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody py={4}>
          {(currentStep === 'SELECT_TYPE' || (!editMode && !selectedCategory)) && (
              <VStack spacing={4} align="stretch">
                {renderDayEventsPanel()}
                <Divider />
                <Box>
                  <Text fontWeight="medium" mb={1}>Selectați tipul evenimentului</Text>
                  <Text color={mutedTextColor} fontSize="sm">
                    Alegeți categoria pentru a continua cu configurarea
                  </Text>
                </Box>
                <EventTypeSelector
                  selectedCategory={selectedCategory}
                  onCategorySelect={handleCategorySelect}
                />
              </VStack>
            )}

            {currentStep === 'CONFIGURE_EVENT' && (
              <VStack spacing={4} align="stretch">
                {!editMode && (
                  <Button
                    leftIcon={<Icon as={FiArrowLeft} />}
                    variant="ghost"
                    size="sm"
                    alignSelf="flex-start"
                    onClick={handleBackToTypeSelection}
                  >
                    Schimbă tipul evenimentului
                  </Button>
                )}

                <Tabs variant="line" colorScheme="blue" index={activeTab} onChange={setActiveTab}>
                  <TabList>
                    <Tab fontSize="sm" py={2}>
                      {selectedCategory === 'TRANSPORT' ? 'Configurare transport' : 'Detalii eveniment'}
                    </Tab>
                    <Tab fontSize="sm" py={2}>
                      Evenimente existente ({existingEvents.length})
                    </Tab>
                  </TabList>

                  <TabPanels>
                    <TabPanel px={0} py={4}>
                        {selectedCategory === 'TRANSPORT' ? (
                          <TransportEventForm
                            onSubmit={handleTransportDataChange}
                            endDate={endDate}
                            initialData={transportData || undefined}
                            editMode={editMode}
                          />
                        ) : (
                          <VStack spacing={4} align="stretch">
                            <FormSection title="Informații de bază">
                              <VStack spacing={3} align="stretch">
                                <FormControl isRequired isInvalid={!!errors.title}>
                                  <FormLabel fontSize="sm">Titlu eveniment</FormLabel>
                                  <Input
                                    placeholder="ex: Inspecție Spital Județean"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    size="sm"
                                  />
                                  <FormErrorMessage>{errors.title}</FormErrorMessage>
                                </FormControl>

                                <FormControl>
                                  <FormLabel fontSize="sm">Descriere</FormLabel>
                                  <Textarea
                                    placeholder="Descrieți scopul și detaliile evenimentului..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    size="sm"
                                    rows={3}
                                  />
                                </FormControl>

                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                                  <FormControl isRequired>
                                    <FormLabel fontSize="sm">Tip activitate</FormLabel>
                                    <Select
                                      value={type}
                                      onChange={(e) => setType(e.target.value as EventType)}
                                      size="sm"
                                    >
                                      <option value="INSPECTION">Inspecție</option>
                                      <option value="TRAVEL">Deplasare</option>
                                      <option value="MEETING">Ședință</option>
                                      <option value="TRAINING">Formare</option>
                                      <option value="MAINTENANCE">Întreținere</option>
                                      <optgroup label="Gestionare stoc">
                                        <option value="STOCK_RECEPTION">Primire marfă</option>
                                        <option value="STOCK_DISTRIBUTION">Distribuire marfă</option>
                                        <option value="STOCK_MOVEMENT">Mutare marfă</option>
                                        <option value="INVENTORY_AUDIT">Inventariere</option>
                                      </optgroup>
                                      <option value="OTHER">Altele</option>
                                    </Select>
                                  </FormControl>

                                  <FormControl>
                                    <FormLabel fontSize="sm">Departament</FormLabel>
                                    <Select
                                      value={selectedDepartment}
                                      onChange={(e) => setSelectedDepartment(e.target.value)}
                                      placeholder="Selectați departamentul"
                                      size="sm"
                                    >
                                      {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                          {dept.name}
                                        </option>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </SimpleGrid>

                                <LocationAutocomplete value={location} onChange={setLocation} />
                              </VStack>
                            </FormSection>

                            <FormSection title="Program">
                              <VStack spacing={3} align="stretch">
                                <TimeRangePicker
                                  startTime={startTime}
                                  endTime={endTime}
                                  onStartTimeChange={setStartTime}
                                  onEndTimeChange={setEndTime}
                                />
                                {errors.time && (
                                  <Alert status="error" size="sm" borderRadius="md">
                                    <AlertIcon />
                                    <AlertDescription whiteSpace="pre-line" fontSize="sm">
                                      {errors.time}
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </VStack>
                            </FormSection>

                            <FormSection title="Resurse">
                              <VStack spacing={4} align="stretch">
                                <PersonnelSelector
                                  selectedPersonnel={assignedUsers}
                                  onPersonnelChange={setAssignedUsers}
                                  startTime={combineDateAndTime(startDate, startTime).toISOString()}
                                  endTime={combineDateAndTime(startDate, endTime).toISOString()}
                                  departmentId={selectedDepartment ? parseInt(selectedDepartment) : undefined}
                                  excludeEventId={editMode && initialData ? initialData.id : undefined}
                                  isDisabled={false}
                                />

                                <Divider />

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

                                {(['INSPECTION', 'TRAINING', 'MEETING', 'MAINTENANCE'].includes(type)) && (
                                  <>
                                    <Divider />
                                    <EventProductSelector
                                      eventType={type}
                                      selectedProducts={selectedProducts}
                                      onProductsChange={setSelectedProducts}
                                    />
                                  </>
                                )}

                                <Divider />

                                <FormControl>
                                  <HStack spacing={3}>
                                    <Switch
                                      size="sm"
                                      isChecked={isPrivate}
                                      onChange={(e) => setIsPrivate(e.target.checked)}
                                      colorScheme="blue"
                                    />
                                    <Box>
                                      <Text fontSize="sm">Eveniment privat</Text>
                                      <FormHelperText mt={0}>
                                        Vizibil doar pentru personal autorizat
                                      </FormHelperText>
                                    </Box>
                                  </HStack>
                                </FormControl>
                              </VStack>
                            </FormSection>
                          </VStack>
                        )}
                    </TabPanel>

                    <TabPanel px={0} py={4}>
                      {renderDayEventsPanel()}
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </VStack>
            )}
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor={borderColor} py={3}>
          <HStack spacing={3} w="full" justify="flex-end">
            <Button
              variant="ghost"
              onClick={() => { onClose(); resetForm(); }}
              size="sm"
            >
              Anulare
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isDisabled={isSubmitDisabled()}
              size="sm"
              rightIcon={<Icon as={editMode ? FiCheck : FiPlus} />}
            >
              {editMode ? 'Salvează' : 'Creează eveniment'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 