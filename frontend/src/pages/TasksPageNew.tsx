import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Center,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableContainer,
  Tabs,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  VStack,
  useColorModeValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiInbox,
  FiMessageSquare,
  FiPause,
  FiPlay,
  FiPlus,
  FiSend,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigned_to: number;
  assigned_by: number;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  assignee_name?: string;
  assignee_email?: string;
  creator_name?: string;
  creator_email?: string;
  comments_count?: number;
}

interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  user_name: string;
  user_email: string;
}

type UITaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type BackendTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type UITaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type BackendTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface TaskFormState {
  title: string;
  description: string;
  assigned_to: string;
  priority: UITaskPriority;
  due_date: string;
}

interface SimpleUser {
  id: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
}

const initialTaskForm: TaskFormState = {
  title: '',
  description: '',
  assigned_to: '',
  priority: 'MEDIUM',
  due_date: '',
};

const mapBackendStatusToUI = (status?: string | null): UITaskStatus => {
  switch ((status || '').toUpperCase()) {
    case 'PENDING':
      return 'TODO';
    case 'IN_PROGRESS':
      return 'IN_PROGRESS';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return 'TODO';
  }
};

const mapUIStatusToBackend = (status: UITaskStatus): BackendTaskStatus => {
  switch (status) {
    case 'TODO':
      return 'PENDING';
    case 'IN_PROGRESS':
    case 'COMPLETED':
    case 'CANCELLED':
    default:
      return status;
  }
};

const mapBackendPriorityToUI = (priority?: string | null): UITaskPriority => {
  switch ((priority || '').toUpperCase()) {
    case 'LOW':
      return 'LOW';
    case 'MEDIUM':
      return 'MEDIUM';
    case 'HIGH':
      return 'HIGH';
    case 'CRITICAL':
      return 'URGENT';
    default:
      return 'MEDIUM';
  }
};

const mapUIPriorityToBackend = (priority: UITaskPriority): BackendTaskPriority => {
  return priority === 'URGENT' ? 'CRITICAL' : priority;
};

const parseUserField = (userField: any) => {
  if (!userField) return null;
  if (typeof userField === 'string') {
    try {
      return JSON.parse(userField);
    } catch {
      return null;
    }
  }
  return userField;
};

const repairEncoding = (value?: string | null) => {
  const nextValue = String(value || '');
  if (!nextValue || !/[ÃÄÅÈÉÊË]/.test(nextValue)) {
    return nextValue;
  }

  try {
    const bytes = Uint8Array.from(Array.from(nextValue).map((character) => character.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder('utf-8').decode(bytes);
    return decoded.includes('�') ? nextValue : decoded;
  } catch {
    return nextValue;
  }
};

const formatUserName = (user?: Partial<SimpleUser> | null) => {
  if (!user) return '';
  const first = user.firstName || user.first_name || '';
  const last = user.lastName || user.last_name || '';
  return repairEncoding(`${first} ${last}`.trim());
};

const buildUserMap = (userList: SimpleUser[] = []) => {
  const map: Record<number, { name: string; email?: string }> = {};
  userList.forEach((user) => {
    if (user?.id) {
      map[user.id] = {
        name: formatUserName(user) || `Utilizator #${user.id}`,
        email: user.email,
      };
    }
  });
  return map;
};

const normalizeTasks = (rawTasks: any[] = [], userMap: Record<number, { name: string; email?: string }>) =>
  rawTasks.map((task) => {
    const assignedToUser = parseUserField(task.assigned_to_user);
    const assignedByUser = parseUserField(task.assigned_by_user);
    const assigneeFromMap = task.assigned_to ? userMap[task.assigned_to] : undefined;
    const creatorFromMap = task.assigned_by ? userMap[task.assigned_by] : undefined;

    return {
      ...task,
      title: repairEncoding(task.title),
      description: repairEncoding(task.description),
      status: mapBackendStatusToUI(task.status),
      priority: mapBackendPriorityToUI(task.priority),
      assignee_name:
        assigneeFromMap?.name ||
        formatUserName(assignedToUser) ||
        (task.assigned_to ? `Utilizator #${task.assigned_to}` : 'Nespecificat'),
      assignee_email: assigneeFromMap?.email || assignedToUser?.email || '',
      creator_name:
        creatorFromMap?.name ||
        formatUserName(assignedByUser) ||
        (task.assigned_by ? `Utilizator #${task.assigned_by}` : 'Nespecificat'),
      creator_email: creatorFromMap?.email || assignedByUser?.email || '',
    } as Task;
  });

const statusMeta: Record<UITaskStatus, { label: string; color: string; icon: any }> = {
  TODO: { label: 'Nouă', color: 'gray', icon: FiClock },
  IN_PROGRESS: { label: 'În lucru', color: 'blue', icon: FiPlay },
  COMPLETED: { label: 'Rezolvată', color: 'green', icon: FiCheckCircle },
  CANCELLED: { label: 'Închisă', color: 'red', icon: FiX },
};

const priorityMeta: Record<UITaskPriority, { label: string; color: string }> = {
  LOW: { label: 'Scăzută', color: 'green' },
  MEDIUM: { label: 'Normală', color: 'yellow' },
  HIGH: { label: 'Ridicată', color: 'orange' },
  URGENT: { label: 'Urgentă', color: 'red' },
};

const formatDate = (value?: string | null, withTime = false) => {
  if (!value) {
    return withTime ? '-' : 'Fără termen';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return withTime ? '-' : 'Fără termen';
  }
  return withTime ? parsed.toLocaleString('ro-RO') : parsed.toLocaleDateString('ro-RO');
};

const isOverdue = (dueDate?: string | null, status?: UITaskStatus) => {
  if (!dueDate || status === 'COMPLETED' || status === 'CANCELLED') {
    return false;
  }
  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return parsed < today;
};

const formatNoteNumber = (id: number) => `NI-${String(id).padStart(6, '0')}`;

const flowSteps = [
  {
    title: '1. Scrii nota',
    description: 'Completezi subiectul si explici pe scurt ce trebuie facut.',
    icon: FiFileText,
    color: 'blue.500',
  },
  {
    title: '2. Alegi persoana',
    description: 'Selectezi colegul care trebuie sa vada si sa preia nota.',
    icon: FiUser,
    color: 'purple.500',
  },
  {
    title: '3. Urmaresti raspunsul',
    description: 'Persoana o vede la Note primite si o poate marca in lucru sau rezolvata.',
    icon: FiCheckCircle,
    color: 'green.500',
  },
];

export default function TasksPageNew() {
  const { user } = useAuth();
  const toast = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UITaskStatus>('ALL');
  const [taskForm, setTaskForm] = useState<TaskFormState>(initialTaskForm);
  const [users, setUsers] = useState<SimpleUser[]>([]);

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const tableHoverBg = useColorModeValue('blue.50', 'whiteAlpha.100');

  useEffect(() => {
    const initialize = async () => {
      const fetchedUsers = await loadUsers();
      await loadTasks(fetchedUsers);
    };
    initialize();
  }, []);

  const loadTasks = async (preloadedUsers?: SimpleUser[]) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwt_token');
      const headers = { Authorization: `Bearer ${token}` };
      const [receivedRes, sentRes] = await Promise.all([
        fetch('/api/tasks/my-tasks?limit=200', { headers }),
        fetch('/api/tasks/created-by-me?limit=200', { headers }),
      ]);

      const userMap = buildUserMap(preloadedUsers || users);
      const merged = new Map<number, ReturnType<typeof normalizeTasks>[number]>();

      for (const response of [receivedRes, sentRes]) {
        if (!response.ok) continue;
        const data = await response.json();
        const rawTasks = Array.isArray(data) ? data : Array.isArray(data?.tasks) ? data.tasks : [];
        for (const task of normalizeTasks(rawTasks, userMap)) {
          merged.set(task.id, task);
        }
      }

      setTasks(Array.from(merged.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca notele interne.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (): Promise<SimpleUser[]> => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        return data;
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
    return [];
  };

  const loadComments = async (taskId: number) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const normalizedComments = (Array.isArray(data) ? data : []).map((comment) => ({
          ...comment,
          comment: repairEncoding(comment.comment),
          user_name: repairEncoding(comment.user_name),
        }));
        setComments(normalizedComments);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    }
  };

  const handleCreateTask = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const payload = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        assigned_to: Number(taskForm.assigned_to),
        priority: mapUIPriorityToBackend(taskForm.priority),
        due_date: taskForm.due_date || null,
        status: 'PENDING',
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create note');
      }

      toast({
        title: 'Notă trimisă',
        description: 'Nota internă a fost înregistrată și alocată utilizatorului selectat.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setTaskForm(initialTaskForm);
      onCreateClose();
      await loadTasks(users);
      window.dispatchEvent(new CustomEvent('internalNoteUpdate'));
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut trimite nota internă.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdateStatus = async (taskId: number, newStatus: UITaskStatus) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: mapUIStatusToBackend(newStatus) }),
      });

      if (!response.ok) {
        throw new Error('Failed to update note');
      }

      toast({
        title: 'Stare actualizată',
        description: 'Starea notei interne a fost actualizată.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });

      await loadTasks(users);
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
      window.dispatchEvent(new CustomEvent('internalNoteUpdate'));
    } catch (error) {
      console.error('Error updating note status:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza starea notei.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddComment = async () => {
    if (!selectedTask || !newComment.trim()) {
      return;
    }

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`/api/tasks/${selectedTask.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment: newComment.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to add note comment');
      }

      setNewComment('');
      await loadComments(selectedTask.id);
      toast({
        title: 'Observație adăugată',
        description: 'Mesajul a fost salvat în istoricul notei.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error adding note comment:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut adăuga observația.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleViewTask = async (task: Task) => {
    setSelectedTask(task);
    await loadComments(task.id);
    onViewOpen();
  };

  const currentUserId = user?.id ? Number(user.id) : undefined;
  const receivedNotes = currentUserId ? tasks.filter((task) => Number(task.assigned_to) === currentUserId) : [];
  const sentNotes = currentUserId ? tasks.filter((task) => Number(task.assigned_by) === currentUserId) : [];

  const filterNotes = (collection: Task[]) =>
    collection.filter((task) => {
      const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
      const searchNeedle = search.trim().toLowerCase();
      if (!searchNeedle) {
        return matchesStatus;
      }

      const haystack = [
        formatNoteNumber(task.id),
        task.title,
        task.description,
        task.creator_name,
        task.assignee_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStatus && haystack.includes(searchNeedle);
    });

  const filteredReceivedNotes = useMemo(() => filterNotes(receivedNotes), [receivedNotes, search, statusFilter]);
  const filteredSentNotes = useMemo(() => filterNotes(sentNotes), [sentNotes, search, statusFilter]);

  const unresolvedReceived = receivedNotes.filter((task) => !['COMPLETED', 'CANCELLED'].includes(task.status)).length;
  const urgentReceived = receivedNotes.filter(
    (task) => ['HIGH', 'URGENT'].includes(task.priority) && !['COMPLETED', 'CANCELLED'].includes(task.status)
  ).length;

  const renderNotesTable = (collection: Task[], type: 'received' | 'sent') => {
    if (collection.length === 0) {
      return (
        <Box textAlign="center" py={12}>
          <Icon as={type === 'received' ? FiInbox : FiSend} boxSize={12} color={mutedTextColor} mb={3} />
          <Text color={mutedTextColor}>
            {type === 'received'
              ? 'Nu există note primite care să corespundă filtrării.'
              : 'Nu există note trimise care să corespundă filtrării.'}
          </Text>
        </Box>
      );
    }

    return (
      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Nr. notă</Th>
              <Th>Subiect</Th>
              <Th>{type === 'received' ? 'Emitent' : 'Destinatar'}</Th>
              <Th>Prioritate</Th>
              <Th>Stare</Th>
              <Th>Termen</Th>
              <Th>Înregistrată</Th>
            </Tr>
          </Thead>
          <Tbody>
            {collection.map((task) => (
              <Tr
                key={task.id}
                cursor="pointer"
                onClick={() => handleViewTask(task)}
                _hover={{ bg: tableHoverBg }}
              >
                <Td fontWeight="semibold">{formatNoteNumber(task.id)}</Td>
                <Td>
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="semibold" color={textColor}>
                      {task.title}
                    </Text>
                    <Text fontSize="xs" color={mutedTextColor} noOfLines={2}>
                      {task.description || 'Fără conținut suplimentar'}
                    </Text>
                  </VStack>
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <Avatar
                      size="xs"
                      name={type === 'received' ? task.creator_name : task.assignee_name}
                    />
                    <Text fontSize="sm">
                      {type === 'received' ? task.creator_name : task.assignee_name}
                    </Text>
                  </HStack>
                </Td>
                <Td>
                  <Badge colorScheme={priorityMeta[task.priority].color}>
                    {priorityMeta[task.priority].label}
                  </Badge>
                </Td>
                <Td>
                  <Badge colorScheme={statusMeta[task.status].color}>
                    {statusMeta[task.status].label}
                  </Badge>
                </Td>
                <Td>
                  <Badge colorScheme={isOverdue(task.due_date, task.status) ? 'red' : 'gray'}>
                    {formatDate(task.due_date)}
                  </Badge>
                </Td>
                <Td>{formatDate(task.created_at)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    );
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <Box p={6} bg={bgColor} minH="100vh">
      <Container maxW="container.xl">
        <VStack spacing={6} align="stretch">
          <Flex justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={4}>
            <VStack align="start" spacing={1}>
              <Heading size="lg" color={textColor}>
                Note interne
              </Heading>
              <Text color={mutedTextColor} fontSize="sm">
                Trimiti usor o nota catre un coleg si vezi clar daca a fost preluata sau rezolvata.
              </Text>
            </VStack>
            <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onCreateOpen}>
              Notă nouă
            </Button>
          </Flex>

          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Heading size="sm" color={textColor}>
                    Cum functioneaza
                  </Heading>
                  <Text fontSize="sm" color={mutedTextColor} mt={1}>
                    Gandeste modulul ca pe un bilet intern simplu, nu ca pe un task complicat.
                  </Text>
                </Box>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  {flowSteps.map((step) => (
                    <Box
                      key={step.title}
                      p={4}
                      border="1px solid"
                      borderColor={borderColor}
                      borderRadius="lg"
                      bg={hoverBg}
                    >
                      <HStack align="start" spacing={3}>
                        <Icon as={step.icon} color={step.color} boxSize={5} mt={0.5} />
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold" color={textColor}>
                            {step.title}
                          </Text>
                          <Text fontSize="sm" color={mutedTextColor}>
                            {step.description}
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>
                  ))}
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>

          <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <HStack>
                    <Icon as={FiInbox} color="blue.500" />
                    <Text fontSize="sm" color={mutedTextColor}>Note primite</Text>
                  </HStack>
                  <Text fontSize="3xl" fontWeight="bold" color={textColor}>
                    {receivedNotes.length}
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <HStack>
                    <Icon as={FiSend} color="purple.500" />
                    <Text fontSize="sm" color={mutedTextColor}>Note trimise</Text>
                  </HStack>
                  <Text fontSize="3xl" fontWeight="bold" color={textColor}>
                    {sentNotes.length}
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <HStack>
                    <Icon as={FiFileText} color="orange.500" />
                    <Text fontSize="sm" color={mutedTextColor}>De urmarit</Text>
                  </HStack>
                  <Text fontSize="3xl" fontWeight="bold" color="orange.500">
                    {unresolvedReceived}
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <HStack>
                    <Icon as={FiAlertCircle} color="red.500" />
                    <Text fontSize="sm" color={mutedTextColor}>Prioritate ridicată</Text>
                  </HStack>
                  <Text fontSize="3xl" fontWeight="bold" color="red.500">
                    {urgentReceived}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <FormControl>
                  <FormLabel>Caută în registru</FormLabel>
                  <Input
                    placeholder="Subiect, emitent, destinatar sau număr notă"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Filtrare stare</FormLabel>
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'ALL' | UITaskStatus)}>
                    <option value="ALL">Toate stările</option>
                    <option value="TODO">Nouă</option>
                    <option value="IN_PROGRESS">În lucru</option>
                    <option value="COMPLETED">Rezolvată</option>
                    <option value="CANCELLED">Închisă</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Observație</FormLabel>
                  <Text fontSize="sm" color={mutedTextColor} pt={2}>
                    Apasa pe o nota ca sa vezi detaliile si sa raspunzi foarte simplu.
                  </Text>
                </FormControl>
              </SimpleGrid>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Tabs colorScheme="blue">
                <TabList>
                  <Tab>
                    <HStack spacing={2}>
                      <Icon as={FiInbox} />
                      <Text>Note primite ({filteredReceivedNotes.length})</Text>
                    </HStack>
                  </Tab>
                  <Tab>
                    <HStack spacing={2}>
                      <Icon as={FiSend} />
                      <Text>Note trimise ({filteredSentNotes.length})</Text>
                    </HStack>
                  </Tab>
                </TabList>

                <TabPanels>
                  <TabPanel px={0} pt={6}>
                    {renderNotesTable(filteredReceivedNotes, 'received')}
                  </TabPanel>
                  <TabPanel px={0} pt={6}>
                    {renderNotesTable(filteredSentNotes, 'sent')}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>
        </VStack>
      </Container>

      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Trimite o nota noua</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Box w="full" p={3} borderRadius="lg" bg={hoverBg} border="1px solid" borderColor={borderColor}>
                <Text fontSize="sm" color={mutedTextColor}>
                  Completezi 3 lucruri: despre ce este nota, cui o trimiti si ce termen are, daca este nevoie.
                </Text>
              </Box>
              <FormControl isRequired>
                <FormLabel>Subiect</FormLabel>
                <Input
                  placeholder="Ex: Actualizare protocol, solicitare document, observație operativă"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Conținutul notei</FormLabel>
                <Textarea
                  placeholder="Scrie simplu ce doresti: contextul, rugamintea sau informarea."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={6}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Trimite către</FormLabel>
                <Select
                  placeholder="Alege persoana"
                  value={taskForm.assigned_to}
                  onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                >
                  {users.map((nextUser) => (
                    <option key={nextUser.id} value={nextUser.id}>
                      {formatUserName(nextUser) || `Utilizator #${nextUser.id}`} {nextUser.email ? `- ${nextUser.email}` : ''}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                <FormControl>
                  <FormLabel>Prioritate</FormLabel>
                  <Select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as UITaskPriority })}
                  >
                    <option value="LOW">Scăzută</option>
                    <option value="MEDIUM">Normală</option>
                    <option value="HIGH">Ridicată</option>
                    <option value="URGENT">Urgentă</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Termen limită</FormLabel>
                  <Input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  />
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Renunță
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateTask}
              isDisabled={!taskForm.title.trim() || !taskForm.description.trim() || !taskForm.assigned_to}
            >
              Trimite nota
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <VStack align="start" spacing={2}>
              <Text>{selectedTask?.title}</Text>
              <HStack spacing={2} flexWrap="wrap">
                {selectedTask && (
                  <>
                    <Badge colorScheme={priorityMeta[selectedTask.priority].color}>
                      {priorityMeta[selectedTask.priority].label}
                    </Badge>
                    <Badge colorScheme={statusMeta[selectedTask.status].color}>
                      {statusMeta[selectedTask.status].label}
                    </Badge>
                    <Badge colorScheme="purple">{formatNoteNumber(selectedTask.id)}</Badge>
                  </>
                )}
              </HStack>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={5} align="stretch">
              <Box p={4} border="1px solid" borderColor={borderColor} borderRadius="lg" bg={hoverBg}>
                <Text fontSize="sm" color={mutedTextColor} mb={2}>
                  Conținutul notei
                </Text>
                <Text whiteSpace="pre-wrap">{selectedTask?.description || 'Fără conținut suplimentar.'}</Text>
              </Box>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box>
                  <Text fontSize="sm" color={mutedTextColor}>Emitent</Text>
                  <HStack mt={1}>
                    <Avatar size="sm" name={selectedTask?.creator_name} />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="semibold">{selectedTask?.creator_name}</Text>
                      {selectedTask?.creator_email && (
                        <Text fontSize="xs" color={mutedTextColor}>{selectedTask.creator_email}</Text>
                      )}
                    </VStack>
                  </HStack>
                </Box>
                <Box>
                  <Text fontSize="sm" color={mutedTextColor}>Destinatar</Text>
                  <HStack mt={1}>
                    <Avatar size="sm" name={selectedTask?.assignee_name} />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="semibold">{selectedTask?.assignee_name}</Text>
                      {selectedTask?.assignee_email && (
                        <Text fontSize="xs" color={mutedTextColor}>{selectedTask.assignee_email}</Text>
                      )}
                    </VStack>
                  </HStack>
                </Box>
                <Box>
                  <Text fontSize="sm" color={mutedTextColor}>Data înregistrării</Text>
                  <Text fontWeight="semibold" mt={1}>{formatDate(selectedTask?.created_at, true)}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color={mutedTextColor}>Termen</Text>
                  <Text
                    fontWeight="semibold"
                    mt={1}
                    color={selectedTask && isOverdue(selectedTask.due_date, selectedTask.status) ? 'red.500' : textColor}
                  >
                    {formatDate(selectedTask?.due_date)}
                  </Text>
                </Box>
              </SimpleGrid>

              <Divider />

              {selectedTask && (selectedTask.status === 'COMPLETED' || selectedTask.status === 'CANCELLED') &&
                (currentUserId === Number(selectedTask.assigned_to) || currentUserId === Number(selectedTask.assigned_by)) && (
                <HStack spacing={2} flexWrap="wrap">
                  <Button leftIcon={<FiPlay />} colorScheme="blue" size="sm" onClick={() => handleUpdateStatus(selectedTask.id, 'IN_PROGRESS')}>
                    Redeschide nota
                  </Button>
                </HStack>
              )}

              {selectedTask && currentUserId === Number(selectedTask.assigned_to) && selectedTask.status !== 'COMPLETED' && selectedTask.status !== 'CANCELLED' && (
                <HStack spacing={2} flexWrap="wrap">
                  {selectedTask.status === 'TODO' && (
                    <Button leftIcon={<FiPlay />} colorScheme="blue" size="sm" onClick={() => handleUpdateStatus(selectedTask.id, 'IN_PROGRESS')}>
                      Am preluat nota
                    </Button>
                  )}
                  {selectedTask.status === 'IN_PROGRESS' && (
                    <Button leftIcon={<FiPause />} colorScheme="yellow" size="sm" onClick={() => handleUpdateStatus(selectedTask.id, 'TODO')}>
                      O las din nou ca noua
                    </Button>
                  )}
                  {(selectedTask.status === 'TODO' || selectedTask.status === 'IN_PROGRESS') && (
                    <Button leftIcon={<FiCheckCircle />} colorScheme="green" size="sm" onClick={() => handleUpdateStatus(selectedTask.id, 'COMPLETED')}>
                      Am rezolvat
                    </Button>
                  )}
                  {(selectedTask.status === 'TODO' || selectedTask.status === 'IN_PROGRESS') && (
                    <Button leftIcon={<FiX />} colorScheme="red" variant="outline" size="sm" onClick={() => handleUpdateStatus(selectedTask.id, 'CANCELLED')}>
                      Inchide fara rezolvare
                    </Button>
                  )}
                </HStack>
              )}

              {selectedTask && currentUserId === Number(selectedTask.assigned_by) && selectedTask.status !== 'COMPLETED' && selectedTask.status !== 'CANCELLED' && (
                <HStack spacing={2}>
                  <Button leftIcon={<FiX />} colorScheme="red" variant="outline" size="sm" onClick={() => handleUpdateStatus(selectedTask.id, 'CANCELLED')}>
                    Inchid nota din partea mea
                  </Button>
                </HStack>
              )}

              <Divider />

              <Box>
                <Text fontWeight="semibold" mb={3}>
                  Observații și răspunsuri ({comments.length})
                </Text>
                <VStack spacing={3} align="stretch" maxH="320px" overflowY="auto">
                  {comments.length === 0 ? (
                    <Box p={4} border="1px dashed" borderColor={borderColor} borderRadius="lg">
                      <Text color={mutedTextColor}>Nu există încă observații pentru această notă.</Text>
                    </Box>
                  ) : (
                    comments.map((comment) => (
                      <Box key={comment.id} p={3} bg={hoverBg} borderRadius="md">
                        <HStack justify="space-between" mb={2}>
                          <HStack>
                            <Avatar size="xs" name={comment.user_name} />
                            <Text fontSize="sm" fontWeight="semibold">
                              {comment.user_name}
                            </Text>
                          </HStack>
                          <Text fontSize="xs" color={mutedTextColor}>
                            {formatDate(comment.created_at, true)}
                          </Text>
                        </HStack>
                        <Text fontSize="sm" whiteSpace="pre-wrap">
                          {comment.comment}
                        </Text>
                      </Box>
                    ))
                  )}
                </VStack>

                <HStack mt={4} align="start">
                  <Textarea
                    placeholder="Scrie un raspuns sau o scurta observatie..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <IconButton
                    aria-label="Trimite observația"
                    icon={<FiMessageSquare />}
                    colorScheme="blue"
                    onClick={handleAddComment}
                    isDisabled={!newComment.trim()}
                  />
                </HStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onViewClose}>Închide</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

