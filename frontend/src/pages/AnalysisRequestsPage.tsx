import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Heading,
  HStack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  VStack,
  Text,
  IconButton,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Checkbox,
  Input,
  FormControl,
  FormLabel,
  Textarea,
  Select,
} from '@chakra-ui/react';
import { FaPlus, FaEye, FaCheck, FaTimes, FaPrint, FaEdit, FaUndo, FaList, FaComment, FaFlask, FaFilePdf, FaUpload } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import CreateAnalysisRequestModal from '../components/lims/CreateAnalysisRequestModal';

type AnalysisRequest = {
  id: number;
  request_number: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_identity: string;
  laboratory_name: string;
  status: string;
  reception_type: string;
  test_count: number;
  created_at: string;
  created_by_first_name: string;
  created_by_last_name: string;
  tests?: any[];
  diagnosis?: string;
  observations?: string;
};

export default function AnalysisRequestsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [requests, setRequests] = useState<AnalysisRequest[]>([]);
  const [receptionRequests, setReceptionRequests] = useState<AnalysisRequest[]>([]);
  const [worklistRequests, setWorklistRequests] = useState<AnalysisRequest[]>([]);
  const [completedRequests, setCompletedRequests] = useState<AnalysisRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<AnalysisRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedTestsForReception, setSelectedTestsForReception] = useState<number[]>([]);
  const [testResults, setTestResults] = useState<Record<number, { value: string; unit?: string; notes?: string; pdfFile?: File }>>({});
  const [showNotes, setShowNotes] = useState<Record<number, boolean>>({});
  const [pdfFiles, setPdfFiles] = useState<Record<number, File | null>>({});

  // Funcție pentru a detecta dacă testul este calitativ (Negativ/Pozitiv)
  const isQualitativeTest = (normalValues: string | undefined): boolean => {
    if (!normalValues) return false;
    const lower = normalValues.toLowerCase();
    return lower.includes('negativ') || lower.includes('pozitiv') || 
           lower.includes('negativ/pozitiv') || lower.includes('pozitiv/negativ') ||
           lower.includes('calitativ') || lower === 'negativ' || lower === 'pozitiv';
  };

  // Funcție pentru a parsea valorile normale și a extrage intervalele
  const parseNormalValues = (normalValues: string): { min?: number; max?: number; text?: string; ranges?: Array<{min: number; max: number}> } | null => {
    if (!normalValues) return null;
    
    // Extrage toate intervalele de tip "min-max" sau "min - max"
    const rangePattern = /(\d+[.,]\d+|\d+)\s*-\s*(\d+[.,]\d+|\d+)/g;
    const ranges: Array<{min: number; max: number}> = [];
    let match;
    
    while ((match = rangePattern.exec(normalValues)) !== null) {
      const min = parseFloat(match[1].replace(',', '.'));
      const max = parseFloat(match[2].replace(',', '.'));
      ranges.push({ min, max });
    }
    
    // Dacă găsește cel puțin un interval, returnează primul pentru validare
    if (ranges.length > 0) {
      return { min: ranges[0].min, max: ranges[0].max, ranges };
    }
    
    // Încearcă pattern "<max"
    const lessThanMatch = normalValues.match(/<\s*(\d+[.,]\d+|\d+)/);
    if (lessThanMatch) {
      const max = parseFloat(lessThanMatch[1].replace(',', '.'));
      return { max };
    }
    
    // Încearcă pattern ">min"
    const greaterThanMatch = normalValues.match(/>\s*(\d+[.,]\d+|\d+)/);
    if (greaterThanMatch) {
      const min = parseFloat(greaterThanMatch[1].replace(',', '.'));
      return { min };
    }
    
    // Dacă nu găsește pattern numeric, returnează textul
    return { text: normalValues };
  };

  // Funcție pentru a determina culoarea bazată pe comparație cu valorile normale
  const getResultColor = (resultValue: string, normalValues: string | undefined): 'green' | 'yellow' | 'red' | 'gray' => {
    if (!resultValue || !normalValues) return 'gray';
    
    const parsed = parseNormalValues(normalValues);
    if (!parsed || parsed.text) return 'gray';
    
    const value = parseFloat(resultValue.replace(',', '.').trim());
    if (isNaN(value)) return 'gray';
    
    // Verifică dacă există mai multe intervale și verifică în toate
    if (parsed.ranges && parsed.ranges.length > 0) {
      let inAnyRange = false;
      let nearAnyRange = false;
      
      for (const range of parsed.ranges) {
        const rangeSize = range.max - range.min;
        const margin = Math.max(rangeSize * 0.1, 0.5); // 10% sau minim 0.5
        
        if (value >= range.min && value <= range.max) {
          inAnyRange = true;
          break;
        } else if (value >= range.min - margin && value <= range.max + margin) {
          nearAnyRange = true;
        }
      }
      
      if (inAnyRange) return 'green';
      if (nearAnyRange) return 'yellow';
      return 'red';
    }
    
    // Logica pentru un singur interval
    if (parsed.min !== undefined && parsed.max !== undefined) {
      const range = parsed.max - parsed.min;
      const margin = Math.max(range * 0.1, 0.5); // 10% sau minim 0.5
      
      if (value >= parsed.min && value <= parsed.max) {
        return 'green'; // În interval normal
      } else if (value >= parsed.min - margin && value <= parsed.max + margin) {
        return 'yellow'; // Aproape de limite
      } else {
        return 'red'; // Mult peste/sub limite
      }
    } else if (parsed.max !== undefined) {
      // Doar maxim (<max)
      if (value <= parsed.max) {
        return 'green';
      } else if (value <= parsed.max * 1.2) {
        return 'yellow';
      } else {
        return 'red';
      }
    } else if (parsed.min !== undefined) {
      // Doar minim (>min)
      if (value >= parsed.min) {
        return 'green';
      } else if (value >= parsed.min * 0.8) {
        return 'yellow';
      } else {
        return 'red';
      }
    }
    
    return 'gray';
  };
  
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isReceptionOpen, onOpen: onReceptionOpen, onClose: onReceptionClose } = useDisclosure();
  const { isOpen: isResultsOpen, onOpen: onResultsOpen, onClose: onResultsClose } = useDisclosure();
  const { isOpen: isApproveOpen, onOpen: onApproveOpen, onClose: onApproveClose } = useDisclosure();
  const { isOpen: isInvalidateOpen, onOpen: onInvalidateOpen, onClose: onInvalidateClose } = useDisclosure();
  const { isOpen: isProtocolOpen, onOpen: onProtocolOpen, onClose: onProtocolClose } = useDisclosure();
  const [pendingAction, setPendingAction] = useState<{ type: 'approve' | 'invalidate'; requestId: number } | null>(null);
  const [selectedProtocolTest, setSelectedProtocolTest] = useState<any>(null);
  const [protocolResults, setProtocolResults] = useState<Record<number, { value: string; unit?: string; notes?: string }>>({});
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const infoBoxBg = useColorModeValue('blue.50', 'blue.900');
  const infoBoxText = useColorModeValue('blue.700', 'blue.100');
  const successBoxBg = useColorModeValue('green.50', 'green.900');
  const successBoxText = useColorModeValue('green.700', 'green.100');

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  const loadAllData = async () => {
    await Promise.all([
      loadRequests(),
      loadReceptionRequests(),
      loadWorklistRequests(),
      loadCompletedRequests(),
      loadApprovedRequests()
    ]);
  };

  const loadRequests = async () => {
    try {
      const response = await api.get('/lims/analysis-requests');
      setRequests(response.data);
    } catch (error: any) {
      console.error('Error loading analysis requests:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca cererile de analize',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReceptionRequests = async () => {
    try {
      // Încarcă cererile DRAFT care nu au recepție sau au reception_type WITHOUT_RECEPTION
      const response = await api.get('/lims/analysis-requests?status=DRAFT');
      const filtered = response.data.filter((req: AnalysisRequest) => 
        req.reception_type === 'WITHOUT_RECEPTION' || !req.reception_type
      );
      setReceptionRequests(filtered);
    } catch (error) {
      console.error('Error loading reception requests:', error);
    }
  };

  const loadWorklistRequests = async () => {
    try {
      // Încarcă cererile RECEIVED sau IN_PROGRESS (pentru lista de lucru)
      const response = await api.get('/lims/analysis-requests');
      const filtered = response.data.filter((req: AnalysisRequest) => 
        req.status === 'RECEIVED' || req.status === 'IN_PROGRESS'
      );
      setWorklistRequests(filtered);
    } catch (error) {
      console.error('Error loading worklist requests:', error);
    }
  };

  const loadCompletedRequests = async () => {
    try {
      const completedResponse = await api.get('/lims/analysis-requests?status=COMPLETED');
      setCompletedRequests(completedResponse.data);
    } catch (error) {
      console.error('Error loading completed requests:', error);
    }
  };

  const loadApprovedRequests = async () => {
    try {
      const approvedResponse = await api.get('/lims/analysis-requests?status=APPROVED');
      setApprovedRequests(approvedResponse.data);
    } catch (error) {
      console.error('Error loading approved requests:', error);
    }
  };

  const handleViewRequest = async (id: number) => {
    try {
      const response = await api.get(`/lims/analysis-requests/${id}`);
      setSelectedRequest(response.data);
      onViewOpen();
    } catch (error: any) {
      console.error('Error loading request:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut încărca cererea de analize',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleReception = async (requestId: number) => {
    try {
      const response = await api.get(`/lims/analysis-requests/${requestId}`);
      setSelectedRequest(response.data);
      setSelectedTestsForReception(response.data.tests.map((t: any) => t.id));
      onReceptionOpen();
    } catch (error) {
      console.error('Error loading request for reception:', error);
    }
  };

  const handleSaveReception = async () => {
    if (!selectedRequest || selectedTestsForReception.length === 0) {
      toast({
        title: 'Eroare',
        description: 'Selectați cel puțin o probă pentru recepție',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await api.post(`/lims/analysis-requests/${selectedRequest.id}/reception`, {
        test_ids: selectedTestsForReception
      });
      
      await api.put(`/lims/analysis-requests/${selectedRequest.id}/status`, {
        status: 'RECEIVED'
      });

      toast({
        title: 'Succes',
        description: 'Recepția probelor a fost salvată',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onReceptionClose();
      loadAllData();
    } catch (error: any) {
      console.error('Error saving reception:', error);
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Nu s-a putut salva recepția',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEnterResults = async (requestId: number) => {
    try {
      const response = await api.get(`/lims/analysis-requests/${requestId}`);
      setSelectedRequest(response.data);
      const initialResults: Record<number, { value: string; unit?: string; notes?: string }> = {};
      const initialShowNotes: Record<number, boolean> = {};
      response.data.tests.forEach((test: any) => {
        initialResults[test.id] = {
          value: test.result_value || '',
          unit: test.result_unit || test.test_unit || '',
          notes: test.notes || ''
        };
        // Afișează automat textarea-ul pentru observații dacă există deja observații
        if (test.notes) {
          initialShowNotes[test.id] = true;
        }
      });
      setTestResults(initialResults);
      setShowNotes(initialShowNotes);
      setPdfFiles({}); // Resetează PDF-urile când se deschide modalul
      onResultsOpen();
    } catch (error) {
      console.error('Error loading request for results:', error);
    }
  };

  const handleSaveResults = async () => {
    if (!selectedRequest) return;

    try {
      // Verifică dacă există PDF-uri de încărcat
      const formData = new FormData();
      
      // Adaugă rezultatele
      const resultsToSend: Record<number, { value: string; unit?: string; notes?: string }> = {};
      Object.keys(testResults).forEach((testId) => {
        const result = testResults[parseInt(testId)];
        resultsToSend[parseInt(testId)] = {
          value: result.value,
          unit: result.unit,
          notes: result.notes
        };
      });
      
      formData.append('results', JSON.stringify(resultsToSend));
      
      // Adaugă PDF-urile dacă există
      Object.keys(pdfFiles).forEach((testId) => {
        const file = pdfFiles[parseInt(testId)];
        if (file) {
          formData.append(`pdf_${testId}`, file);
        }
      });

      // Dacă există PDF-uri, folosește FormData, altfel JSON normal
      if (Object.values(pdfFiles).some(f => f !== null)) {
        await api.post(`/lims/analysis-requests/${selectedRequest.id}/results`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        await api.post(`/lims/analysis-requests/${selectedRequest.id}/results`, {
          results: resultsToSend
        });
      }

      toast({
        title: 'Succes',
        description: 'Rezultatele au fost salvate. Cererea va apărea în "Finalizate/Aprobate" când toate testele sunt completate.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      onResultsClose();
      // Resetează rezultatele și starea pentru observații
      setTestResults({});
      setShowNotes({});
      setPdfFiles({});
      loadAllData();
    } catch (error: any) {
      console.error('Error saving results:', error);
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Nu s-au putut salva rezultatele',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleApproveClick = (requestId: number) => {
    setPendingAction({ type: 'approve', requestId });
    onApproveOpen();
  };

  const handleApprove = async () => {
    if (!pendingAction) return;

    try {
      await api.post(`/lims/analysis-requests/${pendingAction.requestId}/approve`);

      toast({
        title: 'Succes',
        description: 'Rezultatele au fost aprobate cu succes',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onApproveClose();
      setPendingAction(null);
      // Reîncarcă datele pentru a actualiza ambele tab-uri
      await Promise.all([
        loadCompletedRequests(),
        loadApprovedRequests()
      ]);
    } catch (error: any) {
      console.error('Error approving results:', error);
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Nu s-au putut aproba rezultatele',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleInvalidateClick = (requestId: number) => {
    setPendingAction({ type: 'invalidate', requestId });
    onInvalidateOpen();
  };

  const handleInvalidate = async () => {
    if (!pendingAction) return;

    try {
      await api.post(`/lims/analysis-requests/${pendingAction.requestId}/invalidate`);

      await api.put(`/lims/analysis-requests/${pendingAction.requestId}/status`, {
        status: 'RECEIVED'
      });

      toast({
        title: 'Succes',
        description: 'Testele au fost returnate în lista de lucru',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onInvalidateClose();
      setPendingAction(null);
      // Reîncarcă datele pentru a actualiza "Lista de lucru" și "Finalizate"
      await Promise.all([
        loadWorklistRequests(),
        loadCompletedRequests()
      ]);
    } catch (error: any) {
      console.error('Error invalidating results:', error);
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Nu s-au putut invalida rezultatele',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handlePrint = async (requestId: number) => {
    try {
      const response = await api.get(`/lims/analysis-requests/${requestId}`);
      const request = response.data;

      // Generează HTML pentru PDF
      const escapeHtml = (text: string) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };

      const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('ro-RO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Buletin Analize - ${escapeHtml(request.request_number || '')}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      color: #000;
      line-height: 1.4;
      margin: 0;
      padding: 0;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 18px;
      font-weight: bold;
    }
    .header h2 {
      margin: 5px 0;
      font-size: 14px;
      font-weight: normal;
    }
    .info-section {
      margin-bottom: 20px;
    }
    .info-row {
      display: flex;
      margin-bottom: 8px;
    }
    .info-label {
      font-weight: bold;
      width: 150px;
    }
    .info-value {
      flex: 1;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #000;
      font-size: 10px;
      text-align: center;
    }
    .signature-section {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 45%;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #000;
      margin-top: 50px;
      padding-top: 5px;
    }
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>SPITALUL MUNICIPAL BRAȘOV</h1>
    <h2>BULETIN DE ANALIZE MEDICALE</h2>
  </div>

  <div class="info-section">
    <div class="info-row">
      <span class="info-label">Număr cerere:</span>
      <span class="info-value">${escapeHtml(request.request_number || '-')}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Pacient:</span>
      <span class="info-value">${escapeHtml(request.patient_first_name || '')} ${escapeHtml(request.patient_last_name || '')}</span>
    </div>
    ${request.patient_identity ? `
    <div class="info-row">
      <span class="info-label">CNP:</span>
      <span class="info-value">${escapeHtml(request.patient_identity)}</span>
    </div>
    ` : ''}
    <div class="info-row">
      <span class="info-label">Laborator:</span>
      <span class="info-value">${escapeHtml(request.laboratory_name || '-')}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Data cererii:</span>
      <span class="info-value">${formatDate(request.created_at)}</span>
    </div>
    ${request.reception_date ? `
    <div class="info-row">
      <span class="info-label">Data recepției:</span>
      <span class="info-value">${formatDate(request.reception_date)}</span>
    </div>
    ` : ''}
    ${request.observations ? `
    <div class="info-row">
      <span class="info-label">Observații:</span>
      <span class="info-value">${escapeHtml(request.observations)}</span>
    </div>
    ` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 5%;">Nr.</th>
        <th style="width: 25%;">Test</th>
        <th style="width: 15%;">Cod</th>
        <th style="width: 15%;">Tip probă</th>
        <th style="width: 15%;">Rezultat</th>
        <th style="width: 10%;">Unitate</th>
        <th style="width: 15%;">Valori normale</th>
      </tr>
    </thead>
    <tbody>
      ${request.tests && request.tests.map((test: any, index: number) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(test.test_name || '-')}</td>
        <td>${escapeHtml(test.test_code || '-')}</td>
        <td>${escapeHtml(test.sample_type || '-')}</td>
        <td><strong>${escapeHtml(test.result_value || '-')}</strong></td>
        <td>${escapeHtml(test.result_unit || test.test_unit || '-')}</td>
        <td>${escapeHtml(test.test_normal_values || '-')}</td>
      </tr>
      ${test.notes ? `
      <tr>
        <td colspan="7" style="font-size: 10px; font-style: italic;">
          Observații: ${escapeHtml(test.notes)}
        </td>
      </tr>
      ` : ''}
      `).join('') || '<tr><td colspan="7" style="text-align: center;">Nu există teste</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    <p>Document generat automat la data de ${new Date().toLocaleString('ro-RO')}</p>
  </div>

  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-line">
        Asistent laborator
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-line">
        Medic specialist / Șef laborator
      </div>
    </div>
  </div>
</body>
</html>`;

      // Deschide fereastra pentru print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.document.title = `Buletin Analize - ${request.request_number}`;
        
        // Așteaptă încărcarea și apoi deschide dialogul de print
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 250);
      }

      toast({
        title: 'Succes',
        description: 'Buletinul de analize este pregătit pentru tipărire',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error printing bulletin:', error);
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Nu s-a putut genera buletinul de analize',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'gray',
      SUBMITTED: 'blue',
      RECEIVED: 'cyan',
      IN_PROGRESS: 'yellow',
      COMPLETED: 'green',
      APPROVED: 'green',
      CANCELLED: 'red',
    };
    return colors[status] || 'gray';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Ciornă',
      SUBMITTED: 'Trimisă',
      RECEIVED: 'Recepționată',
      IN_PROGRESS: 'În progres',
      COMPLETED: 'Completată',
      APPROVED: 'Aprobată',
      CANCELLED: 'Anulată',
    };
    return labels[status] || status;
  };

  const handleRequestCreated = () => {
    onCreateClose();
    loadAllData();
    toast({
      title: 'Succes',
      description: 'Cererea de analize a fost creată cu succes',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const renderRequestsTable = (requestsList: AnalysisRequest[]) => (
    <TableContainer>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Număr Cerere</Th>
            <Th>Pacient</Th>
            <Th>Laborator</Th>
            <Th>Status</Th>
            <Th>Nr. Teste</Th>
            <Th>Data</Th>
            <Th>Acțiuni</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading ? (
            <Tr>
              <Td colSpan={7} textAlign="center">
                Se încarcă...
              </Td>
            </Tr>
          ) : requestsList.length === 0 ? (
            <Tr>
              <Td colSpan={7} textAlign="center">
                Nu există cereri
              </Td>
            </Tr>
          ) : (
            requestsList.map((request) => (
              <Tr key={request.id}>
                <Td fontWeight="semibold">{request.request_number}</Td>
                <Td>
                  {request.patient_first_name} {request.patient_last_name}
                  <br />
                  <Text fontSize="sm" color="gray.500">
                    {request.patient_identity}
                  </Text>
                </Td>
                <Td>{request.laboratory_name}</Td>
                <Td>
                  <Badge colorScheme={getStatusColor(request.status)}>
                    {getStatusLabel(request.status)}
                  </Badge>
                </Td>
                <Td>{request.test_count}</Td>
                <Td>
                  {new Date(request.created_at).toLocaleString('ro-RO', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <IconButton
                      icon={<FaEye />}
                      aria-label="Vizualizează"
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleViewRequest(request.id)}
                    />
                    {activeTab === 0 && request.status === 'APPROVED' && (
                      <Button
                        leftIcon={<FaPrint />}
                        size="sm"
                        colorScheme="blue"
                        onClick={() => handlePrint(request.id)}
                      >
                        Tipărire Buletin de Analize
                      </Button>
                    )}
                  </HStack>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </TableContainer>
  );

  return (
    <Container maxW="full" py={8}>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">LIMS - Management Probe</Heading>
        <HStack spacing={2}>
          <Button
            leftIcon={<FaList />}
            colorScheme="purple"
            variant="outline"
            onClick={() => {
              // Verifică dacă suntem în /admin sau /user
              const currentPath = window.location.pathname;
              if (currentPath.startsWith('/admin')) {
                navigate('/admin/lims/tests');
              } else {
                navigate('/user/lims/tests');
              }
            }}
          >
            Vezi Toate Testele
          </Button>
          {activeTab === 0 && (
            <Button
              leftIcon={<FaPlus />}
              colorScheme="blue"
              onClick={onCreateOpen}
            >
              Adaugă Cerere
            </Button>
          )}
        </HStack>
      </HStack>

      <Card bg={bgColor} borderColor={borderColor}>
        <CardBody>
          <Tabs variant="enclosed" colorScheme="blue" index={activeTab} onChange={setActiveTab}>
            <TabList>
              <Tab>Cereri de Analize</Tab>
              <Tab>Recepție Probe</Tab>
              <Tab>Lista de Lucru</Tab>
              <Tab>Finalizate</Tab>
              <Tab>Aprobate</Tab>
            </TabList>

            <TabPanels>
              {/* Tab 1: Cereri de Analize */}
              <TabPanel>
                {renderRequestsTable(requests)}
              </TabPanel>

              {/* Tab 2: Recepție Probe */}
              <TabPanel>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Număr Cerere</Th>
                        <Th>Pacient</Th>
                        <Th>Laborator</Th>
                        <Th>Nr. Teste</Th>
                        <Th>Data</Th>
                        <Th>Acțiuni</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {receptionRequests.length === 0 ? (
                        <Tr>
                          <Td colSpan={6} textAlign="center">
                            Nu există cereri de recepționat
                          </Td>
                        </Tr>
                      ) : (
                        receptionRequests.map((request) => (
                          <Tr key={request.id}>
                            <Td fontWeight="semibold">{request.request_number}</Td>
                            <Td>
                              {request.patient_first_name} {request.patient_last_name}
                            </Td>
                            <Td>{request.laboratory_name}</Td>
                            <Td>{request.test_count}</Td>
                            <Td>
                              {new Date(request.created_at).toLocaleString('ro-RO', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                            </Td>
                            <Td>
                              <Button
                                leftIcon={<FaCheck />}
                                size="sm"
                                colorScheme="green"
                                onClick={() => handleReception(request.id)}
                              >
                                Recepție Probă
                              </Button>
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </TabPanel>

              {/* Tab 3: Lista de Lucru */}
              <TabPanel>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Număr Cerere</Th>
                        <Th>Pacient</Th>
                        <Th>Laborator</Th>
                        <Th>Nr. Teste</Th>
                        <Th>Data</Th>
                        <Th>Acțiuni</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {worklistRequests.length === 0 ? (
                        <Tr>
                          <Td colSpan={6} textAlign="center">
                            Nu există cereri în lista de lucru
                          </Td>
                        </Tr>
                      ) : (
                        worklistRequests.map((request) => (
                          <Tr key={request.id}>
                            <Td fontWeight="semibold">{request.request_number}</Td>
                            <Td>
                              {request.patient_first_name} {request.patient_last_name}
                            </Td>
                            <Td>{request.laboratory_name}</Td>
                            <Td>{request.test_count}</Td>
                            <Td>
                              {new Date(request.created_at).toLocaleString('ro-RO', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                            </Td>
                            <Td>
                              <Button
                                leftIcon={<FaEdit />}
                                size="sm"
                                colorScheme="blue"
                                onClick={() => handleEnterResults(request.id)}
                              >
                                Introducere Rezultate
                              </Button>
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </TabPanel>

              {/* Tab 4: Finalizate (pentru aprobare) */}
              <TabPanel>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Număr Cerere</Th>
                        <Th>Pacient</Th>
                        <Th>Laborator</Th>
                        <Th>Nr. Teste</Th>
                        <Th>Data</Th>
                        <Th>Acțiuni</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {completedRequests.length === 0 ? (
                        <Tr>
                          <Td colSpan={6} textAlign="center">
                            Nu există cereri finalizate pentru aprobare
                          </Td>
                        </Tr>
                      ) : (
                        completedRequests.map((request) => (
                          <Tr key={request.id}>
                            <Td fontWeight="semibold">{request.request_number}</Td>
                            <Td>
                              {request.patient_first_name} {request.patient_last_name}
                            </Td>
                            <Td>{request.laboratory_name}</Td>
                            <Td>{request.test_count}</Td>
                            <Td>
                              {new Date(request.created_at).toLocaleString('ro-RO', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <Button
                                  leftIcon={<FaEye />}
                                  size="sm"
                                  colorScheme="purple"
                                  variant="outline"
                                  onClick={() => handleViewRequest(request.id)}
                                >
                                  Vezi Rezultate
                                </Button>
                                <Button
                                  leftIcon={<FaCheck />}
                                  size="sm"
                                  colorScheme="green"
                                  onClick={() => handleApproveClick(request.id)}
                                >
                                  Aprobare Rezultate
                                </Button>
                                <Button
                                  leftIcon={<FaUndo />}
                                  size="sm"
                                  colorScheme="orange"
                                  onClick={() => handleInvalidateClick(request.id)}
                                >
                                  Întoarcere Teste în Lista de Lucru
                                </Button>
                                <Button
                                  leftIcon={<FaPrint />}
                                  size="sm"
                                  colorScheme="blue"
                                  onClick={() => handlePrint(request.id)}
                                >
                                  Tipărire Buletin de Analize
                                </Button>
                              </HStack>
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </TabPanel>

              {/* Tab 5: Aprobate (pentru verificare) */}
              <TabPanel>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Număr Cerere</Th>
                        <Th>Pacient</Th>
                        <Th>Laborator</Th>
                        <Th>Nr. Teste</Th>
                        <Th>Data</Th>
                        <Th>Status</Th>
                        <Th>Acțiuni</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {approvedRequests.length === 0 ? (
                        <Tr>
                          <Td colSpan={7} textAlign="center">
                            Nu există cereri aprobate
                          </Td>
                        </Tr>
                      ) : (
                        approvedRequests.map((request) => (
                          <Tr key={request.id}>
                            <Td fontWeight="semibold">{request.request_number}</Td>
                            <Td>
                              {request.patient_first_name} {request.patient_last_name}
                            </Td>
                            <Td>{request.laboratory_name}</Td>
                            <Td>{request.test_count}</Td>
                            <Td>
                              {new Date(request.created_at).toLocaleString('ro-RO', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                            </Td>
                            <Td>
                              <Badge colorScheme="green" fontSize="sm" px={2} py={1}>
                                ✓ Aprobată
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <Button
                                  leftIcon={<FaEye />}
                                  size="sm"
                                  colorScheme="purple"
                                  variant="outline"
                                  onClick={() => handleViewRequest(request.id)}
                                >
                                  Vezi Rezultate
                                </Button>
                                <Button
                                  leftIcon={<FaPrint />}
                                  size="sm"
                                  colorScheme="blue"
                                  onClick={() => handlePrint(request.id)}
                                >
                                  Tipărire Buletin de Analize
                                </Button>
                              </HStack>
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>

      {/* Modal pentru creare cerere */}
      <CreateAnalysisRequestModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onSuccess={handleRequestCreated}
      />

      {/* Modal pentru vizualizare cerere */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Cerere de Analize: {selectedRequest?.request_number}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
                {selectedRequest && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="semibold" color={textColor}>Pacient:</Text>
                  <Text color={textColor}>
                    {selectedRequest.patient_first_name}{' '}
                    {selectedRequest.patient_last_name} ({selectedRequest.patient_identity})
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" color={textColor}>Laborator:</Text>
                  <Text color={textColor}>{selectedRequest.laboratory_name}</Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" color={textColor}>Status:</Text>
                  <Badge colorScheme={getStatusColor(selectedRequest.status)}>
                    {getStatusLabel(selectedRequest.status)}
                  </Badge>
                </Box>
                {selectedRequest.diagnosis && (
                  <Box>
                    <Text fontWeight="semibold" color={textColor}>Diagnostic:</Text>
                    <Text color={textColor}>{selectedRequest.diagnosis}</Text>
                  </Box>
                )}
                {selectedRequest.observations && (
                  <Box>
                    <Text fontWeight="semibold" color={textColor}>Observații:</Text>
                    <Text color={textColor}>{selectedRequest.observations}</Text>
                  </Box>
                )}
                {selectedRequest.tests && selectedRequest.tests.length > 0 && (
                  <Box>
                    <Text fontWeight="semibold" mb={2} color={textColor}>Teste ({selectedRequest.tests.length}):</Text>
                    <VStack align="stretch" spacing={3}>
                      {selectedRequest.tests.map((test: any) => (
                        <Box key={test.id} p={3} border="1px" borderColor={borderColor} borderRadius="md" bg={cardBg}>
                          <HStack justify="space-between" mb={1}>
                            <Text fontWeight="semibold" fontSize="md" color={textColor}>{test.test_name}</Text>
                            <Badge colorScheme="blue">{test.test_code}</Badge>
                          </HStack>
                          {test.test_description && (
                            <Text fontSize="sm" color={secondaryTextColor} mb={2}>
                              {test.test_description}
                            </Text>
                          )}
                          <HStack spacing={4} fontSize="sm" color={secondaryTextColor}>
                            <Text>
                              <strong style={{ color: textColor }}>Tip probă:</strong> {test.sample_type}
                            </Text>
                            {test.test_unit && (
                              <Text>
                                <strong style={{ color: textColor }}>Unitate:</strong> {test.test_unit}
                              </Text>
                            )}
                            {test.test_duration && (
                              <Text>
                                <strong style={{ color: textColor }}>Durată:</strong> {test.test_duration}h
                              </Text>
                            )}
                          </HStack>
                          {test.test_normal_values && (
                            <Box mt={2} p={2} bg={infoBoxBg} borderRadius="sm" border="1px" borderColor={borderColor}>
                              <Text fontSize="xs" fontWeight="medium" color={infoBoxText}>
                                Valori normale: {test.test_normal_values}
                              </Text>
                            </Box>
                          )}
                          {test.result_value && (
                            <Box mt={2} p={2} bg={successBoxBg} borderRadius="sm" border="1px" borderColor={borderColor}>
                              <Text fontSize="sm" fontWeight="semibold" color={successBoxText}>
                                ✓ Rezultat: {test.result_value} {test.result_unit || test.test_unit || ''}
                              </Text>
                              {test.notes && (
                                <Text fontSize="xs" color={secondaryTextColor} mt={1}>
                                  Observații: {test.notes}
                                </Text>
                              )}
                              {test.result_pdf_path && (
                                <HStack mt={2} spacing={2}>
                                  <FaFilePdf color={useColorModeValue('red.600', 'red.400')} />
                                  <Button
                                    size="xs"
                                    colorScheme="red"
                                    variant="link"
                                    leftIcon={<FaFilePdf />}
                                    onClick={async () => {
                                      try {
                                        const response = await api.get(`/lims/results/${test.id}/pdf`, {
                                          responseType: 'blob'
                                        });
                                        const blob = new Blob([response.data], { type: 'application/pdf' });
                                        const url = window.URL.createObjectURL(blob);
                                        window.open(url, '_blank');
                                      } catch (error) {
                                        console.error('Error loading PDF:', error);
                                        toast({
                                          title: 'Eroare',
                                          description: 'Nu s-a putut încărca PDF-ul',
                                          status: 'error',
                                          duration: 3000,
                                          isClosable: true,
                                        });
                                      }
                                    }}
                                  >
                                    Vezi PDF rezultat
                                  </Button>
                                </HStack>
                              )}
                              {test.completed_at && (
                                <Text fontSize="xs" color={secondaryTextColor} mt={1}>
                                  Completat: {new Date(test.completed_at).toLocaleString('ro-RO', { 
                                    year: 'numeric', 
                                    month: '2-digit', 
                                    day: '2-digit', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </Text>
                              )}
                            </Box>
                          )}
                          {!test.result_value && (
                            <Badge mt={2} colorScheme={test.status === 'PENDING' ? 'gray' : test.status === 'IN_PROGRESS' ? 'yellow' : 'red'}>
                              Status: {test.status === 'PENDING' ? 'În așteptare' : test.status === 'IN_PROGRESS' ? 'În progres' : 'Anulat'}
                            </Badge>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onViewClose}>Închide</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal pentru recepție probe */}
      <Modal isOpen={isReceptionOpen} onClose={onReceptionClose} size="lg">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent bg={bgColor} borderColor={borderColor}>
          <ModalHeader>
            <HStack>
              <Box
                p={2}
                borderRadius="full"
                bg="green.100"
                color="green.600"
              >
                <FaCheck size={20} />
              </Box>
              <Text color={textColor}>Recepție Probe - {selectedRequest?.request_number}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRequest && (
              <VStack align="stretch" spacing={4}>
                <Box p={3} bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor}>
                  <Text fontWeight="semibold" color={textColor}>
                    Pacient: {selectedRequest.patient_first_name} {selectedRequest.patient_last_name}
                  </Text>
                  {selectedRequest.patient_identity && (
                    <Text fontSize="sm" color={secondaryTextColor}>
                      CNP: {selectedRequest.patient_identity}
                    </Text>
                  )}
                </Box>
                <Text fontWeight="semibold" mb={2} color={textColor}>Selectați probele pentru recepție:</Text>
                <Box maxH="400px" overflowY="auto">
                  <VStack align="stretch" spacing={3}>
                    {selectedRequest.tests && selectedRequest.tests.map((test: any) => (
                      <Box
                        key={test.id}
                        p={3}
                        border="1px"
                        borderColor={borderColor}
                        borderRadius="md"
                        bg={selectedTestsForReception.includes(test.id) ? useColorModeValue('green.50', 'green.900') : bgColor}
                      >
                        <Checkbox
                          isChecked={selectedTestsForReception.includes(test.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTestsForReception([...selectedTestsForReception, test.id]);
                            } else {
                              setSelectedTestsForReception(selectedTestsForReception.filter(id => id !== test.id));
                            }
                          }}
                          colorScheme="green"
                        >
                          <VStack align="start" spacing={1} ml={2}>
                            <Text fontWeight="medium" color={textColor}>{test.test_name}</Text>
                            <HStack spacing={2}>
                              <Badge colorScheme="blue" fontSize="xs">{test.test_code}</Badge>
                              <Text fontSize="sm" color={secondaryTextColor}>
                                Tip probă: {test.sample_type}
                              </Text>
                            </HStack>
                          </VStack>
                        </Checkbox>
                      </Box>
                    ))}
                  </VStack>
                </Box>
                {selectedTestsForReception.length > 0 && (
                  <Box p={2} bg={useColorModeValue('green.50', 'green.900')} borderRadius="md" border="1px" borderColor={borderColor}>
                    <Text fontSize="sm" color={useColorModeValue('green.800', 'green.100')} fontWeight="medium">
                      ✓ {selectedTestsForReception.length} {selectedTestsForReception.length === 1 ? 'probă selectată' : 'probe selectate'}
                    </Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button onClick={onReceptionClose} variant="outline">Anulează</Button>
              <Button
                colorScheme="green"
                onClick={handleSaveReception}
                isDisabled={selectedTestsForReception.length === 0}
                leftIcon={<FaCheck />}
              >
                Salvează Recepția
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal pentru introducere rezultate */}
      <Modal isOpen={isResultsOpen} onClose={onResultsClose} size="xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent maxH="90vh" bg={bgColor} borderColor={borderColor}>
          <ModalHeader>
            <HStack>
              <Box
                p={2}
                borderRadius="full"
                bg="blue.100"
                color="blue.600"
              >
                <FaEdit size={20} />
              </Box>
              <Text color={textColor}>Introducere Rezultate - {selectedRequest?.request_number}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRequest && (
              <VStack align="stretch" spacing={4}>
                <Box p={3} bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor}>
                  <Text fontWeight="semibold" color={textColor}>
                    Pacient: {selectedRequest.patient_first_name} {selectedRequest.patient_last_name}
                  </Text>
                  {selectedRequest.patient_identity && (
                    <Text fontSize="sm" color={secondaryTextColor}>
                      CNP: {selectedRequest.patient_identity}
                    </Text>
                  )}
                </Box>
                {selectedRequest.tests && selectedRequest.tests.map((test: any) => (
                  <Box key={test.id} p={4} border="1px" borderColor={borderColor} borderRadius="md" bg={bgColor}>
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="semibold" color={textColor}>{test.test_name}</Text>
                      <Badge colorScheme="blue">{test.test_code}</Badge>
                    </HStack>
                    <HStack spacing={2} mb={2} fontSize="sm" color={secondaryTextColor} flexWrap="wrap">
                      <Text>
                        <strong style={{ color: textColor }}>Tip probă:</strong> {test.sample_type}
                      </Text>
                      {test.test_unit && (
                        <Text>
                          <strong style={{ color: textColor }}>Unitate:</strong> {test.test_unit}
                        </Text>
                      )}
                    </HStack>
                    {test.test_normal_values && (
                      <Box mb={3} p={3} bg={infoBoxBg} borderRadius="md" border="2px" borderColor={borderColor}>
                        <HStack mb={2}>
                          <Text fontSize="sm" fontWeight="bold" color={infoBoxText}>
                            📊 Valori normale (interval de referință):
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color={infoBoxText} fontWeight="medium">
                          {test.test_normal_values}
                        </Text>
                        {(() => {
                          const parsed = parseNormalValues(test.test_normal_values);
                          if (parsed && parsed.min !== undefined && parsed.max !== undefined) {
                            return (
                              <Text fontSize="xs" color={infoBoxText} mt={2} fontStyle="italic">
                                Interval numeric: {parsed.min} - {parsed.max} {test.test_unit || ''}
                              </Text>
                            );
                          } else if (parsed && parsed.max !== undefined) {
                            return (
                              <Text fontSize="xs" color={infoBoxText} mt={2} fontStyle="italic">
                                Valoare maximă: &lt; {parsed.max} {test.test_unit || ''}
                              </Text>
                            );
                          } else if (parsed && parsed.min !== undefined) {
                            return (
                              <Text fontSize="xs" color={infoBoxText} mt={2} fontStyle="italic">
                                Valoare minimă: &gt; {parsed.min} {test.test_unit || ''}
                              </Text>
                            );
                          }
                          return null;
                        })()}
                      </Box>
                    )}
                    <HStack spacing={4} mb={3}>
                      <FormControl flex={1}>
                        <FormLabel color={textColor}>
                          Rezultat {test.test_unit && `(${test.test_unit})`}
                        </FormLabel>
                        {isQualitativeTest(test.test_normal_values) ? (
                          <Select
                            value={testResults[test.id]?.value || ''}
                            onChange={(e) => {
                              setTestResults({
                                ...testResults,
                                [test.id]: {
                                  ...testResults[test.id],
                                  value: e.target.value,
                                  unit: testResults[test.id]?.unit || test.test_unit || ''
                                }
                              });
                            }}
                            placeholder="Selectați rezultatul"
                            bg={bgColor}
                            color={textColor}
                            borderColor={borderColor}
                            _placeholder={{ color: secondaryTextColor }}
                          >
                            <option value="Negativ">Negativ</option>
                            <option value="Pozitiv">Pozitiv</option>
                          </Select>
                        ) : (
                          <Input
                            type="text"
                            value={testResults[test.id]?.value || ''}
                            onChange={(e) => {
                              setTestResults({
                                ...testResults,
                                [test.id]: {
                                  ...testResults[test.id],
                                  value: e.target.value,
                                  unit: testResults[test.id]?.unit || test.test_unit || ''
                                }
                              });
                            }}
                            placeholder="Introduceți valoarea numerică sau text"
                            bg={bgColor}
                            color={textColor}
                            borderColor={
                              testResults[test.id]?.value && test.test_normal_values
                                ? getResultColor(testResults[test.id].value, test.test_normal_values) === 'green'
                                  ? 'green.300'
                                  : getResultColor(testResults[test.id].value, test.test_normal_values) === 'yellow'
                                  ? 'yellow.300'
                                  : 'red.300'
                                : borderColor
                            }
                            borderWidth={
                              testResults[test.id]?.value && test.test_normal_values
                                ? '2px'
                                : '1px'
                            }
                            _placeholder={{ color: secondaryTextColor }}
                          />
                        )}
                        {test.test_normal_values && testResults[test.id]?.value && (
                          <Box mt={2}>
                            {(() => {
                              const resultColor = getResultColor(testResults[test.id]?.value || '', test.test_normal_values);
                              const parsed = parseNormalValues(test.test_normal_values);
                              const value = parseFloat((testResults[test.id]?.value || '').replace(',', '.').trim());
                              
                              if (isNaN(value)) return null;
                              
                              if (parsed && !parsed.text) {
                                const bgColorMap = {
                                  green: useColorModeValue('green.50', 'green.900'),
                                  yellow: useColorModeValue('yellow.50', 'yellow.900'),
                                  red: useColorModeValue('red.50', 'red.900'),
                                  gray: bgColor
                                };
                                
                                const textColorMap = {
                                  green: useColorModeValue('green.800', 'green.100'),
                                  yellow: useColorModeValue('yellow.800', 'yellow.100'),
                                  red: useColorModeValue('red.800', 'red.100'),
                                  gray: textColor
                                };
                                
                                return (
                                  <Box
                                    p={2}
                                    borderRadius="md"
                                    bg={bgColorMap[resultColor]}
                                    border="1px"
                                    borderColor={
                                      resultColor === 'green' ? 'green.300' :
                                      resultColor === 'yellow' ? 'yellow.300' :
                                      resultColor === 'red' ? 'red.300' :
                                      borderColor
                                    }
                                  >
                                    <HStack spacing={2} mb={1}>
                                      {resultColor === 'green' && (
                                        <Badge colorScheme="green" fontSize="sm" px={2} py={1}>
                                          ✓ În interval normal
                                        </Badge>
                                      )}
                                      {resultColor === 'yellow' && (
                                        <Badge colorScheme="yellow" fontSize="sm" px={2} py={1}>
                                          ⚠ Aproape de limite
                                        </Badge>
                                      )}
                                      {resultColor === 'red' && (
                                        <Badge colorScheme="red" fontSize="sm" px={2} py={1}>
                                          ⚠ Depășește limitele normale
                                        </Badge>
                                      )}
                                    </HStack>
                                    {parsed.ranges && parsed.ranges.length > 0 ? (
                                      <VStack align="start" spacing={1}>
                                        {parsed.ranges.map((range, idx) => (
                                          <Text key={idx} fontSize="xs" color={textColorMap[resultColor]} fontWeight="medium">
                                            Interval {idx + 1}: {range.min} - {range.max} {test.test_unit || ''}
                                            {value >= range.min && value <= range.max && ' ✓'}
                                          </Text>
                                        ))}
                                      </VStack>
                                    ) : parsed.min !== undefined && parsed.max !== undefined ? (
                                      <Text fontSize="xs" color={textColorMap[resultColor]} fontWeight="medium">
                                        Interval normal: {parsed.min} - {parsed.max} {test.test_unit || ''}
                                      </Text>
                                    ) : parsed.max !== undefined ? (
                                      <Text fontSize="xs" color={textColorMap[resultColor]} fontWeight="medium">
                                        Valoare normală: &lt; {parsed.max} {test.test_unit || ''}
                                      </Text>
                                    ) : parsed.min !== undefined ? (
                                      <Text fontSize="xs" color={textColorMap[resultColor]} fontWeight="medium">
                                        Valoare normală: &gt; {parsed.min} {test.test_unit || ''}
                                      </Text>
                                    ) : null}
                                    <Text fontSize="xs" color={textColorMap[resultColor]} mt={1} fontStyle="italic">
                                      Valoare introdusă: <strong>{value}</strong> {test.test_unit || ''}
                                    </Text>
                                  </Box>
                                );
                              }
                              return null;
                            })()}
                          </Box>
                        )}
                      </FormControl>
                    </HStack>
                    <FormControl mb={3}>
                      <FormLabel color={textColor}>Atașează PDF cu rezultatul (opțional)</FormLabel>
                      <HStack spacing={2}>
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPdfFiles({
                                ...pdfFiles,
                                [test.id]: file
                              });
                              setTestResults({
                                ...testResults,
                                [test.id]: {
                                  ...testResults[test.id],
                                  pdfFile: file
                                }
                              });
                              toast({
                                title: 'Fișier atașat',
                                description: `PDF-ul "${file.name}" a fost atașat pentru ${test.test_name}`,
                                status: 'success',
                                duration: 3000,
                                isClosable: true,
                              });
                            }
                          }}
                          display="none"
                          id={`pdf-upload-${test.id}`}
                        />
                        <Button
                          as="label"
                          htmlFor={`pdf-upload-${test.id}`}
                          leftIcon={<FaUpload />}
                          size="sm"
                          variant="outline"
                          colorScheme="blue"
                          cursor="pointer"
                        >
                          Atașează PDF
                        </Button>
                        {pdfFiles[test.id] && (
                          <HStack spacing={2}>
                            <FaFilePdf color="red" />
                            <Text fontSize="sm" color={textColor}>
                              {pdfFiles[test.id]?.name}
                            </Text>
                            <IconButton
                              icon={<FaTimes />}
                              aria-label="Elimină PDF"
                              size="xs"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => {
                                setPdfFiles({
                                  ...pdfFiles,
                                  [test.id]: null
                                });
                                setTestResults({
                                  ...testResults,
                                  [test.id]: {
                                    ...testResults[test.id],
                                    pdfFile: undefined
                                  }
                                });
                              }}
                            />
                          </HStack>
                        )}
                      </HStack>
                      <Text fontSize="xs" color={secondaryTextColor} mt={1}>
                        Poți atașa un PDF cu rezultatul testului sau să introduci manual valorile de mai sus
                      </Text>
                    </FormControl>
                    <HStack spacing={2} mb={3}>
                      <Button
                        leftIcon={<FaComment />}
                        size="sm"
                        variant={showNotes[test.id] ? 'solid' : 'outline'}
                        colorScheme="blue"
                        onClick={() => {
                          setShowNotes({
                            ...showNotes,
                            [test.id]: !showNotes[test.id]
                          });
                          // Inițializează notes dacă nu există
                          if (!showNotes[test.id] && !testResults[test.id]?.notes) {
                            setTestResults({
                              ...testResults,
                              [test.id]: {
                                ...testResults[test.id],
                                notes: '',
                                value: testResults[test.id]?.value || '',
                                unit: testResults[test.id]?.unit || test.test_unit || ''
                              }
                            });
                          }
                        }}
                      >
                        Detalii/Observații
                      </Button>
                      {test.test_code?.includes('PROTOCOL') && (
                        <Button
                          leftIcon={<FaFlask />}
                          size="sm"
                          colorScheme="purple"
                          variant="outline"
                          onClick={() => {
                            setSelectedProtocolTest(test);
                            setProtocolResults({});
                            onProtocolOpen();
                          }}
                        >
                          Completează Rezultat Test (Protocol)
                        </Button>
                      )}
                    </HStack>
                    {showNotes[test.id] && (
                      <FormControl>
                        <FormLabel color={textColor}>Detalii/Observații</FormLabel>
                        <Textarea
                          value={testResults[test.id]?.notes || ''}
                          onChange={(e) => {
                            setTestResults({
                              ...testResults,
                              [test.id]: {
                                ...testResults[test.id],
                                notes: e.target.value
                              }
                            });
                          }}
                          placeholder="Observații despre test..."
                          rows={2}
                          bg={bgColor}
                          color={textColor}
                          borderColor={borderColor}
                          _placeholder={{ color: secondaryTextColor }}
                        />
                      </FormControl>
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button onClick={onResultsClose} variant="outline">Anulează</Button>
              <Button
                leftIcon={<FaPrint />}
                variant="outline"
                colorScheme="gray"
                onClick={() => {
                  if (selectedRequest) {
                    handlePrint(selectedRequest.id);
                  }
                }}
                isDisabled={!selectedRequest || !selectedRequest.tests?.some((t: any) => t.result_value)}
              >
                Exportă PDF
              </Button>
              <Button colorScheme="blue" onClick={handleSaveResults} leftIcon={<FaCheck />}>
                Salvează Rezultatele
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal pentru teste compuse (protocol) */}
      <Modal isOpen={isProtocolOpen} onClose={onProtocolClose} size="xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent maxH="90vh" bg={bgColor} borderColor={borderColor}>
          <ModalHeader>
            <HStack>
              <Box
                p={2}
                borderRadius="full"
                bg="purple.100"
                color="purple.600"
              >
                <FaFlask size={20} />
              </Box>
              <Text color={textColor}>Test Compus (Protocol) - {selectedProtocolTest?.test_name}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedProtocolTest && (
              <VStack align="stretch" spacing={4}>
                <Box p={3} bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor}>
                  <Text fontWeight="semibold" color={textColor} mb={2}>
                    {selectedProtocolTest.test_name}
                  </Text>
                  <Text fontSize="sm" color={secondaryTextColor}>
                    {selectedProtocolTest.test_description || 'Test compus care conține mai multe sub-teste'}
                  </Text>
                </Box>
                <Text color={textColor} fontWeight="semibold">
                  Introduceți rezultatele pentru testele conținute:
                </Text>
                {/* Aici ar trebui să se încarce testele conținute în protocol */}
                {/* Pentru moment, simulăm cu un mesaj informativ */}
                <Box p={4} bg={useColorModeValue('purple.50', 'purple.900')} borderRadius="md" border="1px" borderColor={borderColor}>
                  <Text color={useColorModeValue('purple.800', 'purple.100')} fontSize="sm">
                    ⚠️ Testele compuse (protocol) necesită configurare suplimentară în baza de date pentru a defini testele conținute.
                    Pentru moment, puteți introduce rezultatul general în modalul principal.
                  </Text>
                </Box>
                {/* Aici ar trebui să fie lista de teste conținute */}
                {/* Exemplu de structură:
                {protocolSubTests.map((subTest) => (
                  <Box key={subTest.id} p={3} border="1px" borderColor={borderColor} borderRadius="md">
                    <FormControl>
                      <FormLabel>{subTest.name}</FormLabel>
                      <Input ... />
                    </FormControl>
                  </Box>
                ))}
                */}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button onClick={onProtocolClose} variant="outline">Închide</Button>
              <Button
                colorScheme="purple"
                onClick={() => {
                  // Salvează rezultatele protocolului în rezultatele testului principal
                  if (selectedProtocolTest) {
                    setTestResults({
                      ...testResults,
                      [selectedProtocolTest.id]: {
                        ...testResults[selectedProtocolTest.id],
                        value: 'Protocol completat',
                        notes: 'Rezultatele testului compus au fost introduse'
                      }
                    });
                  }
                  onProtocolClose();
                  toast({
                    title: 'Info',
                    description: 'Rezultatele protocolului au fost salvate',
                    status: 'info',
                    duration: 3000,
                    isClosable: true,
                  });
                }}
                leftIcon={<FaCheck />}
              >
                Salvează Rezultatele Protocolului
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal pentru aprobare rezultate */}
      <Modal isOpen={isApproveOpen} onClose={onApproveClose} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent bg={bgColor} borderColor={borderColor}>
          <ModalHeader>
            <HStack>
              <Box
                p={2}
                borderRadius="full"
                bg="green.100"
                color="green.600"
              >
                <FaCheck size={20} />
              </Box>
              <Text color={textColor}>Confirmare Aprobare</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text color={textColor} fontSize="md">
                Sunteți sigur că doriți să aprobați rezultatele acestei cereri de analize?
              </Text>
              <Box p={3} bg={useColorModeValue('green.50', 'green.900')} borderRadius="md" border="1px" borderColor={borderColor}>
                <Text fontSize="sm" color={useColorModeValue('green.800', 'green.100')} fontWeight="medium">
                  ⚠️ După aprobare, rezultatele vor fi marcate ca aprobate și vor putea fi tipărite în buletinul de analize.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button onClick={onApproveClose} variant="outline">
                Anulează
              </Button>
              <Button
                colorScheme="green"
                onClick={handleApprove}
                leftIcon={<FaCheck />}
              >
                Da, Aprobă Rezultatele
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal pentru invalidare rezultate */}
      <Modal isOpen={isInvalidateOpen} onClose={onInvalidateClose} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent bg={bgColor} borderColor={borderColor}>
          <ModalHeader>
            <HStack>
              <Box
                p={2}
                borderRadius="full"
                bg="orange.100"
                color="orange.600"
              >
                <FaUndo size={20} />
              </Box>
              <Text color={textColor}>Confirmare Returnare</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text color={textColor} fontSize="md">
                Sunteți sigur că doriți să returnați testele în lista de lucru?
              </Text>
              <Box p={3} bg={useColorModeValue('orange.50', 'orange.900')} borderRadius="md" border="1px" borderColor={borderColor}>
                <Text fontSize="sm" color={useColorModeValue('orange.800', 'orange.100')} fontWeight="medium">
                  ⚠️ Această acțiune va șterge rezultatele introduse și va returna testele în lista de lucru pentru reintroducere.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button onClick={onInvalidateClose} variant="outline">
                Anulează
              </Button>
              <Button
                colorScheme="orange"
                onClick={handleInvalidate}
                leftIcon={<FaUndo />}
              >
                Da
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
