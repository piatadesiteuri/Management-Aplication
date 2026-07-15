import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Switch,
  VStack,
  SimpleGrid,
  useToast,
  Text,
  HStack,
  Icon,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Select,
  NumberInput,
  NumberInputField,
  Textarea,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Checkbox,
  CheckboxGroup,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react';
import {
  FiSettings,
  FiMail,
  FiDatabase,
  FiShield,
  FiGlobe,
  FiClock,
  FiSave,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheck,
  FiUsers,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiMoreVertical,
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import api from '../../services/api';

interface SystemSettings {
  // Setări generale
  organizationName: string;
  organizationAddress: string;
  organizationPhone: string;
  organizationEmail: string;
  
  // Setări email
  emailProvider: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  emailFromAddress: string;
  emailFromName: string;
  
  // Setări securitate
  sessionTimeout: number;
  passwordMinLength: number;
  requirePasswordChange: boolean;
  enableTwoFactor: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
  
  // Setări sistem
  maintenanceMode: boolean;
  debugMode: boolean;
  logLevel: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  backupFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  retentionPeriod: number;
  
  // Setări notificări
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  notifyOnSystemErrors: boolean;
  notifyOnUserActions: boolean;
}

const initialSettings: SystemSettings = {
  organizationName: 'Direcția de Sănătate Publică Dolj',
  organizationAddress: 'Str. Calea Bucuresti, Nr. 99, Craiova, Dolj',
  organizationPhone: '+40251234567',
  organizationEmail: 'office@dsp-dolj.ro',
  
  emailProvider: 'SMTP',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
  emailFromAddress: 'noreply@dsp-dolj.ro',
  emailFromName: 'DSP Dolj',
  
  sessionTimeout: 30,
  passwordMinLength: 6,
  requirePasswordChange: false,
  enableTwoFactor: false,
  maxLoginAttempts: 5,
  lockoutDuration: 15,
  
  maintenanceMode: false,
  debugMode: false,
  logLevel: 'INFO',
  backupFrequency: 'DAILY',
  retentionPeriod: 30,
  
  enableEmailNotifications: true,
  enableSmsNotifications: false,
  notifyOnSystemErrors: true,
  notifyOnUserActions: false,
};

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const toast = useToast();
  const [roles, setRoles] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [permissionCatalog, setPermissionCatalog] = useState<any[]>([]);

  // Modals
  const { isOpen: isRoleModalOpen, onOpen: onRoleModalOpen, onClose: onRoleModalClose } = useDisclosure();
  const { isOpen: isGroupModalOpen, onOpen: onGroupModalOpen, onClose: onGroupModalClose } = useDisclosure();
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] as string[] });
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    loadSettings();
    loadRoles();
    loadPermissionCatalog();
    loadUserGroups();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Simulez încărcarea setărilor
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Setările sunt deja în initialSettings
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca setările sistemului.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Simulez salvarea setărilor
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setLastSaved(new Date().toLocaleString('ro-RO'));
      toast({
        title: 'Succes',
        description: 'Setările au fost salvate cu succes.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut salva setările.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      setTestingEmail(true);
      
      // Simulez testarea email-ului
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Test Email',
        description: 'Email-ul de test a fost trimis cu succes.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error testing email:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut trimite email-ul de test.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleChange = (field: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Funcții pentru roluri
  const loadRoles = async () => {
    try {
      const res = await api.get('/auth/roles');
      setRoles(res.data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadPermissionCatalog = async () => {
    try {
      const res = await api.get('/auth/permissions/catalog');
      setPermissionCatalog(res.data || []);
    } catch (error) {
      console.error('Error loading permission catalog:', error);
    }
  };

  const handleCreateRole = async () => {
    try {
      await api.post('/auth/roles', newRole);
      toast({ title: 'Succes', description: 'Rolul a fost creat.', status: 'success', duration: 3000, isClosable: true });
      setNewRole({ name: '', description: '', permissions: [] });
      onRoleModalClose();
      await loadRoles();
    } catch (error: any) {
      toast({ title: 'Eroare', description: error?.response?.data?.message || 'Nu s-a putut crea rolul.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    try {
      await api.put(`/auth/roles/${selectedRole.id}`, {
        name: selectedRole.name,
        description: selectedRole.description,
        permissions: selectedRole.permissions || [],
      });
      toast({ title: 'Succes', description: 'Rolul a fost actualizat.', status: 'success', duration: 3000, isClosable: true });
      setSelectedRole(null);
      onRoleModalClose();
      await loadRoles();
    } catch (error: any) {
      toast({ title: 'Eroare', description: error?.response?.data?.message || 'Nu s-a putut actualiza rolul.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  // Funcții pentru grupuri utilizatori
  const loadUserGroups = async () => {
    try {
      const res = await api.get('/auth/user-groups');
      setUserGroups(res.data || []);
    } catch (error) {
      console.error('Error loading user groups:', error);
    }
  };

  const handleCreateGroup = async () => {
    try {
      await api.post('/auth/user-groups', newGroup);
      toast({ title: 'Succes', description: 'Grupul a fost creat.', status: 'success', duration: 3000, isClosable: true });
      setNewGroup({ name: '', description: '' });
      onGroupModalClose();
      await loadUserGroups();
    } catch (error: any) {
      toast({ title: 'Eroare', description: error?.response?.data?.message || 'Nu s-a putut crea grupul.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;
    try {
      await api.put(`/auth/user-groups/${selectedGroup.id}`, { name: selectedGroup.name, description: selectedGroup.description });
      toast({ title: 'Succes', description: 'Grupul a fost actualizat.', status: 'success', duration: 3000, isClosable: true });
      setSelectedGroup(null);
      onGroupModalClose();
      await loadUserGroups();
    } catch (error: any) {
      toast({ title: 'Eroare', description: error?.response?.data?.message || 'Nu s-a putut actualiza grupul.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  return (
    <Box bg={bgColor} p={6} borderRadius="xl" shadow="xl" border="1px solid" borderColor={borderColor}>
      {/* Header */}
      <HStack justify="space-between" align="center" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">
          <HStack>
            <Icon as={FiSettings} color="brand.500" />
            <Text>Setări Sistem</Text>
          </HStack>
        </Text>
        <HStack>
          {lastSaved && (
            <Text fontSize="sm" color="gray.500">
              Ultima salvare: {lastSaved}
            </Text>
          )}
          <Button
            leftIcon={<FiRefreshCw />}
            variant="ghost"
            onClick={loadSettings}
            isLoading={loading}
          >
            Reîncarcă
          </Button>
          <Button
            leftIcon={<FiSave />}
            colorScheme="brand"
            onClick={handleSave}
            isLoading={loading}
            loadingText="Se salvează..."
          >
            Salvează Setările
          </Button>
        </HStack>
      </HStack>

      {/* Tabs */}
      <Tabs colorScheme="blue" variant="enclosed">
        <TabList>
          <Tab>
            <HStack spacing={2}>
              <Icon as={FiGlobe} />
              <Text>Configurare</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={2}>
              <Icon as={FiShield} />
              <Text>Roluri</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={2}>
              <Icon as={FiUsers} />
              <Text>Grupuri</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* Tab 1: Setări Sistem (conținutul existent) */}
          <TabPanel px={0}>

      {/* Alertă mod mentenanță */}
      {settings.maintenanceMode && (
        <Alert status="warning" mb={6} borderRadius="lg">
          <AlertIcon />
          <Box>
            <AlertTitle>Modul Mentenanță Activat!</AlertTitle>
            <AlertDescription>
              Sistemul este în modul mentenanță. Utilizatorii nu se pot conecta.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      <VStack spacing={6}>
        {/* Setări Organizație */}
        <Card w="full" bg={cardBg} border="1px solid" borderColor={borderColor}>
          <CardHeader>
            <Text fontSize="lg" fontWeight="semibold">
              <HStack>
                <Icon as={FiGlobe} color="blue.500" />
                <Text>Informații Organizație</Text>
              </HStack>
            </Text>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel>Nume Organizație</FormLabel>
                <Input
                  value={settings.organizationName}
                  onChange={(e) => handleChange('organizationName', e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Email Organizație</FormLabel>
                <Input
                  type="email"
                  value={settings.organizationEmail}
                  onChange={(e) => handleChange('organizationEmail', e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Telefon Organizație</FormLabel>
                <Input
                  value={settings.organizationPhone}
                  onChange={(e) => handleChange('organizationPhone', e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Adresa Organizației</FormLabel>
                <Textarea
                  value={settings.organizationAddress}
                  onChange={(e) => handleChange('organizationAddress', e.target.value)}
                  rows={3}
                />
              </FormControl>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Setări Email */}
        <Card w="full" bg={cardBg} border="1px solid" borderColor={borderColor}>
          <CardHeader>
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="semibold">
                <HStack>
                  <Icon as={FiMail} color="green.500" />
                  <Text>Configurare Email</Text>
                </HStack>
              </Text>
              <Button
                size="sm"
                colorScheme="green"
                onClick={handleTestEmail}
                isLoading={testingEmail}
                loadingText="Se testează..."
              >
                Testează Email
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel>Host SMTP</FormLabel>
                <Input
                  value={settings.smtpHost}
                  onChange={(e) => handleChange('smtpHost', e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Port SMTP</FormLabel>
                <NumberInput
                  value={settings.smtpPort}
                  onChange={(_, value) => handleChange('smtpPort', value)}
                  min={1}
                  max={65535}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Utilizator SMTP</FormLabel>
                <Input
                  value={settings.smtpUser}
                  onChange={(e) => handleChange('smtpUser', e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Parolă SMTP</FormLabel>
                <Input
                  type="password"
                  value={settings.smtpPassword}
                  onChange={(e) => handleChange('smtpPassword', e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Adresă Expeditor</FormLabel>
                <Input
                  type="email"
                  value={settings.emailFromAddress}
                  onChange={(e) => handleChange('emailFromAddress', e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Nume Expeditor</FormLabel>
                <Input
                  value={settings.emailFromName}
                  onChange={(e) => handleChange('emailFromName', e.target.value)}
                />
              </FormControl>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Setări Securitate */}
        <Card w="full" bg={cardBg} border="1px solid" borderColor={borderColor}>
          <CardHeader>
            <Text fontSize="lg" fontWeight="semibold">
              <HStack>
                <Icon as={FiShield} color="red.500" />
                <Text>Setări Securitate</Text>
              </HStack>
            </Text>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel>Timeout Sesiune (minute)</FormLabel>
                <NumberInput
                  value={settings.sessionTimeout}
                  onChange={(_, value) => handleChange('sessionTimeout', value)}
                  min={5}
                  max={480}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Lungime Minimă Parolă</FormLabel>
                <NumberInput
                  value={settings.passwordMinLength}
                  onChange={(_, value) => handleChange('passwordMinLength', value)}
                  min={4}
                  max={20}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Încercări Maxime Login</FormLabel>
                <NumberInput
                  value={settings.maxLoginAttempts}
                  onChange={(_, value) => handleChange('maxLoginAttempts', value)}
                  min={3}
                  max={10}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Durată Blocare (minute)</FormLabel>
                <NumberInput
                  value={settings.lockoutDuration}
                  onChange={(_, value) => handleChange('lockoutDuration', value)}
                  min={5}
                  max={60}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Schimbare Parolă Obligatorie</FormLabel>
                <Switch
                  isChecked={settings.requirePasswordChange}
                  onChange={(e) => handleChange('requirePasswordChange', e.target.checked)}
                  colorScheme="red"
                />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Autentificare în Două Pași</FormLabel>
                <Switch
                  isChecked={settings.enableTwoFactor}
                  onChange={(e) => handleChange('enableTwoFactor', e.target.checked)}
                  colorScheme="red"
                />
              </FormControl>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Setări Sistem */}
        <Card w="full" bg={cardBg} border="1px solid" borderColor={borderColor}>
          <CardHeader>
            <Text fontSize="lg" fontWeight="semibold">
              <HStack>
                <Icon as={FiDatabase} color="purple.500" />
                <Text>Setări Sistem</Text>
              </HStack>
            </Text>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel>Nivel Log</FormLabel>
                <Select
                  value={settings.logLevel}
                  onChange={(e) => handleChange('logLevel', e.target.value)}
                >
                  <option value="ERROR">ERROR</option>
                  <option value="WARN">WARN</option>
                  <option value="INFO">INFO</option>
                  <option value="DEBUG">DEBUG</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Frecvență Backup</FormLabel>
                <Select
                  value={settings.backupFrequency}
                  onChange={(e) => handleChange('backupFrequency', e.target.value)}
                >
                  <option value="DAILY">Zilnic</option>
                  <option value="WEEKLY">Săptămânal</option>
                  <option value="MONTHLY">Lunar</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Perioadă Retenție (zile)</FormLabel>
                <NumberInput
                  value={settings.retentionPeriod}
                  onChange={(_, value) => handleChange('retentionPeriod', value)}
                  min={7}
                  max={365}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Mod Mentenanță</FormLabel>
                <Switch
                  isChecked={settings.maintenanceMode}
                  onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                  colorScheme="orange"
                />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Mod Debug</FormLabel>
                <Switch
                  isChecked={settings.debugMode}
                  onChange={(e) => handleChange('debugMode', e.target.checked)}
                  colorScheme="yellow"
                />
              </FormControl>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Setări Notificări */}
        <Card w="full" bg={cardBg} border="1px solid" borderColor={borderColor}>
          <CardHeader>
            <Text fontSize="lg" fontWeight="semibold">
              <HStack>
                <Icon as={FiClock} color="orange.500" />
                <Text>Setări Notificări</Text>
              </HStack>
            </Text>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Notificări Email</FormLabel>
                <Switch
                  isChecked={settings.enableEmailNotifications}
                  onChange={(e) => handleChange('enableEmailNotifications', e.target.checked)}
                  colorScheme="blue"
                />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Notificări SMS</FormLabel>
                <Switch
                  isChecked={settings.enableSmsNotifications}
                  onChange={(e) => handleChange('enableSmsNotifications', e.target.checked)}
                  colorScheme="blue"
                />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Notificare Erori Sistem</FormLabel>
                <Switch
                  isChecked={settings.notifyOnSystemErrors}
                  onChange={(e) => handleChange('notifyOnSystemErrors', e.target.checked)}
                  colorScheme="red"
                />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Notificare Acțiuni Utilizatori</FormLabel>
                <Switch
                  isChecked={settings.notifyOnUserActions}
                  onChange={(e) => handleChange('notifyOnUserActions', e.target.checked)}
                  colorScheme="green"
                />
              </FormControl>
            </SimpleGrid>
          </CardBody>
        </Card>
          </VStack>
          </TabPanel>

          {/* Tab 2: Roluri */}
          <TabPanel px={0}>
            <VStack align="stretch" spacing={4}>
              <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Text fontSize="lg" fontWeight="semibold">Roluri Sistem</Text>
                    <Button leftIcon={<FiPlus />} colorScheme="blue" size="sm" onClick={() => { setSelectedRole(null); setNewRole({ name: '', description: '', permissions: [] }); onRoleModalOpen(); }}>
                      Adaugă Rol
                    </Button>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <TableContainer>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Nume</Th>
                          <Th>Descriere</Th>
                          <Th>Permisiuni</Th>
                          <Th>Acțiuni</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {roles.map((role) => (
                          <Tr key={role.id}>
                            <Td><Badge colorScheme="blue">{role.name}</Badge></Td>
                            <Td>{role.description || '-'}</Td>
                            <Td>{Array.isArray(role.permissions) ? role.permissions.length : 0}</Td>
                            <Td>
                              <Menu>
                                <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="ghost" size="sm" />
                                <MenuList>
                                  <MenuItem icon={<FiEdit2 />} onClick={() => { setSelectedRole(role); onRoleModalOpen(); }}>
                                    Editează
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Tab 3: Grupuri */}
          <TabPanel px={0}>
            <VStack align="stretch" spacing={4}>
              <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Text fontSize="lg" fontWeight="semibold">Grupuri Utilizatori</Text>
                    <Button leftIcon={<FiPlus />} colorScheme="blue" size="sm" onClick={() => { setSelectedGroup(null); setNewGroup({ name: '', description: '' }); onGroupModalOpen(); }}>
                      Adaugă Grup
                    </Button>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <TableContainer>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Nume</Th>
                          <Th>Descriere</Th>
                          <Th>Utilizatori</Th>
                          <Th>Acțiuni</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {userGroups.map((group) => (
                          <Tr key={group.id}>
                            <Td><Badge colorScheme="green">{group.name}</Badge></Td>
                            <Td>{group.description || '-'}</Td>
                            <Td>{group.user_count || 0}</Td>
                            <Td>
                              <Menu>
                                <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="ghost" size="sm" />
                                <MenuList>
                                  <MenuItem icon={<FiEdit2 />} onClick={() => { setSelectedGroup(group); onGroupModalOpen(); }}>
                                    Editează
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modal Creare/Editare Rol */}
      <Modal isOpen={isRoleModalOpen} onClose={onRoleModalClose} size="3xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedRole ? 'Editează Rol' : 'Adaugă Rol Nou'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <FormControl>
                <FormLabel>Nume Rol</FormLabel>
                <Input value={selectedRole?.name || newRole.name} onChange={(e) => selectedRole ? setSelectedRole({ ...selectedRole, name: e.target.value }) : setNewRole({ ...newRole, name: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Descriere</FormLabel>
                <Textarea value={selectedRole?.description || newRole.description} onChange={(e) => selectedRole ? setSelectedRole({ ...selectedRole, description: e.target.value }) : setNewRole({ ...newRole, description: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Permisiuni module</FormLabel>
                <CheckboxGroup
                  value={selectedRole?.permissions || newRole.permissions}
                  onChange={(values) => {
                    const nextPermissions = values.map(String);
                    if (selectedRole) {
                      setSelectedRole({ ...selectedRole, permissions: nextPermissions });
                    } else {
                      setNewRole({ ...newRole, permissions: nextPermissions });
                    }
                  }}
                >
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                    {permissionCatalog.map((permission) => (
                      <Checkbox key={permission.code} value={permission.code}>
                        {permission.label}
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </CheckboxGroup>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRoleModalClose}>Anulează</Button>
            <Button colorScheme="blue" onClick={selectedRole ? handleUpdateRole : handleCreateRole}>
              Salvează
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Creare/Editare Grup */}
      <Modal isOpen={isGroupModalOpen} onClose={onGroupModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedGroup ? 'Editează Grup' : 'Adaugă Grup Nou'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <FormControl>
                <FormLabel>Nume Grup</FormLabel>
                <Input value={selectedGroup?.name || newGroup.name} onChange={(e) => selectedGroup ? setSelectedGroup({ ...selectedGroup, name: e.target.value }) : setNewGroup({ ...newGroup, name: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Descriere</FormLabel>
                <Textarea value={selectedGroup?.description || newGroup.description} onChange={(e) => selectedGroup ? setSelectedGroup({ ...selectedGroup, description: e.target.value }) : setNewGroup({ ...newGroup, description: e.target.value })} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onGroupModalClose}>Anulează</Button>
            <Button colorScheme="blue" onClick={selectedGroup ? handleUpdateGroup : handleCreateGroup}>
              Salvează
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 