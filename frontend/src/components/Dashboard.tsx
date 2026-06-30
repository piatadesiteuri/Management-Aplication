import {
    Box,
    SimpleGrid,
    Icon,
    Text,
    useColorModeValue,
    Container,
    Heading,
    Card,
    CardBody,
    CardHeader,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Badge,
    Spinner,
    Center,
    Button,
    HStack,
    VStack,
    Avatar,
    Flex,
    Divider,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Progress,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { 
    FiUsers, 
    FiFileText, 
    FiBell, 
    FiAlertTriangle, 
    FiCheckCircle, 
    FiClock,
    FiUserPlus,
    FiCalendar,
    FiZap,
    FiArrowRight,
    FiShield,
    FiActivity,
    FiSettings,
    FiTrendingUp,
    FiTrendingDown,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import api from '../services/api';

// Animații moderne
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

interface StatsCardProps {
    title: string;
    stat: string;
    icon: React.ElementType;
    helpText?: string;
    percentage?: string;
    isIncrease?: boolean;
    color?: string;
}

function StatsCard(props: StatsCardProps) {
    const { title, stat, icon, helpText, percentage, isIncrease, color = 'blue' } = props;
    const bgColor = useColorModeValue('white', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.200');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    return (
        <Card
            bg={bgColor}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="xl"
            shadow="lg"
            transition="all 0.3s"
            _hover={{
                transform: 'translateY(-4px)',
                shadow: 'xl',
                borderColor: `${color}.400`,
            }}
            animation={`${fadeInUp} 0.5s ease-out`}
        >
            <CardBody>
                <Flex justify="space-between" align="start">
                    <Box flex={1}>
                        <Text fontWeight="medium" color={textColor} mb={2} fontSize="sm">
                            {title}
                        </Text>
                        <Text fontSize="3xl" fontWeight="bold" color={`${color}.500`} mb={helpText && percentage ? 2 : 0}>
                            {stat}
                        </Text>
                        {helpText && percentage && (
                            <HStack spacing={1} mt={2}>
                                <Icon 
                                    as={isIncrease ? FiTrendingUp : FiTrendingDown} 
                                    color={isIncrease ? 'green.500' : 'red.500'}
                                    boxSize={4}
                                />
                                <Text 
                                    fontSize="sm" 
                                    color={isIncrease ? 'green.500' : 'red.500'}
                                    fontWeight="medium"
                                >
                                    {percentage}
                                </Text>
                                <Text fontSize="sm" color={textColor}>
                                    {helpText}
                                </Text>
                            </HStack>
                        )}
                    </Box>
                    <Box
                        bg={`${color}.100`}
                        p={3}
                        borderRadius="lg"
                        color={`${color}.600`}
                    >
                        <Icon as={icon} boxSize={6} />
                    </Box>
                </Flex>
            </CardBody>
        </Card>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const bgColor = useColorModeValue('gray.50', 'gray.900');
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const mutedText = useColorModeValue('gray.600', 'gray.400');
    
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>({
        stats: {
            activeUsers: { total: 0, percentage: '0.00', isIncrease: true },
            documentsProcessed: { total: 0, percentage: '0.00', isIncrease: true },
            pendingRequests: { total: 0, percentage: '0.00', isIncrease: false }
        },
        urgentAlerts: [],
        pendingApprovals: [],
        urgentTasks: [],
        newUsers: [],
        expiringDocuments: [],
        quickStats: {},
        recentActivity: []
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/dashboard/stats');
            console.log('📊 Dashboard data:', res.data);
            if (res.data) {
                setData(res.data);
            }
        } catch (error: any) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString('ro-RO');
    };

    const getSeverityColor = (severity: string) => {
        switch (severity?.toUpperCase()) {
            case 'CRITICAL': return 'red';
            case 'HIGH': return 'orange';
            case 'MEDIUM': return 'yellow';
            case 'LOW': return 'blue';
            default: return 'gray';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority?.toUpperCase()) {
            case 'HIGH': return 'red';
            case 'MEDIUM': return 'orange';
            case 'LOW': return 'blue';
            default: return 'gray';
        }
    };

    if (loading) {
        return (
            <Container maxW="7xl" py={10}>
                <Center>
                    <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
                </Center>
            </Container>
        );
    }

    return (
        <Container maxW="7xl" py={6}>
            {/* Header */}
            <Box mb={8}>
                <HStack spacing={3} mb={2}>
                    <Icon as={FiZap} boxSize={8} color="blue.500" />
                    <Heading size="lg" fontWeight="bold">
                        Bine ai venit, {user?.firstName || user?.name || 'Administrator'}!
                    </Heading>
                </HStack>
                <Text color={mutedText} fontSize="md">
                    Panou de control - Monitorizare și gestionare sistem
                </Text>
            </Box>

            {/* Statistici rapide */}
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
                <StatsCard
                    title="Alerte Active"
                    stat={formatNumber(data.quickStats?.active_alerts || 0)}
                    icon={FiAlertTriangle}
                    color="red"
                />
                <StatsCard
                    title="Cereri Aprobare"
                    stat={formatNumber(data.quickStats?.pending_approvals || 0)}
                    icon={FiCheckCircle}
                    color="orange"
                />
                <StatsCard
                    title="Task-uri Active"
                    stat={formatNumber(data.quickStats?.active_tasks || 0)}
                    icon={FiClock}
                    color="blue"
                />
                <StatsCard
                    title="Conectări Astăzi"
                    stat={formatNumber(data.quickStats?.today_logins || 0)}
                    icon={FiUsers}
                    color="green"
                />
            </SimpleGrid>

            {/* Alerte urgente */}
            {data.urgentAlerts && data.urgentAlerts.length > 0 && (
                <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" mb={6} shadow="lg">
                    <CardHeader>
                        <HStack justify="space-between">
                            <HStack>
                                <Icon as={FiAlertTriangle} color="red.500" boxSize={5} />
                                <Heading size="md">Alerte Urgente</Heading>
                            </HStack>
                            <Button
                                as={RouterLink}
                                to="/admin/alerts"
                                variant="link"
                                size="sm"
                                rightIcon={<FiArrowRight />}
                            >
                                Vezi toate
                            </Button>
                        </HStack>
                    </CardHeader>
                    <CardBody>
                        <VStack align="stretch" spacing={3}>
                            {data.urgentAlerts.slice(0, 3).map((alert: any) => (
                                <Alert
                                    key={alert.id}
                                    status={alert.severity === 'CRITICAL' ? 'error' : 'warning'}
                                    borderRadius="lg"
                                >
                                    <AlertIcon />
                                    <Box flex={1}>
                                        <AlertTitle fontSize="sm">{alert.title}</AlertTitle>
                                        <AlertDescription fontSize="xs">{alert.message}</AlertDescription>
                                    </Box>
                                    <Badge colorScheme={getSeverityColor(alert.severity)}>
                                        {alert.severity}
                                    </Badge>
                                </Alert>
                            ))}
                        </VStack>
                    </CardBody>
                </Card>
            )}

            {/* Grid principal - Acțiuni și informații */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
                {/* Cereri care așteaptă aprobare */}
                <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" shadow="lg">
                    <CardHeader>
                        <HStack justify="space-between">
                            <HStack>
                                <Icon as={FiCheckCircle} color="orange.500" boxSize={5} />
                                <Heading size="md">Cereri Aprobare</Heading>
                            </HStack>
                            <Badge colorScheme="orange">{data.pendingApprovals?.length || 0}</Badge>
                        </HStack>
                    </CardHeader>
                    <CardBody>
                        {data.pendingApprovals && data.pendingApprovals.length > 0 ? (
                            <VStack align="stretch" spacing={3}>
                                {data.pendingApprovals.slice(0, 5).map((approval: any) => (
                                    <Box
                                        key={approval.id}
                                        p={3}
                                        bg={useColorModeValue('gray.50', 'gray.700')}
                                        borderRadius="lg"
                                        border="1px solid"
                                        borderColor={borderColor}
                                    >
                                        <HStack justify="space-between" mb={2}>
                                            <Text fontWeight="semibold" fontSize="sm" flex={1}>
                                                {approval.event_title || approval.description || 'Cerere aprobare'}
                                            </Text>
                                            <Badge colorScheme="orange" size="sm">
                                                {approval.entity_type || 'PENDING'}
                                            </Badge>
                                        </HStack>
                                        <Text fontSize="xs" color={mutedText}>
                                            Solicitat de: {approval.requester_first_name} {approval.requester_last_name}
                                        </Text>
                                        <Text fontSize="xs" color={mutedText} mt={1}>
                                            {new Date(approval.created_at).toLocaleDateString('ro-RO')}
                                        </Text>
                                    </Box>
                                ))}
                                <Button
                                    as={RouterLink}
                                    to="/admin/tasks"
                                    variant="outline"
                                    size="sm"
                                    rightIcon={<FiArrowRight />}
                                    mt={2}
                                >
                                    Vezi toate cererile
                                </Button>
                            </VStack>
                        ) : (
                            <Text color={mutedText} textAlign="center" py={4}>
                                Nu există cereri în așteptare
                            </Text>
                        )}
                    </CardBody>
                </Card>

                {/* Task-uri urgente */}
                <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" shadow="lg">
                    <CardHeader>
                        <HStack justify="space-between">
                            <HStack>
                                <Icon as={FiClock} color="blue.500" boxSize={5} />
                                <Heading size="md">Task-uri Urgente</Heading>
                            </HStack>
                            <Badge colorScheme="blue">{data.urgentTasks?.length || 0}</Badge>
                        </HStack>
                    </CardHeader>
                    <CardBody>
                        {data.urgentTasks && data.urgentTasks.length > 0 ? (
                            <VStack align="stretch" spacing={3}>
                                {data.urgentTasks.slice(0, 5).map((task: any) => (
                                    <Box
                                        key={task.id}
                                        p={3}
                                        bg={useColorModeValue('gray.50', 'gray.700')}
                                        borderRadius="lg"
                                        border="1px solid"
                                        borderColor={borderColor}
                                    >
                                        <HStack justify="space-between" mb={2}>
                                            <Text fontWeight="semibold" fontSize="sm">
                                                {task.title}
                                            </Text>
                                            <Badge colorScheme={getPriorityColor(task.priority)} size="sm">
                                                {task.priority || 'MEDIUM'}
                                            </Badge>
                                        </HStack>
                                        {task.due_date && (
                                            <HStack spacing={2} mb={1}>
                                                <Icon as={FiCalendar} boxSize={3} color={mutedText} />
                                                <Text fontSize="xs" color={mutedText}>
                                                    Termen: {new Date(task.due_date).toLocaleDateString('ro-RO')}
                                                </Text>
                                            </HStack>
                                        )}
                                        {task.assigned_first_name && (
                                            <Text fontSize="xs" color={mutedText}>
                                                Asignat: {task.assigned_first_name} {task.assigned_last_name}
                                            </Text>
                                        )}
                                    </Box>
                                ))}
                                <Button
                                    as={RouterLink}
                                    to="/admin/tasks"
                                    variant="outline"
                                    size="sm"
                                    rightIcon={<FiArrowRight />}
                                    mt={2}
                                >
                                    Vezi toate task-urile
                                </Button>
                            </VStack>
                        ) : (
                            <Text color={mutedText} textAlign="center" py={4}>
                                Nu există task-uri urgente
                            </Text>
                        )}
                    </CardBody>
                </Card>
            </SimpleGrid>

            {/* Grid secundar */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
                {/* Utilizatori noi */}
                <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" shadow="lg">
                    <CardHeader>
                        <HStack justify="space-between">
                            <HStack>
                                <Icon as={FiUserPlus} color="green.500" boxSize={5} />
                                <Heading size="md">Utilizatori Noi</Heading>
                            </HStack>
                            <Badge colorScheme="green">{data.newUsers?.length || 0}</Badge>
                        </HStack>
                    </CardHeader>
                    <CardBody>
                        {data.newUsers && data.newUsers.length > 0 ? (
                            <VStack align="stretch" spacing={3}>
                                {data.newUsers.map((newUser: any) => (
                                    <HStack key={newUser.id} spacing={3}>
                                        <Avatar
                                            size="sm"
                                            name={`${newUser.first_name} ${newUser.last_name}`}
                                        />
                                        <Box flex={1}>
                                            <Text fontWeight="semibold" fontSize="sm">
                                                {newUser.first_name} {newUser.last_name}
                                            </Text>
                                            <Text fontSize="xs" color={mutedText}>
                                                {newUser.email}
                                            </Text>
                                        </Box>
                                        <Text fontSize="xs" color={mutedText}>
                                            {new Date(newUser.created_at).toLocaleDateString('ro-RO')}
                                        </Text>
                                    </HStack>
                                ))}
                                <Button
                                    as={RouterLink}
                                    to="/admin/users"
                                    variant="outline"
                                    size="sm"
                                    rightIcon={<FiArrowRight />}
                                    mt={2}
                                >
                                    Vezi toți utilizatorii
                                </Button>
                            </VStack>
                        ) : (
                            <Text color={mutedText} textAlign="center" py={4}>
                                Nu există utilizatori noi în ultimele 7 zile
                            </Text>
                        )}
                    </CardBody>
                </Card>

                {/* Documente care expiră */}
                <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" shadow="lg">
                    <CardHeader>
                        <HStack justify="space-between">
                            <HStack>
                                <Icon as={FiFileText} color="blue.500" boxSize={5} />
                                <Heading size="md">Documente Recente</Heading>
                            </HStack>
                            <Badge colorScheme="blue">{data.expiringDocuments?.length || 0}</Badge>
                        </HStack>
                    </CardHeader>
                    <CardBody>
                        {data.expiringDocuments && data.expiringDocuments.length > 0 ? (
                            <VStack align="stretch" spacing={3}>
                                {data.expiringDocuments.map((doc: any) => (
                                    <Box
                                        key={doc.id}
                                        p={3}
                                        bg={useColorModeValue('gray.50', 'gray.700')}
                                        borderRadius="lg"
                                        border="1px solid"
                                        borderColor={borderColor}
                                    >
                                        <Text fontWeight="semibold" fontSize="sm" mb={1}>
                                            {doc.original_name}
                                        </Text>
                                        {doc.event_title && (
                                            <Text fontSize="xs" color={mutedText} mb={2}>
                                                Eveniment: {doc.event_title}
                                            </Text>
                                        )}
                                        <Text fontSize="xs" color={mutedText}>
                                            Încărcat: {new Date(doc.created_at).toLocaleDateString('ro-RO')}
                                        </Text>
                                    </Box>
                                ))}
                                <Button
                                    as={RouterLink}
                                    to="/admin/documents"
                                    variant="outline"
                                    size="sm"
                                    rightIcon={<FiArrowRight />}
                                    mt={2}
                                >
                                    Vezi toate documentele
                                </Button>
                            </VStack>
                        ) : (
                            <Text color={mutedText} textAlign="center" py={4}>
                                Nu există documente recente
                            </Text>
                        )}
                    </CardBody>
                </Card>
            </SimpleGrid>

            {/* Activitate recentă */}
            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" shadow="lg">
                <CardHeader>
                    <HStack justify="space-between">
                        <HStack>
                            <Icon as={FiActivity} color="purple.500" boxSize={5} />
                            <Heading size="md">Activitate Recentă</Heading>
                        </HStack>
                        <Button
                            as={RouterLink}
                            to="/admin/activity-logs"
                            variant="link"
                            size="sm"
                            rightIcon={<FiArrowRight />}
                        >
                            Vezi toate logurile
                        </Button>
                    </HStack>
                </CardHeader>
                <CardBody>
                    {data.recentActivity && data.recentActivity.length > 0 ? (
                        <TableContainer>
                            <Table variant="simple" size="sm">
                                <Thead>
                                    <Tr>
                                        <Th>Utilizator</Th>
                                        <Th>Acțiune</Th>
                                        <Th>Descriere</Th>
                                        <Th>Data</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {data.recentActivity.slice(0, 3).map((activity: any) => (
                                        <Tr key={activity.id}>
                                            <Td>
                                                <HStack spacing={2}>
                                                    <Avatar
                                                        size="xs"
                                                        name={activity.first_name && activity.last_name
                                                            ? `${activity.first_name} ${activity.last_name}`
                                                            : activity.email || 'Sistem'}
                                                    />
                                                    <Box>
                                                        <Text fontSize="sm" fontWeight="medium">
                                                            {activity.first_name && activity.last_name
                                                                ? `${activity.first_name} ${activity.last_name}`
                                                                : activity.email || 'Sistem'}
                                                        </Text>
                                                        {activity.email && (
                                                            <Text fontSize="xs" color={mutedText}>
                                                                {activity.email}
                                                            </Text>
                                                        )}
                                                    </Box>
                                                </HStack>
                                            </Td>
                                            <Td>
                                                <Badge colorScheme="blue">{activity.action_type}</Badge>
                                            </Td>
                                            <Td>
                                                <Text fontSize="sm">{activity.description}</Text>
                                            </Td>
                                            <Td>
                                                <Text fontSize="xs" color={mutedText}>
                                                    {new Date(activity.created_at).toLocaleString('ro-RO')}
                                                </Text>
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Text color={mutedText} textAlign="center" py={4}>
                            Nu există activități recente
                        </Text>
                    )}
                </CardBody>
            </Card>

            {/* Acțiuni rapide */}
            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" shadow="lg" mt={6}>
                <CardHeader>
                    <HStack>
                        <Icon as={FiZap} color="blue.500" boxSize={5} />
                        <Heading size="md">Acțiuni Rapide</Heading>
                    </HStack>
                </CardHeader>
                <CardBody>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                        <Button
                            as={RouterLink}
                            to="/admin/settings"
                            leftIcon={<FiSettings />}
                            variant="outline"
                            size="lg"
                            h="auto"
                            py={4}
                            flexDirection="column"
                        >
                            <Text fontWeight="semibold">Setări</Text>
                            <Text fontSize="xs" color={mutedText} mt={1}>
                                Utilizatori, roluri
                            </Text>
                        </Button>
                        <Button
                            as={RouterLink}
                            to="/admin/personal-data-access-report"
                            leftIcon={<FiShield />}
                            variant="outline"
                            size="lg"
                            h="auto"
                            py={4}
                            flexDirection="column"
                        >
                            <Text fontWeight="semibold">Raport Acces</Text>
                            <Text fontSize="xs" color={mutedText} mt={1}>
                                Date personale
                            </Text>
                        </Button>
                        <Button
                            as={RouterLink}
                            to="/admin/users"
                            leftIcon={<FiUsers />}
                            variant="outline"
                            size="lg"
                            h="auto"
                            py={4}
                            flexDirection="column"
                        >
                            <Text fontWeight="semibold">Utilizatori</Text>
                            <Text fontSize="xs" color={mutedText} mt={1}>
                                Gestionare
                            </Text>
                        </Button>
                        <Button
                            as={RouterLink}
                            to="/admin/activity-logs"
                            leftIcon={<FiActivity />}
                            variant="outline"
                            size="lg"
                            h="auto"
                            py={4}
                            flexDirection="column"
                        >
                            <Text fontWeight="semibold">Loguri</Text>
                            <Text fontSize="xs" color={mutedText} mt={1}>
                                Istoric complet
                            </Text>
                        </Button>
                    </SimpleGrid>
                </CardBody>
            </Card>
        </Container>
    );
}
