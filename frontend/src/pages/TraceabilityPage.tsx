import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Icon,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Select,
  Input,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Code,
  Tooltip
} from '@chakra-ui/react';
import { 
  FiEye, 
  FiClock, 
  FiPackage, 
  FiTruck,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiActivity,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { TraceabilityService, MaterialRequestTraceability, TransportEventTraceability, TraceabilityStatistics } from '../services/TraceabilityService';

export default function TraceabilityPage() {
  const toast = useToast();
  
  // State pentru date
  const [requests, setRequests] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<TraceabilityStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State pentru filtre
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    start_date: '',
    end_date: '',
    search: ''
  });
  
  // State pentru paginare
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    pages: 0
  });
  
  // State pentru modaluri
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequestTraceability | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TransportEventTraceability | null>(null);
  const { isOpen: isRequestModalOpen, onOpen: onRequestModalOpen, onClose: onRequestModalClose } = useDisclosure();
  const { isOpen: isEventModalOpen, onOpen: onEventModalOpen, onClose: onEventModalClose } = useDisclosure();
  
  // Culori
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  
  // Încarcă datele
  useEffect(() => {
    loadData();
  }, [filters, pagination.page]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [requestsData, statisticsData] = await Promise.all([
        TraceabilityService.getAllRequestsWithTraceability({
          ...filters,
          page: pagination.page,
          limit: pagination.limit
        }),
        TraceabilityService.getTraceabilityStatistics()
      ]);
      
      setRequests(requestsData.data);
      setPagination(requestsData.pagination);
      setStatistics(statisticsData);
    } catch (error) {
      console.error('Error loading traceability data:', error);
      setError('Eroare la încărcarea datelor de trasabilitate');
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca datele de trasabilitate',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleViewRequestTraceability = async (requestId: number) => {
    try {
      const traceability = await TraceabilityService.getMaterialRequestTraceability(requestId);
      setSelectedRequest(traceability);
      onRequestModalOpen();
    } catch (error) {
      console.error('Error loading request traceability:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut încărca trasabilitatea cererii',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };
  
  const handleViewEventTraceability = async (eventId: number) => {
    try {
      const traceability = await TraceabilityService.getTransportEventTraceability(eventId);
      setSelectedEvent(traceability);
      onEventModalOpen();
    } catch (error) {
      console.error('Error loading event traceability:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut încărca trasabilitatea evenimentului',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'yellow';
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'FULFILLED': return 'blue';
      case 'CANCELLED': return 'gray';
      default: return 'gray';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'green';
      case 'MEDIUM': return 'yellow';
      case 'HIGH': return 'orange';
      case 'URGENT': return 'red';
      default: return 'gray';
    }
  };
  
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'CREATED': return FiPackage;
      case 'APPROVED': return FiCheck;
      case 'REJECTED': return FiX;
      case 'UPDATED': return FiActivity;
      case 'STATUS_CHANGED': return FiAlertTriangle;
      default: return FiClock;
    }
  };
  
  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'CREATED': return 'blue';
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'UPDATED': return 'orange';
      case 'STATUS_CHANGED': return 'purple';
      default: return 'gray';
    }
  };
  
  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Center>
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Se încarcă datele de trasabilitate...</Text>
          </VStack>
        </Center>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Eroare!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={4}>
            <HStack>
              <Icon as={FiActivity} color="blue.500" />
              <Text>Trasabilitate Completă</Text>
            </HStack>
          </Heading>
          <Text color={mutedTextColor}>
            Monitorizare completă a cererilor, comenzi și evenimente în sistem
          </Text>
        </Box>
        
        {/* Statistici */}
        <Card>
          <CardHeader>
            <Heading size="md">Statistici Trasabilitate</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {statistics.map((stat, index) => (
                <Stat key={index}>
                  <StatLabel>{stat.entity_type.replace('_', ' ')}</StatLabel>
                  <StatNumber>{stat.total_entities}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    {stat.last_7_days} în ultimele 7 zile
                  </StatHelpText>
                </Stat>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>
        
        {/* Filtre */}
        <Card>
          <CardHeader>
            <Heading size="md">Filtre</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              <Select
                placeholder="Status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="PENDING">În așteptare</option>
                <option value="APPROVED">Aprobat</option>
                <option value="REJECTED">Respins</option>
                <option value="FULFILLED">Completat</option>
                <option value="CANCELLED">Anulat</option>
              </Select>
              
              <Select
                placeholder="Prioritate"
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <option value="LOW">Scăzută</option>
                <option value="MEDIUM">Medie</option>
                <option value="HIGH">Ridicată</option>
                <option value="URGENT">Urgentă</option>
              </Select>
              
              <Input
                type="date"
                placeholder="Data început"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
              
              <Input
                type="date"
                placeholder="Data sfârșit"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              />
            </SimpleGrid>
          </CardBody>
        </Card>
        
        {/* Tabel cereri */}
        <Card>
          <CardHeader>
            <Heading size="md">Cereri de Materiale</Heading>
          </CardHeader>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Număr Cerere</Th>
                  <Th>Produs</Th>
                  <Th>Cantitate</Th>
                  <Th>Prioritate</Th>
                  <Th>Status</Th>
                  <Th>Solicitant</Th>
                  <Th>Data Creării</Th>
                  <Th>Acțiuni</Th>
                </Tr>
              </Thead>
              <Tbody>
                {requests.map((request) => (
                  <Tr key={request.request_id}>
                    <Td>
                      <Text fontWeight="semibold">{request.request_number}</Text>
                    </Td>
                    <Td>{request.product_name}</Td>
                    <Td>
                      <Text>
                        {request.quantity_requested} {request.product_unit || 'buc'}
                      </Text>
                      {request.quantity_approved != null && request.quantity_approved > 0 && (
                        <Text fontSize="sm" color={mutedTextColor}>
                          Aprobat: {request.quantity_approved}
                        </Text>
                      )}
                    </Td>
                    <Td>
                      <Badge colorScheme={getPriorityColor(request.priority)}>
                        {request.priority}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {request.requester_first_name} {request.requester_last_name}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {new Date(request.request_created_at).toLocaleDateString('ro-RO')}
                      </Text>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Tooltip label="Vezi trasabilitatea">
                          <Button
                            size="sm"
                            colorScheme="blue"
                            variant="outline"
                            onClick={() => handleViewRequestTraceability(request.request_id)}
                          >
                            <Icon as={FiEye} />
                          </Button>
                        </Tooltip>
                        {request.transport_event_id && (
                          <Tooltip label="Vezi evenimentul de transport">
                            <Button
                              size="sm"
                              colorScheme="green"
                              variant="outline"
                              onClick={() => handleViewEventTraceability(request.transport_event_id)}
                            >
                              <Icon as={FiTruck} />
                            </Button>
                          </Tooltip>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            
            {/* Paginare */}
            {pagination.pages > 1 && (
              <Box mt={6} display="flex" justifyContent="space-between" alignItems="center">
                <Text fontSize="sm" color={mutedTextColor}>
                  Afișând {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} din {pagination.total} cereri
                </Text>
                
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Icon as={FiChevronLeft} />}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    isDisabled={pagination.page === 1}
                  >
                    Anterior
                  </Button>
                  
                  <HStack spacing={1}>
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(pagination.pages - 4, pagination.page - 2)) + i;
                      return (
                        <Button
                          key={pageNum}
                          size="sm"
                          variant={pageNum === pagination.page ? "solid" : "outline"}
                          colorScheme={pageNum === pagination.page ? "blue" : "gray"}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </HStack>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    rightIcon={<Icon as={FiChevronRight} />}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    isDisabled={pagination.page === pagination.pages}
                  >
                    Următor
                  </Button>
                </HStack>
              </Box>
            )}
          </CardBody>
        </Card>
        
        {/* Modal pentru trasabilitatea cererii */}
        <Modal isOpen={isRequestModalOpen} onClose={onRequestModalClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <Icon as={FiPackage} color="blue.500" />
                <Text>Trasabilitate Cerere: {selectedRequest?.request.request_number}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedRequest && (
                <VStack spacing={6} align="stretch">
                  {/* Detalii cerere */}
                  <Box p={4} bg={bgColor} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                    <VStack spacing={3} align="stretch">
                      <HStack>
                        <Text fontWeight="semibold">Produs:</Text>
                        <Text>{selectedRequest.request.product_name}</Text>
                      </HStack>
                      <HStack>
                        <Text fontWeight="semibold">Cantitate cerută:</Text>
                        <Text>{selectedRequest.request.quantity_requested} {selectedRequest.request.product_unit || 'buc'}</Text>
                      </HStack>
                      <HStack>
                        <Text fontWeight="semibold">Cantitate aprobată:</Text>
                        <Text>{selectedRequest.request.quantity_approved != null ? `${selectedRequest.request.quantity_approved} ${selectedRequest.request.product_unit || 'buc'}` : 'N/A'}</Text>
                      </HStack>
                      <HStack>
                        <Text fontWeight="semibold">Status:</Text>
                        <Badge colorScheme={getStatusColor(selectedRequest.request.status)}>
                          {selectedRequest.request.status}
                        </Badge>
                      </HStack>
                      <HStack>
                        <Text fontWeight="semibold">Prioritate:</Text>
                        <Badge colorScheme={getPriorityColor(selectedRequest.request.priority)}>
                          {selectedRequest.request.priority}
                        </Badge>
                      </HStack>
                    </VStack>
                  </Box>
                  
                  {/* Audit trail */}
                  <Box>
                    <Heading size="md" mb={4}>Istoric Acțiuni</Heading>
                    <Accordion allowMultiple>
                      {selectedRequest.auditTrail.map((audit) => {
                        const ActionIcon = getActionIcon(audit.action_type);
                        const actionColor = getActionColor(audit.action_type);
                        
                        return (
                          <AccordionItem key={audit.id}>
                            <AccordionButton>
                              <Box flex="1" textAlign="left">
                                <HStack>
                                  <Icon as={ActionIcon} color={`${actionColor}.500`} />
                                  <Text fontWeight="semibold">{audit.action_type}</Text>
                                  <Text fontSize="sm" color={mutedTextColor}>
                                    - {audit.first_name} {audit.last_name}
                                  </Text>
                                  <Text fontSize="sm" color={mutedTextColor}>
                                    {new Date(audit.performed_at).toLocaleString('ro-RO')}
                                  </Text>
                                </HStack>
                              </Box>
                              <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4}>
                              <VStack spacing={3} align="stretch">
                                {audit.comments && (
                                  <Box>
                                    <Text fontWeight="semibold" fontSize="sm">Comentarii:</Text>
                                    <Text fontSize="sm">{audit.comments}</Text>
                                  </Box>
                                )}
                                
                                {audit.old_values && (
                                  <Box>
                                    <Text fontWeight="semibold" fontSize="sm">Valori vechi:</Text>
                                    <Code fontSize="xs" p={2} borderRadius="md">
                                      {JSON.stringify(audit.old_values, null, 2)}
                                    </Code>
                                  </Box>
                                )}
                                
                                {audit.new_values && (
                                  <Box>
                                    <Text fontWeight="semibold" fontSize="sm">Valori noi:</Text>
                                    <Code fontSize="xs" p={2} borderRadius="md">
                                      {JSON.stringify(audit.new_values, null, 2)}
                                    </Code>
                                  </Box>
                                )}
                                
                                <HStack fontSize="xs" color={mutedTextColor}>
                                  <Text>IP: {audit.ip_address}</Text>
                                  <Text>•</Text>
                                  <Text>User Agent: {audit.user_agent?.substring(0, 50)}...</Text>
                                </HStack>
                              </VStack>
                            </AccordionPanel>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </Box>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" onClick={onRequestModalClose}>
                Închide
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        
        {/* Modal pentru trasabilitatea evenimentului */}
        <Modal isOpen={isEventModalOpen} onClose={onEventModalClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <Icon as={FiTruck} color="green.500" />
                <Text>Trasabilitate Eveniment: {selectedEvent?.event.title}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedEvent && (
                <VStack spacing={6} align="stretch">
                  {/* Detalii eveniment */}
                  <Box p={4} bg={bgColor} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                    <VStack spacing={3} align="stretch">
                      <HStack>
                        <Text fontWeight="semibold">Titlu:</Text>
                        <Text>{selectedEvent.event.title}</Text>
                      </HStack>
                      <HStack>
                        <Text fontWeight="semibold">Tip:</Text>
                        <Text>{selectedEvent.event.event_type}</Text>
                      </HStack>
                      <HStack>
                        <Text fontWeight="semibold">Status:</Text>
                        <Badge colorScheme={getStatusColor(selectedEvent.event.event_status)}>
                          {selectedEvent.event.event_status}
                        </Badge>
                      </HStack>
                      <HStack>
                        <Text fontWeight="semibold">Data început:</Text>
                        <Text>{new Date(selectedEvent.event.start_time).toLocaleString('ro-RO')}</Text>
                      </HStack>
                      <HStack>
                        <Text fontWeight="semibold">Data sfârșit:</Text>
                        <Text>{new Date(selectedEvent.event.end_time).toLocaleString('ro-RO')}</Text>
                      </HStack>
                      <HStack>
                        <Text fontWeight="semibold">Creat de:</Text>
                        <Text>{selectedEvent.event.creator_first_name} {selectedEvent.event.creator_last_name}</Text>
                      </HStack>
                    </VStack>
                  </Box>
                  
                  {/* Audit trail */}
                  <Box>
                    <Heading size="md" mb={4}>Istoric Acțiuni</Heading>
                    <Accordion allowMultiple>
                      {selectedEvent.auditTrail.map((audit) => {
                        const ActionIcon = getActionIcon(audit.action_type);
                        const actionColor = getActionColor(audit.action_type);
                        
                        return (
                          <AccordionItem key={audit.id}>
                            <AccordionButton>
                              <Box flex="1" textAlign="left">
                                <HStack>
                                  <Icon as={ActionIcon} color={`${actionColor}.500`} />
                                  <Text fontWeight="semibold">{audit.action_type}</Text>
                                  <Text fontSize="sm" color={mutedTextColor}>
                                    - {audit.first_name} {audit.last_name}
                                  </Text>
                                  <Text fontSize="sm" color={mutedTextColor}>
                                    {new Date(audit.performed_at).toLocaleString('ro-RO')}
                                  </Text>
                                </HStack>
                              </Box>
                              <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4}>
                              <VStack spacing={3} align="stretch">
                                {audit.comments && (
                                  <Box>
                                    <Text fontWeight="semibold" fontSize="sm">Comentarii:</Text>
                                    <Text fontSize="sm">{audit.comments}</Text>
                                  </Box>
                                )}
                                
                                {audit.old_values && (
                                  <Box>
                                    <Text fontWeight="semibold" fontSize="sm">Valori vechi:</Text>
                                    <Code fontSize="xs" p={2} borderRadius="md">
                                      {JSON.stringify(audit.old_values, null, 2)}
                                    </Code>
                                  </Box>
                                )}
                                
                                {audit.new_values && (
                                  <Box>
                                    <Text fontWeight="semibold" fontSize="sm">Valori noi:</Text>
                                    <Code fontSize="xs" p={2} borderRadius="md">
                                      {JSON.stringify(audit.new_values, null, 2)}
                                    </Code>
                                  </Box>
                                )}
                                
                                <HStack fontSize="xs" color={mutedTextColor}>
                                  <Text>IP: {audit.ip_address}</Text>
                                  <Text>•</Text>
                                  <Text>User Agent: {audit.user_agent?.substring(0, 50)}...</Text>
                                </HStack>
                              </VStack>
                            </AccordionPanel>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </Box>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" onClick={onEventModalClose}>
                Închide
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
}
