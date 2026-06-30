import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    VStack,
    HStack,
    Text,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    IconButton,
    useToast,
    useDisclosure,
    Box,
    Flex,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    SimpleGrid,
    Icon,
    Divider,
    Spinner,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useColorModeValue,
} from '@chakra-ui/react';
import {
    FiPackage,
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiStar,
    FiTruck,
    FiDollarSign,
    FiClock,
    FiMoreVertical,
    FiShoppingCart,
    FiBarChart,
    FiTarget
} from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { Supplier, SupplierProduct, SupplierWithStats } from '../../types/supply';
import { SupplyService } from '../../services/supply/SupplyService';
import AddProductToSupplierModal from './AddProductToSupplierModal';
import EditSupplierProductModal from './EditSupplierProductModal';

interface SupplierProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: Supplier;
}

export default function SupplierProductsModal({
    isOpen,
    onClose,
    supplier
}: SupplierProductsModalProps) {
    const [products, setProducts] = useState<SupplierProduct[]>([]);
    const [supplierStats, setSupplierStats] = useState<SupplierWithStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<SupplierProduct | null>(null);
    const [productToDelete, setProductToDelete] = useState<SupplierProduct | null>(null);
    
    const toast = useToast();
    const cancelRef = useRef<HTMLButtonElement>(null);
    const supplyService = new SupplyService();

    const {
        isOpen: isAddProductOpen,
        onOpen: onAddProductOpen,
        onClose: onAddProductClose
    } = useDisclosure();

    const {
        isOpen: isEditProductOpen,
        onOpen: onEditProductOpen,
        onClose: onEditProductClose
    } = useDisclosure();

    const {
        isOpen: isDeleteAlertOpen,
        onOpen: onDeleteAlertOpen,
        onClose: onDeleteAlertClose
    } = useDisclosure();

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const cardBg = useColorModeValue('gray.50', 'gray.700');
    const hoverBg = useColorModeValue('gray.50', 'gray.700');

    useEffect(() => {
        if (isOpen && supplier.id) {
            loadSupplierData();
        }
    }, [isOpen, supplier.id]);

    const loadSupplierData = async () => {
        try {
            setLoading(true);
            const [productsData, statsData] = await Promise.all([
                supplyService.getSupplierProducts(supplier.id),
                supplyService.getSupplierWithStats(supplier.id)
            ]);
            
            setProducts(productsData);
            setSupplierStats(statsData);
        } catch (error: any) {
            console.error('❌ Error loading supplier data:', error);
            toast({
                title: 'Eroare',
                description: 'Nu s-au putut încărca datele furnizorului.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product: SupplierProduct) => {
        setSelectedProduct(product);
        onEditProductOpen();
    };

    const handleDeleteClick = (product: SupplierProduct) => {
        setProductToDelete(product);
        onDeleteAlertOpen();
    };

    const handleDelete = async () => {
        if (!productToDelete) return;

        try {
            setLoading(true);
            await supplyService.removeProductFromSupplier(supplier.id, productToDelete.id);
            
            toast({
                title: 'Succes',
                description: `Produsul "${productToDelete.product.name}" a fost eliminat cu succes.`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            
            onDeleteAlertClose();
            setProductToDelete(null);
            loadSupplierData(); // Reload data
        } catch (error: any) {
            console.error('Error deleting product:', error);
            toast({
                title: 'Eroare',
                description: error.response?.data?.message || 'Nu s-a putut elimina produsul.',
                status: 'error',
                duration: 7000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleModalSuccess = () => {
        loadSupplierData();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ro-RO', { 
            style: 'currency', 
            currency: 'RON',
            maximumFractionDigits: 2
        }).format(amount);
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
                <ModalOverlay backdropFilter="blur(10px)" />
                <ModalContent borderRadius="xl">
                    <ModalHeader>
                        <HStack>
                            <Icon as={FiPackage} color="blue.500" />
                            <VStack align="start" spacing={1}>
                                <Text>Produse furnizor: {supplier.name}</Text>
                                <Text fontSize="sm" color="gray.600">
                                    Cod: {supplier.code} • {supplier.contact_person}
                                </Text>
                            </VStack>
                        </HStack>
                    </ModalHeader>

                    <ModalBody>
                        <VStack spacing={6}>
                            {/* Statistici */}
                            {supplierStats && (
                                <Box w="full">
                                    <Text fontSize="lg" fontWeight="medium" mb={4}>
                                        📊 Statistici Furnizor
                                    </Text>
                                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
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
                                                    <Text>Produse</Text>
                                                </HStack>
                                            </StatLabel>
                                            <StatNumber color="blue.500">
                                                {supplierStats.statistics.productsCount}
                                            </StatNumber>
                                            <StatHelpText>produse disponibile</StatHelpText>
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
                                                    <Icon as={FiStar} color="orange.500" />
                                                    <Text>Preferate</Text>
                                                </HStack>
                                            </StatLabel>
                                            <StatNumber color="orange.500">
                                                {supplierStats.statistics.preferredProductsCount}
                                            </StatNumber>
                                            <StatHelpText>furnizor preferat</StatHelpText>
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
                                                    <Text>Preț Mediu</Text>
                                                </HStack>
                                            </StatLabel>
                                            <StatNumber color="green.500">
                                                {formatCurrency(supplierStats.statistics.avgUnitPrice)}
                                            </StatNumber>
                                            <StatHelpText>per unitate</StatHelpText>
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
                                                    <Icon as={FiClock} color="purple.500" />
                                                    <Text>Livrare</Text>
                                                </HStack>
                                            </StatLabel>
                                            <StatNumber color="purple.500">
                                                {Math.round(supplierStats.statistics.avgDeliveryTime)} zile
                                            </StatNumber>
                                            <StatHelpText>în medie</StatHelpText>
                                        </Stat>
                                    </SimpleGrid>
                                </Box>
                            )}

                            <Divider />

                            {/* Header pentru lista de produse */}
                            <Flex justify="space-between" align="center" w="full">
                                <Text fontSize="lg" fontWeight="medium">
                                    🛍️ Lista Produselor
                                </Text>
                                <Button
                                    leftIcon={<FiPlus />}
                                    colorScheme="blue"
                                    onClick={onAddProductOpen}
                                    size="sm"
                                    borderRadius="lg"
                                >
                                    Adaugă Produs
                                </Button>
                            </Flex>

                            {/* Lista produselor */}
                            <Box w="full" overflowX="auto">
                                {loading ? (
                                    <Flex justify="center" align="center" py={8}>
                                        <Spinner size="lg" />
                                        <Text ml={4}>Se încarcă produsele...</Text>
                                    </Flex>
                                ) : products.length === 0 ? (
                                    <Box
                                        p={8}
                                        textAlign="center"
                                        bg={cardBg}
                                        borderRadius="lg"
                                        border="2px dashed"
                                        borderColor={borderColor}
                                    >
                                        <Icon as={FiPackage} size={48} color="gray.400" />
                                        <Text mt={4} fontSize="lg" color="gray.500">
                                            Niciun produs asociat
                                        </Text>
                                        <Text color="gray.500" mb={4}>
                                            Adăugați primul produs pentru acest furnizor
                                        </Text>
                                        <Button
                                            leftIcon={<FiPlus />}
                                            colorScheme="blue"
                                            onClick={onAddProductOpen}
                                        >
                                            Adaugă Produs
                                        </Button>
                                    </Box>
                                ) : (
                                    <Table variant="simple" bg={bgColor} borderRadius="lg" overflow="hidden">
                                        <Thead bg={cardBg}>
                                            <Tr>
                                                <Th>Produs</Th>
                                                <Th>Cod Furnizor</Th>
                                                <Th>Preț Unitar</Th>
                                                <Th>Cant. Min.</Th>
                                                <Th>Timp Livrare</Th>
                                                <Th>Status</Th>
                                                <Th>Acțiuni</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {products.map((product) => (
                                                <Tr
                                                    key={product.id}
                                                    _hover={{ bg: hoverBg }}
                                                    transition="background-color 0.2s"
                                                >
                                                    <Td>
                                                        <VStack align="start" spacing={1}>
                                                            <HStack>
                                                                <Text fontWeight="semibold">
                                                                    {product.product.name}
                                                                </Text>
                                                                {product.isPreferred && (
                                                                    <Icon as={FiStar} color="orange.500" />
                                                                )}
                                                            </HStack>
                                                            <Text fontSize="sm" color="gray.600">
                                                                {product.product.code} • {product.product.unit}
                                                            </Text>
                                                            <Text fontSize="xs" color="gray.500">
                                                                Stoc: {product.product.currentStock} {product.product.unit}
                                                            </Text>
                                                        </VStack>
                                                    </Td>
                                                    <Td>
                                                        <Text fontFamily="mono" fontSize="sm">
                                                            {product.supplierCode || '-'}
                                                        </Text>
                                                    </Td>
                                                    <Td>
                                                        <VStack align="start" spacing={1}>
                                                            <Text fontWeight="semibold" color="green.600">
                                                                {formatCurrency(product.unitPrice)}
                                                            </Text>
                                                            <Text fontSize="xs" color="gray.500">
                                                                Default: {formatCurrency(product.product.defaultPrice)}
                                                            </Text>
                                                        </VStack>
                                                    </Td>
                                                    <Td>
                                                        <Text>{product.minOrderQuantity} {product.product.unit}</Text>
                                                    </Td>
                                                    <Td>
                                                        <HStack>
                                                            <Icon as={FiTruck} size={14} />
                                                            <Text>{product.deliveryTime} zile</Text>
                                                        </HStack>
                                                    </Td>
                                                    <Td>
                                                        <HStack spacing={2}>
                                                            {product.isPreferred && (
                                                                <Badge colorScheme="orange" size="sm">
                                                                    Preferat
                                                                </Badge>
                                                            )}
                                                            <Badge 
                                                                colorScheme={product.isActive ? "green" : "red"} 
                                                                size="sm"
                                                            >
                                                                {product.isActive ? "Activ" : "Inactiv"}
                                                            </Badge>
                                                        </HStack>
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
                                                                    icon={<FiEdit2 />}
                                                                    onClick={() => handleEdit(product)}
                                                                >
                                                                    Editează
                                                                </MenuItem>
                                                                <MenuItem
                                                                    icon={<FiTrash2 />}
                                                                    color="red.500"
                                                                    onClick={() => handleDeleteClick(product)}
                                                                >
                                                                    Elimină
                                                                </MenuItem>
                                                            </MenuList>
                                                        </Menu>
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                )}
                            </Box>
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button onClick={onClose}>Închide</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Modal pentru adăugarea produsului */}
            <AddProductToSupplierModal
                isOpen={isAddProductOpen}
                onClose={onAddProductClose}
                supplier={supplier}
                onSuccess={handleModalSuccess}
            />

            {/* Modal pentru editarea produsului */}
            {selectedProduct && (
                <EditSupplierProductModal
                    isOpen={isEditProductOpen}
                    onClose={onEditProductClose}
                    supplier={supplier}
                    supplierProduct={selectedProduct}
                    onSuccess={handleModalSuccess}
                />
            )}

            {/* Alert Dialog pentru ștergere */}
            <AlertDialog
                isOpen={isDeleteAlertOpen}
                leastDestructiveRef={cancelRef}
                onClose={onDeleteAlertClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Elimină Produs
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Ești sigur că vrei să elimini produsul{' '}
                            <strong>{productToDelete?.product.name}</strong>{' '}
                            de la furnizorul {supplier.name}?
                            <Text mt={2} color="red.500">
                                Această acțiune nu poate fi anulată.
                            </Text>
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onDeleteAlertClose}>
                                Anulează
                            </Button>
                            <Button
                                colorScheme="red"
                                onClick={handleDelete}
                                ml={3}
                                isLoading={loading}
                            >
                                Elimină
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </>
    );
} 