import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  useColorModeValue,
  useDisclosure,
  SimpleGrid,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Divider,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  Image,
  Flex,
  IconButton
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiPackage, FiPlus, FiMinus, FiShoppingCart, FiCheck } from 'react-icons/fi';
import { EventType } from '../../types/calendar';
import { SupplyService } from '../../services/supply/SupplyService';
import { Product } from '../../types/supply';

interface ProductSelection {
  productId: number;
  productName: string;
  productCode: string;
  productUnit: string;
  currentStock: number;
  defaultPrice: number;
  quantity: number;
  estimatedCost: number;
}

interface EventProductSelectorProps {
  eventType: EventType;
  selectedProducts: Array<{
    productId: number;
    quantity: number;
    unitCost?: number;
    notes?: string;
  }>;
  onProductsChange: (products: Array<{
    productId: number;
    quantity: number;
    unitCost?: number;
    notes?: string;
  }>) => void;
}

const supplyService = new SupplyService();

export default function EventProductSelector({
  eventType,
  selectedProducts,
  onProductsChange
}: EventProductSelectorProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [productSelections, setProductSelections] = useState<ProductSelection[]>([]);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const selectedCardBg = useColorModeValue('blue.50', 'blue.900');

  // Încărcăm produsele când se deschide modalul
  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await supplyService.getProducts();
      const productsData = response.data || response;
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Inițializăm selecțiile din props
  useEffect(() => {
    const newSelections: ProductSelection[] = selectedProducts.map(selected => {
      const product = products.find(p => p.id === selected.productId);
      if (!product) return null;
      
      return {
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        productUnit: product.unit,
        currentStock: product.current_stock || 0,
        defaultPrice: Number(product.unit_price || 0),
        quantity: selected.quantity,
        estimatedCost: selected.quantity * (selected.unitCost || Number(product.unit_price || 0))
      };
    }).filter(Boolean) as ProductSelection[];
    
    setProductSelections(newSelections);
  }, [selectedProducts, products]);

  const handleModalOpen = () => {
    loadProducts();
    onOpen();
  };

  const handleProductToggle = (product: Product) => {
    const existingIndex = productSelections.findIndex(sel => sel.productId === product.id);
    let newSelections: ProductSelection[];
    
    if (existingIndex === -1) {
      // Adăugăm produsul
      const newSelection: ProductSelection = {
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        productUnit: product.unit,
        currentStock: product.current_stock || 0,
        defaultPrice: Number(product.unit_price || 0),
        quantity: 1,
        estimatedCost: Number(product.unit_price || 0)
      };
      newSelections = [...productSelections, newSelection];
    } else {
      // Eliminăm produsul
      newSelections = productSelections.filter(sel => sel.productId !== product.id);
    }
    
    setProductSelections(newSelections);
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    setProductSelections(prev => prev.map(sel => {
      if (sel.productId === productId) {
        const estimatedCost = newQuantity * sel.defaultPrice;
        return { ...sel, quantity: newQuantity, estimatedCost };
      }
      return sel;
    }));
  };

  const isProductSelected = (productId: number) => {
    return productSelections.some(sel => sel.productId === productId);
  };

  const getProductQuantity = (productId: number) => {
    return productSelections.find(sel => sel.productId === productId)?.quantity || 0;
  };

  const getTotalCost = () => {
    return productSelections.reduce((total, sel) => total + sel.estimatedCost, 0);
  };

  const getStockColor = (currentStock: number) => {
    if (currentStock === 0) return 'red';
    if (currentStock <= 10) return 'orange';
    if (currentStock <= 50) return 'yellow';
    return 'green';
  };

  const handleSaveSelections = () => {
    const formattedSelections = productSelections.map(sel => ({
      productId: sel.productId,
      quantity: sel.quantity,
      unitCost: sel.defaultPrice,
      notes: `Produs pentru eveniment ${eventType}`
    }));
    
    onProductsChange(formattedSelections);
    onClose();
  };

  const getEventTypeDescription = (type: EventType) => {
    switch (type) {
      case 'INSPECTION': return 'Materiale pentru inspecție sanitară';
      case 'TRAINING': return 'Materiale pentru sesiunea de formare';
      case 'MEETING': return 'Materiale pentru ședință';
      case 'MAINTENANCE': return 'Materiale pentru întreținere';
      default: return 'Materiale pentru eveniment';
    }
  };

  return (
    <>
      {/* Butonul principal frumos */}
      <Card bg={cardBg} borderWidth="2px" borderStyle="dashed" borderColor={borderColor}>
        <CardBody textAlign="center" py={8}>
          <VStack spacing={4}>
            <Box
              p={4}
              borderRadius="full"
              bg={useColorModeValue('purple.100', 'purple.900')}
              color={useColorModeValue('purple.600', 'purple.300')}
            >
              <Icon as={FiPackage} boxSize={8} />
            </Box>
            
            <VStack spacing={2}>
              <Text fontSize="lg" fontWeight="bold" color="gray.700">
                Produse din Stoc pentru Eveniment
              </Text>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                {getEventTypeDescription(eventType)}
              </Text>
              
              {productSelections.length > 0 && (
                <Badge colorScheme="purple" fontSize="md" px={3} py={1} borderRadius="full">
                  {productSelections.length} produse selectate
                </Badge>
              )}
            </VStack>
            
            <Button
              leftIcon={<FiPlus />}
              colorScheme="purple"
              size="lg"
              borderRadius="xl"
              px={8}
              py={6}
              onClick={handleModalOpen}
              _hover={{
                transform: 'translateY(-2px)',
                shadow: 'lg'
              }}
              transition="all 0.3s ease"
            >
              {productSelections.length > 0 ? 'Modifică Produsele' : 'Adaugă Produse'}
            </Button>
          </VStack>
        </CardBody>
      </Card>

      {/* Rezumatul produselor selectate */}
      {productSelections.length > 0 && (
        <Card bg={selectedCardBg} borderColor="purple.300" borderWidth="1px">
          <CardBody>
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="md" fontWeight="semibold" color="purple.700">
                  Produse Selectate pentru Eveniment
                </Text>
                <Badge colorScheme="purple" px={3} py={1}>
                  {productSelections.length} produse
                </Badge>
              </HStack>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                {productSelections.map((selection) => (
                  <Box
                    key={selection.productId}
                    p={3}
                    bg={bgColor}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontSize="sm" fontWeight="medium">
                          {selection.productName}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {selection.productCode}
                        </Text>
                      </VStack>
                      <VStack align="end" spacing={1}>
                        <Text fontSize="sm" fontWeight="bold">
                          {selection.quantity} {selection.productUnit}
                        </Text>
                        <Text fontSize="xs" color="green.600">
                          {selection.estimatedCost.toFixed(2)} lei
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>
                ))}
              </SimpleGrid>
              
              <Divider />
              
              <HStack justify="space-between">
                <Text fontSize="md" fontWeight="semibold">
                  Cost Total Estimat:
                </Text>
                <Text fontSize="lg" fontWeight="bold" color="purple.600">
                  {getTotalCost().toFixed(2)} lei
                </Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Modalul frumos animat */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        size="6xl" 
        motionPreset="slideInBottom"
        scrollBehavior="inside"
      >
        <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.600" />
        <ModalContent
          borderRadius="3xl"
          shadow="2xl"
          bg={bgColor}
          mx={4}
          overflow="hidden"
        >
          <ModalHeader
            bgGradient="linear(135deg, purple.500, pink.500)"
            color="white"
            p={6}
          >
            <HStack spacing={4}>
              <Box
                p={3}
                bg="whiteAlpha.200"
                borderRadius="xl"
                backdropFilter="blur(10px)"
              >
                <Icon as={FiShoppingCart} boxSize={6} />
              </Box>
              <VStack align="start" spacing={1}>
                <Text fontSize="xl" fontWeight="bold">
                  Selectare Produse din Inventar
                </Text>
                <Text fontSize="md" opacity={0.9}>
                  {getEventTypeDescription(eventType)}
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          
          <ModalBody p={6}>
            {loading ? (
              <VStack spacing={4} py={12}>
                <Spinner size="xl" color="purple.500" />
                <Text fontSize="lg" color="gray.500">
                  Se încarcă produsele din inventar...
                </Text>
              </VStack>
            ) : products.length === 0 ? (
              <Alert status="warning" borderRadius="xl">
                <AlertIcon />
                <AlertDescription>
                  Nu sunt produse disponibile în inventar pentru selecție.
                </AlertDescription>
              </Alert>
            ) : (
              <VStack spacing={6} align="stretch">
                {/* Statistici rapide */}
                <HStack justify="space-between" p={4} bg={cardBg} borderRadius="xl">
                  <Stat textAlign="center">
                    <StatLabel fontSize="xs">Produse Disponibile</StatLabel>
                    <StatNumber fontSize="lg" color="blue.600">
                      {products.filter(p => (p.current_stock || 0) > 0).length}
                    </StatNumber>
                    <StatHelpText fontSize="xs" m={0}>
                      din {products.length} total
                    </StatHelpText>
                  </Stat>
                  
                  <Stat textAlign="center">
                    <StatLabel fontSize="xs">Produse Selectate</StatLabel>
                    <StatNumber fontSize="lg" color="purple.600">
                      {productSelections.length}
                    </StatNumber>
                    <StatHelpText fontSize="xs" m={0}>
                      pentru eveniment
                    </StatHelpText>
                  </Stat>
                  
                  <Stat textAlign="center">
                    <StatLabel fontSize="xs">Cost Estimat</StatLabel>
                    <StatNumber fontSize="lg" color="green.600">
                      {getTotalCost().toFixed(2)} lei
                    </StatNumber>
                    <StatHelpText fontSize="xs" m={0}>
                      cost total
                    </StatHelpText>
                  </Stat>
                </HStack>
                
                {/* Grid-ul de produse frumos */}
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {products.map((product) => {
                    const isSelected = isProductSelected(product.id);
                    const quantity = getProductQuantity(product.id);
                    const currentStock = product.current_stock || 0;
                    const isOutOfStock = currentStock === 0;
                    
                    return (
                      <Card
                        key={product.id}
                        variant="outline"
                        cursor={isOutOfStock ? 'not-allowed' : 'pointer'}
                        opacity={isOutOfStock ? 0.6 : 1}
                        borderWidth="2px"
                        borderColor={isSelected ? 'purple.300' : borderColor}
                        bg={isSelected ? selectedCardBg : cardBg}
                        _hover={!isOutOfStock ? {
                          borderColor: 'purple.400',
                          transform: 'translateY(-2px)',
                          shadow: 'lg'
                        } : {}}
                        transition="all 0.3s ease"
                        position="relative"
                        overflow="hidden"
                      >
                        {isSelected && (
                          <Box
                            position="absolute"
                            top={2}
                            right={2}
                            p={1}
                            bg="purple.500"
                            color="white"
                            borderRadius="full"
                            boxSize={6}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Icon as={FiCheck} boxSize={3} />
                          </Box>
                        )}
                        
                        <CardBody p={4} onClick={() => !isOutOfStock && handleProductToggle(product)}>
                          <VStack spacing={3} align="stretch">
                            {/* Header produs */}
                            <HStack justify="space-between" align="start">
                              <VStack align="start" spacing={1} flex={1}>
                                <Text fontSize="md" fontWeight="bold" lineHeight="1.2">
                                  {product.name}
                                </Text>
                                <Text fontSize="xs" color="gray.500" fontWeight="medium">
                                  Cod: {product.code}
                                </Text>
                              </VStack>
                              <Badge
                                colorScheme={getStockColor(currentStock)}
                                variant="solid"
                                px={2}
                                py={1}
                                borderRadius="md"
                                fontSize="xs"
                              >
                                {currentStock} {product.unit}
                              </Badge>
                            </HStack>
                            
                            {/* Descriere */}
                            {product.description && (
                              <Text fontSize="xs" color="gray.600" noOfLines={2}>
                                {product.description}
                              </Text>
                            )}
                            
                            {/* Preț */}
                            <HStack justify="space-between">
                              <Text fontSize="sm" fontWeight="semibold" color="green.600">
                                {Number(product.unit_price || 0).toFixed(2)} lei/{product.unit}
                              </Text>
                              {isOutOfStock && (
                                <Badge colorScheme="red" variant="solid">
                                  Stoc epuizat
                                </Badge>
                              )}
                            </HStack>
                            
                            {/* Selector cantitate pentru produsele selectate */}
                            {isSelected && !isOutOfStock && (
                              <Box
                                p={3}
                                bg={bgColor}
                                borderRadius="lg"
                                borderWidth="1px"
                                borderColor="purple.200"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <VStack spacing={2}>
                                  <Text fontSize="xs" fontWeight="semibold" color="purple.600">
                                    Cantitate necesară:
                                  </Text>
                                  <HStack spacing={2}>
                                    <IconButton
                                      aria-label="Scade cantitatea"
                                      icon={<FiMinus />}
                                      size="sm"
                                      variant="outline"
                                      colorScheme="purple"
                                      isDisabled={quantity <= 1}
                                      onClick={() => handleQuantityChange(product.id, quantity - 1)}
                                    />
                                    <NumberInput
                                      value={quantity}
                                      onChange={(_, value) => !isNaN(value) && handleQuantityChange(product.id, value)}
                                      min={1}
                                      max={currentStock}
                                      size="sm"
                                      width="80px"
                                    >
                                      <NumberInputField textAlign="center" />
                                      <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                      </NumberInputStepper>
                                    </NumberInput>
                                    <IconButton
                                      aria-label="Crește cantitatea"
                                      icon={<FiPlus />}
                                      size="sm"
                                      variant="outline"
                                      colorScheme="purple"
                                      isDisabled={quantity >= currentStock}
                                      onClick={() => handleQuantityChange(product.id, quantity + 1)}
                                    />
                                  </HStack>
                                  <Text fontSize="xs" color="gray.500">
                                    Rămân: {currentStock - quantity} {product.unit}
                                  </Text>
                                  <Text fontSize="xs" fontWeight="bold" color="green.600">
                                    Cost: {(quantity * Number(product.unit_price || 0)).toFixed(2)} lei
                                  </Text>
                                </VStack>
                              </Box>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>
                    );
                  })}
                </SimpleGrid>
              </VStack>
            )}
          </ModalBody>
          
          <ModalFooter bg={cardBg} p={6}>
            <HStack justify="space-between" w="full">
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" fontWeight="semibold">
                  {productSelections.length} produse selectate
                </Text>
                <Text fontSize="lg" fontWeight="bold" color="purple.600">
                  Total: {getTotalCost().toFixed(2)} lei
                </Text>
              </VStack>
              
              <HStack spacing={3}>
                <Button variant="ghost" onClick={onClose}>
                  Anulare
                </Button>
                <Button
                  colorScheme="purple"
                  onClick={handleSaveSelections}
                  leftIcon={<FiCheck />}
                  size="lg"
                  borderRadius="xl"
                  isDisabled={productSelections.length === 0}
                  _hover={{
                    transform: 'translateY(-1px)',
                    shadow: 'lg'
                  }}
                  transition="all 0.2s ease"
                >
                  Salvează Selecția
                </Button>
              </HStack>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
} 