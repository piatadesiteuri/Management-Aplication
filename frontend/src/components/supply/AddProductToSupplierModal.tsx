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
    Checkbox,
    NumberInput,
    NumberInputField,
    Spinner,
    Box,
    Text,
    HStack,
    Icon,
    Badge,
    Divider,
    InputGroup,
    InputLeftElement,
    InputRightAddon,
} from '@chakra-ui/react';
import { FiPackage, FiDollarSign, FiTruck, FiHash, FiStar, FiSearch } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { Supplier, AvailableProduct, CreateSupplierProductRequest } from '../../types/supply';
import { SupplyService } from '../../services/supply/SupplyService';

interface AddProductToSupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: Supplier;
    onSuccess: () => void;
}

const initialFormData: CreateSupplierProductRequest = {
    productId: 0,
    supplierCode: '',
    unitPrice: 0,
    minOrderQuantity: 1,
    deliveryTime: 5,
    isPreferred: false,
};

export default function AddProductToSupplierModal({
    isOpen,
    onClose,
    supplier,
    onSuccess,
}: AddProductToSupplierModalProps) {
    const [formData, setFormData] = useState<CreateSupplierProductRequest>(initialFormData);
    const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const toast = useToast();
    const supplyService = new SupplyService();

    useEffect(() => {
        if (isOpen) {
            loadAvailableProducts();
            setFormData(initialFormData);
            setErrors({});
            setSearchTerm('');
        }
    }, [isOpen]);

    const loadAvailableProducts = async () => {
        try {
            setLoadingProducts(true);
            const products = await supplyService.getAvailableProductsForSupplier(supplier.id);
            setAvailableProducts(products);
        } catch (error: any) {
            console.error('❌ Error loading available products:', error);
            toast({
                title: 'Eroare',
                description: 'Nu s-au putut încărca produsele disponibile.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoadingProducts(false);
        }
    };

    const filteredProducts = availableProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.categoryName && product.categoryName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const selectedProduct = availableProducts.find(p => p.id === formData.productId);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.productId || formData.productId === 0) {
            newErrors.productId = 'Selectați un produs';
        }

        if (!formData.unitPrice || formData.unitPrice <= 0) {
            newErrors.unitPrice = 'Prețul unitar trebuie să fie pozitiv';
        }

        if (!formData.minOrderQuantity || formData.minOrderQuantity <= 0) {
            newErrors.minOrderQuantity = 'Cantitatea minimă trebuie să fie pozitivă';
        }

        if (!formData.deliveryTime || formData.deliveryTime <= 0) {
            newErrors.deliveryTime = 'Timpul de livrare trebuie să fie pozitiv';
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
            await supplyService.addProductToSupplier(supplier.id, formData);
            
            toast({
                title: 'Succes',
                description: `Produsul "${selectedProduct?.name}" a fost adăugat cu succes la furnizorul "${supplier.name}".`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error adding product to supplier:', error);
            toast({
                title: 'Eroare',
                description: error.response?.data?.message || 'Nu s-a putut adăuga produsul la furnizor.',
                status: 'error',
                duration: 7000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof CreateSupplierProductRequest, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
        
        // Șterge eroarea pentru câmpul modificat
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: '',
            }));
        }

        // Auto-populate supplier code when product is selected
        if (field === 'productId' && value) {
            const product = availableProducts.find(p => p.id === value);
            if (product && !formData.supplierCode) {
                setFormData(prev => ({
                    ...prev,
                    supplierCode: product.code,
                    unitPrice: product.unitPrice || 0,
                }));
            }
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ro-RO', { 
            style: 'currency', 
            currency: 'RON',
            maximumFractionDigits: 2
        }).format(amount);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
            <ModalOverlay backdropFilter="blur(10px)" />
            <ModalContent borderRadius="xl">
                <ModalHeader>
                    <HStack>
                        <Icon as={FiPackage} color="blue.500" />
                        <VStack align="start" spacing={1}>
                            <Text>Adaugă Produs la Furnizor</Text>
                            <Text fontSize="sm" color="gray.600">
                                {supplier.name} • {supplier.code}
                            </Text>
                        </VStack>
                    </HStack>
                </ModalHeader>

                <ModalBody>
                    <VStack spacing={6}>
                        {/* Selecția produsului */}
                        <Box w="full">
                            <Text fontSize="lg" fontWeight="medium" mb={4}>
                                📦 Selectare Produs
                            </Text>
                            
                            {/* Căutare produse */}
                            <FormControl mb={4}>
                                <FormLabel>Căutare Produse</FormLabel>
                                <InputGroup>
                                    <InputLeftElement pointerEvents="none">
                                        <Icon as={FiSearch} color="gray.400" />
                                    </InputLeftElement>
                                    <Input
                                        placeholder="Căutați după nume, cod sau categorie..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </InputGroup>
                            </FormControl>

                            <FormControl isInvalid={!!errors.productId}>
                                <FormLabel>Produs Disponibil</FormLabel>
                                {loadingProducts ? (
                                    <Box p={4} textAlign="center">
                                        <Spinner size="md" />
                                        <Text mt={2}>Se încarcă produsele...</Text>
                                    </Box>
                                ) : (
                                    <Select
                                        placeholder="Selectați un produs..."
                                        value={formData.productId}
                                        onChange={(e) => handleChange('productId', parseInt(e.target.value))}
                                    >
                                        {filteredProducts.map((product) => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} ({product.code}) - {formatCurrency(product.unitPrice)} per {product.unit}
                                                {product.categoryName && ` • ${product.categoryName}`}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                                <FormErrorMessage>{errors.productId}</FormErrorMessage>
                            </FormControl>

                            {/* Detalii produs selectat */}
                            {selectedProduct && (
                                <Box
                                    mt={4}
                                    p={4}
                                    bg="blue.50"
                                    borderRadius="lg"
                                    border="1px solid"
                                    borderColor="blue.200"
                                >
                                    <HStack justify="space-between" mb={2}>
                                        <Text fontWeight="semibold" color="blue.800">
                                            {selectedProduct.name}
                                        </Text>
                                        <Badge colorScheme="blue">{selectedProduct.categoryName}</Badge>
                                    </HStack>
                                    <SimpleGrid columns={3} spacing={4} fontSize="sm" color="blue.700">
                                        <Text><strong>Cod:</strong> {selectedProduct.code}</Text>
                                        <Text><strong>Unitate:</strong> {selectedProduct.unit}</Text>
                                        <Text><strong>Stoc:</strong> {selectedProduct.currentStock} {selectedProduct.unit}</Text>
                                    </SimpleGrid>
                                    <Text fontSize="sm" color="blue.600" mt={2}>
                                        <strong>Preț default:</strong> {formatCurrency(selectedProduct.unitPrice)}
                                    </Text>
                                </Box>
                            )}
                        </Box>

                        <Divider />

                        {/* Detalii comerciale */}
                        <Box w="full">
                            <Text fontSize="lg" fontWeight="medium" mb={4}>
                                💼 Detalii Comerciale
                            </Text>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                <FormControl isInvalid={!!errors.supplierCode}>
                                    <FormLabel>
                                        <HStack>
                                            <Icon as={FiHash} />
                                            <Text>Cod Furnizor</Text>
                                        </HStack>
                                    </FormLabel>
                                    <Input
                                        value={formData.supplierCode}
                                        onChange={(e) => handleChange('supplierCode', e.target.value)}
                                        placeholder="ex: SUP-001-MED"
                                    />
                                    <FormErrorMessage>{errors.supplierCode}</FormErrorMessage>
                                </FormControl>

                                <FormControl isInvalid={!!errors.unitPrice} isRequired>
                                    <FormLabel>
                                        <HStack>
                                            <Icon as={FiDollarSign} />
                                            <Text>Preț Unitar</Text>
                                        </HStack>
                                    </FormLabel>
                                    <InputGroup>
                                        <NumberInput
                                            value={formData.unitPrice}
                                            onChange={(_, value) => handleChange('unitPrice', value)}
                                            min={0}
                                            precision={2}
                                            step={0.01}
                                            w="full"
                                        >
                                            <NumberInputField />
                                        </NumberInput>
                                        <InputRightAddon>RON</InputRightAddon>
                                    </InputGroup>
                                    <FormErrorMessage>{errors.unitPrice}</FormErrorMessage>
                                </FormControl>

                                <FormControl isInvalid={!!errors.minOrderQuantity} isRequired>
                                    <FormLabel>Cantitate Minimă Comandă</FormLabel>
                                    <InputGroup>
                                        <NumberInput
                                            value={formData.minOrderQuantity}
                                            onChange={(_, value) => handleChange('minOrderQuantity', value)}
                                            min={1}
                                            w="full"
                                        >
                                            <NumberInputField />
                                        </NumberInput>
                                        <InputRightAddon>
                                            {selectedProduct?.unit || 'buc'}
                                        </InputRightAddon>
                                    </InputGroup>
                                    <FormErrorMessage>{errors.minOrderQuantity}</FormErrorMessage>
                                </FormControl>

                                <FormControl isInvalid={!!errors.deliveryTime} isRequired>
                                    <FormLabel>
                                        <HStack>
                                            <Icon as={FiTruck} />
                                            <Text>Timp Livrare</Text>
                                        </HStack>
                                    </FormLabel>
                                    <InputGroup>
                                        <NumberInput
                                            value={formData.deliveryTime}
                                            onChange={(_, value) => handleChange('deliveryTime', value)}
                                            min={1}
                                            max={365}
                                            w="full"
                                        >
                                            <NumberInputField />
                                        </NumberInput>
                                        <InputRightAddon>zile</InputRightAddon>
                                    </InputGroup>
                                    <FormErrorMessage>{errors.deliveryTime}</FormErrorMessage>
                                </FormControl>
                            </SimpleGrid>

                            <Box mt={4}>
                                <Checkbox
                                    isChecked={formData.isPreferred}
                                    onChange={(e) => handleChange('isPreferred', e.target.checked)}
                                >
                                    <HStack>
                                        <Icon as={FiStar} color="orange.500" />
                                        <Text>Marchează ca furnizor preferat pentru acest produs</Text>
                                    </HStack>
                                </Checkbox>
                                <Text fontSize="sm" color="gray.600" mt={1} ml={6}>
                                    Dacă este bifat, această relație va fi prioritară la comenzi
                                </Text>
                            </Box>
                        </Box>
                    </VStack>
                </ModalBody>

                <ModalFooter gap={3}>
                    <Button variant="ghost" onClick={onClose}>
                        Anulează
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={handleSubmit}
                        isLoading={loading}
                        loadingText="Se adaugă..."
                        isDisabled={!formData.productId || loadingProducts}
                    >
                        Adaugă Produs
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 