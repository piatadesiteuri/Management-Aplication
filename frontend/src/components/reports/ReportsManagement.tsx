import {
  Box,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Text,
  HStack,
  VStack,
  Icon,
  Badge,
  useColorModeValue,
  Flex,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  useToast,
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
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  FormControl,
  FormLabel,
  Checkbox,
  CheckboxGroup,
  Stack,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Skeleton,
  CircularProgress,
  CircularProgressLabel,
} from '@chakra-ui/react';
import {
  FiFileText,
  FiDownload,
  FiFilter,
  FiSearch,
  FiCalendar,
  FiTruck,
  FiUsers,
  FiDollarSign,
  FiBarChart,
  FiPieChart,
  FiTrendingUp,
  FiActivity,
  FiSettings,
  FiEye,
  FiMail,
  FiPrinter,
  FiShare2,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ReportsService, ReportTemplate as ServiceReportTemplate, GeneratedReport as ServiceGeneratedReport } from '../../services/ReportsService';

interface ReportTemplate extends ServiceReportTemplate {
  icon: any;
  color: string;
  lastGenerated?: string;
}

interface GeneratedReport extends ServiceGeneratedReport {
  fileUrl?: string;
  format: 'PDF' | 'EXCEL' | 'CSV';
  size?: string;
}

// Icon mapping for report categories
const getIconForCategory = (category: string) => {
  switch (category) {
    case 'VEHICLES': return FiTruck;
    case 'FINANCIAL': return FiDollarSign;
    case 'OPERATIONAL': return FiBarChart;
    case 'SUPPLY': return FiActivity;
    case 'USERS': return FiUsers;
    default: return FiFileText;
  }
};

// Color mapping for report categories
const getColorForCategory = (category: string) => {
  switch (category) {
    case 'VEHICLES': return 'blue';
    case 'FINANCIAL': return 'green';
    case 'OPERATIONAL': return 'orange';
    case 'SUPPLY': return 'purple';
    case 'USERS': return 'teal';
    default: return 'gray';
  }
};

export default function ReportsManagement() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [reportParameters, setReportParameters] = useState<Record<string, any>>({});
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState<'PDF' | 'CSV' | 'EXCEL'>('CSV');
  const [reportCustomization, setReportCustomization] = useState({
    includeBasicInfo: true,
    includeMaintenance: true,
    includeFuel: true,
    includeUsage: true,
    includeCosts: true,
    includeAnalysis: true,
    includeCharts: false
  });
  const { user } = useAuth();
  const toast = useToast();

  const {
    isOpen: isGenerateOpen,
    onOpen: onGenerateOpen,
    onClose: onGenerateClose
  } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    loadReportTemplates();
    loadGeneratedReports();
  }, []);

  const loadReportTemplates = async () => {
    try {
      setLoading(true);
      const templates = await ReportsService.getReportTemplates();
      
      // Add UI properties to templates
      const templatesWithUI = templates.map(template => ({
        ...template,
        icon: getIconForCategory(template.category),
        color: getColorForCategory(template.category)
      }));
      
      setReportTemplates(templatesWithUI);
    } catch (error) {
      console.error('Error loading report templates:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca template-urile de rapoarte',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGeneratedReports = async () => {
    // Simulez încărcarea rapoartelor generate
    const mockReports: GeneratedReport[] = [
      {
        id: '1',
        templateId: 'vehicle-fleet-status',
        templateName: 'Status Parc Auto',
        generatedAt: '2024-01-20T10:30:00Z',
        generatedBy: 'Ion Popescu',
        status: 'COMPLETED',
        parameters: { dateRange: '2024-01-01 - 2024-01-20' },
        fileUrl: '/reports/vehicle-fleet-2024-01-20.pdf',
        format: 'PDF',
        size: '2.3 MB',
      },
      {
        id: '2',
        templateId: 'maintenance-costs',
        templateName: 'Costuri Mentenanță',
        generatedAt: '2024-01-19T14:15:00Z',
        generatedBy: 'Maria Ionescu',
        status: 'COMPLETED',
        parameters: { startDate: '2023-12-01', endDate: '2024-01-19' },
        fileUrl: '/reports/maintenance-costs-2024-01-19.xlsx',
        format: 'EXCEL',
        size: '1.8 MB',
      },
      {
        id: '3',
        templateId: 'fuel-efficiency',
        templateName: 'Eficiență Combustibil',
        generatedAt: '2024-01-20T09:00:00Z',
        generatedBy: 'Ion Popescu',
        status: 'GENERATING',
        parameters: { period: 'Ultimele 3 luni' },
        format: 'PDF',
      },
    ];
    setGeneratedReports(mockReports);
  };

  const categories = [
    { value: 'ALL', label: 'Toate Categoriile', icon: FiFileText, color: 'gray' },
    { value: 'VEHICLES', label: 'Parc Auto', icon: FiTruck, color: 'blue' },
    { value: 'SUPPLY', label: 'Stocuri', icon: FiActivity, color: 'purple' },
    { value: 'FINANCIAL', label: 'Financiar', icon: FiDollarSign, color: 'green' },
    { value: 'OPERATIONAL', label: 'Operațional', icon: FiBarChart, color: 'orange' },
    { value: 'USERS', label: 'Utilizatori', icon: FiUsers, color: 'teal' },
  ];

  const filteredTemplates = reportTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'ALL' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleGenerateReport = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setReportParameters({});
    // Reset customization to defaults when changing template
    setReportCustomization({
      includeBasicInfo: true,
      includeMaintenance: true,
      includeFuel: true,
      includeUsage: true,
      includeCosts: true,
      includeAnalysis: true,
      includeCharts: false
    });
    onGenerateOpen();
  };

  const handleParameterChange = (parameterId: string, value: any) => {
    setReportParameters(prev => ({
      ...prev,
      [parameterId]: value,
    }));
  };

  const generateReport = async () => {
    if (!selectedTemplate) return;

    // Validez parametrii obligatorii
    const missingRequired = selectedTemplate.parameters
      .filter(param => param.required && !reportParameters[param.id])
      .map(param => param.name);

    if (missingRequired.length > 0) {
      toast({
        title: 'Parametri lipsă',
        description: `Completați parametrii obligatorii: ${missingRequired.join(', ')}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setGenerating(true);

      let reportData: any = null;

      // Generate actual report based on template
      switch (selectedTemplate.id) {
        case 'product-sales-analysis':
          reportData = await ReportsService.generateProductSalesAnalysis({
            ...reportParameters,
            customization: reportCustomization
          } as any);
          break;
        case 'vehicle-maintenance-analysis':
          reportData = await ReportsService.generateVehicleMaintenanceAnalysis({
            ...reportParameters,
            customization: reportCustomization
          } as any);
          break;
        case 'vehicle-usage-analysis':
          reportData = await ReportsService.generateVehicleUsageAnalysis({
            ...reportParameters,
            customization: reportCustomization
          } as any);
          break;
        case 'events-activity-analysis':
          reportData = await ReportsService.generateEventsActivityAnalysis({
            ...reportParameters,
            customization: reportCustomization
          } as any);
          break;
        default:
          throw new Error('Template de raport necunoscut');
      }

      const newReport: GeneratedReport = {
        id: Date.now().toString(),
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        generatedAt: new Date().toISOString(),
        generatedBy: user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email || 'Utilizator',
        status: 'COMPLETED',
        parameters: reportParameters,
        data: reportData,
        fileUrl: `/reports/${selectedTemplate.id}-${Date.now()}.${exportFormat.toLowerCase()}`,
        format: exportFormat,
        size: '1.5 MB',
      };

      setGeneratedReports(prev => [newReport, ...prev]);

      // Show success message with specific data count
      let dataCount = 0;
      let dataType = 'înregistrări';
      
      if (reportData?.products?.length) {
        dataCount = reportData.products.length;
        dataType = 'produse analizate';
      } else if (reportData?.vehicles?.length) {
        dataCount = reportData.vehicles.length;
        dataType = 'vehicule analizate';
      } else if (reportData?.events?.length) {
        dataCount = reportData.events.length;
        dataType = 'evenimente analizate';
      }

      toast({
        title: 'Raport generat cu succes',
        description: `Raportul "${selectedTemplate.name}" a fost generat cu ${dataCount} ${dataType}. Puteți descărca raportul din lista de rapoarte generate.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Descarcă automat CSV-ul după generare
      try {
        await handleExportReport(newReport, 'CSV');
      } catch (exportError) {
        console.error('❌ Error auto-downloading CSV:', exportError);
        // Nu afișez eroarea pentru că raportul s-a generat cu succes
      }

      onGenerateClose();
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Eroare generare raport',
        description: 'Nu s-a putut genera raportul. Verificați parametrii și încercați din nou.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = (report: GeneratedReport) => {
    toast({
      title: 'Descărcare inițiată',
      description: `Raportul "${report.templateName}" se descarcă...`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleExportReport = async (report: GeneratedReport, format: 'CSV' | 'PDF' = 'CSV') => {
    try {
      console.log('📈 Exporting report:', report.templateName, 'in format:', format);
      console.log('📈 Report data:', report.data);
      
      if (format === 'CSV') {
        // Export CSV direct prin API
        const token = localStorage.getItem('jwt_token');
        console.log('📈 Token found:', !!token);
        
        if (!token) {
          toast({
            title: 'Eroare autentificare',
            description: 'Nu sunteți autentificat. Vă rugăm să vă conectați din nou.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        const requestBody = {
          data: report.data,
          format: 'CSV',
          reportType: report.data?.reportType
        };
        
        console.log('📈 Sending request to /api/reports/export with:', requestBody);

        const response = await fetch('/api/reports/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });

        console.log('📈 Response status:', response.status);
        console.log('📈 Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          // Creez un blob din răspuns și îl descarc
          const blob = await response.blob();
          console.log('📈 Blob created, size:', blob.size);
          
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${report.templateName.replace(/\s+/g, '-')}-${Date.now()}.csv`;
          document.body.appendChild(a);
          console.log('📈 Triggering download for:', a.download);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          toast({
            title: 'Export reușit',
            description: `Raportul "${report.templateName}" a fost exportat în format CSV`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        } else {
          const errorText = await response.text();
          console.error('📈 Response error:', errorText);
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
      } else {
        // Pentru PDF - folosesc serviciul existent
        await ReportsService.exportReport(report.data, format);
        toast({
          title: 'Export PDF',
          description: 'Funcționalitatea PDF va fi disponibilă în curând',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('❌ Error exporting report:', error);
      toast({
        title: 'Eroare export',
        description: error instanceof Error ? error.message : 'Nu s-a putut exporta raportul. Încercați din nou.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'green';
      case 'GENERATING': return 'blue';
      case 'FAILED': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return FiCheckCircle;
      case 'GENERATING': return FiClock;
      case 'FAILED': return FiAlertCircle;
      default: return FiClock;
    }
  };

  return (
    <Box bg={bgColor} p={6} borderRadius="xl" shadow="xl" border="1px solid" borderColor={borderColor}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="start" spacing={1}>
          <Text fontSize="2xl" fontWeight="bold">
            <HStack>
              <Icon as={FiFileText} color="brand.500" />
              <Text>Centru Rapoarte</Text>
            </HStack>
          </Text>
          <Text color={textColor}>
            Generează și gestionează rapoarte detaliate pentru toate modulele sistemului
          </Text>
        </VStack>
      </Flex>

      {/* Statistici rapide */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={6}>
        <Stat p={4} bg={cardBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
          <StatLabel>Rapoarte Generate</StatLabel>
          <StatNumber color="blue.500">
            {loading ? <Skeleton height="40px" /> : generatedReports.length}
          </StatNumber>
          <StatHelpText>În ultima lună</StatHelpText>
        </Stat>
        <Stat p={4} bg={cardBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
          <StatLabel>Template-uri Disponibile</StatLabel>
          <StatNumber color="green.500">
            {loading ? <Skeleton height="40px" /> : reportTemplates.length}
          </StatNumber>
          <StatHelpText>Toate categoriile</StatHelpText>
        </Stat>
        <Stat p={4} bg={cardBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
          <StatLabel>În Procesare</StatLabel>
          <StatNumber color="orange.500">
            {loading ? <Skeleton height="40px" /> : generatedReports.filter(r => r.status === 'GENERATING').length}
          </StatNumber>
          <StatHelpText>Se generează acum</StatHelpText>
        </Stat>
        <Stat p={4} bg={cardBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
          <StatLabel>Cel mai Popular</StatLabel>
          <StatNumber color="purple.500" fontSize="md">
            {loading ? (
              <Skeleton height="20px" />
            ) : (
              reportTemplates.sort((a: ReportTemplate, b: ReportTemplate) => b.popularity - a.popularity)[0]?.name || 'N/A'
            )}
          </StatNumber>
          <StatHelpText>
            {loading ? (
              <Skeleton height="16px" />
            ) : (
              `${reportTemplates.sort((a: ReportTemplate, b: ReportTemplate) => b.popularity - a.popularity)[0]?.popularity || 0}% utilizare`
            )}
          </StatHelpText>
        </Stat>
      </SimpleGrid>

      <Tabs variant="enclosed" colorScheme="brand">
        <TabList>
          <Tab>Template-uri Rapoarte</Tab>
          <Tab>Rapoarte Generate</Tab>
          <Tab>Programări Automate</Tab>
        </TabList>

        <TabPanels>
          {/* Tab Template-uri */}
          <TabPanel p={0} pt={6}>
            {/* Filtre */}
            <Flex gap={4} mb={6} wrap="wrap">
              <InputGroup size="lg" flex={1} minW="300px">
                <InputLeftElement>
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Caută rapoarte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  borderRadius="xl"
                />
              </InputGroup>
              
              <HStack spacing={2} flexWrap="wrap">
                {categories.map(category => (
                  <Button
                    key={category.value}
                    leftIcon={<Icon as={category.icon} />}
                    variant={selectedCategory === category.value ? 'solid' : 'outline'}
                    colorScheme={category.color}
                    size="lg"
                    borderRadius="xl"
                    onClick={() => setSelectedCategory(category.value)}
                  >
                    {category.label}
                  </Button>
                ))}
              </HStack>
            </Flex>

            {/* Grid Template-uri */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {loading ? (
                // Loading skeletons
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} bg={cardBg} border="1px solid" borderColor={borderColor}>
                    <CardHeader pb={2}>
                      <HStack justify="space-between" align="start">
                        <VStack align="start" spacing={1} flex={1}>
                          <HStack>
                            <Skeleton height="20px" width="20px" />
                            <Skeleton height="20px" width="150px" />
                          </HStack>
                          <Skeleton height="16px" width="80px" />
                        </VStack>
                        <VStack align="end" spacing={1}>
                          <Skeleton height="16px" width="60px" />
                          <Skeleton height="12px" width="40px" />
                        </VStack>
                      </HStack>
                    </CardHeader>
                    <CardBody pt={0}>
                      <Skeleton height="16px" width="100%" mb={2} />
                      <Skeleton height="16px" width="80%" mb={4} />
                      <HStack justify="space-between">
                        <Skeleton height="12px" width="60px" />
                        <Skeleton height="32px" width="100px" />
                      </HStack>
                    </CardBody>
                  </Card>
                ))
              ) : (
                filteredTemplates.map((template: ReportTemplate) => (
                  <Card
                    key={template.id}
                    bg={cardBg}
                    border="1px solid"
                    borderColor={borderColor}
                    _hover={{
                      transform: 'translateY(-2px)',
                      shadow: 'lg',
                      borderColor: `${template.color}.300`,
                    }}
                    transition="all 0.2s"
                    cursor="pointer"
                  >
                    <CardHeader pb={2}>
                      <HStack justify="space-between" align="start">
                        <VStack align="start" spacing={1} flex={1}>
                          <HStack>
                            <Icon as={template.icon} color={`${template.color}.500`} size="20px" />
                            <Text fontWeight="semibold" fontSize="lg">
                              {template.name}
                            </Text>
                          </HStack>
                          <Badge colorScheme={template.color} size="sm">
                            {template.category}
                          </Badge>
                        </VStack>
                        <VStack align="end" spacing={1}>
                          <Badge colorScheme="green" variant="subtle">
                            {template.popularity}% popular
                          </Badge>
                          <Text fontSize="xs" color={textColor}>
                            {template.estimatedTime}
                          </Text>
                        </VStack>
                      </HStack>
                    </CardHeader>
                    <CardBody pt={0}>
                      <Text color={textColor} mb={4} fontSize="sm">
                        {template.description}
                      </Text>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color={textColor}>
                          {template.parameters.length} parametri
                        </Text>
                        <Button
                          size="sm"
                          colorScheme={template.color}
                          leftIcon={<FiBarChart />}
                          onClick={() => handleGenerateReport(template)}
                        >
                          Generează
                        </Button>
                      </HStack>
                    </CardBody>
                  </Card>
                ))
              )}
            </SimpleGrid>
          </TabPanel>

          {/* Tab Rapoarte Generate */}
          <TabPanel p={0} pt={6}>
            <Table variant="simple" bg={bgColor} borderRadius="lg" overflow="hidden">
              <Thead bg={cardBg}>
                <Tr>
                  <Th>Raport</Th>
                  <Th>Generat la</Th>
                  <Th>Generat de</Th>
                  <Th>Status</Th>
                  <Th>Format</Th>
                  <Th>Mărime</Th>
                  <Th>Acțiuni</Th>
                </Tr>
              </Thead>
              <Tbody>
                {generatedReports.map(report => {
                  const StatusIcon = getStatusIcon(report.status);
                  return (
                    <Tr key={report.id}>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="semibold">{report.templateName}</Text>
                          <Text fontSize="sm" color={textColor}>
                            ID: {report.id}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {new Date(report.generatedAt).toLocaleString('ro-RO')}
                        </Text>
                      </Td>
                      <Td>{report.generatedBy}</Td>
                      <Td>
                        <Badge
                          colorScheme={getStatusColor(report.status)}
                          variant="subtle"
                          px={2}
                          py={1}
                        >
                          <HStack spacing={1}>
                            <StatusIcon size={12} />
                            <Text>{report.status}</Text>
                          </HStack>
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme="blue" variant="outline">
                          {report.format}
                        </Badge>
                      </Td>
                      <Td>{report.size || '-'}</Td>
                      <Td>
                        <HStack spacing={1}>
                          {report.status === 'COMPLETED' && (
                            <>
                              <IconButton
                                aria-label="Vezi raport"
                                icon={<FiEye />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => {
                                  toast({
                                    title: 'Preview raport',
                                    description: 'Funcționalitatea de preview va fi implementată.',
                                    status: 'info',
                                    duration: 3000,
                                    isClosable: true,
                                  });
                                }}
                              />
                              <IconButton
                                aria-label="Export CSV"
                                icon={<FiDownload />}
                                size="sm"
                                variant="ghost"
                                colorScheme="green"
                                onClick={() => handleExportReport(report, 'CSV')}
                                title="Descarcă în format CSV (Excel)"
                              />
                              <IconButton
                                aria-label="Export PDF"
                                icon={<FiPrinter />}
                                size="sm"
                                variant="ghost"
                                colorScheme="purple"
                                onClick={() => handleExportReport(report, 'PDF')}
                                title="Descarcă în format PDF"
                              />
                              <IconButton
                                aria-label="Trimite email"
                                icon={<FiMail />}
                                size="sm"
                                variant="ghost"
                                colorScheme="orange"
                                onClick={() => {
                                  toast({
                                    title: 'Trimite email',
                                    description: 'Funcționalitatea de email va fi implementată.',
                                    status: 'info',
                                    duration: 3000,
                                    isClosable: true,
                                  });
                                }}
                              />
                            </>
                          )}
                          {report.status === 'GENERATING' && (
                            <Progress size="sm" isIndeterminate colorScheme="blue" w="100px" />
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TabPanel>

          {/* Tab Programări */}
          <TabPanel p={0} pt={6}>
            <Alert status="info" borderRadius="lg">
              <AlertIcon />
              <Box>
                <AlertTitle>Programări Automate</AlertTitle>
                <AlertDescription>
                  Funcționalitatea de programare automată a rapoartelor va fi implementată în următoarea versiune.
                  Veți putea programa rapoarte să se genereze automat zilnic, săptămânal sau lunar.
                </AlertDescription>
              </Box>
            </Alert>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modal Generare Raport */}
      <Modal
        isOpen={isGenerateOpen}
        onClose={onGenerateClose}
        size="2xl"
        motionPreset="slideInBottom"
        key={selectedTemplate?.id} // Force re-render when template changes
      >
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent borderRadius="xl">
          <ModalHeader>
            <HStack>
              <Icon as={selectedTemplate?.icon} color={`${selectedTemplate?.color}.500`} />
              <Text>Generează Raport: {selectedTemplate?.name}</Text>
            </HStack>
          </ModalHeader>
          <ModalBody>
            <VStack spacing={6} align="stretch">
              <Box p={4} bg={cardBg} borderRadius="lg">
                <Text fontSize="sm" color={textColor}>
                  {selectedTemplate?.description}
                </Text>
              </Box>

              {selectedTemplate?.parameters.map(param => (
                <FormControl key={param.id} isRequired={param.required}>
                  <FormLabel>{param.name}</FormLabel>
                  {param.type === 'text' && (
                    <Input
                      value={reportParameters[param.id] || ''}
                      onChange={(e) => handleParameterChange(param.id, e.target.value)}
                      placeholder={`Introduceți ${param.name.toLowerCase()}`}
                    />
                  )}
                  {param.type === 'number' && (
                    <Input
                      type="number"
                      value={reportParameters[param.id] || param.defaultValue || ''}
                      onChange={(e) => handleParameterChange(param.id, Number(e.target.value))}
                      placeholder={`Introduceți ${param.name.toLowerCase()}`}
                    />
                  )}
                  {param.type === 'date' && (
                    <Input
                      type="date"
                      value={reportParameters[param.id] || ''}
                      onChange={(e) => handleParameterChange(param.id, e.target.value)}
                    />
                  )}
                  {param.type === 'select' && (
                    <Select
                      value={reportParameters[param.id] || param.defaultValue || ''}
                      onChange={(e) => handleParameterChange(param.id, e.target.value)}
                      placeholder={`Selectați ${param.name.toLowerCase()}`}
                    >
                      {param.options?.map((option, index) => {
                        const optionValue = typeof option === 'string' ? option : option.value;
                        const optionLabel = typeof option === 'string' ? option : option.label;
                        return (
                          <option key={`${param.id}-${index}`} value={optionValue}>
                            {optionLabel}
                          </option>
                        );
                      })}
                    </Select>
                  )}
                  {param.type === 'multiselect' && (
                    <CheckboxGroup
                      value={reportParameters[param.id] || []}
                      onChange={(values) => handleParameterChange(param.id, values)}
                    >
                      <Stack spacing={2}>
                        {param.options?.map((option, index) => {
                          const optionValue = typeof option === 'string' ? option : option.value;
                          const optionLabel = typeof option === 'string' ? option : option.label;
                          return (
                            <Checkbox key={`${param.id}-${index}`} value={optionValue}>
                              {optionLabel}
                            </Checkbox>
                          );
                        })}
                      </Stack>
                    </CheckboxGroup>
                  )}
                </FormControl>
              ))}

              <Divider />
              
              <FormControl>
                <FormLabel>
                  <HStack>
                    <Icon as={FiSettings} />
                    <Text>Personalizare Raport</Text>
                  </HStack>
                </FormLabel>
                <Text fontSize="sm" color={textColor} mb={3}>
                  Selectează ce informații să fie incluse în raport:
                </Text>
                {/* Debug info */}
                <Text fontSize="xs" color="gray.500" mb={2}>
                  Template selectat: {selectedTemplate?.id}
                </Text>
                <VStack align="stretch" spacing={2}>
                  {selectedTemplate?.id === 'vehicle-maintenance-analysis' && (
                    <>
                      <Checkbox
                        isChecked={reportCustomization.includeBasicInfo}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeBasicInfo: e.target.checked
                        }))}
                        colorScheme="blue"
                      >
                        <HStack>
                          <Icon as={FiTruck} size="16px" />
                          <Text>Informații de bază vehicul (marca, model, an)</Text>
                        </HStack>
                      </Checkbox>
                      
                      <Checkbox
                        isChecked={reportCustomization.includeMaintenance}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeMaintenance: e.target.checked
                        }))}
                        colorScheme="orange"
                      >
                        <HStack>
                          <Icon as={FiSettings} size="16px" />
                          <Text>Mentenanță (costuri, frecvență, tipuri)</Text>
                        </HStack>
                      </Checkbox>
                      
                      <Checkbox
                        isChecked={reportCustomization.includeFuel}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeFuel: e.target.checked
                        }))}
                        colorScheme="green"
                      >
                        <HStack>
                          <Icon as={FiActivity} size="16px" />
                          <Text>Combustibil (consum, costuri, eficiență)</Text>
                        </HStack>
                      </Checkbox>
                      
                      <Checkbox
                        isChecked={reportCustomization.includeUsage}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeUsage: e.target.checked
                        }))}
                        colorScheme="purple"
                      >
                        <HStack>
                          <Icon as={FiTrendingUp} size="16px" />
                          <Text>Utilizare (distanțe, călătorii, șoferi)</Text>
                        </HStack>
                      </Checkbox>
                      
                      <Checkbox
                        isChecked={reportCustomization.includeCosts}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeCosts: e.target.checked
                        }))}
                        colorScheme="red"
                      >
                        <HStack>
                          <Icon as={FiDollarSign} size="16px" />
                          <Text>Costuri totale (operaționale, pe km)</Text>
                        </HStack>
                      </Checkbox>
                    </>
                  )}

                  {selectedTemplate?.id === 'product-sales-analysis' && (
                    <>
                      <Checkbox
                        isChecked={reportCustomization.includeBasicInfo}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeBasicInfo: e.target.checked
                        }))}
                        colorScheme="blue"
                      >
                        <HStack>
                          <Icon as={FiActivity} size="16px" />
                          <Text>Informații de bază produs (nume, cod, preț)</Text>
                        </HStack>
                      </Checkbox>
                      
                      <Checkbox
                        isChecked={reportCustomization.includeMaintenance}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeMaintenance: e.target.checked
                        }))}
                        colorScheme="orange"
                      >
                        <HStack>
                          <Icon as={FiBarChart} size="16px" />
                          <Text>Stoc curent (cantitate, valoare, locație)</Text>
                        </HStack>
                      </Checkbox>
                      
                      <Checkbox
                        isChecked={reportCustomization.includeFuel}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeFuel: e.target.checked
                        }))}
                        colorScheme="green"
                      >
                        <HStack>
                          <Icon as={FiTrendingUp} size="16px" />
                          <Text>Vânzări (cantitate vândută, valoare vânzări)</Text>
                        </HStack>
                      </Checkbox>
                      
                      <Checkbox
                        isChecked={reportCustomization.includeUsage}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeUsage: e.target.checked
                        }))}
                        colorScheme="purple"
                      >
                        <HStack>
                          <Icon as={FiUsers} size="16px" />
                          <Text>Mișcări stoc (intrări, ieșiri, transferuri)</Text>
                        </HStack>
                      </Checkbox>
                      
                      <Checkbox
                        isChecked={reportCustomization.includeCosts}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeCosts: e.target.checked
                        }))}
                        colorScheme="red"
                      >
                        <HStack>
                          <Icon as={FiDollarSign} size="16px" />
                          <Text>Costuri și prețuri (cost unitar, preț vânzare)</Text>
                        </HStack>
                      </Checkbox>
                    </>
                  )}

                  {selectedTemplate?.id === 'vehicle-usage-analysis' && (
                    <>
                      <Checkbox
                        isChecked={reportCustomization.includeBasicInfo}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeBasicInfo: e.target.checked
                        }))}
                        colorScheme="blue"
                      >
                        <HStack>
                          <Icon as={FiTruck} size="16px" />
                          <Text>Informații vehicul (marca, model, kilometraj)</Text>
                        </HStack>
                      </Checkbox>
                      
                      <Checkbox
                        isChecked={reportCustomization.includeMaintenance}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeMaintenance: e.target.checked
                        }))}
                        colorScheme="orange"
                      >
                        <HStack>
                          <Icon as={FiUsers} size="16px" />
                          <Text>Utilizatori (șoferi, rezervări, utilizare)</Text>
                        </HStack>
                      </Checkbox>
                      
                      <Checkbox
                        isChecked={reportCustomization.includeFuel}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeFuel: e.target.checked
                        }))}
                        colorScheme="green"
                      >
                        <HStack>
                          <Icon as={FiTrendingUp} size="16px" />
                          <Text>Distanțe și trasee (km parcurși, rute)</Text>
                        </HStack>
                      </Checkbox>
                      
                      <Checkbox
                        isChecked={reportCustomization.includeUsage}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeUsage: e.target.checked
                        }))}
                        colorScheme="purple"
                      >
                        <HStack>
                          <Icon as={FiCalendar} size="16px" />
                          <Text>Perioade utilizare (date, durate, scopuri)</Text>
                        </HStack>
                      </Checkbox>
                      
                      <Checkbox
                        isChecked={reportCustomization.includeCosts}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeCosts: e.target.checked
                        }))}
                        colorScheme="red"
                      >
                        <HStack>
                          <Icon as={FiActivity} size="16px" />
                          <Text>Eficiență (consum, cost pe km)</Text>
                        </HStack>
                      </Checkbox>
                    </>
                  )}

                  {selectedTemplate?.id === 'events-activity-analysis' && (
                    <>
                      <Checkbox
                        isChecked={reportCustomization.includeBasicInfo}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeBasicInfo: e.target.checked
                        }))}
                        colorScheme="blue"
                      >
                        <HStack>
                          <Icon as={FiCalendar} size="16px" />
                          <Text>Informații eveniment (titlu, descriere, tip)</Text>
                        </HStack>
                      </Checkbox>
                      
                      <Checkbox
                        isChecked={reportCustomization.includeMaintenance}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeMaintenance: e.target.checked
                        }))}
                        colorScheme="orange"
                      >
                        <HStack>
                          <Icon as={FiClock} size="16px" />
                          <Text>Programare (data, ora, durată)</Text>
                        </HStack>
                      </Checkbox>
                      
                      <Checkbox
                        isChecked={reportCustomization.includeFuel}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeFuel: e.target.checked
                        }))}
                        colorScheme="green"
                      >
                        <HStack>
                          <Icon as={FiUsers} size="16px" />
                          <Text>Participanți (organizatori, participanți)</Text>
                        </HStack>
                      </Checkbox>
                      
                      <Checkbox
                        isChecked={reportCustomization.includeUsage}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeUsage: e.target.checked
                        }))}
                        colorScheme="purple"
                      >
                        <HStack>
                          <Icon as={FiTruck} size="16px" />
                          <Text>Vehicule utilizate (mașini, șoferi)</Text>
                        </HStack>
                      </Checkbox>
                      
                      <Checkbox
                        isChecked={reportCustomization.includeCosts}
                        onChange={(e) => setReportCustomization(prev => ({
                          ...prev,
                          includeCosts: e.target.checked
                        }))}
                        colorScheme="red"
                      >
                        <HStack>
                          <Icon as={FiBarChart} size="16px" />
                          <Text>Statistici (frecvență, pattern-uri)</Text>
                        </HStack>
                      </Checkbox>
                    </>
                  )}
                  
                  <Checkbox
                    isChecked={reportCustomization.includeAnalysis}
                    onChange={(e) => setReportCustomization(prev => ({
                      ...prev,
                      includeAnalysis: e.target.checked
                    }))}
                    colorScheme="teal"
                  >
                    <HStack>
                      <Icon as={FiPieChart} size="16px" />
                      <Text>Analize și statistici (comparații, top-uri)</Text>
                    </HStack>
                  </Checkbox>
                  
                  <Checkbox
                    isChecked={reportCustomization.includeCharts}
                    onChange={(e) => setReportCustomization(prev => ({
                      ...prev,
                      includeCharts: e.target.checked
                    }))}
                    colorScheme="cyan"
                    isDisabled={exportFormat === 'CSV'}
                  >
                    <HStack>
                      <Icon as={FiBarChart} size="16px" />
                      <Text>Grafice și vizualizări (doar PDF/Excel)</Text>
                    </HStack>
                  </Checkbox>
                </VStack>
              </FormControl>

              <Divider />

              <FormControl>
                <FormLabel>Format Export</FormLabel>
                <Select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'PDF' | 'CSV' | 'EXCEL')}
                >
                  <option value="CSV">CSV (Excel compatibil)</option>
                  <option value="EXCEL">Excel (.xlsx)</option>
                  <option value="PDF">PDF (în dezvoltare)</option>
                </Select>
                <Text fontSize="xs" color={textColor} mt={1}>
                  {exportFormat === 'CSV' && 'Fișier CSV optimizat pentru Excel cu encoding UTF-8'}
                  {exportFormat === 'EXCEL' && 'Fișier Excel nativ cu formatare avansată'}
                  {exportFormat === 'PDF' && 'Fișier PDF cu design profesional (în dezvoltare)'}
                </Text>
              </FormControl>

              <Alert status="info" borderRadius="lg">
                <AlertIcon />
                <Box>
                  <AlertTitle fontSize="sm">Timp estimat de generare</AlertTitle>
                  <AlertDescription fontSize="sm">
                    {selectedTemplate?.estimatedTime} • Format: {exportFormat}
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="ghost" onClick={onGenerateClose}>
              Anulează
            </Button>
            <Button
              colorScheme="brand"
              onClick={generateReport}
              isLoading={generating}
              loadingText="Se generează..."
              leftIcon={<FiBarChart />}
            >
              Generează Raport
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 