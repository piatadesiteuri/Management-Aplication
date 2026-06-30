import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Icon,
  useDisclosure,
  useColorModeValue,
  Alert,
  AlertIcon,
  Spinner,
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
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Textarea,
  Divider,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Code,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiPlay,
  FiDownload,
  FiTrash2,
  FiEdit,
  FiMoreVertical,
  FiCalendar,
  FiClock,
  FiFileText,
  FiBarChart,
  FiTrendingUp,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
} from 'react-icons/fi';
import AutomatedReportsService, {
  AutomatedReportType,
  AutomatedReport,
  AutomatedReportDetails,
} from '../services/AutomatedReportsService';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const AutomatedReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('SUPER_ADMIN') || hasRole('ADMIN');

  const [reportTypes, setReportTypes] = useState<AutomatedReportType[]>([]);
  const [reports, setReports] = useState<AutomatedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [selectedReport, setSelectedReport] = useState<AutomatedReportDetails | null>(null);
  const [activeTab, setActiveTab] = useState(0); // 0 = Reports, 1 = Types
  
  const { isOpen: isGenerateOpen, onOpen: onGenerateOpen, onClose: onGenerateClose } = useDisclosure();
  const { isOpen: isReportDetailsOpen, onOpen: onReportDetailsOpen, onClose: onReportDetailsClose } = useDisclosure();
  
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  // Scheduling exists in backend, but UI is intentionally focused on Reports for now.

  // Params for USER_ACTIVITY_SUMMARY
  const [users, setUsers] = useState<Array<{ id: number; label: string; email: string }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [activitySearch, setActivitySearch] = useState('');
  const [showAllActivities, setShowAllActivities] = useState(false);
  
  const toast = useToast();
  const panelBg = useColorModeValue('white', 'gray.800');
  const panelBorder = useColorModeValue('gray.200', 'gray.700');
  const muted = useColorModeValue('gray.600', 'gray.300');
  const subtleBg = useColorModeValue('gray.50', 'gray.900');

  useEffect(() => {
    loadData();
  }, [currentPage]);

  useEffect(() => {
    const needsUsers = isGenerateOpen && isAdmin && selectedReportType === 'USER_ACTIVITY_SUMMARY';
    if (!needsUsers) return;
    if (usersLoading || users.length > 0) return;
    void loadUsers();
  }, [isGenerateOpen, isAdmin, selectedReportType]);

  // Check for report query parameter and open report details
  useEffect(() => {
    const reportIdParam = searchParams.get('report');
    if (reportIdParam && reports.length > 0) {
      // Try to find report by ID (numeric or from reportId string)
      const reportId = parseInt(reportIdParam);
      if (!isNaN(reportId)) {
        const foundReport = reports.find(r => r.id === reportId);
        if (foundReport) {
          handleViewReport(foundReport.id);
          // Switch to "Rapoarte Generate" tab
          setActiveTab(0);
        } else {
          // Report not found in current page, try to load it directly
          loadReportDetails(reportId);
        }
      }
    }
  }, [searchParams, reports]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [typesRes, reportsRes] = await Promise.all([
        AutomatedReportsService.getReportTypes(),
        AutomatedReportsService.getUserReports(currentPage, 10)
      ]);
      
      setReportTypes(typesRes);
      setReports(reportsRes.reports);
      setTotalPages(reportsRes.pagination.pages || 1);
      setTotalReports(Number(reportsRes.pagination.total ?? reportsRes.reports?.length ?? 0));
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca datele',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedReportType) return;
    
    try {
      const params: any = {};
      if (selectedReportType === 'USER_ACTIVITY_SUMMARY' && isAdmin) {
        if (!targetUserId) {
          toast({
            title: 'Selectează utilizatorul',
            description: 'Pentru “Sumar Activitate Personală” (admin) trebuie ales un utilizator.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          return;
        }
        params.targetUserId = Number(targetUserId);
      }

      setGenerating(true);
      await AutomatedReportsService.generateReport(selectedReportType, Object.keys(params).length ? params : undefined);
      toast({
        title: 'Succes',
        description: 'Raportul a fost generat cu succes',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onGenerateClose();
      loadData();
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut genera raportul',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setGenerating(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await api.get('/auth/users');
      const rows = (res.data || []) as any[];
      const mapped = rows
        .filter((u) => u && u.id && u.email)
        .map((u) => {
          const first = String(u.firstName || '').trim();
          const last = String(u.lastName || '').trim();
          const label = `${[first, last].filter(Boolean).join(' ') || u.email} (${u.email})`;
          return { id: Number(u.id), label, email: String(u.email) };
        })
        .sort((a, b) => a.label.localeCompare(b.label, 'ro-RO'));
      setUsers(mapped);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca utilizatorii pentru selecție.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setUsersLoading(false);
    }
  };

  // Schedule actions removed from UI flow (reports-only experience)

  const loadReportDetails = async (reportId: number) => {
    try {
      const details = await AutomatedReportsService.getReportDetails(reportId);
      setSelectedReport(details);
      setActivitySearch('');
      setShowAllActivities(false);
      onReportDetailsOpen();
      setActiveTab(1);
      // curăță query param ca să nu se redeschidă la refresh
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('report');
        return next;
      }, { replace: true });
    } catch (error) {
      console.error('Error loading report details:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca detaliile raportului',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleViewReport = async (reportId: number) => {
    await loadReportDetails(reportId);
  };

  const handleExportReport = async (reportId: number, reportName: string) => {
    try {
      const blob = await AutomatedReportsService.exportReport(reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportName}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Succes',
        description: 'Raportul a fost exportat cu succes',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut exporta raportul',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'DAILY': return 'Zilnic';
      case 'WEEKLY': return 'Săptămânal';
      case 'MONTHLY': return 'Lunar';
      default: return frequency;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'green';
      case 'IN_PROGRESS': return 'blue';
      case 'PENDING': return 'yellow';
      case 'FAILED': return 'red';
      default: return 'gray';
    }
  };

  const getReportTypeDisplayName = (typeCode: string) => {
    // Generated reports use template_id as the type code (e.g. DAILY_EVENTS_SUMMARY)
    const found = reportTypes.find(t => t.type === typeCode);
    return found?.name || typeCode;
  };

  const formatActivityLabel = (actionType?: string) => {
    const key = String(actionType || '').toUpperCase();
    switch (key) {
      case 'LOGIN': return 'Autentificare';
      case 'LOGOUT': return 'Deconectare';
      case 'EVENT_CREATED': return 'Eveniment creat';
      case 'EVENT_UPDATED': return 'Eveniment modificat';
      case 'EVENT_APPROVED': return 'Eveniment aprobat';
      case 'EVENT_REJECTED': return 'Eveniment respins';
      case 'EVENT_DELETED': return 'Eveniment șters';
      case 'EVENT_ASSIGNED': return 'Asignare eveniment';
      case 'ALERT_CREATED': return 'Alertă creată';
      case 'ALERT_RESOLVED': return 'Alertă rezolvată';
      case 'SETTINGS_CHANGED': return 'Setări modificate';
      case 'AUTOMATED_REPORT_GENERATED': return 'Raport generat';
      case 'REPORT_GENERATED': return 'Raport generat';
      case 'USER_UPDATED': return 'Utilizator actualizat';
      case 'SUPPLIER_CREATED': return 'Furnizor adăugat';
      case 'VEHICLE_CREATED': return 'Vehicul adăugat';
      default:
        return key ? 'Activitate' : 'Activitate';
    }
  };

  const formatActivityDescription = (a: any) => {
    const at = String(a?.action_type || '').toUpperCase();
    const entityType = String(a?.entity_type || '').toUpperCase();
    const id = a?.entity_id ?? a?.event_id ?? a?.task_id ?? null;

    // Prefer explicit description if it's already informative
    const desc = String(a?.description || '').trim();
    const isGenericSeed =
      desc === 'Eveniment nou creat' ||
      desc === 'Document încărcat' ||
      desc === 'Task asignat' ||
      desc === 'Utilizator actualizat';

    // Enrich seeded / generic descriptions with joined titles
    if ((entityType === 'EVENT' || at.startsWith('EVENT_')) && a?.event_title) {
      const label =
        at === 'EVENT_CREATED' ? 'Eveniment creat' :
        at === 'EVENT_UPDATED' ? 'Eveniment modificat' :
        at === 'EVENT_DELETED' ? 'Eveniment șters' :
        at === 'EVENT_APPROVED' ? 'Eveniment aprobat' :
        at === 'EVENT_REJECTED' ? 'Eveniment respins' :
        'Eveniment';
      return `${label}: "${a.event_title}"${id ? ` (ID ${id})` : ''}`;
    }

    if ((entityType === 'TASK' || at.startsWith('TASK_')) && a?.task_title) {
      return `Task: "${a.task_title}"${id ? ` (ID ${id})` : ''}`;
    }

    if ((entityType === 'DOCUMENT' || at.includes('DOCUMENT')) && a?.document_title) {
      return `Document: "${a.document_title}"${id ? ` (ID ${id})` : ''}`;
    }

    if (desc && !isGenericSeed) return desc;
    if (desc) return desc; // fallback for generic seed without title
    return formatActivityLabel(a?.action_type);
  };

  const renderReportDetails = (report: AutomatedReportDetails) => {
    const data: any = report.data || {};

    // MONTHLY_DSPD_PERFORMANCE
    if (report.template_id === 'MONTHLY_DSPD_PERFORMANCE') {
      const period = data.period || {};
      const eventMetrics = data.eventMetrics || {};
      const taskMetrics = data.taskMetrics || {};
      const vehicleMetrics = data.vehicleMetrics || {};
      const performanceScore = typeof data.performanceScore === 'number' ? data.performanceScore : 0;

      return (
        <VStack align="stretch" spacing={5}>
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="semibold">Rezumat lunar (în stil referat)</Text>
              <Text fontSize="sm" color={muted}>
                Perioadă: {period.startDate || '—'} → {period.endDate || '—'}
              </Text>
            </Box>
          </Alert>

          <Card>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="bold" mb={2}>1) Scor performanță</Text>
                  <Text>Scor general: <strong>{performanceScore}%</strong></Text>
                  <Text fontSize="sm" color={muted}>
                    (calculat pe baza KPI-urilor operaționale disponibile în sistem)
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>2) Evenimente</Text>
                  <VStack align="stretch" spacing={1}>
                    <Text>- Total evenimente: <strong>{eventMetrics.total_events ?? 0}</strong></Text>
                    <Text>- Evenimente completate: <strong>{eventMetrics.completed_events ?? 0}</strong></Text>
                    <Text>- Inspecții: <strong>{eventMetrics.inspections ?? 0}</strong></Text>
                    <Text>- Controale epidemiologice: <strong>{eventMetrics.epidemiological_controls ?? 0}</strong></Text>
                  </VStack>
                </Box>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>3) Task-uri</Text>
                  <VStack align="stretch" spacing={1}>
                    <Text>- Task-uri totale: <strong>{taskMetrics.total_tasks ?? 0}</strong></Text>
                    <Text>- Task-uri completate: <strong>{taskMetrics.completed_tasks ?? 0}</strong></Text>
                    <Text>- Timp mediu completare: <strong>{taskMetrics.avg_completion_time ?? '—'}</strong></Text>
                  </VStack>
                </Box>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>4) Vehicule</Text>
                  <VStack align="stretch" spacing={1}>
                    <Text>- Total vehicule: <strong>{vehicleMetrics.total_vehicles ?? 0}</strong></Text>
                    <Text>- Vehicule disponibile: <strong>{vehicleMetrics.available_vehicles ?? 0}</strong></Text>
                    <Text>- Vehicule în mentenanță: <strong>{vehicleMetrics.maintenance_vehicles ?? 0}</strong></Text>
                  </VStack>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      );
    }

    // DAILY_EVENTS_SUMMARY
    if (report.template_id === 'DAILY_EVENTS_SUMMARY') {
      const date = data.date || data?.period?.endDate || '—';
      const events: any[] = Array.isArray(data.events) ? data.events : [];
      return (
        <VStack align="stretch" spacing={4}>
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="semibold">Sumar evenimente</Text>
              <Text fontSize="sm" color={muted}>Data raportului: {date}</Text>
            </Box>
          </Alert>
          <Card>
            <CardBody>
              <Text fontWeight="bold" mb={2}>1) Rezumat</Text>
              <Text>- Evenimente găsite: <strong>{events.length}</strong></Text>
              <Text fontSize="sm" color={muted}>Listă (primele 50, în ordine):</Text>
            </CardBody>
          </Card>
          {events.length > 0 ? (
            <Card>
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  {events.slice(0, 50).map((e: any, idx: number) => (
                    <Box key={e.id ?? `${e.title}-${e.start_time}-${idx}`} border="1px" borderColor={panelBorder} borderRadius="md" p={3} bg={subtleBg}>
                      <Text fontWeight="semibold">
                        {idx + 1}. {e.title || '—'}
                      </Text>
                      <Text fontSize="sm" color={muted}>
                        Tip: <strong>{e.type || '—'}</strong> · Interval: <strong>{e.start_time || '—'} → {e.end_time || '—'}</strong>
                      </Text>
                      <HStack mt={2}>
                        <Badge colorScheme="gray">{e.status || '—'}</Badge>
                        {e.department_name && <Badge colorScheme="purple">{e.department_name}</Badge>}
                        {e.priority && <Badge colorScheme={e.priority === 'HIGH' || e.priority === 'URGENT' ? 'red' : 'yellow'}>{e.priority}</Badge>}
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          ) : (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              Nu există evenimente în acest interval.
            </Alert>
          )}
        </VStack>
      );
    }

    // WEEKLY_DEPARTMENT_ACTIVITY
    if (report.template_id === 'WEEKLY_DEPARTMENT_ACTIVITY') {
      const period = data.period || {};
      const department = data.department || '—';
      const events: any[] = Array.isArray(data.events) ? data.events : [];
      const tasks: any[] = Array.isArray(data.tasks) ? data.tasks : [];
      const taskStats = data.taskStatistics || {};
      const eventStats = data.eventStatistics || {};

      return (
        <VStack align="stretch" spacing={5}>
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="semibold">Rezumat săptămânal (în stil referat)</Text>
              <Text fontSize="sm" color={muted}>
                Perioadă: {period.startDate || '—'} → {period.endDate || '—'} · Departament: <strong>{department}</strong>
              </Text>
            </Box>
          </Alert>

          <Card>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="bold" mb={2}>1) Indicatori</Text>
                  <VStack align="stretch" spacing={1}>
                    <Text>- Evenimente: <strong>{eventStats.total ?? events.length ?? 0}</strong></Text>
                    <Text>- Task-uri: <strong>{taskStats.total ?? tasks.length ?? 0}</strong></Text>
                  </VStack>
                </Box>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>2) Statistici task-uri</Text>
                  <VStack align="stretch" spacing={1} fontSize="sm">
                    <Text color={muted}>Pe status / prioritate (dacă există date):</Text>
                    <HStack justify="space-between">
                      <Text fontWeight="semibold" color={muted}>Status</Text>
                      <Text fontWeight="semibold" color={muted}>Număr</Text>
                    </HStack>
                    {taskStats.byStatus && Object.keys(taskStats.byStatus).length > 0 ? (
                      Object.entries(taskStats.byStatus).map(([k, v]) => (
                        <HStack key={k} justify="space-between">
                          <Text>{k}</Text>
                          <Text><strong>{String(v)}</strong></Text>
                        </HStack>
                      ))
                    ) : (
                      <Text color={muted} fontStyle="italic">Nu există task-uri în perioada aceasta.</Text>
                    )}
                  </VStack>
                </Box>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>3) Statistici evenimente</Text>
                  <VStack align="stretch" spacing={1} fontSize="sm">
                    <Text color={muted}>Pe tip / status (dacă există date):</Text>
                    <HStack justify="space-between">
                      <Text fontWeight="semibold" color={muted}>Status</Text>
                      <Text fontWeight="semibold" color={muted}>Număr</Text>
                    </HStack>
                    {eventStats.byStatus && Object.keys(eventStats.byStatus).length > 0 ? (
                      Object.entries(eventStats.byStatus).map(([k, v]) => (
                        <HStack key={k} justify="space-between">
                          <Text>{k}</Text>
                          <Text><strong>{String(v)}</strong></Text>
                        </HStack>
                      ))
                    ) : (
                      <Text color={muted} fontStyle="italic">Nu există evenimente în perioada aceasta.</Text>
                    )}
                  </VStack>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Lists (short) */}
          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
            <Card>
              <CardHeader>
                <Heading size="sm">Evenimente (primele 20)</Heading>
              </CardHeader>
              <CardBody>
                {events.length === 0 ? (
                  <Text color={muted} fontStyle="italic">Nimic în perioada selectată.</Text>
                ) : (
                  <VStack align="stretch" spacing={2}>
                    {events.slice(0, 20).map((e: any, idx: number) => (
                      <Box key={e.id ?? `${e.title}-${idx}`} border="1px" borderColor={panelBorder} borderRadius="md" p={3} bg={subtleBg}>
                        <Text fontWeight="semibold">{idx + 1}. {e.title || '—'}</Text>
                        <Text fontSize="sm" color={muted}>
                          {e.start_time || '—'} → {e.end_time || '—'} · {e.type || '—'}
                        </Text>
                        <HStack mt={2}>
                          <Badge colorScheme="gray">{e.status || '—'}</Badge>
                          {e.department_name && <Badge colorScheme="purple">{e.department_name}</Badge>}
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="sm">Task-uri (primele 20)</Heading>
              </CardHeader>
              <CardBody>
                {tasks.length === 0 ? (
                  <Text color={muted} fontStyle="italic">Nimic în perioada selectată.</Text>
                ) : (
                  <VStack align="stretch" spacing={2}>
                    {tasks.slice(0, 20).map((t: any, idx: number) => (
                      <Box key={t.id ?? `${t.title}-${idx}`} border="1px" borderColor={panelBorder} borderRadius="md" p={3} bg={subtleBg}>
                        <Text fontWeight="semibold">{idx + 1}. {t.title || '—'}</Text>
                        <Text fontSize="sm" color={muted}>
                          Status: <strong>{t.status || '—'}</strong> · Prioritate: <strong>{t.priority || '—'}</strong>
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                )}
              </CardBody>
            </Card>
          </Grid>
        </VStack>
      );
    }

    // LOW_STOCK_ALERT
    if (report.template_id === 'LOW_STOCK_ALERT') {
      const generatedAt = data.generatedAt ? new Date(data.generatedAt).toLocaleString('ro-RO') : '—';
      const products: any[] = Array.isArray(data.products) ? data.products : [];
      const q = activitySearch.trim().toLowerCase();
      const filtered = products.filter((p: any) => {
        if (!q) return true;
        const blob = `${p.name || ''} ${p.code || ''} ${p.category_name || ''} ${p.severity || ''}`.toLowerCase();
        return blob.includes(q);
      });
      const displayed = filtered.slice(0, showAllActivities ? 200 : 30);

      const counts = filtered.reduce(
        (acc: any, p: any) => {
          const s = String(p.severity || '').toUpperCase();
          acc.total++;
          if (s === 'CRITICAL') acc.critical++;
          else if (s === 'HIGH') acc.high++;
          else if (s === 'MEDIUM') acc.medium++;
          else acc.low++;
          if (Number(p.negative_stock_flag) === 1 || Number(p.current_stock_raw) < 0) acc.negative++;
          return acc;
        },
        { total: 0, critical: 0, high: 0, medium: 0, low: 0, negative: 0 }
      );

      const severityColor = (sev: string) => {
        const s = String(sev || '').toUpperCase();
        if (s === 'CRITICAL') return 'red';
        if (s === 'HIGH') return 'orange';
        if (s === 'MEDIUM') return 'yellow';
        return 'gray';
      };
      const severityLabel = (sev: string) => {
        const s = String(sev || '').toUpperCase();
        if (s === 'CRITICAL') return 'CRITIC';
        if (s === 'HIGH') return 'RIDICAT';
        if (s === 'MEDIUM') return 'ATENȚIE';
        return 'OK';
      };

      return (
        <VStack align="stretch" spacing={5}>
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="semibold">Alertă stoc scăzut (din inventar)</Text>
              <Text fontSize="sm" color={muted}>
                Generat la: {generatedAt} · Se afișează produsele unde stocul a coborât sub prag.
              </Text>
            </Box>
          </Alert>

          <Alert status="info" borderRadius="md" variant="left-accent">
            <AlertIcon />
            <Box>
              <Text fontWeight="semibold">Cum citești raportul</Text>
              <Text fontSize="sm" color={muted}>
                <strong>Stoc</strong> = cantitatea curentă din inventar.{' '}
                <strong>Prag minim</strong> = sub acest nivel e critic (risc de lipsă).{' '}
                <strong>Prag reaprovizionare</strong> = când ajungi aici, ar trebui să comanzi.{' '}
                <strong>Cantitate recomandată</strong> = cât lipseste ca să ajungi înapoi la prag (max(prag minim, prag reaprovizionare)).
              </Text>
            </Box>
          </Alert>

          <Grid templateColumns={{ base: '1fr', md: 'repeat(5, 1fr)' }} gap={3}>
            <Card><CardBody><Stat><StatLabel>Total</StatLabel><StatNumber>{counts.total}</StatNumber></Stat></CardBody></Card>
            <Card><CardBody><Stat><StatLabel>Critic</StatLabel><StatNumber>{counts.critical}</StatNumber><StatHelpText color="red.300">stoc ≤ 0</StatHelpText></Stat></CardBody></Card>
            <Card><CardBody><Stat><StatLabel>Prag minim</StatLabel><StatNumber>{counts.high}</StatNumber><StatHelpText color="orange.300">stoc ≤ prag minim</StatHelpText></Stat></CardBody></Card>
            <Card><CardBody><Stat><StatLabel>Reaprovizionare</StatLabel><StatNumber>{counts.medium}</StatNumber><StatHelpText color="yellow.300">stoc ≤ prag reaprov.</StatHelpText></Stat></CardBody></Card>
            <Card><CardBody><Stat><StatLabel>Anomalii</StatLabel><StatNumber>{counts.negative}</StatNumber><StatHelpText color="red.300">stoc negativ (eroare)</StatHelpText></Stat></CardBody></Card>
          </Grid>

          <Card>
            <CardHeader>
              <HStack justify="space-between" align="start">
                <Box>
                  <Heading size="sm">Produse</Heading>
                  <Text fontSize="sm" color={muted}>
                    {filtered.length} rezultate{q ? ' (filtrate)' : ''} · afișez {displayed.length}
                  </Text>
                </Box>
                <Box minW={{ base: '160px', md: '260px' }}>
                  <InputGroup size="sm">
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FiSearch} color={muted} />
                    </InputLeftElement>
                    <Input
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      placeholder="Caută produs/cod/categorie…"
                    />
                  </InputGroup>
                </Box>
              </HStack>
            </CardHeader>
            <CardBody>
              {filtered.length === 0 ? (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  Nu există produse sub prag în acest moment.
                </Alert>
              ) : (
                <Box
                  border="1px"
                  borderColor={panelBorder}
                  borderRadius="md"
                  overflow="hidden"
                  maxH="420px"
                  overflowY="auto"
                  bg={panelBg}
                >
                  <Table size="sm" variant="simple">
                    <Thead position="sticky" top={0} bg={panelBg} zIndex={1}>
                      <Tr>
                        <Th>Produs</Th>
                        <Th>Cod</Th>
                        <Th>Categorie</Th>
                        <Th>
                          <Tooltip label="Cât de urgentă este situația stocului" placement="top" hasArrow>
                            <Text as="span">Nivel</Text>
                          </Tooltip>
                        </Th>
                        <Th isNumeric>
                          <Tooltip label="Cantitatea curentă din inventar" placement="top" hasArrow>
                            <Text as="span">Stoc</Text>
                          </Tooltip>
                        </Th>
                        <Th isNumeric>
                          <Tooltip label="Sub acest prag situația devine critică" placement="top" hasArrow>
                            <Text as="span">Prag minim</Text>
                          </Tooltip>
                        </Th>
                        <Th isNumeric>
                          <Tooltip label="La acest prag ar trebui inițiată reaprovizionarea" placement="top" hasArrow>
                            <Text as="span">Prag reaprov.</Text>
                          </Tooltip>
                        </Th>
                        <Th isNumeric>
                          <Tooltip label="Cantitatea recomandată pentru a reveni la prag" placement="top" hasArrow>
                            <Text as="span">Cantitate recomandată</Text>
                          </Tooltip>
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {displayed.map((p: any) => (
                        <Tr key={p.id}>
                          <Td>
                            <Text fontWeight="semibold" fontSize="sm">{p.name || '—'}</Text>
                            {Number(p.current_stock_raw) < 0 ? (
                              <Text fontSize="xs" color="red.300">
                                Atenție: stoc raw negativ ({String(p.current_stock_raw)})
                              </Text>
                            ) : null}
                          </Td>
                          <Td>{p.code || '—'}</Td>
                          <Td>{p.category_name || '—'}</Td>
                          <Td>
                            <Badge colorScheme={severityColor(p.severity)}>{severityLabel(p.severity)}</Badge>
                          </Td>
                          <Td isNumeric>
                            {String(p.current_stock ?? '—')} {p.unit ? <Text as="span" color={muted} fontSize="xs">{p.unit}</Text> : null}
                          </Td>
                          <Td isNumeric>{String(p.min_stock ?? '—')}</Td>
                          <Td isNumeric>{String(p.reorder_point ?? '—')}</Td>
                          <Td isNumeric>
                            <Text fontWeight="bold">{String(p.suggested_order_qty ?? '—')}</Text>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}

              {filtered.length > 30 && (
                <HStack justify="flex-end" mt={3}>
                  <Button size="sm" variant="outline" onClick={() => setShowAllActivities((v) => !v)}>
                    {showAllActivities ? 'Arată mai puțin' : 'Arată mai multe'}
                  </Button>
                </HStack>
              )}
            </CardBody>
          </Card>
        </VStack>
      );
    }

    // USER_ACTIVITY_SUMMARY
    if (report.template_id === 'USER_ACTIVITY_SUMMARY') {
      const period = data.period || {};
      const scope = data.scope || 'SELF';
      const user = data.user || {};
      const activities: any[] = Array.isArray(data.activities) ? data.activities : [];
      const stats = data.statistics || {};
      const activityStats = stats.activities || {};
      const q = activitySearch.trim().toLowerCase();
      const filteredActivities = activities.filter((a: any) => {
        if (!q) return true;
        const blob = `${a.description || ''} ${a.action_type || ''} ${a.user_name || ''} ${a.user_email || ''}`.toLowerCase();
        return blob.includes(q);
      });
      const maxRows = showAllActivities ? 200 : 30;
      const displayed = filteredActivities.slice(0, maxRows);

      const groupedTopActions = (() => {
        const byType = activityStats.byType || {};
        const entries = Object.entries(byType).map(([k, v]) => ({
          key: String(k),
          label: formatActivityLabel(String(k)),
          count: Number(v) || 0,
        }));
        // group by label (so we don't show technical codes)
        const grouped = entries.reduce((acc: Record<string, number>, e) => {
          acc[e.label] = (acc[e.label] || 0) + e.count;
          return acc;
        }, {});
        return Object.entries(grouped)
          .sort((a, b) => Number(b[1]) - Number(a[1]))
          .slice(0, 6);
      })();

      return (
        <VStack align="stretch" spacing={5}>
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="semibold">
                {scope === 'ALL_USERS' ? 'Activitate utilizatori (admin)' : 'Activitate personală'}
              </Text>
              <Text fontSize="sm" color={muted}>
                Perioadă: {period.startDate || '—'} → {period.endDate || '—'}
                {scope !== 'ALL_USERS' && user?.name ? <> · Utilizator: <strong>{user.name}</strong></> : null}
              </Text>
            </Box>
          </Alert>

          <Card>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <Text fontWeight="bold">1) Rezumat</Text>
                <Text>- Activități înregistrate: <strong>{activityStats.total ?? activities.length ?? 0}</strong></Text>
                {groupedTopActions.length > 0 && (
                  <Box mt={2}>
                    <Text fontWeight="semibold" mb={1}>Cele mai frecvente:</Text>
                    <VStack align="stretch" spacing={1} fontSize="sm">
                      {groupedTopActions.map(([label, count]) => (
                        <HStack key={label} justify="space-between">
                          <Text color={muted}>{label}</Text>
                          <Text><strong>{String(count)}</strong></Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <HStack justify="space-between" align="start">
                <Box>
                  <Heading size="sm">2) Activități</Heading>
                  <Text fontSize="sm" color={muted}>
                    {filteredActivities.length} rezultate{q ? ' (filtrate)' : ''} · afișez {displayed.length}{filteredActivities.length > maxRows ? ` din primele ${maxRows}` : ''}
                  </Text>
                </Box>
                <Box minW={{ base: '160px', md: '240px' }}>
                  <InputGroup size="sm">
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FiSearch} color={muted} />
                    </InputLeftElement>
                    <Input
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      placeholder="Caută în activități…"
                    />
                  </InputGroup>
                </Box>
              </HStack>
            </CardHeader>
            <CardBody>
              {filteredActivities.length === 0 ? (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  Nu există activitate în perioada selectată (sau nu se loghează încă acțiunile relevante).
                </Alert>
              ) : (
                <Box
                  border="1px"
                  borderColor={panelBorder}
                  borderRadius="md"
                  overflow="hidden"
                  maxH="420px"
                  overflowY="auto"
                  bg={panelBg}
                >
                  <Table size="sm" variant="simple">
                    <Thead position="sticky" top={0} bg={panelBg} zIndex={1}>
                      <Tr>
                        {scope === 'ALL_USERS' ? <Th>Utilizator</Th> : null}
                        <Th>Activitate</Th>
                        <Th>Tip</Th>
                        <Th textAlign="right">Dată</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {displayed.map((a: any, idx: number) => (
                        <Tr key={a.id ?? `${a.action_type}-${a.created_at}-${idx}`}>
                          {scope === 'ALL_USERS' ? (
                            <Td>
                              <Text fontSize="sm" fontWeight="semibold">
                                {a.user_name || a.user_email || '—'}
                              </Text>
                            </Td>
                          ) : null}
                          <Td maxW="520px">
                            <Text fontSize="sm" fontWeight="semibold" noOfLines={2}>
                              {formatActivityDescription(a)}
                            </Text>
                          </Td>
                          <Td>
                            <Badge colorScheme="purple">
                              {formatActivityLabel(a.action_type)}
                            </Badge>
                          </Td>
                          <Td textAlign="right" fontSize="sm" color={muted}>
                            {a.created_at ? new Date(a.created_at).toLocaleString('ro-RO') : '—'}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}

              {filteredActivities.length > 30 && (
                <HStack justify="flex-end" mt={3}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAllActivities((v) => !v)}
                  >
                    {showAllActivities ? 'Arată mai puțin' : 'Arată mai multe'}
                  </Button>
                </HStack>
              )}
            </CardBody>
          </Card>
        </VStack>
      );
    }

    // Fallback: show a minimal, readable key-value list (not raw JSON dump)
    const topKeys = Object.keys(data || {}).slice(0, 12);
    return (
      <VStack align="stretch" spacing={3}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="semibold">Detalii raport</Text>
            <Text fontSize="sm" color={muted}>
              Acest tip de raport nu are încă un renderer dedicat. Mai jos sunt câteva câmpuri principale (fără JSON brut).
            </Text>
          </Box>
        </Alert>
        <Card>
          <CardBody>
            <VStack align="stretch" spacing={2} fontSize="sm">
              {topKeys.length === 0 ? (
                <Text color={muted} fontStyle="italic">Nu există date disponibile.</Text>
              ) : (
                topKeys.map((k) => (
                  <HStack key={k} justify="space-between" align="start">
                    <Text fontWeight="semibold" color={muted}>{k}</Text>
                    <Text textAlign="right" maxW="70%">
                      {typeof data[k] === 'object' ? '—' : String(data[k])}
                    </Text>
                  </HStack>
                ))
              )}
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    );
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
            Rapoarte Automate
          </Heading>
          <Text color="gray.600">
            Generează și vizualizează rapoarte utile (cu istoric și export)
          </Text>
        </Box>

        {/* What is this page? */}
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold" mb={1}>
              Ce faci aici (pe scurt)
            </Text>
            <Text color="gray.700">
              <strong>Tipuri de rapoarte</strong> = șabloane standard (nu “AI random”), definite ca să fie comparabile în timp.{' '}
              <strong>Rapoarte generate</strong> = snapshot-uri cu datele la momentul generării (poți vedea și exporta).{' '}
            </Text>
            <Divider my={3} />
            <Text color="gray.700">
              <strong>Flux recomandat:</strong> Tipuri de rapoarte → Generează → Vezi → Exportă
            </Text>
          </Box>
        </Alert>

        {/* Stats Cards */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Tipuri de Rapoarte</StatLabel>
                <StatNumber>{reportTypes.length}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Disponibile
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          {/* Programe: ascuns din UI (păstrat pe backend pentru viitor) */}
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Rapoarte Generate</StatLabel>
                <StatNumber>{totalReports}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Total în istoric
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <HStack spacing={4}>
          <Button
            leftIcon={<Icon as={FiPlus} />}
            colorScheme="blue"
            onClick={onGenerateOpen}
          >
            Generează Raport
          </Button>
        </HStack>

        {/* Tabs */}
        <Tabs variant="enclosed" index={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab>Rapoarte Generate ({totalReports})</Tab>
            <Tab>Tipuri de Rapoarte ({reportTypes.length})</Tab>
          </TabList>

          <TabPanels>
            {/* Generated Reports Tab */}
            <TabPanel>
              <Card>
                <CardHeader>
                  <Heading size="md">Rapoarte Generate</Heading>
                </CardHeader>
                <CardBody>
                  {reports.length === 0 ? (
                    <Alert status="info">
                      <AlertIcon />
                      Nu există rapoarte generate. Generează primul raport pentru a începe.
                    </Alert>
                  ) : (
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Nume</Th>
                          <Th>Tip</Th>
                          <Th>Data Generare</Th>
                          <Th>Status</Th>
                          <Th>Acțiuni</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {reports.map((report) => (
                          <Tr key={report.id}>
                            <Td>{report.name}</Td>
                            <Td>
                              <Badge colorScheme="purple">
                                {getReportTypeDisplayName(report.template_id)}
                              </Badge>
                            </Td>
                            <Td>{new Date(report.created_at).toLocaleString('ro-RO')}</Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(report.status)}>
                                {report.status}
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <IconButton
                                  aria-label="Vezi detalii"
                                  icon={<Icon as={FiFileText} />}
                                  size="sm"
                                  colorScheme="blue"
                                  onClick={() => handleViewReport(report.id)}
                                />
                                <IconButton
                                  aria-label="Exportă"
                                  icon={<Icon as={FiDownload} />}
                                  size="sm"
                                  colorScheme="green"
                                  onClick={() => handleExportReport(report.id, report.name)}
                                />
                                <IconButton
                                  aria-label="Șterge"
                                  icon={<Icon as={FiTrash2} />}
                                  size="sm"
                                  colorScheme="red"
                                  onClick={() => {/* TODO: Implement delete */}}
                                />
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}

                  {/* Pagination */}
                  <Flex mt={4} justify="space-between" align="center">
                    <Text fontSize="sm" color={muted}>
                      Pagina {currentPage} din {totalPages}
                    </Text>
                    <HStack>
                      <Button
                        size="sm"
                        variant="outline"
                        isDisabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        Anterior
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        isDisabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Următor
                      </Button>
                    </HStack>
                  </Flex>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Report Types Tab */}
            <TabPanel>
              <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
                {reportTypes.map((type) => (
                  <Card key={type.type}>
                    <CardHeader>
                      <HStack>
                        <Icon as={FiBarChart} boxSize={6} />
                        <Box>
                          <Heading size="md">{type.name}</Heading>
                          <Text fontSize="sm" color="gray.500">
                            {type.type}
                          </Text>
                        </Box>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <Text mb={4}>{type.description}</Text>
                      <VStack align="start" spacing={2}>
                        <HStack>
                          <Icon as={FiClock} />
                          <Text fontSize="sm">
                            Frecvențe: {type.frequency.join(', ')}
                          </Text>
                        </HStack>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => {
                            setSelectedReportType(type.type);
                            onGenerateOpen();
                          }}
                        >
                          Generează Acum
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </Grid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Generate Report Modal */}
      <Modal
        isOpen={isGenerateOpen}
        onClose={() => {
          setUserQuery('');
          setTargetUserId('');
          onGenerateClose();
        }}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Generează Raport</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {(() => {
              const t = reportTypes.find(rt => rt.type === selectedReportType);
              if (!t) return null;
              return (
                <Alert status="info" borderRadius="md" mb={4}>
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="semibold">{t.name}</Text>
                    <Text fontSize="sm" color={muted}>{t.description}</Text>
                    {Array.isArray(t.includes) && t.includes.length > 0 && (
                      <Box mt={2} fontSize="sm">
                        <Text fontWeight="semibold" mb={1}>Ce include:</Text>
                        <VStack align="start" spacing={0.5}>
                          {t.includes.slice(0, 6).map((it, idx) => (
                            <Text key={`${idx}-${it}`}>- {it}</Text>
                          ))}
                        </VStack>
                      </Box>
                    )}
                    {t.whenToUse && (
                      <Text fontSize="sm" mt={2}><strong>Când îl folosești:</strong> {t.whenToUse}</Text>
                    )}
                  </Box>
                </Alert>
              );
            })()}
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Tip Raport</FormLabel>
                <Select
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  placeholder="Selectează tipul de raport"
                >
                  {reportTypes.map((type) => (
                    <option key={type.type} value={type.type}>
                      {type.name}
                    </option>
                  ))}
                </Select>
                {(() => {
                  const t = reportTypes.find(rt => rt.type === selectedReportType);
                  if (!t) return <Text fontSize="sm" color={muted} mt={2}>Alege un tip ca să vezi descrierea și ce include.</Text>;
                  return (
                    <Text fontSize="sm" color={muted} mt={2}>
                      Frecvență recomandată: <strong>{(t.frequency || []).join(', ') || '—'}</strong>
                    </Text>
                  );
                })()}
              </FormControl>

              {/* Parameters */}
              {selectedReportType === 'USER_ACTIVITY_SUMMARY' ? (
                isAdmin ? (
                  <VStack w="full" spacing={3} align="stretch">
                    <FormControl>
                      <FormLabel>Caută utilizator</FormLabel>
                      <Input
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        placeholder="Nume sau email…"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Utilizator</FormLabel>
                      <Select
                        value={targetUserId}
                        onChange={(e) => setTargetUserId(e.target.value)}
                        placeholder={usersLoading ? 'Se încarcă…' : 'Selectează utilizatorul'}
                        isDisabled={usersLoading}
                      >
                        {users
                          .filter((u) => {
                            const q = userQuery.trim().toLowerCase();
                            if (!q) return true;
                            return u.label.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
                          })
                          .slice(0, 200)
                          .map((u) => (
                            <option key={u.id} value={String(u.id)}>
                              {u.label}
                            </option>
                          ))}
                      </Select>
                      <Text fontSize="xs" color={muted} mt={1}>
                        Se generează raportul doar pentru utilizatorul selectat (nu “toți utilizatorii” by default).
                      </Text>
                    </FormControl>
                  </VStack>
                ) : (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    Se generează pentru contul tău (nu poți selecta alt utilizator).
                  </Alert>
                )
              ) : null}
              
              <HStack spacing={4} w="full">
                <Button
                  colorScheme="blue"
                  onClick={handleGenerateReport}
                  isLoading={generating}
                  loadingText="Se generează..."
                  isDisabled={!selectedReportType}
                >
                  Generează
                </Button>
                <Button
                  onClick={() => {
                    setUserQuery('');
                    setTargetUserId('');
                    onGenerateClose();
                  }}
                >
                  Anulează
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Schedule UI removed (reports-only experience) */}

      {/* Report Details Modal */}
      <Modal isOpen={isReportDetailsOpen} onClose={onReportDetailsClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Icon as={FiFileText} />
              <Text>Detalii Raport: {selectedReport?.name || 'Necunoscut'}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedReport ? (
              <VStack align="stretch" spacing={4}>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={1}>Nume</Text>
                    <Text fontWeight="bold">{selectedReport.name}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={1}>Tip</Text>
                    <Badge colorScheme="purple">{getReportTypeDisplayName(selectedReport.template_id)}</Badge>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={1}>Status</Text>
                    <Badge colorScheme={selectedReport.status === 'COMPLETED' ? 'green' : 'yellow'}>
                      {selectedReport.status}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={1}>Data Generare</Text>
                    <Text>{new Date(selectedReport.created_at).toLocaleString('ro-RO')}</Text>
                  </Box>
                </Grid>

                <Divider />

                <Box>
                  <Text fontSize="sm" color="gray.500" mb={2}>Conținut Raport</Text>
                  {renderReportDetails(selectedReport)}
                </Box>

                {selectedReport.parameters && Object.keys(selectedReport.parameters).length > 0 && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={2}>Parametri</Text>
                      <Text fontSize="sm" color="gray.700">
                        Tip: <strong>{String((selectedReport.parameters as any)?.type || '—')}</strong>
                      </Text>
                    </Box>
                  </>
                )}

                <HStack spacing={4} justify="flex-end" mt={4}>
                  <Button
                    colorScheme="green"
                    leftIcon={<Icon as={FiDownload} />}
                    onClick={() => selectedReport && handleExportReport(selectedReport.id, selectedReport.name)}
                  >
                    Exportă Raport
                  </Button>
                  <Button onClick={onReportDetailsClose}>Închide</Button>
                </HStack>
              </VStack>
            ) : (
              <Spinner />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default AutomatedReportsPage; 