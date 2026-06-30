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
    VStack,
    SimpleGrid,
    useToast,
    FormErrorMessage,
    Checkbox,
    NumberInput,
    NumberInputField,
    Box,
    Text,
    HStack,
    Icon,
    Badge,
    Divider,
    InputGroup,
    InputRightAddon,
} from '@chakra-ui/react';
import { FiPackage, FiDollarSign, FiTruck, FiHash, FiStar, FiEdit2 } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { Supplier, SupplierProduct, UpdateSupplierProductRequest } from '../../types/supply';
import { SupplyService } from '../../services/supply/SupplyService';

interface EditSupplierProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: Supplier;
    supplierProduct: SupplierProduct;
    onSuccess: () => void;
}

export default function EditSupplierProductModal({
    isOpen,
    onClose,
    supplier,
    supplierProduct,
    onSuccess,
}: EditSupplierProductModalProps) {
    const [formData, setFormData] = useState<UpdateSupplierProductRequest>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    
    const toast = useToast();
    const supplyService = new SupplyService();

    useEffect(() => {
        if (isOpen && supplierProduct) {
            setFormData({
                supplierCode: supplierProduct.supplierCode || '',
                unitPrice: supplierProduct.unitPrice,
                minOrderQuantity: supplierProduct.minOrderQuantity,
                deliveryTime: supplierProduct.deliveryTime,
                isPreferred: supplierProduct.isPreferred,
            });
            setErrors({});
        }
    }, [isOpen, supplierProduct]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (formData.unitPrice !== undefined && formData.unitPrice <= 0) {
            newErrors.unitPrice = 'Prețul unitar trebuie să fie pozitiv';
        }

        if (formData.minOrderQuantity !== undefined && formData.minOrderQuantity <= 0) {
            newErrors.minOrderQuantity = 'Cantitatea minimă trebuie să fie pozitivă';
        }

        if (formData.deliveryTime !== undefined && formData.deliveryTime <= 0) {
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
            await supplyService.updateSupplierProduct(supplier.id, supplierProduct.id, formData);
            
            toast({
                title: 'Succes',
                description: `Relația pentru produsul "${supplierProduct.product.name}" a fost actualizată cu succes.`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error updating supplier product:', error);
            toast({
                title: 'Eroare',
                description: error.response?.data?.message || 'Nu s-a putut actualiza relația furnizor-produs.',
                status: 'error',
                duration: 7000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof UpdateSupplierProductRequest, value: any) => {
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
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ro-RO', { 
            style: 'currency', 
            currency: 'RON',
            maximumFractionDigits: 2
        }).format(amount);
    };

    if (!supplierProduct) {
        return null;
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
            <ModalOverlay backdropFilter="blur(10px)" />
            <ModalContent borderRadius="xl">
                <ModalHeader>
                    <HStack>
                        <Icon as={FiEdit2} color="blue.500" />
                        <VStack align="start" spacing={1}>
                            <Text>Editare Relație Furnizor-Produs</Text>
                            <Text fontSize="sm" color="gray.600">
                                {supplier.name} • {supplierProduct.product.name}
                            </Text>
                        </VStack>
                    </HStack>
                </ModalHeader>

                <ModalBody>
                    <VStack spacing={6}>
                        {/* Informații produs */}
                        <Box w="full">
                            <Text fontSize="lg" fontWeight="medium" mb={4}>
                                📦 Informații Produs
                            </Text>
                            
                            <Box
                                p={4}
                                bg="blue.50"
                                borderRadius="lg"
                                border="1px solid"
                                borderColor="blue.200"
                            >
                                <HStack justify="space-between" mb={2}>
                                    <Text fontWeight="semibold" color="blue.800">
                                        {supplierProduct.product.name}
                                    </Text>
                                    <HStack spacing={2}>
                                        {supplierProduct.product.categoryName && (
                                            <Badge colorScheme="blue">
                                                {supplierProduct.product.categoryName}
                                            </Badge>
                                        )}
                                        {supplierProduct.isPreferred && (
                                            <Badge colorScheme="orange">
                                                <HStack spacing={1}>
                                                    <Icon as={FiStar} size={12} />
                                                    <Text>Preferat</Text>
                                                </HStack>
                                            </Badge>
                                        )}
                                    </HStack>
                                </HStack>
                                <SimpleGrid columns={4} spacing={4} fontSize="sm" color="blue.700">
                                    <Text><strong>Cod:</strong> {supplierProduct.product.code}</Text>
                                    <Text><strong>Unitate:</strong> {supplierProduct.product.unit}</Text>
                                    <Text><strong>Stoc actual:</strong> {supplierProduct.product.currentStock} {supplierProduct.product.unit}</Text>
                                    <Text><strong>Preț default:</strong> {formatCurrency(supplierProduct.product.defaultPrice)}</Text>
                                </SimpleGrid>
                            </Box>
                        </Box>

                        <Divider />

                        {/* Detalii comerciale editabile */}
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
                                        value={formData.supplierCode || ''}
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
                                            value={formData.unitPrice || 0}
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
                                    <Text fontSize="xs" color="gray.600" mt={1}>
                                        Preț actual: {formatCurrency(supplierProduct.unitPrice)}
                                    </Text>
                                </FormControl>

                                <FormControl isInvalid={!!errors.minOrderQuantity} isRequired>
                                    <FormLabel>Cantitate Minimă Comandă</FormLabel>
                                    <InputGroup>
                                        <NumberInput
                                            value={formData.minOrderQuantity || 1}
                                            onChange={(_, value) => handleChange('minOrderQuantity', value)}
                                            min={1}
                                            w="full"
                                        >
                                            <NumberInputField />
                                        </NumberInput>
                                        <InputRightAddon>
                                            {supplierProduct.product.unit}
                                        </InputRightAddon>
                                    </InputGroup>
                                    <FormErrorMessage>{errors.minOrderQuantity}</FormErrorMessage>
                                    <Text fontSize="xs" color="gray.600" mt={1}>
                                        Cantitate actuală: {supplierProduct.minOrderQuantity} {supplierProduct.product.unit}
                                    </Text>
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
                                            value={formData.deliveryTime || 5}
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
                                    <Text fontSize="xs" color="gray.600" mt={1}>
                                        Timp actual: {supplierProduct.deliveryTime} zile
                                    </Text>
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
                                {supplierProduct.isPreferred && !formData.isPreferred && (
                                    <Text fontSize="xs" color="orange.600" mt={1} ml={6}>
                                        ⚠️ Acest furnizor este în prezent marcat ca preferat
                                    </Text>
                                )}
                            </Box>
                        </Box>

                        {/* Informații suplimentare */}
                        <Box w="full">
                            <Text fontSize="lg" fontWeight="medium" mb={4}>
                                📊 Informații Suplimentare
                            </Text>
                            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                                <Box p={3} bg="gray.50" borderRadius="md">
                                    <Text fontSize="sm" color="gray.600">Adăugat la</Text>
                                    <Text fontWeight="semibold">
                                        {new Date(supplierProduct.createdAt).toLocaleDateString('ro-RO')}
                                    </Text>
                                </Box>
                                <Box p={3} bg="gray.50" borderRadius="md">
                                    <Text fontSize="sm" color="gray.600">Ultima modificare</Text>
                                    <Text fontWeight="semibold">
                                        {new Date(supplierProduct.updatedAt).toLocaleDateString('ro-RO')}
                                    </Text>
                                </Box>
                                <Box p={3} bg="gray.50" borderRadius="md">
                                    <Text fontSize="sm" color="gray.600">Status</Text>
                                    <Badge colorScheme={supplierProduct.isActive ? "green" : "red"}>
                                        {supplierProduct.isActive ? "Activ" : "Inactiv"}
                                    </Badge>
                                </Box>
                            </SimpleGrid>
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
                        loadingText="Se salvează..."
                    >
                        Salvează Modificările
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 