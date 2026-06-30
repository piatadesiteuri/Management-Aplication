import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Heading,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Select,
  Checkbox,
  CheckboxGroup,
  Stack,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Badge,
  IconButton,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Spacer,
  InputGroup,
  InputLeftElement,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react';
import { FiBarChart2, FiDownload, FiEye, FiFilter, FiSearch, FiCalendar, FiFileText, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { Pie } from 'react-chartjs-2';
import { ReportsService, ReportTemplate, SavedReport } from '../services/ReportsService';

export default function UserReports() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [params, setParams] = useState<any>({});
  const [reportCustomization, setReportCustomization] = useState({
    includeBasicInfo: true,
    includeMaintenance: true,
    includeFuel: true,
    includeUsage: true,
    includeCosts: true,
    includeAnalysis: true,
    includeCharts: false
  });
  const [exportFormat, setExportFormat] = useState<'CSV' | 'EXCEL' | 'PDF'>('CSV');
  const [selectedSavedReport, setSelectedSavedReport] = useState<SavedReport | null>(null);
  const [showSavedReportModal, setShowSavedReportModal] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Filtre pentru rapoartele salvate
  const [savedReportsFilters, setSavedReportsFilters] = useState({
    searchTerm: '',
    reportType: '',
    dateFrom: '',
    dateTo: '',
    status: ''
  });

  const toast = useToast();

  // 1. Definește template-urile user local
  const userTemplates = [
    {
      id: 'my-events',
      name: 'Evenimentele mele',
      description: 'Toate evenimentele la care ai participat, cu detalii despre rol, status, materiale, vehicul, feedback.',
      popularity: 99,
      estimatedTime: '1-2 minute',
      parameters: [],
      category: 'USER'
    },
    {
      id: 'my-materials',
      name: 'Materiale gestionate de mine',
      description: 'Lista tuturor materialelor/ produselor gestionate de tine în cadrul evenimentelor.',
      popularity: 90,
      estimatedTime: '1 minut',
      parameters: [],
      category: 'USER'
    },
    {
      id: 'my-vehicles',
      name: 'Vehicule utilizate de mine',
      description: 'Toate vehiculele pe care le-ai folosit în evenimente, cu detalii relevante.',
      popularity: 85,
      estimatedTime: '1 minut',
      parameters: [],
      category: 'USER'
    },
    {
      id: 'my-presence',
      name: 'Prezență și activitate',
      description: 'Sumar cu număr evenimente, ore, tipuri, top participări, grafic implicare.',
      popularity: 92,
      estimatedTime: '1 minut',
      parameters: [],
      category: 'USER'
    },
    {
      id: 'my-feedback',
      name: 'Feedback și observații',
      description: 'Evenimente la care ai lăsat feedback sau ai primit observații.',
      popularity: 80,
      estimatedTime: '1 minut',
      parameters: [],
      category: 'USER'
    }
  ];

  useEffect(() => {
    loadTemplates();
    loadSavedReports();
  }, []);

  // Înlocuiește loadTemplates cu varianta care combină userTemplates cu cele din backend
  const loadTemplates = async () => {
    try {
      const templatesData = await ReportsService.getReportTemplates();
      setTemplates([...userTemplates, ...templatesData]);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadSavedReports = async () => {
    try {
      const savedReportsData = await ReportsService.getSavedReports();
      setSavedReports(savedReportsData);
    } catch (error) {
      console.error('Error loading saved reports:', error);
    }
  };

  // Filtrare rapoartele salvate
  const filteredSavedReports = savedReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(savedReportsFilters.searchTerm.toLowerCase()) ||
                         report.template_id.toLowerCase().includes(savedReportsFilters.searchTerm.toLowerCase());
    const matchesType = !savedReportsFilters.reportType || report.template_id === savedReportsFilters.reportType;
    const matchesStatus = !savedReportsFilters.status || report.status === savedReportsFilters.status;
    
    let matchesDate = true;
    if (savedReportsFilters.dateFrom) {
      matchesDate = matchesDate && new Date(report.created_at) >= new Date(savedReportsFilters.dateFrom);
    }
    if (savedReportsFilters.dateTo) {
      matchesDate = matchesDate && new Date(report.created_at) <= new Date(savedReportsFilters.dateTo);
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const renderTemplateCards = () => (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
      {templates.map((template) => (
        <Card key={template.id} bg="gray.800" border="1px solid" borderColor="gray.700" _hover={{ borderColor: 'blue.400', transform: 'translateY(-2px)' }} transition="all 0.2s">
          <CardHeader pb={2}>
            <Flex align="center" justify="space-between">
              <Heading size="md" color="blue.400">{template.name}</Heading>
              <Badge colorScheme="green" variant="subtle">{template.popularity}%</Badge>
            </Flex>
            <Text fontSize="sm" color="gray.400" mt={1}>{template.estimatedTime}</Text>
          </CardHeader>
          <CardBody pt={0}>
            <Text fontSize="sm" color="gray.300" mb={4}>{template.description}</Text>
            <Flex justify="space-between" align="center">
              <Badge colorScheme="blue" variant="outline">{template.category}</Badge>
              <Button
                size="sm"
                colorScheme="blue"
                leftIcon={<FiBarChart2 />}
                onClick={() => {
                  setSelectedTemplate(template);
                  setParams({});
                  setShowModal(true);
                }}
              >
                Generează
              </Button>
            </Flex>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  );

  const renderModal = () => selectedTemplate && (
    <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader borderBottom="1px solid" borderColor="gray.700">
          <Heading size="lg" color="blue.400">{selectedTemplate.name}</Heading>
          <Text fontSize="sm" color="gray.400" mt={1}>{selectedTemplate.description}</Text>
        </ModalHeader>
        <ModalBody py={6}>
          <VStack spacing={6} align="stretch">
            {selectedTemplate.parameters.map((param) => (
              <FormControl key={param.id} isRequired={param.required}>
                <FormLabel>{param.name}</FormLabel>
                {param.type === 'text' && (
                  <Input
                    value={params[param.id] || param.defaultValue || ''}
                    onChange={e => setParams((p: any) => ({ ...p, [param.id]: e.target.value }))}
                    placeholder={`Introduceți ${param.name.toLowerCase()}`}
                    bg="gray.700"
                    borderColor="gray.600"
                    _focus={{ borderColor: 'blue.400' }}
                  />
                )}
                {param.type === 'number' && (
                  <Input
                    type="number"
                    value={params[param.id] || param.defaultValue || ''}
                    onChange={e => setParams((p: any) => ({ ...p, [param.id]: e.target.value }))}
                    placeholder={`Introduceți ${param.name.toLowerCase()}`}
                    bg="gray.700"
                    borderColor="gray.600"
                    _focus={{ borderColor: 'blue.400' }}
                  />
                )}
                {param.type === 'date' && (
                  <Input
                    type="date"
                    value={params[param.id] || param.defaultValue || ''}
                    onChange={e => setParams((p: any) => ({ ...p, [param.id]: e.target.value }))}
                    bg="gray.700"
                    borderColor="gray.600"
                    _focus={{ borderColor: 'blue.400' }}
                  />
                )}
                {param.type === 'select' && (
                  <Select
                    value={params[param.id] || param.defaultValue || ''}
                    onChange={e => setParams((p: any) => ({ ...p, [param.id]: e.target.value }))}
                    placeholder={`Selectați ${param.name.toLowerCase()}`}
                    bg="gray.700"
                    borderColor="gray.600"
                    _focus={{ borderColor: 'blue.400' }}
                  >
                    {param.options?.map((option, index) => {
                      const optionValue = typeof option === 'string' ? option : option.value;
                      const optionLabel = typeof option === 'string' ? option : option.label;
                      return (
                        <option key={`${param.id}-${index}`} value={optionValue}>{optionLabel}</option>
                      );
                    })}
                  </Select>
                )}
                {param.type === 'multiselect' && (
                  <CheckboxGroup
                    value={params[param.id] || []}
                    onChange={(values) => setParams((p: any) => ({ ...p, [param.id]: values }))}
                  >
                    <Stack spacing={2} direction="row">
                      {param.options?.map((option, index) => {
                        const optionValue = typeof option === 'string' ? option : option.value;
                        const optionLabel = typeof option === 'string' ? option : option.label;
                        return (
                          <Checkbox key={`${param.id}-${index}`} value={optionValue}>{optionLabel}</Checkbox>
                        );
                      })}
                    </Stack>
                  </CheckboxGroup>
                )}
              </FormControl>
            ))}
            <Divider />
            <FormControl>
              <FormLabel>Personalizare Raport</FormLabel>
              <VStack align="stretch" spacing={2}>
                <Checkbox isChecked={reportCustomization.includeBasicInfo} onChange={e => setReportCustomization(prev => ({ ...prev, includeBasicInfo: e.target.checked }))} colorScheme="blue">Informații de bază</Checkbox>
                <Checkbox isChecked={reportCustomization.includeMaintenance} onChange={e => setReportCustomization(prev => ({ ...prev, includeMaintenance: e.target.checked }))} colorScheme="orange">Mentenanță / Stoc</Checkbox>
                <Checkbox isChecked={reportCustomization.includeFuel} onChange={e => setReportCustomization(prev => ({ ...prev, includeFuel: e.target.checked }))} colorScheme="green">Combustibil / Vânzări</Checkbox>
                <Checkbox isChecked={reportCustomization.includeUsage} onChange={e => setReportCustomization(prev => ({ ...prev, includeUsage: e.target.checked }))} colorScheme="purple">Utilizare / Participanți</Checkbox>
                <Checkbox isChecked={reportCustomization.includeCosts} onChange={e => setReportCustomization(prev => ({ ...prev, includeCosts: e.target.checked }))} colorScheme="red">Costuri / Statistici</Checkbox>
                <Checkbox isChecked={reportCustomization.includeAnalysis} onChange={e => setReportCustomization(prev => ({ ...prev, includeAnalysis: e.target.checked }))} colorScheme="teal">Analize și topuri</Checkbox>
                <Checkbox isChecked={reportCustomization.includeCharts} onChange={e => setReportCustomization(prev => ({ ...prev, includeCharts: e.target.checked }))} colorScheme="cyan" isDisabled={exportFormat === 'CSV'}>Grafice și vizualizări (doar PDF/Excel)</Checkbox>
              </VStack>
            </FormControl>
            <Divider />
            <FormControl>
              <FormLabel>Format Export</FormLabel>
              <Select value={exportFormat} onChange={e => setExportFormat(e.target.value as any)} bg="gray.700" borderColor="gray.600" _focus={{ borderColor: 'blue.400' }}>
                <option value="CSV">CSV (Excel compatibil)</option>
                <option value="EXCEL">Excel (.xlsx)</option>
                <option value="PDF">PDF (în dezvoltare)</option>
              </Select>
              <Text fontSize="xs" color="gray.400" mt={1}>
                {exportFormat === 'CSV' && 'Fișier CSV optimizat pentru Excel cu encoding UTF-8'}
                {exportFormat === 'EXCEL' && 'Fișier Excel nativ cu formatare avansată'}
                {exportFormat === 'PDF' && 'Fișier PDF cu design profesional (în dezvoltare)'}
              </Text>
            </FormControl>
            <Alert status="info" borderRadius="lg">
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">Timp estimat de generare</AlertTitle>
                <AlertDescription fontSize="sm">{selectedTemplate.estimatedTime} • Format: {exportFormat}</AlertDescription>
              </Box>
            </Alert>
          </VStack>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={() => setShowModal(false)}>Anulează</Button>
          <Button colorScheme="blue" onClick={handleGenerateReport} isLoading={generating} leftIcon={<FiBarChart2 />}>Generează Raport</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return;
    
    // Validare parametri obligatorii
    const missingRequired = selectedTemplate.parameters.filter(param => param.required && !params[param.id]).map(param => param.name);
    if (missingRequired.length > 0) {
      toast({ title: 'Parametri lipsă', description: `Completați: ${missingRequired.join(', ')}`, status: 'error' });
      return;
    }
    
    setGenerating(true);
    try {
      let reportData: any = null;
      if (selectedTemplate.id === 'my-events') {
        reportData = await ReportsService.getMyEvents({ ...params, customization: reportCustomization });
      } else if (selectedTemplate.id === 'my-materials') {
        reportData = await ReportsService.getMyMaterials({ ...params, customization: reportCustomization });
      } else if (selectedTemplate.id === 'my-vehicles') {
        reportData = await ReportsService.getMyVehicles({ ...params, customization: reportCustomization });
      } else if (selectedTemplate.id === 'my-presence') {
        reportData = await ReportsService.getMyPresenceSummary({ ...params, customization: reportCustomization });
      } else if (selectedTemplate.id === 'my-feedback') {
        reportData = await ReportsService.getMyFeedback({ ...params, customization: reportCustomization });
      } else if (selectedTemplate.id === 'product-sales-analysis') {
        reportData = await ReportsService.generateProductSalesAnalysis({ ...params, customization: reportCustomization });
      } else if (selectedTemplate.id === 'vehicle-maintenance-analysis') {
        reportData = await ReportsService.generateVehicleMaintenanceAnalysis({ ...params, customization: reportCustomization });
      } else if (selectedTemplate.id === 'vehicle-usage-analysis') {
        reportData = await ReportsService.generateVehicleUsageAnalysis({ ...params, customization: reportCustomization });
      } else if (selectedTemplate.id === 'events-activity-analysis') {
        reportData = await ReportsService.generateEventsActivityAnalysis({ ...params, customization: reportCustomization });
      }
      
      if (reportData) {
        // Salvare automată în baza de date
        const savedReport = await ReportsService.saveReport({
          templateId: selectedTemplate.id,
          name: selectedTemplate.name,
          data: reportData,
          parameters: params,
          customization: reportCustomization,
          exportFormat: exportFormat
        });
        
        // Actualizare lista rapoarte salvate
        await loadSavedReports();
        
        // Adăugare în lista locală pentru afișare imediată
        setReports(prev => [
          ...prev,
          {
            id: savedReport.id,
            name: selectedTemplate.name,
            type: selectedTemplate.name,
            status: 'COMPLETED',
            createdAt: new Date().toISOString().slice(0, 10),
            data: reportData,
            templateId: selectedTemplate.id,
            params,
            exportFormat,
            reportCustomization
          }
        ]);
        
        toast({ title: 'Raport generat și salvat cu succes!', status: 'success' });
        setShowModal(false);
        
        // Treci la tab-ul cu rapoartele salvate
        setActiveTab(1);
      }
    } catch (e: any) {
      toast({ title: 'Eroare la generare', description: e?.message, status: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  // 2. Modifică handleDownload pentru a încărca detaliile dacă lipsesc datele
  const handleDownload = async (report: any) => {
    let reportData = report.data;
    if (!reportData && report.id) {
      // Încărcăm detaliile raportului din backend
      try {
        const details = await ReportsService.getSavedReportDetails(report.id);
        reportData = details.data;
      } catch (error) {
        toast({ title: 'Eroare la încărcarea datelor raportului', status: 'error' });
        return;
      }
    }
    if (!reportData) {
      toast({ title: 'Raportul nu este încă generat!', status: 'warning' });
      return;
    }
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        toast({ title: 'Eroare autentificare', description: 'Nu sunteți autentificat.', status: 'error' });
        return;
      }
      const requestBody = {
        data: reportData,
        format: report.exportFormat || report.export_format || 'CSV',
        reportType: reportData?.reportType || report.templateId || report.template_id || 'UNKNOWN'
      };
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `${report.name || 'Raport'}-${new Date().toISOString().split('T')[0]}.csv`;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast({ title: 'Export realizat cu succes!', status: 'success' });
      } else {
        throw new Error('Eroare la export');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Eroare la export', description: 'Nu s-a putut descărca raportul.', status: 'error' });
    }
  };

  const handleViewSavedReport = async (reportId: number) => {
    try {
      const reportDetails = await ReportsService.getSavedReportDetails(reportId);
      setSelectedSavedReport(reportDetails);
      setShowSavedReportModal(true);
    } catch (error) {
      toast({ title: 'Eroare', description: 'Nu s-a putut încărca detaliile raportului.', status: 'error' });
    }
  };

  const renderSavedReportsTab = () => (
    <VStack spacing={6} align="stretch">
      {/* Filtre */}
      <Card bg="gray.800" border="1px solid" borderColor="gray.700">
        <CardHeader>
          <Flex align="center" gap={2}>
            <FiFilter />
            <Text fontWeight="bold">Filtre Rapoarte</Text>
          </Flex>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm">Căutare</FormLabel>
              <InputGroup>
                <InputLeftElement><FiSearch /></InputLeftElement>
                <Input
                  placeholder="Caută după nume sau tip..."
                  value={savedReportsFilters.searchTerm}
                  onChange={e => setSavedReportsFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  bg="gray.700"
                  borderColor="gray.600"
                  _focus={{ borderColor: 'blue.400' }}
                />
              </InputGroup>
            </FormControl>
            
            <FormControl>
              <FormLabel fontSize="sm">Tip Raport</FormLabel>
              <Select
                value={savedReportsFilters.reportType}
                onChange={e => setSavedReportsFilters(prev => ({ ...prev, reportType: e.target.value }))}
                placeholder="Toate tipurile"
                bg="gray.700"
                borderColor="gray.600"
                _focus={{ borderColor: 'blue.400' }}
              >
                {templates.map(template => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel fontSize="sm">Data de la</FormLabel>
              <Input
                type="date"
                value={savedReportsFilters.dateFrom}
                onChange={e => setSavedReportsFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                bg="gray.700"
                borderColor="gray.600"
                _focus={{ borderColor: 'blue.400' }}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel fontSize="sm">Data până la</FormLabel>
              <Input
                type="date"
                value={savedReportsFilters.dateTo}
                onChange={e => setSavedReportsFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                bg="gray.700"
                borderColor="gray.600"
                _focus={{ borderColor: 'blue.400' }}
              />
            </FormControl>
          </SimpleGrid>
          
          <Flex justify="space-between" align="center" mt={4}>
            <Text fontSize="sm" color="gray.400">
              {filteredSavedReports.length} rapoarte găsite
            </Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<FiRefreshCw />}
              onClick={() => setSavedReportsFilters({
                searchTerm: '',
                reportType: '',
                dateFrom: '',
                dateTo: '',
                status: ''
              })}
            >
              Resetează filtrele
            </Button>
          </Flex>
        </CardBody>
      </Card>

      {/* Lista rapoartelor salvate */}
      {filteredSavedReports.length === 0 ? (
        <Card bg="gray.800" border="1px solid" borderColor="gray.700">
          <CardBody textAlign="center" py={12}>
            <FiFileText size={48} color="#718096" />
            <Text mt={4} color="gray.400">
              {savedReportsFilters.searchTerm || savedReportsFilters.reportType || savedReportsFilters.dateFrom || savedReportsFilters.dateTo
                ? 'Nu s-au găsit rapoarte cu filtrele selectate.'
                : 'Nu ai rapoarte salvate încă. Generează primul tău raport!'}
            </Text>
          </CardBody>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {filteredSavedReports.map((report) => (
            <Card key={report.id} bg="gray.800" border="1px solid" borderColor="gray.700" _hover={{ borderColor: 'blue.400' }} transition="all 0.2s">
              <CardHeader pb={2}>
                <Flex align="center" justify="space-between">
                  <Heading size="sm" color="blue.400" noOfLines={1}>{report.name}</Heading>
                  <Badge colorScheme="green" variant="subtle" fontSize="xs">SALVAT</Badge>
                </Flex>
                <Text fontSize="xs" color="gray.400" mt={1}>
                  <FiCalendar style={{ display: 'inline', marginRight: '4px' }} />
                  {new Date(report.created_at).toLocaleDateString('ro-RO')}
                </Text>
              </CardHeader>
              <CardBody pt={0}>
                <Text fontSize="sm" color="gray.300" mb={3} noOfLines={2}>
                  Tip: {templates.find(t => t.id === report.template_id)?.name || report.template_id}
                </Text>
                <Flex justify="space-between" align="center">
                  <Badge colorScheme="blue" variant="outline" fontSize="xs">{report.export_format}</Badge>
                  <HStack spacing={1}>
                    <Tooltip label="Vezi detalii">
                      <IconButton
                        size="sm"
                        variant="ghost"
                        icon={<FiEye />}
                        onClick={() => handleViewSavedReport(report.id)}
                        aria-label="Vezi detalii"
                      />
                    </Tooltip>
                    <Tooltip label="Exportă">
                      <IconButton
                        size="sm"
                        variant="ghost"
                        icon={<FiDownload />}
                        onClick={() => handleDownload({
                          id: report.id,
                          data: report.data,
                          exportFormat: report.export_format,
                          templateId: report.template_id,
                          name: report.name
                        })}
                        aria-label="Exportă"
                      />
                    </Tooltip>
                  </HStack>
                </Flex>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </VStack>
  );

  const renderReportData = (report: SavedReport) => {
    if (!report.data || !report.data.events) {
      return <Text color="gray.400">Nu există date disponibile</Text>;
    }

    const events = report.data.events;
    const summary = report.data.summary;

    return (
      <VStack spacing={6} align="stretch">
        {/* Tabel evenimente */}
        <Box>
          <Heading size="md" mb={4} color="blue.400">Evenimente</Heading>
          <TableContainer>
            <Table variant="simple" size="sm" colorScheme="gray">
              <Thead>
                <Tr bg="gray.600">
                  <Th color="white">ID</Th>
                  <Th color="white">Titlu</Th>
                  <Th color="white">Tip</Th>
                  <Th color="white">Data Început</Th>
                  <Th color="white">Data Sfârșit</Th>
                  <Th color="white">Status</Th>
                  <Th color="white">Rol</Th>
                  <Th color="white">Departament</Th>
                  <Th color="white">Vehicul</Th>
                  <Th color="white">Materiale</Th>
                </Tr>
              </Thead>
              <Tbody>
                {events.map((event: any, index: number) => (
                  <Tr key={index} _hover={{ bg: "gray.600" }}>
                    <Td>{event.id}</Td>
                    <Td fontWeight="semibold">{event.title}</Td>
                    <Td>
                      <Badge colorScheme={
                        event.type === 'MEETING' ? 'blue' :
                        event.type === 'INSPECTION' ? 'purple' :
                        event.type === 'TRAINING' ? 'green' :
                        event.type === 'MAINTENANCE' ? 'orange' :
                        event.type === 'TRAVEL' ? 'cyan' : 'gray'
                      } fontSize="xs">
                        {event.type}
                      </Badge>
                    </Td>
                    <Td fontSize="xs">{new Date(event.start_time).toLocaleString('ro-RO', { 
                      year: 'numeric', 
                      month: '2-digit', 
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</Td>
                    <Td fontSize="xs">{new Date(event.end_time).toLocaleString('ro-RO', { 
                      year: 'numeric', 
                      month: '2-digit', 
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</Td>
                    <Td>
                      <Badge colorScheme={
                        event.status === 'PENDING' ? 'yellow' :
                        event.status === 'PLANNED' ? 'blue' :
                        event.status === 'COMPLETED' ? 'green' : 'gray'
                      } fontSize="xs">
                        {event.status}
                      </Badge>
                    </Td>
                    <Td fontSize="xs">{event.role}</Td>
                    <Td fontSize="xs">{event.department || '-'}</Td>
                    <Td fontSize="xs">{event.vehicle || '-'}</Td>
                    <Td fontSize="xs" maxW="200px" isTruncated>
                      {event.materials || '-'}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        <Divider />

        {/* Sumar statistici */}
        {summary && (
          <Box>
            <Heading size="md" mb={4} color="blue.400">Sumar</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Stat bg="gray.600" p={4} borderRadius="md">
                <StatLabel>Total Evenimente</StatLabel>
                <StatNumber>{summary.totalEvents}</StatNumber>
              </Stat>
              <Stat bg="gray.600" p={4} borderRadius="md">
                <StatLabel>Total Ore</StatLabel>
                <StatNumber>{summary.totalHours?.toFixed(2) || 0} ore</StatNumber>
              </Stat>
              <Stat bg="gray.600" p={4} borderRadius="md">
                <StatLabel>Tipuri Evenimente</StatLabel>
                <VStack align="stretch" spacing={1} mt={2}>
                  {summary.types && Object.entries(summary.types).map(([type, count]: [string, any]) => (
                    <HStack key={type} justify="space-between" fontSize="sm">
                      <Text>{type}:</Text>
                      <Badge>{count}</Badge>
                    </HStack>
                  ))}
                </VStack>
              </Stat>
            </SimpleGrid>
          </Box>
        )}
      </VStack>
    );
  };

  const renderSavedReportModal = () => selectedSavedReport && (
    <Modal isOpen={showSavedReportModal} onClose={() => setShowSavedReportModal(false)} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader borderBottom="1px solid" borderColor="gray.700">
          <Heading size="lg" color="blue.400">{selectedSavedReport.name}</Heading>
          <Text fontSize="sm" color="gray.400" mt={1}>
            Generat la: {new Date(selectedSavedReport.created_at).toLocaleString('ro-RO')}
          </Text>
        </ModalHeader>
        <ModalBody py={6}>
          <VStack spacing={6} align="stretch">
            {/* Informații generale */}
            <Card bg="gray.700" border="1px solid" borderColor="gray.600">
              <CardHeader>
                <Text fontWeight="bold">Informații Raport</Text>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.400">Tip raport:</Text>
                    <Text>{templates.find(t => t.id === selectedSavedReport.template_id)?.name || selectedSavedReport.template_id}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.400">Format export:</Text>
                    <Text>{selectedSavedReport.export_format}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.400">Status:</Text>
                    <Badge colorScheme="green">{selectedSavedReport.status}</Badge>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.400">Mărime date:</Text>
                    <Text>{selectedSavedReport.data_size ? `${selectedSavedReport.data_size} KB` : 'N/A'}</Text>
                  </Box>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Parametri și personalizare */}
            {selectedSavedReport.data?.parameters && (
              <Card bg="gray.700" border="1px solid" borderColor="gray.600">
                <CardHeader>
                  <Text fontWeight="bold">Parametri Generare</Text>
                </CardHeader>
                <CardBody>
                  <Text fontSize="sm" color="gray.300" fontFamily="mono">
                    {JSON.stringify(selectedSavedReport.data.parameters, null, 2)}
                  </Text>
                </CardBody>
              </Card>
            )}

            {/* Date raport */}
            {selectedSavedReport.data && (
              <Card bg="gray.700" border="1px solid" borderColor="gray.600">
                <CardHeader>
                  <Text fontWeight="bold">Date Raport</Text>
                </CardHeader>
                <CardBody>
                  {renderReportData(selectedSavedReport)}
                </CardBody>
              </Card>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowSavedReportModal(false)}>Închide</Button>
          <Button
            colorScheme="blue"
            leftIcon={<FiDownload />}
            onClick={() => {
              handleDownload({
                data: selectedSavedReport.data,
                exportFormat: selectedSavedReport.export_format,
                templateId: selectedSavedReport.template_id,
                name: selectedSavedReport.name
              });
            }}
          >
            Exportă
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  return (
    <Box p={6} bg="gray.900" minH="100vh">
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" color="white" mb={2}>Rapoarte</Heading>
          <Text color="gray.400">Generează și gestionează rapoarte detaliate pentru toate modulele sistemului</Text>
        </Box>

        {/* Tabs */}
        <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" colorScheme="blue">
          <TabList bg="gray.800" borderBottom="1px solid" borderColor="gray.700">
            <Tab _selected={{ bg: 'blue.500', color: 'white' }}>Template-uri Rapoarte</Tab>
            <Tab _selected={{ bg: 'blue.500', color: 'white' }}>Rapoarte Salvate</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              {renderTemplateCards()}
            </TabPanel>
            <TabPanel>
              {renderSavedReportsTab()}
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Modals */}
        {renderModal()}
        {renderSavedReportModal()}
      </VStack>
    </Box>
  );
} 