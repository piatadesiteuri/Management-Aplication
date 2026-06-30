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
} from '@chakra-ui/react';
import { FiPackage, FiTag, FiInfo, FiDollarSign, FiBarChart, FiTruck } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { SupplyService } from '../../services/supply/SupplyService';
import { Product, ProductCategory, CreateProductRequest, UpdateProductRequest } from '../../types/supply';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
  product?: Product | null;
    onSuccess: () => void;
}

const initialFormData: CreateProductRequest = {
    name: '',
    code: '',
    description: '',
  unit: 'bucată',
  unitPrice: 0,
  minStock: 0,
  maxStock: 1000,
  reorderPoint: 10,
    categoryId: undefined,
  barcode: '',
  manufacturer: '',
  expiryMonths: undefined,
  storageConditions: '',
};

const units = [
  'bucată',
  'cutie',
  'pachet',
  'set',
  'litru',
  'kg',
  'gram',
  'ml',
  'flacon',
  'rola',
  'metru',
];

export default function ProductFormModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: ProductFormModalProps) {
    const [formData, setFormData] = useState<CreateProductRequest>(initialFormData);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const toast = useToast();
  const supplyService = new SupplyService();

    useEffect(() => {
    if (isOpen) {
        loadCategories();
    }
  }, [isOpen]);

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
        code: product.code,
                description: product.description || '',
                unit: product.unit,
        unitPrice: product.unit_price || 0,
        minStock: product.min_stock || 0,
        maxStock: product.max_stock || 1000,
        reorderPoint: product.reorder_point || 10,
        categoryId: product.category_id,
        barcode: product.barcode || '',
        manufacturer: product.manufacturer || '',
        expiryMonths: product.expiry_months,
        storageConditions: product.storage_conditions || '',
            });
        } else {
            setFormData(initialFormData);
        }
    setErrors({});
  }, [product, isOpen]);

    const loadCategories = async () => {
        try {
      const categoriesData = await supplyService.getCategories();
      setCategories(categoriesData);
        } catch (error) {
            console.error('Error loading categories:', error);
            toast({
                title: 'Eroare',
        description: 'Nu s-au putut încărca categoriile.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Numele produsului este obligatoriu';
    }
    if (!formData.code?.trim()) {
      newErrors.code = 'Codul produsului este obligatoriu';
    }
    if (!formData.unit.trim()) {
      newErrors.unit = 'Unitatea de măsură este obligatorie';
    }
    if ((formData.unitPrice || 0) < 0) {
      newErrors.unitPrice = 'Prețul nu poate fi negativ';
    }
    if ((formData.minStock || 0) < 0) {
      newErrors.minStock = 'Stocul minim nu poate fi negativ';
    }
    if ((formData.maxStock || 0) <= 0) {
      newErrors.maxStock = 'Stocul maxim trebuie să fie pozitiv';
    }
    if ((formData.reorderPoint || 0) < 0) {
      newErrors.reorderPoint = 'Punctul de reaprovizionare nu poate fi negativ';
    }
    if ((formData.minStock || 0) >= (formData.maxStock || 0)) {
      newErrors.maxStock = 'Stocul maxim trebuie să fie mai mare decât minimul';
    }
    if ((formData.reorderPoint || 0) > (formData.maxStock || 0)) {
      newErrors.reorderPoint = 'Punctul de reaprovizionare nu poate fi mai mare decât stocul maxim';
    }
    if (formData.expiryMonths && formData.expiryMonths <= 0) {
      newErrors.expiryMonths = 'Perioada de expirare trebuie să fie pozitivă';
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

    try {
      setLoading(true);

            if (product) {
        await supplyService.updateProduct(product.id, formData as UpdateProductRequest);
                toast({
                    title: 'Succes',
          description: 'Produsul a fost actualizat cu succes.',
                    status: 'success',
          duration: 5000,
                    isClosable: true,
                });
            } else {
                await supplyService.createProduct(formData);
                toast({
                    title: 'Succes',
          description: 'Produsul a fost adăugat cu succes.',
                    status: 'success',
          duration: 5000,
                    isClosable: true,
                });
            }

            onSuccess();
            onClose();
    } catch (error: any) {
            console.error('Error saving product:', error);
            toast({
                title: 'Eroare',
        description: error.response?.data?.message || 'Nu s-a putut salva produsul. Vă rugăm să încercați din nou.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

  const handleChange = (
    field: keyof CreateProductRequest,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    // Șterge eroarea pentru câmpul modificat
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
    };

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
            <Icon as={FiPackage} />
            <Text>{product ? 'Editare Produs' : 'Adăugare Produs Nou'}</Text>
          </HStack>
                </ModalHeader>

                <ModalBody>
          <VStack spacing={6}>
            {/* Informații de bază */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                <HStack>
                  <Icon as={FiInfo} color="blue.500" />
                  <Text>Informații de Bază</Text>
                </HStack>
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isInvalid={!!errors.name}>
                  <FormLabel>Nume Produs</FormLabel>
                            <Input
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="ex: Mănuși medicale"
                            />
                  <FormErrorMessage>{errors.name}</FormErrorMessage>
                        </FormControl>

                <FormControl isInvalid={!!errors.code}>
                  <FormLabel>Cod Produs</FormLabel>
                            <Input
                                value={formData.code}
                                onChange={(e) => handleChange('code', e.target.value)}
                    placeholder="ex: MED001"
                            />
                  <FormErrorMessage>{errors.code}</FormErrorMessage>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Categorie</FormLabel>
                            <Select
                    value={formData.categoryId || ''}
                    onChange={(e) => handleChange('categoryId', e.target.value ? parseInt(e.target.value) : undefined)}
                                placeholder="Selectează categoria"
                            >
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                <FormControl isInvalid={!!errors.unit}>
                  <FormLabel>Unitate Măsură</FormLabel>
                  <Select
                                value={formData.unit}
                                onChange={(e) => handleChange('unit', e.target.value)}
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.unit}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <FormControl mt={4}>
                <FormLabel>Descriere</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Descrierea produsului..."
                  rows={3}
                />
              </FormControl>
            </Box>

            <Divider />

            {/* Informații economice */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                <HStack>
                  <Icon as={FiDollarSign} color="green.500" />
                  <Text>Informații Economice</Text>
                </HStack>
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isInvalid={!!errors.unitPrice}>
                  <FormLabel>Preț Unitar (RON)</FormLabel>
                  <NumberInput
                    value={formData.unitPrice}
                    onChange={(_, value) => handleChange('unitPrice', value || 0)}
                    min={0}
                    precision={2}
                  >
                    <NumberInputField placeholder="0.00" />
                  </NumberInput>
                  <FormErrorMessage>{errors.unitPrice}</FormErrorMessage>
                        </FormControl>

                        <FormControl>
                  <FormLabel>Producător</FormLabel>
                  <Input
                    value={formData.manufacturer}
                    onChange={(e) => handleChange('manufacturer', e.target.value)}
                    placeholder="ex: MedSupply Co"
                  />
                </FormControl>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Gestionare stoc */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                <HStack>
                  <Icon as={FiBarChart} color="purple.500" />
                  <Text>Gestionare Stoc</Text>
                </HStack>
              </Text>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <FormControl isInvalid={!!errors.minStock}>
                            <FormLabel>Stoc Minim</FormLabel>
                            <NumberInput
                                value={formData.minStock}
                    onChange={(_, value) => handleChange('minStock', value || 0)}
                                min={0}
                            >
                    <NumberInputField placeholder="0" />
                            </NumberInput>
                  <FormErrorMessage>{errors.minStock}</FormErrorMessage>
                        </FormControl>

                <FormControl isInvalid={!!errors.maxStock}>
                            <FormLabel>Stoc Maxim</FormLabel>
                            <NumberInput
                    value={formData.maxStock}
                    onChange={(_, value) => handleChange('maxStock', value || 1000)}
                    min={1}
                            >
                    <NumberInputField placeholder="1000" />
                            </NumberInput>
                  <FormErrorMessage>{errors.maxStock}</FormErrorMessage>
                        </FormControl>

                <FormControl isInvalid={!!errors.reorderPoint}>
                  <FormLabel>Punct Reaprovizionare</FormLabel>
                            <NumberInput
                    value={formData.reorderPoint}
                    onChange={(_, value) => handleChange('reorderPoint', value || 10)}
                                min={0}
                            >
                    <NumberInputField placeholder="10" />
                            </NumberInput>
                  <FormErrorMessage>{errors.reorderPoint}</FormErrorMessage>
                        </FormControl>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Informații suplimentare */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                <HStack>
                  <Icon as={FiTruck} color="orange.500" />
                  <Text>Informații Suplimentare</Text>
                </HStack>
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                  <FormLabel>Cod de Bare</FormLabel>
                  <Input
                    value={formData.barcode}
                    onChange={(e) => handleChange('barcode', e.target.value)}
                    placeholder="ex: 1234567890123"
                            />
                        </FormControl>

                <FormControl isInvalid={!!errors.expiryMonths}>
                  <FormLabel>Perioada Expirare (luni)</FormLabel>
                  <NumberInput
                    value={formData.expiryMonths || ''}
                    onChange={(_, value) => handleChange('expiryMonths', value || undefined)}
                    min={1}
                  >
                    <NumberInputField placeholder="ex: 24" />
                  </NumberInput>
                  <FormErrorMessage>{errors.expiryMonths}</FormErrorMessage>
                        </FormControl>

                        <FormControl>
                  <FormLabel>Condiții Depozitare</FormLabel>
                            <Textarea
                    value={formData.storageConditions}
                    onChange={(e) => handleChange('storageConditions', e.target.value)}
                    placeholder="ex: Depozitare la temperatura camerei"
                    rows={3}
                            />
                        </FormControl>
              </SimpleGrid>
            </Box>
                    </VStack>
                </ModalBody>

        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose}>
                        Anulează
                    </Button>
                    <Button
            colorScheme="brand"
                        onClick={handleSubmit}
                        isLoading={loading}
            loadingText="Se salvează..."
                    >
            {product ? 'Salvează Modificările' : 'Adaugă Produs'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 