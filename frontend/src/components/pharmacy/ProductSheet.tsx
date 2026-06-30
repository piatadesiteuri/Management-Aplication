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
  VStack,
  Text,
} from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';
import api from '../../services/api';

interface StockItem {
  id: number;
  quantity: number;
  unit_cost: number;
  expiry_date?: string;
  batch_number?: string;
  storage_name: string;
  storage_code: string;
}

interface StockMovement {
  id: number;
  movement_date: string;
  movement_type: string;
  quantity: number;
  unit_cost: number;
  total_value: number;
  document_type: string;
  document_number?: string;
  storage_name: string;
  storage_code: string;
  notes?: string;
}

interface ProductSheet {
  article: any;
  current_stock: StockItem[];
  movements: StockMovement[];
  statistics: {
    total_in: number;
    total_out: number;
    net_movement: number;
    period: {
      start: string | null;
      end: string | null;
    };
  };
}

export default function ProductSheet() {
  const toast = useToast();
  const [articles, setArticles] = useState<any[]>([]);
  const [productSheet, setProductSheet] = useState<ProductSheet | null>(null);
  const [filters, setFilters] = useState({
    articleId: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);

  const textColor = useColorModeValue('gray.800', 'white');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    loadArticles();
  }, []);

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

  const handleSearch = async () => {
    if (!filters.articleId) {
      toast({
        title: 'Eroare',
        description: 'Selectează un articol',
        status: 'error',
        duration: 3000
      });
      return;
    }

    setLoading(true);
    try {
      const params: any = { articleId: filters.articleId };
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get('/pharmacy/product-sheet', { params });
      setProductSheet(response.data);
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la încărcarea fișei mărfii',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
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
      default: return type;
    }
  };

  return (
    <Box>
      <Heading size="md" mb={4} color={textColor}>Fișa Mărfii</Heading>

      {!productSheet && (
        <Box p={6} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor} mb={6}>
          <Text color={textColor} mb={2}>
            <strong>Instrucțiuni:</strong>
          </Text>
          <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm">
            Selectează un articol din listă și opțional perioada pentru care dorești să vezi fișa mărfii, apoi apasă butonul "Caută".
            Vei vedea stocul curent pe gestiuni, statisticile mișcărilor și istoricul complet al mișcărilor pentru articolul selectat.
          </Text>
        </Box>
      )}

      <HStack spacing={4} mb={6} flexWrap="wrap">
        <FormControl maxW="400px">
          <FormLabel color={textColor}>Articol *</FormLabel>
          <Select
            value={filters.articleId}
            onChange={(e) => setFilters({ ...filters, articleId: e.target.value })}
            bg={cardBg}
            color={textColor}
            borderColor={borderColor}
          >
            <option value="">Selectează articol</option>
            {articles.map((article) => (
              <option key={article.id} value={article.id}>
                {article.name} ({article.code})
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
          onClick={handleSearch}
          isLoading={loading}
          mt={8}
        >
          Caută
        </Button>
      </HStack>

      {productSheet && (
        <VStack spacing={6} align="stretch">
          {/* Informații articol */}
          <Box p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
            <Heading size="sm" mb={4} color={textColor}>Informații Articol</Heading>
            <HStack spacing={6} flexWrap="wrap">
              <Box>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Nume</Text>
                <Text fontWeight="bold" color={textColor}>{productSheet.article.name}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Cod</Text>
                <Text fontWeight="bold" color={textColor}>{productSheet.article.code}</Text>
              </Box>
              {productSheet.article.article_type_name && (
                <Box>
                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Tip</Text>
                  <Text fontWeight="bold" color={textColor}>{productSheet.article.article_type_name}</Text>
                </Box>
              )}
              {productSheet.article.manufacturer_name && (
                <Box>
                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Producător</Text>
                  <Text fontWeight="bold" color={textColor}>{productSheet.article.manufacturer_name}</Text>
                </Box>
              )}
              {productSheet.article.unit_of_measure_name && (
                <Box>
                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Unitate</Text>
                  <Text fontWeight="bold" color={textColor}>{productSheet.article.unit_of_measure_name}</Text>
                </Box>
              )}
            </HStack>
          </Box>

          {/* Stoc curent */}
          {productSheet.current_stock && productSheet.current_stock.length > 0 && (
            <Box>
              <Heading size="sm" mb={4} color={textColor}>Stoc Curent pe Gestiuni</Heading>
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th color={textColor}>Gestiune</Th>
                      <Th color={textColor}>Cantitate</Th>
                      <Th color={textColor}>Preț Unit</Th>
                      <Th color={textColor}>Valoare</Th>
                      <Th color={textColor}>Lot</Th>
                      <Th color={textColor}>Expirare</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {productSheet.current_stock.map((stock) => (
                      <Tr key={stock.id}>
                        <Td color={textColor}>{stock.storage_name} ({stock.storage_code})</Td>
                        <Td color={textColor}>{Number(stock.quantity || 0).toFixed(2)}</Td>
                        <Td color={textColor}>{Number(stock.unit_cost || 0).toFixed(2)} RON</Td>
                        <Td color={textColor}>
                          {(Number(stock.quantity || 0) * Number(stock.unit_cost || 0)).toFixed(2)} RON
                        </Td>
                        <Td color={textColor}>{stock.batch_number || '-'}</Td>
                        <Td color={textColor}>
                          {stock.expiry_date ? new Date(stock.expiry_date).toLocaleDateString('ro-RO') : '-'}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Statistici */}
          <Box p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
            <Heading size="sm" mb={4} color={textColor}>Statistici Mișcări</Heading>
            <HStack spacing={6} flexWrap="wrap">
              <Box>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Total Intrări</Text>
                <Text fontWeight="bold" fontSize="lg" color="green.500">
                  {Number(productSheet.statistics.total_in || 0).toFixed(2)}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Total Ieșiri</Text>
                <Text fontWeight="bold" fontSize="lg" color="red.500">
                  {Number(productSheet.statistics.total_out || 0).toFixed(2)}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Mișcare Netă</Text>
                <Text fontWeight="bold" fontSize="lg" color={textColor}>
                  {Number(productSheet.statistics.net_movement || 0).toFixed(2)}
                </Text>
              </Box>
              {productSheet.statistics.period.start && productSheet.statistics.period.end && (
                <Box>
                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Perioadă</Text>
                  <Text fontWeight="bold" color={textColor}>
                    {new Date(productSheet.statistics.period.start).toLocaleDateString('ro-RO')} - {new Date(productSheet.statistics.period.end).toLocaleDateString('ro-RO')}
                  </Text>
                </Box>
              )}
            </HStack>
          </Box>

          {/* Mișcări stoc */}
          {productSheet.movements && productSheet.movements.length > 0 && (
            <Box>
              <Heading size="sm" mb={4} color={textColor}>Istoric Mișcări Stoc</Heading>
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th color={textColor}>Data</Th>
                      <Th color={textColor}>Tip</Th>
                      <Th color={textColor}>Document</Th>
                      <Th color={textColor}>Gestiune</Th>
                      <Th color={textColor}>Cantitate</Th>
                      <Th color={textColor}>Valoare</Th>
                      <Th color={textColor}>Observații</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {productSheet.movements.map((movement) => (
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
                        <Td color={textColor}>{movement.storage_name}</Td>
                        <Td color={textColor}>{Number(movement.quantity || 0).toFixed(2)}</Td>
                        <Td color={textColor}>{Number(movement.total_value || 0).toFixed(2)} RON</Td>
                        <Td color={textColor}>{movement.notes || '-'}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </VStack>
      )}
    </Box>
  );
}
