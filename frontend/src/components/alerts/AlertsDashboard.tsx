import React, { useMemo, useState, useEffect } from 'react';
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
  IconButton,
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tooltip,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  ButtonGroup,
  Collapse,
} from '@chakra-ui/react';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiRefreshCw,
  FiPlay,
  FiSquare,
  FiSearch,
  FiFilter,
  FiBarChart,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { AlertsService, Alert as AlertType, AlertRule, AlertStats } from '../../services/AlertsService';
import { useAuth } from '../../hooks/useAuth';

export default function AlertsDashboard() {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all'); // entity_type
  const [filterRuleId, setFilterRuleId] = useState('all'); // rule_id
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);
  
  const toast = useToast();
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole('SUPER_ADMIN');
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const muted = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [alertsData, rulesData, statsData] = await Promise.all([
        AlertsService.getAllAlerts(),
        AlertsService.getAlertRules(),
        AlertsService.getAlertStats()
      ]);
      
      setAlerts(alertsData);
      setRules(rulesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading alerts data:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca datele alertelor',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };



  const handleResolveAlert = async (alertId: number) => {
    try {
      await AlertsService.resolveAlert(alertId);
      setAlerts(alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'RESOLVED' as const, resolved_at: new Date().toISOString() }
          : alert
      ));
      toast({
        title: 'Succes',
        description: 'Alertă marcată ca rezolvată',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut marca alerta ca rezolvată',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const normalizeText = (v: any) => {
    const s = String(v ?? '');
    // fix encoding artifacts we saw in seeded demo content (Alertăƒ)
    return s.replace(/ƒ/g, '').replace(/\s+Acesta este un mesaj demo\.?/i, '').trim();
  };

  const severityLabel = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'Critică';
      case 'HIGH': return 'Ridicată';
      case 'MEDIUM': return 'Mediu';
      case 'LOW': return 'Scăzută';
      default: return '—';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activă';
      case 'RESOLVED': return 'Rezolvată';
      default: return status;
    }
  };

  const categoryLabel = (entityType: string) => {
    // Keep this user-friendly (not technical)
    switch (entityType) {
      case 'VEHICLE': return 'Vehicule';
      case 'EVENT': return 'Calendar';
      case 'SUPPLIER': return 'Furnizori';
      case 'USER': return 'Utilizatori';
      default: return 'General';
    }
  };

  const recommendationsFor = (alert: AlertType): string[] => {
    const sev = String(alert.severity || '');
    const cat = String(alert.entity_type || '');
    if (cat === 'VEHICLE') {
      return [
        'Verifică detaliile vehiculului și documentele aferente (ITP/RCA).',
        'Planifică mentenanța sau înlocuirea în perioada următoare.',
      ];
    }
    if (cat === 'EVENT') {
      return [
        'Deschide evenimentul asociat și verifică statusul / responsabilul.',
        'Contactează departamentul responsabil dacă e nevoie de decizie.',
      ];
    }
    if (cat === 'SUPPLIER') {
      return [
        'Verifică furnizorul și istoricul livrărilor.',
        'Inițiază acțiune corectivă / solicită clarificări.',
      ];
    }
    if (cat === 'USER') {
      return [
        'Verifică utilizatorul și activitatea recentă.',
        'Confirmă permisiunile/rolurile dacă este cazul.',
      ];
    }
    if (sev === 'CRITICAL') {
      return ['Tratează ca prioritate imediată și alocă un responsabil.'];
    }
    return ['Deschide detaliile și urmează pașii recomandați.'];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'yellow';
      case 'LOW': return 'green';
      default: return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'red';
      case 'RESOLVED': return 'green';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return FiAlertTriangle;
      case 'RESOLVED': return FiCheckCircle;
      default: return FiAlertTriangle;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    if (filterCategory !== 'all' && String(alert.entity_type) !== String(filterCategory)) return false;
    if (filterRuleId !== 'all' && String(alert.rule_id) !== String(filterRuleId)) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const blob = `${normalizeText(alert.title)} ${normalizeText(alert.message)} ${categoryLabel(alert.entity_type)}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  });

  const activeCount = useMemo(() => alerts.filter(a => a.status === 'ACTIVE').length, [alerts]);
  const resolvedCount = useMemo(() => alerts.filter(a => a.status === 'RESOLVED').length, [alerts]);

  const ruleById = useMemo(() => {
    const m = new Map<number, AlertRule>();
    for (const r of rules) m.set(r.id, r);
    return m;
  }, [rules]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const a of alerts) {
      if (a?.entity_type) set.add(String(a.entity_type));
    }
    return Array.from(set);
  }, [alerts]);

  const availableRules = useMemo(() => {
    return rules
      .slice()
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'ro-RO'))
      .map((r) => ({ id: String(r.id), name: r.name }));
  }, [rules]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAlerts = filteredAlerts.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Center py={10}>
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={6}>
        <Text fontSize="3xl" fontWeight="bold" mb={2}>Alerte</Text>
        <Text color={muted}>
          Aici vezi problemele care necesită atenție și ce acțiuni sunt recomandate. Nu este un ecran “tehnic”.
        </Text>
      </Box>

      {/* Statistici */}
      {stats && (
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} mb={6}>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Total</StatLabel>
                <StatNumber color="blue.500">{stats.total}</StatNumber>
                <StatHelpText>Înregistrări în sistem</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Necesită atenție</StatLabel>
                <StatNumber color="red.500">{stats.active}</StatNumber>
                <StatHelpText>Active acum</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Rezolvate</StatLabel>
                <StatNumber color="green.500">{resolvedCount}</StatNumber>
                <StatHelpText>Închise</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Categorii</StatLabel>
                <StatNumber color="purple.500">{stats.typeStats.length}</StatNumber>
                <StatHelpText>Calendar, Vehicule, etc.</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>
      )}

      {/* Tabs pentru Alerte și Reguli */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>
            <HStack>
              <FiAlertTriangle />
              <Text>Inbox ({activeCount})</Text>
            </HStack>
          </Tab>
          {isSuperAdmin && (
            <Tab>
              <HStack>
                <FiSettings />
                <Text>Setări avansate</Text>
              </HStack>
            </Tab>
          )}
          <Tab>
            <HStack>
              <FiBarChart />
              <Text>Statistici</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* Tab Alerte */}
          <TabPanel>
            {/* Filtre */}
            <Flex gap={4} mb={4} wrap="wrap">
              <InputGroup maxW="300px">
                <InputLeftElement>
                  <FiSearch />
                </InputLeftElement>
                <Input 
                  placeholder="Caută după text / categorie..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              <Button
                leftIcon={<FiFilter />}
                variant="outline"
                onClick={() => setShowAdvanced(v => !v)}
              >
                {showAdvanced ? 'Ascunde filtre' : 'Filtre'}
              </Button>
              
              <Button leftIcon={<FiRefreshCw />} onClick={loadData} colorScheme="blue" variant="outline">
                Reîmprospătează
              </Button>
            </Flex>

            <Collapse in={showAdvanced} animateOpacity>
              <Flex gap={4} mb={4} wrap="wrap">
                <Select 
                  maxW="220px" 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Toate</option>
                  <option value="ACTIVE">Necesită atenție (active)</option>
                  <option value="RESOLVED">Rezolvate</option>
                </Select>
                
                <Select 
                  maxW="220px" 
                  value={filterSeverity} 
                  onChange={(e) => setFilterSeverity(e.target.value)}
                >
                  <option value="all">Toate prioritățile</option>
                  <option value="CRITICAL">Critică</option>
                  <option value="HIGH">Ridicată</option>
                  <option value="MEDIUM">Mediu</option>
                  <option value="LOW">Scăzută</option>
                </Select>

                <Select
                  maxW="220px"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">Toate categoriile</option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>
                      {categoryLabel(c)}
                    </option>
                  ))}
                </Select>

                <Select
                  maxW="320px"
                  value={filterRuleId}
                  onChange={(e) => setFilterRuleId(e.target.value)}
                >
                  <option value="all">Toate sursele (regulile)</option>
                  {availableRules.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </Flex>
            </Collapse>

            {/* Lista Alerte */}
            <Box
              border="1px solid"
              borderColor={useColorModeValue('gray.200', 'gray.700')}
              borderRadius="xl"
              overflow="hidden"
              bg={useColorModeValue('white', 'gray.800')}
            >
              {currentAlerts.length === 0 ? (
                <Center py={10}>
                  <VStack spacing={2}>
                    <FiAlertTriangle size={32} color="gray.400" />
                    <Text color={useColorModeValue('gray.600', 'gray.400')}>
                      Nu există alerte pentru filtrele curente.
                    </Text>
                  </VStack>
                </Center>
              ) : (
                <Table size="sm" variant="simple">
                  <Thead position="sticky" top={0} zIndex={1} bg={useColorModeValue('gray.50', 'gray.700')}>
                    <Tr>
                      <Th>Prioritate</Th>
                      <Th>Alertă</Th>
                      <Th>Categorie</Th>
                      <Th>Sursă</Th>
                      <Th textAlign="right">Creată</Th>
                      <Th textAlign="right">Acțiuni</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {currentAlerts.map((alert) => {
                      const severityColor = getSeverityColor(alert.severity);
                      const rule = ruleById.get(alert.rule_id);
                      return (
                        <Tr
                          key={alert.id}
                          _hover={{ bg: useColorModeValue('gray.50', 'gray.900') }}
                        >
                          <Td>
                            <Badge colorScheme={severityColor}>
                              {severityLabel(alert.severity)}
                            </Badge>
                          </Td>
                          <Td maxW="520px">
                            <Text fontWeight="semibold" noOfLines={1}>
                              {normalizeText(alert.title)}
                            </Text>
                            <Text fontSize="sm" color={muted} noOfLines={2}>
                              {normalizeText(alert.message)}
                            </Text>
                          </Td>
                          <Td>
                            <Badge variant="subtle" colorScheme="blue">
                              {categoryLabel(alert.entity_type)}
                            </Badge>
                          </Td>
                          <Td maxW="260px">
                            <Text fontSize="sm" noOfLines={1}>
                              {rule?.name ? rule.name : 'Monitorizare automată'}
                            </Text>
                            <Text fontSize="xs" color={muted} noOfLines={1}>
                              Verificare: la 5 minute
                            </Text>
                          </Td>
                          <Td textAlign="right" fontSize="sm" color={muted} whiteSpace="nowrap">
                            {new Date(alert.created_at).toLocaleString('ro-RO')}
                          </Td>
                          <Td textAlign="right" whiteSpace="nowrap">
                            <HStack justify="flex-end" spacing={2}>
                              <Tooltip label="Detalii">
                                <IconButton
                                  aria-label="Detalii"
                                  icon={<FiEye />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedAlert(alert);
                                    onOpen();
                                  }}
                                />
                              </Tooltip>
                              {alert.status === 'ACTIVE' && (
                                <Tooltip label="Rezolvă">
                                  <IconButton
                                    aria-label="Rezolvă"
                                    icon={<FiCheckCircle />}
                                    size="sm"
                                    colorScheme="green"
                                    variant="solid"
                                    onClick={() => handleResolveAlert(alert.id)}
                                  />
                                </Tooltip>
                              )}
                            </HStack>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              )}
            </Box>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <Box 
                  mt={6} 
                  p={4} 
                  bg={useColorModeValue('gray.50', 'gray.700')} 
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={useColorModeValue('gray.200', 'gray.600')}
                >
                  <Flex justify="space-between" align="center">
                    <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                      Afișez {startIndex + 1}-{Math.min(endIndex, filteredAlerts.length)} din {filteredAlerts.length} alerte
                    </Text>
                    
                    <ButtonGroup size="sm" isAttached variant="outline">
                      <IconButton
                        aria-label="Pagina anterioară"
                        icon={<FiChevronLeft />}
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        isDisabled={currentPage === 1}
                      />
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            colorScheme={currentPage === pageNum ? 'blue' : 'gray'}
                            variant={currentPage === pageNum ? 'solid' : 'outline'}
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
                      />
                    </ButtonGroup>
                  </Flex>
                </Box>
              )}
          </TabPanel>

          {/* Tab Setări avansate (SUPER_ADMIN) */}
          {isSuperAdmin && (
            <TabPanel>
            <Box>
              {/* Header informativ */}
              <Box 
                p={6} 
                bg={useColorModeValue('blue.50', 'blue.900')} 
                borderRadius="xl" 
                border="1px solid" 
                borderColor={useColorModeValue('blue.200', 'blue.700')}
                mb={6}
              >
                <HStack spacing={4} mb={3}>
                  <Box
                    p={3}
                    bg="blue.100"
                    borderRadius="xl"
                    color="blue.600"
                  >
                    <FiSettings size={24} />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xl" fontWeight="bold" color={useColorModeValue('blue.800', 'blue.100')}>
                      Setări avansate (Reguli)
                    </Text>
                    <Text color={useColorModeValue('blue.600', 'blue.300')}>
                      Aici configurezi ce situații declanșează alerte și cine le primește. (Ecran pentru SUPER_ADMIN.)
                    </Text>
                  </VStack>
                </HStack>
                
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  <Stat>
                    <StatLabel color={useColorModeValue('blue.600', 'blue.300')}>Reguli Active</StatLabel>
                    <StatNumber color="blue.500">{rules.filter(r => r.is_active).length}</StatNumber>
                    <StatHelpText>În funcțiune</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel color={useColorModeValue('blue.600', 'blue.300')}>Tipuri Monitorizate</StatLabel>
                    <StatNumber color="green.500">{new Set(rules.map(r => r.type)).size}</StatNumber>
                    <StatHelpText>Evenimente, Vehicule, etc.</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel color={useColorModeValue('blue.600', 'blue.300')}>Verificare</StatLabel>
                    <StatNumber color="orange.500">5 min</StatNumber>
                    <StatHelpText>La fiecare 5 minute</StatHelpText>
                  </Stat>
                </SimpleGrid>
              </Box>

              {/* Lista regulilor */}
              <VStack spacing={4} align="stretch">
                {rules.map((rule) => (
                  <Card 
                    key={rule.id} 
                    bg={useColorModeValue('white', 'gray.800')}
                    border="1px solid" 
                    borderColor={useColorModeValue('gray.200', 'gray.700')}
                    borderRadius="xl"
                    overflow="hidden"
                    position="relative"
                    _hover={{
                      transform: 'translateY(-1px)',
                      boxShadow: 'lg',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Status indicator */}
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      h="3px"
                      bg={rule.is_active ? 'green.400' : 'gray.400'}
                    />
                    
                    <CardBody p={6}>
                      <Flex justify="space-between" align="start" gap={4}>
                        {/* Left side - Content */}
                        <Box flex={1}>
                          <HStack spacing={3} mb={3}>
                            <Box
                              p={2}
                              borderRadius="lg"
                              bg={
                                rule.is_active 
                                  ? (getSeverityColor(rule.severity) === 'red' ? 'red.50' :
                                     getSeverityColor(rule.severity) === 'orange' ? 'orange.50' :
                                     getSeverityColor(rule.severity) === 'yellow' ? 'yellow.50' :
                                     'green.50')
                                  : 'gray.50'
                              }
                              color={
                                rule.is_active 
                                  ? `${getSeverityColor(rule.severity)}.600`
                                  : 'gray.500'
                              }
                            >
                              <FiAlertTriangle size={20} />
                            </Box>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold" fontSize="lg" color={useColorModeValue('gray.800', 'white')}>
                                {rule.name}
                              </Text>
                              <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>
                                {rule.type} • {rule.severity}
                              </Text>
                            </VStack>
                          </HStack>
                          
                          <Text color={useColorModeValue('gray.600', 'gray.300')} fontSize="md" mb={4}>
                            {rule.description}
                          </Text>
                          
                          {/* Badges */}
                          <Flex gap={2} flexWrap="wrap">
                            <Badge
                              px={3}
                              py={1}
                              borderRadius="full"
                              fontSize="xs"
                              fontWeight="bold"
                              bg={`${getSeverityColor(rule.severity)}.100`}
                              color={`${getSeverityColor(rule.severity)}.700`}
                              border="1px solid"
                              borderColor={`${getSeverityColor(rule.severity)}.200`}
                            >
                              {rule.severity}
                            </Badge>
                            <Badge
                              px={3}
                              py={1}
                              borderRadius="full"
                              fontSize="xs"
                              fontWeight="bold"
                              bg="blue.100"
                              color="blue.700"
                              border="1px solid"
                              borderColor="blue.200"
                            >
                              {rule.type}
                            </Badge>
                            <Badge
                              px={3}
                              py={1}
                              borderRadius="full"
                              fontSize="xs"
                              fontWeight="bold"
                              bg={rule.is_active ? 'green.100' : 'gray.100'}
                              color={rule.is_active ? 'green.700' : 'gray.700'}
                              border="1px solid"
                              borderColor={rule.is_active ? 'green.200' : 'gray.200'}
                            >
                              {rule.is_active ? 'Activă' : 'Inactivă'}
                            </Badge>
                          </Flex>
                        </Box>
                        
                        {/* Right side - Status */}
                        <VStack align="end" spacing={2}>
                          <Box
                            p={2}
                            borderRadius="full"
                            bg={rule.is_active ? 'green.100' : 'gray.100'}
                            color={rule.is_active ? 'green.600' : 'gray.500'}
                          >
                            <FiCheckCircle size={16} />
                          </Box>
                          <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                            {rule.is_active ? 'Monitorizează' : 'Oprire'}
                          </Text>
                        </VStack>
                      </Flex>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
              
              {/* Footer informativ */}
              <Box 
                p={4} 
                bg={useColorModeValue('gray.50', 'gray.700')} 
                borderRadius="lg" 
                mt={6}
                textAlign="center"
              >
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
                  <strong>Notă:</strong> Nu afișăm SQL sau detalii tehnice aici. Regula definește doar “ce se întâmplă” și “cine primește”.
                </Text>
              </Box>
            </Box>
          </TabPanel>
          )}

          {/* Tab Statistici */}
          <TabPanel>
            {stats && (
              <Box>
                {/* Header statistici */}
                <Box 
                  p={6} 
                  bg={useColorModeValue('purple.50', 'purple.900')} 
                  borderRadius="xl" 
                  border="1px solid" 
                  borderColor={useColorModeValue('purple.200', 'purple.700')}
                  mb={6}
                >
                  <HStack spacing={4} mb={3}>
                    <Box
                      p={3}
                      bg="purple.100"
                      borderRadius="xl"
                      color="purple.600"
                    >
                      <FiBarChart size={24} />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xl" fontWeight="bold" color={useColorModeValue('purple.800', 'purple.100')}>
                        Statistici Alerte
                      </Text>
                      <Text color={useColorModeValue('purple.600', 'purple.300')}>
                        Analiză detaliată a alertelor generate în sistem
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
                  {/* Statistici pe severitate */}
                  <Card 
                    bg={useColorModeValue('white', 'gray.800')}
                    border="1px solid" 
                    borderColor={useColorModeValue('gray.200', 'gray.700')}
                    borderRadius="xl"
                    overflow="hidden"
                  >
                    <CardHeader bg={useColorModeValue('gray.50', 'gray.700')}>
                      <HStack spacing={3}>
                        <Box
                          p={2}
                          bg="red.100"
                          borderRadius="lg"
                          color="red.600"
                        >
                          <FiAlertTriangle size={20} />
                        </Box>
                        <Text fontWeight="bold" fontSize="lg">Alerte pe Severitate</Text>
                      </HStack>
                    </CardHeader>
                    <CardBody p={6}>
                      <VStack spacing={4} align="stretch">
                        {stats.severityStats.map((stat) => (
                          <Box
                            key={stat.severity}
                            p={4}
                            borderRadius="lg"
                            bg={useColorModeValue('gray.50', 'gray.700')}
                            border="1px solid"
                            borderColor={useColorModeValue('gray.200', 'gray.600')}
                          >
                            <Flex justify="space-between" align="center" mb={2}>
                              <HStack spacing={3}>
                                <Box
                                  w={3}
                                  h={3}
                                  borderRadius="full"
                                  bg={`${getSeverityColor(stat.severity)}.500`}
                                />
                                <Badge
                                  px={3}
                                  py={1}
                                  borderRadius="full"
                                  fontSize="xs"
                                  fontWeight="bold"
                                  bg={`${getSeverityColor(stat.severity)}.100`}
                                  color={`${getSeverityColor(stat.severity)}.700`}
                                  border="1px solid"
                                  borderColor={`${getSeverityColor(stat.severity)}.200`}
                                >
                                  {stat.severity}
                                </Badge>
                              </HStack>
                              <Text fontWeight="bold" fontSize="lg" color={useColorModeValue('gray.800', 'white')}>
                                {stat.count}
                              </Text>
                            </Flex>
                            <Box
                              w="100%"
                              h={2}
                              bg={useColorModeValue('gray.200', 'gray.600')}
                              borderRadius="full"
                              overflow="hidden"
                            >
                              <Box
                                h="100%"
                                bg={`${getSeverityColor(stat.severity)}.500`}
                                borderRadius="full"
                                width={`${(stat.count / Math.max(...stats.severityStats.map(s => s.count))) * 100}%`}
                                transition="width 0.3s ease"
                              />
                            </Box>
                          </Box>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Statistici pe tip */}
                  <Card 
                    bg={useColorModeValue('white', 'gray.800')}
                    border="1px solid" 
                    borderColor={useColorModeValue('gray.200', 'gray.700')}
                    borderRadius="xl"
                    overflow="hidden"
                  >
                    <CardHeader bg={useColorModeValue('gray.50', 'gray.700')}>
                      <HStack spacing={3}>
                        <Box
                          p={2}
                          bg="blue.100"
                          borderRadius="lg"
                          color="blue.600"
                        >
                          <FiBarChart size={20} />
                        </Box>
                        <Text fontWeight="bold" fontSize="lg">Alerte pe Tip</Text>
                      </HStack>
                    </CardHeader>
                    <CardBody p={6}>
                      <VStack spacing={4} align="stretch">
                        {stats.typeStats.map((stat) => (
                          <Box
                            key={stat.entity_type}
                            p={4}
                            borderRadius="lg"
                            bg={useColorModeValue('gray.50', 'gray.700')}
                            border="1px solid"
                            borderColor={useColorModeValue('gray.200', 'gray.600')}
                          >
                            <Flex justify="space-between" align="center" mb={2}>
                              <HStack spacing={3}>
                                <Box
                                  w={3}
                                  h={3}
                                  borderRadius="full"
                                  bg="blue.500"
                                />
                                <Badge
                                  px={3}
                                  py={1}
                                  borderRadius="full"
                                  fontSize="xs"
                                  fontWeight="bold"
                                  bg="blue.100"
                                  color="blue.700"
                                  border="1px solid"
                                  borderColor="blue.200"
                                >
                                  {stat.entity_type}
                                </Badge>
                              </HStack>
                              <Text fontWeight="bold" fontSize="lg" color={useColorModeValue('gray.800', 'white')}>
                                {stat.count}
                              </Text>
                            </Flex>
                            <Box
                              w="100%"
                              h={2}
                              bg={useColorModeValue('gray.200', 'gray.600')}
                              borderRadius="full"
                              overflow="hidden"
                            >
                              <Box
                                h="100%"
                                bg="blue.500"
                                borderRadius="full"
                                width={`${(stat.count / Math.max(...stats.typeStats.map(s => s.count))) * 100}%`}
                                transition="width 0.3s ease"
                              />
                            </Box>
                          </Box>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modal modern pentru detalii alertă */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        size="xl"
        motionPreset="slideInBottom"
        isCentered
      >
        <ModalOverlay 
          backdropFilter="blur(20px)" 
          bg="blackAlpha.700" 
        />
        <ModalContent
          borderRadius="3xl"
          border="none"
          shadow="2xl"
          overflow="hidden"
          mx={4}
          bg={useColorModeValue('white', 'gray.800')}
          maxW="600px"
        >
          {/* Header cu gradient */}
          <Box
            bgGradient={useColorModeValue(
              'linear(135deg, red.500, orange.600)',
              'linear(135deg, red.600, orange.700)'
            )}
            color="white"
            p={8}
            position="relative"
            overflow="hidden"
          >
            {/* Background pattern */}
            <Box
              position="absolute"
              top={-10}
              right={-10}
              w="100px"
              h="100px"
              bg="whiteAlpha.200"
              borderRadius="full"
              backdropFilter="blur(10px)"
            />
            <Box
              position="absolute"
              bottom={-20}
              left={-20}
              w="150px"
              h="150px"
              bg="whiteAlpha.100"
              borderRadius="full"
            />
            
            <HStack spacing={4} position="relative" zIndex={1}>
              <Box
                bg="whiteAlpha.200"
                p={4}
                borderRadius="2xl"
                backdropFilter="blur(10px)"
              >
                <FiAlertTriangle size={32} />
              </Box>
              <VStack align="start" spacing={1}>
                <Text fontSize="2xl" fontWeight="bold">
                  Detalii Alertă
                </Text>
                <Text fontSize="md" opacity={0.9}>
                  Informații complete despre alertă
                </Text>
              </VStack>
            </HStack>
          </Box>
          
          <ModalCloseButton 
            color="white" 
            bg="whiteAlpha.200"
            borderRadius="full"
            size="lg"
            top={6}
            right={6}
            _hover={{ bg: 'whiteAlpha.300' }}
          />
          
          <ModalBody p={8}>
            {selectedAlert && (
              <VStack spacing={6} align="stretch">
                {/* Titlu și mesaj */}
                <Box>
                  <Text 
                    fontWeight="bold" 
                    fontSize="xl" 
                    color={useColorModeValue('gray.800', 'white')}
                    mb={3}
                  >
                    {normalizeText(selectedAlert.title)}
                  </Text>
                  <Text 
                    color={useColorModeValue('gray.600', 'gray.300')} 
                    fontSize="lg"
                    lineHeight="1.6"
                  >
                    {normalizeText(selectedAlert.message)}
                  </Text>
                </Box>

                {/* De unde vine alerta */}
                <Box
                  p={4}
                  bg={useColorModeValue('gray.50', 'gray.700')}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={useColorModeValue('gray.200', 'gray.600')}
                >
                  <Text fontWeight="bold" mb={1}>De unde vine alerta?</Text>
                  <Text fontSize="sm" color={muted}>
                    {(() => {
                      const r = ruleById.get(selectedAlert.rule_id);
                      if (!r) return 'Monitorizare automată a sistemului (regulă internă).';
                      return `${r.name} — ${r.description}`;
                    })()}
                  </Text>
                  <Text fontSize="sm" color={muted} mt={2}>
                    Se verifică automat periodic (de regulă la fiecare 5 minute) și creează o alertă când se îndeplinește condiția.
                  </Text>
                </Box>

                {/* Recomandări */}
                <Box
                  p={4}
                  bg={useColorModeValue('gray.50', 'gray.700')}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={useColorModeValue('gray.200', 'gray.600')}
                >
                  <Text fontWeight="bold" mb={2}>Ce poți face acum</Text>
                  <VStack align="stretch" spacing={1} fontSize="sm" color={useColorModeValue('gray.700', 'gray.200')}>
                    {recommendationsFor(selectedAlert).map((r, idx) => (
                      <Text key={`${idx}-${r}`}>- {r}</Text>
                    ))}
                  </VStack>
                </Box>
                
                {/* Badge-uri moderne */}
                <Flex gap={3} flexWrap="wrap">
                  <Badge
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="bold"
                    textTransform="uppercase"
                    letterSpacing="0.5px"
                    bg={`${getSeverityColor(selectedAlert.severity)}.100`}
                    color={`${getSeverityColor(selectedAlert.severity)}.700`}
                    border="2px solid"
                    borderColor={`${getSeverityColor(selectedAlert.severity)}.200`}
                  >
                    Prioritate: {severityLabel(selectedAlert.severity)}
                  </Badge>
                  <Badge
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="bold"
                    textTransform="uppercase"
                    letterSpacing="0.5px"
                    bg={`${getStatusColor(selectedAlert.status)}.100`}
                    color={`${getStatusColor(selectedAlert.status)}.700`}
                    border="2px solid"
                    borderColor={`${getStatusColor(selectedAlert.status)}.200`}
                  >
                    {statusLabel(selectedAlert.status)}
                  </Badge>
                  <Badge
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="bold"
                    textTransform="uppercase"
                    letterSpacing="0.5px"
                    bg="blue.100"
                    color="blue.700"
                    border="2px solid"
                    borderColor="blue.200"
                  >
                    {categoryLabel(selectedAlert.entity_type)}
                  </Badge>
                </Flex>
                
                {/* Informații temporale */}
                <Box
                  p={4}
                  bg={useColorModeValue('gray.50', 'gray.700')}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={useColorModeValue('gray.200', 'gray.600')}
                >
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                        <strong>Creată:</strong>
                      </Text>
                      <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('gray.800', 'white')}>
                        {new Date(selectedAlert.created_at).toLocaleString('ro-RO')}
                      </Text>
                    </HStack>
                    {selectedAlert.resolved_at && (
                      <HStack justify="space-between">
                        <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                          <strong>Rezolvată:</strong>
                        </Text>
                        <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('gray.800', 'white')}>
                          {new Date(selectedAlert.resolved_at).toLocaleString('ro-RO')}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          
          <ModalFooter p={8} pt={0}>
            <HStack spacing={4} width="100%">
              <Button 
                variant="ghost" 
                flex={1}
                onClick={onClose}
                size="lg"
                borderRadius="xl"
              >
                Închide
              </Button>
              {selectedAlert?.status === 'ACTIVE' && (
                <Button 
                  colorScheme="green"
                  flex={1}
                  size="lg"
                  borderRadius="xl"
                  bgGradient={useColorModeValue(
                    'linear(135deg, green.500, green.600)',
                    'linear(135deg, green.600, green.700)'
                  )}
                  _hover={{
                    bgGradient: useColorModeValue(
                      'linear(135deg, green.600, green.700)',
                      'linear(135deg, green.700, green.800)'
                    )
                  }}
                  onClick={() => {
                    handleResolveAlert(selectedAlert.id);
                    onClose();
                  }}
                >
                  <HStack spacing={2}>
                    <FiCheckCircle />
                    <Text>Rezolvă Alertă</Text>
                  </HStack>
                </Button>
              )}
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 