import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Badge,
  useColorModeValue,
  useToast,
  Spinner,
  Center,
  Flex,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tooltip,
  IconButton,
  ButtonGroup,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Container,
  Heading,
  Progress,
  Avatar,
  AvatarGroup,
  Wrap,
  WrapItem,
  Divider,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import {
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiUser,
  FiCalendar,
  FiActivity,
  FiDatabase,
  FiBarChart,
  FiClock,
  FiUsers,
  FiAlertCircle,
  FiCheckCircle,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiSettings,
  FiZap,
  FiShield,
  FiTrendingUp,
  FiTarget,
  FiGlobe,
  FiMonitor,
  FiLayers,
  FiPieChart,
  FiGrid,
  FiMaximize2,
  FiMinimize2,
  FiTool,
  FiDroplet,
  FiDownload,
  FiInfo,
} from 'react-icons/fi';
import { ActivityLogsService } from '../services/ActivityLogsService';
import { useAuth } from '../hooks/useAuth';

// Animații spectaculoase
const fadeInUp = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(30px) scale(0.95); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  }
`;

const slideInFromLeft = keyframes`
  from { 
    opacity: 0; 
    transform: translateX(-50px) rotateY(-15deg); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0) rotateY(0deg); 
  }
`;

const pulseGlow = keyframes`
  0%, 100% { 
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); 
  }
  50% { 
    box-shadow: 0 0 40px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.3); 
  }
`;

const floatingAnimation = keyframes`
  0%, 100% { 
    transform: translateY(0px) rotate(0deg); 
  }
  33% { 
    transform: translateY(-10px) rotate(2deg); 
  }
  66% { 
    transform: translateY(5px) rotate(-1deg); 
  }
`;

const shimmer = keyframes`
  0% { 
    background-position: -200px 0; 
  }
  100% { 
    background-position: calc(200px + 100%) 0; 
  }
`;

const rotate3D = keyframes`
  from { 
    transform: perspective(1000px) rotateY(0deg); 
  }
  to { 
    transform: perspective(1000px) rotateY(360deg); 
  }
`;

interface ActivityLog {
  id: number;
  user_id: number;
  action_type: string;
  entity_type: string;
  entity_id: number | null;
  description: string;
  details: any;
  ip_address: string;
  user_agent: string | null;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface LogStats {
  general: {
    total_logs: number;
    unique_users: number;
    today_logs: number;
    week_logs: number;
  };
  actionStats: Array<{
    action_type: string;
    count: number;
  }>;
  entityStats: Array<{
    entity_type: string;
    count: number;
  }>;
  userStats: Array<{
    first_name: string;
    last_name: string;
    activity_count: number;
  }>;
}

export default function ActivityLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [itemsPerPage] = useState(20);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const { isOpen: isDetailModalOpen, onOpen: onDetailModalOpen, onClose: onDetailModalClose } = useDisclosure();
  
  // Filtre
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActionType, setFilterActionType] = useState('all');
  const [filterEntityType, setFilterEntityType] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  
  const toast = useToast();
  
  // Color mode values pentru design modern
  const bgColor = useColorModeValue('white', 'gray.900');
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(45, 55, 72, 0.9)');
  const borderColor = useColorModeValue('rgba(226, 232, 240, 0.8)', 'rgba(74, 85, 104, 0.8)');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const primaryGradient = useColorModeValue(
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #4c51bf 0%, #7c3aed 100%)'
  );
  const secondaryGradient = useColorModeValue(
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #ec4899 0%, #ef4444 100%)'
  );
  const successGradient = useColorModeValue(
    'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
    'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  );
  const warningGradient = useColorModeValue(
    'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  );

  useEffect(() => {
    loadData();
  }, [currentPage, searchTerm, filterActionType, filterEntityType, filterDate]);

  // WebSocket pentru real-time logging
  useEffect(() => {
    if (!user) return;

    const ws = ActivityLogsService.connectActivityLogsWS(Number(user.id), (newLog) => {
      // Adaugă noul log la începutul listei
      setLogs(prevLogs => [newLog, ...prevLogs]);
      setTotalLogs(prev => prev + 1);
      
      // Actualizează statisticile
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          general: {
            ...prev.general,
            total_logs: prev.general.total_logs + 1,
            today_logs: prev.general.today_logs + 1,
            week_logs: prev.general.week_logs + 1
          }
        } : null);
      }
    });

    return () => {
      ws.close();
    };
  }, [user, stats]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Construiește parametrii pentru filtrare
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterActionType !== 'all') params.append('actionType', filterActionType);
      if (filterEntityType !== 'all') params.append('entityType', filterEntityType);
      if (filterDate !== 'all') {
        const today = new Date();
        if (filterDate === 'today') {
          params.append('startDate', today.toISOString().split('T')[0]);
          params.append('endDate', today.toISOString().split('T')[0]);
        } else if (filterDate === 'week') {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          params.append('startDate', weekAgo.toISOString().split('T')[0]);
          params.append('endDate', today.toISOString().split('T')[0]);
        } else if (filterDate === 'month') {
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          params.append('startDate', monthAgo.toISOString().split('T')[0]);
          params.append('endDate', today.toISOString().split('T')[0]);
        }
      }

      const [logsData, statsData] = await Promise.all([
        ActivityLogsService.getActivityLogs(params.toString()),
        ActivityLogsService.getLogStats()
      ]);
      
      setLogs(logsData.logs);
      setTotalLogs(logsData.total);
      setTotalPages(Math.ceil(logsData.total / itemsPerPage));
      setStats(statsData);
    } catch (error) {
      console.error('Error loading activity logs:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca logurile de activitate',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'EVENT_CREATED': return 'green';
      case 'EVENT_UPDATED': return 'blue';
      case 'EVENT_DELETED': return 'red';
      case 'ALERT_CREATED': return 'orange';
      case 'ALERT_RESOLVED': return 'green';
      case 'USER_LOGIN': return 'purple';
      case 'SETTINGS_CHANGED': return 'teal';
      case 'VEHICLE_DOCUMENT_ADDED': return 'blue';
      case 'VEHICLE_DOCUMENT_UPDATED': return 'blue';
      case 'VEHICLE_DOCUMENT_DELETED': return 'red';
      case 'VEHICLE_MAINTENANCE_ADDED': return 'purple';
      case 'VEHICLE_FUEL_ADDED': return 'teal';
      case 'VEHICLE_USAGE_ADDED': return 'green';
      case 'SUPPLIER_CREATED': return 'purple';
      case 'SUPPLIER_UPDATED': return 'purple';
      case 'SUPPLIER_DELETED': return 'red';
      case 'PRODUCT_CREATED': return 'blue';
      case 'PRODUCT_UPDATED': return 'blue';
      case 'PRODUCT_DELETED': return 'red';
      case 'REPORT_GENERATED': return 'purple';
      case 'REPORT_EXPORTED': return 'purple';
      default: return 'gray';
    }
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'EVENT': return 'blue';
      case 'ALERT': return 'orange';
      case 'VEHICLE': return 'green';
      case 'SUPPLIER': return 'purple';
      case 'USER': return 'teal';
      case 'SYSTEM': return 'gray';
      case 'PRODUCT': return 'blue';
      case 'REPORT': return 'purple';
      case 'DOCUMENT': return 'blue';
      case 'MAINTENANCE': return 'purple';
      case 'FUEL': return 'teal';
      case 'USAGE': return 'green';
      default: return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'EVENT_CREATED': return FiPlus;
      case 'EVENT_UPDATED': return FiEdit;
      case 'EVENT_DELETED': return FiTrash2;
      case 'ALERT_CREATED': return FiAlertCircle;
      case 'ALERT_RESOLVED': return FiCheckCircle;
      case 'USER_LOGIN': return FiUser;
      case 'SETTINGS_CHANGED': return FiSettings;
      case 'VEHICLE_DOCUMENT_ADDED': return FiPlus;
      case 'VEHICLE_DOCUMENT_UPDATED': return FiEdit;
      case 'VEHICLE_DOCUMENT_DELETED': return FiTrash2;
      case 'VEHICLE_MAINTENANCE_ADDED': return FiTool;
      case 'VEHICLE_FUEL_ADDED': return FiDroplet;
      case 'VEHICLE_USAGE_ADDED': return FiActivity;
      case 'SUPPLIER_CREATED': return FiPlus;
      case 'SUPPLIER_UPDATED': return FiEdit;
      case 'SUPPLIER_DELETED': return FiTrash2;
      case 'PRODUCT_CREATED': return FiPlus;
      case 'PRODUCT_UPDATED': return FiEdit;
      case 'PRODUCT_DELETED': return FiTrash2;
      case 'REPORT_GENERATED': return FiBarChart;
      case 'REPORT_EXPORTED': return FiDownload;
      default: return FiActivity;
    }
  };

  const getActionDisplayName = (actionType: string) => {
    switch (actionType) {
      case 'EVENT_CREATED': return 'Creare Eveniment';
      case 'EVENT_UPDATED': return 'Actualizare Eveniment';
      case 'EVENT_DELETED': return 'Ștergere Eveniment';
      case 'ALERT_CREATED': return 'Alertă Creată';
      case 'ALERT_RESOLVED': return 'Alertă Rezolvată';
      case 'USER_LOGIN': return 'Conectare';
      case 'SETTINGS_CHANGED': return 'Setări Modificate';
      case 'VEHICLE_DOCUMENT_ADDED': return 'Adăugare Document Vehicul';
      case 'VEHICLE_DOCUMENT_UPDATED': return 'Actualizare Document Vehicul';
      case 'VEHICLE_DOCUMENT_DELETED': return 'Ștergere Document Vehicul';
      case 'VEHICLE_MAINTENANCE_ADDED': return 'Adăugare Mentenanță';
      case 'VEHICLE_FUEL_ADDED': return 'Adăugare Combustibil';
      case 'VEHICLE_USAGE_ADDED': return 'Adăugare Utilizare';
      case 'SUPPLIER_CREATED': return 'Creare Furnizor';
      case 'SUPPLIER_UPDATED': return 'Actualizare Furnizor';
      case 'SUPPLIER_DELETED': return 'Ștergere Furnizor';
      case 'PRODUCT_CREATED': return 'Creare Produs';
      case 'PRODUCT_UPDATED': return 'Actualizare Produs';
      case 'PRODUCT_DELETED': return 'Ștergere Produs';
      case 'REPORT_GENERATED': return 'Raport Generat';
      case 'REPORT_EXPORTED': return 'Raport Exportat';
      default: return actionType.replace('_', ' ');
    }
  };

  const getEntityDisplayName = (entityType: string) => {
    switch (entityType) {
      case 'EVENT': return 'Eveniment';
      case 'ALERT': return 'Alertă';
      case 'VEHICLE': return 'Vehicul';
      case 'SUPPLIER': return 'Furnizor';
      case 'USER': return 'Utilizator';
      case 'SYSTEM': return 'Sistem';
      case 'PRODUCT': return 'Produs';
      case 'REPORT': return 'Raport';
      case 'DOCUMENT': return 'Document';
      case 'MAINTENANCE': return 'Mentenanță';
      case 'FUEL': return 'Combustibil';
      case 'USAGE': return 'Utilizare';
      default: return entityType;
    }
  };

  const handleLogClick = (log: ActivityLog) => {
    setSelectedLog(log);
    onDetailModalOpen();
  };

  if (loading && logs.length === 0) {
    return (
      <Center py={20}>
        <VStack spacing={6}>
          <Box
            animation={`${rotate3D} 2s linear infinite`}
            fontSize="4xl"
            color="blue.500"
          >
            <FiActivity />
          </Box>
          <Text fontSize="lg" color={mutedText}>
            Se încarcă logurile de activitate...
          </Text>
          <Progress size="sm" isIndeterminate colorScheme="blue" w="200px" />
        </VStack>
      </Center>
    );
  }

  return (
    <Box
      minH="100vh"
      bg={useColorModeValue('gray.50', 'gray.900')}
      position="relative"
      overflow="hidden"
    >
      {/* Background Effects */}
      <Box
        position="absolute"
        top="-50%"
        left="-50%"
        w="200%"
        h="200%"
        bg={useColorModeValue(
          'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
          'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)'
        )}
        animation={`${floatingAnimation} 20s ease-in-out infinite`}
        zIndex={0}
      />
      
      <Container maxW="7xl" py={8} position="relative" zIndex={1}>
        {/* Header Spectaculos */}
        <Box
          mb={8}
          textAlign="center"
          animation={`${fadeInUp} 0.8s ease-out`}
        >
          <HStack justify="center" mb={4} spacing={4}>
            <Box
              p={3}
              borderRadius="full"
              bg={primaryGradient}
              animation={`${pulseGlow} 3s ease-in-out infinite`}
            >
              <FiActivity size={32} color="white" />
            </Box>
            <VStack align="start" spacing={1}>
              <Heading
                size="2xl"
                bg={primaryGradient}
                bgClip="text"
                fontWeight="extrabold"
                letterSpacing="tight"
              >
                Loguri de Activitate
              </Heading>
              <Text
                fontSize="lg"
                color={mutedText}
                fontWeight="medium"
              >
                Monitorizează toate acțiunile din sistem în timp real
              </Text>
            </VStack>
          </HStack>
          
          {/* Live Activity Indicator */}
          <HStack justify="center" spacing={2} mt={4}>
            <Box
              w={3}
              h={3}
              borderRadius="full"
              bg="green.400"
              animation={`${pulseGlow} 2s ease-in-out infinite`}
            />
            <Text fontSize="sm" color="green.500" fontWeight="medium">
              Sistem activ în timp real
            </Text>
          </HStack>
        </Box>

        {/* Statistici Spectaculoase */}
        {stats && (
          <SimpleGrid
            columns={{ base: 1, md: 2, lg: 4 }}
            spacing={6}
            mb={8}
            animation={`${slideInFromLeft} 0.8s ease-out 0.2s both`}
          >
            {/* Total Loguri */}
            <Card
              bg={cardBg}
              border="1px solid"
              borderColor={borderColor}
              backdropFilter="blur(10px)"
              borderRadius="xl"
              overflow="hidden"
              position="relative"
              _hover={{
                transform: 'translateY(-5px)',
                boxShadow: 'xl',
                transition: 'all 0.3s ease'
              }}
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                h="4px"
                bg={primaryGradient}
              />
              <CardBody p={6}>
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={2}>
                    <Stat>
                      <StatLabel color={mutedText} fontSize="sm" fontWeight="medium">
                        Total Loguri
                      </StatLabel>
                      <StatNumber
                        fontSize="3xl"
                        fontWeight="bold"
                        bg={primaryGradient}
                        bgClip="text"
                      >
                        {stats.general.total_logs.toLocaleString()}
                      </StatNumber>
                      <StatHelpText color={mutedText} fontSize="xs">
                        Toate acțiunile înregistrate
                      </StatHelpText>
                    </Stat>
                  </VStack>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg={useColorModeValue('blue.50', 'blue.900')}
                  >
                    <FiDatabase size={24} color="#3B82F6" />
                  </Box>
                </HStack>
              </CardBody>
            </Card>

            {/* Utilizatori Activi */}
            <Card
              bg={cardBg}
              border="1px solid"
              borderColor={borderColor}
              backdropFilter="blur(10px)"
              borderRadius="xl"
              overflow="hidden"
              position="relative"
              _hover={{
                transform: 'translateY(-5px)',
                boxShadow: 'xl',
                transition: 'all 0.3s ease'
              }}
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                h="4px"
                bg={successGradient}
              />
              <CardBody p={6}>
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={2}>
                    <Stat>
                      <StatLabel color={mutedText} fontSize="sm" fontWeight="medium">
                        Utilizatori Activi
                      </StatLabel>
                      <StatNumber
                        fontSize="3xl"
                        fontWeight="bold"
                        bg={successGradient}
                        bgClip="text"
                      >
                        {stats.general.unique_users}
                      </StatNumber>
                      <StatHelpText color={mutedText} fontSize="xs">
                        Utilizatori cu activitate
                      </StatHelpText>
                    </Stat>
                  </VStack>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg={useColorModeValue('green.50', 'green.900')}
                  >
                    <FiUsers size={24} color="#10B981" />
                  </Box>
                </HStack>
              </CardBody>
            </Card>

            {/* Astăzi */}
            <Card
              bg={cardBg}
              border="1px solid"
              borderColor={borderColor}
              backdropFilter="blur(10px)"
              borderRadius="xl"
              overflow="hidden"
              position="relative"
              _hover={{
                transform: 'translateY(-5px)',
                boxShadow: 'xl',
                transition: 'all 0.3s ease'
              }}
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                h="4px"
                bg={warningGradient}
              />
              <CardBody p={6}>
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={2}>
                    <Stat>
                      <StatLabel color={mutedText} fontSize="sm" fontWeight="medium">
                        Astăzi
                      </StatLabel>
                      <StatNumber
                        fontSize="3xl"
                        fontWeight="bold"
                        bg={warningGradient}
                        bgClip="text"
                      >
                        {stats.general.today_logs}
                      </StatNumber>
                      <StatHelpText color={mutedText} fontSize="xs">
                        Acțiuni de azi
                      </StatHelpText>
                    </Stat>
                  </VStack>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg={useColorModeValue('orange.50', 'orange.900')}
                  >
                    <FiClock size={24} color="#F59E0B" />
                  </Box>
                </HStack>
              </CardBody>
            </Card>

            {/* Săptămâna Aceasta */}
            <Card
              bg={cardBg}
              border="1px solid"
              borderColor={borderColor}
              backdropFilter="blur(10px)"
              borderRadius="xl"
              overflow="hidden"
              position="relative"
              _hover={{
                transform: 'translateY(-5px)',
                boxShadow: 'xl',
                transition: 'all 0.3s ease'
              }}
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                h="4px"
                bg={secondaryGradient}
              />
              <CardBody p={6}>
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={2}>
                    <Stat>
                      <StatLabel color={mutedText} fontSize="sm" fontWeight="medium">
                        Săptămâna Aceasta
                      </StatLabel>
                      <StatNumber
                        fontSize="3xl"
                        fontWeight="bold"
                        bg={secondaryGradient}
                        bgClip="text"
                      >
                        {stats.general.week_logs}
                      </StatNumber>
                      <StatHelpText color={mutedText} fontSize="xs">
                        Ultimele 7 zile
                      </StatHelpText>
                    </Stat>
                  </VStack>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg={useColorModeValue('purple.50', 'purple.900')}
                  >
                    <FiBarChart size={24} color="#8B5CF6" />
                  </Box>
                </HStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        {/* Filtre Modernizate */}
        <Card
          bg={cardBg}
          border="1px solid"
          borderColor={borderColor}
          backdropFilter="blur(10px)"
          borderRadius="xl"
          mb={8}
          animation={`${fadeInUp} 0.8s ease-out 0.4s both`}
        >
          <CardBody p={6}>
            <VStack spacing={4}>
              <HStack w="full" justify="space-between" align="center">
                <HStack spacing={4}>
                  <Box
                    p={2}
                    borderRadius="lg"
                    bg={useColorModeValue('blue.50', 'blue.900')}
                  >
                    <FiFilter size={20} color="#3B82F6" />
                  </Box>
                  <Text fontSize="lg" fontWeight="semibold" color={textColor}>
                    Filtre și Căutare
                  </Text>
                </HStack>
                <Button
                  leftIcon={<FiRefreshCw />}
                  onClick={loadData}
                  bg={primaryGradient}
                  color="white"
                  _hover={{
                    transform: 'scale(1.05)',
                    boxShadow: 'lg',
                  }}
                  transition="all 0.3s ease"
                >
                  Reîmprospătează
                </Button>
              </HStack>
              
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} w="full">
                <InputGroup>
                  <InputLeftElement>
                    <FiSearch color="#3B82F6" />
                  </InputLeftElement>
                  <Input
                    placeholder="Caută în loguri..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    borderRadius="lg"
                    borderColor={borderColor}
                    _focus={{
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 1px #3B82F6',
                    }}
                  />
                </InputGroup>
                
                <Select
                  value={filterActionType}
                  onChange={(e) => setFilterActionType(e.target.value)}
                  borderRadius="lg"
                  borderColor={borderColor}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 1px #3B82F6',
                  }}
                >
                  <option value="all">Toate acțiunile</option>
                  <option value="EVENT_CREATED">Creare Eveniment</option>
                  <option value="EVENT_UPDATED">Actualizare Eveniment</option>
                  <option value="EVENT_DELETED">Ștergere Eveniment</option>
                  <option value="ALERT_CREATED">Alertă Creată</option>
                  <option value="ALERT_RESOLVED">Alertă Rezolvată</option>
                  <option value="USER_LOGIN">Conectare</option>
                  <option value="SETTINGS_CHANGED">Setări Modificate</option>
                  <option value="VEHICLE_DOCUMENT_ADDED">Adăugare Document Vehicul</option>
                  <option value="VEHICLE_DOCUMENT_UPDATED">Actualizare Document Vehicul</option>
                  <option value="VEHICLE_DOCUMENT_DELETED">Ștergere Document Vehicul</option>
                  <option value="VEHICLE_MAINTENANCE_ADDED">Adăugare Mentenanță</option>
                  <option value="VEHICLE_FUEL_ADDED">Adăugare Combustibil</option>
                  <option value="VEHICLE_USAGE_ADDED">Adăugare Utilizare</option>
                  <option value="SUPPLIER_CREATED">Creare Furnizor</option>
                  <option value="SUPPLIER_UPDATED">Actualizare Furnizor</option>
                  <option value="SUPPLIER_DELETED">Ștergere Furnizor</option>
                  <option value="PRODUCT_CREATED">Creare Produs</option>
                  <option value="PRODUCT_UPDATED">Actualizare Produs</option>
                  <option value="PRODUCT_DELETED">Ștergere Produs</option>
                  <option value="REPORT_GENERATED">Raport Generat</option>
                  <option value="REPORT_EXPORTED">Raport Exportat</option>
                </Select>
                
                <Select
                  value={filterEntityType}
                  onChange={(e) => setFilterEntityType(e.target.value)}
                  borderRadius="lg"
                  borderColor={borderColor}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 1px #3B82F6',
                  }}
                >
                  <option value="all">Toate entitățile</option>
                  <option value="EVENT">Evenimente</option>
                  <option value="ALERT">Alerte</option>
                  <option value="VEHICLE">Vehicule</option>
                  <option value="SUPPLIER">Furnizori</option>
                  <option value="USER">Utilizatori</option>
                  <option value="SYSTEM">Sistem</option>
                  <option value="PRODUCT">Produse</option>
                  <option value="REPORT">Rapoarte</option>
                  <option value="DOCUMENT">Documente</option>
                  <option value="MAINTENANCE">Mentenanță</option>
                  <option value="FUEL">Combustibil</option>
                  <option value="USAGE">Utilizare</option>
                </Select>
                
                <Select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  borderRadius="lg"
                  borderColor={borderColor}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 1px #3B82F6',
                  }}
                >
                  <option value="all">Toate datele</option>
                  <option value="today">Astăzi</option>
                  <option value="week">Săptămâna aceasta</option>
                  <option value="month">Luna aceasta</option>
                </Select>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Tabel Loguri Modernizat */}
        <Card
          bg={cardBg}
          border="1px solid"
          borderColor={borderColor}
          backdropFilter="blur(10px)"
          borderRadius="xl"
          overflow="hidden"
          animation={`${fadeInUp} 0.8s ease-out 0.6s both`}
        >
          <CardHeader
            bg={useColorModeValue('gray.50', 'gray.700')}
            borderBottom="1px solid"
            borderColor={borderColor}
          >
            <Flex justify="space-between" align="center">
              <HStack spacing={3}>
                <Box
                  p={2}
                  borderRadius="lg"
                  bg={useColorModeValue('blue.50', 'blue.900')}
                >
                  <FiActivity size={20} color="#3B82F6" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight="bold" color={textColor}>
                    Loguri de Activitate
                  </Text>
                  <Text fontSize="sm" color={mutedText}>
                    {totalLogs.toLocaleString()} înregistrări găsite
                  </Text>
                </VStack>
              </HStack>
              <HStack spacing={2}>
                <Badge
                  colorScheme="blue"
                  variant="subtle"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  Pagina {currentPage} din {totalPages}
                </Badge>
              </HStack>
            </Flex>
          </CardHeader>
          
          <CardBody p={0}>
            {logs.length === 0 ? (
              <Center py={16}>
                <VStack spacing={4}>
                  <Box
                    p={6}
                    borderRadius="full"
                    bg={useColorModeValue('gray.100', 'gray.700')}
                    animation={`${floatingAnimation} 3s ease-in-out infinite`}
                  >
                    <FiActivity size={48} color="#9CA3AF" />
                  </Box>
                  <VStack spacing={2}>
                    <Text fontSize="lg" fontWeight="medium" color={mutedText}>
                      Nu s-au găsit loguri
                    </Text>
                    <Text fontSize="sm" color={mutedText} textAlign="center">
                      Încearcă să modifici filtrele sau să reîmprospătezi datele
                    </Text>
                  </VStack>
                </VStack>
              </Center>
            ) : (
              <>
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr bg={useColorModeValue('gray.50', 'gray.700')}>
                        <Th py={4} px={6}>Utilizator</Th>
                        <Th py={4} px={6}>Acțiune</Th>
                        <Th py={4} px={6}>Entitate</Th>
                        <Th py={4} px={6}>Descriere</Th>
                        <Th py={4} px={6}>Data</Th>
                        <Th py={4} px={6}>Acțiuni</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {logs.map((log, index) => {
                        const ActionIcon = getActionIcon(log.action_type);
                        return (
                          <Tr
                            key={log.id}
                            _hover={{
                              bg: useColorModeValue('blue.50', 'blue.900'),
                              transform: 'scale(1.01)',
                              transition: 'all 0.2s ease'
                            }}
                            cursor="pointer"
                            onClick={() => handleLogClick(log)}
                            animation={`${fadeInUp} 0.5s ease-out ${index * 0.1}s both`}
                          >
                            <Td py={4} px={6}>
                              <HStack spacing={3}>
                                <Avatar
                                  size="sm"
                                  name={`${log.first_name} ${log.last_name}`}
                                  bg={primaryGradient}
                                  color="white"
                                />
                                <VStack align="start" spacing={1}>
                                  <Text fontWeight="semibold" color={textColor}>
                                    {log.first_name} {log.last_name}
                                  </Text>
                                  <Text fontSize="xs" color={mutedText}>
                                    {log.email}
                                  </Text>
                                </VStack>
                              </HStack>
                            </Td>
                            <Td py={4} px={6}>
                              <HStack spacing={2}>
                                <Box
                                  p={2}
                                  borderRadius="lg"
                                  bg={useColorModeValue(
                                    `${getActionTypeColor(log.action_type)}.100`,
                                    `${getActionTypeColor(log.action_type)}.900`
                                  )}
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  minW="40px"
                                  minH="40px"
                                >
                                  <ActionIcon
                                    size={18}
                                    color={useColorModeValue(
                                      `${getActionTypeColor(log.action_type)}.600`,
                                      `${getActionTypeColor(log.action_type)}.300`
                                    )}
                                  />
                                </Box>
                                <Badge
                                  colorScheme={getActionTypeColor(log.action_type)}
                                  variant="subtle"
                                  fontSize="xs"
                                  px={2}
                                  py={1}
                                  borderRadius="full"
                                >
                                  {getActionDisplayName(log.action_type)}
                                </Badge>
                              </HStack>
                            </Td>
                            <Td py={4} px={6}>
                              <Badge
                                colorScheme={getEntityTypeColor(log.entity_type)}
                                variant="outline"
                                fontSize="xs"
                                px={3}
                                py={1}
                                borderRadius="full"
                              >
                                {getEntityDisplayName(log.entity_type)}
                              </Badge>
                            </Td>
                            <Td py={4} px={6}>
                              <Tooltip label={log.description} placement="top">
                                <Text
                                  fontSize="sm"
                                  color={textColor}
                                  maxW="300px"
                                  noOfLines={2}
                                  lineHeight="1.4"
                                >
                                  {log.description}
                                </Text>
                              </Tooltip>
                            </Td>
                            <Td py={4} px={6}>
                              <VStack align="start" spacing={1}>
                                <Text fontSize="xs" color={mutedText} fontWeight="medium">
                                  {formatDate(log.created_at)}
                                </Text>
                                <HStack spacing={1}>
                                  <FiClock size={12} color="#9CA3AF" />
                                  <Text fontSize="xs" color={mutedText}>
                                    {new Date(log.created_at).toLocaleTimeString('ro-RO', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </Text>
                                </HStack>
                              </VStack>
                            </Td>
                            <Td py={4} px={6}>
                              <Tooltip label="Vezi detalii" placement="top">
                                <IconButton
                                  aria-label="Vezi detalii"
                                  icon={<FiEye />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="blue"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLogClick(log);
                                  }}
                                />
                              </Tooltip>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>

                {/* Pagination Modernizat */}
                {totalPages > 1 && (
                  <Box
                    p={6}
                    borderTop="1px solid"
                    borderColor={borderColor}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                  >
                    <Flex justify="center" align="center">
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Pagina anterioară"
                          icon={<FiChevronLeft />}
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          isDisabled={currentPage === 1}
                          variant="outline"
                          colorScheme="blue"
                          size="sm"
                        />
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              colorScheme={currentPage === pageNum ? 'blue' : 'gray'}
                              variant={currentPage === pageNum ? 'solid' : 'outline'}
                              size="sm"
                              minW="40px"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                        
                        <IconButton
                          aria-label="Pagina următoare"
                          icon={<FiChevronRight />}
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          isDisabled={currentPage === totalPages}
                          variant="outline"
                          colorScheme="blue"
                          size="sm"
                        />
                      </HStack>
                    </Flex>
                  </Box>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </Container>

      {/* Modal pentru Detalii Log */}
      <Modal isOpen={isDetailModalOpen} onClose={onDetailModalClose} size="xl">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent
          bg={useColorModeValue('white', 'gray.800')}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="xl"
        >
          <ModalHeader
            bg={useColorModeValue('blue.500', 'blue.600')}
            color="white"
            borderTopRadius="xl"
          >
            <HStack spacing={3}>
              <FiActivity size={24} />
              <Text>Detalii Log de Activitate</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          
          <ModalBody py={6}>
            {selectedLog && (
              <VStack spacing={6} align="stretch">
                {/* Informații Utilizator */}
                <Card bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg">
                  <CardBody>
                    <HStack spacing={4}>
                      <Avatar
                        size="lg"
                        name={`${selectedLog.first_name} ${selectedLog.last_name}`}
                        bg={useColorModeValue('blue.500', 'blue.600')}
                        color="white"
                      />
                      <VStack align="start" spacing={1}>
                        <Text fontSize="lg" fontWeight="bold" color={textColor}>
                          {selectedLog.first_name} {selectedLog.last_name}
                        </Text>
                        <Text fontSize="sm" color={mutedText}>
                          {selectedLog.email}
                        </Text>
                        <Text fontSize="xs" color={mutedText}>
                          ID: {selectedLog.user_id}
                        </Text>
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>

                {/* Detalii Acțiune */}
                <SimpleGrid columns={2} spacing={4}>
                  <Card bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="lg">
                    <CardBody>
                      <VStack align="start" spacing={2}>
                        <HStack spacing={2}>
                          <Box
                            p={2}
                            borderRadius="lg"
                            bg={useColorModeValue('blue.100', 'blue.800')}
                          >
                            {(() => {
                              const ActionIcon = getActionIcon(selectedLog.action_type);
                              return <ActionIcon size={20} color={useColorModeValue('#3B82F6', '#60A5FA')} />;
                            })()}
                          </Box>
                          <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('blue.700', 'blue.200')}>
                            Tip Acțiune
                          </Text>
                        </HStack>
                        <Badge
                          colorScheme={getActionTypeColor(selectedLog.action_type)}
                          variant="solid"
                          fontSize="sm"
                          px={3}
                          py={1}
                          borderRadius="full"
                        >
                          {getActionDisplayName(selectedLog.action_type)}
                        </Badge>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={useColorModeValue('green.50', 'green.900')} borderRadius="lg">
                    <CardBody>
                      <VStack align="start" spacing={2}>
                        <HStack spacing={2}>
                          <Box
                            p={2}
                            borderRadius="lg"
                            bg={useColorModeValue('green.100', 'green.800')}
                          >
                            <FiLayers size={20} color={useColorModeValue('#10B981', '#34D399')} />
                          </Box>
                          <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('green.700', 'green.200')}>
                            Entitate
                          </Text>
                        </HStack>
                        <Badge
                          colorScheme={getEntityTypeColor(selectedLog.entity_type)}
                          variant="solid"
                          fontSize="sm"
                          px={3}
                          py={1}
                          borderRadius="full"
                        >
                          {getEntityDisplayName(selectedLog.entity_type)}
                        </Badge>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* Descriere */}
                <Card bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg">
                  <CardBody>
                    <VStack align="start" spacing={3}>
                      <HStack spacing={2}>
                        <FiEdit size={20} color={useColorModeValue('#6B7280', '#9CA3AF')} />
                        <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                          Descriere
                        </Text>
                      </HStack>
                      <Text fontSize="md" color={textColor} lineHeight="1.6">
                        {selectedLog.description}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Data și Ora */}
                <Card bg={useColorModeValue('orange.50', 'orange.900')} borderRadius="lg">
                  <CardBody>
                    <VStack align="start" spacing={2}>
                      <HStack spacing={2}>
                        <FiClock size={20} color={useColorModeValue('#F59E0B', '#FBBF24')} />
                        <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('orange.700', 'orange.200')}>
                          Data și Ora
                        </Text>
                      </HStack>
                      <Text fontSize="sm" color={useColorModeValue('orange.700', 'orange.200')}>
                        {formatDate(selectedLog.created_at)}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Informații Relevante */}
                {selectedLog.details && (
                  <Card bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg">
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <HStack spacing={2}>
                          <FiInfo size={20} color={useColorModeValue('#6B7280', '#9CA3AF')} />
                          <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                            Informații Relevante
                          </Text>
                        </HStack>
                        
                        {/* Pentru alerte */}
                        {selectedLog.details.alert_id && (
                          <VStack align="stretch" spacing={3} w="full">
                            <SimpleGrid columns={2} spacing={4}>
                              <Box>
                                <Text fontSize="xs" color={mutedText} fontWeight="medium" mb={1}>
                                  ID Alertă
                                </Text>
                                <Text fontSize="sm" color={textColor} fontWeight="semibold">
                                  #{selectedLog.details.alert_id}
                                </Text>
                              </Box>
                              
                              <Box>
                                <Text fontSize="xs" color={mutedText} fontWeight="medium" mb={1}>
                                  Tip Alertă
                                </Text>
                                <Badge colorScheme="orange" variant="subtle" fontSize="xs">
                                  {selectedLog.details.alert_type}
                                </Badge>
                              </Box>
                            </SimpleGrid>
                            
                            {selectedLog.details.alert_title && (
                              <Box>
                                <Text fontSize="xs" color={mutedText} fontWeight="medium" mb={1}>
                                  Titlu Alertă
                                </Text>
                                <Text fontSize="sm" color={textColor} fontWeight="semibold">
                                  {selectedLog.details.alert_title}
                                </Text>
                              </Box>
                            )}
                          </VStack>
                        )}
                        
                        {/* Pentru documente vehicule */}
                        {selectedLog.details.vehicle_id && (
                          <VStack align="stretch" spacing={3} w="full">
                            <SimpleGrid columns={2} spacing={4}>
                              {selectedLog.details.vehicle_id && (
                                <Box>
                                  <Text fontSize="xs" color={mutedText} fontWeight="medium" mb={1}>
                                    ID Vehicul
                                  </Text>
                                  <Text fontSize="sm" color={textColor} fontWeight="semibold">
                                    #{selectedLog.details.vehicle_id}
                                  </Text>
                                </Box>
                              )}
                              
                              {selectedLog.details.document_type && (
                                <Box>
                                  <Text fontSize="xs" color={mutedText} fontWeight="medium" mb={1}>
                                    Tip Document
                                  </Text>
                                  <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                                    {selectedLog.details.document_type}
                                  </Badge>
                                </Box>
                              )}
                            </SimpleGrid>
                            
                            {selectedLog.details.vehicle_brand && selectedLog.details.vehicle_model && (
                              <Box>
                                <Text fontSize="xs" color={mutedText} fontWeight="medium" mb={1}>
                                  Vehicul
                                </Text>
                                <Text fontSize="sm" color={textColor} fontWeight="semibold">
                                  {selectedLog.details.vehicle_brand} {selectedLog.details.vehicle_model}
                                </Text>
                              </Box>
                            )}
                            
                            {selectedLog.details.document_number && (
                              <Box>
                                <Text fontSize="xs" color={mutedText} fontWeight="medium" mb={1}>
                                  Număr Document
                                </Text>
                                <Text fontSize="sm" color={textColor} fontFamily="mono" bg={useColorModeValue('gray.100', 'gray.600')} px={2} py={1} borderRadius="md">
                                  {selectedLog.details.document_number}
                                </Text>
                              </Box>
                            )}
                          </VStack>
                        )}
                        
                        {/* Pentru evenimente */}
                        {selectedLog.details.event_id && (
                          <VStack align="stretch" spacing={3} w="full">
                            <SimpleGrid columns={2} spacing={4}>
                              <Box>
                                <Text fontSize="xs" color={mutedText} fontWeight="medium" mb={1}>
                                  ID Eveniment
                                </Text>
                                <Text fontSize="sm" color={textColor} fontWeight="semibold">
                                  #{selectedLog.details.event_id}
                                </Text>
                              </Box>
                              
                              {selectedLog.details.event_type && (
                                <Box>
                                  <Text fontSize="xs" color={mutedText} fontWeight="medium" mb={1}>
                                    Tip Eveniment
                                  </Text>
                                  <Badge colorScheme="purple" variant="subtle" fontSize="xs">
                                    {selectedLog.details.event_type}
                                  </Badge>
                                </Box>
                              )}
                            </SimpleGrid>
                            
                            {selectedLog.details.event_title && (
                              <Box>
                                <Text fontSize="xs" color={mutedText} fontWeight="medium" mb={1}>
                                  Titlu Eveniment
                                </Text>
                                <Text fontSize="sm" color={textColor} fontWeight="semibold">
                                  {selectedLog.details.event_title}
                                </Text>
                              </Box>
                            )}
                          </VStack>
                        )}
                        
                        {/* Pentru utilizatori */}
                        {selectedLog.details.user_email && !selectedLog.details.vehicle_id && !selectedLog.details.alert_id && !selectedLog.details.event_id && (
                          <Box>
                            <Text fontSize="xs" color={mutedText} fontWeight="medium" mb={1}>
                              Email Utilizator
                            </Text>
                            <Text fontSize="sm" color={textColor}>
                              {selectedLog.details.user_email}
                            </Text>
                          </Box>
                        )}
                        
                        {/* Pentru alte tipuri - afișează doar câteva câmpuri cheie */}
                        {!selectedLog.details.vehicle_id && !selectedLog.details.alert_id && !selectedLog.details.event_id && !selectedLog.details.user_email && (
                          <VStack align="stretch" spacing={2} w="full">
                            <Text fontSize="xs" color={mutedText} fontWeight="medium">
                              Informații de Sistem
                            </Text>
                            <SimpleGrid columns={2} spacing={4}>
                              {Object.entries(selectedLog.details).slice(0, 4).map(([key, value]) => (
                                <Box key={key}>
                                  <Text fontSize="xs" color={mutedText} fontWeight="medium" mb={1}>
                                    {key.replace(/_/g, ' ').toUpperCase()}
                                  </Text>
                                  <Text fontSize="sm" color={textColor} fontWeight="semibold">
                                    {String(value)}
                                  </Text>
                                </Box>
                              ))}
                            </SimpleGrid>
                          </VStack>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
} 