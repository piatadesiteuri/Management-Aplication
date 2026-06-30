import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  HStack,
  Icon,
  Badge,
  useColorModeValue,
  Text,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  IconButton,
  useDisclosure,
  useToast,
  VStack,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Avatar,
  Tooltip,
  Switch,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  CheckboxGroup,
  Checkbox,
  Divider,
  Spinner,
  Center,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiMoreVertical,
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiMail,
  FiPhone,
  FiCalendar,
  FiEye,
} from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import UserFormModal from './UserFormModal';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isEmailVerified?: boolean;
  roles: string[];
  departments: string[];
  lastLogin?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

type Role = { id: number; name: string; description?: string | null };
type Department = { id: number; name: string; description?: string | null };
type ActivityLog = {
  id: number;
  created_at: string;
  action_type: string;
  entity_type: string;
  entity_id?: number | null;
  description: string;
  details?: any;
};

const roleColor = (role: string) => {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'red',
    ADMIN: 'red',
    DEPARTMENT_ADMIN: 'purple',
    MANAGER: 'blue',
    INSPECTOR: 'green',
    OPERATOR: 'orange',
    WAREHOUSE_KEEPER: 'teal',
    VIEWER: 'gray',
    GUEST: 'gray',
  };
  return map[role] || 'gray';
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [roleEditUser, setRoleEditUser] = useState<User | null>(null);
  const [roleEditValue, setRoleEditValue] = useState<string>('');
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [viewLogs, setViewLogs] = useState<ActivityLog[]>([]);
  const [viewLogsLoading, setViewLogsLoading] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [editDepartmentIds, setEditDepartmentIds] = useState<number[]>([]);

  const {
    isOpen: isFormOpen,
    onOpen: onFormOpen,
    onClose: onFormClose
  } = useDisclosure();

  const {
    isOpen: isDeleteAlertOpen,
    onOpen: onDeleteAlertOpen,
    onClose: onDeleteAlertClose
  } = useDisclosure();

  const {
    isOpen: isRoleModalOpen,
    onOpen: onRoleModalOpen,
    onClose: onRoleModalClose
  } = useDisclosure();

  const {
    isOpen: isViewModalOpen,
    onOpen: onViewModalOpen,
    onClose: onViewModalClose
  } = useDisclosure();

  const {
    isOpen: isEditModalOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalClose
  } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    void loadUsers();
    void loadRoles();
    void loadDepartments();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const response = await api.get('/auth/users');
      const rows = response.data as any[];

      const mapped: User[] = (rows || []).map((u) => ({
        id: Number(u.id),
        email: u.email,
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        isActive: !!u.isActive,
        isEmailVerified: !!u.isEmailVerified,
        roles: Array.isArray(u.roles) ? u.roles : [],
        departments: Array.isArray(u.departments) ? u.departments : [],
        lastLogin: u.lastLogin ?? null,
        createdAt: u.createdAt ?? null,
        updatedAt: u.updatedAt ?? null,
      }));

      setUsers(mapped);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca utilizatorii.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await api.get('/auth/roles');
      setRoles((response.data || []) as Role[]);
    } catch (error) {
      console.error('Error loading roles:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca rolurile.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments((response.data || []) as Department[]);
    } catch (error) {
      console.error('Error loading departments:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca departamentele.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const loadUserDepartments = async (userId: number): Promise<number[]> => {
    const res = await api.get(`/departments/user/${userId}`);
    const deps = (res.data || []) as Department[];
    return deps.map((d) => Number(d.id));
  };

  const openViewModal = async (user: User) => {
    setViewUser(user);
    setViewLogs([]);
    onViewModalOpen();
    try {
      setViewLogsLoading(true);
      const res = await api.get('/activity-logs', {
        params: { userId: user.id, page: 1, limit: 100 }
      });
      setViewLogs((res.data?.logs || []) as ActivityLog[]);
    } catch (e) {
      console.error('Error loading user activity logs:', e);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca activitățile utilizatorului.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setViewLogsLoading(false);
    }
  };

  const openEditModal = async (user: User, initialTab: number = 0) => {
    setEditUser(user);
    setEditEmail(user.email);
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditRoles(user.roles.length ? user.roles : []);
    try {
      const deptIds = await loadUserDepartments(user.id);
      setEditDepartmentIds(deptIds);
    } catch {
      setEditDepartmentIds([]);
    }
    // folosim modalul, iar tab-ul inițial îl setăm prin state (mai jos)
    setEditTabIndex(initialTab);
    onEditModalOpen();
  };

  const [editTabIndex, setEditTabIndex] = useState(0);

  const saveEdit = async () => {
    if (!editUser) return;
    try {
      setEditSaving(true);

      // 1) detalii user
      await api.put(`/auth/users/${editUser.id}`, {
        email: editEmail,
        firstName: editFirstName,
        lastName: editLastName,
      });

      // 2) roluri (dacă s-au schimbat)
      await api.put(`/auth/users/${editUser.id}/roles`, {
        roles: editRoles.length ? editRoles : ['VIEWER'],
      });

      // 3) departamente
      await api.put(`/auth/users/${editUser.id}/departments`, {
        departmentIds: editDepartmentIds,
      });

      toast({
        title: 'Succes',
        description: 'Utilizatorul a fost actualizat.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      await loadUsers();
      onEditModalClose();
      setEditUser(null);
    } catch (e: any) {
      console.error('Error saving user edits:', e);
      toast({
        title: 'Eroare',
        description: e?.response?.data?.message || 'Nu s-au putut salva modificările.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setEditSaving(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.departments.join(', ').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter ? user.roles.includes(roleFilter) : true;
    const matchesStatus = statusFilter ? 
      (statusFilter === 'active' ? user.isActive : !user.isActive) : true;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleDelete = async (user: User) => {
    try {
      setLoading(true);
      await api.delete(`/auth/users/${user.id}`);
      await loadUsers();
      toast({
        title: 'Succes',
        description: 'Utilizatorul a fost șters cu succes.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onDeleteAlertClose();
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Eroare',
        description: (error as any)?.response?.data?.message || 'Nu s-a putut șterge utilizatorul.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const nextActive = !user.isActive;

      // optimist update
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, isActive: nextActive } : u
      ));

      await api.put(`/auth/users/${user.id}/status`, { isActive: nextActive });
      toast({
        title: 'Succes',
        description: `Utilizatorul a fost ${user.isActive ? 'dezactivat' : 'activat'} cu succes.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      // revert
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, isActive: user.isActive } : u
      ));
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut modifica statusul utilizatorului.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    onFormOpen();
  };

  const handleAdd = () => {
    setSelectedUser(undefined);
    onFormOpen();
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    onDeleteAlertOpen();
  };

  const handleModalSuccess = () => {
    loadUsers();
  };

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const adminUsers = users.filter(u => u.roles.includes('SUPER_ADMIN') || u.roles.includes('ADMIN')).length;
  const recentLogins = users.filter(u => {
    if (!u.lastLogin) return false;
    const lastLogin = new Date(u.lastLogin);
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    return lastLogin > dayAgo;
  }).length;

  const userDepartmentNames = [...new Set(users.flatMap(u => u.departments))];

  const openRoleModal = (user: User) => {
    setRoleEditUser(user);
    // MVP: rol principal = primul rol
    setRoleEditValue(user.roles[0] || '');
    onRoleModalOpen();
  };

  const saveRoleChange = async () => {
    if (!roleEditUser) return;
    if (!roleEditValue) {
      toast({
        title: 'Eroare',
        description: 'Selectează un rol.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      const targetId = roleEditUser.id;
      const prevRoles = roleEditUser.roles;

      // optimist
      setUsers(prev => prev.map(u =>
        u.id === targetId ? { ...u, roles: [roleEditValue] } : u
      ));

      await api.put(`/auth/users/${targetId}/roles`, { roles: [roleEditValue] });

      toast({
        title: 'Succes',
        description: 'Rolul utilizatorului a fost actualizat.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onRoleModalClose();
      setRoleEditUser(null);
      setRoleEditValue('');
    } catch (error) {
      console.error('Error updating user role:', error);
      // reload ca să revenim la starea reală
      await loadUsers();
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut modifica rolul utilizatorului.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box bg={bgColor} p={6} borderRadius="xl" shadow="xl" border="1px solid" borderColor={borderColor}>
        {/* Header */}
        <Flex justify="space-between" align="center" mb={6}>
          <Text fontSize="2xl" fontWeight="bold">
            Gestionare Utilizatori
          </Text>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={handleAdd}
            size="lg"
            borderRadius="xl"
          >
            Adaugă Utilizator
          </Button>
        </Flex>

        {/* Statistici */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
          <Stat
            p={4}
            bg={cardBg}
            borderRadius="lg"
            border="1px solid"
            borderColor={borderColor}
          >
            <StatLabel>
              <HStack>
                <Icon as={FiUsers} color="blue.500" />
                <Text>Total Utilizatori</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="blue.500">{totalUsers}</StatNumber>
            <StatHelpText>În sistem</StatHelpText>
          </Stat>

          <Stat
            p={4}
            bg={cardBg}
            borderRadius="lg"
            border="1px solid"
            borderColor={borderColor}
          >
            <StatLabel>
              <HStack>
                <Icon as={FiUserCheck} color="green.500" />
                <Text>Utilizatori Activi</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="green.500">{activeUsers}</StatNumber>
            <StatHelpText>Din total {totalUsers}</StatHelpText>
          </Stat>

          <Stat
            p={4}
            bg={cardBg}
            borderRadius="lg"
            border="1px solid"
            borderColor={borderColor}
          >
            <StatLabel>
              <HStack>
                <Icon as={FiShield} color="red.500" />
                <Text>Administratori</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="red.500">{adminUsers}</StatNumber>
            <StatHelpText>Privilegii complete</StatHelpText>
          </Stat>

          <Stat
            p={4}
            bg={cardBg}
            borderRadius="lg"
            border="1px solid"
            borderColor={borderColor}
          >
            <StatLabel>
              <HStack>
                <Icon as={FiCalendar} color="purple.500" />
                <Text>Conectări Recente</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="purple.500">{recentLogins}</StatNumber>
            <StatHelpText>Ultimele 24h</StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Filtre */}
        <Flex gap={4} mb={6} wrap="wrap">
          <InputGroup size="lg" flex={1}>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Caută după nume, email sau departament..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="lg"
              borderRadius="xl"
            />
          </InputGroup>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            size="lg"
            borderRadius="xl"
            w="150px"
          >
            <option value="">Toate rolurile</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="lg"
            borderRadius="xl"
            w="120px"
          >
            <option value="">Toate</option>
            <option value="active">Activi</option>
            <option value="inactive">Inactivi</option>
          </Select>
          <IconButton
            aria-label="Reîmprospătează"
            icon={<FiRefreshCw />}
            size="lg"
            borderRadius="xl"
            onClick={loadUsers}
            isLoading={loading}
          />
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            size="lg"
            borderRadius="xl"
            onClick={handleAdd}
          >
            Adaugă Utilizator
          </Button>
        </Flex>

        {/* Tabel Utilizatori */}
        <Box overflowX="auto">
          {filteredUsers.length === 0 ? (
            <Box
              p={8}
              textAlign="center"
              bg={cardBg}
              borderRadius="lg"
              border="2px dashed"
              borderColor={borderColor}
            >
              <FiUsers size={48} color="gray" />
              <Text mt={4} fontSize="lg" color={textColor}>
                Niciun utilizator găsit
              </Text>
              <Text color={textColor}>
                {searchTerm || roleFilter || statusFilter
                  ? 'Încercați să modificați criteriile de căutare'
                  : 'Adăugați primul utilizator pentru a începe'
                }
              </Text>
              {!searchTerm && !roleFilter && !statusFilter && (
                <Button
                  mt={4}
                  leftIcon={<FiPlus />}
                  colorScheme="brand"
                  onClick={handleAdd}
                >
                  Adaugă Utilizator
                </Button>
              )}
            </Box>
          ) : (
            <Table variant="simple" bg={bgColor} borderRadius="lg" overflow="hidden">
              <Thead bg={cardBg}>
                <Tr>
                  <Th>Utilizator</Th>
                  <Th>Contact</Th>
                  <Th>Rol</Th>
                  <Th>Departament</Th>
                  <Th>Status</Th>
                  <Th>Ultima Conectare</Th>
                  <Th>Acțiuni</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredUsers.map((user) => (
                  <Tr
                    key={user.id}
                    _hover={{ bg: hoverBg }}
                    transition="background-color 0.2s"
                  >
                    <Td>
                      <HStack spacing={3}>
                        <Avatar
                          size="sm"
                          name={`${user.firstName} ${user.lastName}`}
                          src={`https://avatars.dicebear.com/api/initials/${user.firstName} ${user.lastName}.svg`}
                        />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="semibold">
                            {user.firstName} {user.lastName}
                          </Text>
                          <Text fontSize="sm" color={textColor}>
                            ID: {user.id}
                          </Text>
                        </VStack>
                      </HStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <HStack>
                          <Icon as={FiMail} size={14} />
                          <Text fontSize="sm">{user.email}</Text>
                        </HStack>
                      </VStack>
                    </Td>
                    <Td>
                      <HStack spacing={2} wrap="wrap">
                        {(user.roles.length ? user.roles : ['(fără rol)']).map((r) => (
                          <Badge
                            key={r}
                            colorScheme={roleColor(r)}
                            px={2}
                            py={1}
                            borderRadius="full"
                          >
                            {r}
                          </Badge>
                        ))}
                      </HStack>
                    </Td>
                    <Td>{user.departments.length ? user.departments.join(', ') : '-'}</Td>
                    <Td>
                      <HStack>
                        <Badge
                          colorScheme={user.isActive ? 'green' : 'red'}
                          px={2}
                          py={1}
                          borderRadius="full"
                        >
                          {user.isActive ? 'Activ' : 'Inactiv'}
                        </Badge>
                        <Switch
                          isChecked={user.isActive}
                          onChange={() => handleToggleStatus(user)}
                          size="sm"
                          colorScheme="green"
                          isDisabled={user.id === Number(currentUser?.id)}
                        />
                      </HStack>
                    </Td>
                    <Td>
                      {user.lastLogin ? (
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm">
                            {new Date(user.lastLogin).toLocaleDateString('ro-RO')}
                          </Text>
                          <Text fontSize="xs" color={textColor}>
                            {new Date(user.lastLogin).toLocaleTimeString('ro-RO')}
                          </Text>
                        </VStack>
                      ) : (
                        <Text fontSize="sm" color={textColor}>
                          Niciodată
                        </Text>
                      )}
                    </Td>
                    <Td>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<FiMoreVertical />}
                          variant="ghost"
                          size="sm"
                        />
                        <MenuList>
                          <MenuItem
                            icon={<FiEye />}
                            onClick={() => openViewModal(user)}
                          >
                            Vizualizează
                          </MenuItem>
                          <MenuItem
                            icon={<FiEdit2 />}
                            onClick={() => openEditModal(user, 0)}
                          >
                            Editează
                          </MenuItem>
                          <MenuItem
                            icon={<FiShield />}
                            onClick={() => openEditModal(user, 1)}
                            isDisabled={user.id === Number(currentUser?.id)}
                          >
                            Schimbă rol
                          </MenuItem>
                                                     <MenuItem
                             icon={<FiTrash2 />}
                             color="red.500"
                             onClick={() => handleDeleteClick(user)}
                             isDisabled={user.id === Number(currentUser?.id)}
                           >
                             Șterge
                           </MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </Box>

             {/* Modal Formular */}
      <UserFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
        user={selectedUser}
        onSuccess={handleModalSuccess}
      />

      {/* Alert Dialog pentru ștergere */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Șterge Utilizator
            </AlertDialogHeader>

            <AlertDialogBody>
              Ești sigur că vrei să ștergi utilizatorul{' '}
              <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong>?
              Această acțiune nu poate fi anulată.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteAlertClose}>
                Anulează
              </Button>
              <Button
                colorScheme="red"
                onClick={() => userToDelete && handleDelete(userToDelete)}
                ml={3}
                isLoading={loading}
              >
                Șterge
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Modal schimbare rol (MVP: un rol principal) */}
      <Modal isOpen={isRoleModalOpen} onClose={() => { onRoleModalClose(); setRoleEditUser(null); }}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Schimbă rol</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <Text fontSize="sm" color={textColor}>
                Utilizator: <strong>{roleEditUser?.email}</strong>
              </Text>
              <Select value={roleEditValue} onChange={(e) => setRoleEditValue(e.target.value)}>
                <option value="">Selectează rol</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </Select>
              <Text fontSize="xs" color={textColor}>
                Notă: momentan setăm un singur rol principal (se poate extinde la roluri multiple).
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => { onRoleModalClose(); setRoleEditUser(null); }}>
              Anulează
            </Button>
            <Button colorScheme="blue" onClick={saveRoleChange} isLoading={loading}>
              Salvează
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Vizualizare: activități utilizator */}
      <Modal isOpen={isViewModalOpen} onClose={() => { onViewModalClose(); setViewUser(null); }} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Activități utilizator</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Text fontSize="sm" color={textColor}>
                Utilizator: <strong>{viewUser?.firstName} {viewUser?.lastName}</strong> ({viewUser?.email})
              </Text>
              <Divider />
              {viewLogsLoading ? (
                <Center py={10}>
                  <Spinner size="lg" />
                </Center>
              ) : (
                <Box overflowX="auto">
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Data</Th>
                        <Th>Acțiune</Th>
                        <Th>Entitate</Th>
                        <Th>Descriere</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {viewLogs.map((log) => (
                        <Tr key={log.id}>
                          <Td>
                            {log.created_at ? new Date(log.created_at).toLocaleString('ro-RO') : '-'}
                          </Td>
                          <Td>
                            <Badge colorScheme="blue">{log.action_type}</Badge>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Badge variant="subtle">{log.entity_type}</Badge>
                              {log.entity_id ? <Badge variant="outline">#{log.entity_id}</Badge> : null}
                            </HStack>
                          </Td>
                          <Td>
                            <Text fontSize="sm">{log.description}</Text>
                          </Td>
                        </Tr>
                      ))}
                      {viewLogs.length === 0 && (
                        <Tr>
                          <Td colSpan={4}>
                            <Text color={textColor}>Nu există activități pentru acest utilizator.</Text>
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => { onViewModalClose(); setViewUser(null); }}>Închide</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Editare: detalii + roluri + departamente */}
      <Modal isOpen={isEditModalOpen} onClose={() => { onEditModalClose(); setEditUser(null); }} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editează utilizator</ModalHeader>
          <ModalBody>
            <Tabs index={editTabIndex} onChange={setEditTabIndex} variant="enclosed">
              <TabList>
                <Tab>Detalii</Tab>
                <Tab>Roluri</Tab>
                <Tab>Departamente</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <VStack align="stretch" spacing={4}>
                    <FormControl>
                      <FormLabel>Email</FormLabel>
                      <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                    </FormControl>
                    <HStack>
                      <FormControl>
                        <FormLabel>Prenume</FormLabel>
                        <Input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Nume</FormLabel>
                        <Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
                      </FormControl>
                    </HStack>
                  </VStack>
                </TabPanel>
                <TabPanel>
                  <VStack align="stretch" spacing={3}>
                    <Text fontSize="sm" color={textColor}>
                      Selectează unul sau mai multe roluri:
                    </Text>
                    <CheckboxGroup
                      value={editRoles}
                      onChange={(v) => setEditRoles(v as string[])}
                    >
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                        {roles.map((r) => (
                          <Checkbox key={r.id} value={r.name}>
                            <HStack>
                              <Badge colorScheme={roleColor(r.name)}>{r.name}</Badge>
                              <Text fontSize="sm" color={textColor}>{r.description || ''}</Text>
                            </HStack>
                          </Checkbox>
                        ))}
                      </SimpleGrid>
                    </CheckboxGroup>
                  </VStack>
                </TabPanel>
                <TabPanel>
                  <VStack align="stretch" spacing={3}>
                    <Text fontSize="sm" color={textColor}>
                      Selectează departamentele utilizatorului:
                    </Text>
                    <CheckboxGroup
                      value={editDepartmentIds.map(String)}
                      onChange={(vals) => setEditDepartmentIds((vals as string[]).map((x) => Number(x)))}
                    >
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                        {departments.map((d) => (
                          <Checkbox key={d.id} value={String(d.id)}>
                            {d.name}
                          </Checkbox>
                        ))}
                      </SimpleGrid>
                    </CheckboxGroup>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => { onEditModalClose(); setEditUser(null); }}>
              Anulează
            </Button>
            <Button colorScheme="blue" onClick={saveEdit} isLoading={editSaving}>
              Salvează
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
} 