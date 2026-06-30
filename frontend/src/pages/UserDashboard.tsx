import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Button,
  Badge,
  useColorModeValue,
  Flex,
  Icon,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Avatar,
  AvatarBadge,
  Tooltip,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Skeleton,
  SkeletonText,
  useToast,
} from '@chakra-ui/react';
import {
  FiCalendar,
  FiFileText,
  FiBarChart,
  FiUser,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiBell,
  FiPackage,
  FiTruck,
  FiUsers,
  FiMapPin,
  FiCpu,
  FiTarget,
  FiShield,
  FiAward,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

interface DashboardStats {
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  pendingDocuments: number;
  totalDocuments: number;
  materialRequests: number;
  transportOrders: number;
  notifications: number;
}

interface RecentActivity {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status: string;
}

interface UpcomingEvent {
  id: number;
  title: string;
  start_time: string;
  type: string;
  status: string;
  location?: string;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    pendingDocuments: 0,
    totalDocuments: 0,
    materialRequests: 0,
    transportOrders: 0,
    notifications: 0,
  });
  
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwt_token');
      
      // Load events statistics
      const eventsResponse = await fetch('/api/calendar/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.data;
        const now = new Date();
        const upcoming = eventsData.filter((e: any) => new Date(e.start_time) > now);
        const completed = eventsData.filter((e: any) => e.status === 'COMPLETED');
        
        setStats(prev => ({
          ...prev,
          totalEvents: eventsData.length,
          upcomingEvents: upcoming.length,
          completedEvents: completed.length,
        }));
        
        // Set upcoming events (next 5)
        setUpcomingEvents(upcoming.slice(0, 5));
      }

      // Load notifications count
      const notifResponse = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (notifResponse.ok) {
        const notifData = await notifResponse.json();
        const unread = notifData.filter((n: any) => n.status === 'unread');
        setStats(prev => ({ ...prev, notifications: unread.length }));
      }

      // Load material requests (if inspector)
      if (user?.roles?.includes('INSPECTOR')) {
        const mrResponse = await fetch('/api/material-requests', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (mrResponse.ok) {
          const mrData = await mrResponse.json();
          const pending = mrData.filter((r: any) => r.status === 'PENDING');
          setStats(prev => ({ ...prev, materialRequests: pending.length }));
        }
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (roles: string[]) => {
    if (roles.includes('BUDGET_OFFICER')) return 'Bugetar';
    if (roles.includes('INSPECTOR')) return 'Inspector DSP';
    if (roles.includes('WAREHOUSE_KEEPER')) return 'Magazioner';
    if (roles.includes('OPERATOR')) return 'Operator';
    if (roles.includes('MANAGER')) return 'Manager';
    if (roles.includes('DEPARTMENT_ADMIN')) return 'Administrator Departament';
    if (roles.includes('SUPER_ADMIN')) return 'Super Administrator';
    return 'Utilizator';
  };

  const getRoleColor = (roles: string[]) => {
    if (roles.includes('SUPER_ADMIN')) return 'red';
    if (roles.includes('BUDGET_OFFICER')) return 'teal';
    if (roles.includes('INSPECTOR')) return 'blue';
    if (roles.includes('WAREHOUSE_KEEPER')) return 'cyan';
    if (roles.includes('OPERATOR')) return 'green';
    if (roles.includes('MANAGER')) return 'purple';
    if (roles.includes('DEPARTMENT_ADMIN')) return 'orange';
    return 'gray';
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'MEETING': return FiUsers;
      case 'INSPECTION': return FiShield;
      case 'TRAINING': return FiAward;
      case 'TRANSPORT_DELIVERY': return FiTruck;
      case 'SUPPLY_ORDER': return FiPackage;
      default: return FiCalendar;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'MEETING': return 'blue';
      case 'INSPECTION': return 'purple';
      case 'TRAINING': return 'green';
      case 'TRANSPORT_DELIVERY': return 'orange';
      case 'SUPPLY_ORDER': return 'cyan';
      default: return 'gray';
    }
  };

  // Chart data
  const activityChartData = {
    labels: ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'],
    datasets: [
      {
        label: 'Evenimente',
        data: [12, 19, 3, 5, 2, 3, 9],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const eventTypeChartData = {
    labels: ['Inspecții', 'Întâlniri', 'Cursuri', 'Transport', 'Alte'],
    datasets: [
      {
        data: [35, 25, 15, 20, 5],
        backgroundColor: [
          'rgba(147, 51, 234, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(156, 163, 175, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: useColorModeValue('rgba(0,0,0,0.05)', 'rgba(255,255,255,0.05)'),
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  if (!user) {
    return (
      <Box p={8}>
        <Alert status="warning">
          <AlertIcon />
          <AlertTitle>Acces restricționat!</AlertTitle>
          <AlertDescription>
            Trebuie să fii autentificat pentru a accesa dashboard-ul.
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6} bg={bgColor} minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Welcome Header with Avatar */}
        <Card bg={cardBg} shadow="lg" borderRadius="xl" overflow="hidden">
          <Box bgGradient="linear(to-r, blue.500, purple.600)" h="120px" position="relative">
            <Box position="absolute" bottom="-40px" left="30px">
              <Avatar
                size="xl"
                name={`${user.first_name} ${user.last_name}`}
                bg={getRoleColor(user.roles) + '.500'}
                border="4px solid white"
              >
                <AvatarBadge boxSize="1.25em" bg="green.500" borderColor="white" />
              </Avatar>
            </Box>
          </Box>
          <CardBody pt="50px">
            <Flex justify="space-between" align="center">
              <VStack align="start" spacing={2}>
                <Heading size="lg" color={textColor}>
                  Bun venit, {user.first_name} {user.last_name}!
                </Heading>
                <HStack spacing={3}>
                  <Badge colorScheme={getRoleColor(user.roles)} fontSize="md" px={3} py={1} borderRadius="full">
                    {getRoleDisplayName(user.roles)}
                  </Badge>
                  <Text color={mutedTextColor} fontSize="sm">
                    <Icon as={FiActivity} mr={1} />
                    Activ acum
                  </Text>
                </HStack>
                <Text color={mutedTextColor} fontSize="sm">
                  {user.email}
                </Text>
              </VStack>
              <VStack align="end" spacing={2}>
                <Button
                  leftIcon={<FiUser />}
                  colorScheme="blue"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/user/profile')}
                >
                  Profil
                </Button>
                <HStack spacing={2}>
                  <Tooltip label="Notificări">
                    <Button size="sm" variant="ghost" position="relative">
                      <Icon as={FiBell} />
                      {stats.notifications > 0 && (
                        <Badge
                          position="absolute"
                          top="-2px"
                          right="-2px"
                          colorScheme="red"
                          borderRadius="full"
                          fontSize="xs"
                        >
                          {stats.notifications}
                        </Badge>
                      )}
                    </Button>
                  </Tooltip>
                </HStack>
              </VStack>
            </Flex>
          </CardBody>
        </Card>

        {/* Key Metrics Grid */}
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
          <Skeleton isLoaded={!loading}>
            <Card bg={cardBg} shadow="md" borderRadius="lg" _hover={{ shadow: 'xl', transform: 'translateY(-2px)' }} transition="all 0.2s">
              <CardBody>
                <Stat>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Box p={3} bg="blue.50" borderRadius="lg">
                      <Icon as={FiCalendar} color="blue.500" boxSize={6} />
                    </Box>
                    <StatArrow type="increase" />
                  </Flex>
                  <StatLabel color={mutedTextColor} fontSize="sm" fontWeight="medium">
                    Evenimente Totale
                  </StatLabel>
                  <StatNumber color={textColor} fontSize="3xl" fontWeight="bold">
                    {stats.totalEvents}
                  </StatNumber>
                  <StatHelpText color="green.500" fontSize="xs">
                    +23.36% față de luna trecută
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </Skeleton>

          <Skeleton isLoaded={!loading}>
            <Card bg={cardBg} shadow="md" borderRadius="lg" _hover={{ shadow: 'xl', transform: 'translateY(-2px)' }} transition="all 0.2s">
              <CardBody>
                <Stat>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Box p={3} bg="orange.50" borderRadius="lg">
                      <Icon as={FiClock} color="orange.500" boxSize={6} />
                    </Box>
                    <StatArrow type="decrease" />
                  </Flex>
                  <StatLabel color={mutedTextColor} fontSize="sm" fontWeight="medium">
                    În Curând
                  </StatLabel>
                  <StatNumber color={textColor} fontSize="3xl" fontWeight="bold">
                    {stats.upcomingEvents}
                  </StatNumber>
                  <StatHelpText color="red.500" fontSize="xs">
                    -12.05% față de săptămâna trecută
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </Skeleton>

          <Skeleton isLoaded={!loading}>
            <Card bg={cardBg} shadow="md" borderRadius="lg" _hover={{ shadow: 'xl', transform: 'translateY(-2px)' }} transition="all 0.2s">
              <CardBody>
                <Stat>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Box p={3} bg="green.50" borderRadius="lg">
                      <Icon as={FiCheckCircle} color="green.500" boxSize={6} />
                    </Box>
                    <StatArrow type="increase" />
                  </Flex>
                  <StatLabel color={mutedTextColor} fontSize="sm" fontWeight="medium">
                    Finalizate
                  </StatLabel>
                  <StatNumber color={textColor} fontSize="3xl" fontWeight="bold">
                    {stats.completedEvents}
                  </StatNumber>
                  <StatHelpText color="green.500" fontSize="xs">
                    +8.12% față de luna trecută
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </Skeleton>

          <Skeleton isLoaded={!loading}>
            <Card bg={cardBg} shadow="md" borderRadius="lg" _hover={{ shadow: 'xl', transform: 'translateY(-2px)' }} transition="all 0.2s">
              <CardBody>
                <Stat>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Box p={3} bg="purple.50" borderRadius="lg">
                      <Icon as={FiFileText} color="purple.500" boxSize={6} />
                    </Box>
                    <StatArrow type="increase" />
                  </Flex>
                  <StatLabel color={mutedTextColor} fontSize="sm" fontWeight="medium">
                    Documente
                  </StatLabel>
                  <StatNumber color={textColor} fontSize="3xl" fontWeight="bold">
                    {stats.totalDocuments}
                  </StatNumber>
                  <StatHelpText color="green.500" fontSize="xs">
                    +15.23% față de luna trecută
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </Skeleton>
        </SimpleGrid>

        {/* Charts and Quick Stats */}
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
          {/* Activity Chart */}
          <Card bg={cardBg} shadow="md" borderRadius="lg" colSpan={{ base: 1, lg: 2 }}>
            <CardHeader>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Heading size="md" color={textColor}>
                    Activitate Săptămânală
                  </Heading>
                  <Text color={mutedTextColor} fontSize="sm">
                    Evenimente din ultima săptămână
                  </Text>
                </VStack>
                <Button size="sm" variant="ghost" leftIcon={<FiBarChart />}>
                  Vezi Raport
                </Button>
              </HStack>
            </CardHeader>
            <CardBody>
              <Box h="300px">
                <Line data={activityChartData} options={chartOptions} />
              </Box>
            </CardBody>
          </Card>

          {/* Event Type Distribution */}
          <Card bg={cardBg} shadow="md" borderRadius="lg">
            <CardHeader>
              <VStack align="start" spacing={1}>
                <Heading size="md" color={textColor}>
                  Tipuri Evenimente
                </Heading>
                <Text color={mutedTextColor} fontSize="sm">
                  Distribuție evenimente
                </Text>
              </VStack>
            </CardHeader>
            <CardBody>
              <Box h="300px">
                <Doughnut data={eventTypeChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </Box>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Upcoming Events and Quick Actions */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Upcoming Events */}
          <Card bg={cardBg} shadow="md" borderRadius="lg">
            <CardHeader>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Heading size="md" color={textColor}>
                    Evenimente Viitoare
                  </Heading>
                  <Text color={mutedTextColor} fontSize="sm">
                    Următoarele {upcomingEvents.length} evenimente programate
                  </Text>
                </VStack>
                <Button
                  size="sm"
                  colorScheme="blue"
                  variant="ghost"
                  leftIcon={<FiCalendar />}
                  onClick={() => navigate('/user/calendar')}
                >
                  Vezi Toate
                </Button>
              </HStack>
            </CardHeader>
            <CardBody>
              {loading ? (
                <VStack spacing={3}>
                  {[1, 2, 3].map(i => <SkeletonText key={i} noOfLines={2} spacing='2' w="100%" />)}
                </VStack>
              ) : upcomingEvents.length > 0 ? (
                <VStack spacing={3} align="stretch">
                  {upcomingEvents.map((event) => (
                    <Box
                      key={event.id}
                      p={4}
                      bg={hoverBg}
                      borderRadius="lg"
                      borderLeft="4px solid"
                      borderLeftColor={getEventTypeColor(event.type) + '.500'}
                      _hover={{ shadow: 'md', transform: 'translateX(2px)' }}
                      transition="all 0.2s"
                      cursor="pointer"
                      onClick={() => navigate('/user/calendar')}
                    >
                      <Flex justify="space-between" align="start">
                        <HStack spacing={3}>
                          <Icon
                            as={getEventTypeIcon(event.type)}
                            color={getEventTypeColor(event.type) + '.500'}
                            boxSize={5}
                          />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="semibold" color={textColor}>
                              {event.title}
                            </Text>
                            <Text fontSize="sm" color={mutedTextColor}>
                              {new Date(event.start_time).toLocaleString('ro-RO', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                            {event.location && (
                              <HStack spacing={1}>
                                <Icon as={FiMapPin} boxSize={3} color={mutedTextColor} />
                                <Text fontSize="xs" color={mutedTextColor}>
                                  {event.location}
                                </Text>
                              </HStack>
                            )}
                          </VStack>
                        </HStack>
                        <Badge colorScheme={getEventTypeColor(event.type)} fontSize="xs">
                          {event.type}
                        </Badge>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Box textAlign="center" py={8}>
                  <Icon as={FiCalendar} boxSize={12} color={mutedTextColor} mb={3} />
                  <Text color={mutedTextColor}>Nu există evenimente programate</Text>
                </Box>
              )}
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card bg={cardBg} shadow="md" borderRadius="lg">
            <CardHeader>
              <VStack align="start" spacing={1}>
                <Heading size="md" color={textColor}>
                  Acțiuni Rapide
                </Heading>
                <Text color={mutedTextColor} fontSize="sm">
                  Funcționalități frecvent utilizate
                </Text>
              </VStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <Button
                  leftIcon={<FiCalendar />}
                  colorScheme="blue"
                  size="lg"
                  justifyContent="start"
                  onClick={() => navigate('/user/calendar')}
                >
                  Creează Eveniment
                </Button>
                <Button
                  leftIcon={<FiFileText />}
                  colorScheme="purple"
                  size="lg"
                  justifyContent="start"
                  onClick={() => navigate('/user/documents')}
                >
                  Adaugă Document
                </Button>
                <Button
                  leftIcon={<FiBarChart />}
                  colorScheme="orange"
                  size="lg"
                  justifyContent="start"
                  onClick={() => navigate('/user/reports')}
                >
                  Generează Raport
                </Button>
                <Button
                  leftIcon={<FiShield />}
                  colorScheme="teal"
                  size="lg"
                  justifyContent="start"
                  onClick={() => navigate('/user/traceability')}
                >
                  Trasabilitate
                </Button>
                
                {user.roles.includes('INSPECTOR') && (
                  <>
                    <Divider my={2} />
                    <Button
                      leftIcon={<FiPackage />}
                      colorScheme="cyan"
                      size="lg"
                      justifyContent="start"
                      onClick={() => navigate('/user/material-requests')}
                      rightIcon={
                        stats.materialRequests > 0 ? (
                          <Badge colorScheme="red" borderRadius="full">
                            {stats.materialRequests}
                          </Badge>
                        ) : undefined
                      }
                    >
                      Cereri Materiale
                    </Button>
                  </>
                )}
                
                {user.roles.includes('WAREHOUSE_KEEPER') && (
                  <>
                    <Divider my={2} />
                    <Button
                      leftIcon={<FiPackage />}
                      colorScheme="green"
                      size="lg"
                      justifyContent="start"
                      onClick={() => navigate('/user/supply/inventory')}
                    >
                      Gestionare Stoc
                    </Button>
                  </>
                )}
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Performance Indicators (if admin/manager) */}
        {(user.roles.includes('SUPER_ADMIN') || user.roles.includes('DEPARTMENT_ADMIN') || user.roles.includes('MANAGER')) && (
          <Card bg={cardBg} shadow="md" borderRadius="lg">
            <CardHeader>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Heading size="md" color={textColor}>
                    Indicatori de Performanță
                  </Heading>
                  <Text color={mutedTextColor} fontSize="sm">
                    Obiective lunare și progres
                  </Text>
                </VStack>
                <Button size="sm" variant="ghost" leftIcon={<FiTarget />}>
                  Setări Obiective
                </Button>
              </HStack>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                <VStack align="stretch" spacing={2}>
                  <Flex justify="space-between">
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                      Completare Evenimente
                    </Text>
                    <Text fontSize="sm" fontWeight="bold" color="green.500">
                      75%
                    </Text>
                  </Flex>
                  <Progress colorScheme="green" value={75} size="sm" borderRadius="full" />
                  <Text fontSize="xs" color={mutedTextColor}>
                    Obiectiv: 90% până la sfârșitul lunii
                  </Text>
                </VStack>
                
                <VStack align="stretch" spacing={2}>
                  <Flex justify="space-between">
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                      Documente Procesate
                    </Text>
                    <Text fontSize="sm" fontWeight="bold" color="blue.500">
                      62%
                    </Text>
                  </Flex>
                  <Progress colorScheme="blue" value={62} size="sm" borderRadius="full" />
                  <Text fontSize="xs" color={mutedTextColor}>
                    Obiectiv: 100% până la sfârșitul lunii
                  </Text>
                </VStack>
                
                <VStack align="stretch" spacing={2}>
                  <Flex justify="space-between">
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                      Timp de Răspuns
                    </Text>
                    <Text fontSize="sm" fontWeight="bold" color="orange.500">
                      88%
                    </Text>
                  </Flex>
                  <Progress colorScheme="orange" value={88} size="sm" borderRadius="full" />
                  <Text fontSize="xs" color={mutedTextColor}>
                    Obiectiv: 95% până la sfârșitul lunii
                  </Text>
                </VStack>
              </SimpleGrid>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Box>
  );
}
