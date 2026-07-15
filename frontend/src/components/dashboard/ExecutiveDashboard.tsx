import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  GridItem,
  VStack,
  HStack,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Badge,
  useColorModeValue,
  Spinner,
  Center,
  Select,
  Button,
  IconButton,
  Tooltip,
  Flex,
  Progress,
  Divider,
  SimpleGrid,
  useToast,
  usePrefersReducedMotion,
  ScaleFade,
  Fade,
  SlideFade,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiUsers,
  FiTruck,
  FiFileText,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiRefreshCw,
  FiDownload,
  FiCalendar,
  FiBarChart,
  FiTarget,
  FiZap,
  FiStar,
  FiAward,
  FiPackage,
} from 'react-icons/fi';
import { KPIService, DashboardKPIs } from '../../services/KPIService';
import { keyframes } from '@emotion/react';

interface ExecutiveDashboardProps {
  user?: any;
}

// Animații moderne
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const EVENT_TYPE_LABELS: Record<string, string> = {
  SUPPLY_ORDER: 'Comenzi aprovizionare',
  TRANSPORT_DELIVERY: 'Transport livrări',
  INSPECTION: 'Inspecții',
  MEETING: 'Ședințe',
  TRAINING: 'Formare',
  TRAVEL: 'Deplasări',
  STOCK_RECEPTION: 'Primire marfă',
  STOCK_DISTRIBUTION: 'Distribuire marfă',
  STOCK_MOVEMENT: 'Mutare marfă',
  INVENTORY_AUDIT: 'Inventariere',
  MAINTENANCE: 'Întreținere',
  OTHER: 'Altele',
};

export default function ExecutiveDashboard({ user }: ExecutiveDashboardProps) {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('current');
  const [refreshing, setRefreshing] = useState(false);
  
  const toast = useToast();
  const prefersReducedMotion = usePrefersReducedMotion();
  
  // Culori moderne cu glassmorphism
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(45, 55, 72, 0.8)');
  const glassBg = useColorModeValue('rgba(255, 255, 255, 0.1)', 'rgba(45, 55, 72, 0.1)');
  const gradientBg = useColorModeValue(
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)'
  );

  useEffect(() => {
    loadKPIs();
  }, [period]);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      const data = await KPIService.getDashboardKPIs(period);
      setKpis(data);
    } catch (error) {
      console.error('Error loading KPIs:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca KPI-urile',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadKPIs();
    setRefreshing(false);
    toast({
      title: 'Succes',
      description: 'KPI-urile au fost actualizate',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const getPeriodLabel = (value: string) => {
    switch (value) {
      case 'current': return 'Anul curent';
      case 'last_month': return 'Ultima lună';
      case 'last_quarter': return 'Ultimul trimestru';
      default: return 'Anul curent';
    }
  };

  const getKPIColor = (value: number, type: 'percentage' | 'time' | 'cost' | 'number'): string => {
    if (type === 'percentage') {
      if (value >= 80) return 'green';
      if (value >= 60) return 'yellow';
      return 'red';
    }
    if (type === 'time') {
      if (value <= 2) return 'green';
      if (value <= 6) return 'yellow';
      return 'red';
    }
    return 'blue';
  };

  // Componenta modernă pentru KPI Card
  const ModernStatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color = 'blue', 
    trend = 'up',
    type = 'number',
    delay = 0
  }: {
    title: string;
    value: number;
    subtitle?: string;
    icon: any;
    color?: string;
    trend?: 'up' | 'down' | 'neutral';
    type?: 'percentage' | 'time' | 'cost' | 'number';
    delay?: number;
  }) => (
    <ScaleFade in={true} initialScale={0.9} delay={delay}>
      <Card 
        bg={cardBg}
        backdropFilter="blur(10px)"
        border="1px solid"
        borderColor={borderColor}
        borderRadius="xl"
        h="full"
        transition="all 0.3s ease"
        _hover={{
          transform: 'translateY(-8px)',
          boxShadow: 'xl',
          borderColor: `${color}.300`,
        }}
        position="relative"
        overflow="hidden"
      >
        {/* Gradient overlay */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          height="4px"
          bg={`linear-gradient(90deg, ${color}.400, ${color}.600)`}
        />
        
        <CardBody p={6}>
          <HStack justify="space-between" mb={4}>
            <Box 
              p={3} 
              bg={`${color}.100`} 
              borderRadius="xl"
              animation={prefersReducedMotion ? undefined : `${float} 3s ease-in-out infinite`}
            >
              <Icon size={24} color={`var(--chakra-colors-${color}-500)`} />
            </Box>
            <Badge 
              colorScheme={getKPIColor(value, type)} 
              variant="subtle"
              borderRadius="full"
              px={3}
              py={1}
              fontSize="sm"
            >
              {trend === 'up' && <FiTrendingUp style={{ marginRight: '4px' }} />}
              {trend === 'down' && <FiTrendingDown style={{ marginRight: '4px' }} />}
              {trend === 'neutral' && <FiActivity style={{ marginRight: '4px' }} />}
              {type === 'percentage' ? 'Trend' : 'Status'}
            </Badge>
          </HStack>
          
          <Stat>
            <StatLabel 
              fontSize="sm" 
              color="gray.500" 
              fontWeight="medium"
              mb={2}
            >
              {title}
            </StatLabel>
            <StatNumber 
              fontSize="3xl" 
              fontWeight="bold" 
              color={`${color}.500`}
              mb={1}
            >
              {type === 'percentage' && KPIService.formatPercentage(value)}
              {type === 'cost' && KPIService.formatCost(value)}
              {type === 'time' && KPIService.formatTime(value)}
              {type === 'number' && KPIService.formatNumber(value)}
            </StatNumber>
            {subtitle && (
              <StatHelpText 
                fontSize="xs" 
                color="gray.400"
                mb={0}
              >
                {subtitle}
              </StatHelpText>
            )}
          </Stat>
        </CardBody>
      </Card>
    </ScaleFade>
  );

  // Loading state modern
  if (loading) {
    return (
      <Center py={20}>
        <VStack spacing={6}>
          <Box
            position="relative"
            animation={prefersReducedMotion ? undefined : `${pulse} 2s ease-in-out infinite`}
          >
            <Spinner 
              size="xl" 
              color="green.500"
              thickness="4px"
              speed="0.8s"
            />
          </Box>
          <Fade in={true}>
            <VStack spacing={2}>
              <Text 
                fontSize="lg" 
                fontWeight="semibold" 
                color="gray.500"
                textAlign="center"
              >
                Se încarcă indicatorii operaționali...
              </Text>
              <Text 
                fontSize="sm" 
                color="gray.400"
                textAlign="center"
              >
                Date reale din baza de date
              </Text>
            </VStack>
          </Fade>
        </VStack>
      </Center>
    );
  }

  if (!kpis) {
    return (
      <Center py={20}>
        <VStack spacing={6}>
          <Box
            p={6}
            bg={cardBg}
            borderRadius="xl"
            border="1px solid"
            borderColor={borderColor}
          >
            <FiAlertTriangle size={48} color="gray.400" />
          </Box>
          <VStack spacing={3}>
            <Text color="gray.500" fontSize="lg" fontWeight="medium">
              Nu s-au putut încărca KPI-urile
            </Text>
            <Button 
              onClick={loadKPIs} 
              colorScheme="green"
              leftIcon={<FiRefreshCw />}
              borderRadius="full"
              px={8}
            >
              Reîncearcă
            </Button>
          </VStack>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={6} bg={useColorModeValue('gray.50', 'gray.900')} minH="100vh">
      {/* Header modern cu gradient */}
      <Box
        mb={8}
        p={6}
        bg={gradientBg}
        borderRadius="2xl"
        color="white"
        position="relative"
        overflow="hidden"
      >
        {/* Background pattern */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          opacity="0.1"
          backgroundImage="url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
        />
        
        <Flex justify="space-between" align="center" position="relative" zIndex={1}>
          <VStack align="start" spacing={2}>
            <Heading size="lg" color="white">
              Business Intelligence — Spital Brașov
            </Heading>
            <Text color="white" fontSize="md" opacity={0.9}>
              Indicatori operaționali calculați din evenimente, task-uri, vehicule și costuri
            </Text>
          </VStack>
          
          <HStack spacing={3}>
            <Select 
              size="sm" 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              maxW="200px"
              bg="white"
              color="gray.800"
              borderRadius="full"
              border="none"
            >
              <option value="current">Anul curent</option>
              <option value="last_month">Ultima lună</option>
              <option value="last_quarter">Ultimul trimestru</option>
            </Select>
            
            <Tooltip label="Reîmprospătează KPI-urile">
              <IconButton
                aria-label="Reîmprospătează"
                icon={<FiRefreshCw />}
                onClick={handleRefresh}
                isLoading={refreshing}
                colorScheme="whiteAlpha"
                variant="solid"
                size="sm"
                borderRadius="full"
              />
            </Tooltip>
            
            <Tooltip label="Descarcă raport">
              <IconButton
                aria-label="Descarcă raport"
                icon={<FiDownload />}
                colorScheme="whiteAlpha"
                variant="solid"
                size="sm"
                borderRadius="full"
              />
            </Tooltip>
          </HStack>
        </Flex>
      </Box>

      {/* Perioada selectată */}
      <SlideFade in={true} offsetY="20px">
        <Box 
          mb={8} 
          p={4} 
          bg={cardBg} 
          borderRadius="xl" 
          border="1px solid" 
          borderColor={borderColor}
          backdropFilter="blur(10px)"
        >
          <HStack spacing={3}>
            <FiCalendar color="green.500" />
            <Text fontSize="sm" color="gray.600">
              📅 Perioada: <strong>{getPeriodLabel(period)}</strong>
              {kpis.period && (
                <> ({kpis.period.startDate} — {kpis.period.endDate})</>
              )}
            </Text>
          </HStack>
        </Box>
      </SlideFade>

      {/* KPI-uri principale cu animații staggered */}
      <Grid templateColumns="repeat(12, 1fr)" gap={6} mb={8}>
        <GridItem colSpan={{ base: 12, md: 6, lg: 3 }}>
          <ModernStatCard
            title="Total Evenimente"
            value={kpis.events.total}
            subtitle="În perioada selectată"
            icon={FiCalendar}
            color="blue"
            type="number"
            delay={0.1}
          />
        </GridItem>

        <GridItem colSpan={{ base: 12, md: 6, lg: 3 }}>
          <ModernStatCard
            title="Rata Finalizare"
            value={kpis.events.completionRate}
            subtitle="Evenimente completate"
            icon={FiActivity}
            color="green"
            type="percentage"
            trend="up"
            delay={0.2}
          />
        </GridItem>

        <GridItem colSpan={{ base: 12, md: 6, lg: 3 }}>
          <ModernStatCard
            title="Comenzi Aprovizionare"
            value={kpis.events.supplyOrders}
            subtitle="SUPPLY_ORDER"
            icon={FiPackage}
            color="orange"
            type="number"
            delay={0.3}
          />
        </GridItem>

        <GridItem colSpan={{ base: 12, md: 6, lg: 3 }}>
          <ModernStatCard
            title="Inspecții"
            value={kpis.events.inspections}
            subtitle="Evenimente de tip inspecție"
            icon={FiCheckCircle}
            color="teal"
            type="number"
            delay={0.4}
          />
        </GridItem>
      </Grid>

      {/* KPI-uri secundare */}
      <Grid templateColumns="repeat(12, 1fr)" gap={6} mb={8}>
        <GridItem colSpan={{ base: 12, md: 6, lg: 4 }}>
          <ModernStatCard
            title="Transporturi"
            value={kpis.events.transportDeliveries}
            subtitle="Livrări materiale"
            icon={FiTruck}
            color="purple"
            type="number"
            delay={0.5}
          />
        </GridItem>

        <GridItem colSpan={{ base: 12, md: 6, lg: 4 }}>
          <ModernStatCard
            title="Conformitate Inspecții"
            value={kpis.inspection.complianceRate}
            subtitle="Inspecții finalizate"
            icon={FiBarChart}
            color="green"
            type="percentage"
            trend="up"
            delay={0.6}
          />
        </GridItem>

        <GridItem colSpan={{ base: 12, md: 6, lg: 4 }}>
          <ModernStatCard
            title="Utilizare Vehicule"
            value={kpis.vehicles.utilizationRate}
            subtitle={`${kpis.vehicles.active} active din ${kpis.vehicles.total}`}
            icon={FiUsers}
            color="teal"
            type="percentage"
            delay={0.7}
          />
        </GridItem>
      </Grid>

      {/* Sumar general modern */}
      <Fade in={true} delay={0.8}>
        <Card 
          bg={cardBg} 
          border="1px solid" 
          borderColor={borderColor} 
          mb={8}
          borderRadius="2xl"
          backdropFilter="blur(10px)"
          overflow="hidden"
        >
          <CardHeader pb={4}>
            <HStack spacing={3}>
              <FiTarget color="green.500" />
              <Heading size="md" color="gray.700">📊 Sumar General</Heading>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
              <VStack spacing={3} p={4} bg={glassBg} borderRadius="xl">
                <FiCalendar size={24} color="blue.500" />
                <Text fontSize="sm" color="gray.500" fontWeight="medium">Total Evenimente</Text>
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {KPIService.formatNumber(kpis.events.total)}
                </Text>
              </VStack>
              
              <VStack spacing={3} p={4} bg={glassBg} borderRadius="xl">
                <FiCheckCircle size={24} color="green.500" />
                <Text fontSize="sm" color="gray.500" fontWeight="medium">Task-uri</Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {kpis.tasks.completed} / {kpis.tasks.total}
                </Text>
              </VStack>
              
              <VStack spacing={3} p={4} bg={glassBg} borderRadius="xl">
                <FiTruck size={24} color="purple.500" />
                <Text fontSize="sm" color="gray.500" fontWeight="medium">Distanță parcursă</Text>
                <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                  {KPIService.formatNumber(kpis.vehicles.totalDistance)} km
                </Text>
              </VStack>
              
              <VStack spacing={3} p={4} bg={glassBg} borderRadius="xl">
                <FiDollarSign size={24} color="orange.500" />
                <Text fontSize="sm" color="gray.500" fontWeight="medium">Costuri operaționale</Text>
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {KPIService.formatCost(kpis.costs.operationalTotal)}
                </Text>
              </VStack>
            </SimpleGrid>
          </CardBody>
        </Card>
      </Fade>

      {/* Progresul performanței modern */}
      <Fade in={true} delay={1}>
        <Card 
          bg={cardBg} 
          border="1px solid" 
          borderColor={borderColor}
          borderRadius="2xl"
          backdropFilter="blur(10px)"
        >
          <CardHeader pb={4}>
            <HStack spacing={3}>
              <FiAward color="purple.500" />
              <Heading size="md" color="gray.700">📈 Progresul Performanței</Heading>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={6} align="stretch">
              <Box>
                <Flex justify="space-between" mb={3}>
                  <HStack spacing={2}>
                    <FiCheckCircle color="green.500" />
                    <Text fontSize="sm" fontWeight="medium">Completarea Task-urilor</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.500" fontWeight="semibold">
                    {KPIService.formatPercentage(kpis.tasks.completionRate)}
                  </Text>
                </Flex>
                <Progress 
                  value={kpis.tasks.completionRate} 
                  colorScheme="green" 
                  size="lg" 
                  borderRadius="full"
                  bg="gray.100"
                  _hover={{ transform: 'scaleY(1.1)' }}
                  transition="all 0.3s ease"
                />
              </Box>
              
              <Box>
                <Flex justify="space-between" mb={3}>
                  <HStack spacing={2}>
                    <FiFileText color="blue.500" />
                    <Text fontSize="sm" fontWeight="medium">Finalizarea Evenimentelor</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.500" fontWeight="semibold">
                    {KPIService.formatPercentage(kpis.events.completionRate)}
                  </Text>
                </Flex>
                <Progress 
                  value={kpis.events.completionRate} 
                  colorScheme="blue" 
                  size="lg" 
                  borderRadius="full"
                  bg="gray.100"
                  _hover={{ transform: 'scaleY(1.1)' }}
                  transition="all 0.3s ease"
                />
              </Box>
              
              <Box>
                <Flex justify="space-between" mb={3}>
                  <HStack spacing={2}>
                    <FiClock color="purple.500" />
                    <Text fontSize="sm" fontWeight="medium">Timp mediu planificare</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.500" fontWeight="semibold">
                    {KPIService.formatTime(kpis.events.avgResponseTimeHours)}
                  </Text>
                </Flex>
                <Progress 
                  value={Math.min(kpis.events.avgResponseTimeHours, 72) / 72 * 100} 
                  colorScheme="purple" 
                  size="lg" 
                  borderRadius="full"
                  bg="gray.100"
                  _hover={{ transform: 'scaleY(1.1)' }}
                  transition="all 0.3s ease"
                />
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </Fade>

      <Fade in={true} delay={1.1}>
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mt={8}>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="2xl">
            <CardHeader pb={2}>
              <Heading size="md">Evenimente pe tip</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <TableContainer>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Tip</Th>
                      <Th isNumeric>Nr.</Th>
                      <Th isNumeric>Finalizare</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {kpis.eventTypes.length === 0 ? (
                      <Tr><Td colSpan={3} color="gray.500">Nicio activitate în perioada selectată</Td></Tr>
                    ) : kpis.eventTypes.map((item) => (
                      <Tr key={item.eventType}>
                        <Td>{EVENT_TYPE_LABELS[item.eventType] || item.eventType}</Td>
                        <Td isNumeric>{item.count}</Td>
                        <Td isNumeric>{KPIService.formatPercentage(item.completionRate)}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="2xl">
            <CardHeader pb={2}>
              <Heading size="md">Activitate pe departamente</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <TableContainer>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Departament</Th>
                      <Th isNumeric>Evenimente</Th>
                      <Th isNumeric>Task-uri</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {kpis.departments.filter((d) => d.eventsCount > 0 || d.tasksCount > 0).length === 0 ? (
                      <Tr><Td colSpan={3} color="gray.500">Nicio activitate pe departamente în perioada selectată</Td></Tr>
                    ) : kpis.departments
                      .filter((d) => d.eventsCount > 0 || d.tasksCount > 0)
                      .map((dept) => (
                        <Tr key={dept.departmentId}>
                          <Td>{dept.departmentName}</Td>
                          <Td isNumeric>{dept.eventsCount}</Td>
                          <Td isNumeric>{dept.tasksCount}</Td>
                        </Tr>
                      ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Fade>
    </Box>
  );
} 