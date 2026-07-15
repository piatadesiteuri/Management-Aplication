import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  useColorModeValue,
  Table,
  Tbody,
  Tr,
  Td,
  Th,
  Thead,
  TableContainer,
  Spinner,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  IconButton,
  Tooltip,
  SimpleGrid,
  Icon,
  useDisclosure,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  Textarea,
  Select,
  Input
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { 
  FiTruck, 
  FiPackage, 
  FiCheckCircle, 
  FiXCircle, 
  FiEye, 
  FiEdit3,
  FiCalendar, 
  FiUser, 
  FiMapPin,
  FiDollarSign,
  FiClock,
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiFileText
} from 'react-icons/fi';
import { SupplyService } from '../../services/supply/SupplyService';
import { useAuth } from '../../hooks/useAuth';
import NirDocument from './NirDocument';

interface TransportOrder {
  id: number;
  event_id: number;
  event_title: string;
  supplier_name: string;
  supplier_email: string;
  supplier_phone: string;
  product_name: string;
  product_code: string;
  product_unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  expected_delivery_date: string;
  created_at: string;
  updated_at: string;
  notes: string;
}

interface OrderHistoryItem {
  event_id: number;
  event_title: string;
  supplier_name: string;
  supplier_id: number;
  total_value: number;
  status: string;
  expected_delivery_date: string;
  created_at: string;
  items_count: number;
  last_updated: string;
}

export default function TransportOrdersManagement() {
  const [orders, setOrders] = useState<TransportOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<TransportOrder | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  
  // Modal states
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
  const { isOpen: isFinalizeOpen, onOpen: onFinalizeOpen, onClose: onFinalizeClose } = useDisclosure();
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure();
  const { isOpen: isNirOpen, onOpen: onNirOpen, onClose: onNirClose } = useDisclosure();
  
  // Form states for finalization (cantitatea + prețul REAL primite, folosite și pentru NIR)
  const [receivedItems, setReceivedItems] = useState<{ orderItemId: number; productId: number; receivedQuantity: number; receivedUnitPrice: number }[]>([]);
  const [cancelReason, setCancelReason] = useState('');
  const [nirForm, setNirForm] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    deliveryNoteNumber: '',
    vehicleNumber: '',
    delegateName: '',
    tvaRate: 19,
    commissionMember1: '',
    commissionMember2: '',
    commissionMember3: '',
    receivedByName: '',
    notes: ''
  });

  // Date NIR pentru vizualizare/export (după finalizare sau la cerere pentru comenzi livrate)
  const [nirData, setNirData] = useState<{ event: any; nir: any; items: any[]; supplierName?: string } | null>(null);
  const [loadingNir, setLoadingNir] = useState(false);

  const toast = useToast();
  const supplyService = new SupplyService();
  const { user } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    loadOrders();
  }, [currentPage, selectedStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: 10 };
      if (selectedStatus) {
        params.status = selectedStatus;
      }
      
      const response = await supplyService.getTransportOrders(currentPage, 10);
      console.log('📦 Transport orders loaded:', response);
      setOrders(response.data || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      console.error('❌ Error loading transport orders:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca comenzile de transport',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOrderItems = async (eventId: number) => {
    return loadOrderItemsAndReturn(eventId);
  };

  const loadOrderItemsAndReturn = async (eventId: number): Promise<any[]> => {
    try {
      setLoadingItems(true);
      const items = await supplyService.getTransportOrderItems(eventId);
      console.log('📦 Order items loaded:', items);
      setOrderItems(items);
      return items;
    } catch (error) {
      console.error('❌ Error loading order items:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca elementele comenzii',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return [];
    } finally {
      setLoadingItems(false);
    }
  };

  const handleViewDetails = async (order: TransportOrder) => {
    setSelectedOrder(order);
    await loadOrderItems(order.event_id);
    onDetailsOpen();
  };

  const handleFinalizeOrder = async (order: TransportOrder) => {
    setSelectedOrder(order);
    const items = await loadOrderItemsAndReturn(order.event_id);
    
    // Inițializăm receivedItems cu cantitatea/prețul comandate (gestionarul le poate ajusta)
    const initialReceivedItems = items.map((item: any) => ({
      orderItemId: item.id,
      productId: item.product_id,
      receivedQuantity: Number(item.quantity),
      receivedUnitPrice: Number(item.unit_price || 0)
    }));
    setReceivedItems(initialReceivedItems);
    setNirForm({
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      deliveryNoteNumber: '',
      vehicleNumber: '',
      delegateName: '',
      tvaRate: 19,
      commissionMember1: '',
      commissionMember2: '',
      commissionMember3: '',
      receivedByName: '',
      notes: ''
    });
    
    onFinalizeOpen();
  };

  const handleViewNir = async (order: TransportOrder) => {
    try {
      setLoadingNir(true);
      const response = await supplyService.getTransportOrderNIR(order.event_id);
      setNirData({
        event: response.event,
        nir: response.nir,
        items: response.items,
        supplierName: order.supplier_name
      });
      onNirOpen();
    } catch (error) {
      console.error('❌ Error loading NIR:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut încărca NIR-ul pentru această comandă',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingNir(false);
    }
  };

  const handleCancelOrder = (order: TransportOrder) => {
    setSelectedOrder(order);
    setCancelReason('');
    onCancelOpen();
  };

  const updateOrderStatus = async (orderId: number, status: string, notes?: string) => {
    try {
      await supplyService.updateTransportOrderStatus(orderId, status, notes);
      toast({
        title: 'Succes',
        description: `Statusul comenzii a fost actualizat la ${getStatusText(status)}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadOrders(); // Reîncărcăm lista
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza statusul comenzii',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const finalizeOrder = async () => {
    if (!selectedOrder) return;

    if (!nirForm.receivedByName.trim()) {
      toast({
        title: 'Câmp obligatoriu',
        description: 'Completează numele persoanei care primește în gestiune',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      const response = await supplyService.finalizeTransportOrder(
        selectedOrder.event_id,
        receivedItems,
        {
          invoiceNumber: nirForm.invoiceNumber || undefined,
          invoiceDate: nirForm.invoiceDate || undefined,
          deliveryNoteNumber: nirForm.deliveryNoteNumber || undefined,
          vehicleNumber: nirForm.vehicleNumber || undefined,
          delegateName: nirForm.delegateName || undefined,
          tvaRate: nirForm.tvaRate,
          commissionMembers: [nirForm.commissionMember1, nirForm.commissionMember2, nirForm.commissionMember3].filter(Boolean),
          receivedByName: nirForm.receivedByName,
          notes: nirForm.notes || undefined
        }
      );
      toast({
        title: 'Succes',
        description: `Comanda a fost finalizată, stocul a fost actualizat și NIR ${response.nir?.nir_number || ''} a fost emis`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      onFinalizeClose();
      loadOrders();

      // Deschide automat previzualizarea NIR-ului proaspăt emis
      if (response.nir) {
        setNirData({
          event: { title: selectedOrder.event_title },
          nir: response.nir,
          items: (response.nirLineItems || []).map((li: any) => ({
            product_id: li.product_id,
            product_name: li.product_name,
            product_unit: li.product_unit,
            ordered_quantity: li.ordered_quantity,
            ordered_unit_price: li.ordered_unit_price,
            received_quantity: li.received_quantity,
            received_unit_price: li.received_unit_price
          })),
          supplierName: selectedOrder.supplier_name
        });
        onNirOpen();
      }
    } catch (error) {
      console.error('❌ Error finalizing order:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut finaliza comanda',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const cancelOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      await supplyService.cancelTransportOrder(selectedOrder.id, cancelReason);
      toast({
        title: 'Succes',
        description: 'Comanda a fost anulată',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onCancelClose();
      loadOrders();
    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut anula comanda',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ORDERED': return 'yellow';
      case 'CONFIRMED': return 'blue';
      case 'IN_TRANSIT': return 'orange';
      case 'DELIVERED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ORDERED': return 'Comandat';
      case 'CONFIRMED': return 'Confirmat';
      case 'IN_TRANSIT': return 'În Transport';
      case 'DELIVERED': return 'Livrat';
      case 'CANCELLED': return 'Anulat';
      default: return 'Necunoscut';
    }
  };

  const canFinalize = (order: TransportOrder) => {
    return ['ORDERED', 'CONFIRMED', 'IN_TRANSIT'].includes(order.status);
  };

  const canCancel = (order: TransportOrder) => {
    return ['ORDERED', 'CONFIRMED'].includes(order.status);
  };

  const canViewNir = (order: TransportOrder) => {
    return order.status === 'DELIVERED';
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Card>
        <CardHeader>
          <HStack justify="space-between" align="center">
            <HStack>
              <Icon as={FiTruck} boxSize={6} color="blue.500" />
              <Heading size="lg">Gestionare Comenzi de Transport</Heading>
            </HStack>
            <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
              {orders.length} comenzi
            </Badge>
          </HStack>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardBody>
          <HStack spacing={4}>
            <FormControl maxW="200px">
              <FormLabel fontSize="sm">Status</FormLabel>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                placeholder="Toate statusurile"
                size="sm"
              >
                <option value="ORDERED">Comandat</option>
                <option value="CONFIRMED">Confirmat</option>
                <option value="IN_TRANSIT">În Transport</option>
                <option value="DELIVERED">Livrat</option>
                <option value="CANCELLED">Anulat</option>
              </Select>
            </FormControl>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedStatus('');
                setCurrentPage(1);
              }}
            >
              Resetează Filtrele
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardBody p={0}>
          {loading ? (
            <Flex justify="center" align="center" py={12}>
              <VStack spacing={4}>
                <Spinner size="xl" color="blue.500" thickness="4px" />
                <Text color="gray.500" fontSize="lg">
                  Se încarcă comenzile...
                </Text>
              </VStack>
            </Flex>
          ) : orders.length === 0 ? (
            <Flex justify="center" align="center" py={12} direction="column">
              <Icon as={FiPackage} boxSize={16} color="gray.300" mb={4} />
              <Text fontSize="xl" fontWeight="semibold" color="gray.500" mb={2}>
                Nicio comandă găsită
              </Text>
              <Text fontSize="md" color="gray.400" textAlign="center">
                Nu există comenzi de transport în sistem.
              </Text>
            </Flex>
          ) : (
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Eveniment</Th>
                    <Th>Furnizor</Th>
                    <Th>Produs</Th>
                    <Th>Cantitate</Th>
                    <Th>Total</Th>
                    <Th>Status</Th>
                    <Th>Data Livrare</Th>
                    <Th>Acțiuni</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {orders.map((order) => (
                    <Tr key={order.id}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold" fontSize="sm">
                            {order.event_title}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            ID: {order.event_id}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium" fontSize="sm">
                            {order.supplier_name}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {order.supplier_phone}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium" fontSize="sm">
                            {order.product_name}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {order.product_code}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {order.quantity} {order.product_unit}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontWeight="bold" color="green.600">
                          {order.total_price.toFixed(2)} lei
                        </Text>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={getStatusColor(order.status)}
                          variant="solid"
                          px={2}
                          py={1}
                          borderRadius="full"
                          fontSize="xs"
                        >
                          {getStatusText(order.status)}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {new Date(order.expected_delivery_date).toLocaleDateString('ro-RO')}
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          <Tooltip label="Vezi detalii">
                            <IconButton
                              aria-label="Vezi detalii"
                              icon={<Icon as={FiEye} />}
                              size="sm"
                              variant="outline"
                              colorScheme="blue"
                              onClick={() => handleViewDetails(order)}
                            />
                          </Tooltip>
                          
                          {canFinalize(order) && (
                            <Tooltip label="Finalizează comanda">
                              <IconButton
                                aria-label="Finalizează comanda"
                                icon={<Icon as={FiCheckCircle} />}
                                size="sm"
                                variant="outline"
                                colorScheme="green"
                                onClick={() => handleFinalizeOrder(order)}
                              />
                            </Tooltip>
                          )}
                          
                          {canCancel(order) && (
                            <Tooltip label="Anulează comanda">
                              <IconButton
                                aria-label="Anulează comanda"
                                icon={<Icon as={FiXCircle} />}
                                size="sm"
                                variant="outline"
                                colorScheme="red"
                                onClick={() => handleCancelOrder(order)}
                              />
                            </Tooltip>
                          )}

                          {canViewNir(order) && (
                            <Tooltip label="Vezi / exportă NIR">
                              <IconButton
                                aria-label="Vezi NIR"
                                icon={<Icon as={FiFileText} />}
                                size="sm"
                                variant="outline"
                                colorScheme="purple"
                                isLoading={loadingNir}
                                onClick={() => handleViewNir(order)}
                              />
                            </Tooltip>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardBody>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color="gray.600">
                Pagina {currentPage} din {totalPages}
              </Text>

              <HStack spacing={2}>
                <IconButton
                  aria-label="Prima pagină"
                  icon={<Icon as={FiChevronsLeft} />}
                  size="sm"
                  variant="outline"
                  onClick={goToFirstPage}
                  isDisabled={currentPage === 1}
                  colorScheme="blue"
                />
                <IconButton
                  aria-label="Pagina anterioară"
                  icon={<Icon as={FiChevronLeft} />}
                  size="sm"
                  variant="outline"
                  onClick={goToPreviousPage}
                  isDisabled={currentPage === 1}
                  colorScheme="blue"
                />

                <HStack spacing={1}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNumber}
                        size="sm"
                        variant={currentPage === pageNumber ? "solid" : "outline"}
                        colorScheme="blue"
                        onClick={() => goToPage(pageNumber)}
                        minW="40px"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </HStack>

                <IconButton
                  aria-label="Pagina următoare"
                  icon={<Icon as={FiChevronRight} />}
                  size="sm"
                  variant="outline"
                  onClick={goToNextPage}
                  isDisabled={currentPage === totalPages}
                  colorScheme="blue"
                />
                <IconButton
                  aria-label="Ultima pagină"
                  icon={<Icon as={FiChevronsRight} />}
                  size="sm"
                  variant="outline"
                  onClick={goToLastPage}
                  isDisabled={currentPage === totalPages}
                  colorScheme="blue"
                />
              </HStack>
            </Flex>
          </CardBody>
        </Card>
      )}

      {/* Modal pentru Detalii Comandă */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.600" />
        <ModalContent 
          bg={bgColor} 
          borderRadius="2xl" 
          overflow="hidden"
          shadow="2xl"
          border="1px solid"
          borderColor={borderColor}
        >
          <ModalHeader
            bgGradient="linear(135deg, blue.500, purple.600)"
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
                <Icon as={FiPackage} boxSize={6} />
              </Box>
              <VStack align="start" spacing={1}>
                <Heading size="lg" fontWeight="bold">
                  Detalii Comandă #{selectedOrder?.id}
                </Heading>
                <Text fontSize="md" opacity={0.9}>
                  {selectedOrder?.event_title}
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={6}>
            {selectedOrder && (
              <VStack spacing={6} align="stretch">
                {/* Informații generale */}
                <SimpleGrid columns={2} spacing={6}>
                  <Card>
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <HStack>
                          <Icon as={FiUser} color="blue.500" />
                          <Text fontWeight="semibold">Furnizor</Text>
                        </HStack>
                        <Text>{selectedOrder.supplier_name}</Text>
                        <Text fontSize="sm" color="gray.500">{selectedOrder.supplier_email}</Text>
                        <Text fontSize="sm" color="gray.500">{selectedOrder.supplier_phone}</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  <Card>
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <HStack>
                          <Icon as={FiCalendar} color="green.500" />
                          <Text fontWeight="semibold">Detalii Livrare</Text>
                        </HStack>
                        <Text>Livrare: {new Date(selectedOrder.expected_delivery_date).toLocaleDateString('ro-RO')}</Text>
                        <Text fontSize="sm" color="gray.500">
                          Comandat: {new Date(selectedOrder.created_at).toLocaleDateString('ro-RO')}
                        </Text>
                        <Badge
                          colorScheme={getStatusColor(selectedOrder.status)}
                          variant="solid"
                          px={3}
                          py={1}
                          borderRadius="full"
                        >
                          {getStatusText(selectedOrder.status)}
                        </Badge>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* Elementele comenzii */}
                <Card>
                  <CardHeader>
                    <Heading size="md">Elementele Comenzii</Heading>
                  </CardHeader>
                  <CardBody pt={0}>
                    {loadingItems ? (
                      <Flex justify="center" py={4}>
                        <Spinner size="md" color="blue.500" />
                      </Flex>
                    ) : (
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Produs</Th>
                            <Th>Cod</Th>
                            <Th>Cantitate</Th>
                            <Th>Preț Unitar</Th>
                            <Th>Total</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {orderItems.map((item, index) => (
                            <Tr key={index}>
                              <Td>
                                <VStack align="start" spacing={1}>
                                  <Text fontWeight="semibold">{item.product_name}</Text>
                                  <Text fontSize="xs" color="gray.500">{item.product_code}</Text>
                                </VStack>
                              </Td>
                              <Td>
                                <Text fontSize="sm">{item.product_code}</Text>
                              </Td>
                              <Td>
                                <Text>{item.quantity} {item.product_unit}</Text>
                              </Td>
                              <Td>
                                <Text>{item.unit_price.toFixed(2)} lei</Text>
                              </Td>
                              <Td>
                                <Text fontWeight="bold" color="green.600">
                                  {item.total_price.toFixed(2)} lei
                                </Text>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    )}
                  </CardBody>
                </Card>

                {/* Acțiuni */}
                <HStack justify="space-between">
                  <Button variant="outline" onClick={onDetailsClose}>
                    Închide
                  </Button>
                  
                  <HStack>
                    {canFinalize(selectedOrder) && (
                      <Button
                        colorScheme="green"
                        leftIcon={<Icon as={FiCheckCircle} />}
                        onClick={() => {
                          onDetailsClose();
                          handleFinalizeOrder(selectedOrder);
                        }}
                      >
                        Finalizează Comanda
                      </Button>
                    )}
                    
                    {canCancel(selectedOrder) && (
                      <Button
                        colorScheme="red"
                        leftIcon={<Icon as={FiXCircle} />}
                        onClick={() => {
                          onDetailsClose();
                          handleCancelOrder(selectedOrder);
                        }}
                      >
                        Anulează Comanda
                      </Button>
                    )}

                    {canViewNir(selectedOrder) && (
                      <Button
                        colorScheme="purple"
                        leftIcon={<Icon as={FiFileText} />}
                        onClick={() => {
                          onDetailsClose();
                          handleViewNir(selectedOrder);
                        }}
                      >
                        Vezi NIR
                      </Button>
                    )}
                  </HStack>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal pentru Finalizare Comandă */}
      <Modal isOpen={isFinalizeOpen} onClose={onFinalizeClose} size="2xl">
        <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.600" />
        <ModalContent bg={bgColor} borderRadius="2xl">
          <ModalHeader
            bgGradient="linear(135deg, green.500, teal.600)"
            color="white"
            borderRadius="2xl"
          >
            <HStack>
              <Icon as={FiCheckCircle} boxSize={6} />
              <Text>Finalizează Comanda</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={6}>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Finalizare comandă și emitere NIR</AlertTitle>
                  <AlertDescription>
                    Confirmă cantitatea și prețul REAL primite (conform facturii) pentru fiecare produs. Stocul se actualizează cu aceste valori, iar diferențele față de comandă se consemnează automat pe Nota de Recepție și Constatare de Diferențe (NIR).
                  </AlertDescription>
                </Box>
              </Alert>

              {orderItems.map((item, index) => {
                const received = receivedItems.find(ri => ri.orderItemId === item.id);
                const receivedQuantity = received?.receivedQuantity ?? item.quantity;
                const receivedUnitPrice = received?.receivedUnitPrice ?? item.unit_price;
                const qtyDiffers = Number(receivedQuantity) !== Number(item.quantity);
                const priceDiffers = Number(receivedUnitPrice) !== Number(item.unit_price);

                const updateItem = (field: 'receivedQuantity' | 'receivedUnitPrice', value: number) => {
                  setReceivedItems(prev => prev.map(ri =>
                    ri.orderItemId === item.id ? { ...ri, [field]: value } : ri
                  ));
                };

                return (
                  <Card key={index} variant="outline" borderColor={(qtyDiffers || priceDiffers) ? 'orange.300' : undefined}>
                    <CardBody>
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold">{item.product_name}</Text>
                            <Text fontSize="sm" color="gray.500">
                              Comandat: {item.quantity} {item.product_unit} × {Number(item.unit_price).toFixed(2)} lei
                            </Text>
                          </VStack>
                          <Text fontWeight="bold" color="green.600">
                            {item.total_price.toFixed(2)} lei
                          </Text>
                        </HStack>

                        <HStack spacing={4} align="start">
                          <FormControl>
                            <FormLabel fontSize="sm">Cantitate primită</FormLabel>
                            <NumberInput
                              min={0}
                              value={receivedQuantity}
                              onChange={(valueString) => updateItem('receivedQuantity', parseFloat(valueString) || 0)}
                            >
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">Preț unitar primit (fără TVA)</FormLabel>
                            <NumberInput
                              min={0}
                              precision={2}
                              step={0.1}
                              value={receivedUnitPrice}
                              onChange={(valueString) => updateItem('receivedUnitPrice', parseFloat(valueString) || 0)}
                            >
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </FormControl>
                        </HStack>

                        {(qtyDiffers || priceDiffers) && (
                          <Alert status="warning" borderRadius="md" py={2}>
                            <AlertIcon />
                            <Text fontSize="xs">
                              Diferență față de comandă va fi consemnată pe NIR
                              {qtyDiffers && ` (cantitate: ${item.quantity} → ${receivedQuantity})`}
                              {priceDiffers && ` (preț: ${Number(item.unit_price).toFixed(2)} → ${Number(receivedUnitPrice).toFixed(2)} lei)`}
                            </Text>
                          </Alert>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                );
              })}

              <Card variant="outline" bg={useColorModeValue('gray.50', 'gray.900')}>
                <CardHeader pb={2}>
                  <Heading size="sm">Date recepție (NIR)</Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack spacing={3} align="stretch">
                    <HStack spacing={3}>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Nr. factură</FormLabel>
                        <Input
                          size="sm"
                          value={nirForm.invoiceNumber}
                          onChange={(e) => setNirForm({ ...nirForm, invoiceNumber: e.target.value })}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm">Data facturii</FormLabel>
                        <Input
                          size="sm"
                          type="date"
                          value={nirForm.invoiceDate}
                          onChange={(e) => setNirForm({ ...nirForm, invoiceDate: e.target.value })}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm">Cota TVA (%)</FormLabel>
                        <NumberInput
                          size="sm"
                          min={0}
                          max={100}
                          value={nirForm.tvaRate}
                          onChange={(v) => setNirForm({ ...nirForm, tvaRate: parseFloat(v) || 0 })}
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                    </HStack>
                    <HStack spacing={3}>
                      <FormControl>
                        <FormLabel fontSize="sm">Aviz de însoțire a mărfii</FormLabel>
                        <Input
                          size="sm"
                          value={nirForm.deliveryNoteNumber}
                          onChange={(e) => setNirForm({ ...nirForm, deliveryNoteNumber: e.target.value })}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm">Auto/vagon nr. (opțional)</FormLabel>
                        <Input
                          size="sm"
                          value={nirForm.vehicleNumber}
                          onChange={(e) => setNirForm({ ...nirForm, vehicleNumber: e.target.value })}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm">Delegat (opțional)</FormLabel>
                        <Input
                          size="sm"
                          value={nirForm.delegateName}
                          onChange={(e) => setNirForm({ ...nirForm, delegateName: e.target.value })}
                        />
                      </FormControl>
                    </HStack>
                    <Divider />
                    <Text fontSize="sm" fontWeight="semibold">Comisia de recepție</Text>
                    <HStack spacing={3}>
                      <Input size="sm" placeholder="Membru 1" value={nirForm.commissionMember1} onChange={(e) => setNirForm({ ...nirForm, commissionMember1: e.target.value })} />
                      <Input size="sm" placeholder="Membru 2" value={nirForm.commissionMember2} onChange={(e) => setNirForm({ ...nirForm, commissionMember2: e.target.value })} />
                      <Input size="sm" placeholder="Membru 3" value={nirForm.commissionMember3} onChange={(e) => setNirForm({ ...nirForm, commissionMember3: e.target.value })} />
                    </HStack>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm">Primit în gestiune de (nume)</FormLabel>
                      <Input
                        size="sm"
                        value={nirForm.receivedByName}
                        onChange={(e) => setNirForm({ ...nirForm, receivedByName: e.target.value })}
                        placeholder={user?.name || ''}
                      />
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>

              <HStack justify="space-between" pt={4}>
                <Button variant="outline" onClick={onFinalizeClose}>
                  Anulează
                </Button>
                <Button
                  colorScheme="green"
                  leftIcon={<Icon as={FiCheckCircle} />}
                  onClick={finalizeOrder}
                  isDisabled={!nirForm.invoiceNumber.trim() || !nirForm.receivedByName.trim()}
                >
                  Finalizează, Actualizează Stocul și Emite NIR
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal pentru Anulare Comandă */}
      <Modal isOpen={isCancelOpen} onClose={onCancelClose} size="md">
        <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.600" />
        <ModalContent bg={bgColor} borderRadius="2xl">
          <ModalHeader
            bgGradient="linear(135deg, red.500, orange.600)"
            color="white"
            borderRadius="2xl"
          >
            <HStack>
              <Icon as={FiXCircle} boxSize={6} />
              <Text>Anulează Comanda</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={6}>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <AlertTitle>Atenție!</AlertTitle>
                  <AlertDescription>
                    Această acțiune va anula comanda definitiv. Această operațiune nu poate fi anulată.
                  </AlertDescription>
                </Box>
              </Alert>

              <FormControl>
                <FormLabel>Motivul anulării</FormLabel>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Introduceți motivul anulării comenzii..."
                  rows={3}
                />
              </FormControl>

              <HStack justify="space-between" pt={4}>
                <Button variant="outline" onClick={onCancelClose}>
                  Anulează
                </Button>
                <Button
                  colorScheme="red"
                  leftIcon={<Icon as={FiXCircle} />}
                  onClick={cancelOrder}
                  isDisabled={!cancelReason.trim()}
                >
                  Anulează Comanda
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal pentru vizualizare / export NIR */}
      <Modal isOpen={isNirOpen} onClose={onNirClose} size="6xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.600" />
        <ModalContent bg={bgColor} borderRadius="2xl">
          <ModalHeader
            bgGradient="linear(135deg, purple.500, blue.600)"
            color="white"
            borderRadius="2xl"
          >
            <HStack>
              <Icon as={FiFileText} boxSize={6} />
              <Text>Nota de Recepție și Constatare de Diferențe (NIR)</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={6}>
            {nirData && (
              <NirDocument
                event={nirData.event}
                supplierName={nirData.supplierName}
                nir={nirData.nir}
                items={nirData.items}
                userRoles={user?.roles || []}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
} 