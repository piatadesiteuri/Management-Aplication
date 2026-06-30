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

interface StockItem {
  id: number;
  storage_id: number;
  article_id: number;
  quantity: number;
  unit_cost: number;
  expiry_date?: string;
  batch_number?: string;
  article_name?: string;
  article_code?: string;
  storage_name?: string;
  storage_code?: string;
  unit_of_measure_name?: string;
}

export default function CurrentStock() {
  const toast = useToast();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [storages, setStorages] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    storageId: '',
  });
  const [loading, setLoading] = useState(false);

  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    loadStorages();
    loadStock();
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

  const loadStock = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.storageId) {
        params.storageId = filters.storageId;
      }
      const response = await api.get('/pharmacy/current-stock', { params });
      setStockItems(response.data);
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la încărcarea stocului',
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
    loadStock();
  };

  const totalValue = stockItems.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);

  return (
    <Box>
      <Heading size="md" mb={4} color={textColor}>Stoc Curent</Heading>

      <HStack spacing={4} mb={4}>
        <FormControl maxW="300px">
          <FormLabel color={textColor}>Filtrează după Gestiune</FormLabel>
          <Select
            value={filters.storageId}
            onChange={(e) => handleFilterChange('storageId', e.target.value)}
            bg={useColorModeValue('white', 'gray.800')}
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
        <Button leftIcon={<FaSearch />} colorScheme="blue" onClick={handleSearch} mt={8}>
          Caută
        </Button>
      </HStack>

      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th color={textColor}>Articol</Th>
              <Th color={textColor}>Gestiune</Th>
              <Th color={textColor}>Cantitate</Th>
              <Th color={textColor}>Unitate</Th>
              <Th color={textColor}>Preț Unit</Th>
              <Th color={textColor}>Valoare</Th>
              <Th color={textColor}>Lot</Th>
              <Th color={textColor}>Expirare</Th>
            </Tr>
          </Thead>
          <Tbody>
            {stockItems.length === 0 ? (
              <Tr>
                <Td colSpan={8} textAlign="center" color={textColor}>
                  Nu există articole în stoc
                </Td>
              </Tr>
            ) : (
              stockItems.map((item) => (
                <Tr key={item.id}>
                  <Td color={textColor}>{item.article_name} ({item.article_code})</Td>
                  <Td color={textColor}>{item.storage_name}</Td>
                  <Td color={textColor}>{Number(item.quantity || 0).toFixed(2)}</Td>
                  <Td color={textColor}>{item.unit_of_measure_name || '-'}</Td>
                  <Td color={textColor}>{Number(item.unit_cost || 0).toFixed(2)} RON</Td>
                  <Td color={textColor}>{(Number(item.quantity || 0) * Number(item.unit_cost || 0)).toFixed(2)} RON</Td>
                  <Td color={textColor}>{item.batch_number || '-'}</Td>
                  <Td color={textColor}>
                    {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('ro-RO') : '-'}
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>

      {stockItems.length > 0 && (
        <Box mt={4} textAlign="right">
          <Heading size="sm" color={textColor}>
            Valoare Totală Stoc: {totalValue.toFixed(2)} RON
          </Heading>
        </Box>
      )}
    </Box>
  );
}
