import {
  Box,
  VStack,
  HStack,
  Text,
  FormControl,
  FormLabel,
  Select,
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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Spinner,
  Flex,
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
  TableContainer
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { 
  FiTruck, 
  FiPackage, 
  FiChevronLeft, 
  FiChevronRight, 
  FiChevronsLeft, 
  FiChevronsRight,
  FiCalendar,
  FiUser,
  FiMapPin,
  FiCheckCircle,
  FiClock,
  FiPlus,
  FiTrash2,
  FiX
} from 'react-icons/fi';
import { TransportEventData, SupplierOrderItem } from '../../types/calendar';
import { SupplyService } from '../../services/supply/SupplyService';
import { SupplierProduct } from '../../types/supply';

interface TransportEventFormProps {
  onSubmit: (data: TransportEventData) => void;
  endDate: Date;
  initialData?: TransportEventData; // Pentru editare
  editMode?: boolean; // Pentru a ști dacă suntem în modul edit
}

interface OrderItem {
  productId: number;
  productName: string;
  productCode: string;
  productUnit: string;
  supplierPrice: number;
  quantity: number;
  totalPrice: number;
  currentStock: number;
  minOrderQuantity: number;
  deliveryTime: number;
  unitCode?: string; // Cod UM
  tvaRate?: number; // Rata TVA (default 19%)
}

interface OrderHistoryItem {
  id: number;
  eventId: number;
  eventTitle: string;
  supplierName: string;
  totalValue: number;
  status: string;
  expectedDeliveryDate: string;
  createdAt: string;
  itemsCount: number;
}

export default function TransportEventForm({
  onSubmit,
  endDate,
  initialData,
  editMode = false,
}: TransportEventFormProps) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  
  // Pagination state for products
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // Modal state for order history
  const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onClose: onHistoryClose } = useDisclosure();
  
  // Modal state for adding new products
  const { isOpen: isAddProductsOpen, onOpen: onAddProductsOpen, onClose: onAddProductsClose } = useDisclosure();
  
  // Date comandă
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [orderDate] = useState<Date>(new Date());
  const [tvaRate] = useState<number>(19); // TVA 19%
  
  // State pentru a evita loop-ul infinit
  const [lastSentData, setLastSentData] = useState<string>('');

  const toast = useToast();
  const supplyService = new SupplyService();
  
  // Hook-uri pentru culori - toate la început
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const headerBgColor = useColorModeValue('blue.50', 'blue.900');
  const infoCardBgColor = useColorModeValue('gray.50', 'gray.700');
  const infoCardBorderColor = useColorModeValue('blue.200', 'blue.600');
  const blueBoxBgColor = useColorModeValue('blue.100', 'blue.800');
  const greenBoxBgColor = useColorModeValue('green.100', 'green.800');
  const purpleCardBgColor = useColorModeValue('purple.50', 'purple.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const greenCardBgColor = useColorModeValue('green.50', 'green.900');
  const unselectedItemBgColor = useColorModeValue('white', 'gray.700');
  const unselectedItemBorderColor = useColorModeValue('gray.200', 'gray.600');
  const paginationCardBorderColor = useColorModeValue('gray.200', 'gray.600');
  const tableCardBgColor = useColorModeValue('white', 'gray.700');
  const tableCardBorderColor = useColorModeValue('green.300', 'green.600');
  const tableTheadBgColor = useColorModeValue('gray.100', 'gray.600');
  const totalRowBgColor = useColorModeValue('gray.50', 'gray.600');
  const tvaRowBgColor = useColorModeValue('yellow.50', 'yellow.900');
  const orangeCardBgColor = useColorModeValue('orange.50', 'orange.900');
  const selectedWarehouseBgColor = useColorModeValue('teal.50', 'teal.900');
  const unselectedWarehouseBgColor = useColorModeValue('white', 'gray.700');
  const warehouseAddressColor = useColorModeValue('gray.700', 'gray.300');
  const previewCardBgColor = useColorModeValue('orange.100', 'orange.800');
  const signatureBorderColor = useColorModeValue('gray.300', 'gray.600');

  useEffect(() => {
    loadSuppliers();
    generateOrderNumber();
  }, []);
  
  // Generare număr comandă automat
  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const orderNum = `CMD-${year}${month}${day}-${random}`;
    setOrderNumber(orderNum);
  };

  // Preluăm datele existente pentru editare
  useEffect(() => {
    if (editMode && initialData) {
      console.log('📦 Loading initial data for edit:', initialData);
      
      // Setăm furnizorul
      if (initialData.supplierId) {
        setSelectedSupplierId(initialData.supplierId);
      }
      
      // Setăm depozitul de livrare
      if (initialData.deliveryAddress) {
        setSelectedWarehouse(initialData.deliveryAddress);
      }
      
      // Setăm produsele din comandă - acestea rămân în comandă pentru editare
      if (initialData.orderItems && initialData.orderItems.length > 0) {
        console.log('📦 Setting order items from initial data:', initialData.orderItems);
        
        const mappedOrderItems: OrderItem[] = initialData.orderItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          productCode: '', // Va fi populat când se încarcă produsele
          productUnit: 'buc', // Va fi populat când se încarcă produsele
          supplierPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
          currentStock: 0, // Va fi populat când se încarcă produsele
          minOrderQuantity: 1,
          deliveryTime: 1,
          unitCode: 'BUC',
          tvaRate: tvaRate
        }));
        
        setOrderItems(mappedOrderItems);
        console.log('📦 Mapped order items set:', mappedOrderItems);
      }
    }
  }, [editMode, initialData]);

  useEffect(() => {
    if (selectedSupplierId) {
      loadSupplierProducts(selectedSupplierId);
      setCurrentPage(1); // Reset to first page when supplier changes
      
      // În modul editare, nu resetăm orderItems când se schimbă furnizorul
      // pentru că produsele din comandă trebuie să rămână
      if (!editMode) {
        setOrderItems([]);
      }
    } else {
      setSupplierProducts([]);
      // În modul editare, nu resetăm orderItems când nu e furnizor selectat
      if (!editMode) {
      setOrderItems([]);
    }
    }
  }, [selectedSupplierId, editMode]);

  // Reset pagination when products change
  useEffect(() => {
    setCurrentPage(1);
  }, [supplierProducts]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await supplyService.getSuppliers();
      console.log('🔍 Suppliers response:', response);
      setSuppliers(response.data || response || []);
    } catch (error) {
      console.error('❌ Error loading suppliers:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca furnizorii',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSupplierProducts = async (supplierId: number) => {
    try {
      setLoadingProducts(true);
      console.log('🔍 Loading products for supplier:', supplierId);
      const products = await supplyService.getSupplierProducts(supplierId);
      console.log('📦 Supplier products received:', products);
      console.log('📦 Products length:', products.length);
      console.log('📦 First product structure:', products[0]);
      setSupplierProducts(products);
      
      // Resetează elementele comenzii când se schimbă furnizorul doar dacă nu suntem în modul editare
      if (!editMode) {
      setOrderItems([]);
      }
    } catch (error) {
      console.error('❌ Error loading supplier products:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca produsele furnizorului',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadOrderHistory = async () => {
    try {
      setLoadingHistory(true);
      // Folosim API-ul real pentru istoricul comenzilor
      const history = await supplyService.getTransportOrderHistory(selectedSupplierId || undefined);
      console.log('📦 Order history loaded:', history);
      setOrderHistory(history);
    } catch (error) {
      console.error('❌ Error loading order history:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut încărca istoricul comenzilor',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleProductSelect = (product: SupplierProduct, isSelected: boolean) => {
    if (isSelected) {
      const unitPrice = typeof product.unitPrice === 'string' ? parseFloat(product.unitPrice) : product.unitPrice;
      const minQuantity = product.minOrderQuantity || 1;
      const currentStock = typeof product.product.currentStock === 'string' ? parseInt(product.product.currentStock) : product.product.currentStock;
      
      const newOrderItem: OrderItem = {
        productId: product.product.id,
        productName: product.product.name,
        productCode: product.product.code,
        productUnit: product.product.unit,
        supplierPrice: unitPrice,
        quantity: minQuantity,
        totalPrice: minQuantity * unitPrice,
        currentStock: currentStock,
        minOrderQuantity: minQuantity,
        deliveryTime: product.deliveryTime,
        unitCode: product.product.code.substring(0, 3).toUpperCase(),
        tvaRate: tvaRate
      };
      setOrderItems(prev => [...prev, newOrderItem]);
    } else {
      setOrderItems(prev => prev.filter(item => item.productId !== product.product.id));
    }
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    console.log('🔄 handleQuantityChange called:', { productId, quantity });
    setOrderItems(prev => prev.map(item => 
      item.productId === productId 
        ? { ...item, quantity, totalPrice: quantity * Number(item.supplierPrice) }
        : item
    ));
  };

  const getTotalOrderValue = () => {
    if (!orderItems || orderItems.length === 0) return 0;
    return orderItems.reduce((total, item) => {
      const itemTotal = Number(item.totalPrice || 0);
      return total + itemTotal;
    }, 0);
  };
  
  const getTotalOrderValueWithTVA = () => {
    const subtotal = getTotalOrderValue();
    if (isNaN(subtotal)) return 0;
    return subtotal + (subtotal * tvaRate / 100);
  };
  
  const getTVAAmount = () => {
    return getTotalOrderValue() * tvaRate / 100;
  };

  // Pagination calculations for products
  const totalPages = Math.ceil(supplierProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = supplierProducts.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

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



  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  // Funcție pentru trimiterea datelor de transport către EventModal - fără useCallback pentru a evita loop-ul
  const sendTransportDataToParent = () => {
    console.log('🔄 sendTransportDataToParent called with:', {
      selectedSupplierId,
      selectedWarehouse,
      orderItemsLength: orderItems.length,
      orderItems: orderItems.map(item => ({ id: item.productId, quantity: item.quantity, totalPrice: item.totalPrice }))
    });
    
    if (selectedSupplierId && selectedWarehouse && orderItems.length > 0) {
      const supplier = suppliers.find(s => s.id === selectedSupplierId);
      if (!supplier) return;

      // Funcție pentru formatarea datei în format MySQL (fără timezone)
      const formatDateForMySQL = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      // Convertesc OrderItem[] în SupplierOrderItem[]
      const supplierOrderItems: SupplierOrderItem[] = orderItems.map(item => ({
        id: Date.now() + item.productId, // ID temporar
        productId: item.productId,
        productName: item.productName,
        supplierId: selectedSupplierId,
        supplierName: supplier.name,
        quantity: item.quantity,
        unitPrice: item.supplierPrice,
        totalPrice: item.totalPrice,
        expectedDeliveryDate: formatDateForMySQL(endDate),
        status: 'ORDERED',
        notes: `Comandat în ${item.quantity} ${item.productUnit} - Stoc curent: ${item.currentStock}`
      }));

      const totalValue = orderItems.reduce((total, item) => total + Number(item.totalPrice), 0);

      const transportData: TransportEventData = {
        orderId: initialData?.orderId || Date.now(), // Folosim orderId existent sau generăm unul nou
        supplierId: selectedSupplierId,
        supplierName: supplier.name,
        supplierContact: supplier.email || supplier.phone || '',
        deliveryAddress: selectedWarehouse,
        orderItems: supplierOrderItems,
        totalValue: totalValue,
        expectedDeliveryDate: formatDateForMySQL(endDate),
        deliveryStatus: 'PENDING',
        deliveryNotes: `Comandă de ${orderItems.length} produse pentru livrare pe ${endDate.toLocaleDateString('ro-RO')}`,
        isOverdue: false
      };

      // Verificăm dacă datele s-au schimbat cu adevărat
      const currentDataHash = JSON.stringify({
        supplierId: transportData.supplierId,
        supplierName: transportData.supplierName,
        deliveryAddress: transportData.deliveryAddress,
        orderItems: transportData.orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          totalPrice: item.totalPrice
        })),
        totalValue: transportData.totalValue
      });
      
      if (currentDataHash === lastSentData) {
        console.log('🔄 Data unchanged, skipping send');
        return;
      }

      console.log('🔄 Auto-updating transport data:', {
        orderId: transportData.orderId,
        supplierName: transportData.supplierName,
        orderItemsCount: transportData.orderItems.length,
        totalValue: transportData.totalValue
      });
      
      // Actualizăm hash-ul pentru a evita trimiterea duplicată
      setLastSentData(currentDataHash);
      
      // Trimitem datele automat către EventModal
      onSubmit(transportData);
    }
  };

  // Folosim useEffect doar pentru a trimite datele când se schimbă dependențele
  useEffect(() => {
    // Evităm loop-ul infinit prin verificarea dacă avem toate datele necesare
    if (selectedSupplierId && selectedWarehouse && orderItems.length > 0) {
    sendTransportDataToParent();
    }
  }, [selectedSupplierId, selectedWarehouse, orderItems, suppliers.length, endDate]);

  // Debug log doar pentru probleme majore
  useEffect(() => {
    if (loading && suppliers.length === 0) {
      console.log('🔄 Loading suppliers...');
    }
  }, [loading, suppliers.length]);

  // Safety check pentru debug
  if (loading) {
    return (
      <VStack spacing={6} align="stretch">
        <Box textAlign="center" py={8}>
          <Spinner size="lg" color="blue.500" mr={4} />
          <Text>Se încarcă furnizorii...</Text>
        </Box>
      </VStack>
    );
  }

  if (suppliers.length === 0) {
    return (
      <VStack spacing={6} align="stretch">
        <Alert status="warning">
          <AlertIcon />
          <Box>
            <AlertTitle>Niciun furnizor disponibil!</AlertTitle>
            <AlertDescription>
              Vă rugăm să adăugați furnizori în sistem înainte de a crea comenzi.
            </AlertDescription>
          </Box>
        </Alert>
      </VStack>
    );
  }


  // Depozite disponibile cu adrese
  const AVAILABLE_WAREHOUSES = [
    {
      id: 'depozit-principal',
      name: 'Depozit Principal',
      address: 'Str. Tabaci nr. 7, Craiova, Dolj',
      coordinates: { lat: 44.3191, lng: 23.7967 },
      description: 'Depozitul principal DSP Dolj'
    },
    {
      id: 'depozit-medicamente',
      name: 'Depozit Medicamente',
      address: 'Str. Tabaci nr. 7, Craiova, Dolj',
      coordinates: { lat: 44.3191, lng: 23.7967 },
      description: 'Depozit specializat pentru medicamente'
    },
    {
      id: 'depozit-epi',
      name: 'Depozit EPI',
      address: 'Str. Tabaci nr. 7, Craiova, Dolj',
      coordinates: { lat: 44.3191, lng: 23.7967 },
      description: 'Echipamente de protecție individuală'
    },
    {
      id: 'depozit-chirurgie',
      name: 'Depozit Chirurgie',
      address: 'Str. Tabaci nr. 7, Craiova, Dolj',
      coordinates: { lat: 44.3191, lng: 23.7967 },
      description: 'Materiale și instrumente chirurgicale'
    },
    {
      id: 'depozit-aparatura',
      name: 'Depozit Aparatură',
      address: 'Str. Tabaci nr. 7, Craiova, Dolj',
      coordinates: { lat: 44.3191, lng: 23.7967 },
      description: 'Aparatură medicală și diagnostic'
    },
    {
      id: 'depozit-materiale',
      name: 'Depozit Materiale',
      address: 'Str. Tabaci nr. 7, Craiova, Dolj',
      coordinates: { lat: 44.3191, lng: 23.7967 },
      description: 'Materiale sanitare și consumabile'
    },
    {
      id: 'farmacie',
      name: 'Farmacie DSP',
      address: 'Str. Tabaci nr. 7, Craiova, Dolj',
      coordinates: { lat: 44.3191, lng: 23.7967 },
      description: 'Farmacia DSP Dolj'
    },
    {
      id: 'laborator',
      name: 'Laborator',
      address: 'Str. Tabaci nr. 7, Craiova, Dolj',
      coordinates: { lat: 44.3191, lng: 23.7967 },
      description: 'Laboratorul DSP Dolj'
    },
    {
      id: 'urgenta',
      name: 'Urgență',
      address: 'Str. Tabaci nr. 7, Craiova, Dolj',
      coordinates: { lat: 44.3191, lng: 23.7967 },
      description: 'Secția de urgență'
    }
  ];



  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Card bg={cardBgColor} shadow="md">
        <CardBody>
          <VStack spacing={4} align="stretch">
            {/* Titlu și control */}
          <HStack justify="space-between" align="center">
            <HStack>
                <Icon as={FiTruck} boxSize={6} color="blue.500" />
                <Heading size="lg" color="blue.600">COMANDĂ APROVIZIONARE</Heading>
            </HStack>
            <HStack spacing={3}>
              <Tooltip label="Istoricul comenzilor">
                <IconButton
                  aria-label="Istoric comenzi"
                  icon={<Icon as={FiClock} />}
                  size="sm"
                  variant="outline"
                  colorScheme="purple"
                  onClick={() => {
                    loadOrderHistory();
                    onHistoryOpen();
                  }}
                />
              </Tooltip>
            </HStack>
          </HStack>
            
            <Divider />
            
            {/* Informații comandă */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Box>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">Nr. Comandă:</Text>
                <Text fontSize="lg" fontWeight="bold" color="blue.600">{orderNumber}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">Data Comandă:</Text>
                <Text fontSize="lg" fontWeight="bold">{orderDate.toLocaleDateString('ro-RO')}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">Termen Livrare:</Text>
                <Text fontSize="lg" fontWeight="bold" color="green.600">{endDate.toLocaleDateString('ro-RO')}</Text>
              </Box>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>

      {/* Selectarea furnizorului */}
      <Card bg={cardBgColor} shadow="md">
        <CardHeader bg={headerBgColor} py={3}>
          <Heading size="md">1. DATE FURNIZOR</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel fontWeight="bold">Selectați Furnizorul *</FormLabel>
              <Select
                placeholder="Selectați furnizorul"
                value={selectedSupplierId || ''}
                onChange={(e) => setSelectedSupplierId(e.target.value ? parseInt(e.target.value) : null)}
                isDisabled={loading}
                size="lg"
              >
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            {selectedSupplier && (
              <Card
                bg={infoCardBgColor}
                border="2px solid"
                borderColor={infoCardBorderColor}
              >
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <Heading size="sm" color="blue.600" mb={2}>
                      Informații Complete Furnizor
                    </Heading>
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Box>
                        <Text fontSize="xs" color="gray.500" fontWeight="medium">LOCALITATE</Text>
                        <Text fontSize="md" fontWeight="bold">{selectedSupplier.city || 'Craiova'}</Text>
                      </Box>
                      
                      <Box>
                        <Text fontSize="xs" color="gray.500" fontWeight="medium">COD POȘTAL</Text>
                        <Text fontSize="md" fontWeight="bold">-</Text>
                      </Box>
                      
                      <Box>
                        <Text fontSize="xs" color="gray.500" fontWeight="medium">ADRESA</Text>
                        <Text fontSize="md" fontWeight="bold">{selectedSupplier.address || 'Nu este specificată'}</Text>
                      </Box>
                      
                      <Box>
                        <Text fontSize="xs" color="gray.500" fontWeight="medium">JUDEȚUL</Text>
                        <Text fontSize="md" fontWeight="bold">{selectedSupplier.county || 'DOLJ'}</Text>
                      </Box>
                      
                      <Box>
                        <Text fontSize="xs" color="gray.500" fontWeight="medium">TELEFON / FAX</Text>
                        <Text fontSize="md" fontWeight="bold">{selectedSupplier.phone || 'Nu este specificat'}</Text>
                      </Box>
                      
                      <Box>
                        <Text fontSize="xs" color="gray.500" fontWeight="medium">EMAIL</Text>
                        <Text fontSize="md" fontWeight="bold">{selectedSupplier.email || 'Nu este specificat'}</Text>
                      </Box>
                    </SimpleGrid>
                    
                    <Divider my={2} />
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Box bg={blueBoxBgColor} p={3} borderRadius="md">
                        <Text fontSize="xs" color="gray.600" fontWeight="medium">COD FISCAL (CIF)</Text>
                        <Text fontSize="lg" fontWeight="bold" color="blue.700">
                          {selectedSupplier.tax_number || selectedSupplier.registration_number || 'Nu este specificat'}
                </Text>
              </Box>
                      
                      <Box bg={greenBoxBgColor} p={3} borderRadius="md">
                        <Text fontSize="xs" color="gray.600" fontWeight="medium">COD OPERAȚIV</Text>
                        <Text fontSize="lg" fontWeight="bold" color="green.700">
                          {selectedSupplier.code || 'N/A'}
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* Produsele din comandă (unificate) */}
      {editMode && (
        <Card bg={cardBgColor} shadow="md">
          <CardHeader bg={purpleCardBgColor} py={3}>
            <HStack justify="space-between">
              <Heading size="md">2. PRODUSE ÎN COMANDA</Heading>
              <HStack spacing={3}>
                <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
                  {orderItems.length} produse
                </Badge>
                <Button
                  colorScheme="green"
                  variant="outline"
                  size="sm"
                  leftIcon={<Icon as={FiPlus} />}
                  onClick={onAddProductsOpen}
                >
                  Adaugă Produse
                </Button>
              </HStack>
            </HStack>
          </CardHeader>
          <CardBody p={6}>
            <VStack spacing={2} align="stretch">
              {orderItems.map((item, index) => {
                // Determinăm dacă este un produs nou (adăugat recent)
                const isNewProduct = index >= (initialData?.orderItems?.length || 0);
                
                return (
                  <Box
                    key={item.productId}
                    bg={purpleCardBgColor}
                    border="1px solid"
                    borderColor={isNewProduct ? "green.300" : "purple.300"}
                    borderRadius="lg"
                    p={4}
                  position="relative"
                  >
                    {/* Eticheta NOU pentru produsele noi */}
                    {isNewProduct && (
                      <Box
                      position="absolute"
                        top={2}
                        right={2}
                        bg="green.500"
                        color="white"
                      fontSize="xs"
                        fontWeight="bold"
                      px={2}
                      py={1}
                        borderRadius="md"
                        zIndex={1}
                    >
                        NOU
                </Box>
                    )}
                    
                    <HStack justify="space-between" align="center">
                      <HStack spacing={4} flex={1}>
                        {/* Icon și nume */}
                        <HStack spacing={3}>
                          <Icon as={FiPackage} boxSize={5} color={isNewProduct ? "green.500" : "purple.500"} />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="semibold" fontSize="sm" color={textColor}>
                              {item.productName}
                  </Text>
                            <Text fontSize="xs" color="gray.500">
                              Cod: {item.productCode} • U.M.: {item.productUnit}
                            </Text>
                          </VStack>
                        </HStack>

                        {/* Preț și cantitate */}
                        <HStack spacing={6}>
                          <VStack align="center" spacing={0}>
                            <Text fontSize="xs" color="gray.500">PREȚ UNITAR</Text>
                            <Text fontWeight="bold" color="blue.600">{Number(item.supplierPrice || 0).toFixed(2)} lei</Text>
                          </VStack>
                          
                            <VStack align="center" spacing={0}>
                              <Text fontSize="xs" color="gray.500">CANTITATE</Text>
                              <NumberInput
                    size="sm"
                                min={item.minOrderQuantity || 1}
                                value={Math.round(item.quantity)}
                                onChange={(valueString) => {
                                  const value = parseInt(valueString) || item.minOrderQuantity || 1;
                                  handleQuantityChange(item.productId, value);
                                }}
                                w="80px"
                              >
                                <NumberInputField textAlign="center" fontSize="sm" />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </VStack>

                          <VStack align="center" spacing={0}>
                            <Text fontSize="xs" color="gray.500">TOTAL</Text>
                            <Text fontWeight="bold" color="green.600">{Number(item.totalPrice || 0).toFixed(2)} lei</Text>
                          </VStack>
                        </HStack>
                      </HStack>

                      {/* Buton elimină */}
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="solid"
                        leftIcon={<Icon as={FiX} />}
                        onClick={() => handleProductSelect({ product: { id: item.productId } } as any, false)}
                      >
                        Elimină
                      </Button>
                    </HStack>
                </Box>
                );
              })}
              
              {/* Valoarea totală */}
              {orderItems.length > 0 && (
                <Box
                  bg="green.50"
                  border="2px solid"
                  borderColor="green.300"
                  borderRadius="lg"
                  p={4}
                  mt={4}
                >
                  <HStack justify="space-between" align="center">
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" fontWeight="bold" color="green.700">
                        VALOARE TOTALĂ COMANDA
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {orderItems.length} produse selectate
                      </Text>
                    </VStack>
                    <VStack align="end" spacing={1}>
                      <Text fontSize="lg" fontWeight="bold" color="green.700">
                        {getTotalOrderValueWithTVA().toFixed(2)} lei
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        (cu TVA {tvaRate}%)
                      </Text>
                    </VStack>
              </HStack>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Selectarea produselor noi (doar în modul creare) */}
      {!editMode && selectedSupplierId && (
        <Card bg={cardBgColor} shadow="md">
          <CardHeader bg={greenCardBgColor} py={3}>
            <HStack justify="space-between">
              <Heading size="md">2. SELECTARE PRODUSE</Heading>
              {orderItems.length > 0 && (
                <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                  {orderItems.length} produse selectate
                </Badge>
              )}
            </HStack>
          </CardHeader>
          
          <CardBody p={6}>
            {loadingProducts ? (
              <Flex justify="center" align="center" py={12}>
                <VStack spacing={4}>
                  <Spinner size="xl" color="blue.500" thickness="4px" />
                  <Text color="gray.500" fontSize="lg">
                    Se încarcă produsele...
                  </Text>
                </VStack>
              </Flex>
            ) : supplierProducts.length === 0 ? (
              <Alert status="info" borderRadius="xl">
                <AlertIcon />
                <Box>
                  <AlertTitle>Niciun produs disponibil!</AlertTitle>
                  <AlertDescription>
                    Furnizorul selectat nu are produse în catalog.
                  </AlertDescription>
                </Box>
              </Alert>
            ) : (
              <VStack spacing={6} align="stretch">
                {/* Listă elegantă de produse */}
                <VStack spacing={2} align="stretch">
                   {currentProducts.map((product) => {
                     const isSelected = orderItems.some(item => item.productId === product.product.id);
                     const orderItem = orderItems.find(item => item.productId === product.product.id);
                     const unitPrice = typeof product.unitPrice === 'string' ? parseFloat(product.unitPrice) : product.unitPrice;
                     const currentStock = typeof product.product.currentStock === 'string' ? parseInt(product.product.currentStock) : product.product.currentStock;
                     
                     return (
                       <Box
                         key={product.id}
                         bg={isSelected ? greenCardBgColor : unselectedItemBgColor}
                         border="1px solid"
                         borderColor={isSelected ? 'green.300' : unselectedItemBorderColor}
                         borderRadius="lg"
                         p={4}
                         transition="all 0.2s ease"
                            _hover={{
                           borderColor: isSelected ? 'green.400' : 'blue.300',
                           shadow: 'md'
                         }}
                       >
                         <HStack justify="space-between" align="center">
                           <HStack spacing={4} flex={1}>
                             {/* Icon și nume */}
                             <HStack spacing={3}>
                               <Icon as={FiPackage} boxSize={5} color={isSelected ? 'green.500' : 'blue.500'} />
                               <VStack align="start" spacing={0}>
                                 <Text fontWeight="semibold" fontSize="sm" color={textColor}>
                                    {product.product.name}
                                  </Text>
                                 <Text fontSize="xs" color="gray.500">
                                   {product.product.categoryName} • Cod: {product.product.code}
                                 </Text>
                                </VStack>
                             </HStack>

                             {/* Preț și stoc */}
                             <HStack spacing={6}>
                               <VStack align="center" spacing={0}>
                                 <Text fontSize="xs" color="gray.500">PREȚ</Text>
                                 <Text fontWeight="bold" color="blue.600">{unitPrice.toFixed(2)} lei</Text>
                               </VStack>
                               
                               <VStack align="center" spacing={0}>
                                 <Text fontSize="xs" color="gray.500">STOC</Text>
                                <Text
                                   fontWeight="semibold" 
                                   color={currentStock > 10 ? 'green.600' : currentStock > 5 ? 'yellow.600' : 'red.600'}
                                >
                                   {currentStock} {product.product.unit}
                                </Text>
                               </VStack>

                               {/* Cantitate selectată */}
                                {isSelected && orderItem && (
                                 <VStack align="center" spacing={0}>
                                   <Text fontSize="xs" color="gray.500">CANTITATE</Text>
                                        <NumberInput
                                          size="sm"
                                          min={product.minOrderQuantity || 1}
                                          value={orderItem.quantity}
                                          onChange={(valueString) => {
                                            const value = parseInt(valueString) || product.minOrderQuantity || 1;
                                            handleQuantityChange(product.product.id, value);
                                          }}
                                          w="80px"
                                   >
                                     <NumberInputField textAlign="center" fontSize="sm" />
                                     <NumberInputStepper>
                                       <NumberIncrementStepper />
                                       <NumberDecrementStepper />
                                     </NumberInputStepper>
                                        </NumberInput>
                                    </VStack>
                                )}
                             </HStack>
                           </HStack>

                           {/* Buton acțiune */}
                                <Button
                                  size="sm"
                             colorScheme={isSelected ? 'red' : 'green'}
                             variant={isSelected ? 'solid' : 'outline'}
                             leftIcon={<Icon as={isSelected ? FiX : FiPlus} />}
                             onClick={() => handleProductSelect(product, !isSelected)}
                                >
                                  {isSelected ? 'Elimină' : 'Adaugă'}
                                </Button>
                         </HStack>
                       </Box>
                       );
                     })}
                 </VStack>

                {/* Pagination Controls - Modern Design */}
                {totalPages > 1 && (
                  <Card
                    bg={infoCardBgColor}
                    borderRadius="xl"
                    p={4}
                    border="1px solid"
                    borderColor={paginationCardBorderColor}
                  >
                    <Flex justify="space-between" align="center">
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">
                        Pagina {currentPage} din {totalPages}
                      </Text>

                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Prima pagină"
                          icon={<Icon as={FiChevronsLeft} />}
                          size="sm"
                          variant="outline"
                          colorScheme="blue"
                          onClick={goToFirstPage}
                          isDisabled={currentPage === 1}
                          borderRadius="full"
                        />
                        <IconButton
                          aria-label="Pagina anterioară"
                          icon={<Icon as={FiChevronLeft} />}
                          size="sm"
                          variant="outline"
                          colorScheme="blue"
                          onClick={goToPreviousPage}
                          isDisabled={currentPage === 1}
                          borderRadius="full"
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
                                borderRadius="full"
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
                          colorScheme="blue"
                          onClick={goToNextPage}
                          isDisabled={currentPage === totalPages}
                          borderRadius="full"
                        />
                        <IconButton
                          aria-label="Ultima pagină"
                          icon={<Icon as={FiChevronsRight} />}
                          size="sm"
                          variant="outline"
                          colorScheme="blue"
                          onClick={goToLastPage}
                          isDisabled={currentPage === totalPages}
                          borderRadius="full"
                        />
                      </HStack>

                      <Text fontSize="sm" color="gray.600" fontWeight="medium">
                        {itemsPerPage} per pagină
                      </Text>
                    </Flex>
                  </Card>
                )}

                {/* Tabel oficial cu produsele selectate */}
                {orderItems.length > 0 && (
                    <Card
                    bg={tableCardBgColor}
                      border="2px solid"
                    borderColor={tableCardBorderColor}
                    mt={6}
                  >
                    <CardHeader bg={greenBoxBgColor} py={2}>
                      <Heading size="sm">TABEL COMANDĂ - PRODUSE SELECTATE</Heading>
                    </CardHeader>
                    <CardBody p={0}>
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead bg={tableTheadBgColor}>
                            <Tr>
                              <Th textAlign="center" py={3}>NR.CRT</Th>
                              <Th>DENUMIREA PRODUSULUI ȘI CARACTERISTICI</Th>
                              <Th textAlign="center">U.M.</Th>
                              <Th textAlign="center">COD U.M.</Th>
                              <Th textAlign="center">CANT.</Th>
                              <Th textAlign="right">PREȚ UNITAR</Th>
                              <Th textAlign="right">VALOARE</Th>
                              <Th textAlign="right">VAL. CU TVA</Th>
                              <Th textAlign="center">TERMEN LIVRARE</Th>
                              <Th textAlign="center">ACȚIUNI</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {orderItems.map((item, index) => {
                              const valoareCuTVA = item.totalPrice * (1 + (item.tvaRate || tvaRate) / 100);
                              return (
                                <Tr key={item.productId}>
                                  <Td textAlign="center" fontWeight="bold">{index + 1}</Td>
                                  <Td>
                                    <VStack align="start" spacing={0}>
                                      <Text fontWeight="medium">{item.productName}</Text>
                                      <Text fontSize="xs" color="gray.500">Cod: {item.productCode}</Text>
                                    </VStack>
                                  </Td>
                                  <Td textAlign="center">{item.productUnit}</Td>
                                  <Td textAlign="center" fontFamily="mono">{item.unitCode || 'BUC'}</Td>
                                  <Td textAlign="center">
                                    <NumberInput
                                      size="sm"
                                      min={item.minOrderQuantity || 1}
                                      value={Math.round(item.quantity)}
                                      onChange={(valueString) => {
                                        const value = parseInt(valueString) || item.minOrderQuantity || 1;
                                        handleQuantityChange(item.productId, value);
                                      }}
                                      w="80px"
                                    >
                                      <NumberInputField textAlign="center" />
                                      <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                      </NumberInputStepper>
                                    </NumberInput>
                                  </Td>
                                  <Td textAlign="right" fontWeight="medium">{Number(item.supplierPrice || 0).toFixed(2)} lei</Td>
                                  <Td textAlign="right" fontWeight="bold" color="blue.600">
                                    {Number(item.totalPrice || 0).toFixed(2)} lei
                                  </Td>
                                  <Td textAlign="right" fontWeight="bold" color="green.600">
                                    {valoareCuTVA.toFixed(2)} lei
                                  </Td>
                                  <Td textAlign="center">{item.deliveryTime || 1} zile</Td>
                                  <Td textAlign="center">
                                    <IconButton
                                      aria-label="Elimină produs"
                                      icon={<Icon as={FiTrash2} />}
                                      size="sm"
                                      colorScheme="red"
                                      variant="ghost"
                                      onClick={() => handleProductSelect({ product: { id: item.productId } } as any, false)}
                                    />
                                  </Td>
                                </Tr>
                              );
                            })}
                            
                            {/* Rând TOTAL */}
                            <Tr bg={totalRowBgColor} fontWeight="bold">
                              <Td colSpan={6} textAlign="right" fontSize="lg">TOTAL:</Td>
                              <Td textAlign="right" fontSize="lg" color="blue.700">
                                 {getTotalOrderValue().toFixed(2)} lei
                              </Td>
                              <Td textAlign="right" fontSize="lg" color="green.700">
                                {getTotalOrderValueWithTVA().toFixed(2)} lei
                              </Td>
                              <Td colSpan={2}></Td>
                            </Tr>
                            
                            {/* Rând TVA */}
                            <Tr bg={tvaRowBgColor}>
                              <Td colSpan={6} textAlign="right" fontWeight="medium">
                                TVA ({tvaRate}%):
                              </Td>
                              <Td colSpan={2} textAlign="right" fontWeight="bold" color="orange.600">
                                {getTVAAmount().toFixed(2)} lei
                              </Td>
                              <Td colSpan={2}></Td>
                            </Tr>
                          </Tbody>
                        </Table>
                      </TableContainer>
                      </CardBody>
                    </Card>
                )}
              </VStack>
            )}
          </CardBody>
        </Card>
      )}

      {/* Selecția Depozitului de Livrare */}
      {selectedSupplierId && supplierProducts.length > 0 && (
        <Card bg={cardBgColor} shadow="md">
          <CardHeader bg={orangeCardBgColor} py={3}>
            <Heading size="md">{editMode ? '3. DEPOZIT DE LIVRARE' : '3. DEPOZIT DE LIVRARE'}</Heading>
          </CardHeader>
          
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Rugăm să expedieri la adresa:
              </Text>
              {/* Listă elegantă de depozite */}
              <VStack spacing={2} align="stretch">
                {AVAILABLE_WAREHOUSES.map((warehouse) => (
                  <Box
                    key={warehouse.id}
                    bg={selectedWarehouse === warehouse.name ? selectedWarehouseBgColor : unselectedWarehouseBgColor}
                    border="1px solid"
                    borderColor={selectedWarehouse === warehouse.name ? 'teal.300' : paginationCardBorderColor}
                    borderRadius="lg"
                    p={4}
                    cursor="pointer"
                    transition="all 0.2s ease"
                    _hover={{
                      borderColor: selectedWarehouse === warehouse.name ? 'teal.400' : 'blue.300',
                      shadow: 'md'
                    }}
                    onClick={() => setSelectedWarehouse(warehouse.name)}
                  >
                    <HStack justify="space-between" align="center">
                      <HStack spacing={4} flex={1}>
                        {/* Icon și nume */}
                        <HStack spacing={3}>
                          <Icon as={FiPackage} boxSize={5} color={selectedWarehouse === warehouse.name ? 'teal.500' : 'blue.500'} />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="semibold" fontSize="sm" color={textColor}>
                              {warehouse.name}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {warehouse.description}
                            </Text>
                          </VStack>
                        </HStack>

                        {/* Adresa */}
                        <HStack spacing={2} flex={1}>
                            <Icon as={FiMapPin} boxSize={4} color="teal.500" />
                          <Text fontSize="sm" color={warehouseAddressColor}>
                              {warehouse.address}
                            </Text>
                          </HStack>
                      </HStack>

                      {/* Buton acțiune */}
                      <HStack spacing={2}>
                        {selectedWarehouse === warehouse.name && (
                          <Icon as={FiCheckCircle} boxSize={5} color="teal.500" />
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme="teal"
                          leftIcon={<Icon as={FiMapPin} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            const encodedAddress = encodeURIComponent(warehouse.address);
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                          }}
                        >
                          Hartă
                        </Button>
                      </HStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>

              {/* Depozit selectat - preview */}
              {selectedWarehouse && (
                  <Card
                  bg={previewCardBgColor}
                    border="2px solid"
                  borderColor="orange.300"
                  >
                    <CardBody p={4}>
                      <HStack justify="space-between" align="center">
                        <HStack spacing={3}>
                        <Icon as={FiMapPin} boxSize={6} color="orange.700" />
                          <VStack align="start" spacing={1}>
                          <Text fontWeight="bold" fontSize="md">Locație Livrare Selectată:</Text>
                          <Text fontSize="lg" fontWeight="bold" color="orange.700">
                              {selectedWarehouse}
                            </Text>
                          <Text fontSize="sm" color="gray.600">
                            {AVAILABLE_WAREHOUSES.find(w => w.name === selectedWarehouse)?.address}
                            </Text>
                          </VStack>
                        </HStack>
                        <Button
                          size="sm"
                        colorScheme="orange"
                          variant="outline"
                          onClick={() => setSelectedWarehouse('')}
                        >
                          Schimbă
                        </Button>
                      </HStack>
                    </CardBody>
                  </Card>
              )}
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Secțiune Semnături Oficiale */}
      {selectedSupplierId && orderItems.length > 0 && selectedWarehouse && (
        <Card bg={cardBgColor} shadow="md">
          <CardHeader bg={purpleCardBgColor} py={3}>
            <Heading size="md">{editMode ? '4. SEMNĂTURI ȘI APROBĂRI' : '4. SEMNĂTURI ȘI APROBĂRI'}</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Text fontSize="sm" color="gray.600" fontStyle="italic">
                Produsele să fie însoțite de aviz de însoțire a mărfii, certificate de calitate, declarație de conformitate.
              </Text>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                <Box
                  border="2px dashed"
                  borderColor={signatureBorderColor}
                  borderRadius="md"
                  p={4}
                  textAlign="center"
                >
                  <VStack spacing={2}>
                    <Icon as={FiUser} boxSize={8} color="purple.500" />
                    <Text fontSize="sm" fontWeight="bold" textTransform="uppercase">
                      DIRECTOR EXECUTIV
                    </Text>
                    <Divider />
                    <Text fontSize="xs" color="gray.500">Ec. MICU DORIN VIOREL</Text>
                    <Box h="40px" w="full" borderBottom="1px solid" borderColor="gray.400" mt={2} />
                    <Text fontSize="xs" color="gray.500">Semnătura și ștampila</Text>
                  </VStack>
                </Box>
                
                <Box
                  border="2px dashed"
                  borderColor={signatureBorderColor}
                  borderRadius="md"
                  p={4}
                  textAlign="center"
                >
                  <VStack spacing={2}>
                    <Icon as={FiUser} boxSize={8} color="blue.500" />
                    <Text fontSize="sm" fontWeight="bold" textTransform="uppercase">
                      DIRECTOR EXECUTIV ADJ ECONOMIC
                    </Text>
                    <Divider />
                    <Text fontSize="xs" color="gray.500">Ec. NICOLAE MARCU</Text>
                    <Box h="40px" w="full" borderBottom="1px solid" borderColor="gray.400" mt={2} />
                    <Text fontSize="xs" color="gray.500">Semnătura și ștampila</Text>
                  </VStack>
                </Box>
                
                <Box
                  border="2px dashed"
                  borderColor={signatureBorderColor}
                  borderRadius="md"
                  p={4}
                  textAlign="center"
                >
                  <VStack spacing={2}>
                    <Icon as={FiUser} boxSize={8} color="green.500" />
                    <Text fontSize="sm" fontWeight="bold" textTransform="uppercase">
                      ȘEF SERVICIU ADMINISTRATIV MENTENANȚĂ
                    </Text>
                    <Divider />
                    <Text fontSize="xs" color="gray.500">Ing. ALINA POPA</Text>
                    <Box h="40px" w="full" borderBottom="1px solid" borderColor="gray.400" mt={2} />
                    <Text fontSize="xs" color="gray.500">Semnătura și ștampila</Text>
                  </VStack>
                </Box>
              </SimpleGrid>
              
              <Divider />
              
              <HStack justify="space-between" bg={infoCardBgColor} p={4} borderRadius="md">
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="bold">Data Emiterii Comenzii:</Text>
                  <Text fontSize="md">{new Date().toLocaleDateString('ro-RO', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}</Text>
                </VStack>
                <VStack align="end" spacing={1}>
                  <Text fontSize="sm" fontWeight="bold">Număr Comandă:</Text>
                  <Text fontSize="md" color="blue.600" fontWeight="bold">{orderNumber}</Text>
                </VStack>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Rezumat și validare finală */}
      <Card bg={cardBgColor} shadow="lg" border="2px solid" borderColor={
        selectedSupplierId && selectedWarehouse && orderItems.length > 0 
          ? tableCardBorderColor
          : 'orange.300'
      }>
        <CardBody>
          <VStack spacing={4} align="stretch">
        {/* Mesaj de validare */}
            {(!selectedSupplierId || !selectedWarehouse || orderItems.length === 0) ? (
          <Alert status="warning" borderRadius="lg">
            <AlertIcon />
            <Box>
                  <AlertTitle fontSize="lg">📋 Completare Necesară</AlertTitle>
              <AlertDescription>
                    <VStack align="start" spacing={1} mt={2}>
                      {!selectedSupplierId && <Text>• Selectați un furnizor (Secțiunea 1)</Text>}
                      {selectedSupplierId && orderItems.length === 0 && <Text>• Selectați cel puțin un produs (Secțiunea 2)</Text>}
                      {orderItems.length > 0 && !selectedWarehouse && <Text>• Selectați depozitul de livrare (Secțiunea 3)</Text>}
                    </VStack>
              </AlertDescription>
            </Box>
          </Alert>
            ) : (
          <Alert status="success" borderRadius="lg">
            <AlertIcon />
                <Box flex="1">
                  <AlertTitle fontSize="lg">✅ Comandă Completată!</AlertTitle>
              <AlertDescription>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2} mt={2}>
                      <Text>• <strong>Furnizor:</strong> {selectedSupplier?.name}</Text>
                      <Text>• <strong>Produse:</strong> {orderItems.length} articole</Text>
                      <Text>• <strong>Depozit:</strong> {selectedWarehouse}</Text>
                      <Text>• <strong>Valoare totală:</strong> {getTotalOrderValueWithTVA().toFixed(2)} lei (cu TVA)</Text>
                    </SimpleGrid>
              </AlertDescription>
            </Box>
          </Alert>
        )}
            
            {/* Nota finală */}
            {selectedSupplierId && selectedWarehouse && orderItems.length > 0 && (
              <Box bg={headerBgColor} p={3} borderRadius="md">
                <Text fontSize="sm" color="blue.700" textAlign="center">
                  <strong>Notă:</strong> După crearea evenimentului, comanda va fi salvată și va putea fi vizualizată în calendar. 
                  Puteți accesa istoricul comenzilor folosind butonul din partea de sus.
                </Text>
              </Box>
        )}
      </VStack>
        </CardBody>
      </Card>

      {/* Modal pentru Istoricul Comenzilor */}
      <Modal isOpen={isHistoryOpen} onClose={onHistoryClose} size="4xl" scrollBehavior="inside">
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
            bgGradient="linear(135deg, purple.500, blue.600)"
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
                <Icon as={FiClock} boxSize={6} />
              </Box>
              <VStack align="start" spacing={1}>
                <Heading size="lg" fontWeight="bold">
                  Istoricul Comenzilor de Aprovizionare
                </Heading>
                <Text fontSize="md" opacity={0.9}>
                  Toate comenzile anterioare și statusul lor
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={6}>
            {loadingHistory ? (
              <Flex justify="center" align="center" py={12}>
                <VStack spacing={4}>
                  <Spinner size="xl" color="purple.500" thickness="4px" />
                  <Text color="gray.500" fontSize="lg">
                    Se încarcă istoricul comenzilor...
                  </Text>
                </VStack>
              </Flex>
            ) : orderHistory.length === 0 ? (
              <Flex justify="center" align="center" py={12} direction="column">
                <Icon as={FiClock} boxSize={16} color="gray.300" mb={4} />
                <Text fontSize="xl" fontWeight="semibold" color="gray.500" mb={2}>
                  Niciun istoric de comenzi
                </Text>
                <Text fontSize="md" color="gray.400" textAlign="center">
                  Nu există comenzi anterioare în sistem.
                </Text>
              </Flex>
            ) : (
              <VStack spacing={4} align="stretch">
                {orderHistory.map((order) => (
                  <Card key={order.id} variant="outline" borderColor={borderColor}>
                    <CardBody p={4}>
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between" align="start">
                          <VStack align="start" spacing={1} flex={1}>
                            <Text fontWeight="bold" fontSize="lg" color="gray.800">
                              {order.eventTitle}
                            </Text>
                            <HStack spacing={4}>
                              <HStack spacing={1}>
                                <Icon as={FiUser} boxSize={4} color="blue.500" />
                                <Text fontSize="sm" color="gray.600">
                                  {order.supplierName}
                                </Text>
                              </HStack>
                              <HStack spacing={1}>
                                <Icon as={FiPackage} boxSize={4} color="green.500" />
                                <Text fontSize="sm" color="gray.600">
                                  {order.itemsCount} produse
                                </Text>
                              </HStack>
                            </HStack>
                          </VStack>
                          <VStack align="end" spacing={1}>
                            <Badge
                              colorScheme={getStatusColor(order.status)}
                              variant="solid"
                              px={3}
                              py={1}
                              borderRadius="full"
                              fontSize="sm"
                            >
                              {getStatusText(order.status)}
                            </Badge>
                            <Text fontSize="lg" fontWeight="bold" color="green.600">
                              {order.totalValue.toFixed(2)} lei
                            </Text>
                          </VStack>
                        </HStack>

                        <Divider />

                        <SimpleGrid columns={2} spacing={4}>
                          <HStack spacing={2}>
                            <Icon as={FiCalendar} boxSize={4} color="orange.500" />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.500">Data comandă</Text>
                              <Text fontSize="sm" fontWeight="medium">
                                {new Date(order.createdAt).toLocaleDateString('ro-RO')}
                              </Text>
                            </VStack>
                          </HStack>
                          <HStack spacing={2}>
                            <Icon as={FiClock} boxSize={4} color="purple.500" />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.500">Livrare estimată</Text>
                              <Text fontSize="sm" fontWeight="medium">
                                {new Date(order.expectedDeliveryDate).toLocaleDateString('ro-RO')}
                              </Text>
                            </VStack>
                          </HStack>
                        </SimpleGrid>

                        {order.status === 'DELIVERED' && (
                          <HStack spacing={2} p={2} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
                            <Icon as={FiCheckCircle} color="green.500" boxSize={4} />
                            <Text fontSize="sm" color="green.700" fontWeight="medium">
                              Comandă finalizată și livrată cu succes
                            </Text>
                          </HStack>
                        )}

                        {order.status === 'IN_TRANSIT' && (
                          <HStack spacing={2} p={2} bg="orange.50" borderRadius="md" border="1px solid" borderColor="orange.200">
                            <Icon as={FiTruck} color="orange.500" boxSize={4} />
                            <Text fontSize="sm" color="orange.700" fontWeight="medium">
                              Comandă în curs de livrare
                            </Text>
                          </HStack>
                        )}

                        {order.status === 'ORDERED' && (
                          <HStack spacing={2} p={2} bg="yellow.50" borderRadius="md" border="1px solid" borderColor="yellow.200">
                            <Icon as={FiClock} color="yellow.500" boxSize={4} />
                            <Text fontSize="sm" color="yellow.700" fontWeight="medium">
                              Comandă în așteptare de confirmare
                            </Text>
                          </HStack>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal pentru adăugarea produselor noi */}
      <Modal isOpen={isAddProductsOpen} onClose={onAddProductsClose} size="4xl" scrollBehavior="inside">
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
            bgGradient="linear(135deg, green.500, blue.600)"
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
                <Icon as={FiPlus} boxSize={6} />
              </Box>
              <VStack align="start" spacing={1}>
                <Heading size="lg" fontWeight="bold">
                  Adaugă Produse Noi
                </Heading>
                <Text fontSize="md" opacity={0.9}>
                  Selectează produse din catalogul furnizorului
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={6}>
            {loadingProducts ? (
              <Flex justify="center" align="center" py={12}>
                <VStack spacing={4}>
                  <Spinner size="xl" color="green.500" thickness="4px" />
                  <Text color="gray.500" fontSize="lg">
                    Se încarcă produsele...
                  </Text>
                </VStack>
              </Flex>
            ) : supplierProducts.length === 0 ? (
              <Flex justify="center" align="center" py={12} direction="column">
                <Icon as={FiPackage} boxSize={16} color="gray.300" mb={4} />
                <Text fontSize="xl" fontWeight="semibold" color="gray.500" mb={2}>
                  Niciun produs disponibil
                </Text>
                <Text fontSize="md" color="gray.400" textAlign="center">
                  Furnizorul selectat nu are produse în catalog.
                </Text>
              </Flex>
            ) : (
              <VStack spacing={4} align="stretch">
                {/* Listă de produse disponibile */}
                <VStack spacing={2} align="stretch">
                  {supplierProducts
                    .filter(product => !orderItems.some(item => item.productId === product.product.id))
                    .map((product) => {
                      const unitPrice = typeof product.unitPrice === 'string' ? parseFloat(product.unitPrice) : product.unitPrice;
                      const currentStock = typeof product.product.currentStock === 'string' ? parseInt(product.product.currentStock) : product.product.currentStock;
                      
                      return (
                        <Box
                          key={product.id}
                          bg={unselectedItemBgColor}
                          border="1px solid"
                          borderColor={unselectedItemBorderColor}
                          borderRadius="lg"
                          p={4}
                          transition="all 0.2s ease"
                          _hover={{
                            borderColor: 'blue.300',
                            shadow: 'md'
                          }}
                        >
                          <HStack justify="space-between" align="center">
                            <HStack spacing={4} flex={1}>
                              {/* Icon și nume */}
                              <HStack spacing={3}>
                                <Icon as={FiPackage} boxSize={5} color="blue.500" />
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="semibold" fontSize="sm" color={textColor}>
                                    {product.product.name}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {product.product.categoryName} • Cod: {product.product.code}
                                  </Text>
                                </VStack>
                              </HStack>

                              {/* Preț și stoc */}
                              <HStack spacing={6}>
                                <VStack align="center" spacing={0}>
                                  <Text fontSize="xs" color="gray.500">PREȚ</Text>
                                  <Text fontWeight="bold" color="blue.600">{unitPrice.toFixed(2)} lei</Text>
                                </VStack>
                                
                                <VStack align="center" spacing={0}>
                                  <Text fontSize="xs" color="gray.500">STOC</Text>
                                  <Text 
                                    fontWeight="semibold" 
                                    color={currentStock > 10 ? 'green.600' : currentStock > 5 ? 'yellow.600' : 'red.600'}
                                  >
                                    {currentStock} {product.product.unit}
                                  </Text>
                                </VStack>
                              </HStack>
                            </HStack>

                            {/* Buton adaugă */}
                            <Button
                              size="sm"
                              colorScheme="green"
                              variant="outline"
                              leftIcon={<Icon as={FiPlus} />}
                              onClick={() => {
                                handleProductSelect(product, true);
                                onAddProductsClose();
                              }}
                            >
                              Adaugă
                            </Button>
                          </HStack>
                        </Box>
                      );
                    })}
                </VStack>

                {supplierProducts.filter(product => !orderItems.some(item => item.productId === product.product.id)).length === 0 && (
                  <Flex justify="center" align="center" py={8} direction="column">
                    <Icon as={FiCheckCircle} boxSize={12} color="green.500" mb={3} />
                    <Text fontSize="lg" fontWeight="semibold" color="green.600" mb={2}>
                      Toate produsele sunt deja în comandă
                    </Text>
                    <Text fontSize="md" color="gray.500" textAlign="center">
                      Nu mai sunt produse disponibile pentru adăugare.
                    </Text>
                  </Flex>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
} 