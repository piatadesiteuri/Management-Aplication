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
  FiPhone,
  FiMail,
  FiMapPin,
  FiUser,
  FiTruck,
  FiPackage,
  FiDollarSign,
} from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Supplier, SupplierStatus } from '../../types/supply';
import { SupplyService } from '../../services/supply/SupplyService';
import SupplierFormModal from './SupplierFormModal';
import SupplierProductsModal from './SupplierProductsModal';

const statusColors = {
  ACTIVE: 'green',
  INACTIVE: 'red',
  PENDING: 'orange',
};

const statusNames = {
  ACTIVE: 'Activ',
  INACTIVE: 'Inactiv',
  PENDING: 'În așteptare',
};

export default function SupplierList() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
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

  const {
    isOpen: isProductsModalOpen,
    onOpen: onProductsModalOpen,
    onClose: onProductsModalClose
  } = useDisclosure();

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    console.log('🏪 SupplierList mounted, loading suppliers...');
    loadSuppliers();
  }, []);

    const loadSuppliers = async (page: number = 1) => {
        try {
            console.log('🔄 Loading suppliers, page:', page);
            setLoading(true);
      const response = await supplyService.getSuppliers(page, 10);
      console.log('✅ Suppliers loaded successfully:', response);
      setSuppliers(response.data);
      setPagination(response.pagination);
      setCurrentPage(page);
        } catch (error) {
            console.error('❌ Error loading suppliers:', error);
            toast({
                title: 'Eroare',
        description: 'Nu s-au putut încărca furnizorii.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contact_person && supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter ? supplier.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (supplier: Supplier) => {
    try {
      setLoading(true);
      await supplyService.deleteSupplier(supplier.id);
      
            toast({
                title: 'Succes',
        description: 'Furnizorul a fost șters cu succes.',
                status: 'success',
        duration: 5000,
                isClosable: true,
            });
      onDeleteAlertClose();
      setSupplierToDelete(null);
      loadSuppliers(currentPage); // Reload data
    } catch (error: any) {
            console.error('Error deleting supplier:', error);
      const errorMessage = error.response?.data?.message || 'Nu s-a putut șterge furnizorul.';
      
            toast({
                title: 'Eroare',
        description: errorMessage,
                status: 'error',
        duration: 7000,
                isClosable: true,
            });
      onDeleteAlertClose();
      setSupplierToDelete(null);
    } finally {
      setLoading(false);
        }
    };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    onFormOpen();
  };

  const handleAdd = () => {
    setSelectedSupplier(null);
    onFormOpen();
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    onDeleteAlertOpen();
  };

  const handleViewProducts = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    onProductsModalOpen();
  };

  const handleModalSuccess = () => {
    loadSuppliers(currentPage);
  };

  // Calculate statistics
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.status === 'ACTIVE').length;
  const totalValue = suppliers.reduce((sum, s) => sum + (parseFloat(s.total_value?.toString() || '0') || 0), 0);
  const pendingSuppliers = suppliers.filter(s => s.status === 'PENDING').length;

    return (
    <>
      <Box bg={bgColor} p={6} borderRadius="xl" shadow="xl" border="1px solid" borderColor={borderColor}>
        
        {/* Header */}
        <Flex justify="space-between" align="center" mb={6}>
          <Text fontSize="2xl" fontWeight="bold">
                    Furnizori
                </Text>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={handleAdd}
            size="lg"
            borderRadius="xl"
            bg="blue.500"
            color="white"
            _hover={{ bg: "blue.600" }}
          >
            Adaugă Furnizor
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
                <Icon as={FiUser} color="blue.500" />
                <Text>Total Furnizori</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="blue.500">{totalSuppliers}</StatNumber>
            <StatHelpText>Înregistrați în sistem</StatHelpText>
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
                <Icon as={FiTruck} color="green.500" />
                <Text>Furnizori Activi</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="green.500">{activeSuppliers}</StatNumber>
            <StatHelpText>Disponibili pentru comenzi</StatHelpText>
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
                <Icon as={FiDollarSign} color="purple.500" />
                <Text>Valoare Totală</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="purple.500">
              {new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(totalValue)}
            </StatNumber>
            <StatHelpText>Din comenzi procesate</StatHelpText>
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
                <Icon as={FiPackage} color="orange.500" />
                <Text>În Așteptare</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="orange.500">{pendingSuppliers}</StatNumber>
            <StatHelpText>Furnizori de aprobat</StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Bara de căutare și filtre */}
        <Flex gap={4} mb={6}>
          <InputGroup size="lg" flex={1}>
                        <InputLeftElement pointerEvents="none">
                            <Icon as={FiSearch} color="gray.400" />
                        </InputLeftElement>
                        <Input
              placeholder="Caută după nume, persoană contact sau email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              size="lg"
              borderRadius="xl"
                        />
                    </InputGroup>
          <Select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            size="lg"
            borderRadius="xl"
            w="200px"
            icon={<FiFilter />}
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
                        onClick={() => loadSuppliers(currentPage)}
                        isLoading={loading}
          />
        </Flex>

        {/* Tabel Furnizori */}
        <Box overflowX="auto">
          {filteredSuppliers.length === 0 ? (
            <Box
              p={8}
              textAlign="center"
              bg={cardBg}
              borderRadius="lg"
              border="2px dashed"
              borderColor={borderColor}
            >
              <FiUser size={48} color="gray" />
              <Text mt={4} fontSize="lg" color={textColor}>
                Niciun furnizor găsit
              </Text>
              <Text color={textColor}>
                {searchTerm || statusFilter 
                  ? 'Încercați să modificați criteriile de căutare'
                  : 'Adăugați primul furnizor pentru a începe'
                }
              </Text>
              {!searchTerm && !statusFilter && (
                    <Button
                  mt={4}
                  leftIcon={<FiPlus />}
                  colorScheme="brand"
                  onClick={handleAdd}
                    >
                        Adaugă Furnizor
                    </Button>
              )}
            </Box>
          ) : (
            <Table variant="simple" bg={bgColor} borderRadius="lg" overflow="hidden">
              <Thead bg={cardBg}>
                    <Tr>
                  <Th>Nume Furnizor</Th>
                        <Th>Persoană Contact</Th>
                  <Th>Contact</Th>
                  <Th>Locație</Th>
                        <Th>Status</Th>
                  <Th>Comenzi</Th>
                  <Th>Valoare</Th>
                        <Th>Acțiuni</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {filteredSuppliers.map((supplier) => (
                  <Tr
                    key={supplier.id}
                    _hover={{ bg: hoverBg }}
                    transition="background-color 0.2s"
                  >
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold">{supplier.name}</Text>
                        <Text fontSize="sm" color={textColor}>
                          {supplier.tax_number || supplier.code}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <HStack>
                        <Icon as={FiUser} color="brand.500" />
                        <Text>{supplier.contact_person || '-'}</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        {supplier.phone && (
                          <HStack>
                            <Icon as={FiPhone} size={12} />
                            <Text fontSize="sm">{supplier.phone}</Text>
                          </HStack>
                        )}
                        {supplier.email && (
                          <HStack>
                            <Icon as={FiMail} size={12} />
                            <Text fontSize="sm">{supplier.email}</Text>
                          </HStack>
                        )}
                      </VStack>
                    </Td>
                    <Td>
                      <HStack>
                        <Icon as={FiMapPin} size={14} />
                        <Text>{supplier.city || '-'}</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={statusColors[supplier.status]}
                        px={3}
                        py={1}
                        borderRadius="full"
                      >
                        {statusNames[supplier.status]}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontWeight="semibold">{supplier.total_orders || 0}</Text>
                    </Td>
                    <Td>
                      <Text fontWeight="semibold">
                        {new Intl.NumberFormat('ro-RO', { 
                          style: 'currency', 
                          currency: 'RON',
                          maximumFractionDigits: 0
                        }).format(parseFloat(supplier.total_value?.toString() || '0') || 0)}
                                </Text>
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
                            icon={<FiPackage />}
                            onClick={() => handleViewProducts(supplier)}
                          >
                            Gestionează Produse
                          </MenuItem>
                          <MenuItem
                            icon={<FiEdit2 />}
                            onClick={() => handleEdit(supplier)}
                                    >
                                        Editează
                          </MenuItem>
                          <MenuItem
                            icon={<FiTrash2 />}
                            color="red.500"
                            onClick={() => handleDeleteClick(supplier)}
                                    >
                                        Șterge
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

        {/* Paginare */}
        {pagination && pagination.totalPages > 1 && (
          <Flex justify="center" align="center" mt={6} gap={4}>
            <Button
              onClick={() => loadSuppliers(currentPage - 1)}
              isDisabled={!pagination.hasPrev}
              variant="outline"
            >
              Anterior
            </Button>
            
            <ButtonGroup isAttached variant="outline">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  onClick={() => loadSuppliers(page)}
                  colorScheme={page === currentPage ? "brand" : "gray"}
                  variant={page === currentPage ? "solid" : "outline"}
                >
                  {page}
                </Button>
              ))}
            </ButtonGroup>

            <Button
              onClick={() => loadSuppliers(currentPage + 1)}
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
      <SupplierFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
        supplier={selectedSupplier}
        onSuccess={handleModalSuccess}
      />

      {/* Modal pentru gestionarea produselor */}
      {selectedSupplier && (
        <SupplierProductsModal
          isOpen={isProductsModalOpen}
          onClose={onProductsModalClose}
          supplier={selectedSupplier}
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
              Șterge Furnizor
            </AlertDialogHeader>

            <AlertDialogBody>
              Ești sigur că vrei să ștergi furnizorul{' '}
              <strong>{supplierToDelete?.name}</strong>?
              <Text mt={2} color="red.500">
                Această acțiune nu poate fi anulată.
              </Text>
              <Text mt={2} color="orange.500" fontSize="sm">
                ⚠️ Dacă furnizorul are comenzi asociate, ștergerea nu va fi posibilă.
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteAlertClose}>
                Anulează
              </Button>
              <Button
                colorScheme="red"
                onClick={() => supplierToDelete && handleDelete(supplierToDelete)}
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