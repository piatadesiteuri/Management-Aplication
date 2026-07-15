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
  useColorModeValue,
  useDisclosure,
  NumberInput,
  NumberInputField,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Checkbox,
  Divider,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiPackage, FiSearch } from 'react-icons/fi';
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
  onProductsChange,
}: EventProductSelectorProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSelections, setProductSelections] = useState<ProductSelection[]>([]);

  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');

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

  useEffect(() => {
    const newSelections: ProductSelection[] = selectedProducts
      .map((selected) => {
        const product = products.find((p) => p.id === selected.productId);
        if (!product) return null;

        return {
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          productUnit: product.unit,
          currentStock: product.current_stock || 0,
          defaultPrice: Number(product.unit_price || 0),
          quantity: selected.quantity,
          estimatedCost: selected.quantity * (selected.unitCost || Number(product.unit_price || 0)),
        };
      })
      .filter(Boolean) as ProductSelection[];

    setProductSelections(newSelections);
  }, [selectedProducts, products]);

  const handleModalOpen = () => {
    setSearchTerm('');
    loadProducts();
    onOpen();
  };

  const handleProductToggle = (product: Product) => {
    const existingIndex = productSelections.findIndex((sel) => sel.productId === product.id);

    if (existingIndex === -1) {
      const newSelection: ProductSelection = {
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        productUnit: product.unit,
        currentStock: product.current_stock || 0,
        defaultPrice: Number(product.unit_price || 0),
        quantity: 1,
        estimatedCost: Number(product.unit_price || 0),
      };
      setProductSelections([...productSelections, newSelection]);
    } else {
      setProductSelections(productSelections.filter((sel) => sel.productId !== product.id));
    }
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) return;

    setProductSelections((prev) =>
      prev.map((sel) => {
        if (sel.productId === productId) {
          const estimatedCost = newQuantity * sel.defaultPrice;
          return { ...sel, quantity: newQuantity, estimatedCost };
        }
        return sel;
      })
    );
  };

  const isProductSelected = (productId: number) =>
    productSelections.some((sel) => sel.productId === productId);

  const getProductQuantity = (productId: number) =>
    productSelections.find((sel) => sel.productId === productId)?.quantity || 0;

  const getTotalCost = () =>
    productSelections.reduce((total, sel) => total + sel.estimatedCost, 0);

  const handleSaveSelections = () => {
    const formattedSelections = productSelections.map((sel) => ({
      productId: sel.productId,
      quantity: sel.quantity,
      unitCost: sel.defaultPrice,
      notes: `Produs pentru eveniment ${eventType}`,
    }));

    onProductsChange(formattedSelections);
    onClose();
  };

  const getEventTypeDescription = (type: EventType) => {
    switch (type) {
      case 'INSPECTION':
        return 'Materiale pentru inspecție sanitară';
      case 'TRAINING':
        return 'Materiale pentru sesiunea de formare';
      case 'MEETING':
        return 'Materiale pentru ședință';
      case 'MAINTENANCE':
        return 'Materiale pentru întreținere';
      default:
        return 'Materiale pentru eveniment';
    }
  };

  const filteredProducts = products.filter((product) => {
    const term = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(term) ||
      product.code.toLowerCase().includes(term) ||
      (product.description || '').toLowerCase().includes(term)
    );
  });

  return (
    <>
      <Box>
        <HStack justify="space-between" mb={2}>
          <Box>
            <Text fontSize="sm" fontWeight="medium">
              Produse din stoc
            </Text>
            <Text fontSize="xs" color={mutedTextColor}>
              {getEventTypeDescription(eventType)}
            </Text>
          </Box>
          <Button size="sm" variant="outline" leftIcon={<FiPackage />} onClick={handleModalOpen}>
            {productSelections.length > 0 ? 'Modifică' : 'Adaugă produse'}
          </Button>
        </HStack>

        {productSelections.length > 0 && (
          <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" p={3}>
            <VStack spacing={2} align="stretch">
              {productSelections.map((selection) => (
                <HStack key={selection.productId} justify="space-between" fontSize="sm">
                  <Text noOfLines={1} flex={1}>
                    {selection.productName}
                  </Text>
                  <Text color={mutedTextColor} whiteSpace="nowrap">
                    {selection.quantity} {selection.productUnit}
                  </Text>
                  <Text whiteSpace="nowrap" fontWeight="medium">
                    {selection.estimatedCost.toFixed(2)} lei
                  </Text>
                </HStack>
              ))}
              <Divider />
              <HStack justify="space-between" fontSize="sm">
                <Text color={mutedTextColor}>{productSelections.length} produse</Text>
                <Text fontWeight="semibold">Total: {getTotalCost().toFixed(2)} lei</Text>
              </HStack>
            </VStack>
          </Box>
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader py={3}>
            <Box>
              <Text fontSize="md" fontWeight="semibold">
                Selectare produse
              </Text>
              <Text fontSize="sm" color={mutedTextColor} fontWeight="normal">
                {getEventTypeDescription(eventType)}
              </Text>
            </Box>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody py={3}>
            {loading ? (
              <HStack justify="center" py={8} spacing={3}>
                <Spinner size="sm" />
                <Text fontSize="sm" color={mutedTextColor}>
                  Se încarcă produsele...
                </Text>
              </HStack>
            ) : products.length === 0 ? (
              <Alert status="warning" size="sm" borderRadius="md">
                <AlertIcon />
                <AlertDescription>
                  Nu sunt produse disponibile în inventar.
                </AlertDescription>
              </Alert>
            ) : (
              <VStack spacing={3} align="stretch">
                <HStack spacing={4} fontSize="xs" color={mutedTextColor} flexWrap="wrap">
                  <Text>
                    {products.filter((p) => (p.current_stock || 0) > 0).length} disponibile din{' '}
                    {products.length}
                  </Text>
                  <Text>·</Text>
                  <Text>{productSelections.length} selectate</Text>
                  <Text>·</Text>
                  <Text>Total: {getTotalCost().toFixed(2)} lei</Text>
                </HStack>

                <InputGroup size="sm">
                  <InputLeftElement>
                    <Icon as={FiSearch} color={mutedTextColor} />
                  </InputLeftElement>
                  <Input
                    placeholder="Caută după nume sau cod..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>

                <Box
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="md"
                  maxH="50vh"
                  overflowY="auto"
                >
                  {filteredProducts.map((product, index) => {
                    const isSelected = isProductSelected(product.id);
                    const quantity = getProductQuantity(product.id);
                    const currentStock = product.current_stock || 0;
                    const isOutOfStock = currentStock <= 0;

                    return (
                      <Box key={product.id}>
                        {index > 0 && <Divider />}
                        <HStack
                          align="center"
                          spacing={3}
                          p={2}
                          opacity={isOutOfStock ? 0.5 : 1}
                          _hover={!isOutOfStock ? { bg: rowHoverBg } : undefined}
                        >
                          <Checkbox
                            isChecked={isSelected}
                            isDisabled={isOutOfStock}
                            onChange={() => handleProductToggle(product)}
                            colorScheme="blue"
                          />

                          <Box flex={1} minW={0}>
                            <HStack justify="space-between" align="start" spacing={2}>
                              <Box minW={0}>
                                <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                                  {product.name}
                                </Text>
                                <Text fontSize="xs" color={mutedTextColor}>
                                  {product.code} · {Number(product.unit_price || 0).toFixed(2)} lei/
                                  {product.unit}
                                </Text>
                              </Box>
                              <Badge
                                colorScheme={currentStock <= 0 ? 'red' : currentStock <= 10 ? 'orange' : 'gray'}
                                variant="subtle"
                                fontSize="xs"
                                flexShrink={0}
                              >
                                {currentStock} {product.unit}
                              </Badge>
                            </HStack>
                          </Box>

                          {isSelected && !isOutOfStock && (
                            <NumberInput
                              size="sm"
                              width="72px"
                              value={quantity}
                              min={1}
                              max={Math.max(currentStock, 1)}
                              onChange={(_, value) =>
                                !isNaN(value) && handleQuantityChange(product.id, value)
                              }
                              onClick={(e) => e.stopPropagation()}
                            >
                              <NumberInputField textAlign="center" px={1} />
                            </NumberInput>
                          )}
                        </HStack>
                      </Box>
                    );
                  })}

                  {filteredProducts.length === 0 && (
                    <Text textAlign="center" py={6} fontSize="sm" color={mutedTextColor}>
                      Nu s-au găsit produse
                    </Text>
                  )}
                </Box>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor={borderColor} py={3}>
            <HStack spacing={3} w="full" justify="space-between">
              <Text fontSize="sm" color={mutedTextColor}>
                {productSelections.length} selectate · {getTotalCost().toFixed(2)} lei
              </Text>
              <HStack spacing={2}>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Anulare
                </Button>
                <Button
                  colorScheme="blue"
                  size="sm"
                  onClick={handleSaveSelections}
                  isDisabled={productSelections.length === 0}
                >
                  Salvează
                </Button>
              </HStack>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
