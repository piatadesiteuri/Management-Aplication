import {
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Button,
    HStack,
    Icon,
  Badge,
    useColorModeValue,
    Text,
    Flex,
    Input,
    InputGroup,
    InputLeftElement,
  Select,
  IconButton,
    useDisclosure,
    useToast,
  VStack,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
    Progress,
  Tooltip,
  Card,
  CardBody,
  ButtonGroup,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiMinus,
    FiSearch,
  FiFilter,
    FiRefreshCw,
  FiMoreVertical,
  FiPackage,
    FiTrendingUp,
    FiTrendingDown,
  FiAlertTriangle,
  FiCheck,
  FiChevronDown,
  FiBarChart,
  FiActivity,
  FiDollarSign,
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Inventory, StockMovementType, StockStatus } from '../../types/supply';
import { SupplyService } from '../../services/supply/SupplyService';
import StockMovementModal from './StockMovementModal';
import StockHistoryModal from './StockHistoryModal';

const statusColors = {
  OK: 'green',
  LOW: 'orange',
  EMPTY: 'red',
  EXCESS: 'blue',
};

const statusNames = {
  OK: 'Stoc OK',
  LOW: 'Stoc Minim',
  EMPTY: 'Stoc Epuizat',
  EXCESS: 'Stoc Excesiv',
};

export default function InventoryList() {
    const [inventory, setInventory] = useState<Inventory[]>([]);
    const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | undefined>();
  const [movementType, setMovementType] = useState<StockMovementType>('IN');
  const [selectedInventoryForHistory, setSelectedInventoryForHistory] = useState<Inventory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  
  // State pentru referat cerere
  const [requestProduct, setRequestProduct] = useState<Inventory | null>(null);
  const [requestQuantity, setRequestQuantity] = useState<number>(0);
  const [requestReason, setRequestReason] = useState<string>('');
  const [requestPriority, setRequestPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  
  const { user } = useAuth();
    const toast = useToast();
  const supplyService = new SupplyService();

  const {
    isOpen: isMovementModalOpen,
    onOpen: onMovementModalOpen,
    onClose: onMovementModalClose
  } = useDisclosure();

  const {
    isOpen: isHistoryModalOpen,
    onOpen: onHistoryModalOpen,
    onClose: onHistoryModalClose
  } = useDisclosure();
  const {
    isOpen: isRequestOpen,
    onOpen: onRequestOpen,
    onClose: onRequestClose
  } = useDisclosure();

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async (page: number = 1) => {
        try {
            setLoading(true);
      const response = await supplyService.getInventory(page, 10);
      setInventory(response.data);
      setPagination(response.pagination);
      setCurrentPage(page);
        } catch (error) {
            console.error('Error loading inventory:', error);
            toast({
                title: 'Eroare',
        description: 'Nu s-a putut încărca inventarul.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

  const handleCreateRequest = async () => {
    if (!requestProduct || requestQuantity <= 0) return;
    
    try {
      // Creează cererea de materiale
      const requestData = {
        product_id: requestProduct.product?.id,
        quantity_requested: requestQuantity,
        priority: requestPriority,
        reason: requestReason,
        requester_id: user?.id
      };
      
      // TODO: Implementare API call pentru creare cerere
      console.log('Creating material request:', requestData);
      
      // Simulez crearea cererii
      const response = await fetch('/api/material-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        // Trimite notificare inspectorului
        await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
          },
          body: JSON.stringify({
            type: 'MATERIAL_REQUEST',
            message: `📋 Nouă cerere de materiale: ${requestProduct.product?.name || 'N/A'} - Cantitate: ${requestQuantity} ${requestProduct.product?.unit || 'buc'}`,
            priority: requestPriority,
            data: {
              request_id: 'new_request_id',
              product_name: requestProduct.product?.name || 'N/A',
              quantity: requestQuantity,
              requester: user?.first_name + ' ' + user?.last_name
            }
          })
        });
        
        // Reset form
        setRequestProduct(null);
        setRequestQuantity(0);
        setRequestReason('');
        setRequestPriority('MEDIUM');
        onRequestClose();
        
        // Afișează mesaj de succes
        toast({
          title: 'Succes',
          description: 'Cererea a fost creată cu succes! Inspectorul va fi notificat.',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      } else {
        throw new Error('Eroare la crearea cererii');
      }
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut crea cererea. Te rog să încerci din nou.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const getStockStatus = (item: Inventory): StockStatus => {
    const product = item.product;
    if (item.quantity <= 0) return 'EMPTY';
    if (item.quantity <= (product.min_stock || 0)) return 'LOW';
    if (item.quantity >= (product.max_stock || 1000)) return 'EXCESS';
    return 'OK';
    };

    const getStockPercentage = (item: Inventory) => {
    const maxStock = item.product.max_stock || 1000;
    return Math.min((item.quantity / maxStock) * 100, 100);
  };

  const getStockIcon = (status: StockStatus) => {
    switch (status) {
      case 'OK': return FiCheck;
      case 'LOW': return FiAlertTriangle;
      case 'EMPTY': return FiAlertTriangle;
      case 'EXCESS': return FiTrendingUp;
      default: return FiPackage;
    }
    };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter ? item.product.category_name === categoryFilter : true;
    const matchesStatus = statusFilter ? getStockStatus(item) === statusFilter : true;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleStockMovement = (inventoryId: number, type: StockMovementType) => {
    setSelectedInventoryId(inventoryId);
    setMovementType(type);
    onMovementModalOpen();
  };

  const handleMovementSuccess = () => {
    loadInventory(currentPage);
  };

  const handleShowHistory = (item: Inventory) => {
    setSelectedInventoryForHistory(item);
    onHistoryModalOpen();
  };

  const categories = [...new Set(inventory.map(item => item.product.category_name).filter(Boolean))];
  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(item => {
    const status = getStockStatus(item);
    return status === 'LOW' || status === 'EMPTY';
  }).length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.product.unit_price || 0)), 0);
  const excessItems = inventory.filter(item => getStockStatus(item) === 'EXCESS').length;

    return (
    <>
      <Box bg={bgColor} p={6} borderRadius="xl" shadow="xl" border="1px solid" borderColor={borderColor}>
        {/* Header */}
        <Flex justify="space-between" align="center" mb={6}>
          <Text fontSize="2xl" fontWeight="bold">
            Inventar Stoc
                </Text>
                <HStack>
            <Menu>
              <MenuButton as={Button} colorScheme="blue" rightIcon={<Icon as={FiChevronDown} />} size="lg" borderRadius="xl">
                <Icon as={FiPackage} mr={2} />
                Gestionare Stoc
              </MenuButton>
              <MenuList>
                <MenuItem 
                  icon={<Icon as={FiPlus} color="green.500" />}
                  onClick={() => handleStockMovement(0, 'IN')}
                >
                  + Intrare Stoc
                </MenuItem>
                <MenuItem 
                  icon={<Icon as={FiMinus} color="red.500" />}
                  onClick={() => handleStockMovement(0, 'OUT')}
                >
                  - Ieșire Stoc
                </MenuItem>
                <MenuItem 
                  icon={<Icon as={FiAlertTriangle} color="blue.500" />}
                  onClick={onRequestOpen}
                >
                  📋 Referat Cerere
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>

        {/* Statistici */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
          <Stat
            p={4}
            bg={cardBg}
            borderRadius="lg"
            border="1px solid"
            borderColor={borderColor}
          >
            <StatLabel>
              <HStack>
                <Icon as={FiPackage} color="blue.500" />
                <Text>Total Articole</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="blue.500">{totalItems}</StatNumber>
            <StatHelpText>În inventar</StatHelpText>
          </Stat>

          <Stat
            p={4}
            bg={cardBg}
            borderRadius="lg"
            border="1px solid"
            borderColor={borderColor}
          >
            <StatLabel>
              <HStack>
                <Icon as={FiAlertTriangle} color="orange.500" />
                <Text>Stoc Critic</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="orange.500">{lowStockItems}</StatNumber>
            <StatHelpText>Necesită atenție</StatHelpText>
          </Stat>

          <Stat
            p={4}
            bg={cardBg}
            borderRadius="lg"
            border="1px solid"
            borderColor={borderColor}
          >
            <StatLabel>
              <HStack>
                <Icon as={FiDollarSign} color="green.500" />
                <Text>Valoare Totală</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="green.500">
              {new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(totalValue)}
            </StatNumber>
            <StatHelpText>Valoare inventar</StatHelpText>
          </Stat>

          <Stat
            p={4}
            bg={cardBg}
            borderRadius="lg"
            border="1px solid"
            borderColor={borderColor}
          >
            <StatLabel>
              <HStack>
                <Icon as={FiTrendingUp} color="purple.500" />
                <Text>Stoc Excesiv</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="purple.500">{excessItems}</StatNumber>
            <StatHelpText>Peste limita maximă</StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Filtre */}
        <Flex gap={4} mb={6}>
          <InputGroup size="lg" flex={1}>
                        <InputLeftElement pointerEvents="none">
                            <Icon as={FiSearch} color="gray.400" />
                        </InputLeftElement>
                        <Input
              placeholder="Caută după nume, cod sau locație..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="lg"
              borderRadius="xl"
                        />
                    </InputGroup>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            size="lg"
            borderRadius="xl"
            w="200px"
          >
            <option value="">Toate categoriile</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="lg"
            borderRadius="xl"
            w="150px"
          >
            <option value="">Toate statusurile</option>
            {Object.entries(statusNames).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <IconButton
            aria-label="Reîmprospătează"
            icon={<FiRefreshCw />}
            size="lg"
            borderRadius="xl"
            onClick={() => loadInventory(currentPage)}
                        isLoading={loading}
          />
            </Flex>

        {/* Tabel Inventar */}
        <Box overflowX="auto">
          {filteredInventory.length === 0 ? (
            <Box
              p={8}
              textAlign="center"
              bg={cardBg}
              borderRadius="lg"
              border="2px dashed"
              borderColor={borderColor}
            >
              <FiPackage size={48} color="gray" />
              <Text mt={4} fontSize="lg" color={textColor}>
                Niciun articol găsit
              </Text>
              <Text color={textColor}>
                {searchTerm || categoryFilter || statusFilter
                  ? 'Încercați să modificați criteriile de căutare'
                  : 'Inventarul este gol'
                }
              </Text>
            </Box>
          ) : (
            <Table variant="simple" bg={bgColor} borderRadius="lg" overflow="hidden">
              <Thead bg={cardBg}>
                <Tr>
                  <Th>Produs</Th>
                        <Th>Categorie</Th>
                  <Th>Stoc Curent</Th>
                        <Th>Status</Th>
                  <Th>Valoare</Th>
                  <Th>Locație</Th>
                  <Th>Ultima Actualizare</Th>
                        <Th>Acțiuni</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {filteredInventory.map((item) => {
                        const stockStatus = getStockStatus(item);
                        const stockPercentage = getStockPercentage(item);
                  const StatusIcon = getStockIcon(stockStatus);
                  
                        return (
                    <Tr
                      key={item.id}
                      _hover={{ bg: hoverBg }}
                      transition="background-color 0.2s"
                    >
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold">{item.product.name}</Text>
                          <Text fontSize="sm" color={textColor}>
                            {item.product.code}
                          </Text>
                        </VStack>
                                </Td>
                                <Td>
                        <Badge colorScheme="purple" px={2} py={1}>
                          {item.product.category_name || 'Necategorizat'}
                                    </Badge>
                                </Td>
                                <Td>
                        <VStack align="start" spacing={2}>
                          <Text fontWeight="semibold">
                            {item.quantity} {item.product.unit}
                          </Text>
                                    <Progress
                                        value={stockPercentage}
                                        size="sm"
                            colorScheme={statusColors[stockStatus]}
                            w="100px"
                          />
                          <Text fontSize="xs" color={textColor}>
                            Min: {item.product.min_stock || 0} | Max: {item.product.max_stock || 1000}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={statusColors[stockStatus]}
                          px={2}
                          py={1}
                                        borderRadius="full"
                        >
                          <HStack spacing={1}>
                            <StatusIcon size={12} />
                            <Text>{statusNames[stockStatus]}</Text>
                          </HStack>
                        </Badge>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="semibold">
                            {new Intl.NumberFormat('ro-RO', {
                              style: 'currency',
                              currency: 'RON'
                            }).format(item.totalValue || (item.quantity * (item.unitCost || item.product.unit_price || 0)))}
                          </Text>
                          <Text fontSize="xs" color={textColor}>
                            {new Intl.NumberFormat('ro-RO', {
                              style: 'currency',
                              currency: 'RON'
                            }).format(item.unitCost || item.product.unit_price || 0)} / {item.product.unit}
                          </Text>
                          {item.unitCost && item.product.unit_price && item.unitCost !== item.product.unit_price && (
                            <Text fontSize="xs" color="orange.500">
                              (Preț bază: {new Intl.NumberFormat('ro-RO', {
                                style: 'currency',
                                currency: 'RON'
                              }).format(item.product.unit_price)} / {item.product.unit})
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          {item.locationCount && item.locationCount > 1 ? (
                            <>
                              <Badge colorScheme="blue" size="sm">
                                {item.locationCount} locații
                              </Badge>
                              <VStack align="start" spacing={0}>
                                {item.locationDetails?.slice(0, 2).map((detail, index) => (
                                  <Text key={index} fontSize="xs" color={textColor}>
                                    {detail.location}: {detail.quantity} {item.product.unit}
                                  </Text>
                                ))}
                                {item.locationDetails && item.locationDetails.length > 2 && (
                                  <Text fontSize="xs" color="blue.500">
                                    +{item.locationDetails.length - 2} mai multe...
                                  </Text>
                                )}
                              </VStack>
                            </>
                          ) : (
                            <Text fontSize="sm">{item.location || 'Depozit Principal'}</Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color={textColor}>
                          {new Date(item.lastUpdated).toLocaleDateString('ro-RO')}
                        </Text>
                                </Td>
                                <Td>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<FiMoreVertical />}
                            variant="ghost"
                                        size="sm"
                          />
                          <MenuList>
                            <MenuItem
                              icon={<FiPlus />}
                              onClick={() => handleStockMovement(item.id, 'IN')}
                              color="green.500"
                            >
                              Intrare Stoc
                            </MenuItem>
                            <MenuItem
                              icon={<FiMinus />}
                              onClick={() => handleStockMovement(item.id, 'OUT')}
                              color="red.500"
                            >
                              Ieșire Stoc
                            </MenuItem>
                            <MenuItem
                              icon={<FiActivity />}
                              onClick={() => handleShowHistory(item)}
                                    >
                              Istoric Mișcări
                            </MenuItem>
                          </MenuList>
                        </Menu>
                                </Td>
                            </Tr>
                        );
                    })}
                </Tbody>
            </Table>
            )}
        </Box>

        {/* Paginare */}
        {pagination && pagination.totalPages > 1 && (
          <Flex justify="center" align="center" mt={6} gap={4}>
            <Button
              onClick={() => loadInventory(currentPage - 1)}
              isDisabled={!pagination.hasPrev}
              variant="outline"
            >
              Anterior
            </Button>
            
            <ButtonGroup isAttached variant="outline">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  onClick={() => loadInventory(page)}
                  colorScheme={page === currentPage ? "brand" : "gray"}
                  variant={page === currentPage ? "solid" : "outline"}
                >
                  {page}
                </Button>
              ))}
            </ButtonGroup>

            <Button
              onClick={() => loadInventory(currentPage + 1)}
              isDisabled={!pagination.hasNext}
              variant="outline"
            >
              Următorul
            </Button>
            
            <Text fontSize="sm" color={textColor}>
              Pagina {pagination.page} din {pagination.totalPages} ({pagination.total} înregistrări)
            </Text>
          </Flex>
        )}
      </Box>

      {/* Modal Mișcare Stoc */}
      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={onMovementModalClose}
        movementType={movementType}
        inventoryId={selectedInventoryId}
        onSuccess={handleMovementSuccess}
      />

      {/* Modal Istoric Stoc */}
      {selectedInventoryForHistory && (
        <StockHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={onHistoryModalClose}
          inventoryId={selectedInventoryForHistory.id}
          productName={selectedInventoryForHistory.product.name}
          productCode={selectedInventoryForHistory.product.code}
          productUnit={selectedInventoryForHistory.product.unit}
          currentStock={selectedInventoryForHistory.quantity}
        />
      )}

      {/* Modal pentru referat cerere */}
      <Modal isOpen={isRequestOpen} onClose={onRequestClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>📋 Referat Cerere Materiale</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Selectează Produs</FormLabel>
                <Select 
                  placeholder="Alege produsul pentru care faci cererea..."
                  value={requestProduct?.id || ''}
                  onChange={(e) => {
                    const productId = parseInt(e.target.value);
                    const product = inventory.find(p => p.id === productId);
                    setRequestProduct(product || null);
                  }}
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.product?.name || 'N/A'} - Stoc curent: {item.quantity} {item.product?.unit || 'buc'}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {requestProduct && (
                <>
                  <Box p={4} bg={cardBg} borderRadius="md">
                    <Text fontWeight="semibold" fontSize="lg" mb={2}>
                      {requestProduct.product?.name || 'N/A'}
                    </Text>
                    <Text fontSize="md" color="blue.500" fontWeight="medium">
                      📦 Stoc curent: {requestProduct.quantity} {requestProduct.product?.unit || 'buc'}
                    </Text>
                    <Text fontSize="sm" color={textColor} mt={1}>
                      Stoc minim: {requestProduct.product?.min_stock || 0} {requestProduct.product?.unit || 'buc'}
                    </Text>
                  </Box>

                  <FormControl>
                    <FormLabel>Cantitate Cerută</FormLabel>
                    <NumberInput
                      value={requestQuantity}
                      onChange={(valueString) => setRequestQuantity(parseInt(valueString) || 0)}
                      min={1}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Prioritate</FormLabel>
                    <Select 
                      value={requestPriority} 
                      onChange={(e) => setRequestPriority(e.target.value as any)}
                    >
                      <option value="LOW">Scăzută</option>
                      <option value="MEDIUM">Medie</option>
                      <option value="HIGH">Ridicată</option>
                      <option value="URGENT">Urgentă</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Motivul Cererii</FormLabel>
                    <Textarea
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      placeholder="Descrie motivul pentru care ai nevoie de acest produs..."
                      rows={3}
                    />
                  </FormControl>

                  <HStack spacing={3}>
                    <Button colorScheme="blue" onClick={handleCreateRequest}>
                      📋 Creează Cerere
                    </Button>
                    <Button variant="outline" onClick={onRequestClose}>
                      Anulează
                    </Button>
                  </HStack>
                </>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
    );
} 