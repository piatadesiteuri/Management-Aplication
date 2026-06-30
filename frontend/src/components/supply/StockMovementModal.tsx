import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
  ModalBody,
    ModalFooter,
    Button,
    FormControl,
    FormLabel,
    Input,
  Select,
    VStack,
  SimpleGrid,
  useToast,
  FormErrorMessage,
    NumberInput,
    NumberInputField,
  Textarea,
  Box,
  Divider,
  Text,
  HStack,
  Icon,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { FiTrendingUp, FiTrendingDown, FiPackage, FiUser, FiCalendar, FiFileText, FiDollarSign, FiMapPin } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { SupplyService } from '../../services/supply/SupplyService';
import DepartmentService, { Department } from '../../services/DepartmentService';
import { Product, StockMovementType, Inventory } from '../../types/supply';

interface StockMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
  movementType: StockMovementType;
  inventoryId?: number;
    onSuccess: () => void;
}

const initialFormData = {
  productId: 0,
  quantity: 0,
  unitCost: 0,
  reason: '',
  referenceDocument: '',
  notes: '',
  date: new Date().toISOString().split('T')[0],
  supplierId: undefined,
  departmentId: undefined,
  location: 'Depozit Principal',
};

// Locații disponibile în depozit
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

const inReasons = [
  'Achiziție nouă',
  'Returnare de la departament',
  'Transfer între locații',
  'Corecție inventar',
  'Donație',
  'Altele',
];

const outReasons = [
  'Utilizare în departament',
  'Transfer către alt departament',
  'Expirare',
  'Deteriorare',
  'Pierdere',
  'Corecție inventar',
  'Altele',
];

const adjustmentReasons = [
  'Inventariere',
  'Corecție eroare',
  'Deteriorare',
  'Expirare',
  'Pierdere',
  'Altele',
];

export default function StockMovementModal({
  isOpen,
  onClose,
  movementType,
  inventoryId,
  onSuccess,
}: StockMovementModalProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const toast = useToast();
  const supplyService = new SupplyService();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      loadData();
      setFormData({
        ...initialFormData,
        date: new Date().toISOString().split('T')[0],
        // Generez automat referința documentului
        referenceDocument: generateDocumentReference(),
      });
      setSelectedProduct(null);
      setSelectedInventory(null);
      setErrors({});
    }
  }, [isOpen, movementType]);

  const generateDocumentReference = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const time = String(date.getHours()).padStart(2, '0') + String(date.getMinutes()).padStart(2, '0');
    
    const typePrefix = {
      'IN': 'ENT',
      'OUT': 'IES',
      'ADJUSTMENT': 'ADJ',
      'TRANSFER': 'TRF'
    };
    
    return `${typePrefix[movementType]}-${year}${month}${day}-${time}`;
  };

  const loadData = async () => {
    try {
      const [productsResponse, inventoryResponse, departmentsResponse] = await Promise.all([
        supplyService.getProducts(1, 1000), // Get all products for selection
        supplyService.getInventory(1, 1000), // Get all inventory for selection
        DepartmentService.getDepartments() // Get all departments
      ]);
      setProducts(productsResponse.data);
      setInventory(inventoryResponse.data);
      setDepartments(departmentsResponse);

      // Dacă avem un inventoryId specific, selectăm produsul corespunzător
      if (inventoryId) {
        const selectedInv = inventoryResponse.data.find(inv => inv.id === inventoryId);
        if (selectedInv) {
          setSelectedInventory(selectedInv);
          setSelectedProduct(selectedInv.product);
          setFormData(prev => ({ 
            ...prev, 
            productId: selectedInv.product.id,
            location: selectedInv.location || 'Depozit Principal'
          }));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
                toast({
                    title: 'Eroare',
        description: 'Nu s-au putut încărca datele.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleProductChange = (productId: number) => {
    const product = products.find(p => p.id === productId);
    const productInventory = inventory.find(inv => inv.product.id === productId);
    
    setSelectedProduct(product || null);
    setSelectedInventory(productInventory || null);
    
    const newLocation = productInventory?.location || 'Depozit Principal';
    
    // Pre-populez cantitatea cu stocul curent pentru ieșiri
    let prefillQuantity = 0;
    if (movementType === 'OUT' && productInventory) {
      prefillQuantity = Math.min(productInventory.quantity, 100); // Pre-fill cu o cantitate rezonabilă
    } else if (movementType === 'ADJUSTMENT' && productInventory) {
      prefillQuantity = productInventory.quantity; // Pentru ajustare, pre-fill cu stocul curent
    }
    
    setFormData(prev => ({ 
      ...prev, 
      productId,
      location: newLocation,
      quantity: prefillQuantity
    }));
    
    // Clear quantity-related errors when product changes
    if (errors.quantity) {
      setErrors(prev => ({ ...prev, quantity: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.productId) {
      newErrors.productId = 'Produsul este obligatoriu';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Cantitatea trebuie să fie mai mare decât 0';
    }

    if (selectedInventory && movementType === 'OUT' && formData.quantity > selectedInventory.quantity) {
      newErrors.quantity = `Cantitatea nu poate fi mai mare decât stocul disponibil (${selectedInventory.quantity})`;
    }

    if (movementType === 'ADJUSTMENT' && (!formData.quantity || formData.quantity < 0)) {
      newErrors.quantity = 'Pentru ajustare, cantitatea trebuie să fie pozitivă';
    }

    if (!formData.reason) {
      newErrors.reason = 'Motivul este obligatoriu';
    }

    if (!formData.date) {
      newErrors.date = 'Data este obligatorie';
    }

    if (movementType === 'IN' && formData.unitCost <= 0) {
      newErrors.unitCost = 'Pentru intrări, costul unitar este obligatoriu';
    }

    if (!formData.location) {
      newErrors.location = 'Locația este obligatorie';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: 'Eroare de validare',
        description: 'Vă rugăm să completați toate câmpurile obligatorii corect.',
                    status: 'error',
        duration: 5000,
                    isClosable: true,
                });
                return;
            }

    if (!selectedInventory) {
                toast({
                    title: 'Eroare',
        description: 'Nu s-a găsit inventarul pentru produsul selectat.',
                    status: 'error',
        duration: 5000,
                    isClosable: true,
                });
                return;
            }

    try {
      setLoading(true);

      const movementData = {
        inventoryId: selectedInventory.id,
        type: movementType,
                quantity: formData.quantity,
        unitCost: formData.unitCost || 0,
        referenceDocument: formData.referenceDocument,
        reason: formData.reason,
        performedBy: user?.name || `${user?.first_name} ${user?.last_name}`.trim() || user?.email || 'Utilizator necunoscut',
        supplierId: formData.supplierId,
        departmentId: formData.departmentId,
        notes: formData.notes,
        movementDate: formData.date,
      };

      await supplyService.createStockMovement(movementData);

      const newStock = movementType === 'IN' 
        ? selectedInventory.quantity + formData.quantity
        : movementType === 'OUT'
        ? selectedInventory.quantity - formData.quantity
        : formData.quantity; // For ADJUSTMENT

            toast({
                title: 'Succes',
        description: `${getMovementTypeLabel(movementType)} a fost înregistrată cu succes. Stoc nou: ${newStock} ${selectedProduct?.unit}`,
                status: 'success',
        duration: 5000,
                isClosable: true,
            });

            onSuccess();
            onClose();
      setFormData(initialFormData);
      setSelectedProduct(null);
      setSelectedInventory(null);
    } catch (error: any) {
      console.error('Error saving stock movement:', error);
            toast({
                title: 'Eroare',
        description: error.response?.data?.message || 'Nu s-a putut înregistra mișcarea de stoc. Vă rugăm să încercați din nou.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

  const handleChange = (
    field: keyof typeof formData,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

  const getMovementTypeLabel = (type: StockMovementType) => {
    switch (type) {
      case 'IN': return 'Intrarea de stoc';
      case 'OUT': return 'Ieșirea de stoc';
      case 'ADJUSTMENT': return 'Ajustarea de stoc';
      case 'TRANSFER': return 'Transferul de stoc';
      default: return 'Mișcarea de stoc';
    }
  };

  const getReasonOptions = () => {
    switch (movementType) {
      case 'IN': return inReasons;
      case 'OUT': return outReasons;
      case 'ADJUSTMENT': return adjustmentReasons;
      case 'TRANSFER': return outReasons;
      default: return [];
    }
  };

  const newStock = selectedInventory ? (
    movementType === 'IN' 
      ? selectedInventory.quantity + (formData.quantity || 0)
      : movementType === 'OUT'
      ? selectedInventory.quantity - (formData.quantity || 0)
      : formData.quantity || 0 // For ADJUSTMENT
  ) : 0;

  const getAlertStatus = () => {
    if (!selectedProduct) return null;
    
    if (movementType === 'OUT' && newStock < 0) {
      return { status: 'error' as const, message: 'Stocul va deveni negativ!' };
    }
    if (newStock <= (selectedProduct.min_stock || 0)) {
      return { status: 'warning' as const, message: 'Stocul va scădea sub limita minimă!' };
    }
    if (newStock >= (selectedProduct.max_stock || 1000)) {
      return { status: 'info' as const, message: 'Stocul va depăși limita maximă!' };
    }
    return null;
  };

  const alertInfo = getAlertStatus();

    return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      motionPreset="slideInBottom"
      scrollBehavior="inside"
    >
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent borderRadius="xl">
                <ModalHeader>
          <HStack>
            <Icon 
              as={movementType === 'IN' ? FiTrendingUp : FiTrendingDown}
              color={movementType === 'IN' ? 'green.500' : 'red.500'}
            />
            <Text>
              {getMovementTypeLabel(movementType)}
            </Text>
          </HStack>
                </ModalHeader>

                <ModalBody>
          <VStack spacing={6}>
            {/* Informații Utilizator */}
            <Box w="full" p={4} bg="blue.50" _dark={{ bg: 'blue.900' }} borderRadius="lg">
              <HStack justify="space-between">
                <HStack>
                  <Icon as={FiUser} color="blue.500" />
                  <Text fontWeight="semibold">Efectuat de:</Text>
                  <Text>{user?.name || `${user?.first_name} ${user?.last_name}`.trim() || user?.email}</Text>
                </HStack>
                <HStack>
                  <Icon as={FiFileText} color="blue.500" />
                  <Text fontWeight="semibold">Document:</Text>
                  <Text>{formData.referenceDocument}</Text>
                </HStack>
              </HStack>
            </Box>

            {/* Selectare Produs */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="medium" mb={3}>
                <HStack>
                  <Icon as={FiPackage} color="blue.500" />
                  <Text>Selectare Produs</Text>
                </HStack>
              </Text>
              <FormControl isInvalid={!!errors.productId}>
                <FormLabel>Produs</FormLabel>
                            <Select
                  value={formData.productId || ''}
                  onChange={(e) => handleProductChange(parseInt(e.target.value))}
                  placeholder="Selectează produsul"
                  isDisabled={!!inventoryId} // Disable if specific inventory is selected
                            >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.code}) - Stoc: {product.current_stock || 0} {product.unit}
                                    </option>
                                ))}
                            </Select>
                <FormErrorMessage>{errors.productId}</FormErrorMessage>
                        </FormControl>

              {selectedProduct && (
                <Box mt={4} p={4} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="lg">
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                    <Stat>
                      <StatLabel>Nume Produs</StatLabel>
                      <StatNumber fontSize="md">{selectedProduct.name}</StatNumber>
                      <StatHelpText>{selectedProduct.code}</StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel>Stoc Curent</StatLabel>
                      <StatNumber fontSize="md">
                        {selectedInventory?.quantity || 0} {selectedProduct.unit}
                      </StatNumber>
                      <StatHelpText>Disponibil</StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel>Preț Unitar</StatLabel>
                      <StatNumber fontSize="md">
                        {(Number(selectedProduct.unit_price) || 0).toFixed(2)} RON
                      </StatNumber>
                      <StatHelpText>Per {selectedProduct.unit}</StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel>Categorie</StatLabel>
                      <StatNumber fontSize="md">{selectedProduct.category_name || 'Necategorizat'}</StatNumber>
                      <StatHelpText>Tip produs</StatHelpText>
                    </Stat>
                  </SimpleGrid>
                </Box>
              )}
            </Box>

            {/* Detalii Mișcare */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                <HStack>
                  <Icon as={FiFileText} color="purple.500" />
                  <Text>Detalii Mișcare</Text>
                </HStack>
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isInvalid={!!errors.quantity}>
                  <FormLabel>
                    Cantitate {movementType === 'ADJUSTMENT' ? 'Finală' : 
                              movementType === 'IN' ? 'Intrată' : 'Ieșită'} 
                    {selectedProduct && ` (${selectedProduct.unit})`}
                    {selectedInventory && (
                      <Text fontSize="sm" color="gray.500" fontWeight="normal">
                        Stoc disponibil: {selectedInventory.quantity} {selectedProduct?.unit}
                      </Text>
                    )}
                  </FormLabel>
                  <NumberInput
                    value={formData.quantity}
                    onChange={(_, value) => handleChange('quantity', value || 0)}
                    min={0}
                    max={movementType === 'OUT' ? (selectedInventory?.quantity || 0) : undefined}
                    size="lg"
                    precision={0}
                  >
                    <NumberInputField 
                      placeholder="0" 
                      fontSize="lg"
                      fontWeight="medium"
                      textAlign="center"
                    />
                  </NumberInput>
                  
                  {/* Butoane rapide pentru cantități */}
                  {selectedInventory && movementType === 'OUT' && (
                    <HStack mt={2} spacing={2} flexWrap="wrap">
                      <Text fontSize="sm" color="gray.600">Cantități rapide:</Text>
                      {[1, 5, 10, 25, 50, 100].map(quickQty => (
                        <Button
                          key={quickQty}
                          size="xs"
                          variant="outline"
                          onClick={() => handleChange('quantity', Math.min(quickQty, selectedInventory.quantity))}
                          isDisabled={quickQty > selectedInventory.quantity}
                        >
                          {quickQty}
                        </Button>
                      ))}
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="red"
                        onClick={() => handleChange('quantity', selectedInventory.quantity)}
                      >
                        Toate ({selectedInventory.quantity})
                      </Button>
                    </HStack>
                  )}
                  
                  <FormErrorMessage>{errors.quantity}</FormErrorMessage>
                </FormControl>

                {movementType === 'IN' && (
                  <FormControl isInvalid={!!errors.unitCost}>
                    <FormLabel>Cost Unitar (RON)</FormLabel>
                    <NumberInput
                      value={formData.unitCost}
                      onChange={(_, value) => handleChange('unitCost', value || 0)}
                                min={0}
                      precision={2}
                            >
                      <NumberInputField placeholder="0.00" />
                            </NumberInput>
                    <FormErrorMessage>{errors.unitCost}</FormErrorMessage>
                  </FormControl>
                )}

                <FormControl isInvalid={!!errors.location}>
                  <FormLabel>
                    <HStack>
                      <Icon as={FiMapPin} size={16} />
                      <Text>Locație Depozit</Text>
                    </HStack>
                  </FormLabel>
                  <Select
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="Selectează locația"
                  >
                    {AVAILABLE_LOCATIONS.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.location}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.reason}>
                  <FormLabel>Motiv</FormLabel>
                  <Select
                    value={formData.reason}
                    onChange={(e) => handleChange('reason', e.target.value)}
                    placeholder="Selectează motivul"
                  >
                    {getReasonOptions().map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.reason}</FormErrorMessage>
                        </FormControl>

                <FormControl isInvalid={!!errors.date}>
                  <FormLabel>Data</FormLabel>
                            <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                  />
                  <FormErrorMessage>{errors.date}</FormErrorMessage>
                        </FormControl>

                {(movementType === 'OUT' || movementType === 'TRANSFER') && (
                        <FormControl>
                    <FormLabel>Departament Destinație</FormLabel>
                    <Select
                      value={formData.departmentId || ''}
                      onChange={(e) => handleChange('departmentId', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Selectează departamentul"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </SimpleGrid>

              <FormControl mt={4}>
                <FormLabel>Observații</FormLabel>
                            <Textarea
                  value={formData.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Observații suplimentare..."
                  rows={3}
                            />
                        </FormControl>
            </Box>

            {/* Preview Stoc și Costuri */}
            {selectedInventory && formData.quantity > 0 && (
              <Box w="full" p={4} bg="blue.50" _dark={{ bg: 'blue.900' }} borderRadius="lg">
                <Text fontSize="lg" fontWeight="medium" mb={3}>
                  <HStack>
                    <Icon as={FiCalendar} color="blue.500" />
                    <Text>Preview Stoc și Costuri</Text>
                  </HStack>
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                  <Stat>
                    <StatLabel>Stoc Curent</StatLabel>
                    <StatNumber fontSize="md">
                      {selectedInventory.quantity} {selectedProduct?.unit}
                    </StatNumber>
                    <StatHelpText>Disponibil acum</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>
                      {movementType === 'IN' ? 'Se Adaugă' : 
                       movementType === 'ADJUSTMENT' ? 'Se Ajustează la' : 'Se Scade'}
                    </StatLabel>
                    <StatNumber 
                      fontSize="md"
                      color={movementType === 'IN' ? 'green.500' : 'red.500'}
                    >
                      {movementType === 'IN' ? '+' : 
                       movementType === 'ADJUSTMENT' ? '' : '-'}
                      {formData.quantity} {selectedProduct?.unit}
                    </StatNumber>
                    <StatHelpText>Modificare</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Stoc Nou</StatLabel>
                    <StatNumber fontSize="md">
                      {newStock} {selectedProduct?.unit}
                    </StatNumber>
                    <StatHelpText>După operație</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>
                      <HStack>
                        <Icon as={FiDollarSign} size={16} />
                        <Text>Valoare Totală</Text>
                      </HStack>
                    </StatLabel>
                    <StatNumber fontSize="md">
                      {((formData.unitCost || Number(selectedProduct?.unit_price) || 0) * formData.quantity).toFixed(2)} RON
                    </StatNumber>
                    <StatHelpText>Cost operație</StatHelpText>
                  </Stat>
                </SimpleGrid>
              </Box>
            )}

            {/* Alertă Status */}
            {alertInfo && formData.quantity > 0 && (
              <Alert status={alertInfo.status} borderRadius="lg">
                <AlertIcon />
                <Box>
                  <AlertTitle>Atenție!</AlertTitle>
                  <AlertDescription>{alertInfo.message}</AlertDescription>
                </Box>
              </Alert>
            )}
                    </VStack>
                </ModalBody>

        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose}>
                        Anulează
                    </Button>
                    <Button
            colorScheme={movementType === 'IN' ? 'green' : 'red'}
                        onClick={handleSubmit}
                        isLoading={loading}
            loadingText="Se înregistrează..."
            isDisabled={newStock < 0}
                    >
            {movementType === 'IN' ? 'Înregistrează Intrarea' : 
             movementType === 'ADJUSTMENT' ? 'Înregistrează Ajustarea' :
             'Înregistrează Ieșirea'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 