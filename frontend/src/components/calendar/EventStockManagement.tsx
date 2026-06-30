import {
  Box,
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
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  NumberInput,
  NumberInputField,
  Textarea,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner,
  Center,
  Progress,
  Tooltip,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiPlay,
  FiPackage,
  FiTrendingUp,
  FiTrendingDown,
  FiArrowRight,
  FiMoreVertical,
  FiCheck,
  FiX,
  FiClock,
  FiDollarSign,
  FiLayers,
  FiRefreshCw,
  FiSearch,
  FiBarChart,
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { EventType } from '../../types/calendar';
import { Product } from '../../types/supply';
import { SupplyService } from '../../services/supply/SupplyService';
import { 
  EventStockService, 
  StockOperation, 
  StockTemplate, 
  CreateStockOperationRequest,
  StockOperationStats
} from '../../services/EventStockService';
import { useAuth } from '../../hooks/useAuth';

interface EventStockManagementProps {
  eventId: string | number;
  eventTitle: string;
  eventType: EventType;
  eventDate: string;
  isOpen: boolean;
  onClose: () => void;
  canEdit: boolean;
}

const AVAILABLE_LOCATIONS = [
  'Depozit Principal',
  'Depozit A - Raft 1',
  'Depozit A - Raft 2', 
  'Depozit B - Raft 1',
  'Depozit B - Raft 2',
  'Depozit B - Raft 3',
  'Depozit C - Raft 1',
  'Depozit C - Raft 2',
  'Depozit Medicamente',
  'Depozit EPI',
  'Depozit Chirurgie',
  'Depozit Aparatură',
  'Depozit Materiale',
  'Farmacie',
  'Bloc Operator',
  'Laborator',
  'Urgență',
];

export default function EventStockManagement({
  eventId,
  eventTitle,
  eventType,
  eventDate,
  isOpen,
  onClose,
  canEdit,
}: EventStockManagementProps) {
  const [operations, setOperations] = useState<StockOperation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [templates, setTemplates] = useState<StockTemplate[]>([]);
  const [stats, setStats] = useState<StockOperationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state pentru adăugare operațiune
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [fromLocation, setFromLocation] = useState<string>('');
  const [toLocation, setToLocation] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const { user } = useAuth();
  const toast = useToast();
  const eventStockService = new EventStockService();
  const supplyService = new SupplyService();

  const {
    isOpen: isAddModalOpen,
    onOpen: onAddModalOpen,
    onClose: onAddModalClose,
  } = useDisclosure();

  const {
    isOpen: isTemplateModalOpen,
    onOpen: onTemplateModalOpen,
    onClose: onTemplateModalClose,
  } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, eventId]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadOperations(),
        loadProducts(),
        loadTemplates(),
        loadStats(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca datele pentru operațiunile de stoc',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOperations = async () => {
    try {
      const operationsData = await eventStockService.getEventStockOperations(Number(eventId));
      setOperations(operationsData);
    } catch (error) {
      console.error('Error loading operations:', error);
      throw error;
    }
  };

  const loadProducts = async () => {
    try {
      const productsResponse = await supplyService.getProducts(1, 1000);
      setProducts(productsResponse.data);
    } catch (error) {
      console.error('Error loading products:', error);
      throw error;
    }
  };

  const loadTemplates = async () => {
    try {
      const templatesData = await eventStockService.getStockTemplates(eventType);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await eventStockService.getStockOperationStats(Number(eventId));
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAddOperation = async () => {
    if (!selectedProductId || quantity <= 0) {
      toast({
        title: 'Eroare',
        description: 'Vă rugăm să selectați un produs și o cantitate validă',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSubmitting(true);

      // Mapăm tipul evenimentului la tipul operației
      const operationTypeMap: Record<string, 'RECEPTION' | 'DISTRIBUTION' | 'MOVEMENT' | 'AUDIT'> = {
        'STOCK_RECEPTION': 'RECEPTION',
        'STOCK_DISTRIBUTION': 'DISTRIBUTION',
        'STOCK_MOVEMENT': 'MOVEMENT',
        'INVENTORY_AUDIT': 'AUDIT'
      };

      const operationType = operationTypeMap[eventType];
      if (!operationType) {
        throw new Error('Tip de eveniment invalid pentru operațiuni de stoc');
      }

      const operationData: CreateStockOperationRequest = {
        productId: selectedProductId,
        operationType,
        quantity,
        unitCost: unitCost > 0 ? unitCost : undefined,
        fromLocation: fromLocation || undefined,
        toLocation: toLocation || undefined,
        notes: notes.trim() || undefined,
      };

      await eventStockService.addStockOperationToEvent(Number(eventId), operationData);

      toast({
        title: 'Succes',
        description: 'Operația de stoc a fost adăugată cu succes',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form
      setSelectedProductId(null);
      setQuantity(1);
      setUnitCost(0);
      setFromLocation('');
      setToLocation('');
      setNotes('');

      onAddModalClose();
      await loadData();
    } catch (error: any) {
      console.error('Error adding operation:', error);
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Nu s-a putut adăuga operația de stoc',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessOperation = async (operation: StockOperation) => {
    try {
      setSubmitting(true);

      await eventStockService.processStockOperation(operation.id);

      toast({
        title: 'Succes',
        description: `Operația de ${eventStockService.getOperationTypeLabel(operation.operationType).toLowerCase()} a fost procesată cu succes`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      await loadData();
    } catch (error: any) {
      console.error('Error processing operation:', error);
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Nu s-a putut procesa operația',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveOperation = async (operationId: number) => {
    try {
      await eventStockService.removeStockOperation(operationId);

      toast({
        title: 'Succes',
        description: 'Operația a fost eliminată cu succes',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      await loadData();
    } catch (error: any) {
      console.error('Error removing operation:', error);
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Nu s-a putut elimina operația',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplateId) {
      toast({
        title: 'Eroare',
        description: 'Vă rugăm să selectați un template',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSubmitting(true);

      const result = await eventStockService.applyTemplateToEvent(Number(eventId), selectedTemplateId);

      toast({
        title: 'Template aplicat cu succes',
        description: result.addedItems ? 
          `${result.addedItems} operații adăugate, ${result.skippedItems || 0} omise (existau deja)` :
          'Template aplicat cu succes',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setSelectedTemplateId(null);
      onTemplateModalClose();
      await loadData();
    } catch (error: any) {
      console.error('Error applying template:', error);
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Nu s-a putut aplica template-ul',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getOperationIcon = (operationType: string) => {
    switch (operationType) {
      case 'RECEPTION': return FiTrendingDown;
      case 'DISTRIBUTION': return FiTrendingUp;
      case 'MOVEMENT': return FiArrowRight;
      case 'AUDIT': return FiPackage;
      default: return FiPackage;
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProduct = selectedProductId 
    ? products.find(p => p.id === selectedProductId)
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent borderRadius="xl" maxH="90vh">
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <HStack>
              <Icon as={FiPackage} color="blue.500" />
              <Text>Gestionare Stoc - {eventStockService.getOperationTypeLabel(eventType.replace('STOCK_', '') as any)}</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="blue" px={2} py={1}>
                {eventTitle}
              </Badge>
              <Text fontSize="sm" color="gray.500">
                {new Date(eventDate).toLocaleDateString('ro-RO')}
              </Text>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={6} align="stretch">
            {loading ? (
              <Center py={8}>
                <VStack>
                  <Spinner size="lg" />
                  <Text>Se încarcă datele...</Text>
                </VStack>
              </Center>
            ) : (
              <>
                {/* Statistici */}
                {stats && (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                    <Stat p={4} bg={cardBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                      <StatLabel>
                        <HStack>
                          <Icon as={FiBarChart} color="blue.500" />
                          <Text>Total Operații</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber color="blue.500">{stats.general.total_operations}</StatNumber>
                      <StatHelpText>În acest eveniment</StatHelpText>
                    </Stat>

                    <Stat p={4} bg={cardBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                      <StatLabel>
                        <HStack>
                          <Icon as={FiCheck} color="green.500" />
                          <Text>Completate</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber color="green.500">{stats.general.completed_operations}</StatNumber>
                      <StatHelpText>Procesate cu succes</StatHelpText>
                    </Stat>

                    <Stat p={4} bg={cardBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                      <StatLabel>
                        <HStack>
                          <Icon as={FiClock} color="orange.500" />
                          <Text>În Așteptare</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber color="orange.500">{stats.general.planned_operations}</StatNumber>
                      <StatHelpText>De procesat</StatHelpText>
                    </Stat>

                    <Stat p={4} bg={cardBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                      <StatLabel>
                        <HStack>
                          <Icon as={FiDollarSign} color="purple.500" />
                          <Text>Valoare Totală</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber color="purple.500">
                        {new Intl.NumberFormat('ro-RO', {
                          style: 'currency',
                          currency: 'RON'
                        }).format(stats.general.total_value || 0)}
                      </StatNumber>
                      <StatHelpText>Cost total estimat</StatHelpText>
                    </Stat>
                  </SimpleGrid>
                )}

                {/* Header cu acțiuni */}
                <HStack justify="space-between">
                  <Text fontSize="lg" fontWeight="semibold">
                    Operații de Stoc ({operations.length})
                  </Text>
                  {canEdit && (
                    <HStack>
                      <Button
                        leftIcon={<FiPlus />}
                        colorScheme="blue"
                        onClick={onAddModalOpen}
                        size="sm"
                      >
                        Adaugă Operație
                      </Button>
                      {templates.length > 0 && (
                        <Button
                          leftIcon={<FiLayers />}
                          variant="outline"
                          onClick={onTemplateModalOpen}
                          size="sm"
                        >
                          Template
                        </Button>
                      )}
                      <IconButton
                        aria-label="Reîmprospătează"
                        icon={<FiRefreshCw />}
                        variant="outline"
                        onClick={loadData}
                        size="sm"
                        isLoading={loading}
                      />
                    </HStack>
                  )}
                </HStack>

                {/* Lista operațiilor */}
                {operations.length === 0 ? (
                  <Box
                    p={8}
                    textAlign="center"
                    bg={cardBg}
                    borderRadius="lg"
                    border="2px dashed"
                    borderColor={borderColor}
                  >
                    <Icon as={FiPackage} size={48} color="gray.400" />
                    <Text mt={4} fontSize="lg" fontWeight="semibold" color="gray.500">
                      Nicio operațiune de stoc
                    </Text>
                    <Text color="gray.400">
                      Adăugați operații pentru a gestiona stocurile prin acest eveniment
                    </Text>
                    {canEdit && (
                      <Button
                        mt={4}
                        leftIcon={<FiPlus />}
                        colorScheme="blue"
                        onClick={onAddModalOpen}
                      >
                        Adaugă prima operație
                      </Button>
                    )}
                  </Box>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple" bg={bgColor} borderRadius="lg">
                      <Thead bg={cardBg}>
                        <Tr>
                          <Th>Produs</Th>
                          <Th>Tip Operație</Th>
                          <Th>Cantitate</Th>
                          <Th>Cost Unitar</Th>
                          <Th>Total</Th>
                          <Th>Status</Th>
                          <Th>Locații</Th>
                          {canEdit && <Th>Acțiuni</Th>}
                        </Tr>
                      </Thead>
                      <Tbody>
                        {operations.map((operation) => {
                          const OperationIcon = getOperationIcon(operation.operationType);
                          
                          return (
                            <Tr key={operation.id}>
                              <Td>
                                <VStack align="start" spacing={1}>
                                  <Text fontWeight="semibold">{operation.product.name}</Text>
                                  <Text fontSize="sm" color="gray.500">
                                    {operation.product.code}
                                  </Text>
                                  <Badge colorScheme="purple" size="sm">
                                    Stoc: {operation.product.currentStock} {operation.product.unit}
                                  </Badge>
                                </VStack>
                              </Td>
                              <Td>
                                <Badge
                                  colorScheme={eventStockService.getOperationTypeColor(operation.operationType)}
                                  px={2}
                                  py={1}
                                >
                                  <HStack spacing={1}>
                                    <OperationIcon size={12} />
                                    <Text>{eventStockService.getOperationTypeLabel(operation.operationType)}</Text>
                                  </HStack>
                                </Badge>
                              </Td>
                              <Td>
                                <Text fontWeight="semibold">
                                  {operation.quantity} {operation.product.unit}
                                </Text>
                              </Td>
                              <Td>
                                <Text>
                                  {new Intl.NumberFormat('ro-RO', {
                                    style: 'currency',
                                    currency: 'RON'
                                  }).format(operation.unitCost)}
                                </Text>
                              </Td>
                              <Td>
                                <Text fontWeight="bold" color="green.500">
                                  {new Intl.NumberFormat('ro-RO', {
                                    style: 'currency',
                                    currency: 'RON'
                                  }).format(operation.totalCost)}
                                </Text>
                              </Td>
                              <Td>
                                <Badge
                                  colorScheme={eventStockService.getStatusColor(operation.status)}
                                  px={2}
                                  py={1}
                                >
                                  {eventStockService.getStatusLabel(operation.status)}
                                </Badge>
                              </Td>
                              <Td>
                                <VStack align="start" spacing={1}>
                                  {operation.fromLocation && (
                                    <Text fontSize="sm">
                                      <strong>De la:</strong> {operation.fromLocation}
                                    </Text>
                                  )}
                                  {operation.toLocation && (
                                    <Text fontSize="sm">
                                      <strong>Către:</strong> {operation.toLocation}
                                    </Text>
                                  )}
                                </VStack>
                              </Td>
                              {canEdit && (
                                <Td>
                                  <Menu>
                                    <MenuButton
                                      as={IconButton}
                                      icon={<FiMoreVertical />}
                                      variant="ghost"
                                      size="sm"
                                    />
                                    <MenuList>
                                      {operation.status === 'PLANNED' && (
                                        <MenuItem
                                          icon={<FiPlay />}
                                          onClick={() => handleProcessOperation(operation)}
                                          isDisabled={submitting}
                                        >
                                          Procesează
                                        </MenuItem>
                                      )}
                                      {operation.status === 'PLANNED' && (
                                        <MenuItem
                                          icon={<FiTrash2 />}
                                          color="red.500"
                                          onClick={() => handleRemoveOperation(operation.id)}
                                        >
                                          Elimină
                                        </MenuItem>
                                      )}
                                    </MenuList>
                                  </Menu>
                                </Td>
                              )}
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Închide
          </Button>
        </ModalFooter>
      </ModalContent>

      {/* Modal Adăugare Operație */}
      <Modal isOpen={isAddModalOpen} onClose={onAddModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Icon as={FiPlus} color="blue.500" />
              <Text>Adaugă Operație de Stoc</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Caută Produs</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Caută după nume sau cod..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Produs</FormLabel>
                <Select
                  value={selectedProductId || ''}
                  onChange={(e) => {
                    const productId = e.target.value ? Number(e.target.value) : null;
                    setSelectedProductId(productId);
                    
                    // Auto-completare preț
                    const product = products.find(p => p.id === productId);
                    if (product && product.unit_price) {
                      setUnitCost(product.unit_price);
                    }
                  }}
                  placeholder="Selectați produsul"
                  maxH="200px"
                  overflowY="auto"
                >
                  {filteredProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.code}) - Stoc: {product.current_stock || 0} {product.unit}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {selectedProduct && (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Informații Produs</AlertTitle>
                    <AlertDescription>
                      <VStack align="start" spacing={1} fontSize="sm">
                        <Text><strong>Preț unitar:</strong> {selectedProduct.unit_price?.toFixed(2) || 0} RON/{selectedProduct.unit}</Text>
                        <Text><strong>Stoc actual:</strong> {selectedProduct.current_stock || 0} {selectedProduct.unit}</Text>
                        <Text><strong>Categorie:</strong> {selectedProduct.category_name || 'Necategorizat'}</Text>
                      </VStack>
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Cantitate</FormLabel>
                  <NumberInput
                    value={quantity}
                    onChange={(_, value) => setQuantity(value || 1)}
                    min={1}
                  >
                    <NumberInputField placeholder="1" />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Cost Unitar (RON)</FormLabel>
                  <NumberInput
                    value={unitCost}
                    onChange={(_, value) => setUnitCost(value || 0)}
                    min={0}
                    precision={2}
                  >
                    <NumberInputField placeholder="0.00" />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl>
                  <FormLabel>Locație Sursă</FormLabel>
                  <Select
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    placeholder="Selectați locația"
                  >
                    {AVAILABLE_LOCATIONS.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Locație Destinație</FormLabel>
                  <Select
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    placeholder="Selectați locația"
                  >
                    {AVAILABLE_LOCATIONS.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Observații</FormLabel>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observații pentru această operațiune..."
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddModalClose}>
              Anulare
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleAddOperation}
              isLoading={submitting}
              isDisabled={!selectedProductId || quantity <= 0}
            >
              Adaugă Operație
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Template */}
      {templates.length > 0 && (
        <Modal isOpen={isTemplateModalOpen} onClose={onTemplateModalClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <Icon as={FiLayers} color="purple.500" />
                <Text>Aplică Template</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Template Operații</FormLabel>
                  <Select
                    value={selectedTemplateId || ''}
                    onChange={(e) => setSelectedTemplateId(e.target.value ? Number(e.target.value) : null)}
                    placeholder="Selectați template-ul"
                  >
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.itemsCount} operații)
                      </option>
                    ))}
                  </Select>
                </FormControl>

                {selectedTemplateId && (
                  <Alert status="info">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Template Selectat</AlertTitle>
                      <AlertDescription>
                        {templates.find(t => t.id === selectedTemplateId)?.description}
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onTemplateModalClose}>
                Anulare
              </Button>
              <Button
                colorScheme="purple"
                onClick={handleApplyTemplate}
                isLoading={submitting}
                isDisabled={!selectedTemplateId}
              >
                Aplică Template
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Modal>
  );
} 