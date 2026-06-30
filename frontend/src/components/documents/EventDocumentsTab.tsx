import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Badge,
  IconButton,
  useColorModeValue,
  useToast,
  Spinner,
  Center,
  Flex,
  Avatar,
  Tooltip,
  useDisclosure,
  Card,
  CardBody,
  CardHeader,
  Collapse,
  List,
  ListItem,
  ListIcon,
  Divider,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiEye,
  FiDownload,
  FiCalendar,
  FiFileText,
  FiUser,
  FiRefreshCw,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
  FiUsers,
} from 'react-icons/fi';
import DocumentViewerModal from '../calendar/DocumentViewerModal';

interface EventDocument {
  id: number;
  event_id: number;
  document_type: string;
  title: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  version: number;
  is_active: number;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
  event?: {
    id: number;
    title: string;
    type: string;
    start_date?: string;
    end_date?: string;
    location?: string;
    description?: string;
  };
  uploader?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface EventWithDocuments {
  event: {
    id: number;
    title: string;
    type: string;
    start_date?: string;
    end_date?: string;
    location?: string;
    description?: string;
  };
  documents: EventDocument[];
}

interface EventDocumentsTabProps {
  onStatsUpdate?: () => void;
  user?: any;
}

export default function EventDocumentsTab({ }: EventDocumentsTabProps) {
  const [eventsWithDocuments, setEventsWithDocuments] = useState<EventWithDocuments[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventWithDocuments[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState<EventDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // paginare la 5
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const avatarBg = useColorModeValue('green.100', 'green.900');
  const avatarColor = useColorModeValue('green.600', 'green.200');
  const listItemBg = useColorModeValue('gray.50', 'gray.700');
  const listItemBorderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    loadEventsWithDocuments();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [eventsWithDocuments, searchTerm, filterStatus]);

  // Reset la pagina 1 când se schimbă filtrele
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const loadEventsWithDocuments = async () => {
    try {
      setLoading(true);
      const api = (await import('../../services/api')).default;
      const response = await api.get('/documents/events');
      const documents: EventDocument[] = response.data;
      
      // Grupează documentele pe evenimente
      const eventsMap = new Map<number, EventWithDocuments>();
      
      documents.forEach(doc => {
        if (doc.event) {
          if (!eventsMap.has(doc.event.id)) {
            eventsMap.set(doc.event.id, {
              event: doc.event,
              documents: []
            });
          }
          eventsMap.get(doc.event.id)!.documents.push(doc);
        }
      });
      
      const eventsArray = Array.from(eventsMap.values());
      setEventsWithDocuments(eventsArray);
      setFilteredEvents(eventsArray);
    } catch (error) {
      console.error('Error loading event documents:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca documentele evenimentelor',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = eventsWithDocuments;

    // Filtrare după termen de căutare
    if (searchTerm) {
      filtered = filtered.filter(eventData =>
        eventData.event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eventData.event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eventData.event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eventData.documents.some(doc => 
          doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.document_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filtrare după status
    if (filterStatus !== 'all') {
      if (filterStatus === 'active') {
        filtered = filtered.filter(eventData =>
          eventData.documents.some(doc => doc.is_active === 1)
        );
      } else if (filterStatus === 'inactive') {
        filtered = filtered.filter(eventData =>
          eventData.documents.some(doc => doc.is_active === 0)
        );
      }
    }

    setFilteredEvents(filtered);
  };

  // Calculare paginare
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, endIndex);

  const getStatusInfo = (isActive: number) => {
    switch (isActive) {
      case 1:
        return { color: 'green', text: 'Activ', icon: FiCheckCircle };
      case 0:
        return { color: 'orange', text: 'Inactiv', icon: FiClock };
      default:
        return { color: 'gray', text: 'Necunoscut', icon: FiFileText };
    }
  };

  const handleViewDocument = (document: EventDocument) => {
    setSelectedDocument(document);
    onOpen();
  };

  const handleDownloadDocument = async (document: EventDocument) => {
    try {
      const api = (await import('../../services/api')).default;
      const response = await api.get(`/documents/events/${document.id}/download`, {
        responseType: 'blob'
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);

      toast({
        title: 'Succes',
        description: 'Documentul a fost descărcat',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut descărca documentul',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };


  const getCategoryIcon = (documentType: string) => {
    switch (documentType.toLowerCase()) {
      case 'raport':
      case 'report':
        return FiFileText;
      case 'imagine':
      case 'image':
        return FiFileText;
      case 'formular':
      case 'form':
        return FiFileText;
      default:
        return FiFileText;
    }
  };

  const toggleEventExpansion = (eventId: number) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };


  const getEventTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'transport':
        return FiUsers;
      case 'medical':
        return FiUser;
      case 'inspection':
        return FiAlertTriangle;
      default:
        return FiCalendar;
    }
  };

  if (loading) {
    return (
      <Center py={10}>
        <Spinner size="xl" color="green.500" />
      </Center>
    );
  }

  return (
    <Box>
      {/* Header aerisit */}
      <Box mb={4}>
        <Text fontSize="2xl" fontWeight="bold" mb={1}>Documente Evenimente</Text>
        <Text color="gray.400" fontSize="md">Vizualizează documentele atașate la evenimente</Text>
      </Box>
      {/* Statistici compacte */}
      <HStack spacing={4} mb={4}>
        <Box p={3} bg={cardBg} borderRadius="md" border="1px solid" borderColor={borderColor} minW="120px" textAlign="center">
          <Text fontSize="sm" color="gray.400">Evenimente</Text>
          <Text fontWeight="bold" color="green.400" fontSize="xl">{eventsWithDocuments.length}</Text>
        </Box>
        <Box p={3} bg={cardBg} borderRadius="md" border="1px solid" borderColor={borderColor} minW="120px" textAlign="center">
          <Text fontSize="sm" color="gray.400">Documente</Text>
          <Text fontWeight="bold" color="green.400" fontSize="xl">{eventsWithDocuments.reduce((sum, e) => sum + e.documents.length, 0)}</Text>
        </Box>
        <Box p={3} bg={cardBg} borderRadius="md" border="1px solid" borderColor={borderColor} minW="120px" textAlign="center">
          <Text fontSize="sm" color="gray.400">Aprobate</Text>
          <Text fontWeight="bold" color="green.400" fontSize="xl">{eventsWithDocuments.reduce((sum, e) => sum + e.documents.filter(doc => doc.is_active === 1).length, 0)}</Text>
        </Box>
      </HStack>
      {/* Filtre compacte */}
      <Flex gap={2} mb={4} align="center">
        <InputGroup maxW="250px">
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input size="sm" placeholder="Caută evenimente sau documente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </InputGroup>
        <Select size="sm" maxW="180px" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Toate evenimentele</option>
          <option value="active">Cu documente aprobate</option>
          <option value="inactive">Cu documente în așteptare</option>
        </Select>
        <Button size="sm" leftIcon={<FiRefreshCw />} onClick={loadEventsWithDocuments} colorScheme="green" variant="outline">Reîmprospătează</Button>
      </Flex>
      {/* Lista evenimente compacte */}
      <VStack spacing={3} align="stretch">
        {currentEvents.length === 0 ? (
          <Center py={8}>
            <VStack spacing={2}>
              <FiCalendar size={32} color="gray.400" />
              <Text color="gray.500" fontSize="md">Nu s-au găsit evenimente</Text>
            </VStack>
          </Center>
        ) : (
          currentEvents.map((eventData) => {
            const isExpanded = expandedEvents.has(eventData.event.id);
            const EventTypeIcon = getEventTypeIcon(eventData.event.type);
            return (
              <Card key={eventData.event.id} bg={bgColor} border="1px solid" borderColor={borderColor} px={3} py={2} borderRadius="md" _hover={{ boxShadow: 'md', transform: 'translateY(-1px)', transition: 'all 0.15s' }}>
                <CardHeader p={2} pb={1}>
                  <Flex justify="space-between" align="center">
                    <Flex align="center" gap={3} minW={0}>
                      <Avatar icon={<EventTypeIcon />} bg={avatarBg} color={avatarColor} size="sm" />
                      <Box minW={0}>
                        <Text fontWeight="bold" fontSize="md" isTruncated>{eventData.event.title}</Text>
                        <Text color="gray.500" fontSize="sm" isTruncated>{eventData.event.type}</Text>
                      </Box>
                    </Flex>
                    <Button size="xs" variant="ghost" onClick={() => toggleEventExpansion(eventData.event.id)} rightIcon={isExpanded ? <FiChevronUp /> : <FiChevronDown />}>{isExpanded ? 'Ascunde' : 'Documente'}</Button>
                  </Flex>
                </CardHeader>
                <Collapse in={isExpanded}>
                  <CardBody pt={0} pb={2}>
                    <Divider mb={2} />
                    {eventData.documents.length === 0 ? (
                      <Center py={2}><Text color="gray.500">Nu există documente pentru acest eveniment</Text></Center>
                    ) : (
                      <List spacing={2}>
                        {eventData.documents.map((document) => {
                          const statusInfo = getStatusInfo(document.is_active);
                          const CategoryIcon = getCategoryIcon(document.document_type);
                          return (
                            <ListItem key={document.id} p={2} bg={listItemBg} borderRadius="md" border="1px solid" borderColor={listItemBorderColor}
                              fontSize="sm">
                              <Flex justify="space-between" align="center">
                                <Flex align="center" gap={2} minW={0}>
                                  <ListIcon as={CategoryIcon} color={`${statusInfo.color}.500`} />
                                  <Text fontWeight="semibold" isTruncated>{document.title}</Text>
                                  <Badge colorScheme={statusInfo.color} variant="subtle" size="sm">{statusInfo.text}</Badge>
                                </Flex>
                                <HStack spacing={1}>
                                  <Tooltip label="Vizualizează documentul"><IconButton aria-label="Vizualizează" icon={<FiEye />} size="xs" colorScheme="green" variant="ghost" onClick={() => handleViewDocument(document)} /></Tooltip>
                                  <Tooltip label="Descarcă documentul"><IconButton aria-label="Descarcă" icon={<FiDownload />} size="xs" colorScheme="blue" variant="ghost" onClick={() => handleDownloadDocument(document)} /></Tooltip>
                                </HStack>
                              </Flex>
                            </ListItem>
                          );
                        })}
                      </List>
                    )}
                  </CardBody>
                </Collapse>
              </Card>
            );
          })
        )}
      </VStack>
      {/* Paginare */}
      {totalPages > 1 && (
        <Flex justify="center" align="center" mt={4} gap={2}>
          <Button size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} isDisabled={currentPage === 1}>Anterior</Button>
          <Text fontSize="sm" color="gray.400">Pagina {currentPage} din {totalPages}</Text>
          <Button size="sm" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} isDisabled={currentPage === totalPages}>Următor</Button>
        </Flex>
      )}
      {/* Modal pentru vizualizare document */}
      {selectedDocument && (
        <DocumentViewerModal
          isOpen={isOpen}
          onClose={() => {
            onClose();
            setSelectedDocument(null);
          }}
          documentId={selectedDocument.id}
          fileName={selectedDocument.file_name}
          mimeType={selectedDocument.mime_type}
        />
      )}
    </Box>
  );
} 