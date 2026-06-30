import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  VStack,
  Text,
  Button,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Textarea,
  Divider,
  SimpleGrid,
} from '@chakra-ui/react';
import { FiSearch, FiPlus, FiRefreshCw } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import DepartmentService, { type Department } from '../services/DepartmentService';

type RegistryRegister = {
  id: number;
  code?: string | null;
  name: string;
  type: 'REGISTRU_UNIC' | 'REGISTRU_ACTE';
  year: number;
  status: 'ACTIVE' | 'ARCHIVED';
  departments?: Array<{ id: number; name: string }>;
};

type RegistryEntry = {
  id: number;
  register_id: number;
  year: number;
  number: number;
  direction: 'IN' | 'OUT' | 'INTERNAL';
  channel: 'PHYSICAL' | 'ONLINE' | 'INTERNAL';
  title: string;
  status: string;
  created_at: string;
  assigned_department_name?: string | null;
  register_code?: string | null;
};

type RegistryWork = {
  id: number;
  unic_register_id: number;
  year: number;
  number: number;
  direction: 'IN' | 'OUT' | 'INTERNAL';
  channel: 'PHYSICAL' | 'ONLINE' | 'INTERNAL';
  title: string;
  status: string;
  created_at: string;
  sender_name?: string | null;
  recipient_name?: string | null;
  assigned_department_name?: string | null;
};

export default function RegistryPage() {
  const toast = useToast();
  const { user } = useAuth();

  // în backend avem mapare ADMIN -> SUPER_ADMIN; în UI tratăm ambele ca admin complet
  const isSuperAdmin = !!user?.roles?.includes('SUPER_ADMIN') || !!user?.roles?.includes('ADMIN');

  const nowYear = useMemo(() => new Date().getFullYear(), []);
  const [year, setYear] = useState<number>(nowYear);
  const [tabIndex, setTabIndex] = useState(0);

  const [registers, setRegisters] = useState<RegistryRegister[]>([]);
  const [selectedActsRegisterId, setSelectedActsRegisterId] = useState<number | ''>('');

  // IMPORTANT: Unic (LUCRĂRI) și Acte au load-uri independente; altfel se calcă unul pe altul și „dispar” datele.
  const [unicWorks, setUnicWorks] = useState<RegistryWork[]>([]);
  const [actsEntries, setActsEntries] = useState<RegistryEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [worksLoading, setWorksLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [departments, setDepartments] = useState<Department[]>([]);

  // Modal: recepție LUCRARE (Registrul Unic)
  const [isCreateWorkOpen, setIsCreateWorkOpen] = useState(false);
  const [createWorkActsRegisterId, setCreateWorkActsRegisterId] = useState<number | ''>('');
  const [createWorkDirection, setCreateWorkDirection] = useState<'IN' | 'OUT' | 'INTERNAL'>('IN');
  const [createWorkChannel, setCreateWorkChannel] = useState<'PHYSICAL' | 'ONLINE' | 'INTERNAL'>('PHYSICAL');
  const [createWorkTitle, setCreateWorkTitle] = useState('');
  const [createWorkDescription, setCreateWorkDescription] = useState('');
  const [createWorkSender, setCreateWorkSender] = useState('');
  const [createWorkRecipient, setCreateWorkRecipient] = useState('');

  // Modal: creare ACT (Registru de acte) / sau ACT atașat la o lucrare
  const [isCreateActOpen, setIsCreateActOpen] = useState(false);
  const [createActRegisterId, setCreateActRegisterId] = useState<number | ''>('');
  const [createActDirection, setCreateActDirection] = useState<'IN' | 'OUT' | 'INTERNAL'>('IN');
  const [createActChannel, setCreateActChannel] = useState<'PHYSICAL' | 'ONLINE' | 'INTERNAL'>('PHYSICAL');
  const [createActTitle, setCreateActTitle] = useState('');
  const [createActDescription, setCreateActDescription] = useState('');
  const [createActSender, setCreateActSender] = useState('');
  const [createActRecipient, setCreateActRecipient] = useState('');
  const [createActForWorkId, setCreateActForWorkId] = useState<number | null>(null);

  // Detalii lucrare (dosar logic) + traseu
  const [isWorkOpen, setIsWorkOpen] = useState(false);
  const [workLoading, setWorkLoading] = useState(false);
  const [workDetails, setWorkDetails] = useState<any>(null);
  const [assignDepartmentId, setAssignDepartmentId] = useState<number | ''>('');
  const [transferDepartmentId, setTransferDepartmentId] = useState<number | ''>('');
  const [transferNote, setTransferNote] = useState('');

  const unicRegister = useMemo(
    // Profesional: dacă anul este deja închis (arhivat), trebuie să îl putem vizualiza.
    // Preferăm ACTIVE, dar dacă nu există, afișăm ARCHIVED.
    () =>
      registers.find(r => r.type === 'REGISTRU_UNIC' && r.year === year && r.status === 'ACTIVE') ||
      registers.find(r => r.type === 'REGISTRU_UNIC' && r.year === year && r.status === 'ARCHIVED'),
    [registers, year]
  );

  const actsRegisters = useMemo(
    // Profesional: le afișăm și pe cele arhivate pentru consultare.
    () => registers.filter(r => r.type === 'REGISTRU_ACTE' && r.year === year),
    [registers, year]
  );

  const selectedActsRegister = useMemo(() => {
    if (typeof selectedActsRegisterId !== 'number') return null;
    return actsRegisters.find(r => r.id === selectedActsRegisterId) || null;
  }, [actsRegisters, selectedActsRegisterId]);

  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');

  const pad = (n: number, len: number) => String(n).padStart(len, '0');
  const formatWorkNo = (w: { year: number; number: number }) => `RU-${w.year}-${pad(w.number, 6)}`;
  const formatActNo = (e: { year: number; number: number; register_code?: string | null }) => {
    const code = e.register_code || '';
    const m = code.match(/D(\d+)/);
    const dep = m?.[1] ? `D${m[1]}` : null;
    return dep ? `ACT-${dep}-${e.year}-${pad(e.number, 4)}` : `ACT-${e.year}-${pad(e.number, 4)}`;
  };

  const loadRegisters = async () => {
    try {
      const res = await api.get('/registry/registers', { params: { year } });
      setRegisters(res.data || []);
    } catch (e) {
      console.error(e);
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca registrele.', status: 'error', duration: 4000, isClosable: true });
    }
  };

  const loadDepartments = async () => {
    try {
      const deps = await DepartmentService.getDepartments();
      setDepartments(deps || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadWorks = async (unicRegisterId: number) => {
    try {
      setWorksLoading(true);
      const res = await api.get('/registry/works', {
        params: { unicRegisterId, year, search, page: 1, limit: 50 }
      });
      return res.data?.works || [];
    } catch (e) {
      console.error(e);
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca lucrările (Registrul Unic).', status: 'error', duration: 4000, isClosable: true });
      return null;
    } finally {
      setWorksLoading(false);
    }
  };

  const loadEntries = async (registerId: number) => {
    try {
      setEntriesLoading(true);
      const res = await api.get('/registry/entries', {
        params: { registerId, year, search, page: 1, limit: 50 }
      });
      return res.data?.entries || [];
    } catch (e) {
      console.error(e);
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca înregistrările.', status: 'error', duration: 4000, isClosable: true });
      return null;
    } finally {
      setEntriesLoading(false);
    }
  };

  useEffect(() => {
    void loadRegisters();
  }, [year]);

  useEffect(() => {
    void loadDepartments();
  }, []);

  useEffect(() => {
    // load doar când ești pe tab-ul Registrul Unic (LUCRĂRI)
    if (tabIndex !== 0) return;
    if (!unicRegister?.id) return;
    (async () => {
      const data = await loadWorks(unicRegister.id);
      if (data) setUnicWorks(data);
    })();
  }, [tabIndex, unicRegister?.id, search, year]);

  useEffect(() => {
    // load doar când ești pe tab-ul Registre de acte
    if (tabIndex !== 1) return;
    if (typeof selectedActsRegisterId !== 'number') return;
    (async () => {
      const data = await loadEntries(selectedActsRegisterId);
      if (data) setActsEntries(data);
    })();
  }, [tabIndex, selectedActsRegisterId, search, year]);

  useEffect(() => {
    // când intri pe tab-ul Registre de acte, dacă nu e selectat nimic, selectăm primul registru disponibil
    if (tabIndex !== 1) return;
    if (typeof selectedActsRegisterId === 'number') return;
    if (actsRegisters.length === 0) return;
    setSelectedActsRegisterId(actsRegisters[0].id);
  }, [tabIndex, actsRegisters, selectedActsRegisterId]);

  const createUnicRegister = async () => {
    try {
      await api.post('/registry/registers', {
        name: `Registrul Unic ${year}`,
        type: 'REGISTRU_UNIC',
        year,
        code: `REG-UNIC-${year}`
      });
      toast({ title: 'Succes', description: 'Registrul Unic a fost creat.', status: 'success', duration: 2500, isClosable: true });
      await loadRegisters();
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut crea Registrul Unic.', status: 'error', duration: 4000, isClosable: true });
    }
  };

  const bootstrapYear = async () => {
    try {
      await api.post('/registry/admin/bootstrap-year', { year });
      toast({ title: 'Succes', description: `Registre generate pentru anul ${year}.`, status: 'success', duration: 3000, isClosable: true });
      await loadRegisters();
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-au putut genera registrele.', status: 'error', duration: 4000, isClosable: true });
    }
  };

  const seedDemo = async () => {
    try {
      await api.post('/registry/admin/seed-demo', { year });
      toast({ title: 'Succes', description: `Date demo generate pentru anul ${year}.`, status: 'success', duration: 3000, isClosable: true });
      await loadRegisters();
      if (unicRegister?.id) {
        const data = await loadWorks(unicRegister.id);
        if (data) setUnicWorks(data);
      }
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-au putut genera datele demo.', status: 'error', duration: 4000, isClosable: true });
    }
  };

  const createWork = async () => {
    try {
      if (!unicRegister?.id) {
        toast({ title: 'Eroare', description: 'Nu există Registru Unic activ pentru acest an.', status: 'error', duration: 3000, isClosable: true });
        return;
      }
      if (typeof createWorkActsRegisterId !== 'number') {
        toast({ title: 'Eroare', description: 'Selectează Registrul de acte în care se evidențiază actul recepționat.', status: 'error', duration: 4000, isClosable: true });
        return;
      }
      await api.post('/registry/works', {
        unicRegisterId: unicRegister.id,
        actsRegisterId: createWorkActsRegisterId,
        year,
        direction: createWorkDirection,
        channel: createWorkChannel,
        title: createWorkTitle,
        description: createWorkDescription,
        sender_name: createWorkSender,
        recipient_name: createWorkRecipient,
        received_at: new Date().toISOString()
      });
      setIsCreateWorkOpen(false);
      setCreateWorkTitle('');
      setCreateWorkDescription('');
      setCreateWorkSender('');
      setCreateWorkRecipient('');
      toast({ title: 'Succes', description: 'Lucrarea (Registrul Unic) + actul aferent au fost înregistrate.', status: 'success', duration: 2500, isClosable: true });
      const data = await loadWorks(unicRegister.id);
      if (data) setUnicWorks(data);
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut recepționa lucrarea.', status: 'error', duration: 4000, isClosable: true });
    }
  };

  const createAct = async () => {
    try {
      if (createActForWorkId) {
        if (typeof createActRegisterId !== 'number') {
          toast({ title: 'Eroare', description: 'Selectează registrul de acte.', status: 'error', duration: 3000, isClosable: true });
          return;
        }
        await api.post(`/registry/works/${createActForWorkId}/entries`, {
          actsRegisterId: createActRegisterId,
          year,
          direction: createActDirection,
          channel: createActChannel,
          title: createActTitle,
          description: createActDescription,
          sender_name: createActSender,
          recipient_name: createActRecipient,
          received_at: new Date().toISOString(),
        });
        toast({ title: 'Succes', description: 'Actul a fost adăugat la lucrare.', status: 'success', duration: 2500, isClosable: true });
        setIsCreateActOpen(false);
        setCreateActForWorkId(null);
        if (workDetails?.work?.id) {
          await openWork(workDetails.work.id);
        }
        return;
      }

      if (typeof createActRegisterId !== 'number') {
        toast({ title: 'Eroare', description: 'Selectează registrul de acte.', status: 'error', duration: 3000, isClosable: true });
        return;
      }
      await api.post(`/registry/registers/${createActRegisterId}/entries`, {
        year,
        direction: createActDirection,
        channel: createActChannel,
        title: createActTitle,
        description: createActDescription,
        sender_name: createActSender,
        recipient_name: createActRecipient
      });
      setIsCreateActOpen(false);
      setCreateActTitle('');
      setCreateActDescription('');
      setCreateActSender('');
      setCreateActRecipient('');
      toast({ title: 'Succes', description: 'Actul a fost înregistrat.', status: 'success', duration: 2500, isClosable: true });
      if (typeof selectedActsRegisterId === 'number') {
        const data = await loadEntries(selectedActsRegisterId);
        if (data) setActsEntries(data);
      }
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut crea actul.', status: 'error', duration: 4000, isClosable: true });
    }
  };

  const runRollover = async () => {
    const fromYear = year;
    const toYear = year + 1;
    try {
      await api.post('/registry/admin/rollover', { fromYear, toYear });
      toast({ title: 'Succes', description: `Închidere de an rulată: ${fromYear} → ${toYear}`, status: 'success', duration: 3000, isClosable: true });
      setYear(toYear);
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut rula închiderea de an.', status: 'error', duration: 4000, isClosable: true });
    }
  };

  const directionBadge = (d: string) => {
    const map: Record<string, { label: string; color: string }> = {
      IN: { label: 'Intrare', color: 'green' },
      OUT: { label: 'Ieșire', color: 'blue' },
      INTERNAL: { label: 'Intern', color: 'purple' }
    };
    const v = map[d] || { label: d, color: 'gray' };
    return <Badge colorScheme={v.color}>{v.label}</Badge>;
  };

  const statusBadge = (s: string) => {
    const map: Record<string, { label: string; color: string }> = {
      RECEIVED: { label: 'Înregistrată (recepționată)', color: 'gray' },
      ASSIGNED: { label: 'Repartizată', color: 'blue' },
      IN_PROGRESS: { label: 'În lucru', color: 'orange' },
      FINALIZED: { label: 'Finalizată', color: 'green' },
      CLOSED: { label: 'Închisă', color: 'green' },
      ARCHIVED: { label: 'Arhivată', color: 'gray' },
      CANCELLED: { label: 'Anulată', color: 'red' },
    };
    const v = map[s] || { label: s, color: 'gray' };
    return <Badge colorScheme={v.color}>{v.label}</Badge>;
  };

  const openWork = async (workId: number) => {
    try {
      setIsWorkOpen(true);
      setWorkLoading(true);
      const res = await api.get(`/registry/works/${workId}`);
      setWorkDetails(res.data);
      setAssignDepartmentId(res.data?.work?.assigned_department_id || '');
      setTransferDepartmentId('');
      setTransferNote('');
    } catch (e) {
      console.error(e);
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca detaliile lucrării.', status: 'error', duration: 4000, isClosable: true });
      setIsWorkOpen(false);
    } finally {
      setWorkLoading(false);
    }
  };

  const assignWork = async () => {
    try {
      const workId = workDetails?.work?.id;
      if (!workId) return;
      if (typeof assignDepartmentId !== 'number') {
        toast({ title: 'Eroare', description: 'Selectează structura (departamentul).', status: 'error', duration: 3000, isClosable: true });
        return;
      }
      await api.put(`/registry/works/${workId}/assign`, { departmentId: assignDepartmentId });
      toast({ title: 'Succes', description: 'Lucrarea a fost repartizată.', status: 'success', duration: 2500, isClosable: true });
      await openWork(workId);
      if (unicRegister?.id) {
        const data = await loadWorks(unicRegister.id);
        if (data) setUnicWorks(data);
      }
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut repartiza lucrarea.', status: 'error', duration: 4000, isClosable: true });
    }
  };

  const transferWork = async () => {
    try {
      const workId = workDetails?.work?.id;
      if (!workId) return;
      if (typeof transferDepartmentId !== 'number') {
        toast({ title: 'Eroare', description: 'Selectează structura destinatară.', status: 'error', duration: 3000, isClosable: true });
        return;
      }
      await api.post(`/registry/works/${workId}/transfer`, { toDepartmentId: transferDepartmentId, note: transferNote });
      toast({ title: 'Succes', description: 'Circulație internă înregistrată.', status: 'success', duration: 2500, isClosable: true });
      await openWork(workId);
      if (unicRegister?.id) {
        const data = await loadWorks(unicRegister.id);
        if (data) setUnicWorks(data);
      }
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut înregistra transferul.', status: 'error', duration: 4000, isClosable: true });
    }
  };

  return (
    <Container maxW="7xl" py={8}>
      <HStack justify="space-between" mb={6}>
        <Box>
          <Heading size="lg">Registratură</Heading>
          <Text color={useColorModeValue('gray.600', 'gray.400')}>
            Model oficial: <b>Registrul Unic (Lucrări)</b> + <b>Registre de acte</b> (intrări/ieșiri/interne), canale (ghișeu/online), fluxuri și închidere de an
          </Text>
        </Box>
        <HStack>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} w="120px">
            {[nowYear - 1, nowYear, nowYear + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
          <Button leftIcon={<FiRefreshCw />} onClick={loadRegisters} variant="outline">
            Reîmprospătează
          </Button>
        </HStack>
      </HStack>

      <Tabs variant="enclosed" colorScheme="blue" index={tabIndex} onChange={setTabIndex}>
        <TabList>
          <Tab>Registrul Unic (Lucrări)</Tab>
          <Tab>Registre de acte (Acte)</Tab>
          <Tab>Parametrizare registre</Tab>
          <Tab>Închidere de an</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Box bg={bg} border="1px solid" borderColor={border} borderRadius="xl" p={5}>
              {!unicRegister ? (
                <VStack align="start" spacing={3}>
                  <Text>
                    Nu există Registru Unic pentru anul {year}. (Nici activ, nici arhivat)
                  </Text>
                  {isSuperAdmin ? (
                    <Button colorScheme="blue" onClick={createUnicRegister}>
                      Creează Registrul Unic {year}
                    </Button>
                  ) : (
                    <Text color={useColorModeValue('gray.600', 'gray.400')}>
                      Cere unui SUPER_ADMIN să creeze Registrul Unic.
                    </Text>
                  )}
                </VStack>
              ) : (
                <>
                  <HStack justify="space-between" mb={4}>
                    <HStack>
                      <Text fontWeight="bold">{unicRegister.name}</Text>
                      <Badge colorScheme={unicRegister.status === 'ACTIVE' ? 'green' : 'gray'}>
                        {unicRegister.status}
                      </Badge>
                    </HStack>
                    <Button
                      leftIcon={<FiPlus />}
                      colorScheme="blue"
                      isDisabled={unicRegister.status !== 'ACTIVE'}
                      onClick={() => { setIsCreateWorkOpen(true); }}
                    >
                      Recepție lucrare (ghișeu/online)
                    </Button>
                  </HStack>
                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} mb={3}>
                    <b>Registrul Unic de lucrări</b> asigură evidența centralizată a tuturor lucrărilor instituției, indiferent de canalul de recepție.
                    Fiecare lucrare are număr unic instituție/an (ex: <b>RU-{year}-000123</b>) și este legată de unul sau mai multe <b>acte</b>.
                  </Text>
                  {unicRegister.status !== 'ACTIVE' && (
                    <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} mb={3}>
                      Registrul este arhivat (an închis). Poți doar consulta lucrările. Pentru recepții noi selectează un an activ.
                    </Text>
                  )}

                  <HStack mb={4}>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <FiSearch />
                      </InputLeftElement>
                      <Input placeholder="Caută lucrări după titlu/expeditor/destinatar..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </InputGroup>
                  </HStack>

                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Nr (LUCRARE)</Th>
                        <Th>Tip</Th>
                        <Th>Canal</Th>
                        <Th>Titlu</Th>
                        <Th>Status flux</Th>
                        <Th>Repartizare</Th>
                        <Th>Recepție</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {unicWorks.map((w) => (
                        <Tr
                          key={w.id}
                          cursor="pointer"
                          _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                          onClick={() => { void openWork(w.id); }}
                        >
                          <Td><Badge variant="outline">{formatWorkNo(w)}</Badge></Td>
                          <Td>{directionBadge(w.direction)}</Td>
                          <Td><Badge variant="subtle">{w.channel}</Badge></Td>
                          <Td>{w.title}</Td>
                          <Td>{statusBadge(w.status)}</Td>
                          <Td>{w.assigned_department_name || '-'}</Td>
                          <Td>{new Date(w.created_at).toLocaleString('ro-RO')}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                  {!worksLoading && unicWorks.length === 0 && (
                    <Text mt={3} fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                      Nu există lucrări pentru anul selectat. Pentru demonstrație, folosește tab-ul „Parametrizare registre” → „Generează date demo”.
                    </Text>
                  )}
                  {worksLoading && <Text mt={3} color="gray.500">Se încarcă...</Text>}
                </>
              )}
            </Box>
          </TabPanel>

          <TabPanel>
            <Box bg={bg} border="1px solid" borderColor={border} borderRadius="xl" p={5}>
              <HStack justify="space-between" mb={4}>
                <HStack>
                  <Text fontWeight="bold">Selectează registru de evidență a actelor:</Text>
                  <Select
                    value={selectedActsRegisterId}
                    onChange={(e) => setSelectedActsRegisterId(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Alege registru"
                    w="380px"
                  >
                    {actsRegisters.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.status})
                      </option>
                    ))}
                  </Select>
                </HStack>
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="blue"
                  isDisabled={typeof selectedActsRegisterId !== 'number' || selectedActsRegister?.status !== 'ACTIVE'}
                  onClick={() => {
                    if (typeof selectedActsRegisterId === 'number') {
                      setCreateActRegisterId(selectedActsRegisterId);
                      setCreateActForWorkId(null);
                      setIsCreateActOpen(true);
                    }
                  }}
                >
                  Înregistrare act
                </Button>
              </HStack>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} mb={3}>
                <b>Registru de acte</b> = evidență a documentelor individuale la nivel de structură (numerotare distinctă per registru/an).
                Un act poate fi asociat uneia sau mai multor lucrări (dosare logice).
              </Text>
              {selectedActsRegister && selectedActsRegister.status !== 'ACTIVE' && (
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} mb={3}>
                  Registrul selectat este arhivat. Pentru înregistrări noi selectează un an/registru activ.
                </Text>
              )}

              <InputGroup mb={4}>
                <InputLeftElement pointerEvents="none">
                  <FiSearch />
                </InputLeftElement>
                <Input placeholder="Caută..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </InputGroup>

              {typeof selectedActsRegisterId !== 'number' ? (
                <Text color={useColorModeValue('gray.600', 'gray.400')}>Alege un registru ca să vezi actele.</Text>
              ) : (
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Nr</Th>
                      <Th>Tip</Th>
                      <Th>Titlu</Th>
                      <Th>Status</Th>
                      <Th>Repartizare</Th>
                      <Th>Creat</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {actsEntries.map((e) => (
                      <Tr key={e.id}>
                        <Td><Badge variant="outline">{formatActNo(e)}</Badge></Td>
                        <Td>{directionBadge(e.direction)}</Td>
                        <Td>{e.title}</Td>
                        <Td>{statusBadge(e.status)}</Td>
                        <Td>{e.assigned_department_name || '-'}</Td>
                        <Td>{new Date(e.created_at).toLocaleString('ro-RO')}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
              {!entriesLoading && typeof selectedActsRegisterId === 'number' && actsEntries.length === 0 && (
                <Text mt={3} fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                  Nu există acte în acest registru pentru anul selectat.
                </Text>
              )}
              {entriesLoading && <Text mt={3} color="gray.500">Se încarcă...</Text>}
            </Box>
          </TabPanel>

          <TabPanel>
            <Box bg={bg} border="1px solid" borderColor={border} borderRadius="xl" p={5}>
              <Text mb={3}>
                Aici se demonstrează **administrarea multianuală** a registraturii: generarea registrelor pe an (Registrul Unic + registre de acte per structură),
                precum și pregătirea datelor de demo pentru evaluare. În anii **ARCHIVED**, această zonă este informativă (registrele sunt blocate la operare).
              </Text>
              {isSuperAdmin && (
                <HStack mb={4}>
                  <Button colorScheme="blue" onClick={bootstrapYear}>
                    Generează registre standard (anul {year})
                  </Button>
                  <Button variant="outline" onClick={seedDemo}>
                    Generează date demo (intrare/ieșire/intern + fizic/online)
                  </Button>
                </HStack>
              )}
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Registre ({year})</Text>
                  <Button variant="outline" onClick={loadRegisters}>Reîmprospătează</Button>
                </HStack>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Nume</Th>
                      <Th>Tip</Th>
                      <Th>Status</Th>
                      <Th>Cod</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {registers.filter(r => r.year === year).map(r => (
                      <Tr key={r.id}>
                        <Td>{r.name}</Td>
                        <Td><Badge>{r.type}</Badge></Td>
                        <Td><Badge colorScheme={r.status === 'ACTIVE' ? 'green' : 'gray'}>{r.status}</Badge></Td>
                        <Td>{r.code || '-'}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                  Notă: pentru “mai multe structuri folosesc același registru”, backend-ul are suport prin asocierea registru ↔ departamente.
                </Text>
              </VStack>
            </Box>
          </TabPanel>

          <TabPanel>
            <Box bg={bg} border="1px solid" borderColor={border} borderRadius="xl" p={5}>
              <Text mb={3}>
                Proces oficial „închidere de an”: 
                - blochează registrele active din anul curent (status → ARCHIVED)
                - arhivează lucrările din anul curent (status → ARCHIVED)
                - generează registrele pentru anul următor (Registrul Unic + registre de acte per structură)
                - păstrează istoricul și numerotările.
              </Text>
              {isSuperAdmin ? (
                <Button colorScheme="red" onClick={runRollover}>
                  Rulează închidere de an ({year} → {year + 1})
                </Button>
              ) : (
                <Text color={useColorModeValue('gray.600', 'gray.400')}>
                  Doar SUPER_ADMIN poate rula închiderea de an.
                </Text>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modal recepție LUCRARE */}
      <Modal isOpen={isCreateWorkOpen} onClose={() => setIsCreateWorkOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Recepție lucrare (Registrul Unic) + act</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <FormControl>
                <FormLabel>Registru de acte (evidență document)</FormLabel>
                <Select
                  value={createWorkActsRegisterId}
                  onChange={(e) => setCreateWorkActsRegisterId(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Alege registru de acte"
                >
                  {actsRegisters.filter(r => r.status === 'ACTIVE').map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </Select>
              </FormControl>
              <HStack>
                <FormControl>
                  <FormLabel>Tip lucrare</FormLabel>
                  <Select value={createWorkDirection} onChange={(e) => setCreateWorkDirection(e.target.value as any)}>
                    <option value="IN">Intrare</option>
                    <option value="OUT">Ieșire</option>
                    <option value="INTERNAL">Intern</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Canal recepție</FormLabel>
                  <Select value={createWorkChannel} onChange={(e) => setCreateWorkChannel(e.target.value as any)}>
                    <option value="PHYSICAL">Ghișeu (fizic)</option>
                    <option value="ONLINE">Online</option>
                    <option value="INTERNAL">Intern</option>
                  </Select>
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel>Titlu</FormLabel>
                <Input value={createWorkTitle} onChange={(e) => setCreateWorkTitle(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Descriere</FormLabel>
                <Textarea value={createWorkDescription} onChange={(e) => setCreateWorkDescription(e.target.value)} />
              </FormControl>
              <HStack>
                <FormControl>
                  <FormLabel>Expeditor</FormLabel>
                  <Input value={createWorkSender} onChange={(e) => setCreateWorkSender(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Destinatar</FormLabel>
                  <Input value={createWorkRecipient} onChange={(e) => setCreateWorkRecipient(e.target.value)} />
                </FormControl>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsCreateWorkOpen(false)}>Anulează</Button>
            <Button colorScheme="blue" onClick={createWork}>Recepționează</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal creare ACT */}
      <Modal
        isOpen={isCreateActOpen}
        onClose={() => { setIsCreateActOpen(false); setCreateActForWorkId(null); }}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{createActForWorkId ? 'Act nou (atașat la lucrare)' : 'Act nou (Registru de acte)'}</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <FormControl>
                <FormLabel>Registru de acte</FormLabel>
                <Select value={createActRegisterId} onChange={(e) => setCreateActRegisterId(e.target.value ? Number(e.target.value) : '')}>
                  {actsRegisters.filter(r => r.status === 'ACTIVE').map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </Select>
              </FormControl>
              <HStack>
                <FormControl>
                  <FormLabel>Tip act</FormLabel>
                  <Select value={createActDirection} onChange={(e) => setCreateActDirection(e.target.value as any)}>
                    <option value="IN">Intrare</option>
                    <option value="OUT">Ieșire</option>
                    <option value="INTERNAL">Intern</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Canal</FormLabel>
                  <Select value={createActChannel} onChange={(e) => setCreateActChannel(e.target.value as any)}>
                    <option value="PHYSICAL">Ghișeu (fizic)</option>
                    <option value="ONLINE">Online</option>
                    <option value="INTERNAL">Intern</option>
                  </Select>
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel>Titlu</FormLabel>
                <Input value={createActTitle} onChange={(e) => setCreateActTitle(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Descriere</FormLabel>
                <Textarea value={createActDescription} onChange={(e) => setCreateActDescription(e.target.value)} />
              </FormControl>
              <HStack>
                <FormControl>
                  <FormLabel>Expeditor</FormLabel>
                  <Input value={createActSender} onChange={(e) => setCreateActSender(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Destinatar</FormLabel>
                  <Input value={createActRecipient} onChange={(e) => setCreateActRecipient(e.target.value)} />
                </FormControl>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => { setIsCreateActOpen(false); setCreateActForWorkId(null); }}>Anulează</Button>
            <Button colorScheme="blue" onClick={createAct}>Creează act</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal detalii LUCRARE + fluxuri */}
      <Modal isOpen={isWorkOpen} onClose={() => setIsWorkOpen(false)} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalii lucrare (dosar logic)</ModalHeader>
          <ModalBody>
            {workLoading ? (
              <Text color="gray.500">Se încarcă...</Text>
            ) : !workDetails?.work ? (
              <Text color="gray.500">Nu există date.</Text>
            ) : (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <HStack justify="space-between" align="start">
                    <Box>
                      <Heading size="sm">{workDetails.work.title}</Heading>
                      <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                        <b>{formatWorkNo(workDetails.work)}</b> · {directionBadge(workDetails.work.direction)} · <Badge variant="subtle">{workDetails.work.channel}</Badge> · {statusBadge(workDetails.work.status)}
                      </Text>
                      <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                        Expeditor: <b>{workDetails.work.sender_name || '-'}</b> · Destinatar: <b>{workDetails.work.recipient_name || '-'}</b>
                      </Text>
                    </Box>
                    <Button
                      leftIcon={<FiPlus />}
                      variant="outline"
                      onClick={() => {
                        setCreateActForWorkId(workDetails.work.id);
                        setCreateActRegisterId(typeof selectedActsRegisterId === 'number' ? selectedActsRegisterId : '');
                        setCreateActTitle(workDetails.work.title);
                        setIsCreateActOpen(true);
                      }}
                    >
                      Adaugă act
                    </Button>
                  </HStack>
                </Box>

                <Divider />

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text fontWeight="bold" mb={2}>Repartizare</Text>
                    <HStack>
                      <Select value={assignDepartmentId} onChange={(e) => setAssignDepartmentId(e.target.value ? Number(e.target.value) : '')} placeholder="Alege structură">
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </Select>
                      <Button colorScheme="blue" onClick={assignWork}>Repartizează</Button>
                    </HStack>
                    <Text mt={2} fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                      Flux: <b>RECEIVED → ASSIGNED</b> (audit: cine/când).
                    </Text>
                  </Box>

                  <Box>
                    <Text fontWeight="bold" mb={2}>Circulație internă (transfer)</Text>
                    <VStack align="stretch" spacing={2}>
                      <Select value={transferDepartmentId} onChange={(e) => setTransferDepartmentId(e.target.value ? Number(e.target.value) : '')} placeholder="Structură destinatară">
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </Select>
                      <Input placeholder="Notă transfer (opțional)" value={transferNote} onChange={(e) => setTransferNote(e.target.value)} />
                      <Button variant="outline" onClick={transferWork}>Înregistrează transfer</Button>
                    </VStack>
                    <Text mt={2} fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                      Flux: <b>ASSIGNED/IN_PROGRESS</b> + istoric traseu.
                    </Text>
                  </Box>
                </SimpleGrid>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>Acte asociate</Text>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Nr (ACT)</Th>
                        <Th>Registru</Th>
                        <Th>Tip</Th>
                        <Th>Canal</Th>
                        <Th>Titlu</Th>
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {(workDetails.entries || []).map((e: any) => (
                        <Tr key={e.id}>
                          <Td><Badge variant="outline">{formatActNo(e)}</Badge></Td>
                          <Td>{e.register_name}</Td>
                          <Td>{directionBadge(e.direction)}</Td>
                          <Td><Badge variant="subtle">{e.channel}</Badge></Td>
                          <Td>{e.title}</Td>
                          <Td>{statusBadge(e.status)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>Istoric circulație (traseu)</Text>
                  <VStack align="stretch" spacing={2}>
                    {(workDetails.transfers || []).length === 0 ? (
                      <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Nu există transferuri.</Text>
                    ) : (
                      (workDetails.transfers || []).map((t: any) => (
                        <Box key={t.id} border="1px solid" borderColor={border} borderRadius="md" p={3}>
                          <Text fontSize="sm">
                            <b>{t.from_department_name || '—'}</b> → <b>{t.to_department_name || '—'}</b>
                            {t.note ? ` · ${t.note}` : ''}
                          </Text>
                          <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>
                            {new Date(t.created_at).toLocaleString('ro-RO')}
                          </Text>
                        </Box>
                      ))
                    )}
                  </VStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setIsWorkOpen(false)}>Închide</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}


