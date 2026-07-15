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
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Progress,
  ButtonGroup,
} from '@chakra-ui/react';
import {
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiSearch,
  FiFilter,
    FiRefreshCw,
  FiMoreVertical,
  FiPackage,
  FiBarChart,
  FiTrendingUp,
  FiAlertTriangle,
  FiCheck,
  FiTruck,
} from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Product, StockStatus } from '../../types/supply';
import { SupplyService } from '../../services/supply/SupplyService';
import ProductFormModal from './ProductFormModal';

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

export default function ProductList() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const { user } = useAuth();
    const toast = useToast();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const supplyService = new SupplyService();

  const {
    isOpen: isFormOpen,
    onOpen: onFormOpen,
    onClose: onFormClose
  } = useDisclosure();

  const {
    isOpen: isDeleteAlertOpen,
    onOpen: onDeleteAlertOpen,
    onClose: onDeleteAlertClose
  } = useDisclosure();

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const pendingBadgeBg = useColorModeValue('orange.100', 'orange.700');
  const pendingBadgeColor = useColorModeValue('orange.800', 'white');
  const pendingTextColor = useColorModeValue('orange.700', 'orange.200');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (page: number = 1) => {
        try {
            setLoading(true);
      const response = await supplyService.getProducts(page, 10);
      setProducts(response.data);
      setPagination(response.pagination);
      setCurrentPage(page);
        } catch (error) {
            console.error('Error loading products:', error);
            toast({
                title: 'Eroare',
        description: 'Nu s-au putut încărca produsele.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

  const getStockStatus = (product: Product): { color: string; text: string; icon: any } => {
    const status = product.stock_status || 'OK';
    switch (status) {
      case 'EMPTY':
        return { color: 'red', text: 'Stoc Epuizat', icon: FiAlertTriangle };
      case 'LOW':
        return { color: 'orange', text: 'Stoc Minim', icon: FiAlertTriangle };
      case 'EXCESS':
        return { color: 'blue', text: 'Stoc Excesiv', icon: FiTrendingUp };
      default:
        return { color: 'green', text: 'Stoc OK', icon: FiCheck };
    }
  };

  const getStockPercentage = (product: Product) => {
    const maxStock = product.max_stock || 1000;
    const currentStock = product.current_stock || 0;
    return Math.min((currentStock / maxStock) * 100, 100);
    };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter ? product.category_name === categoryFilter : true;
    const matchesStatus = statusFilter ? product.stock_status === statusFilter : true;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDelete = async (product: Product) => {
    try {
      setLoading(true);
      
      // Verific dacă produsul are stoc
      if (product.current_stock && product.current_stock > 0) {
        toast({
          title: 'Atenție!',
          description: `Nu se poate șterge produsul "${product.name}" deoarece are ${product.current_stock} ${product.unit} în stoc. Vă rugăm să goliți stocul mai întâi.`,
          status: 'warning',
          duration: 7000,
          isClosable: true,
        });
        onDeleteAlertClose();
        setProductToDelete(null);
            return;
        }

      await supplyService.deleteProduct(product.id);
      
            toast({
                title: 'Succes',
        description: 'Produsul a fost șters cu succes.',
                status: 'success',
        duration: 5000,
                isClosable: true,
            });
      
      onDeleteAlertClose();
      setProductToDelete(null);
      loadProducts(currentPage); // Reload data
    } catch (error: any) {
            console.error('Error deleting product:', error);
            toast({
                title: 'Eroare',
        description: error.response?.data?.message || 'Nu s-a putut șterge produsul.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
    } finally {
      setLoading(false);
        }
    };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    onFormOpen();
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    onFormOpen();
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    onDeleteAlertOpen();
  };

  const handleModalSuccess = () => {
    loadProducts(currentPage);
  };

  const categories = [...new Set(products.map(p => p.category_name).filter(Boolean))];
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const lowStockProducts = products.filter(p => p.stock_status === 'LOW' || p.stock_status === 'EMPTY').length;
  const totalValue = products.reduce((sum, p) => sum + ((p.current_stock || 0) * (p.unit_price || 0)), 0);

    return (
    <>
      <Box bg={bgColor} p={6} borderRadius="xl" shadow="xl" border="1px solid" borderColor={borderColor}>
        {/* Header */}
        <Flex justify="space-between" align="center" mb={6}>
          <Text fontSize="2xl" fontWeight="bold">
                    Produse
                </Text>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="brand"
            onClick={handleAdd}
            size="lg"
            borderRadius="xl"
          >
            Adaugă Produs
          </Button>
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
                <Text>Total Produse</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="blue.500">{totalProducts}</StatNumber>
            <StatHelpText>În catalog</StatHelpText>
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
                <Icon as={FiCheck} color="green.500" />
                <Text>Produse Active</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="green.500">{activeProducts}</StatNumber>
            <StatHelpText>Disponibile</StatHelpText>
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
                <Text>Stoc Minim</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="orange.500">{lowStockProducts}</StatNumber>
            <StatHelpText>Necesită reaprovizionare</StatHelpText>
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
                <Icon as={FiBarChart} color="purple.500" />
                <Text>Valoare Stoc</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="purple.500">
              {new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(totalValue)}
            </StatNumber>
            <StatHelpText>Valoare totală</StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Filtre */}
        <Flex gap={4} mb={6}>
          <InputGroup size="lg" flex={1}>
                        <InputLeftElement pointerEvents="none">
                            <Icon as={FiSearch} color="gray.400" />
                        </InputLeftElement>
                        <Input
              placeholder="Caută după nume, cod sau descriere..."
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
            onClick={() => loadProducts(currentPage)}
                        isLoading={loading}
          />
        </Flex>

        {/* Tabel Produse */}
        <Box overflowX="auto">
          {filteredProducts.length === 0 ? (
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
                Niciun produs găsit
              </Text>
              <Text color={textColor}>
                {searchTerm || categoryFilter || statusFilter
                  ? 'Încercați să modificați criteriile de căutare'
                  : 'Adăugați primul produs pentru a începe'
                }
              </Text>
              {!searchTerm && !categoryFilter && !statusFilter && (
                    <Button
                  mt={4}
                  leftIcon={<FiPlus />}
                  colorScheme="brand"
                  onClick={handleAdd}
                    >
                        Adaugă Produs
                    </Button>
              )}
            </Box>
          ) : (
            <Table variant="simple" bg={bgColor} borderRadius="lg" overflow="hidden">
              <Thead bg={cardBg}>
                    <Tr>
                  <Th>Cod & Nume</Th>
                        <Th>Categorie</Th>
                        <Th>Stoc Curent</Th>
                  <Th>Status Stoc</Th>
                  <Th>Preț Unitar</Th>
                  <Th>Furnizor</Th>
                        <Th>Status</Th>
                        <Th>Acțiuni</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {filteredProducts.map((product) => {
                        const stockStatus = getStockStatus(product);
                  const stockPercentage = getStockPercentage(product);
                  
                        return (
                    <Tr
                      key={product.id}
                      _hover={{ bg: hoverBg }}
                      transition="background-color 0.2s"
                    >
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold">{product.name}</Text>
                          <Text fontSize="sm" color={textColor}>
                            {product.code}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Badge colorScheme="purple" px={2} py={1}>
                          {product.category_name || 'Necategorizat'}
                        </Badge>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Text fontWeight="semibold">
                              {product.current_stock || 0} {product.unit}
                            </Text>
                            {Number(product.pending_delivery) > 0 && (
                              <Badge bg={pendingBadgeBg} color={pendingBadgeColor} display="flex" alignItems="center" gap={1} px={2}>
                                <Icon as={FiTruck} boxSize={3} />
                                +{product.pending_delivery} în curs
                              </Badge>
                            )}
                          </HStack>
                          {Number(product.pending_delivery) > 0 && product.next_delivery_date && (
                            <Text fontSize="xs" color={pendingTextColor}>
                              Livrare estimată: {new Date(product.next_delivery_date).toLocaleDateString('ro-RO')}
                            </Text>
                          )}
                          <Progress
                            value={stockPercentage}
                            size="sm"
                            colorScheme={stockStatus.color}
                            w="80px"
                          />
                        </VStack>
                      </Td>
                                <Td>
                        <Badge
                          colorScheme={stockStatus.color}
                          px={2}
                          py={1}
                          borderRadius="full"
                        >
                          <HStack spacing={1}>
                            <stockStatus.icon size={12} />
                            <Text>{stockStatus.text}</Text>
                          </HStack>
                        </Badge>
                      </Td>
                      <Td fontWeight="semibold">
                        {new Intl.NumberFormat('ro-RO', {
                          style: 'currency',
                          currency: 'RON'
                        }).format(product.unit_price || 0)}
                      </Td>
                      <Td>-</Td>
                      <Td>
                        <Badge
                          colorScheme={product.is_active ? 'green' : 'red'}
                          px={2}
                          py={1}
                          borderRadius="full"
                        >
                          {product.is_active ? 'Activ' : 'Inactiv'}
                                    </Badge>
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
                                            Șterge
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
              onClick={() => loadProducts(currentPage - 1)}
              isDisabled={!pagination.hasPrev}
              variant="outline"
            >
              Anterior
            </Button>
            
            <ButtonGroup isAttached variant="outline">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  onClick={() => loadProducts(page)}
                  colorScheme={page === currentPage ? "brand" : "gray"}
                  variant={page === currentPage ? "solid" : "outline"}
                >
                  {page}
                </Button>
              ))}
            </ButtonGroup>

            <Button
              onClick={() => loadProducts(currentPage + 1)}
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

      {/* Modal Formular */}
            <ProductFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
                product={selectedProduct}
        onSuccess={handleModalSuccess}
      />

      {/* Alert Dialog pentru ștergere */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Șterge Produs
            </AlertDialogHeader>

            <AlertDialogBody>
              Ești sigur că vrei să ștergi produsul{' '}
              <strong>{productToDelete?.name}</strong>?
              {productToDelete?.current_stock && productToDelete.current_stock > 0 && (
                <Text mt={2} color="orange.500" fontWeight="semibold">
                  ⚠️ Atenție: Produsul are {productToDelete.current_stock} {productToDelete.unit} în stoc!
                </Text>
              )}
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
                onClick={() => productToDelete && handleDelete(productToDelete)}
                ml={3}
                isLoading={loading}
              >
                Șterge
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
    );
} 