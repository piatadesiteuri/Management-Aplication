import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  FormControl,
  FormLabel,
  Select,
  NumberInput,
  NumberInputField,
  Textarea,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Badge,
  IconButton,
  useToast,
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
  Divider,
  Icon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  InputGroup,
  InputLeftElement,
  Tooltip,
  Progress,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiTrash2,
  FiPackage,
  FiArrowUp,
  FiArrowDown,
  FiArrowRight,
  FiSearch,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { EventType } from '../../types/calendar';
import { Product } from '../../types/supply';
import { SupplyService } from '../../services/supply/SupplyService';

interface ProductSelection {
  productId: number;
  quantity: number;
  unitCost?: number;
  notes?: string;
}

interface ProductStockManagementProps {
  eventType: EventType;
  selectedProducts: ProductSelection[];
  onProductsChange: (products: ProductSelection[]) => void;
  eventDate: Date;
}

const getEventTypeInfo = (eventType: EventType) => {
  switch (eventType) {
    case 'STOCK_RECEPTION':
      return {
        title: 'Primire Marfă',
        description: 'Înregistrarea mărfurilor primite de la furnizori',
        color: 'green',
        icon: FiArrowDown,
        action: 'Primire',
        helpText: 'Selectați produsele și cantitățile primite. Stocul va fi actualizat automat.',
      };
    case 'STOCK_DISTRIBUTION':
      return {
        title: 'Distribuire Marfă',
        description: 'Distribuirea mărfurilor către departamente',
        color: 'blue',
        icon: FiArrowUp,
        action: 'Distribuire',
        helpText: 'Selectați produsele și cantitățile de distribuit. Verificați disponibilitatea în stoc.',
      };
    case 'STOCK_MOVEMENT':
      return {
        title: 'Mutare Marfă',
        description: 'Transferul mărfurilor între locații',
        color: 'orange',
        icon: FiArrowRight,
        action: 'Transfer',
        helpText: 'Selectați produsele pentru transfer între locații de depozitare.',
      };
    case 'INVENTORY_AUDIT':
      return {
        title: 'Inventariere',
        description: 'Verificarea și ajustarea stocurilor',
        color: 'purple',
        icon: FiPackage,
        action: 'Inventariere',
        helpText: 'Selectați produsele pentru inventariere și verificare stoc.',
      };
    default:
      return {
        title: 'Gestionare Stoc',
        description: 'Operațiuni cu stocul',
        color: 'gray',
        icon: FiPackage,
        action: 'Operațiune',
        helpText: 'Gestionarea produselor și stocurilor.',
      };
  }
};

export default function ProductStockManagement({
  eventType,
  selectedProducts,
  onProductsChange,
  eventDate,
}: ProductStockManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [notes, setNotes] = useState('');
  
  const toast = useToast();
  const supplyService = new SupplyService();
  const eventInfo = getEventTypeInfo(eventType);
  
  const {
    isOpen: isAddModalOpen,
    onOpen: onAddModalOpen,
    onClose: onAddModalClose,
  } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await supplyService.getProducts(1, 1000);
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca produsele',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
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

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    // Verificăm dacă produsul este deja adăugat
    const existingIndex = selectedProducts.findIndex(p => p.productId === selectedProductId);
    if (existingIndex >= 0) {
      // Actualizăm cantitatea
      const updated = [...selectedProducts];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + quantity,
        unitCost: unitCost > 0 ? unitCost : updated[existingIndex].unitCost,
        notes: notes.trim() || updated[existingIndex].notes,
      };
      onProductsChange(updated);
    } else {
      // Adăugăm produs nou
      const newProduct: ProductSelection = {
        productId: selectedProductId,
        quantity,
        unitCost: unitCost > 0 ? unitCost : product.unit_price,
        notes: notes.trim() || undefined,
      };
      onProductsChange([...selectedProducts, newProduct]);
    }

    // Reset form
    setSelectedProductId(null);
    setQuantity(1);
    setUnitCost(0);
    setNotes('');
    onAddModalClose();

    toast({
      title: 'Succes',
      description: 'Produsul a fost adăugat cu succes',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleRemoveProduct = (productId: number) => {
    onProductsChange(selectedProducts.filter(p => p.productId !== productId));
    toast({
      title: 'Produs eliminat',
      description: 'Produsul a fost eliminat din listă',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    const updated = selectedProducts.map(p =>
      p.productId === productId ? { ...p, quantity: newQuantity } : p
    );
    onProductsChange(updated);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProductDetails = (productId: number) => {
    return products.find(p => p.id === productId);
  };

  const getTotalCost = () => {
    return selectedProducts.reduce((total, selection) => {
      const product = getProductDetails(selection.productId);
      const cost = selection.unitCost || product?.unit_price || 0;
      return total + (cost * selection.quantity);
    }, 0);
  };

  const getStockWarning = (productId: number, requestedQuantity: number) => {
    const product = getProductDetails(productId);
    if (!product) return null;

    const currentStock = product.current_stock || 0;
    
    if (eventType === 'STOCK_DISTRIBUTION' || eventType === 'STOCK_MOVEMENT') {
      if (requestedQuantity > currentStock) {
        return {
          type: 'error' as const,
          message: `Cantitate insuficientă! Disponibil: ${currentStock} ${product.unit}`,
        };
      } else if (requestedQuantity > currentStock * 0.8) {
        return {
          type: 'warning' as const,
          message: `Atenție! Vă apropiați de limita stocului (${currentStock} ${product.unit})`,
        };
      }
    }
    
    return null;
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Header cu informații despre tipul de eveniment */}
      <Card>
        <CardHeader>
          <HStack>
            <Icon as={eventInfo.icon} color={`${eventInfo.color}.500`} boxSize={6} />
            <Box>
              <Heading size="md">{eventInfo.title}</Heading>
              <Text fontSize="sm" color="gray.500">
                {eventInfo.description}
              </Text>
            </Box>
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <AlertDescription>
              {eventInfo.helpText}
            </AlertDescription>
          </Alert>
        </CardBody>
      </Card>

      {/* Statistici generale */}
      {selectedProducts.length > 0 && (
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Stat p={4} bg={cardBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
            <StatLabel>
              <HStack>
                <Icon as={FiPackage} color="blue.500" />
                <Text>Produse Selectate</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="blue.500">{selectedProducts.length}</StatNumber>
            <StatHelpText>În această operațiune</StatHelpText>
          </Stat>

          <Stat p={4} bg={cardBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
            <StatLabel>
              <HStack>
                <Icon as={FiTrendingUp} color="green.500" />
                <Text>Cantitate Totală</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="green.500">
              {selectedProducts.reduce((sum, p) => sum + p.quantity, 0)}
            </StatNumber>
            <StatHelpText>Unități procesate</StatHelpText>
          </Stat>

          <Stat p={4} bg={cardBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
            <StatLabel>
              <HStack>
                <Icon as={FiDollarSign} color="purple.500" />
                <Text>Valoare Estimată</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="purple.500">
              {new Intl.NumberFormat('ro-RO', {
                style: 'currency',
                currency: 'RON'
              }).format(getTotalCost())}
            </StatNumber>
            <StatHelpText>Cost total estimat</StatHelpText>
          </Stat>
        </SimpleGrid>
      )}

      {/* Buton adăugare produs */}
      <HStack justify="space-between">
        <Text fontSize="lg" fontWeight="semibold">
          Produse pentru {eventInfo.action}
        </Text>
        <Button
          leftIcon={<FiPlus />}
          colorScheme={eventInfo.color}
          onClick={onAddModalOpen}
        >
          Adaugă Produs
        </Button>
      </HStack>

      {/* Lista produselor selectate */}
      {selectedProducts.length === 0 ? (
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
            Niciun produs selectat
          </Text>
          <Text color="gray.400">
            Adăugați produse pentru a începe operațiunea de {eventInfo.action.toLowerCase()}
          </Text>
          <Button
            mt={4}
            leftIcon={<FiPlus />}
            colorScheme={eventInfo.color}
            onClick={onAddModalOpen}
          >
            Adaugă primul produs
          </Button>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" bg={bgColor} borderRadius="lg">
            <Thead bg={cardBg}>
              <Tr>
                <Th>Produs</Th>
                <Th>Cantitate</Th>
                <Th>Cost Unitar</Th>
                <Th>Total</Th>
                <Th>Stoc Disponibil</Th>
                <Th>Observații</Th>
                <Th>Acțiuni</Th>
              </Tr>
            </Thead>
            <Tbody>
              {selectedProducts.map((selection) => {
                const product = getProductDetails(selection.productId);
                const stockWarning = getStockWarning(selection.productId, selection.quantity);
                
                if (!product) return null;

                return (
                  <Tr key={selection.productId}>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold">{product.name}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {product.code}
                        </Text>
                        {product.category_name && (
                          <Badge colorScheme="purple" size="sm">
                            {product.category_name}
                          </Badge>
                        )}
                      </VStack>
                    </Td>
                    <Td>
                      <HStack>
                        <NumberInput
                          value={selection.quantity}
                          onChange={(_, value) => handleQuantityChange(selection.productId, value || 1)}
                          min={1}
                          max={eventType === 'STOCK_RECEPTION' ? 10000 : (product.current_stock || 0)}
                          size="sm"
                          w="80px"
                        >
                          <NumberInputField />
                        </NumberInput>
                        <Text fontSize="sm" color="gray.500">
                          {product.unit}
                        </Text>
                      </HStack>
                      {stockWarning && (
                        <Alert status={stockWarning.type} size="sm" mt={2}>
                          <AlertIcon boxSize={3} />
                          <Text fontSize="xs">{stockWarning.message}</Text>
                        </Alert>
                      )}
                    </Td>
                    <Td>
                      <Text fontWeight="semibold">
                        {new Intl.NumberFormat('ro-RO', {
                          style: 'currency',
                          currency: 'RON'
                        }).format(selection.unitCost || 0)}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontWeight="bold" color={`${eventInfo.color}.500`}>
                        {new Intl.NumberFormat('ro-RO', {
                          style: 'currency',
                          currency: 'RON'
                        }).format((selection.unitCost || 0) * selection.quantity)}
                      </Text>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold">
                          {product.current_stock || 0} {product.unit}
                        </Text>
                        <Progress
                          value={Math.min(((product.current_stock || 0) / (product.max_stock || 1000)) * 100, 100)}
                          size="sm"
                          colorScheme={
                            (product.current_stock || 0) <= (product.reorder_point || 0) ? 'red' : 'green'
                          }
                          w="60px"
                        />
                      </VStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm" noOfLines={2}>
                        {selection.notes || '-'}
                      </Text>
                    </Td>
                    <Td>
                      <Tooltip label="Elimină produs">
                        <IconButton
                          aria-label="Elimină produs"
                          icon={<FiTrash2 />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleRemoveProduct(selection.productId)}
                        />
                      </Tooltip>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Modal pentru adăugarea produselor */}
      <Modal isOpen={isAddModalOpen} onClose={onAddModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Icon as={FiPlus} color={`${eventInfo.color}.500`} />
              <Text>Adaugă Produs pentru {eventInfo.action}</Text>
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

              {selectedProductId && (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Informații Produs</AlertTitle>
                    <AlertDescription>
                      {(() => {
                        const product = products.find(p => p.id === selectedProductId);
                        if (!product) return null;
                        
                        return (
                          <VStack align="start" spacing={1} fontSize="sm">
                            <Text><strong>Preț unitar:</strong> {product.unit_price?.toFixed(2) || 0} RON/{product.unit}</Text>
                            <Text><strong>Stoc actual:</strong> {product.current_stock || 0} {product.unit}</Text>
                            <Text><strong>Stoc minim:</strong> {product.reorder_point || 0} {product.unit}</Text>
                            {product.category_name && (
                              <Text><strong>Categorie:</strong> {product.category_name}</Text>
                            )}
                          </VStack>
                        );
                      })()}
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
              colorScheme={eventInfo.color}
              onClick={handleAddProduct}
              isDisabled={!selectedProductId || quantity <= 0}
            >
              Adaugă Produs
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
} 