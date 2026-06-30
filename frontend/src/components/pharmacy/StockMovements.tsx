import { useState, useEffect } from 'react';
import {
  Box,
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
  useColorModeValue,
  Select,
  FormControl,
  FormLabel,
  Input,
  Button,
} from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';
import api from '../../services/api';

interface StockMovement {
  id: number;
  movement_date: string;
  storage_id: number;
  article_id: number;
  movement_type: string;
  quantity: number;
  unit_cost: number;
  total_value: number;
  document_type: string;
  document_number?: string;
  batch_number?: string;
  notes?: string;
  article_name?: string;
  article_code?: string;
  storage_name?: string;
  storage_code?: string;
}

export default function StockMovements() {
  const toast = useToast();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [storages, setStorages] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    storageId: '',
    articleId: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);

  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    loadStorages();
    loadArticles();
    loadMovements();
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

  const loadArticles = async () => {
    try {
      const response = await api.get('/pharmacy/articles');
      setArticles(response.data);
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la încărcarea articolelor',
        status: 'error',
        duration: 3000
      });
    }
  };

  const loadMovements = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.storageId) params.storageId = filters.storageId;
      if (filters.articleId) params.articleId = filters.articleId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const response = await api.get('/pharmacy/stock-movements', { params });
      setMovements(response.data);
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la încărcarea mișcărilor',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleSearch = () => {
    loadMovements();
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'IN':
      case 'TRANSFER_IN':
        return 'green';
      case 'OUT':
      case 'TRANSFER_OUT':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'IN': return 'Intrare';
      case 'OUT': return 'Ieșire';
      case 'TRANSFER_IN': return 'Transfer Intrare';
      case 'TRANSFER_OUT': return 'Transfer Ieșire';
      case 'ADJUSTMENT': return 'Ajustare';
      default: return type;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'ENTRY_NOTE': return 'Notă Intrare';
      case 'REGISTER': return 'Condică';
      case 'PRESCRIPTION': return 'Rețetă';
      case 'TRANSFER': return 'Transfer';
      case 'ELABORATION': return 'Elaborare';
      case 'STOCK_INIT': return 'Inițializare';
      case 'ADJUSTMENT': return 'Ajustare';
      default: return type;
    }
  };

  return (
    <Box>
      <Heading size="md" mb={4} color={textColor}>Lista Mișcări Stoc</Heading>

      <HStack spacing={4} mb={4} flexWrap="wrap">
        <FormControl maxW="250px">
          <FormLabel color={textColor}>Gestiune</FormLabel>
          <Select
            value={filters.storageId}
            onChange={(e) => handleFilterChange('storageId', e.target.value)}
            bg={bgColor}
            color={textColor}
            borderColor={borderColor}
          >
            <option value="">Toate</option>
            {storages.map((storage) => (
              <option key={storage.id} value={storage.id}>
                {storage.name}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl maxW="250px">
          <FormLabel color={textColor}>Articol</FormLabel>
          <Select
            value={filters.articleId}
            onChange={(e) => handleFilterChange('articleId', e.target.value)}
            bg={bgColor}
            color={textColor}
            borderColor={borderColor}
          >
            <option value="">Toate</option>
            {articles.map((article) => (
              <option key={article.id} value={article.id}>
                {article.name}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl maxW="200px">
          <FormLabel color={textColor}>Data Început</FormLabel>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            bg={bgColor}
            color={textColor}
            borderColor={borderColor}
          />
        </FormControl>
        <FormControl maxW="200px">
          <FormLabel color={textColor}>Data Sfârșit</FormLabel>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            bg={bgColor}
            color={textColor}
            borderColor={borderColor}
          />
        </FormControl>
        <Button leftIcon={<FaSearch />} colorScheme="blue" onClick={handleSearch} mt={8}>
          Caută
        </Button>
      </HStack>

      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th color={textColor}>Data</Th>
              <Th color={textColor}>Tip</Th>
              <Th color={textColor}>Document</Th>
              <Th color={textColor}>Articol</Th>
              <Th color={textColor}>Gestiune</Th>
              <Th color={textColor}>Cantitate</Th>
              <Th color={textColor}>Valoare</Th>
              <Th color={textColor}>Observații</Th>
            </Tr>
          </Thead>
          <Tbody>
            {movements.length === 0 ? (
              <Tr>
                <Td colSpan={8} textAlign="center" color={textColor}>
                  Nu există mișcări
                </Td>
              </Tr>
            ) : (
              movements.map((movement) => (
                <Tr key={movement.id}>
                  <Td color={textColor}>
                    {new Date(movement.movement_date).toLocaleString('ro-RO')}
                  </Td>
                  <Td>
                    <Badge colorScheme={getMovementTypeColor(movement.movement_type)}>
                      {getMovementTypeLabel(movement.movement_type)}
                    </Badge>
                  </Td>
                  <Td color={textColor}>
                    {getDocumentTypeLabel(movement.document_type)}
                    {movement.document_number && ` - ${movement.document_number}`}
                  </Td>
                  <Td color={textColor}>{movement.article_name} ({movement.article_code})</Td>
                  <Td color={textColor}>{movement.storage_name}</Td>
                  <Td color={textColor}>{Number(movement.quantity || 0).toFixed(2)}</Td>
                  <Td color={textColor}>{Number(movement.total_value || 0).toFixed(2)} RON</Td>
                  <Td color={textColor}>{movement.notes || '-'}</Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}
