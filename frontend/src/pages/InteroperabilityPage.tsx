import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
  SimpleGrid,
  Badge,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
  HStack,
  Icon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Textarea,
  Code,
} from '@chakra-ui/react';
import {
  FiLink,
  FiCheckCircle,
  FiXCircle,
  FiSettings,
  FiPlay,
  FiFileText,
  FiClock,
  FiActivity,
  FiRefreshCw,
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import api from '../services/api';

interface ExternalIntegration {
  id: number;
  code: string;
  name: string;
  description: string;
  type: 'RAPORTARE' | 'VERIFICARE' | 'INTEGRARE' | 'STANDARD';
  endpoint_url?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'PLANNED';
  last_connection_test?: string;
  last_connection_status?: 'SUCCESS' | 'FAILED' | 'PENDING';
  last_connection_error?: string;
  reports_count?: number;
  logs_count?: number;
}

interface ExternalReport {
  id: number;
  integration_id: number;
  integration_name: string;
  integration_code: string;
  report_type: string;
  report_period_start: string;
  report_period_end: string;
  status: 'PENDING' | 'SENT' | 'CONFIRMED' | 'ERROR' | 'RETRY';
  sent_at?: string;
  created_at: string;
}

export default function InteroperabilityPage() {
  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  const [integrations, setIntegrations] = useState<ExternalIntegration[]>([]);
  const [reports, setReports] = useState<ExternalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState<number | null>(null);

  const { isOpen: isConfigOpen, onOpen: onConfigOpen, onClose: onConfigClose } = useDisclosure();
  const { isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose } = useDisclosure();

  const [selectedIntegration, setSelectedIntegration] = useState<ExternalIntegration | null>(null);
  const [configForm, setConfigForm] = useState({
    endpoint_url: '',
    api_key: '',
    api_secret: '',
    status: 'PLANNED' as string,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [integrationsRes, reportsRes] = await Promise.all([
        api.get('/interoperability/integrations'),
        api.get('/interoperability/reports'),
      ]);
      setIntegrations(integrationsRes.data || []);
      setReports(reportsRes.data || []);
    } catch (error) {
      console.error('Error loading interoperability data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = (integration: ExternalIntegration) => {
    setSelectedIntegration(integration);
    setConfigForm({
      endpoint_url: integration.endpoint_url || '',
      api_key: '',
      api_secret: '',
      status: integration.status,
    });
    onConfigOpen();
  };

  const handleSaveConfig = async () => {
    if (!selectedIntegration) return;
    try {
      await api.put(`/interoperability/integrations/${selectedIntegration.id}`, configForm);
      onConfigClose();
      loadData();
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const handleTestConnection = async (integration: ExternalIntegration) => {
    try {
      setTestingConnection(integration.id);
      const res = await api.post(`/interoperability/integrations/${integration.id}/test`);
      if (res.data.success) {
        // Reload data to get updated status
        await loadData();
      }
    } catch (error) {
      console.error('Error testing connection:', error);
    } finally {
      setTestingConnection(null);
    }
  };

  const handleSendReport = async (reportId: number) => {
    try {
      await api.post(`/interoperability/reports/${reportId}/send`);
      loadData();
    } catch (error) {
      console.error('Error sending report:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'green';
      case 'INACTIVE': return 'gray';
      case 'ERROR': return 'red';
      case 'PLANNED': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activ';
      case 'INACTIVE': return 'Inactiv';
      case 'ERROR': return 'Eroare';
      case 'PLANNED': return 'Planificat';
      default: return status;
    }
  };

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'green';
      case 'CONFIRMED': return 'blue';
      case 'PENDING': return 'orange';
      case 'ERROR': return 'red';
      case 'RETRY': return 'yellow';
      default: return 'gray';
    }
  };

  const getReportStatusLabel = (status: string) => {
    switch (status) {
      case 'SENT': return 'Trimis';
      case 'CONFIRMED': return 'Confirmat';
      case 'PENDING': return 'În așteptare';
      case 'ERROR': return 'Eroare';
      case 'RETRY': return 'Reîncercare';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Container maxW="7xl" py={10}>
        <Center>
          <Spinner size="xl" />
        </Center>
      </Container>
    );
  }

  return (
    <Container maxW="7xl" py={8}>
      <VStack align="stretch" spacing={6}>
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>Interconectivitate și interoperabilitate finală</Heading>
          <Text color={mutedText} mb={4}>
            Integrare cu sisteme externe și raportare automată către instituții naționale
          </Text>
          <Alert status="info" borderRadius="md" mb={4}>
            <AlertIcon />
            <Box>
              <AlertTitle>Ce poți face aici:</AlertTitle>
              <AlertDescription>
                • <strong>Configurează integrări externe</strong> - Adaugă endpoint-uri și credențiale pentru CNAS-DRG, SIUI, CM, DES, LIS, RIS/PACS<br />
                • <strong>Testează conexiuni</strong> - Verifică conectivitatea cu sistemele externe<br />
                • <strong>Trimite rapoarte</strong> - Raportare automată DRG, statistică și verificări către instituții naționale<br />
                • <strong>Monitorizează status</strong> - Vezi istoricul comunicărilor și statusul integrărilor
              </AlertDescription>
            </Box>
          </Alert>
        </Box>

        {/* Tabs */}
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>
              <HStack spacing={2}>
                <Icon as={FiLink} />
                <Text>Integrări Externe</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <Icon as={FiFileText} />
                <Text>Rapoarte Trimise</Text>
                {reports.length > 0 && (
                  <Badge colorScheme="blue">{reports.length}</Badge>
                )}
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <Icon as={FiActivity} />
                <Text>Log-uri Comunicare</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Tab 1: Integrări Externe */}
            <TabPanel>
              <VStack align="stretch" spacing={4}>
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Pași pentru configurare:</AlertTitle>
                    <AlertDescription fontSize="sm">
                      1. Click pe <strong>"Configurează"</strong> pentru o integrare<br />
                      2. Adaugă <strong>Endpoint URL</strong> și <strong>API Key/Secret</strong><br />
                      3. Salvează configurația<br />
                      4. Click pe <strong>"Testează"</strong> pentru a verifica conexiunea
                    </AlertDescription>
                  </Box>
                </Alert>
                <Card bg={bg} border="1px solid" borderColor={border}>
                  <CardBody>
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>SISTEM</Th>
                            <Th>TIP</Th>
                            <Th>DESCRIERE</Th>
                            <Th>STATUS</Th>
                            <Th>ULTIM TEST</Th>
                            <Th>ACȚIUNI</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {integrations.map((integration) => (
                            <Tr key={integration.id}>
                              <Td>
                                <Badge colorScheme={
                                  integration.type === 'RAPORTARE' ? 'blue' :
                                  integration.type === 'VERIFICARE' ? 'green' :
                                  integration.type === 'INTEGRARE' ? 'purple' : 'gray'
                                }>
                                  {integration.name}
                                </Badge>
                              </Td>
                              <Td>{integration.type}</Td>
                              <Td>
                                <Text fontSize="sm" color={mutedText} noOfLines={2}>
                                  {integration.description}
                                </Text>
                              </Td>
                              <Td>
                                <Badge colorScheme={getStatusColor(integration.status)}>
                                  {getStatusLabel(integration.status)}
                                </Badge>
                              </Td>
                              <Td>
                                {integration.last_connection_test ? (
                                  <HStack spacing={2}>
                                    <Icon
                                      as={integration.last_connection_status === 'SUCCESS' ? FiCheckCircle : FiXCircle}
                                      color={integration.last_connection_status === 'SUCCESS' ? 'green.500' : 'red.500'}
                                    />
                                    <Text fontSize="xs" color={mutedText}>
                                      {new Date(integration.last_connection_test).toLocaleDateString('ro-RO')}
                                    </Text>
                                  </HStack>
                                ) : (
                                  <Text fontSize="xs" color={mutedText}>Nefăcut</Text>
                                )}
                              </Td>
                              <Td>
                                <HStack spacing={2}>
                                  <Button
                                    size="xs"
                                    leftIcon={<Icon as={FiSettings} />}
                                    onClick={() => handleConfigure(integration)}
                                  >
                                    Configurează
                                  </Button>
                                  {integration.endpoint_url && (
                                    <Button
                                      size="xs"
                                      colorScheme="blue"
                                      leftIcon={<Icon as={FiPlay} />}
                                      onClick={() => handleTestConnection(integration)}
                                      isLoading={testingConnection === integration.id}
                                    >
                                      Testează
                                    </Button>
                                  )}
                                </HStack>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </CardBody>
                </Card>

                {/* Standarde de interoperabilitate */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Card bg={bg} border="1px solid" borderColor={border} borderRadius="xl">
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        <Heading size="md">Standarde de interoperabilitate</Heading>
                        <VStack align="stretch" spacing={2}>
                          <Box>
                            <Text fontWeight="bold" fontSize="sm">HL7</Text>
                            <Text fontSize="xs" color={mutedText}>
                              Health Level Seven - standard pentru schimb de date medicale
                            </Text>
                          </Box>
                          <Box>
                            <Text fontWeight="bold" fontSize="sm">FHIR</Text>
                            <Text fontSize="xs" color={mutedText}>
                              Fast Healthcare Interoperability Resources - standard modern pentru interoperabilitate
                            </Text>
                          </Box>
                          <Box>
                            <Text fontWeight="bold" fontSize="sm">DICOM</Text>
                            <Text fontSize="xs" color={mutedText}>
                              Digital Imaging and Communications in Medicine - standard pentru imagistică medicală
                            </Text>
                          </Box>
                          <Box>
                            <Text fontWeight="bold" fontSize="sm">IHE</Text>
                            <Text fontSize="xs" color={mutedText}>
                              Integrating the Healthcare Enterprise - profile de integrare
                            </Text>
                          </Box>
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={bg} border="1px solid" borderColor={border} borderRadius="xl">
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        <Heading size="md">Raportare automată</Heading>
                        <VStack align="stretch" spacing={2}>
                          <HStack>
                            <Icon as={FiCheckCircle} color="green.500" />
                            <Text fontSize="sm" color={mutedText}>Raportare DRG către CNAS-DRG</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiCheckCircle} color="green.500" />
                            <Text fontSize="sm" color={mutedText}>Raportare statistică către CM și DES</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiCheckCircle} color="green.500" />
                            <Text fontSize="sm" color={mutedText}>Verificare calitate asigurat prin SIUI</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiCheckCircle} color="green.500" />
                            <Text fontSize="sm" color={mutedText}>Generare automată de rapoarte conform cerințelor legale</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiCheckCircle} color="green.500" />
                            <Text fontSize="sm" color={mutedText}>Fără necesitatea aplicațiilor adiționale</Text>
                          </HStack>
                        </VStack>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          leftIcon={<Icon as={FiFileText} />}
                          onClick={onReportOpen}
                          mt={2}
                        >
                          Creează Raport Nou
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </VStack>
            </TabPanel>

            {/* Tab 2: Rapoarte Trimise */}
            <TabPanel>
              <VStack align="stretch" spacing={4}>
                {reports.length === 0 ? (
                  <Card bg={bg} border="1px solid" borderColor={border}>
                    <CardBody>
                      <Text color={mutedText} textAlign="center" py={4}>
                        Nu există rapoarte trimise
                      </Text>
                    </CardBody>
                  </Card>
                ) : (
                  <Card bg={bg} border="1px solid" borderColor={border}>
                    <CardBody>
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Integrare</Th>
                              <Th>Tip Raport</Th>
                              <Th>Perioadă</Th>
                              <Th>Status</Th>
                              <Th>Trimis la</Th>
                              <Th>Acțiuni</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {reports.map((report) => (
                              <Tr key={report.id}>
                                <Td>
                                  <Text fontSize="sm" fontWeight="semibold">
                                    {report.integration_name}
                                  </Text>
                                  <Text fontSize="xs" color={mutedText}>
                                    {report.integration_code}
                                  </Text>
                                </Td>
                                <Td>
                                  <Badge>{report.report_type}</Badge>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {new Date(report.report_period_start).toLocaleDateString('ro-RO')} - {new Date(report.report_period_end).toLocaleDateString('ro-RO')}
                                  </Text>
                                </Td>
                                <Td>
                                  <Badge colorScheme={getReportStatusColor(report.status)}>
                                    {getReportStatusLabel(report.status)}
                                  </Badge>
                                </Td>
                                <Td>
                                  {report.sent_at ? (
                                    <Text fontSize="xs" color={mutedText}>
                                      {new Date(report.sent_at).toLocaleString('ro-RO')}
                                    </Text>
                                  ) : (
                                    <Text fontSize="xs" color={mutedText}>-</Text>
                                  )}
                                </Td>
                                <Td>
                                  {report.status === 'PENDING' && (
                                    <Button
                                      size="xs"
                                      colorScheme="blue"
                                      leftIcon={<Icon as={FiPlay} />}
                                      onClick={() => handleSendReport(report.id)}
                                    >
                                      Trimite
                                    </Button>
                                  )}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </TabPanel>

            {/* Tab 3: Log-uri Comunicare */}
            <TabPanel>
              <VStack align="stretch" spacing={4}>
                <Card bg={bg} border="1px solid" borderColor={border}>
                  <CardBody>
                    <VStack align="stretch" spacing={4}>
                      <Heading size="md">Log-uri de comunicare</Heading>
                      <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Istoric comunicări</AlertTitle>
                          <AlertDescription>
                            Aici vei vedea toate comunicările cu sistemele externe: teste de conexiune, rapoarte trimise, 
                            erori și răspunsuri. Funcționalitatea completă va fi disponibilă în versiunea finală.
                          </AlertDescription>
                        </Box>
                      </Alert>
                      <Text color={mutedText} fontSize="sm" fontStyle="italic" textAlign="center" py={4}>
                        Log-urile vor fi afișate aici după ce vei testa conexiuni sau trimite rapoarte.
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Modal: Configurează Integrare */}
      <Modal isOpen={isConfigOpen} onClose={onConfigClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Configurează: {selectedIntegration?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <FormControl>
                <FormLabel>Endpoint URL</FormLabel>
                <Input
                  placeholder="https://api.example.com/v1"
                  value={configForm.endpoint_url}
                  onChange={(e) => setConfigForm({ ...configForm, endpoint_url: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>API Key</FormLabel>
                <Input
                  type="password"
                  placeholder="API Key"
                  value={configForm.api_key}
                  onChange={(e) => setConfigForm({ ...configForm, api_key: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>API Secret</FormLabel>
                <Input
                  type="password"
                  placeholder="API Secret"
                  value={configForm.api_secret}
                  onChange={(e) => setConfigForm({ ...configForm, api_secret: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={configForm.status}
                  onChange={(e) => setConfigForm({ ...configForm, status: e.target.value })}
                >
                  <option value="PLANNED">Planificat</option>
                  <option value="ACTIVE">Activ</option>
                  <option value="INACTIVE">Inactiv</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onConfigClose}>
                Anulează
              </Button>
              <Button colorScheme="blue" onClick={handleSaveConfig}>
                Salvează
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
