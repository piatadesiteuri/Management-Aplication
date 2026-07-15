import React, { useState, useEffect } from 'react';
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
  FormControl,
  FormLabel,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Input,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
} from '@chakra-ui/react';
import { FiPackage, FiCheck, FiX, FiClock, FiAlertTriangle, FiEye, FiCalendar, FiTruck } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface MaterialRequest {
  id: number;
  request_number: string;
  product_id: number;
  product_name: string;
  product_unit: string;
  supplier_name: string;
  quantity_requested: number;
  quantity_approved: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | 'CANCELLED';
  reason: string;
  requester_first_name: string;
  requester_last_name: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  transport_event_id?: number;
}

export default function MaterialRequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [approvalQuantity, setApprovalQuantity] = useState<number>(0);
  const [approvalComments, setApprovalComments] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);
  
  // State-uri noi pentru crearea evenimentului de transport
  const [transportDate, setTransportDate] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  
  const { isOpen: isApproveOpen, onOpen: onApproveOpen, onClose: onApproveClose } = useDisclosure();
  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onClose: onRejectClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBgColor = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const readonlyInputBg = useColorModeValue('gray.100', 'gray.600');
  const readonlyInputColor = useColorModeValue('gray.600', 'gray.300');
  const readonlyInputBorder = useColorModeValue('gray.300', 'gray.500');

  useEffect(() => {
    loadRequests();
  }, []);

  // Dacă venim din notificări: /material-requests?request=ID -> deschide automat cererea
  useEffect(() => {
    const reqIdStr = searchParams.get('request');
    if (!reqIdStr) return;
    if (loading) return;

    const reqId = Number(reqIdStr);
    if (!Number.isFinite(reqId)) return;

    const open = async () => {
      const found = requests.find(r => r.id === reqId);
      if (found) {
        setSelectedRequest(found);
        onViewOpen();
      } else {
        try {
          const response = await fetch(`/api/material-requests/${reqId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data?.data) {
              setSelectedRequest(data.data);
              onViewOpen();
            }
          }
        } catch (e) {
          console.error('Error loading material request from query param:', e);
        }
      }

      // curăță parametrul ca să nu se redeschidă la refresh
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('request');
        return next;
      }, { replace: true });
    };

    void open();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, requests]);

  // Încarcă furnizorii pentru un produs specific
  const loadSuppliers = async (productId: number) => {
    try {
      setLoadingSuppliers(true);
      const response = await fetch(`/api/supply/suppliers?product_id=${productId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.data || []);
      } else {
        console.error('Eroare la încărcarea furnizorilor');
        setSuppliers([]);
      }
    } catch (error) {
      console.error('Eroare la încărcarea furnizorilor:', error);
      setSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/material-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data.data || []);
      } else {
        throw new Error('Eroare la încărcarea cererilor');
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca cererile',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    // Validări pentru crearea evenimentului de transport
    if (!transportDate) {
      toast({
        title: 'Eroare',
        description: 'Selectați data pentru evenimentul de transport',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    if (!selectedSupplier) {
      toast({
        title: 'Eroare',
        description: 'Selectați furnizorul pentru evenimentul de transport',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    try {
      const response = await fetch(`/api/material-requests/${selectedRequest.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({
          quantity_approved: selectedRequest.quantity_requested,
          comments: approvalComments,
          transport_date: transportDate,
          supplier_id: selectedSupplier,
          create_transport_event: true
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        const transportEventId = result.data?.transport_event_id;
        
        toast({
          title: 'Succes',
          description: 'Cererea a fost aprobată și evenimentul de transport a fost creat',
          status: 'success',
          duration: 5000,
          isClosable: true
        });
        
        onApproveClose();
        await loadRequests();
        
        // Redirecționează automat la calendar cu evenimentul deschis
        if (transportEventId) {
          setTimeout(() => {
            navigate(`/user/calendar?event=${transportEventId}`);
          }, 1000); // Așteaptă 1 secundă pentru a permite toast-ului să se afișeze
        }
      } else {
        throw new Error('Eroare la aprobarea cererii');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut aproba cererea',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    try {
      const response = await fetch(`/api/material-requests/${selectedRequest.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({
          rejection_reason: rejectionReason
        })
      });
      
      if (response.ok) {
        toast({
          title: 'Succes',
          description: 'Cererea a fost respinsă',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
        onRejectClose();
        await loadRequests();
      } else {
        throw new Error('Eroare la respingerea cererii');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut respinge cererea',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const openApproveModal = async (request: MaterialRequest) => {
    setSelectedRequest(request);
    setApprovalQuantity(request.quantity_requested);
    setApprovalComments('');
    setTransportDate('');
    setSelectedSupplier('');
    setSuppliers([]);
    
    // Încarcă furnizorii pentru produsul respectiv
    await loadSuppliers(request.product_id);
    
    onApproveOpen();
  };

  const openRejectModal = (request: MaterialRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    onRejectOpen();
  };

  const openViewModal = (request: MaterialRequest) => {
    setSelectedRequest(request);
    onViewOpen();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'green';
      case 'MEDIUM': return 'blue';
      case 'HIGH': return 'orange';
      case 'URGENT': return 'red';
      default: return 'gray';
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'În așteptare';
      case 'APPROVED': return 'Aprobată';
      case 'REJECTED': return 'Respină';
      case 'FULFILLED': return 'Onorată';
      case 'CANCELLED': return 'Anulată';
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'Scăzută';
      case 'MEDIUM': return 'Medie';
      case 'HIGH': return 'Ridicată';
      case 'URGENT': return 'Urgentă';
      default: return priority;
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (activeTab === 1) return request.status === 'PENDING';
    if (activeTab === 2) return request.status === 'APPROVED';
    if (activeTab === 3) return request.status === 'REJECTED';
    return true;
  });

  const tableRowHoverBg = useColorModeValue('gray.50', 'whiteAlpha.50');

  const renderRequestsTable = () => (
    filteredRequests.length === 0 ? (
      <Alert status="info" borderRadius="lg">
        <AlertIcon />
        <AlertTitle>Nicio cerere în această categorie</AlertTitle>
        <AlertDescription>
          Nu există cereri de materiale pentru filtrul selectat.
        </AlertDescription>
      </Alert>
    ) : (
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Nr. Cerere</Th>
            <Th>Produs</Th>
            <Th>Cantitate</Th>
            <Th>Prioritate</Th>
            <Th>Status</Th>
            <Th>Solicitant</Th>
            <Th>Data</Th>
            <Th>Acțiuni</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredRequests.map((request) => (
            <Tr key={request.id} _hover={{ bg: tableRowHoverBg }}>
              <Td>
                <Text fontWeight="semibold" fontSize="sm">
                  {request.request_number}
                </Text>
              </Td>
              <Td>
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold">{request.product_name}</Text>
                  <Text fontSize="sm" color={mutedTextColor}>
                    {request.supplier_name || '—'}
                  </Text>
                </VStack>
              </Td>
              <Td>
                <Text fontWeight="bold">{request.quantity_requested}</Text>
                <Text fontSize="sm" color={mutedTextColor}>
                  {request.product_unit}
                </Text>
              </Td>
              <Td>
                <Badge colorScheme={getPriorityColor(request.priority)}>
                  {getPriorityText(request.priority)}
                </Badge>
              </Td>
              <Td>
                <Badge colorScheme={getStatusColor(request.status)}>
                  {getStatusText(request.status)}
                </Badge>
              </Td>
              <Td>
                <Text fontSize="sm">
                  {request.requester_first_name} {request.requester_last_name}
                </Text>
              </Td>
              <Td>
                <Text fontSize="sm">
                  {new Date(request.created_at).toLocaleDateString('ro-RO')}
                </Text>
              </Td>
              <Td>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Icon as={FiEye} />}
                    onClick={() => openViewModal(request)}
                  >
                    Vezi
                  </Button>
                  {request.status === 'PENDING' && (user?.roles?.includes('INSPECTOR') || user?.roles?.includes('SUPER_ADMIN') || user?.roles?.includes('DEPARTMENT_ADMIN') || user?.roles?.includes('ADMIN') || user?.roles?.includes('WAREHOUSE_KEEPER')) && (
                    <>
                      <Button
                        size="sm"
                        colorScheme="green"
                        leftIcon={<Icon as={FiCheck} />}
                        onClick={() => openApproveModal(request)}
                      >
                        Aprobă
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        leftIcon={<Icon as={FiX} />}
                        onClick={() => openRejectModal(request)}
                      >
                        Respinge
                      </Button>
                    </>
                  )}
                  {request.status === 'APPROVED' && request.transport_event_id && (
                    <Button
                      size="sm"
                      colorScheme="teal"
                      variant="outline"
                      leftIcon={<Icon as={FiTruck} />}
                      onClick={() => navigate(`/user/calendar?event=${request.transport_event_id}`)}
                      title="Vezi evenimentul de transport în calendar"
                    >
                      Transport
                    </Button>
                  )}
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    )
  );

  if (loading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Se încarcă cererile...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={6}>
      <Container maxW="7xl">
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2} color={textColor}>
              <Icon as={FiPackage} mr={3} />
              Cereri de Materiale
            </Heading>
            <Text color={mutedTextColor}>
              Gestionează cererile de materiale de la magazioneri
            </Text>
          </Box>

          {/* Statistici */}
          <HStack spacing={4}>
            <Card bg={cardBgColor}>
              <CardBody>
                <Text fontSize="sm" color={mutedTextColor}>Total Cereri</Text>
                <Text fontSize="2xl" fontWeight="bold">{requests.length}</Text>
              </CardBody>
            </Card>
            <Card bg={cardBgColor}>
              <CardBody>
                <Text fontSize="sm" color={mutedTextColor}>În Așteptare</Text>
                <Text fontSize="2xl" fontWeight="bold" color="yellow.500">
                  {requests.filter(r => r.status === 'PENDING').length}
                </Text>
              </CardBody>
            </Card>
            <Card bg={cardBgColor}>
              <CardBody>
                <Text fontSize="sm" color={mutedTextColor}>Aprobate</Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {requests.filter(r => r.status === 'APPROVED').length}
                </Text>
              </CardBody>
            </Card>
          </HStack>

          {/* Lista cererilor */}
          <Card bg={bgColor} borderRadius="xl" overflow="hidden" boxShadow="lg">
            <CardHeader pb={0}>
              <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" colorScheme="blue">
                <TabList flexWrap="wrap">
                  <Tab>Toate ({requests.length})</Tab>
                  <Tab>În așteptare ({requests.filter(r => r.status === 'PENDING').length})</Tab>
                  <Tab>Aprobate ({requests.filter(r => r.status === 'APPROVED').length})</Tab>
                  <Tab>Respinse ({requests.filter(r => r.status === 'REJECTED').length})</Tab>
                </TabList>
              </Tabs>
            </CardHeader>
            <CardBody pt={4}>
              {requests.length === 0 ? (
                <Alert status="info" borderRadius="lg">
                  <AlertIcon />
                  <AlertTitle>Nicio cerere de materiale!</AlertTitle>
                  <AlertDescription>
                    Nu există cereri de materiale în sistem.
                  </AlertDescription>
                </Alert>
              ) : (
                renderRequestsTable()
              )}
            </CardBody>
          </Card>
        </VStack>
      </Container>

      {/* Modal pentru vizualizare cerere */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl" isCentered>
        <ModalOverlay backdropFilter="blur(8px)" />
        <ModalContent borderRadius="2xl" overflow="hidden" boxShadow="2xl">
          <Box
            bgGradient="linear(135deg, orange.400 0%, pink.500 100%)"
            px={6}
            py={6}
            color="white"
            position="relative"
          >
            <HStack spacing={3}>
              <Icon as={FiPackage} boxSize={6} />
              <VStack align="start" spacing={0}>
                <Text fontSize="xl" fontWeight="bold">Cerere materiale</Text>
                <Text fontSize="sm" opacity={0.9}>{selectedRequest?.request_number}</Text>
              </VStack>
            </HStack>
            <ModalCloseButton color="white" _hover={{ bg: 'whiteAlpha.200' }} />
          </Box>
          <ModalBody p={6}>
            {selectedRequest && (
              <VStack spacing={5} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Stat p={4} bg={cardBgColor} borderRadius="xl">
                    <StatLabel>Produs</StatLabel>
                    <StatNumber fontSize="lg">{selectedRequest.product_name}</StatNumber>
                    <StatHelpText>{selectedRequest.supplier_name || 'Fără furnizor'}</StatHelpText>
                  </Stat>
                  <Stat p={4} bg={cardBgColor} borderRadius="xl">
                    <StatLabel>Cantitate cerută</StatLabel>
                    <StatNumber fontSize="lg">{selectedRequest.quantity_requested}</StatNumber>
                    <StatHelpText>{selectedRequest.product_unit}</StatHelpText>
                  </Stat>
                  <Stat p={4} bg={cardBgColor} borderRadius="xl">
                    <StatLabel>Prioritate</StatLabel>
                    <StatNumber fontSize="md">
                      <Badge colorScheme={getPriorityColor(selectedRequest.priority)} px={3} py={1}>
                        {getPriorityText(selectedRequest.priority)}
                      </Badge>
                    </StatNumber>
                  </Stat>
                  <Stat p={4} bg={cardBgColor} borderRadius="xl">
                    <StatLabel>Status</StatLabel>
                    <StatNumber fontSize="md">
                      <Badge colorScheme={getStatusColor(selectedRequest.status)} px={3} py={1}>
                        {getStatusText(selectedRequest.status)}
                      </Badge>
                    </StatNumber>
                  </Stat>
                </SimpleGrid>

                <Box p={4} bg={cardBgColor} borderRadius="xl">
                  <Text fontSize="sm" color={mutedTextColor} mb={1}>Solicitant</Text>
                  <Text fontWeight="semibold">
                    {selectedRequest.requester_first_name} {selectedRequest.requester_last_name}
                  </Text>
                  <Text fontSize="sm" color={mutedTextColor} mt={3}>
                    {new Date(selectedRequest.created_at).toLocaleString('ro-RO')}
                  </Text>
                </Box>

                <Box p={4} bg={cardBgColor} borderRadius="xl">
                  <Text fontSize="sm" color={mutedTextColor} mb={2}>Motivul cererii</Text>
                  <Text>{selectedRequest.reason || '—'}</Text>
                </Box>

                {selectedRequest.quantity_approved > 0 && (
                  <Alert status="success" borderRadius="lg">
                    <AlertIcon />
                    <Text>Aprobată: {selectedRequest.quantity_approved} {selectedRequest.product_unit}</Text>
                  </Alert>
                )}

                {selectedRequest.rejection_reason && (
                  <Alert status="error" borderRadius="lg">
                    <AlertIcon />
                    <Text>{selectedRequest.rejection_reason}</Text>
                  </Alert>
                )}

                {selectedRequest.transport_event_id && (
                  <Button
                    colorScheme="teal"
                    leftIcon={<Icon as={FiCalendar} />}
                    onClick={() => {
                      onViewClose();
                      navigate(`/user/calendar?event=${selectedRequest.transport_event_id}`);
                    }}
                  >
                    Vezi eveniment transport în calendar
                  </Button>
                )}

                {selectedRequest.status === 'PENDING' && (user?.roles?.includes('INSPECTOR') || user?.roles?.includes('SUPER_ADMIN') || user?.roles?.includes('DEPARTMENT_ADMIN') || user?.roles?.includes('ADMIN') || user?.roles?.includes('WAREHOUSE_KEEPER')) && (
                  <>
                    <Divider />
                    <HStack spacing={3}>
                      <Button
                        flex={1}
                        colorScheme="green"
                        leftIcon={<Icon as={FiCheck} />}
                        onClick={() => {
                          onViewClose();
                          openApproveModal(selectedRequest);
                        }}
                      >
                        Aprobă
                      </Button>
                      <Button
                        flex={1}
                        colorScheme="red"
                        variant="outline"
                        leftIcon={<Icon as={FiX} />}
                        onClick={() => {
                          onViewClose();
                          openRejectModal(selectedRequest);
                        }}
                      >
                        Respinge
                      </Button>
                    </HStack>
                  </>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter bg={cardBgColor}>
            <Button variant="ghost" onClick={onViewClose}>Închide</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal pentru aprobare - Redesign cu crearea evenimentului de transport */}
      <Modal isOpen={isApproveOpen} onClose={onApproveClose} size="lg" isCentered scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(8px)" />
        <ModalContent maxH="90vh" mx={4}>
          <ModalHeader>
            <HStack>
              <Icon as={FiCheck} color="green.500" />
              <Text>Aprobă Cerere și Creează Eveniment Transport</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedRequest && (
              <VStack spacing={6} align="stretch">
                {/* Informații despre cerere */}
                <Box p={4} bg={cardBgColor} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                  <VStack spacing={3} align="stretch">
                    <HStack>
                      <Icon as={FiPackage} color="blue.500" />
                      <Text fontWeight="bold" fontSize="lg">{selectedRequest.product_name}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color={mutedTextColor}>
                        Cantitate cerută: <strong>{selectedRequest.quantity_requested} {selectedRequest.product_unit}</strong>
                      </Text>
                      <Badge colorScheme={getPriorityColor(selectedRequest.priority)}>
                        {getPriorityText(selectedRequest.priority)}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color={mutedTextColor}>
                      Solicitant: {selectedRequest.requester_first_name} {selectedRequest.requester_last_name}
                    </Text>
                  </VStack>
                </Box>

                <Divider />

                {/* Secțiunea pentru crearea evenimentului de transport */}
                <Box>
                  <HStack mb={4}>
                    <Icon as={FiTruck} color="green.500" />
                    <Text fontWeight="bold" fontSize="lg">Detalii Eveniment Transport</Text>
                  </HStack>
                  
                  <VStack spacing={4} align="stretch">
                    {/* Data evenimentului */}
                    <FormControl isRequired>
                      <FormLabel>
                        <HStack>
                          <Icon as={FiCalendar} />
                          <Text>Data Evenimentului</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        type="date"
                        value={transportDate}
                        onChange={(e) => setTransportDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </FormControl>

                    {/* Furnizor */}
                    <FormControl isRequired>
                      <FormLabel>Furnizor</FormLabel>
                      {loadingSuppliers ? (
                        <HStack>
                          <Spinner size="sm" />
                          <Text fontSize="sm">Se încarcă furnizorii...</Text>
                        </HStack>
                      ) : (
                        <Select
                          value={selectedSupplier}
                          onChange={(e) => setSelectedSupplier(e.target.value)}
                          placeholder="Selectează furnizorul"
                        >
                          {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name} - {supplier.contact_person} ({supplier.email})
                            </option>
                          ))}
                        </Select>
                      )}
                      {suppliers.length === 0 && !loadingSuppliers && (
                        <Text fontSize="sm" color="orange.500">
                          Nu există furnizori disponibili pentru acest produs
                        </Text>
                      )}
                    </FormControl>

                    {/* Cantitatea aprobată — fixă, egală cu cererea */}
                    <FormControl>
                      <FormLabel color={mutedTextColor}>Cantitate Aprobată</FormLabel>
                      <Input
                        value={`${selectedRequest.quantity_requested} ${selectedRequest.product_unit}`}
                        isReadOnly
                        bg={readonlyInputBg}
                        color={readonlyInputColor}
                        cursor="not-allowed"
                        borderColor={readonlyInputBorder}
                        _focus={{ borderColor: readonlyInputBorder, boxShadow: 'none' }}
                      />
                      <Text fontSize="xs" color={mutedTextColor}>
                        Cantitatea aprobată este aceeași cu cea solicitată și nu poate fi modificată.
                      </Text>
                    </FormControl>

                    {/* Comentarii */}
                    <FormControl>
                      <FormLabel>Comentarii pentru aprobare (opțional)</FormLabel>
                      <Textarea
                        value={approvalComments}
                        onChange={(e) => setApprovalComments(e.target.value)}
                        placeholder="Adaugă comentarii pentru aprobare și evenimentul de transport..."
                        rows={3}
                      />
                    </FormControl>
                  </VStack>
                </Box>

                <Divider />

                {/* Butoane de acțiune */}
                <HStack spacing={3} justify="flex-end">
                  <Button variant="outline" onClick={onApproveClose}>
                    Anulează
                  </Button>
                  <Button 
                    colorScheme="green" 
                    color="white"
                    onClick={handleApprove}
                    isDisabled={!transportDate || !selectedSupplier}
                  >
                    <Icon as={FiCheck} mr={2} />
                    Aprobă și Creează Eveniment
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal pentru respingere */}
      <Modal isOpen={isRejectOpen} onClose={onRejectClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Respinge Cerere</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedRequest && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="semibold">{selectedRequest.product_name}</Text>
                  <Text fontSize="sm" color={mutedTextColor}>
                    Cerută: {selectedRequest.quantity_requested} {selectedRequest.product_unit}
                  </Text>
                </Box>
                
                <FormControl>
                  <FormLabel>Motivul Respingerii</FormLabel>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explică motivul respingerii cererii..."
                    rows={4}
                    isRequired
                  />
                </FormControl>
                
                <HStack spacing={3}>
                  <Button colorScheme="red" onClick={handleReject}>
                    <Icon as={FiX} mr={2} />
                    Respinge
                  </Button>
                  <Button variant="outline" onClick={onRejectClose}>
                    Anulează
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
