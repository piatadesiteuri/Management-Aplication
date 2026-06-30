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
  Badge,
  Box,
  Divider,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  useToast,
  useDisclosure,
  IconButton,
  Card,
  CardBody,
  CardHeader,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import {
  FiTool,
  FiDroplet,
  FiClock,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiTruck,
  FiUser,
  FiActivity,
  FiTrendingUp,
  FiAlertTriangle,
  FiPlus,
  FiZap,
  FiTarget,
  FiBarChart,
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { Vehicle, MaintenanceRecord, FuelRecord, VehicleUsageRecord } from '../../types/vehicles';
import MaintenanceFormModal from './MaintenanceFormModal';
import FuelFormModal from './FuelFormModal';
import UsageFormModal from './UsageFormModal';

// Animații
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

interface VehicleHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
}

interface ExtendedMaintenanceRecord extends MaintenanceRecord {
  status: 'COMPLETED' | 'PENDING' | 'IN_PROGRESS';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface ExtendedFuelRecord extends FuelRecord {
  efficiency: number; // km/l
  costPerKm: number;
}

export default function VehicleHistory({
  isOpen,
  onClose,
  vehicle,
}: VehicleHistoryProps) {
  const [maintenanceHistory, setMaintenanceHistory] = useState<ExtendedMaintenanceRecord[]>([]);
  const [fuelHistory, setFuelHistory] = useState<ExtendedFuelRecord[]>([]);
  const [usageHistory, setUsageHistory] = useState<VehicleUsageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedText = useColorModeValue('gray.600', 'gray.400');

  // Modale pentru adăugare
  const {
    isOpen: isMaintenanceModalOpen,
    onOpen: onMaintenanceModalOpen,
    onClose: onMaintenanceModalClose
  } = useDisclosure();
  const {
    isOpen: isFuelModalOpen,
    onOpen: onFuelModalOpen,
    onClose: onFuelModalClose
  } = useDisclosure();
  const {
    isOpen: isUsageModalOpen,
    onOpen: onUsageModalOpen,
    onClose: onUsageModalClose
  } = useDisclosure();

  useEffect(() => {
    if (isOpen) {
      loadHistoryData();
    }
  }, [isOpen]);

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      
      // Încarc datele din baza de date
      const vehicleService = new (await import('../../services/vehicles/VehicleService')).VehicleService();
      const historyData = await vehicleService.getVehicleHistory(vehicle.id);
      
      console.log('📊 Raw history data from API:', historyData);
      
      // Transform datele pentru mentenanță
      const transformedMaintenance: ExtendedMaintenanceRecord[] = historyData.maintenance.map((record: any) => ({
        id: record.id,
        date: record.date,
        type: record.type,
        description: record.description,
        cost: record.cost,
        mileage: record.mileage,
        performedBy: record.performed_by,
        status: record.status,
        priority: record.priority,
      }));
      
      // Transform datele pentru combustibil
      const transformedFuel: ExtendedFuelRecord[] = historyData.fuel.map((record: any) => ({
        id: record.id,
        date: record.date,
        quantity: record.quantity,
        cost: record.cost,
        mileage: record.mileage,
        fuelType: record.fuel_type,
        location: record.location,
        driver: record.driver,
        efficiency: record.efficiency,
        costPerKm: record.cost_per_km,
      }));
      
      // Transform datele pentru utilizare
      const transformedUsage: VehicleUsageRecord[] = historyData.usage.map((record: any) => ({
        id: record.id,
        vehicleId: record.vehicle_id,
        userId: record.user_id,
        startDate: record.start_date,
        endDate: record.end_date,
        startMileage: record.start_mileage,
        endMileage: record.end_mileage,
        purpose: record.purpose,
        route: record.route,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      }));
      
      console.log('✅ History data loaded from database:', {
        maintenance: transformedMaintenance.length,
        fuel: transformedFuel.length,
        usage: transformedUsage.length
      });
      
      setMaintenanceHistory(transformedMaintenance);
      setFuelHistory(transformedFuel);
      setUsageHistory(transformedUsage);
      
      if (transformedMaintenance.length === 0 && transformedFuel.length === 0 && transformedUsage.length === 0) {
        console.log('ℹ️ No history found for this vehicle');
      }
    } catch (error: any) {
      console.error('❌ Error loading history data from database:', error);
      
      // Afișez eroarea
      toast({
        title: 'Eroare încărcare istoric',
        description: error.response?.data?.message || 'Nu s-au putut încărca datele istoricului din baza de date.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      // Setez liste goale în caz de eroare
      setMaintenanceHistory([]);
      setFuelHistory([]);
      setUsageHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const totalMaintenanceCost = maintenanceHistory.reduce((sum, record) => sum + (record.cost || 0), 0);
  const totalFuelCost = fuelHistory.reduce((sum, record) => sum + (record.cost || 0), 0);
  const averageEfficiency = fuelHistory.length > 0 
    ? fuelHistory.reduce((sum, record) => sum + (record.efficiency || 0), 0) / fuelHistory.length 
    : 0;
  const totalKmTraveled = usageHistory.reduce((sum, record) => sum + ((record.endMileage || 0) - (record.startMileage || 0)), 0);

  console.log('📊 [DEBUG] Statistics calculation:', {
    maintenanceHistory: maintenanceHistory.length,
    fuelHistory: fuelHistory.length,
    usageHistory: usageHistory.length,
    totalMaintenanceCost,
    totalFuelCost,
    averageEfficiency,
    totalKmTraveled
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'green';
      case 'MEDIUM': return 'yellow';
      case 'HIGH': return 'orange';
      case 'CRITICAL': return 'red';
      default: return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'green';
      case 'IN_PROGRESS': return 'blue';
      case 'PENDING': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="6xl"
      motionPreset="slideInBottom"
      scrollBehavior="inside"
    >
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent 
        borderRadius="2xl" 
        bg={bgColor}
        boxShadow="2xl"
        border="1px solid"
        borderColor={borderColor}
        animation={`${fadeInUp} 0.3s ease-out`}
      >
        <ModalHeader 
          borderBottom="1px solid" 
          borderColor={borderColor}
          pb={6}
        >
          <VStack align="start" spacing={3}>
            <HStack spacing={3}>
              <Box
                p={2}
                borderRadius="lg"
                bgGradient="linear(to-r, purple.100, purple.200)"
                color="purple.600"
              >
                <Icon as={FiActivity} boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="xl" fontWeight="bold" color={textColor}>
                  Istoric Vehicul
                </Text>
                <Text fontSize="sm" color={mutedText}>
                  {vehicle.brand} {vehicle.model} - {vehicle.registration_number}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </ModalHeader>

        <ModalBody p={8}>
          <VStack spacing={8} align="stretch">
            {/* Enhanced Statistics Cards */}
            <Box animation={`${fadeInUp} 0.5s ease-out`}>
              <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={4}>
                Statistici Generale
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
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
                        <Icon as={FiTool} boxSize={5} />
                      </Box>
                      <Stat>
                        <StatLabel color={mutedText} fontSize="sm" fontWeight="medium">
                          Costuri Mentenanță
                        </StatLabel>
                        <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>
                          {formatCurrency(totalMaintenanceCost)}
                        </StatNumber>
                        <StatHelpText color="blue.500" fontSize="sm">
                          <StatArrow type="increase" />
                          {maintenanceHistory.length} intervenții
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
                        <Icon as={FiDroplet} boxSize={5} />
                      </Box>
                      <Stat>
                        <StatLabel color={mutedText} fontSize="sm" fontWeight="medium">
                          Costuri Combustibil
                        </StatLabel>
                        <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>
                          {formatCurrency(totalFuelCost)}
                        </StatNumber>
                        <StatHelpText color="green.500" fontSize="sm">
                          <StatArrow type="increase" />
                          {fuelHistory.length} alimentări
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
                        <Icon as={FiBarChart} boxSize={5} />
                      </Box>
                      <Stat>
                        <StatLabel color={mutedText} fontSize="sm" fontWeight="medium">
                          Eficiență Medie
                        </StatLabel>
                        <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>
                          {averageEfficiency.toFixed(1)} L/100km
                        </StatNumber>
                        <StatHelpText color="orange.500" fontSize="sm">
                          Consum mediu
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
                        bgGradient="linear(to-r, red.100, red.200)"
                        color="red.600"
                      >
                        <Icon as={FiMapPin} boxSize={5} />
                      </Box>
                      <Stat>
                        <StatLabel color={mutedText} fontSize="sm" fontWeight="medium">
                          Km Parcurși
                        </StatLabel>
                        <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>
                          {totalKmTraveled.toLocaleString()}
                        </StatNumber>
                        <StatHelpText color="red.500" fontSize="sm">
                          În ultimele călătorii
                        </StatHelpText>
                      </Stat>
                    </HStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </Box>

            {/* Enhanced Tabs */}
            <Box animation={`${fadeInUp} 0.7s ease-out`}>
              <Tabs variant="enclosed" colorScheme="blue">
                <TabList bg={cardBg} borderRadius="xl" p={1} border="1px solid" borderColor={borderColor}>
                  <Tab
                    borderRadius="lg"
                    _selected={{
                      bg: 'blue.500',
                      color: 'white',
                      boxShadow: 'md'
                    }}
                    _hover={{
                      bg: 'blue.50',
                      color: 'blue.600'
                    }}
                    transition="all 0.2s"
                  >
                    <HStack spacing={2}>
                      <Icon as={FiTool} />
                      <Text>Mentenanță ({maintenanceHistory.length})</Text>
                      <Tooltip label="Adaugă înregistrare mentenanță" placement="top">
                        <IconButton
                          aria-label="Adaugă mentenanță"
                          icon={<Icon as={FiPlus} />}
                          size="xs"
                          variant="ghost"
                          onClick={onMaintenanceModalOpen}
                          _hover={{ bg: 'blue.100' }}
                          transition="all 0.2s"
                        />
                      </Tooltip>
                    </HStack>
                  </Tab>
                  <Tab
                    borderRadius="lg"
                    _selected={{
                      bg: 'green.500',
                      color: 'white',
                      boxShadow: 'md'
                    }}
                    _hover={{
                      bg: 'green.50',
                      color: 'green.600'
                    }}
                    transition="all 0.2s"
                  >
                    <HStack spacing={2}>
                      <Icon as={FiDroplet} />
                      <Text>Combustibil ({fuelHistory.length})</Text>
                      <Tooltip label="Adaugă înregistrare combustibil" placement="top">
                        <IconButton
                          aria-label="Adaugă combustibil"
                          icon={<Icon as={FiPlus} />}
                          size="xs"
                          variant="ghost"
                          onClick={onFuelModalOpen}
                          _hover={{ bg: 'green.100' }}
                          transition="all 0.2s"
                        />
                      </Tooltip>
                    </HStack>
                  </Tab>
                  <Tab
                    borderRadius="lg"
                    _selected={{
                      bg: 'purple.500',
                      color: 'white',
                      boxShadow: 'md'
                    }}
                    _hover={{
                      bg: 'purple.50',
                      color: 'purple.600'
                    }}
                    transition="all 0.2s"
                  >
                    <HStack spacing={2}>
                      <Icon as={FiTruck} />
                      <Text>Utilizare ({usageHistory.length})</Text>
                      <Tooltip label="Adaugă înregistrare utilizare" placement="top">
                        <IconButton
                          aria-label="Adaugă utilizare"
                          icon={<Icon as={FiPlus} />}
                          size="xs"
                          variant="ghost"
                          onClick={onUsageModalOpen}
                          _hover={{ bg: 'purple.100' }}
                          transition="all 0.2s"
                        />
                      </Tooltip>
                    </HStack>
                  </Tab>
                </TabList>

                <TabPanels>
                  {/* Maintenance Tab */}
                  <TabPanel p={6}>
                    <Card
                      bg={cardBg}
                      borderRadius="xl"
                      boxShadow="lg"
                      border="1px solid"
                      borderColor={borderColor}
                      overflow="hidden"
                    >
                      <CardBody p={0}>
                        {maintenanceHistory.length === 0 ? (
                          <Box p={12} textAlign="center">
                            <VStack spacing={4}>
                              <Box
                                p={4}
                                borderRadius="full"
                                bg={useColorModeValue('gray.100', 'gray.700')}
                                color={mutedText}
                              >
                                <Icon as={FiTool} boxSize={8} />
                              </Box>
                              <Text fontSize="lg" color={mutedText}>
                                Niciun istoric de mentenanță
                              </Text>
                              <Text color={mutedText}>
                                Datele de mentenanță vor apărea aici
                              </Text>
                            </VStack>
                          </Box>
                        ) : (
                          <Box overflowX="auto">
                            <Table variant="simple">
                              <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                                <Tr>
                                  <Th color={textColor} fontWeight="semibold">Data</Th>
                                  <Th color={textColor} fontWeight="semibold">Tip Intervenție</Th>
                                  <Th color={textColor} fontWeight="semibold">Descriere</Th>
                                  <Th color={textColor} fontWeight="semibold">Kilometraj</Th>
                                  <Th color={textColor} fontWeight="semibold">Cost</Th>
                                  <Th color={textColor} fontWeight="semibold">Status</Th>
                                  <Th color={textColor} fontWeight="semibold">Prioritate</Th>
                                  <Th color={textColor} fontWeight="semibold">Executant</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {maintenanceHistory.map((record, index) => (
                                  <Tr
                                    key={record.id}
                                    _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                                    transition="all 0.2s"
                                    animation={`${slideIn} ${0.1 * index}s ease-out`}
                                  >
                                    <Td fontWeight="medium" color={textColor}>
                                      {formatDate(record.date)}
                                    </Td>
                                    <Td>
                                      <Badge
                                        colorScheme="blue"
                                        px={3}
                                        py={1}
                                        borderRadius="full"
                                        fontSize="sm"
                                        fontWeight="medium"
                                      >
                                        {record.type}
                                      </Badge>
                                    </Td>
                                    <Td color={textColor}>
                                      {record.description}
                                    </Td>
                                    <Td color={textColor}>
                                      {record.mileage?.toLocaleString()} km
                                    </Td>
                                    <Td fontWeight="bold" color={textColor}>
                                      {formatCurrency(record.cost)}
                                    </Td>
                                    <Td>
                                      <Badge
                                        colorScheme={getStatusColor(record.status)}
                                        px={3}
                                        py={1}
                                        borderRadius="full"
                                        fontSize="sm"
                                        fontWeight="medium"
                                      >
                                        {record.status}
                                      </Badge>
                                    </Td>
                                    <Td>
                                      <Badge
                                        colorScheme={getPriorityColor(record.priority)}
                                        px={3}
                                        py={1}
                                        borderRadius="full"
                                        fontSize="sm"
                                        fontWeight="medium"
                                      >
                                        {record.priority}
                                      </Badge>
                                    </Td>
                                    <Td color={textColor} fontWeight="medium">
                                      {record.performedBy}
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </Box>
                        )}
                      </CardBody>
                    </Card>
                  </TabPanel>

                  {/* Fuel Tab */}
                  <TabPanel p={6}>
                    <Card
                      bg={cardBg}
                      borderRadius="xl"
                      boxShadow="lg"
                      border="1px solid"
                      borderColor={borderColor}
                      overflow="hidden"
                    >
                      <CardBody p={0}>
                        {fuelHistory.length === 0 ? (
                          <Box p={12} textAlign="center">
                            <VStack spacing={4}>
                              <Box
                                p={4}
                                borderRadius="full"
                                bg={useColorModeValue('gray.100', 'gray.700')}
                                color={mutedText}
                              >
                                <Icon as={FiDroplet} boxSize={8} />
                              </Box>
                              <Text fontSize="lg" color={mutedText}>
                                Niciun istoric de alimentare
                              </Text>
                              <Text color={mutedText}>
                                Datele de alimentare vor apărea aici
                              </Text>
                            </VStack>
                          </Box>
                        ) : (
                          <Box overflowX="auto">
                            <Table variant="simple">
                              <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                                <Tr>
                                  <Th color={textColor} fontWeight="semibold">Data</Th>
                                  <Th color={textColor} fontWeight="semibold">Tip Combustibil</Th>
                                  <Th color={textColor} fontWeight="semibold">Cantitate</Th>
                                  <Th color={textColor} fontWeight="semibold">Cost</Th>
                                  <Th color={textColor} fontWeight="semibold">Kilometraj</Th>
                                  <Th color={textColor} fontWeight="semibold">Eficiență</Th>
                                  <Th color={textColor} fontWeight="semibold">Cost/km</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {fuelHistory.map((record, index) => (
                                  <Tr
                                    key={record.id}
                                    _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                                    transition="all 0.2s"
                                    animation={`${slideIn} ${0.1 * index}s ease-out`}
                                  >
                                    <Td fontWeight="medium" color={textColor}>
                                      {formatDate(record.date)}
                                    </Td>
                                    <Td>
                                      <Badge
                                        colorScheme="green"
                                        px={3}
                                        py={1}
                                        borderRadius="full"
                                        fontSize="sm"
                                        fontWeight="medium"
                                      >
                                        {record.fuelType}
                                      </Badge>
                                    </Td>
                                    <Td color={textColor}>
                                      {record.quantity} L
                                    </Td>
                                    <Td fontWeight="bold" color={textColor}>
                                      {formatCurrency(record.cost)}
                                    </Td>
                                    <Td color={textColor}>
                                      {record.mileage?.toLocaleString()} km
                                    </Td>
                                    <Td color={textColor}>
                                      {typeof record.efficiency === 'number' && !isNaN(record.efficiency)
                                        ? record.efficiency.toFixed(1) + ' km/L'
                                        : '-'}
                                    </Td>
                                    <Td color={textColor}>
                                      {formatCurrency(record.costPerKm)}/km
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </Box>
                        )}
                      </CardBody>
                    </Card>
                  </TabPanel>

                  {/* Usage Tab */}
                  <TabPanel p={6}>
                    <Card
                      bg={cardBg}
                      borderRadius="xl"
                      boxShadow="lg"
                      border="1px solid"
                      borderColor={borderColor}
                      overflow="hidden"
                    >
                      <CardBody p={0}>
                        {usageHistory.length === 0 ? (
                          <Box p={12} textAlign="center">
                            <VStack spacing={4}>
                              <Box
                                p={4}
                                borderRadius="full"
                                bg={useColorModeValue('gray.100', 'gray.700')}
                                color={mutedText}
                              >
                                <Icon as={FiTruck} boxSize={8} />
                              </Box>
                              <Text fontSize="lg" color={mutedText}>
                                Niciun istoric de utilizare
                              </Text>
                              <Text color={mutedText}>
                                Datele de utilizare vor apărea aici
                              </Text>
                            </VStack>
                          </Box>
                        ) : (
                          <Box overflowX="auto">
                            <Table variant="simple">
                              <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                                <Tr>
                                                                     <Th color={textColor} fontWeight="semibold">Perioada</Th>
                                   <Th color={textColor} fontWeight="semibold">Traseu</Th>
                                   <Th color={textColor} fontWeight="semibold">Scop</Th>
                                   <Th color={textColor} fontWeight="semibold">Utilizator</Th>
                                   <Th color={textColor} fontWeight="semibold">Km Parcurși</Th>
                                   <Th color={textColor} fontWeight="semibold">Durată</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {usageHistory.map((record, index) => (
                                  <Tr
                                    key={record.id}
                                    _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                                    transition="all 0.2s"
                                    animation={`${slideIn} ${0.1 * index}s ease-out`}
                                  >
                                    <Td>
                                      <VStack align="start" spacing={0}>
                                        <Text fontSize="sm" color={textColor}>
                                          {formatDate(record.startDate)}
                                        </Text>
                                        <Text fontSize="xs" color={mutedText}>
                                          până la {formatDate(record.endDate)}
                                        </Text>
                                      </VStack>
                                    </Td>
                                                                         <Td color={textColor}>
                                       {record.route || 'N/A'}
                                     </Td>
                                     <Td color={textColor}>
                                       {record.purpose}
                                     </Td>
                                     <Td color={textColor}>
                                       Utilizator {record.userId}
                                     </Td>
                                     <Td color={textColor}>
                                       {(record.endMileage - record.startMileage).toLocaleString()} km
                                     </Td>
                                     <Td color={textColor}>
                                       {Math.ceil((new Date(record.endDate).getTime() - new Date(record.startDate).getTime()) / (1000 * 60 * 60 * 24))} zile
                                     </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </Box>
                        )}
                      </CardBody>
                    </Card>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor} pt={6}>
          <Button
            onClick={onClose}
            colorScheme="gray"
            variant="outline"
            borderRadius="xl"
            px={8}
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: 'md'
            }}
            transition="all 0.2s"
          >
            Închide
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

    {/* Modale pentru adăugare */}
    <MaintenanceFormModal
      isOpen={isMaintenanceModalOpen}
      onClose={onMaintenanceModalClose}
      vehicleId={vehicle.id}
      onSuccess={() => {
        loadHistoryData();
        onMaintenanceModalClose();
      }}
    />

    <FuelFormModal
      isOpen={isFuelModalOpen}
      onClose={onFuelModalClose}
      vehicleId={vehicle.id}
      onSuccess={() => {
        loadHistoryData();
        onFuelModalClose();
      }}
    />

    <UsageFormModal
      isOpen={isUsageModalOpen}
      onClose={onUsageModalClose}
      vehicleId={vehicle.id}
      onSuccess={() => {
        loadHistoryData();
        onUsageModalClose();
      }}
    />
    </>
  );
}
