import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  HStack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useToast,
  useColorModeValue,
  Select,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
} from '@chakra-ui/react';
import { FaFileExport, FaSearch, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import api from '../../services/api';

interface ExportDocument {
  document_type: string;
  document_number: string;
  document_date: string;
  total_value: number;
  storage_name: string;
  storage_code: string;
}

interface ExportData {
  export_date: string;
  period: {
    start: string | null;
    end: string | null;
  };
  documents: ExportDocument[];
  summary: {
    total_documents: number;
    total_value: number;
  };
}

export default function CJASExport() {
  const toast = useToast();
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [storages, setStorages] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    storageId: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);

  const textColor = useColorModeValue('gray.800', 'white');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    loadStorages();
  }, []);

  const loadStorages = async () => {
    try {
      const response = await api.get('/pharmacy/storages');
      setStorages(response.data);
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la încărcarea gestiunilor',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.storageId) params.storageId = filters.storageId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get('/pharmacy/export-cjas', { params });
      setExportData(response.data);
      
      toast({
        title: 'Succes',
        description: `Export realizat: ${response.data.summary.total_documents} documente`,
        status: 'success',
        duration: 3000
      });
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la export',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!exportData) return;

    const escapeHtml = (text: string) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('ro-RO');
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Export CJAS - ${new Date().toISOString().split('T')[0]}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      color: #000;
      line-height: 1.4;
      margin: 0;
      padding: 0;
    }
    .header {
      text-align: center;
      margin-bottom: 15px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 16px;
      font-weight: bold;
    }
    .info-section {
      margin-bottom: 15px;
      display: flex;
      justify-content: space-between;
    }
    .info-box {
      flex: 1;
    }
    .info-label {
      font-weight: bold;
      margin-right: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th, td {
      border: 1px solid #000;
      padding: 6px;
      text-align: left;
      font-size: 9px;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .summary {
      margin-top: 15px;
      padding: 10px;
      background-color: #f9f9f9;
      border: 1px solid #000;
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
    <h1>EXPORT CJAS - SPITALUL MUNICIPAL BRAȘOV</h1>
    <p>Data export: ${new Date(exportData.export_date).toLocaleString('ro-RO')}</p>
    ${exportData.period.start && exportData.period.end ? `
    <p>Perioadă: ${formatDate(exportData.period.start)} - ${formatDate(exportData.period.end)}</p>
    ` : ''}
  </div>

  <div class="info-section">
    <div class="info-box">
      <span class="info-label">Total Documente:</span>
      <span>${exportData.summary.total_documents}</span>
    </div>
    <div class="info-box">
      <span class="info-label">Valoare Totală:</span>
      <span>${Number(exportData.summary.total_value || 0).toFixed(2)} RON</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Tip Document</th>
        <th>Număr</th>
        <th>Data</th>
        <th>Gestiune</th>
        <th>Valoare (RON)</th>
      </tr>
    </thead>
    <tbody>
      ${exportData.documents.map((doc: ExportDocument) => `
        <tr>
          <td>${escapeHtml(getDocumentTypeLabel(doc.document_type))}</td>
          <td>${escapeHtml(doc.document_number)}</td>
          <td>${formatDate(doc.document_date)}</td>
          <td>${escapeHtml(doc.storage_name)}</td>
          <td style="text-align: right;">${Number(doc.total_value || 0).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="summary">
    <strong>Total Documente:</strong> ${exportData.summary.total_documents} | 
    <strong>Valoare Totală:</strong> ${Number(exportData.summary.total_value || 0).toFixed(2)} RON
  </div>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    }
  };

  const handleDownloadExcel = () => {
    if (!exportData) return;

    // Pregătește datele pentru Excel
    const worksheetData = [
      ['Tip Document', 'Număr', 'Data', 'Gestiune', 'Valoare (RON)'],
      ...exportData.documents.map((doc: ExportDocument) => [
        getDocumentTypeLabel(doc.document_type),
        doc.document_number,
        new Date(doc.document_date).toLocaleDateString('ro-RO'),
        doc.storage_name,
        Number(doc.total_value || 0).toFixed(2)
      ]),
      [],
      ['Total Documente', exportData.summary.total_documents],
      ['Valoare Totală (RON)', Number(exportData.summary.total_value || 0).toFixed(2)]
    ];

    // Creează workbook și worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Setează lățimea coloanelor
    ws['!cols'] = [
      { wch: 20 }, // Tip Document
      { wch: 25 }, // Număr
      { wch: 12 }, // Data
      { wch: 25 }, // Gestiune
      { wch: 15 }  // Valoare
    ];

    // Adaugă worksheet la workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Export CJAS');

    // Generează Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const fileName = `export_cjas_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);

    toast({
      title: 'Succes',
      description: 'Export Excel generat cu succes',
      status: 'success',
      duration: 3000
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'ENTRY_NOTE': return 'Notă Intrare';
      case 'REGISTER': return 'Condică';
      case 'PRESCRIPTION': return 'Rețetă';
      default: return type;
    }
  };

  return (
    <Box>
      <Heading size="md" mb={4} color={textColor}>Export CJAS</Heading>

      {!exportData && (
        <Box p={6} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor} mb={6}>
          <Text color={textColor} mb={2}>
            <strong>Instrucțiuni:</strong>
          </Text>
          <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm">
            Selectează perioada și gestiunea (opțional) pentru care dorești să generezi exportul CJAS, apoi apasă butonul "Generează Export".
            Exportul va include toate documentele validate (Note de Intrare, Condici, Rețete) din perioada selectată.
          </Text>
        </Box>
      )}

      <VStack spacing={4} align="stretch" mb={6}>
        <HStack spacing={4} flexWrap="wrap">
          <FormControl maxW="300px">
            <FormLabel color={textColor}>Gestiune</FormLabel>
            <Select
              value={filters.storageId}
              onChange={(e) => setFilters({ ...filters, storageId: e.target.value })}
              bg={cardBg}
              color={textColor}
              borderColor={borderColor}
            >
              <option value="">Toate gestiunile</option>
              {storages.map((storage) => (
                <option key={storage.id} value={storage.id}>
                  {storage.name} ({storage.code})
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl maxW="200px">
            <FormLabel color={textColor}>Data Început</FormLabel>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              bg={cardBg}
              color={textColor}
              borderColor={borderColor}
            />
          </FormControl>
          <FormControl maxW="200px">
            <FormLabel color={textColor}>Data Sfârșit</FormLabel>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              bg={cardBg}
              color={textColor}
              borderColor={borderColor}
            />
          </FormControl>
          <Button
            leftIcon={<FaSearch />}
            colorScheme="blue"
            onClick={handleExport}
            isLoading={loading}
            mt={8}
          >
            Generează Export
          </Button>
        </HStack>
      </VStack>

      {exportData && (
        <Box>
          <HStack justify="space-between" mb={4}>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                Data export: {new Date(exportData.export_date).toLocaleString('ro-RO')}
              </Text>
              {exportData.period.start && exportData.period.end && (
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                  Perioadă: {new Date(exportData.period.start).toLocaleDateString('ro-RO')} - {new Date(exportData.period.end).toLocaleDateString('ro-RO')}
                </Text>
              )}
            </VStack>
            <HStack spacing={3}>
              <Button
                leftIcon={<FaFilePdf />}
                colorScheme="red"
                onClick={handleDownloadPDF}
              >
                Descarcă PDF
              </Button>
              <Button
                leftIcon={<FaFileExcel />}
                colorScheme="green"
                onClick={handleDownloadExcel}
              >
                Descarcă Excel
              </Button>
            </HStack>
          </HStack>

          <Box mb={4} p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
            <HStack spacing={6}>
              <Box>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Total Documente</Text>
                <Text fontWeight="bold" fontSize="lg" color={textColor}>
                  {exportData.summary.total_documents}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Valoare Totală</Text>
                <Text fontWeight="bold" fontSize="lg" color={textColor}>
                  {Number(exportData.summary.total_value || 0).toFixed(2)} RON
                </Text>
              </Box>
            </HStack>
          </Box>

          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th color={textColor}>Tip Document</Th>
                  <Th color={textColor}>Număr</Th>
                  <Th color={textColor}>Data</Th>
                  <Th color={textColor}>Gestiune</Th>
                  <Th color={textColor}>Valoare</Th>
                </Tr>
              </Thead>
              <Tbody>
                {exportData.documents.length === 0 ? (
                  <Tr>
                    <Td colSpan={5} textAlign="center" color={textColor}>
                      Nu există documente în perioada selectată
                    </Td>
                  </Tr>
                ) : (
                  exportData.documents.map((doc, index) => (
                    <Tr key={index}>
                      <Td color={textColor}>{getDocumentTypeLabel(doc.document_type)}</Td>
                      <Td color={textColor}>{doc.document_number}</Td>
                      <Td color={textColor}>
                        {new Date(doc.document_date).toLocaleDateString('ro-RO')}
                      </Td>
                      <Td color={textColor}>{doc.storage_name}</Td>
                      <Td color={textColor}>{Number(doc.total_value || 0).toFixed(2)} RON</Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}
