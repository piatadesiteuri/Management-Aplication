import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Button,
  Select,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useColorModeValue,
  useToast,
  Spinner,
  Center,
  Divider,
  Card,
  CardHeader,
  CardBody,
  Icon,
  Flex,
  Spacer,
  ButtonGroup,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import {
  FiBarChart,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiUsers,
  FiClock,
  FiAlertCircle,
  FiDownload,
  FiRefreshCw
} from 'react-icons/fi';

interface EventReportingSystemProps {
  departmentId?: number;
  userId?: number;
}

interface ReportData {
  totalEvents: number;
  completedEvents: number;
  pendingEvents: number;
  cancelledEvents: number;
  inspectionEvents: number;
  emergencyEvents: number;
  meetingEvents: number;
  averageCompletionTime: number;
  upcomingEvents: number;
  overdueEvents: number;
  approvalPending: number;
  approvalApproved: number;
  approvalRejected: number;
  monthlyTrends: Array<{
    month: string;
    total: number;
    completed: number;
    pending: number;
  }>;
  eventsByType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  departmentStats: Array<{
    department: string;
    events: number;
    completion: number;
  }>;
  userPerformance: Array<{
    user: string;
    events: number;
    completion: number;
    avgTime: number;
  }>;
  criticalMetrics: {
    emergencyResponseTime: number;
    inspectionCompliance: number;
    reportingDeadlinesMet: number;
    staffUtilization: number;
  };
}

const EventReportingSystem: React.FC<EventReportingSystemProps> = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [reportType, setReportType] = useState('overview');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState('pdf');
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const cardBg = useColorModeValue('white', 'gray.700');

  // Mock data for demonstration - in real implementation, this would come from API
  const mockReportData: ReportData = {
    totalEvents: 1247,
    completedEvents: 892,
    pendingEvents: 234,
    cancelledEvents: 121,
    inspectionEvents: 456,
    emergencyEvents: 89,
    meetingEvents: 234,
    averageCompletionTime: 4.2,
    upcomingEvents: 156,
    overdueEvents: 23,
    approvalPending: 45,
    approvalApproved: 987,
    approvalRejected: 34,
    monthlyTrends: [
      { month: 'Ian', total: 98, completed: 87, pending: 11 },
      { month: 'Feb', total: 112, completed: 95, pending: 17 },
      { month: 'Mar', total: 134, completed: 118, pending: 16 },
      { month: 'Apr', total: 156, completed: 142, pending: 14 },
      { month: 'Mai', total: 143, completed: 128, pending: 15 },
      { month: 'Iun', total: 167, completed: 151, pending: 16 },
    ],
    eventsByType: [
      { type: 'Inspecții', count: 456, percentage: 36.6 },
      { type: 'Ședințe', count: 234, percentage: 18.8 },
      { type: 'Raportări', count: 189, percentage: 15.2 },
      { type: 'Urgențe', count: 89, percentage: 7.1 },
      { type: 'Formare', count: 156, percentage: 12.5 },
      { type: 'Altele', count: 123, percentage: 9.8 },
    ],
    departmentStats: [
      { department: 'Epidemiologie', events: 234, completion: 94.2 },
      { department: 'Igiena Mediului', events: 189, completion: 87.3 },
      { department: 'Sănătate Publică', events: 156, completion: 91.7 },
      { department: 'Laboratoare', events: 134, completion: 88.8 },
      { department: 'Urgențe', events: 89, completion: 96.6 },
    ],
    userPerformance: [
      { user: 'Dr. Popescu Maria', events: 45, completion: 95.6, avgTime: 3.2 },
      { user: 'Ing. Ionescu Ion', events: 38, completion: 89.5, avgTime: 4.1 },
      { user: 'Dr. Georgescu Ana', events: 42, completion: 92.9, avgTime: 3.8 },
      { user: 'Ing. Marinescu Paul', events: 35, completion: 88.6, avgTime: 4.5 },
    ],
    criticalMetrics: {
      emergencyResponseTime: 2.3,
      inspectionCompliance: 94.7,
      reportingDeadlinesMet: 87.2,
      staffUtilization: 78.5,
    },
  };

  useEffect(() => {
    loadReportData();
  }, [dateRange, reportType, selectedDepartment]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setReportData(mockReportData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading report data:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca datele raportului',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      toast({
        title: 'Export în curs',
        description: `Raportul este exportat în format ${exportFormat.toUpperCase()}`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      // Simulate export
      setTimeout(() => {
        toast({
          title: 'Export finalizat',
          description: 'Raportul a fost descărcat cu succes',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }, 2000);
    } catch (error) {
      toast({
        title: 'Eroare export',
        description: 'Nu s-a putut exporta raportul',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Center py={10}>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Se încarcă datele raportului...</Text>
        </VStack>
      </Center>
    );
  }

  if (!reportData) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Eroare!</AlertTitle>
        <AlertDescription>
          Nu s-au putut încărca datele raportului.
        </AlertDescription>
      </Alert>
    );
  }

  const completionRate = ((reportData.completedEvents / reportData.totalEvents) * 100).toFixed(1);

  return (
    <VStack spacing={6} align="stretch">
      {/* Header cu controale */}
      <Box bg={cardBg} p={6} borderRadius="xl" shadow="sm">
        <Flex align="center" mb={4}>
          <HStack spacing={4}>
            <Icon as={FiBarChart} boxSize={8} color="blue.500" />
            <Heading size="lg">Sistem de Raportare DSP</Heading>
          </HStack>
          <Spacer />
          <ButtonGroup size="sm">
            <Button
              leftIcon={<FiRefreshCw />}
              onClick={loadReportData}
              variant="outline"
            >
              Actualizează
            </Button>
            <Button
              leftIcon={<FiDownload />}
              colorScheme="blue"
              onClick={exportReport}
            >
              Export
            </Button>
          </ButtonGroup>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="7">Ultimele 7 zile</option>
            <option value="30">Ultimele 30 zile</option>
            <option value="90">Ultimele 90 zile</option>
            <option value="365">Ultimul an</option>
          </Select>

          <Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="overview">Prezentare generală</option>
            <option value="performance">Performanță</option>
            <option value="compliance">Conformitate</option>
            <option value="trends">Tendințe</option>
          </Select>

          <Select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
            <option value="all">Toate departamentele</option>
            <option value="epidemiologie">Epidemiologie</option>
            <option value="igiena">Igiena Mediului</option>
            <option value="sanatate">Sănătate Publică</option>
          </Select>

          <Select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
          </Select>
        </SimpleGrid>
      </Box>

      {/* Statistici principale */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <Stat bg={cardBg} p={6} borderRadius="xl" shadow="sm">
          <StatLabel>Total Evenimente</StatLabel>
          <StatNumber>{reportData.totalEvents}</StatNumber>
          <StatHelpText>
            <StatArrow type="increase" />
            12% față de luna trecută
          </StatHelpText>
        </Stat>

        <Stat bg={cardBg} p={6} borderRadius="xl" shadow="sm">
          <StatLabel>Rata de Finalizare</StatLabel>
          <StatNumber>{completionRate}%</StatNumber>
          <StatHelpText>
            <StatArrow type="increase" />
            {reportData.completedEvents} din {reportData.totalEvents}
          </StatHelpText>
        </Stat>

        <Stat bg={cardBg} p={6} borderRadius="xl" shadow="sm">
          <StatLabel>Timp Mediu</StatLabel>
          <StatNumber>{reportData.averageCompletionTime}h</StatNumber>
          <StatHelpText>
            <StatArrow type="decrease" />
            Îmbunătățit cu 8%
          </StatHelpText>
        </Stat>

        <Stat bg={cardBg} p={6} borderRadius="xl" shadow="sm">
          <StatLabel>Urgențe</StatLabel>
          <StatNumber>{reportData.emergencyEvents}</StatNumber>
          <StatHelpText>
            <StatArrow type="decrease" />
            Timp răspuns: {reportData.criticalMetrics.emergencyResponseTime}h
          </StatHelpText>
        </Stat>
      </SimpleGrid>

      {/* Metrici critice DSP */}
      <Card bg={cardBg} shadow="sm">
        <CardHeader>
          <Heading size="md">Indicatori Critici DSP</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontSize="sm" mb={2}>Conformitate Inspecții</Text>
                <Progress 
                  value={reportData.criticalMetrics.inspectionCompliance} 
                  colorScheme="green"
                  size="lg"
                />
                <Text fontSize="sm" color="gray.600">
                  {reportData.criticalMetrics.inspectionCompliance}%
                </Text>
              </Box>
              
              <Box>
                <Text fontSize="sm" mb={2}>Respectare Termene Raportare</Text>
                <Progress 
                  value={reportData.criticalMetrics.reportingDeadlinesMet} 
                  colorScheme="blue"
                  size="lg"
                />
                <Text fontSize="sm" color="gray.600">
                  {reportData.criticalMetrics.reportingDeadlinesMet}%
                </Text>
              </Box>
            </VStack>

            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontSize="sm" mb={2}>Utilizare Personal</Text>
                <Progress 
                  value={reportData.criticalMetrics.staffUtilization} 
                  colorScheme="purple"
                  size="lg"
                />
                <Text fontSize="sm" color="gray.600">
                  {reportData.criticalMetrics.staffUtilization}%
                </Text>
              </Box>
              
              <Box>
                <Text fontSize="sm" mb={2}>Timp Răspuns Urgențe</Text>
                <HStack>
                  <Icon as={FiClock} color="red.500" />
                  <Text fontWeight="bold" color="red.500">
                    {reportData.criticalMetrics.emergencyResponseTime} ore
                  </Text>
                </HStack>
              </Box>
            </VStack>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Distribuție evenimente pe tipuri */}
      <Card bg={cardBg} shadow="sm">
        <CardHeader>
          <Heading size="md">Distribuție Evenimente pe Tipuri</Heading>
        </CardHeader>
        <CardBody>
          <VStack align="stretch" spacing={3}>
            {reportData.eventsByType.map((item, index) => (
              <Box key={index}>
                <Flex justify="space-between" mb={2}>
                  <Text>{item.type}</Text>
                  <Text fontWeight="bold">{item.count} ({item.percentage}%)</Text>
                </Flex>
                <Progress value={item.percentage} colorScheme="blue" size="sm" />
              </Box>
            ))}
          </VStack>
        </CardBody>
      </Card>

      {/* Statistici departamente */}
      <Card bg={cardBg} shadow="sm">
        <CardHeader>
          <Heading size="md">Performanță Departamente</Heading>
        </CardHeader>
        <CardBody>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Departament</Th>
                  <Th isNumeric>Evenimente</Th>
                  <Th isNumeric>Rata Finalizare</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {reportData.departmentStats.map((dept, index) => (
                  <Tr key={index}>
                    <Td>{dept.department}</Td>
                    <Td isNumeric>{dept.events}</Td>
                    <Td isNumeric>{dept.completion}%</Td>
                    <Td>
                      <Badge 
                        colorScheme={dept.completion > 90 ? 'green' : dept.completion > 80 ? 'yellow' : 'red'}
                      >
                        {dept.completion > 90 ? 'Excelent' : dept.completion > 80 ? 'Bun' : 'Necesită atenție'}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>

      {/* Performanță utilizatori */}
      <Card bg={cardBg} shadow="sm">
        <CardHeader>
          <Heading size="md">Top Performanță Utilizatori</Heading>
        </CardHeader>
        <CardBody>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Utilizator</Th>
                  <Th isNumeric>Evenimente</Th>
                  <Th isNumeric>Finalizare</Th>
                  <Th isNumeric>Timp Mediu</Th>
                </Tr>
              </Thead>
              <Tbody>
                {reportData.userPerformance.map((user, index) => (
                  <Tr key={index}>
                    <Td>{user.user}</Td>
                    <Td isNumeric>{user.events}</Td>
                    <Td isNumeric>{user.completion}%</Td>
                    <Td isNumeric>{user.avgTime}h</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default EventReportingSystem; 