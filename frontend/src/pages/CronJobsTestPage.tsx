import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Alert,
  AlertIcon,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';
import {
  FiPlay,
  FiSquare,
  FiRefreshCw,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
} from 'react-icons/fi';
import api from '../services/api';

interface CronJobStatus {
  id: string;
  active: boolean;
  nextRun?: Date;
}

interface CronJobsData {
  jobs: CronJobStatus[];
  totalJobs: number;
  activeJobs: number;
}

const CronJobsTestPage: React.FC = () => {
  const [cronJobsData, setCronJobsData] = useState<CronJobsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [stopping, setStopping] = useState(false);
  const [restarting, setRestarting] = useState(false);
  
  const toast = useToast();

  useEffect(() => {
    loadCronJobsStatus();
  }, []);

  const loadCronJobsStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/automated-reports/cron/status');
      setCronJobsData(response.data);
    } catch (error) {
      console.error('Error loading cron jobs status:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca statusul cron job-urilor',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestCronJob = async (scheduleId: string) => {
    try {
      setTesting(scheduleId);
      await api.post(`/automated-reports/cron/test/${scheduleId}`);
      toast({
        title: 'Succes',
        description: 'Testul cron job a fost executat cu succes',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadCronJobsStatus();
    } catch (error) {
      console.error('Error testing cron job:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut executa testul cron job',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setTesting(null);
    }
  };

  const handleStopAllJobs = async () => {
    try {
      setStopping(true);
      await api.post('/automated-reports/cron/stop');
      toast({
        title: 'Succes',
        description: 'Toate cron job-urile au fost oprite',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadCronJobsStatus();
    } catch (error) {
      console.error('Error stopping cron jobs:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut opri cron job-urile',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setStopping(false);
    }
  };

  const handleRestartJobs = async () => {
    try {
      setRestarting(true);
      await api.post('/automated-reports/cron/restart');
      toast({
        title: 'Succes',
        description: 'Cron job-urile au fost repornite cu succes',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadCronJobsStatus();
    } catch (error) {
      console.error('Error restarting cron jobs:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut reporni cron job-urile',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setRestarting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Testare Cron Jobs
          </Heading>
          <Text color="gray.600">
            Gestionează și testează cron job-urile pentru rapoarte automate
          </Text>
        </Box>

        {/* Stats Cards */}
        <Box>
          <HStack spacing={6}>
            <Card flex={1}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Cron Jobs</StatLabel>
                  <StatNumber>{cronJobsData?.totalJobs || 0}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    Configurate
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card flex={1}>
              <CardBody>
                <Stat>
                  <StatLabel>Jobs Active</StatLabel>
                  <StatNumber>{cronJobsData?.activeJobs || 0}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    Rulează
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </HStack>
        </Box>

        {/* Action Buttons */}
        <HStack spacing={4}>
          <Button
            leftIcon={<FiRefreshCw />}
            colorScheme="blue"
            onClick={loadCronJobsStatus}
            isLoading={loading}
          >
            Actualizează Status
          </Button>
          <Button
            leftIcon={<FiSquare />}
            colorScheme="red"
            onClick={handleStopAllJobs}
            isLoading={stopping}
          >
            Oprește Toate Jobs
          </Button>
          <Button
            leftIcon={<FiPlay />}
            colorScheme="green"
            onClick={handleRestartJobs}
            isLoading={restarting}
          >
            Repornește Jobs
          </Button>
        </HStack>

        {/* Cron Jobs Table */}
        <Card>
          <CardHeader>
            <Heading size="md">Status Cron Jobs</Heading>
          </CardHeader>
          <CardBody>
            {cronJobsData?.jobs.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                Nu există cron jobs configurate. Creează programe de rapoarte pentru a vedea cron jobs aici.
              </Alert>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>ID Job</Th>
                    <Th>Status</Th>
                    <Th>Următoarea Execuție</Th>
                    <Th>Acțiuni</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {cronJobsData?.jobs.map((job) => (
                    <Tr key={job.id}>
                      <Td>
                        <Text fontFamily="mono" fontSize="sm">
                          {job.id}
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Icon as={job.active ? FiCheckCircle : FiXCircle} color={job.active ? 'green.500' : 'red.500'} />
                          <Badge colorScheme={job.active ? 'green' : 'red'}>
                            {job.active ? 'Activ' : 'Inactiv'}
                          </Badge>
                        </HStack>
                      </Td>
                      <Td>
                        {job.nextRun ? (
                          <HStack>
                            <FiClock />
                            <Text fontSize="sm">
                              {new Date(job.nextRun).toLocaleString('ro-RO')}
                            </Text>
                          </HStack>
                        ) : (
                          <Text fontSize="sm" color="gray.500">
                            Necunoscut
                          </Text>
                        )}
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          leftIcon={<FiPlay />}
                          onClick={() => handleTestCronJob(job.id.replace('report_', ''))}
                          isLoading={testing === job.id.replace('report_', '')}
                          isDisabled={!job.active}
                        >
                          Testează
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <Heading size="md">Informații Cron Jobs</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="start" spacing={4}>
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Cum funcționează cron job-urile:</Text>
                  <Text fontSize="sm" mt={2}>
                    • Cron job-urile se execută automat în background<br/>
                    • Rapoartele se generează conform programului stabilit<br/>
                    • Notificările se trimit prin WebSocket când rapoartele sunt gata<br/>
                    • Job-ul de curățare șterge rapoartele vechi zilnic la 02:00
                  </Text>
                </Box>
              </Alert>
              
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Pentru testare:</Text>
                  <Text fontSize="sm" mt={2}>
                    • Folosește butonul "Testează" pentru a executa manual un job<br/>
                    • Verifică log-urile din consolă pentru detalii<br/>
                    • Rapoartele generate vor apărea în secțiunea "Rapoarte Generate"
                  </Text>
                </Box>
              </Alert>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default CronJobsTestPage; 