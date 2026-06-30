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
  Tooltip,
  useDisclosure,
  useToast,
  Card,
  CardBody,
  CardHeader,
  VStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Grid,
  Divider,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiClock,
  FiFileText,
  FiSearch,
  FiRefreshCw,
  FiTruck,
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiDroplet,
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { Vehicle, VehicleStatus } from '../../types/vehicles';
import { VehicleService } from '../../services/vehicles/VehicleService';
import { useAuth } from '../../hooks/useAuth';
import VehicleFormModal from './VehicleFormModal';
import VehicleDocuments from './VehicleDocuments';
import VehicleHistory from './VehicleHistory';
import FuelConsumptionModal from '../fuel/FuelConsumptionModal';
import DailyActivityModal from '../activity/DailyActivityModal';

// Animații
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const vehicleService = new VehicleService();

const statusColors: Record<VehicleStatus, string> = {
  AVAILABLE: 'green',
  IN_USE: 'blue',
  MAINTENANCE: 'orange',
  OUT_OF_SERVICE: 'red',
};

const statusNames: Record<VehicleStatus, string> = {
  AVAILABLE: 'Disponibil',
  IN_USE: 'În folosință',
  MAINTENANCE: 'În mentenanță',
  OUT_OF_SERVICE: 'Indisponibil',
};

export default function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | undefined>();
  // const { user } = useAuth();
  const toast = useToast();
  const {
    isOpen: isFormOpen,
    onOpen: onFormOpen,
    onClose: onFormClose
  } = useDisclosure();
  const {
    isOpen: isDocsOpen,
    onOpen: onDocsOpen,
    onClose: onDocsClose
  } = useDisclosure();
  const {
    isOpen: isHistoryOpen,
    onOpen: onHistoryOpen,
    onClose: onHistoryClose
  } = useDisclosure();
  const {
    isOpen: isFuelModalOpen,
    onOpen: onFuelModalOpen,
    onClose: onFuelModalClose
  } = useDisclosure();
  const {
    isOpen: isActivityModalOpen,
    onOpen: onActivityModalOpen,
    onClose: onActivityModalClose
  } = useDisclosure();

  // Color mode values
  // const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await vehicleService.getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca vehiculele.',
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

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter ? vehicle.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: number) => {
    try {
      await vehicleService.deleteVehicle(id);
      toast({
        title: 'Succes',
        description: 'Vehiculul a fost șters cu succes.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      loadVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge vehiculul.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    onFormOpen();
  };

  const handleAdd = () => {
    setSelectedVehicle(undefined);
    onFormOpen();
  };

  const handleViewDocuments = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    onDocsOpen();
  };

  const handleViewHistory = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    onHistoryOpen();
  };

  const handleModalSuccess = () => {
    loadVehicles();
  };

  return (
    <VStack spacing={8} align="stretch">
      {/* Statistics Cards */}
      <Grid 
        templateColumns="repeat(auto-fit, minmax(250px, 1fr))" 
        gap={6}
        animation={`${fadeInUp} 0.8s ease-out`}
      >
        <Card
          bg={cardBg}
          borderRadius="xl"
          boxShadow="lg"
          _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
          transition="all 0.3s"
          border="1px solid"
          borderColor={borderColor}
        >
          <CardBody p={6}>
            <HStack spacing={4}>
              <Box
                p={3}
                borderRadius="lg"
                bgGradient="linear(to-r, blue.100, blue.200)"
                color="blue.600"
              >
                <Icon as={FiTruck} boxSize={6} />
              </Box>
              <Stat>
                <StatLabel color={mutedText} fontSize="sm" fontWeight="medium">
                  Total Vehicule
                </StatLabel>
                <StatNumber fontSize="3xl" fontWeight="bold" color={textColor}>
                  {vehicles.length}
                </StatNumber>
                <StatHelpText color="blue.500" fontSize="sm">
                  <StatArrow type="increase" />
                  În flotă
                </StatHelpText>
              </Stat>
            </HStack>
          </CardBody>
        </Card>

        <Card
          bg={cardBg}
          borderRadius="xl"
          boxShadow="lg"
          _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
          transition="all 0.3s"
          border="1px solid"
          borderColor={borderColor}
        >
          <CardBody p={6}>
            <HStack spacing={4}>
              <Box
                p={3}
                borderRadius="lg"
                bgGradient="linear(to-r, green.100, green.200)"
                color="green.600"
              >
                <Icon as={FiCheckCircle} boxSize={6} />
              </Box>
              <Stat>
                <StatLabel color={mutedText} fontSize="sm" fontWeight="medium">
                  Disponibile
                </StatLabel>
                <StatNumber fontSize="3xl" fontWeight="bold" color={textColor}>
                  {vehicles.filter(v => v.status === 'AVAILABLE').length}
                </StatNumber>
                <StatHelpText color="green.500" fontSize="sm">
                  <StatArrow type="increase" />
                  Gata de utilizare
                </StatHelpText>
              </Stat>
            </HStack>
          </CardBody>
        </Card>

        <Card
          bg={cardBg}
          borderRadius="xl"
          boxShadow="lg"
          _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
          transition="all 0.3s"
          border="1px solid"
          borderColor={borderColor}
        >
          <CardBody p={6}>
            <HStack spacing={4}>
              <Box
                p={3}
                borderRadius="lg"
                bgGradient="linear(to-r, orange.100, orange.200)"
                color="orange.600"
              >
                <Icon as={FiAlertTriangle} boxSize={6} />
              </Box>
              <Stat>
                <StatLabel color={mutedText} fontSize="sm" fontWeight="medium">
                  În Mentenanță
                </StatLabel>
                <StatNumber fontSize="3xl" fontWeight="bold" color={textColor}>
                  {vehicles.filter(v => v.status === 'MAINTENANCE').length}
                </StatNumber>
                <StatHelpText color="orange.500" fontSize="sm">
                  <StatArrow type="decrease" />
                  Necesită atenție
                </StatHelpText>
              </Stat>
            </HStack>
          </CardBody>
        </Card>

        <Card
          bg={cardBg}
          borderRadius="xl"
          boxShadow="lg"
          _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
          transition="all 0.3s"
          border="1px solid"
          borderColor={borderColor}
        >
          <CardBody p={6}>
            <HStack spacing={4}>
              <Box
                p={3}
                borderRadius="lg"
                bgGradient="linear(to-r, purple.100, purple.200)"
                color="purple.600"
              >
                <Icon as={FiActivity} boxSize={6} />
              </Box>
              <Stat>
                <StatLabel color={mutedText} fontSize="sm" fontWeight="medium">
                  În Folosință
                </StatLabel>
                <StatNumber fontSize="3xl" fontWeight="bold" color={textColor}>
                  {vehicles.filter(v => v.status === 'IN_USE').length}
                </StatNumber>
                <StatHelpText color="purple.500" fontSize="sm">
                  <StatArrow type="increase" />
                  Active acum
                </StatHelpText>
              </Stat>
            </HStack>
          </CardBody>
        </Card>
      </Grid>

      {/* Enhanced Header and Actions */}
      <Card
        bg={cardBg}
        borderRadius="xl"
        boxShadow="lg"
        border="1px solid"
        borderColor={borderColor}
        animation={`${fadeInUp} 1s ease-out`}
      >
        <CardBody p={6}>
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <Flex justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                  Lista Vehicule
                </Text>
                <Text fontSize="sm" color={mutedText}>
                  Gestionează și monitorizează toate vehiculele din flotă
                </Text>
              </VStack>
              <HStack spacing={3}>
                <Button
                  leftIcon={<Icon as={FiActivity} />}
                  colorScheme="purple"
                  size="lg"
                  onClick={onActivityModalOpen}
                  bgGradient="linear(to-r, purple.400, purple.600)"
                  _hover={{ 
                    bgGradient: "linear(to-r, purple.500, purple.700)",
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg'
                  }}
                  _active={{ transform: 'translateY(0)' }}
                  transition="all 0.2s"
                  borderRadius="xl"
                  px={6}
                >
                  Activitate Zilnică
                </Button>
                <Button
                  leftIcon={<Icon as={FiDroplet} />}
                  colorScheme="orange"
                  size="lg"
                  onClick={onFuelModalOpen}
                  bgGradient="linear(to-r, orange.400, orange.600)"
                  _hover={{ 
                    bgGradient: "linear(to-r, orange.500, orange.700)",
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg'
                  }}
                  _active={{ transform: 'translateY(0)' }}
                  transition="all 0.2s"
                  borderRadius="xl"
                  px={6}
                >
                  Consum Motorină
                </Button>
                <Button
                  leftIcon={<Icon as={FiPlus} />}
                  rightIcon={<Icon as={FiTruck} />}
                  colorScheme="blue"
                  size="lg"
                  onClick={handleAdd}
                  bgGradient="linear(to-r, blue.400, blue.600)"
                  _hover={{ 
                    bgGradient: "linear(to-r, blue.500, blue.700)",
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg'
                  }}
                  _active={{ transform: 'translateY(0)' }}
                  transition="all 0.2s"
                  borderRadius="xl"
                  px={8}
                >
                  Adaugă Vehicul
                </Button>
              </HStack>
            </Flex>

            <Divider />

            {/* Enhanced Search and Filters */}
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="semibold" color={textColor}>
                Căutare și Filtrare
              </Text>
              <Flex gap={4} wrap="wrap">
                <InputGroup size="lg" flex={1} minW="300px">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Caută după număr, marcă sau model..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    size="lg"
                    borderRadius="xl"
                    bg={useColorModeValue('white', 'gray.700')}
                    border="2px solid"
                    borderColor={borderColor}
                    _focus={{
                      borderColor: 'blue.400',
                      boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)'
                    }}
                    _hover={{ borderColor: 'gray.300' }}
                  />
                </InputGroup>
                <Select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  size="lg"
                  borderRadius="xl"
                  w="200px"
                  bg={useColorModeValue('white', 'gray.700')}
                  border="2px solid"
                  borderColor={borderColor}
                  _focus={{
                    borderColor: 'blue.400',
                    boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)'
                  }}
                  _hover={{ borderColor: 'gray.300' }}
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
                  icon={<Icon as={FiRefreshCw} />}
                  size="lg"
                  borderRadius="xl"
                  onClick={loadVehicles}
                  isLoading={loading}
                  colorScheme="purple"
                  variant="outline"
                  _hover={{ 
                    bg: 'purple.50',
                    transform: 'translateY(-2px)',
                    boxShadow: 'md'
                  }}
                  _active={{ transform: 'translateY(0)' }}
                  transition="all 0.2s"
                />
              </Flex>
            </VStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Enhanced Table */}
      <Card
        bg={cardBg}
        borderRadius="xl"
        boxShadow="lg"
        border="1px solid"
        borderColor={borderColor}
        animation={`${fadeInUp} 1.2s ease-out`}
        overflow="hidden"
      >
        <CardHeader pb={4}>
          <Text fontSize="xl" fontWeight="bold" color={textColor}>
            Vehicule ({filteredVehicles.length})
          </Text>
        </CardHeader>
        <CardBody p={0}>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                <Tr>
                  <Th color={textColor} fontWeight="semibold">Număr Înmatriculare</Th>
                  <Th color={textColor} fontWeight="semibold">Marcă & Model</Th>
                  <Th color={textColor} fontWeight="semibold">Status</Th>
                  <Th color={textColor} fontWeight="semibold">Departament</Th>
                  <Th color={textColor} fontWeight="semibold">Acțiuni</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredVehicles.map((vehicle, index) => (
                  <Tr
                    key={vehicle.id}
                    _hover={{ bg: hoverBg }}
                    transition="all 0.2s"
                    animation={`${slideIn} ${0.1 * index}s ease-out`}
                  >
                    <Td fontWeight="bold" color={textColor}>
                      {vehicle.registration_number}
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold" color={textColor}>
                          {vehicle.brand}
                        </Text>
                        <Text fontSize="sm" color={mutedText}>
                          {vehicle.model} ({vehicle.year})
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={statusColors[vehicle.status as VehicleStatus]}
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="sm"
                        fontWeight="medium"
                      >
                        {statusNames[vehicle.status as VehicleStatus]}
                      </Badge>
                    </Td>
                    <Td>
                      {vehicle.assigned_department_id ? (
                        <Text color={textColor} fontWeight="medium">
                          Departamentul {vehicle.assigned_department_id}
                        </Text>
                      ) : (
                        <Text color={mutedText} fontStyle="italic">
                          Neasignat
                        </Text>
                      )}
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Tooltip label="Vezi istoric" placement="top">
                          <IconButton
                            aria-label="Vezi istoric"
                            icon={<Icon as={FiClock} />}
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={() => handleViewHistory(vehicle)}
                            _hover={{ 
                              bg: 'blue.50',
                              transform: 'scale(1.1)'
                            }}
                            transition="all 0.2s"
                          />
                        </Tooltip>
                        <Tooltip label="Vezi documente" placement="top">
                          <IconButton
                            aria-label="Vezi documente"
                            icon={<Icon as={FiFileText} />}
                            size="sm"
                            variant="ghost"
                            colorScheme="purple"
                            onClick={() => handleViewDocuments(vehicle)}
                            _hover={{ 
                              bg: 'purple.50',
                              transform: 'scale(1.1)'
                            }}
                            transition="all 0.2s"
                          />
                        </Tooltip>
                        <Tooltip label="Editează" placement="top">
                          <IconButton
                            aria-label="Editează"
                            icon={<Icon as={FiEdit2} />}
                            size="sm"
                            variant="ghost"
                            colorScheme="green"
                            onClick={() => handleEdit(vehicle)}
                            _hover={{ 
                              bg: 'green.50',
                              transform: 'scale(1.1)'
                            }}
                            transition="all 0.2s"
                          />
                        </Tooltip>
                        <Tooltip label="Șterge" placement="top">
                          <IconButton
                            aria-label="Șterge"
                            icon={<Icon as={FiTrash2} />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDelete(vehicle.id)}
                            _hover={{ 
                              bg: 'red.50',
                              transform: 'scale(1.1)'
                            }}
                            transition="all 0.2s"
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>

      {/* Modale */}
      <VehicleFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
        vehicle={selectedVehicle}
        onSuccess={handleModalSuccess}
      />

      {selectedVehicle && (
        <>
          <VehicleDocuments
            isOpen={isDocsOpen}
            onClose={onDocsClose}
            vehicle={selectedVehicle}
          />
          <VehicleHistory
            isOpen={isHistoryOpen}
            onClose={onHistoryClose}
            vehicle={selectedVehicle}
          />
        </>
      )}

      {/* Modal pentru Centralizatorul de Consum Motorină */}
      <FuelConsumptionModal
        isOpen={isFuelModalOpen}
        onClose={onFuelModalClose}
      />

      {/* Modal pentru Fișa Activitații Zilnice */}
      <DailyActivityModal
        isOpen={isActivityModalOpen}
        onClose={onActivityModalClose}
      />
    </VStack>
  );
} 