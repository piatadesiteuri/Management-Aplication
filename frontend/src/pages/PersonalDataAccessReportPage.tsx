import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
  CardHeader,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  HStack,
  Input,
  Select,
  Button,
  Badge,
  useColorModeValue,
  FormControl,
  FormLabel,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { FiShield, FiUsers, FiFileText, FiSearch, FiDownload } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '@chakra-ui/react';

export default function PersonalDataAccessReportPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filters, setFilters] = useState({
    userId: '',
    startDate: '',
    endDate: '',
    entityType: '',
    actionType: '',
    page: 1,
    limit: 50,
  });
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const mutedText = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    loadUsers();
    loadReport();
  }, [filters]);

  const loadUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.actionType) params.append('actionType', filters.actionType);
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());

      const res = await api.get(`/activity-logs/personal-data-access?${params.toString()}`);
      setLogs(res.data.logs || []);
      setStats(res.data.stats || null);
      setTotal(res.data.total || 0);
    } catch (error: any) {
      console.error('Error loading report:', error);
      toast({
        title: 'Eroare',
        description: error?.response?.data?.message || 'Nu s-au putut încărca datele raportului.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // Pentru moment, doar afișăm un mesaj
      toast({
        title: 'Export',
        description: 'Funcționalitatea de export va fi implementată.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('VIEW') || action.includes('READ')) return 'blue';
    if (action.includes('DOWNLOAD') || action.includes('EXPORT')) return 'orange';
    if (action.includes('EDIT') || action.includes('UPDATE')) return 'yellow';
    if (action.includes('DELETE')) return 'red';
    return 'gray';
  };

  return (
    <Container maxW="7xl" py={8}>
      <VStack align="stretch" spacing={6}>
        <Box>
          <HStack spacing={3} mb={2}>
            <Icon as={FiShield} color="blue.500" boxSize={6} />
            <Heading size="lg">Raport Acces Date cu Caracter Personal</Heading>
          </HStack>
          <Text color={mutedText}>
            Monitorizare și raportare a accesului utilizatorilor la date cu caracter personal
          </Text>
        </Box>

        {/* Statistici */}
        {stats && (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Stat bg={cardBg} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor}>
              <StatLabel>
                <HStack>
                  <Icon as={FiUsers} color="blue.500" />
                  <Text>Utilizatori Unici</Text>
                </HStack>
              </StatLabel>
              <StatNumber>{stats.unique_users || 0}</StatNumber>
              <StatHelpText>Utilizatori care au accesat date personale</StatHelpText>
            </Stat>

            <Stat bg={cardBg} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor}>
              <StatLabel>
                <HStack>
                  <Icon as={FiFileText} color="green.500" />
                  <Text>Entități Accesate</Text>
                </HStack>
              </StatLabel>
              <StatNumber>{stats.unique_entities_accessed || 0}</StatNumber>
              <StatHelpText>Număr de entități cu date personale accesate</StatHelpText>
            </Stat>

            <Stat bg={cardBg} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor}>
              <StatLabel>
                <HStack>
                  <Icon as={FiShield} color="purple.500" />
                  <Text>Total Accesări</Text>
                </HStack>
              </StatLabel>
              <StatNumber>{stats.total_accesses || 0}</StatNumber>
              <StatHelpText>Total accesări în perioada selectată</StatHelpText>
            </Stat>
          </SimpleGrid>
        )}

        {/* Filtre */}
        <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
          <CardHeader>
            <Text fontSize="lg" fontWeight="semibold">Filtre</Text>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              <FormControl>
                <FormLabel>Utilizator</FormLabel>
                <Select
                  placeholder="Toți utilizatorii"
                  value={filters.userId}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value, page: 1 })}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Tip Entitate</FormLabel>
                <Select
                  placeholder="Toate tipurile"
                  value={filters.entityType}
                  onChange={(e) => setFilters({ ...filters, entityType: e.target.value, page: 1 })}
                >
                  <option value="PATIENT">Pacient</option>
                  <option value="USER">Utilizator</option>
                  <option value="IDENTITY_DOCUMENT">Act Identitate</option>
                  <option value="INSURANCE_STATUS">Status Asigurare</option>
                  <option value="EPISODE">Episod Medical</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Tip Acțiune</FormLabel>
                <Select
                  placeholder="Toate acțiunile"
                  value={filters.actionType}
                  onChange={(e) => setFilters({ ...filters, actionType: e.target.value, page: 1 })}
                >
                  <option value="VIEW">Vizualizare</option>
                  <option value="ACCESS">Acces</option>
                  <option value="DOWNLOAD">Descărcare</option>
                  <option value="EXPORT">Export</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Data Început</FormLabel>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Data Sfârșit</FormLabel>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Acțiuni</FormLabel>
                <HStack>
                  <Button leftIcon={<FiSearch />} colorScheme="blue" onClick={loadReport} isLoading={loading}>
                    Caută
                  </Button>
                  <Button leftIcon={<FiDownload />} variant="outline" onClick={handleExport}>
                    Export
                  </Button>
                </HStack>
              </FormControl>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Tabel Loguri */}
        <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
          <CardHeader>
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="semibold">
                Loguri Acces ({total} total)
              </Text>
            </HStack>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Center py={10}>
                <Spinner size="xl" />
              </Center>
            ) : logs.length > 0 ? (
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Data/Ora</Th>
                      <Th>Utilizator</Th>
                      <Th>Acțiune</Th>
                      <Th>Tip Entitate</Th>
                      <Th>Descriere</Th>
                      <Th>Motiv Acces</Th>
                      <Th>IP</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {logs.map((log) => (
                      <Tr key={log.id}>
                        <Td>
                          <Text fontSize="xs">
                            {new Date(log.created_at).toLocaleString('ro-RO')}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {log.first_name && log.last_name
                              ? `${log.first_name} ${log.last_name}`
                              : log.email || 'Sistem'}
                          </Text>
                          {log.email && (
                            <Text fontSize="xs" color={mutedText}>{log.email}</Text>
                          )}
                        </Td>
                        <Td>
                          <Badge colorScheme={getActionColor(log.action_type)}>
                            {log.action_type}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge variant="outline">{log.entity_type}</Badge>
                          {log.entity_id && (
                            <Text fontSize="xs" color={mutedText}>ID: {log.entity_id}</Text>
                          )}
                        </Td>
                        <Td>
                          <Text fontSize="sm">{log.description}</Text>
                        </Td>
                        <Td>
                          <Text fontSize="xs" color={mutedText}>
                            {log.access_reason || 'Acces standard'}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="xs" color={mutedText}>{log.ip_address || '-'}</Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            ) : (
              <Text color={mutedText} textAlign="center" py={10}>
                Nu există loguri de acces pentru criteriile selectate
              </Text>
            )}
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}

