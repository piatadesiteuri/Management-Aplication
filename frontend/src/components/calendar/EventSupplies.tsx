import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Select,
  FormControl,
  FormLabel,
  useToast,
  Badge,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Heading,
  Icon,
  Flex,
  Card,
  CardBody,
  CardHeader,
  Textarea,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Tooltip,
  Progress,
  FormErrorMessage,
  ModalFooter
} from '@chakra-ui/react';
import { 
  FiPackage, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiDollarSign,
  FiAlertTriangle,
  FiInfo,
  FiSave,
  FiRefreshCw,
  FiClock,
  FiBox,
  FiX,
  FiTrendingUp,
  FiCheckCircle,
  FiEdit3,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);
const MotionCard = motion(Card);
const MotionButton = motion(Button);

interface EventSuppliesProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventStatus: string;
  isOpen: boolean;
  onClose: () => void;
  canEdit: boolean;
}

interface Material {
  id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  product_unit: string;
  product_unit_price: number;
  product_current_stock: number;
  product_category_name: string;
  quantity: number;
  unit_cost: number;
  notes: string;
  operation_type: string;
  status: string;
  created_at: string;
  created_by_name: string;
}

interface Product {
  id: string;
  name: string;
  code: string;
  unit: string;
  unit_price: number;
  current_stock: number;
  category_name: string;
}

export default function EventSupplies({
  eventId,
  eventTitle,
  eventDate,
  eventStatus,
  isOpen,
  onClose,
  canEdit
}: EventSuppliesProps) {
  
  const [supplies, setSupplies] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // New state variables for modals
  const [isStockDetailsModalOpen, setIsStockDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  
  // State pentru formularul de adăugare material
  const [newMaterial, setNewMaterial] = useState({
    productId: '',
    quantity: 1,
    notes: ''
  });

  // State pentru produsele disponibile
  const [availableProducts, setAvailableProducts] = useState<Array<{
    id: number;
    name: string;
    code: string;
    unit: string;
    unit_price: number;
    current_stock: number;
    category_name: string;
  }>>([]);

  // State pentru produsul selectat (pentru calculul costului)
  const [selectedProduct, setSelectedProduct] = useState<{
    id: number;
    name: string;
    code: string;
    unit: string;
    unit_price: number;
    current_stock: number;
    category_name: string;
  } | null>(null);

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllData(); // Un singur call pentru toate datele
      setCurrentPage(1); // Reset to first page when modal opens
    }
  }, [isOpen, eventId]);

  // Funcție optimizată care încarcă toate datele necesare într-un mod eficient
  const loadAllData = async () => {
    try {
      console.log('🔍 Loading all data for event:', eventId);
      setLoading(true);
      
      // Încărcăm materialele evenimentului folosind API service cu token management automat
      const materialsResponse = await api.get(`/calendar/events/${eventId}/materials`);
      const materialsData = materialsResponse.data;
      console.log('📦 Loaded materials data:', materialsData);
      
      // Transformăm materialele pentru UI
      const transformedSupplies = materialsData.map((material: any) => ({
        id: material.id?.toString() || '',
        product_id: material.product_id?.toString() || '',
        product_name: material.product_name || 'Produs necunoscut',
        product_code: material.product_code || '',
        product_unit: material.product_unit || 'buc',
        product_unit_price: parseFloat(material.product_unit_price) || 0,
        product_current_stock: parseInt(material.product_current_stock) || 0,
        product_category_name: material.product_category_name || '',
        quantity: parseInt(material.quantity) || 0,
        unit_cost: parseFloat(material.unit_cost) || 0,
        notes: material.notes || '',
        operation_type: material.operation_type || 'MOVEMENT',
        status: material.status || 'PLANNED',
        created_at: material.created_at || '',
        created_by_name: material.created_by_name || ''
      }));
      
      setSupplies(transformedSupplies);
      console.log('✅ Successfully loaded materials:', transformedSupplies.length);

      // Încărcăm produsele doar dacă utilizatorul poate edita (pentru dropdown-ul de adăugare)
      if (canEdit) {
        try {
          const productsResponse = await api.get('/supply/products?limit=1000');
          const productsData = productsResponse.data.data || productsResponse.data || [];
          setProducts(productsData);
          console.log('✅ Successfully loaded products for editing:', productsData.length);
        } catch (productsError) {
          console.warn('⚠️ Could not load products (non-critical for view-only):', productsError);
          setProducts([]);
        }
      }
      
    } catch (error) {
      console.error('❌ Error loading event materials:', error);
      setSupplies([]);
      setProducts([]);
      
      toast({
        title: 'Eroare la încărcare',
        description: 'Nu s-au putut încărca materialele evenimentului. Verificați conexiunea.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Încărcăm produsele disponibile folosind API service
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/supply/products?page=1&limit=100');
        const productsData = response.data.data || response.data || [];
        console.log('📦 Available products loaded:', productsData);
        setAvailableProducts(productsData);
      } catch (error) {
        console.error('❌ Error loading products:', error);
        setAvailableProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  // Handler pentru schimbarea produsului selectat
  const handleProductChange = (productId: string) => {
    setNewMaterial(prev => ({ ...prev, productId }));
    
    if (productId) {
      const product = availableProducts.find(p => p.id.toString() === productId);
      setSelectedProduct(product || null);
    } else {
      setSelectedProduct(null);
    }
  };

  // Calculăm costul total
  const totalCost = selectedProduct ? (selectedProduct.unit_price || 0) * (newMaterial.quantity || 1) : 0;

  const handleAddMaterial = async () => {
    if (!newMaterial.productId || newMaterial.quantity <= 0) {
      toast({
        title: 'Date invalide',
        description: 'Selectați un produs și introduceți o cantitate validă.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSaving(true);
      
      await api.post(`/calendar/events/${eventId}/materials`, {
        productId: newMaterial.productId,
        quantity: newMaterial.quantity,
        unitCost: selectedProduct?.unit_price || 0, // Costul unitar este prețul produsului
        notes: newMaterial.notes,
        priority: 'MEDIUM' // Prioritatea este fixată la MEDIUM
      });

      toast({
        title: 'Material adăugat cu succes! 🎉',
        description: 'Materialul a fost adăugat la eveniment.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setNewMaterial({
        productId: '',
        quantity: 1,
        notes: ''
      });
      setSelectedProduct(null); // Resetăm produsul selectat
      loadAllData();
      
    } catch (error) {
      console.error('❌ Error adding material:', error);
      toast({
        title: 'Eroare la adăugare',
        description: 'Nu s-a putut adăuga materialul.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMaterial = async (materialId: string, updates: any) => {
    try {
      setSaving(true);
      
      await api.put(`/calendar/events/${eventId}/materials/${materialId}`, updates);

      toast({
        title: 'Material actualizat! ✅',
        description: 'Modificările au fost salvate.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setEditingId(null);
      loadAllData();
      
    } catch (error) {
      console.error('❌ Error updating material:', error);
      toast({
        title: 'Eroare la actualizare',
        description: 'Nu s-au putut salva modificările.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      setSaving(true);
      await api.delete(`/calendar/events/${eventId}/materials/${materialId}`);
      
      toast({
        title: 'Material șters cu succes! ✅',
        description: 'Materialul a fost eliminat din eveniment.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      loadAllData(); // Reîncarcă datele
    } catch (error) {
      console.error('❌ Error deleting material:', error);
      toast({
        title: 'Eroare la ștergere',
        description: 'Nu s-a putut șterge materialul. Încercați din nou.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  // New handler functions for modals
  const handleShowStockDetails = (material: Material) => {
    setSelectedMaterial(material);
    setIsStockDetailsModalOpen(true);
  };

  const handleEditMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setIsEditModalOpen(true);
  };

  const handleDeleteConfirm = (material: Material) => {
    setMaterialToDelete(material);
    setIsDeleteConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!materialToDelete) return;
    
    try {
      setSaving(true);
      await api.delete(`/calendar/events/${eventId}/materials/${materialToDelete.id}`);
      
      toast({
        title: 'Material șters cu succes! ✅',
        description: `Materialul "${materialToDelete.product_name}" a fost eliminat din eveniment.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      loadAllData(); // Reîncarcă datele
      setIsDeleteConfirmModalOpen(false);
      setMaterialToDelete(null);
    } catch (error) {
      console.error('❌ Error deleting material:', error);
      toast({
        title: 'Eroare la ștergere',
        description: 'Nu s-a putut șterge materialul. Încercați din nou.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (updatedMaterial: any) => {
    if (!selectedMaterial) return;
    
    try {
      setSaving(true);
      await api.put(`/calendar/events/${eventId}/materials/${selectedMaterial.id}`, updatedMaterial);
      
      toast({
        title: 'Material actualizat cu succes! ✅',
        description: `Materialul "${selectedMaterial.product_name}" a fost actualizat.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      loadAllData(); // Reîncarcă datele
      setIsEditModalOpen(false);
      setSelectedMaterial(null);
    } catch (error) {
      console.error('❌ Error updating material:', error);
      toast({
        title: 'Eroare la actualizare',
        description: 'Nu s-a putut actualiza materialul. Încercați din nou.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculări statistici
  const totalMaterials = supplies.length;
  const totalValue = supplies.reduce((sum, material) => sum + (material.quantity * material.unit_cost), 0);
  const pendingMaterials = supplies.filter(s => s.status === 'PENDING').length;
  const approvedMaterials = supplies.filter(s => s.status === 'APPROVED').length;

  // Filtrarea materialelor
  const filteredSupplies = supplies.filter(supply => {
    const matchesSearch = supply.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supply.product_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || supply.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredSupplies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSupplies = filteredSupplies.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'yellow';
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'IN_USE': return 'blue';
      case 'COMPLETED': return 'purple';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'red';
      case 'MEDIUM': return 'orange';
      case 'LOW': return 'green';
      default: return 'gray';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside" motionPreset="slideInBottom">
      <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.600" />
      <ModalContent 
        bg={bgColor} 
        borderRadius="3xl" 
        shadow="2xl"
        border="1px solid"
        borderColor={borderColor}
        maxH="90vh"
      >
        {/* Header cu gradient */}
        <Box
          bgGradient="linear(135deg, teal.500, blue.600)"
          color="white"
          p={6}
          position="relative"
          overflow="hidden"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgGradient: 'linear(45deg, transparent, whiteAlpha.100, transparent)',
            animation: 'shimmer 3s ease-in-out infinite',
          }}
        >
          <Flex align="center" justify="space-between">
            <HStack spacing={4}>
              <Box
                bg="whiteAlpha.200"
                p={3}
                borderRadius="xl"
                backdropFilter="blur(10px)"
              >
                <Icon as={FiPackage} boxSize={8} />
              </Box>
              <VStack align="start" spacing={1}>
                <Heading size="xl" fontWeight="bold" letterSpacing="tight">
                  Materiale Evenimente
                </Heading>
                <Text fontSize="lg" opacity={0.9} fontWeight="medium">
                  {eventTitle}
                </Text>
                <HStack spacing={3}>
                  <Badge bg="whiteAlpha.300" color="white" px={3} py={1} borderRadius="full">
                    {new Date(eventDate).toLocaleDateString('ro-RO')}
                  </Badge>
                  <Badge bg="whiteAlpha.300" color="white" px={3} py={1} borderRadius="full">
                    {eventStatus}
                  </Badge>
                </HStack>
              </VStack>
            </HStack>
            <ModalCloseButton
              position="static"
              color="white"
              size="lg"
              _hover={{ bg: 'whiteAlpha.200', transform: 'rotate(90deg)' }}
              transition="all 0.2s"
            />
          </Flex>
        </Box>

        <ModalBody 
          py={6}
        >
          <MotionBox
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Statistici rapide */}
            <MotionCard variants={itemVariants} mb={6}>
              <CardBody p={6}>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
                  <Stat textAlign="center">
                    <StatLabel color="gray.500" fontSize="sm">Total Materiale</StatLabel>
                    <StatNumber fontSize="2xl" color="blue.500" fontWeight="bold">
                      {totalMaterials}
                    </StatNumber>
                    <StatHelpText>
                      <Icon as={FiBox} mr={1} />
                      Articole necesare
                    </StatHelpText>
                  </Stat>

                  <Stat textAlign="center">
                    <StatLabel color="gray.500" fontSize="sm">Valoare Totală</StatLabel>
                    <StatNumber fontSize="2xl" color="green.500" fontWeight="bold">
                      {totalValue.toFixed(2)} RON
                    </StatNumber>
                    <StatHelpText>
                      <Icon as={FiDollarSign} mr={1} />
                      Cost estimat
                    </StatHelpText>
                  </Stat>

                  <Stat textAlign="center">
                    <StatLabel color="gray.500" fontSize="sm">În Așteptare</StatLabel>
                    <StatNumber fontSize="2xl" color="orange.500" fontWeight="bold">
                      {pendingMaterials}
                    </StatNumber>
                    <StatHelpText>
                      <Icon as={FiClock} mr={1} />
                      Necesită aprobare
                    </StatHelpText>
                  </Stat>

                  <Stat textAlign="center">
                    <StatLabel color="gray.500" fontSize="sm">Prioritate Critică</StatLabel>
                    <StatNumber fontSize="2xl" color="red.500" fontWeight="bold">
                      0
                    </StatNumber>
                    <StatHelpText>
                      <Icon as={FiAlertTriangle} mr={1} />
                      Urgent necesare
                    </StatHelpText>
                  </Stat>
                </SimpleGrid>
              </CardBody>
            </MotionCard>

            {/* Controale și filtre */}
            <MotionCard variants={itemVariants} mb={6}>
              <CardBody p={6}>
                <Flex direction={{ base: 'column', md: 'row' }} gap={4} align="end">
                  <FormControl flex={1}>
                    <FormLabel fontSize="sm" fontWeight="semibold">Căutare materiale</FormLabel>
                    <Input
                      placeholder="Căutați după nume sau cod produs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      borderRadius="lg"
                      bg={cardBg}
                    />
                  </FormControl>

                  <FormControl w={{ base: 'full', md: '200px' }}>
                    <FormLabel fontSize="sm" fontWeight="semibold">Filtrare status</FormLabel>
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      borderRadius="lg"
                      bg={cardBg}
                    >
                      <option value="all">Toate statusurile</option>
                      <option value="PENDING">În așteptare</option>
                      <option value="APPROVED">Aprobat</option>
                      <option value="IN_USE">În utilizare</option>
                      <option value="COMPLETED">Finalizat</option>
                    </Select>
                  </FormControl>

                  {canEdit && (
                    <MotionButton
                      leftIcon={<FiPlus />}
                      colorScheme="teal"
                      size="lg"
                      borderRadius="xl"
                      px={6}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAddForm(!showAddForm)}
                    >
                      Adaugă Material
                    </MotionButton>
                  )}

                  <MotionButton
                    leftIcon={<FiRefreshCw />}
                    variant="outline"
                    size="lg"
                    borderRadius="xl"
                    px={6}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={loadAllData}
                    isLoading={loading}
                  >
                    Reîncarcă
                  </MotionButton>
                </Flex>
              </CardBody>
            </MotionCard>

            {/* Formular pentru adăugarea materialelor */}
            <AnimatePresence>
              {showAddForm && canEdit && (
                <Card>
                  <CardHeader pb={3}>
                    <Heading size="md">+ Adaugă Material Nou</Heading>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack spacing={4}>
                      {/* Selectare produs */}
                      <FormControl isRequired>
                        <FormLabel>Produs *</FormLabel>
                        <Select
                          placeholder="Selectați produsul"
                          value={newMaterial.productId}
                          onChange={(e) => handleProductChange(e.target.value)}
                          size="lg"
                          borderRadius="md"
                        >
                          {availableProducts.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.code}) - {product.unit_price} RON/{product.unit}
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      {/* Cantitate */}
                      <FormControl isRequired>
                        <FormLabel>Cantitate *</FormLabel>
                        <Input
                          type="number"
                          min="1"
                          value={newMaterial.quantity}
                          onChange={(e) => setNewMaterial(prev => ({ 
                            ...prev, 
                            quantity: parseInt(e.target.value) || 1 
                          }))}
                          size="lg"
                          borderRadius="md"
                        />
                      </FormControl>

                      {/* Afișare informații produs și cost calculat */}
                      {selectedProduct && (
                        <Box
                          bg={useColorModeValue('blue.50', 'blue.900')}
                          p={4}
                          borderRadius="lg"
                          border="1px solid"
                          borderColor={useColorModeValue('blue.200', 'blue.700')}
                          w="full"
                        >
                          <VStack align="start" spacing={2}>
                            <HStack justify="space-between" w="full">
                              <Text fontSize="sm" fontWeight="semibold" color="blue.700">
                                {selectedProduct.name}
                              </Text>
                              <Badge colorScheme="blue" size="sm">
                                {selectedProduct.code}
                              </Badge>
                            </HStack>
                            
                            <SimpleGrid columns={2} spacing={4} w="full">
                              <Box>
                                <Text fontSize="xs" color="gray.600">Preț unitar</Text>
                                <Text fontSize="sm" fontWeight="bold" color="green.600">
                                  {selectedProduct.unit_price} RON/{selectedProduct.unit}
                                </Text>
                              </Box>
                              <Box>
                                <Text fontSize="xs" color="gray.600">Stoc disponibil</Text>
                                <Text fontSize="sm" fontWeight="bold" color={selectedProduct.current_stock > 0 ? "green.600" : "red.600"}>
                                  {selectedProduct.current_stock} {selectedProduct.unit}
                                </Text>
                              </Box>
                            </SimpleGrid>

                            <Divider />

                            <HStack justify="space-between" w="full">
                              <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                                Cost total calculat:
                              </Text>
                              <Text fontSize="lg" fontWeight="bold" color="green.600">
                                {totalCost.toFixed(2)} RON
                              </Text>
                            </HStack>
                          </VStack>
                        </Box>
                      )}

                      {/* Notițe (opțional) */}
                      <FormControl>
                        <FormLabel>Notițe (opțional)</FormLabel>
                        <Textarea
                          placeholder="Adăugați observații despre acest material..."
                          value={newMaterial.notes}
                          onChange={(e) => setNewMaterial(prev => ({ 
                            ...prev, 
                            notes: e.target.value 
                          }))}
                          size="lg"
                          borderRadius="md"
                          rows={3}
                        />
                      </FormControl>

                      {/* Butoane de acțiune */}
                      <HStack spacing={3} w="full" justify="flex-end">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setNewMaterial({
                              productId: '',
                              quantity: 1,
                              notes: ''
                            });
                            setSelectedProduct(null);
                          }}
                        >
                          Anulare
                        </Button>
                        <Button
                          colorScheme="blue"
                          leftIcon={<Icon as={FiSave} />}
                          onClick={handleAddMaterial}
                          isDisabled={!newMaterial.productId || newMaterial.quantity < 1}
                          size="lg"
                        >
                          Salvează Material
                        </Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </AnimatePresence>

            {/* Lista materialelor */}
            <MotionCard variants={itemVariants}>
              <CardBody p={0}>
                {loading ? (
                  <Flex justify="center" align="center" h="200px">
                    <VStack spacing={4}>
                      <Spinner size="xl" color="teal.500" thickness="4px" />
                      <Text color="gray.500" fontSize="lg">
                        Se încarcă materialele...
                      </Text>
                    </VStack>
                  </Flex>
                ) : filteredSupplies.length === 0 ? (
                  <Flex justify="center" align="center" h="200px" direction="column">
                    <Icon as={FiPackage} boxSize={16} color="gray.300" mb={4} />
                    <Text fontSize="xl" fontWeight="semibold" color="gray.500" mb={2}>
                      {totalMaterials === 0 ? 'Niciun material adăugat încă' : 'Niciun material găsit'}
                    </Text>
                    <Text fontSize="md" color="gray.400" textAlign="center">
                      {totalMaterials === 0 
                        ? 'Folosiți butonul "Adaugă Material" pentru a începe.'
                        : 'Încercați să modificați filtrele de căutare.'
                      }
                    </Text>
                  </Flex>
                ) : (
                  <>
                    <TableContainer>
                      <Table variant="simple" size="md">
                        <Thead bg={cardBg}>
                          <Tr>
                            <Th border="none" py={4} fontSize="sm" fontWeight="bold" color="gray.600">
                              Produs
                            </Th>
                            <Th border="none" py={4} fontSize="sm" fontWeight="bold" color="gray.600">
                              Cantitate
                            </Th>
                            <Th border="none" py={4} fontSize="sm" fontWeight="bold" color="gray.600">
                              Cost/Unitate
                            </Th>
                            <Th border="none" py={4} fontSize="sm" fontWeight="bold" color="gray.600">
                              Total
                            </Th>
                            <Th border="none" py={4} fontSize="sm" fontWeight="bold" color="gray.600">
                              Status
                            </Th>
                            <Th border="none" py={4} fontSize="sm" fontWeight="bold" color="gray.600">
                              Acțiuni
                            </Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          <AnimatePresence>
                            {currentSupplies.map((material, index) => (
                              <motion.tr
                                key={material.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                <Td border="none" py={4}>
                                  <VStack align="start" spacing={1}>
                                    <Text fontWeight="semibold" fontSize="md">
                                      {material.product_name}
                                    </Text>
                                    <HStack spacing={2}>
                                      <Badge size="sm" colorScheme="gray">
                                        {material.product_code}
                                      </Badge>
                                      <Text fontSize="sm" color="gray.500">
                                        {material.product_unit}
                                      </Text>
                                    </HStack>
                                    {material.product_category_name && (
                                      <Text fontSize="xs" color="gray.400">
                                        {material.product_category_name}
                                      </Text>
                                    )}
                                  </VStack>
                                </Td>
                                <Td border="none" py={4}>
                                  <VStack align="start" spacing={1}>
                                    <Text fontSize="lg" fontWeight="bold">
                                      {material.quantity}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500">
                                      Stoc: {material.product_current_stock}
                                    </Text>
                                  </VStack>
                                </Td>
                                <Td border="none" py={4}>
                                  <Text fontSize="md" fontWeight="semibold">
                                    {material.unit_cost.toFixed(2)} RON
                                  </Text>
                                </Td>
                                <Td border="none" py={4}>
                                  <Text fontSize="lg" fontWeight="bold" color="green.600">
                                    {(material.quantity * material.unit_cost).toFixed(2)} RON
                                  </Text>
                                </Td>
                                <Td border="none" py={4}>
                                  <Badge
                                    colorScheme={getStatusColor(material.status)}
                                    variant="solid"
                                    px={3}
                                    py={1}
                                    borderRadius="full"
                                    fontSize="xs"
                                  >
                                    {material.status}
                                  </Badge>
                                </Td>
                                <Td border="none" py={4}>
                                  <HStack spacing={2}>
                                    <Tooltip label="Detalii Stoc">
                                      <IconButton
                                        icon={<FiInfo />}
                                        size="sm"
                                        variant="outline"
                                        colorScheme="teal"
                                        onClick={() => handleShowStockDetails(material)}
                                        aria-label="Detalii Stoc"
                                      />
                                    </Tooltip>
                                    <Tooltip label="Editează material">
                                      <IconButton
                                        icon={<FiEdit />}
                                        size="sm"
                                        variant="outline"
                                        colorScheme="blue"
                                        onClick={() => handleEditMaterial(material)}
                                        aria-label="Editează"
                                      />
                                    </Tooltip>
                                    <Tooltip label="Șterge material">
                                      <IconButton
                                        icon={<FiTrash2 />}
                                        size="sm"
                                        variant="outline"
                                        colorScheme="red"
                                        onClick={() => handleDeleteConfirm(material)}
                                        aria-label="Șterge"
                                      />
                                    </Tooltip>
                                  </HStack>
                                </Td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </Tbody>
                      </Table>
                    </TableContainer>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <Box 
                        p={6} 
                        borderTop="1px solid" 
                        borderColor={borderColor}
                        bg={cardBg}
                      >
                        <Flex justify="space-between" align="center">
                          {/* Info about current page */}
                          <Text fontSize="sm" color="gray.600">
                            Afișare {startIndex + 1}-{Math.min(endIndex, filteredSupplies.length)} din {filteredSupplies.length} materiale
                          </Text>

                          {/* Pagination buttons */}
                          <HStack spacing={2}>
                            {/* First page button */}
                            <IconButton
                              aria-label="Prima pagină"
                              icon={<Icon as={FiChevronsLeft} />}
                              size="sm"
                              variant="outline"
                              onClick={goToFirstPage}
                              isDisabled={currentPage === 1}
                              colorScheme="teal"
                            />

                            {/* Previous page button */}
                            <IconButton
                              aria-label="Pagina anterioară"
                              icon={<Icon as={FiChevronLeft} />}
                              size="sm"
                              variant="outline"
                              onClick={goToPreviousPage}
                              isDisabled={currentPage === 1}
                              colorScheme="teal"
                            />

                            {/* Page numbers */}
                            <HStack spacing={1}>
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNumber;
                                if (totalPages <= 5) {
                                  pageNumber = i + 1;
                                } else if (currentPage <= 3) {
                                  pageNumber = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                  pageNumber = totalPages - 4 + i;
                                } else {
                                  pageNumber = currentPage - 2 + i;
                                }

                                return (
                                  <Button
                                    key={pageNumber}
                                    size="sm"
                                    variant={currentPage === pageNumber ? "solid" : "outline"}
                                    colorScheme="teal"
                                    onClick={() => goToPage(pageNumber)}
                                    minW="40px"
                                  >
                                    {pageNumber}
                                  </Button>
                                );
                              })}
                            </HStack>

                            {/* Next page button */}
                            <IconButton
                              aria-label="Pagina următoare"
                              icon={<Icon as={FiChevronRight} />}
                              size="sm"
                              variant="outline"
                              onClick={goToNextPage}
                              isDisabled={currentPage === totalPages}
                              colorScheme="teal"
                            />

                            {/* Last page button */}
                            <IconButton
                              aria-label="Ultima pagină"
                              icon={<Icon as={FiChevronsRight} />}
                              size="sm"
                              variant="outline"
                              onClick={goToLastPage}
                              isDisabled={currentPage === totalPages}
                              colorScheme="teal"
                            />
                          </HStack>

                          {/* Items per page info */}
                          <Text fontSize="sm" color="gray.600">
                            {itemsPerPage} per pagină
                          </Text>
                        </Flex>
                      </Box>
                    )}
                  </>
                )}
              </CardBody>
            </MotionCard>
            
            {/* Spațiu suplimentar pentru a forța scroll-ul */}
            <Box h="200px" display="flex" alignItems="center" justifyContent="center">
              <Text color="gray.400" fontSize="sm">
                Sfârșitul listei de materiale
              </Text>
            </Box>
          </MotionBox>
        </ModalBody>
      </ModalContent>

      {/* Modal pentru Detalii Stoc */}
      <Modal 
        isOpen={isStockDetailsModalOpen} 
        onClose={() => setIsStockDetailsModalOpen(false)}
        size="2xl"
        motionPreset="slideInBottom"
        isCentered
      >
        <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.600" />
        <ModalContent 
          bg={bgColor} 
          borderRadius="2xl" 
          overflow="hidden"
          shadow="2xl"
          border="1px solid"
          borderColor={borderColor}
        >
          <ModalHeader
            bgGradient="linear(135deg, teal.500, blue.600)"
            color="white"
            p={6}
          >
            <HStack spacing={4}>
              <Box
                bg="whiteAlpha.200"
                p={3}
                borderRadius="xl"
                backdropFilter="blur(10px)"
              >
                <Icon as={FiInfo} boxSize={6} />
              </Box>
              <VStack align="start" spacing={1}>
                <Heading size="lg" fontWeight="bold">
                  Detalii Stoc Material
                </Heading>
                <Text fontSize="md" opacity={0.9}>
                  {selectedMaterial?.product_name}
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={6}>
            {selectedMaterial && (
              <VStack spacing={6} align="stretch">
                {/* Informații produs */}
                <Card>
                  <CardHeader pb={3}>
                    <Heading size="md">Informații Produs</Heading>
                  </CardHeader>
                  <CardBody pt={0}>
                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={1}>Nume Produs</Text>
                        <Text fontSize="md" fontWeight="semibold">{selectedMaterial.product_name}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={1}>Cod Produs</Text>
                        <Text fontSize="md" fontWeight="semibold">{selectedMaterial.product_code}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={1}>Categorie</Text>
                        <Text fontSize="md" fontWeight="semibold">{selectedMaterial.product_category_name}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={1}>Unitate</Text>
                        <Text fontSize="md" fontWeight="semibold">{selectedMaterial.product_unit}</Text>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Stoc și Disponibilitate */}
                <Card>
                  <CardHeader pb={3}>
                    <Heading size="md">Stoc și Disponibilitate</Heading>
                  </CardHeader>
                  <CardBody pt={0}>
                    <SimpleGrid columns={2} spacing={6}>
                      <Stat textAlign="center">
                        <StatLabel color="gray.500" fontSize="sm">Stoc Disponibil</StatLabel>
                        <StatNumber fontSize="2xl" color="green.500" fontWeight="bold">
                          {selectedMaterial.product_current_stock}
                        </StatNumber>
                        <StatHelpText>
                          <Icon as={FiBox} mr={1} />
                          {selectedMaterial.product_unit}
                        </StatHelpText>
                      </Stat>

                      <Stat textAlign="center">
                        <StatLabel color="gray.500" fontSize="sm">Cantitate Necesară</StatLabel>
                        <StatNumber fontSize="2xl" color="blue.500" fontWeight="bold">
                          {selectedMaterial.quantity}
                        </StatNumber>
                        <StatHelpText>
                          <Icon as={FiPackage} mr={1} />
                          Pentru eveniment
                        </StatHelpText>
                      </Stat>
                    </SimpleGrid>

                    {/* Bar de progres pentru disponibilitate */}
                    <Box mt={4}>
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="sm" color="gray.600">Disponibilitate</Text>
                        <Text fontSize="sm" color="gray.600" fontWeight="semibold">
                          {Math.min(100, Math.round((selectedMaterial.product_current_stock / selectedMaterial.quantity) * 100))}%
                        </Text>
                      </HStack>
                      <Progress 
                        value={Math.min(100, Math.round((selectedMaterial.product_current_stock / selectedMaterial.quantity) * 100))}
                        colorScheme={selectedMaterial.product_current_stock >= selectedMaterial.quantity ? "green" : "orange"}
                        borderRadius="full"
                        size="lg"
                      />
                      <Text fontSize="xs" color="gray.500" mt={2}>
                        {selectedMaterial.product_current_stock >= selectedMaterial.quantity 
                          ? "✅ Stoc suficient pentru eveniment"
                          : "⚠️ Stoc insuficient - necesită comandă"
                        }
                      </Text>
                    </Box>
                  </CardBody>
                </Card>

                {/* Costuri */}
                <Card>
                  <CardHeader pb={3}>
                    <Heading size="md">Costuri și Valori</Heading>
                  </CardHeader>
                  <CardBody pt={0}>
                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={1}>Cost Unitar</Text>
                        <Text fontSize="lg" fontWeight="bold" color="blue.600">
                          {selectedMaterial.unit_cost.toFixed(2)} RON
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={1}>Valoare Totală</Text>
                        <Text fontSize="lg" fontWeight="bold" color="green.600">
                          {(selectedMaterial.quantity * selectedMaterial.unit_cost).toFixed(2)} RON
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={1}>Valoare Stoc Disponibil</Text>
                        <Text fontSize="md" fontWeight="semibold" color="purple.600">
                          {(selectedMaterial.product_current_stock * selectedMaterial.unit_cost).toFixed(2)} RON
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={1}>Status</Text>
                        <Badge
                          colorScheme={getStatusColor(selectedMaterial.status)}
                          variant="solid"
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontSize="sm"
                        >
                          {selectedMaterial.status}
                        </Badge>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Detalii suplimentare */}
                {selectedMaterial.notes && (
                  <Card>
                    <CardHeader pb={3}>
                      <Heading size="md">Notițe</Heading>
                    </CardHeader>
                    <CardBody pt={0}>
                      <Text fontSize="md" color="gray.700" whiteSpace="pre-wrap">
                        {selectedMaterial.notes}
                      </Text>
                    </CardBody>
                  </Card>
                )}

                {/* Informații despre creare */}
                <Card>
                  <CardHeader pb={3}>
                    <Heading size="md">Informații Sistem</Heading>
                  </CardHeader>
                  <CardBody pt={0}>
                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={1}>Creat de</Text>
                        <Text fontSize="md" fontWeight="semibold">{selectedMaterial.created_by_name}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={1}>Data creării</Text>
                        <Text fontSize="md" fontWeight="semibold">
                          {new Date(selectedMaterial.created_at).toLocaleDateString('ro-RO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal pentru Editare Material */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        size="lg"
        motionPreset="slideInBottom"
        isCentered
      >
        <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.600" />
        <ModalContent 
          bg={bgColor} 
          borderRadius="2xl" 
          overflow="hidden"
          shadow="2xl"
          border="1px solid"
          borderColor={borderColor}
        >
          <ModalHeader
            bgGradient="linear(135deg, blue.500, purple.600)"
            color="white"
            p={6}
          >
            <HStack spacing={4}>
              <Box
                bg="whiteAlpha.200"
                p={3}
                borderRadius="xl"
                backdropFilter="blur(10px)"
              >
                <Icon as={FiEdit} boxSize={6} />
              </Box>
              <VStack align="start" spacing={1}>
                <Heading size="lg" fontWeight="bold">
                  Editează Material
                </Heading>
                <Text fontSize="md" opacity={0.9}>
                  {selectedMaterial?.product_name}
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={6}>
            {selectedMaterial && (
              <EditMaterialForm
                material={selectedMaterial}
                onSave={handleSaveEdit}
                onCancel={() => setIsEditModalOpen(false)}
                isLoading={saving}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal pentru Confirmare Ștergere */}
      <Modal 
        isOpen={isDeleteConfirmModalOpen} 
        onClose={() => setIsDeleteConfirmModalOpen(false)}
        size="md"
        motionPreset="slideInBottom"
        isCentered
      >
        <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.600" />
        <ModalContent 
          bg={bgColor} 
          borderRadius="2xl" 
          overflow="hidden"
          shadow="2xl"
          border="1px solid"
          borderColor={borderColor}
        >
          <ModalHeader
            bgGradient="linear(135deg, red.500, orange.600)"
            color="white"
            p={6}
          >
            <HStack spacing={4}>
              <Box
                bg="whiteAlpha.200"
                p={3}
                borderRadius="xl"
                backdropFilter="blur(10px)"
              >
                <Icon as={FiTrash2} boxSize={6} />
              </Box>
              <VStack align="start" spacing={1}>
                <Heading size="lg" fontWeight="bold">
                  Confirmare Ștergere
                </Heading>
                <Text fontSize="md" opacity={0.9}>
                  Material din eveniment
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={6}>
            {materialToDelete && (
              <VStack spacing={6} align="stretch">
                <Alert status="warning" borderRadius="lg">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Ești sigur că vrei să ștergi acest material?
                    </Text>
                    <Text fontSize="sm">
                      Această acțiune nu poate fi anulată și va elimina materialul din eveniment.
                    </Text>
                  </Box>
                </Alert>

                <Card>
                  <CardBody p={4}>
                    <VStack align="start" spacing={3}>
                      <HStack>
                        <Icon as={FiPackage} color="blue.500" />
                        <Text fontWeight="semibold" fontSize="lg">
                          {materialToDelete.product_name}
                        </Text>
                      </HStack>
                      <HStack spacing={6}>
                        <Box>
                          <Text fontSize="sm" color="gray.500">Cantitate</Text>
                          <Text fontSize="md" fontWeight="semibold">
                            {materialToDelete.quantity} {materialToDelete.product_unit}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.500">Valoare</Text>
                          <Text fontSize="md" fontWeight="semibold" color="green.600">
                            {(materialToDelete.quantity * materialToDelete.unit_cost).toFixed(2)} RON
                          </Text>
                        </Box>
                      </HStack>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Status</Text>
                        <Badge
                          colorScheme={getStatusColor(materialToDelete.status)}
                          variant="solid"
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontSize="sm"
                        >
                          {materialToDelete.status}
                        </Badge>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>

                <HStack justify="end" spacing={3}>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteConfirmModalOpen(false)}
                    size="lg"
                    borderRadius="xl"
                    px={6}
                  >
                    Anulează
                  </Button>
                  <Button
                    leftIcon={<FiTrash2 />}
                    colorScheme="red"
                    onClick={handleConfirmDelete}
                    isLoading={saving}
                    loadingText="Se șterge..."
                    size="lg"
                    borderRadius="xl"
                    px={6}
                  >
                    Șterge Material
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Modal>
  );
}

// Componenta pentru editarea materialelor
interface EditMaterialFormProps {
  material: Material;
  onSave: (updates: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function EditMaterialForm({ material, onSave, onCancel, isLoading }: EditMaterialFormProps) {
  const [formData, setFormData] = useState({
    quantity: material.quantity,
    notes: material.notes || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculăm costul total automat
  const totalCost = formData.quantity * material.product_unit_price;
  const remainingStock = material.product_current_stock - formData.quantity;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Cantitatea trebuie să fie mai mare decât 0';
    }

    if (formData.quantity > material.product_current_stock) {
      newErrors.quantity = `Nu poți adăuga mai mult decât stocul disponibil (${material.product_current_stock} ${material.product_unit}). Stocul total este redus cu cantitățile rezervate pentru alte evenimente.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave({
        quantity: formData.quantity,
        unitCost: material.product_unit_price, // Folosim prețul din produs
        notes: formData.notes,
        status: 'PLANNED' // Status fix
      });
    }
  };

  return (
    <Modal isOpen={true} onClose={onCancel} size="2xl" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(20px)" bg="blackAlpha.700" />
      <ModalContent 
        bg="gray.900" 
        borderRadius="3xl" 
        overflow="hidden"
        shadow="2xl"
        border="1px solid"
        borderColor="gray.700"
        maxH="90vh"
        transform="scale(0.9)"
        opacity={0}
        animation="modalSlideIn 0.3s ease-out forwards"
      >
        {/* Header cu gradient modern */}
        <Box
          bgGradient="linear(135deg, purple.600, blue.600, purple.700)"
          color="white"
          p={6}
          position="relative"
          overflow="hidden"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgGradient: 'linear(45deg, transparent, whiteAlpha.200, transparent)',
            animation: 'shimmer 3s ease-in-out infinite',
          }}
        >
          <Flex align="center" justify="space-between">
            <HStack spacing={4}>
              <Box
                bg="whiteAlpha.200"
                p={3}
                borderRadius="xl"
                backdropFilter="blur(10px)"
                border="1px solid"
                borderColor="whiteAlpha.300"
                animation="pulse 2s ease-in-out infinite"
              >
                <Icon as={FiEdit} boxSize={6} />
              </Box>
              <Box>
                <Heading size="lg" fontWeight="bold">Editează Material</Heading>
                <Text fontSize="sm" opacity={0.9} mt={1} fontWeight="medium">
                  {material.product_name}
                </Text>
              </Box>
            </HStack>
            <IconButton
              aria-label="Închide"
              icon={<Icon as={FiX} />}
              variant="ghost"
              color="white"
              _hover={{ 
                bg: 'whiteAlpha.200',
                transform: 'rotate(90deg)',
                transition: 'all 0.3s ease'
              }}
              onClick={onCancel}
            />
          </Flex>
        </Box>

        <ModalBody p={6}>
          <VStack spacing={6} align="stretch">
            {/* Informații Produs - Card modern */}
            <Card 
              bg="gray.800" 
              borderRadius="2xl" 
              border="1px solid" 
              borderColor="gray.700"
              overflow="hidden"
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                h: '2px',
                bgGradient: 'linear(90deg, purple.500, blue.500)',
              }}
            >
              <CardHeader pb={3}>
                <HStack>
                  <Icon as={FiPackage} color="purple.400" boxSize={5} />
                  <Heading size="md" color="white">Informații Produs</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between" p={4} bg="gray.750" borderRadius="xl" 
                    _hover={{ bg: 'gray.700', transform: 'translateX(4px)', transition: 'all 0.2s ease' }}>
                    <Text color="gray.300" fontWeight="medium">Nume Produs:</Text>
                    <Text color="white" fontWeight="bold">{material.product_name}</Text>
                  </HStack>
                  <HStack justify="space-between" p={4} bg="gray.750" borderRadius="xl"
                    _hover={{ bg: 'gray.700', transform: 'translateX(4px)', transition: 'all 0.2s ease' }}>
                    <Text color="gray.300" fontWeight="medium">Cod Produs:</Text>
                    <Text color="white" fontWeight="bold" fontFamily="mono">{material.product_code}</Text>
                  </HStack>
                  <HStack justify="space-between" p={4} bg="gray.750" borderRadius="xl"
                    _hover={{ bg: 'gray.700', transform: 'translateX(4px)', transition: 'all 0.2s ease' }}>
                    <Text color="gray.300" fontWeight="medium">Categorie:</Text>
                    <Text color="white" fontWeight="bold">{material.product_category_name}</Text>
                  </HStack>
                  <HStack justify="space-between" p={4} bg="gray.750" borderRadius="xl"
                    _hover={{ bg: 'gray.700', transform: 'translateX(4px)', transition: 'all 0.2s ease' }}>
                    <Text color="gray.300" fontWeight="medium">Unitate:</Text>
                    <Text color="white" fontWeight="bold">{material.product_unit}</Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Stoc și Disponibilitate - Design modern cu animații */}
            <Card 
              bg="gray.800" 
              borderRadius="2xl" 
              border="1px solid" 
              borderColor="gray.700"
              overflow="hidden"
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                h: '2px',
                bgGradient: 'linear(90deg, green.500, blue.500)',
              }}
            >
              <CardHeader pb={3}>
                <HStack>
                  <Icon as={FiTrendingUp} color="green.400" boxSize={5} />
                  <Heading size="md" color="white">Stoc și Disponibilitate</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={4} align="stretch">
                  <SimpleGrid columns={3} spacing={4}>
                    <Box
                      bgGradient="linear(135deg, blue.600, blue.700)"
                      p={4}
                      borderRadius="xl"
                      textAlign="center"
                      position="relative"
                      overflow="hidden"
                      border="1px solid"
                      borderColor="blue.500"
                      _hover={{ transform: 'translateY(-4px)', transition: 'all 0.3s ease' }}
                      _before={{
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgGradient: 'linear(45deg, transparent, whiteAlpha.200, transparent)',
                        animation: 'shimmer 2s ease-in-out infinite',
                      }}
                    >
                      <Text color="white" fontSize="3xl" fontWeight="bold" mb={1}>
                        {material.product_current_stock}
                      </Text>
                      <Text color="blue.100" fontSize="sm" fontWeight="medium">
                        Stoc Total
                      </Text>
                    </Box>
                    <Box
                      bgGradient="linear(135deg, orange.500, orange.600)"
                      p={4}
                      borderRadius="xl"
                      textAlign="center"
                      position="relative"
                      overflow="hidden"
                      border="1px solid"
                      borderColor="orange.500"
                      _hover={{ transform: 'translateY(-4px)', transition: 'all 0.3s ease' }}
                      _before={{
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgGradient: 'linear(45deg, transparent, whiteAlpha.200, transparent)',
                        animation: 'shimmer 2s ease-in-out infinite',
                      }}
                    >
                      <Text color="white" fontSize="3xl" fontWeight="bold" mb={1}>
                        {formData.quantity}
                      </Text>
                      <Text color="orange.100" fontSize="sm" fontWeight="medium">
                        Cantitate Eveniment
                      </Text>
                    </Box>
                    <Box
                      bgGradient="linear(135deg, green.500, green.600)"
                      p={4}
                      borderRadius="xl"
                      textAlign="center"
                      position="relative"
                      overflow="hidden"
                      border="1px solid"
                      borderColor="green.500"
                      _hover={{ transform: 'translateY(-4px)', transition: 'all 0.3s ease' }}
                      _before={{
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgGradient: 'linear(45deg, transparent, whiteAlpha.200, transparent)',
                        animation: 'shimmer 2s ease-in-out infinite',
                      }}
                    >
                      <Text color="white" fontSize="3xl" fontWeight="bold" mb={1}>
                        {remainingStock}
                      </Text>
                      <Text color="green.100" fontSize="sm" fontWeight="medium">
                        Rămân Disponibile
                      </Text>
                    </Box>
                  </SimpleGrid>
                  
                  <Box>
                    <HStack justify="space-between" mb={3}>
                      <Text color="gray.300" fontSize="sm" fontWeight="medium">
                        Utilizare Stoc
                      </Text>
                      <Text color="gray.300" fontSize="sm" fontWeight="bold">
                        {Math.round((formData.quantity / material.product_current_stock) * 100)}%
                      </Text>
                    </HStack>
                    <Box
                      bg="gray.700"
                      h={4}
                      borderRadius="full"
                      overflow="hidden"
                      position="relative"
                      border="1px solid"
                      borderColor="gray.600"
                    >
                      <Box
                        bgGradient="linear(90deg, green.400, green.500, green.600)"
                        h="full"
                        borderRadius="full"
                        width={`${Math.min((formData.quantity / material.product_current_stock) * 100, 100)}%`}
                        transition="width 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                        position="relative"
                        _before={{
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          bgGradient: 'linear(90deg, transparent, whiteAlpha.400, transparent)',
                          animation: 'shimmer 2s ease-in-out infinite',
                        }}
                      />
                    </Box>
                    <HStack mt={3} color="green.400" p={3} bg="green.900" borderRadius="lg" border="1px solid" borderColor="green.700">
                      <Icon as={FiCheckCircle} boxSize={5} />
                      <Text fontSize="sm" fontWeight="medium">
                        {remainingStock} {material.product_unit} vor rămâne disponibile pentru alte evenimente (după deducerea rezervărilor existente)
                      </Text>
                    </HStack>
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            {/* Formular de editare - Design modern */}
            <Card 
              bg="gray.800" 
              borderRadius="2xl" 
              border="1px solid" 
              borderColor="gray.700"
              overflow="hidden"
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                h: '2px',
                bgGradient: 'linear(90deg, purple.500, pink.500)',
              }}
            >
              <CardHeader pb={3}>
                <HStack>
                  <Icon as={FiEdit3} color="purple.400" boxSize={5} />
                  <Heading size="md" color="white">Modifică Cantitatea</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={4} align="stretch">
                  <FormControl isInvalid={!!errors.quantity}>
                    <FormLabel fontSize="sm" fontWeight="semibold" color="gray.300">
                      Cantitate *
                    </FormLabel>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                      min={1}
                      max={material.product_current_stock}
                      bg="gray.700"
                      borderColor="gray.600"
                      color="white"
                      borderRadius="lg"
                      fontSize="lg"
                      fontWeight="medium"
                      _focus={{
                        borderColor: 'purple.400',
                        boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)',
                        bg: 'gray.650',
                      }}
                      _hover={{
                        borderColor: 'gray.500',
                        bg: 'gray.650',
                      }}
                      _placeholder={{ color: 'gray.400' }}
                    />
                    <FormErrorMessage>{errors.quantity}</FormErrorMessage>
                    <HStack mt={2} p={2} bg="blue.900" borderRadius="lg" border="1px solid" borderColor="blue.700">
                      <Icon as={FiInfo} color="blue.300" boxSize={4} />
                      <Text fontSize="xs" color="blue.200">
                        Maxim disponibil: {material.product_current_stock} {material.product_unit} (stoc total minus rezervări pentru alte evenimente)
                      </Text>
                    </HStack>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold" color="gray.300">
                      Notițe (opțional)
                    </FormLabel>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Adăugați observații despre acest material..."
                      bg="gray.700"
                      borderColor="gray.600"
                      color="white"
                      borderRadius="lg"
                      _focus={{
                        borderColor: 'purple.400',
                        boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)',
                        bg: 'gray.650',
                      }}
                      _hover={{
                        borderColor: 'gray.500',
                        bg: 'gray.650',
                      }}
                      _placeholder={{ color: 'gray.400' }}
                      rows={3}
                    />
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>

            {/* Cost Information - Card modern cu gradient */}
            <Box
              bgGradient="linear(135deg, green.600, green.700, green.800)"
              p={6}
              borderRadius="2xl"
              color="white"
              textAlign="center"
              position="relative"
              overflow="hidden"
              border="1px solid"
              borderColor="green.500"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgGradient: 'linear(45deg, transparent, whiteAlpha.100, transparent)',
                animation: 'shimmer 3s ease-in-out infinite',
              }}
            >
              <VStack spacing={3}>
                <HStack spacing={6} justify="center">
                  <VStack spacing={1}>
                    <Text fontSize="sm" opacity={0.9} fontWeight="medium">
                      Preț unitar
                    </Text>
                    <Text fontSize="lg" fontWeight="bold">
                      {material.product_unit_price} RON/{material.product_unit}
                    </Text>
                  </VStack>
                  <Box w="1px" h="40px" bg="whiteAlpha.300" />
                  <VStack spacing={1}>
                    <Text fontSize="sm" opacity={0.9} fontWeight="medium">
                      Cantitate
                    </Text>
                    <Text fontSize="lg" fontWeight="bold">
                      {formData.quantity} {material.product_unit}
                    </Text>
                  </VStack>
                </HStack>
                <Divider borderColor="whiteAlpha.300" />
                <VStack spacing={1}>
                  <Text fontSize="sm" opacity={0.9} fontWeight="medium">
                    Cost Total
                  </Text>
                  <Text fontSize="3xl" fontWeight="bold" bgGradient="linear(90deg, white, green.100)" bgClip="text">
                    {totalCost.toFixed(2)} RON
                  </Text>
                </VStack>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor="gray.700" bg="gray.800">
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={onCancel} 
            color="gray.300"
            _hover={{ 
              bg: 'gray.700',
              color: 'white',
              transform: 'translateY(-1px)'
            }}
          >
            Anulare
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isLoading}
            bgGradient="linear(135deg, purple.500, blue.600)"
            color="white"
            _hover={{
              bgGradient: 'linear(135deg, purple.600, blue.700)',
              transform: 'translateY(-2px)',
              boxShadow: 'xl',
            }}
            _active={{
              transform: 'translateY(0)',
            }}
            _loading={{
              bgGradient: 'linear(135deg, purple.600, blue.700)',
            }}
            fontWeight="bold"
            px={8}
            py={3}
            borderRadius="xl"
          >
            Salvează Modificările
          </Button>
        </ModalFooter>
      </ModalContent>
      
      <style>{`
        @keyframes modalSlideIn {
          from {
            transform: scale(0.9) translateY(20px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </Modal>
  );
} 