import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Input,
  Select,
  FormControl,
  FormLabel,
  SimpleGrid,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Flex,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiRotateCcw,
  FiArrowRight,
  FiUser,
  FiCalendar,
  FiFileText,
  FiDollarSign,
  FiPackage,
  FiMapPin,
  FiClock,
  FiFilter,
  FiDownload,
  FiRefreshCw,
} from 'react-icons/fi';
import { SupplyService } from '../../services/supply/SupplyService';
import { Product } from '../../types/supply';

interface StockAuditEntry {
  id: number;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  unit_cost: number;
  total_cost: number;
  reference_document: string;
  reason: string;
  performed_by: string;
  user_name?: string;
  user_email?: string;
  supplier_name?: string;
  department_name?: string;
  notes?: string;
  movement_date: string;
  created_at: string;
  inventory_id: number;
  current_stock: number;
  current_unit_cost: number;
  product_id: number;
  product_name: string;
  product_code: string;
  product_unit: string;
  product_category?: string;
  previous_stock: number;
  stock_change: number;
  stock_after: number;
}

const movementTypeColors = {
  'IN': 'green',
  'OUT': 'red',
  'ADJUSTMENT': 'blue',
  'TRANSFER': 'purple'
};

const movementTypeIcons = {
  'IN': FiTrendingUp,
  'OUT': FiTrendingDown,
  'ADJUSTMENT': FiRotateCcw,
  'TRANSFER': FiArrowRight
};

const movementTypeLabels = {
  'IN': 'Intrare',
  'OUT': 'Ieșire',
  'ADJUSTMENT': 'Ajustare',
  'TRANSFER': 'Transfer'
};

export default function StockAuditLog() {
  const [auditEntries, setAuditEntries] = useState<StockAuditEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  // Filters
  const [filters, setFilters] = useState({
    productId: '',
    type: '',
    dateFrom: '',
    dateTo: ''
  });

  const toast = useToast();
  const supplyService = new SupplyService();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    loadAuditLog();
    loadProducts();
  }, [pagination.page, filters]);

  const loadAuditLog = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.productId && { productId: parseInt(filters.productId) }),
        ...(filters.type && { type: filters.type }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      };

      const response = await supplyService.getStockAuditLog(params);
      setAuditEntries(response.data);
      setPagination((prev) => {
        const next = response.pagination || {};
        const nextLimit = Number(next.limit ?? prev.limit);
        const nextTotal = Number(next.total ?? prev.total);
        const fallbackPages = Math.ceil(nextTotal / nextLimit);
        const nextPages = Math.max(1, Number(next.pages ?? (fallbackPages || 1)));
        const nextPage = Math.min(Math.max(1, Number(next.page ?? prev.page)), nextPages);
        return {
          ...prev,
          ...next,
          page: nextPage,
          limit: nextLimit,
          total: nextTotal,
          pages: nextPages,
        };
      });
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca datele de audit',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await supplyService.getProducts(1, 1000);
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      productId: '',
      type: '',
      dateFrom: '',
      dateTo: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ro-RO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON'
    }).format(amount);
  };

  const getMovementIcon = (type: string) => {
    const IconComponent = movementTypeIcons[type as keyof typeof movementTypeIcons];
    return IconComponent;
  };

  const getMovementColor = (type: string) => {
    return movementTypeColors[type as keyof typeof movementTypeColors];
  };

  const getMovementLabel = (type: string) => {
    return movementTypeLabels[type as keyof typeof movementTypeLabels];
  };

  const getPageRangeLabel = () => {
    if (!pagination.total) return 'Afișez 0 din 0';
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.total, pagination.page * pagination.limit);
    return `Afișez ${start}–${end} din ${pagination.total}`;
  };

  const getVisiblePages = () => {
    const pages = pagination.pages || 0;
    const current = pagination.page;
    if (pages <= 1) return [1];

    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(pages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);

    const result: number[] = [];
    for (let p = start; p <= end; p++) result.push(p);
    return result;
  };

  if (loading && auditEntries.length === 0) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Se încarcă istoricul modificărilor...</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            Audit Stoc - Istoricul Modificărilor
          </Text>
          <Text color={subtitleColor} fontSize="lg">
            Toate modificările de stoc înregistrate în sistem
          </Text>
        </Box>

        {/* Statistics */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Stat p={4} bg={bgColor} borderRadius="lg" border="1px" borderColor={borderColor}>
            <StatLabel>Total Înregistrări</StatLabel>
            <StatNumber>{pagination.total}</StatNumber>
            <StatHelpText>Modificări înregistrate</StatHelpText>
          </Stat>
          <Stat p={4} bg={bgColor} borderRadius="lg" border="1px" borderColor={borderColor}>
            <StatLabel>Intrări</StatLabel>
            <StatNumber color="green.500">
              {auditEntries.filter(entry => entry.type === 'IN').length}
            </StatNumber>
            <StatHelpText>În ultima perioadă</StatHelpText>
          </Stat>
          <Stat p={4} bg={bgColor} borderRadius="lg" border="1px" borderColor={borderColor}>
            <StatLabel>Ieșiri</StatLabel>
            <StatNumber color="red.500">
              {auditEntries.filter(entry => entry.type === 'OUT').length}
            </StatNumber>
            <StatHelpText>În ultima perioadă</StatHelpText>
          </Stat>
          <Stat p={4} bg={bgColor} borderRadius="lg" border="1px" borderColor={borderColor}>
            <StatLabel>Ajustări</StatLabel>
            <StatNumber color="blue.500">
              {auditEntries.filter(entry => entry.type === 'ADJUSTMENT').length}
            </StatNumber>
            <StatHelpText>În ultima perioadă</StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Filters */}
        <Box p={4} bg={bgColor} borderRadius="lg" border="1px" borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="medium" mb={4}>
            <Icon as={FiFilter} mr={2} />
            Filtre
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <FormControl>
              <FormLabel>Produs</FormLabel>
              <Select
                value={filters.productId}
                onChange={(e) => handleFilterChange('productId', e.target.value)}
                placeholder="Toate produsele"
              >
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.code})
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Tip Mișcare</FormLabel>
              <Select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                placeholder="Toate tipurile"
              >
                <option value="IN">Intrare</option>
                <option value="OUT">Ieșire</option>
                <option value="ADJUSTMENT">Ajustare</option>
                <option value="TRANSFER">Transfer</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>De la data</FormLabel>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Până la data</FormLabel>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </FormControl>
          </SimpleGrid>

          <HStack mt={4}>
            <Button onClick={loadAuditLog} leftIcon={<FiRefreshCw />} size="sm">
              Actualizează
            </Button>
            <Button onClick={clearFilters} variant="outline" size="sm">
              Șterge filtrele
            </Button>
          </HStack>
        </Box>

        {/* Audit Table */}
        <Box bg={bgColor} borderRadius="lg" border="1px" borderColor={borderColor} overflow="hidden">
          <Box p={4} borderBottom="1px" borderColor={borderColor}>
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="medium">
                Istoricul Modificărilor
              </Text>
              <HStack spacing={3}>
                <Text fontSize="sm" color="gray.600">
                  {getPageRangeLabel()}
                </Text>
                <HStack spacing={2}>
                  <Text fontSize="sm" color="gray.600">
                    / pagină:
                  </Text>
                  <Select
                    size="sm"
                    w="90px"
                    value={pagination.limit}
                    onChange={(e) =>
                      setPagination((prev) => ({
                        ...prev,
                        page: 1,
                        limit: Number(e.target.value),
                      }))
                    }
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </Select>
                </HStack>
              </HStack>
            </HStack>
          </Box>

          {loading ? (
            <Box p={8} textAlign="center">
              <Spinner size="lg" />
              <Text mt={4}>Se încarcă datele...</Text>
            </Box>
          ) : auditEntries.length === 0 ? (
            <Box p={8} textAlign="center">
              <Alert status="info" borderRadius="lg">
                <AlertIcon />
                Nu au fost găsite modificări de stoc cu criteriile selectate.
              </Alert>
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Data/Ora</Th>
                    <Th>Tip</Th>
                    <Th>Produs</Th>
                    <Th>Cantitate</Th>
                    <Th>Stoc Anterior</Th>
                    <Th>Stoc Nou</Th>
                    <Th>Cost Unitar</Th>
                    <Th>Valoare Totală</Th>
                    <Th>Utilizator</Th>
                    <Th>Motiv</Th>
                    <Th>Acțiuni</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {auditEntries.map((entry) => (
                    <Tr key={entry.id}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" fontWeight="medium">
                            {formatDate(entry.created_at)}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {entry.movement_date}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={getMovementColor(entry.type)}
                          leftIcon={<Icon as={getMovementIcon(entry.type)} />}
                        >
                          {getMovementLabel(entry.type)}
                        </Badge>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" fontWeight="medium">
                            {entry.product_name}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {entry.product_code} • {entry.product_unit}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Text
                          fontSize="sm"
                          fontWeight="medium"
                          color={entry.type === 'IN' ? 'green.500' : entry.type === 'OUT' ? 'red.500' : 'blue.500'}
                        >
                          {entry.type === 'IN' ? '+' : entry.type === 'OUT' ? '-' : ''}
                          {Math.abs(entry.quantity)} {entry.product_unit}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {entry.previous_stock} {entry.product_unit}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm" fontWeight="medium">
                          {entry.stock_after} {entry.product_unit}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {formatCurrency(entry.unit_cost)}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm" fontWeight="medium">
                          {formatCurrency(entry.total_cost)}
                        </Text>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" fontWeight="medium">
                            {entry.user_name || `Utilizator #${entry.performed_by}`}
                          </Text>
                          {entry.user_email && (
                            <Text fontSize="xs" color="gray.500">
                              {entry.user_email}
                            </Text>
                          )}
                          {entry.supplier_name && (
                            <Text fontSize="xs" color="gray.500">
                              Furnizor: {entry.supplier_name}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {entry.reason}
                        </Text>
                        {entry.notes && (
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            {entry.notes}
                          </Text>
                        )}
                      </Td>
                      <Td>
                        <Tooltip label="Detalii complete">
                          <Button size="xs" variant="outline">
                            <Icon as={FiFileText} />
                          </Button>
                        </Tooltip>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}

          {/* Pagination (afișată mereu) */}
          <Box p={4} borderTop="1px" borderColor={borderColor}>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
              <Text fontSize="sm" color="gray.600">
                Pagina {pagination.page} din {pagination.pages}
              </Text>
              <HStack>
                <Button
                  size="sm"
                  variant="outline"
                  isDisabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                >
                  Prima
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  isDisabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Anterior
                </Button>
                {getVisiblePages().map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={p === pagination.page ? 'solid' : 'outline'}
                    colorScheme={p === pagination.page ? 'blue' : undefined}
                    onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                    isDisabled={pagination.pages <= 1}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  isDisabled={pagination.page === pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Următor
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  isDisabled={pagination.page === pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: pagination.pages }))}
                >
                  Ultima
                </Button>
              </HStack>
            </Flex>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
}
