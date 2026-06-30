import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  Badge,
  IconButton,
  useColorModeValue,
  useToast,
  Spinner,
  Center,
  Flex,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  useDisclosure,
  ButtonGroup,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Textarea,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Tooltip,
  Icon,
  Avatar,
  Divider,
  Collapse,
  Fade,
  ScaleFade,
  SlideFade,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiClock,
  FiCheckCircle,
  FiUser,
  FiCalendar,
  FiMenu,
  FiSquare,
  FiPlay,
  FiX,
  FiEdit,
  FiMessageSquare,
  FiAlertTriangle,
  FiCheck,
  FiArrowLeft,
  FiArrowRight,
  FiFilter,
  FiEye,
  FiTrendingUp,
  FiTrendingDown,
} from 'react-icons/fi';
import TaskService, { Task, TaskStats, TaskFilters } from '../services/TaskService';
import { useAuth } from '../hooks/useAuth';
import CreateTaskModal from '../components/tasks/CreateTaskModal';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(8);
  
  // State pentru acțiuni
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  // Modals
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isActionModalOpen, 
    onOpen: onActionModalOpen, 
    onClose: onActionModalClose 
  } = useDisclosure();
  const { 
    isOpen: isCommentModalOpen, 
    onOpen: onCommentModalOpen, 
    onClose: onCommentModalClose 
  } = useDisclosure();
  
  const { user } = useAuth();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    loadData();
  }, [filters, activeTab, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const pageFilters = { ...filters, page: currentPage, limit: itemsPerPage };
      
      let taskData;
      if (activeTab === 'my-tasks') {
        taskData = await TaskService.getMyTasks(pageFilters);
      } else if (activeTab === 'created-by-me') {
        taskData = await TaskService.getTasksCreatedByMe(pageFilters);
      } else {
        taskData = await TaskService.getTasks(pageFilters);
      }
      
      setTasks(taskData.tasks);
      setTotalPages(Math.ceil(taskData.total / itemsPerPage));
      
      // Încarcă statisticile
      const statsData = await TaskService.getTaskStats(user?.id ? Number(user.id) : undefined);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca task-urile',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    setSelectedTask(tasks.find(t => t.id === taskId) || null);
    onActionModalOpen();
  };

  const confirmStatusChange = async (newStatus: string) => {
    if (!selectedTask) return;
    
    console.log('🔄 confirmStatusChange called with:', { taskId: selectedTask.id, newStatus });
    setActionLoading(true);
    
    try {
      let updatedTask;
      let actionMessage = '';
      
      switch (newStatus) {
        case 'IN_PROGRESS':
          console.log('🚀 Starting task:', selectedTask.id);
          updatedTask = await TaskService.startTask(selectedTask.id);
          actionMessage = 'Task-ul a fost început cu succes!';
          break;
        case 'COMPLETED':
          console.log('✅ Completing task:', selectedTask.id);
          updatedTask = await TaskService.completeTask(selectedTask.id);
          actionMessage = 'Task-ul a fost completat cu succes!';
          break;
        case 'CANCELLED':
          console.log('❌ Cancelling task:', selectedTask.id);
          updatedTask = await TaskService.cancelTask(selectedTask.id);
          actionMessage = 'Task-ul a fost anulat!';
          break;
        default:
          console.log('🔄 Updating task status:', selectedTask.id, newStatus);
          updatedTask = await TaskService.updateTask(selectedTask.id, { status: newStatus as any });
          actionMessage = 'Statusul task-ului a fost actualizat!';
      }
      
      console.log('✅ Task updated successfully:', updatedTask);
      setTasks(tasks.map(task => task.id === selectedTask.id ? updatedTask : task));
      
      toast({
        title: 'Succes',
        description: actionMessage,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      loadData(); // Reîncarcă statisticile
      onActionModalClose();
    } catch (error) {
      console.error('❌ Error updating task:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza task-ul',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedTask || !commentText.trim()) return;
    
    setActionLoading(true);
    
    try {
      await TaskService.addTaskComment(selectedTask.id, commentText.trim());
      
      toast({
        title: 'Succes',
        description: 'Comentariul a fost adăugat cu succes!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setCommentText('');
      onCommentModalClose();
      loadData();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut adăuga comentariul',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    return TaskService.getPriorityColor(priority);
  };

  const getStatusColor = (status: string) => {
    return TaskService.getStatusColor(status);
  };

  const getPriorityLabel = (priority: string) => {
    return TaskService.getPriorityLabel(priority);
  };

  const getStatusLabel = (status: string) => {
    return TaskService.getStatusLabel(status);
  };

  const formatDueDate = (dueDate: string) => {
    return TaskService.formatDueDate(dueDate);
  };

  const isOverdue = (task: Task) => {
    return TaskService.isOverdue(task);
  };

  const isDueToday = (task: Task) => {
    return TaskService.isDueToday(task);
  };

  if (loading) {
    return (
      <Center py={10}>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color="gray.500" fontSize="lg">Se încarcă task-urile...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={6}>
      {/* Header */}
      <Box mb={6}>
        <Text fontSize="3xl" fontWeight="bold" mb={2}>Gestionare Task-uri</Text>
        <Text color="gray.500">Delegare și urmărire sarcinilor în sistem</Text>
      </Box>

      {/* Statistici */}
      {stats && (
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} mb={6}>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor} _hover={{ transform: 'translateY(-2px)', transition: 'all 0.3s ease' }}>
            <CardBody>
              <Stat>
                <StatLabel>Total Task-uri</StatLabel>
                <StatNumber color="blue.500">{stats.total}</StatNumber>
                <StatHelpText>Toate task-urile</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} border="1px solid" borderColor={borderColor} _hover={{ transform: 'translateY(-2px)', transition: 'all 0.3s ease' }}>
            <CardBody>
              <Stat>
                <StatLabel>În Așteptare</StatLabel>
                <StatNumber color="yellow.500">{stats.pending}</StatNumber>
                <StatHelpText>Necesită atenție</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} border="1px solid" borderColor={borderColor} _hover={{ transform: 'translateY(-2px)', transition: 'all 0.3s ease' }}>
            <CardBody>
              <Stat>
                <StatLabel>În Progres</StatLabel>
                <StatNumber color="blue.500">{stats.in_progress}</StatNumber>
                <StatHelpText>În lucru</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} border="1px solid" borderColor={borderColor} _hover={{ transform: 'translateY(-2px)', transition: 'all 0.3s ease' }}>
            <CardBody>
              <Stat>
                <StatLabel>Completate</StatLabel>
                <StatNumber color="green.500">{stats.completed}</StatNumber>
                <StatHelpText>Finalizate</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} border="1px solid" borderColor={borderColor} _hover={{ transform: 'translateY(-2px)', transition: 'all 0.3s ease' }}>
            <CardBody>
              <Stat>
                <StatLabel>Întârziate</StatLabel>
                <StatNumber color="red.500">{stats.overdue}</StatNumber>
                <StatHelpText>Necesită acțiune</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} border="1px solid" borderColor={borderColor} _hover={{ transform: 'translateY(-2px)', transition: 'all 0.3s ease' }}>
            <CardBody>
              <Stat>
                <StatLabel>Astăzi</StatLabel>
                <StatNumber color="orange.500">{stats.due_today}</StatNumber>
                <StatHelpText>Termen limită</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>
      )}

      {/* Tabs și Filtre */}
      <Tabs variant="enclosed" colorScheme="blue" index={activeTab === 'all' ? 0 : activeTab === 'my-tasks' ? 1 : 2} onChange={(index) => setActiveTab(index === 0 ? 'all' : index === 1 ? 'my-tasks' : 'created-by-me')}>
        <TabList>
          <Tab>
            <HStack>
              <FiMenu />
              <Text>Toate Task-urile ({tasks.length})</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <FiUser />
              <Text>Task-urile Mele</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <FiPlus />
              <Text>Create de Mine</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <TaskList 
              tasks={tasks}
              viewMode={viewMode}
              setViewMode={setViewMode}
              filters={filters}
              setFilters={setFilters}
              onStatusChange={handleStatusChange}
              onRefresh={loadData}
              onOpen={onOpen}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </TabPanel>
          <TabPanel>
            <TaskList 
              tasks={tasks}
              viewMode={viewMode}
              setViewMode={setViewMode}
              filters={filters}
              setFilters={setFilters}
              onStatusChange={handleStatusChange}
              onRefresh={loadData}
              onOpen={onOpen}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </TabPanel>
          <TabPanel>
            <TaskList 
              tasks={tasks}
              viewMode={viewMode}
              setViewMode={setViewMode}
              filters={filters}
              setFilters={setFilters}
              onStatusChange={handleStatusChange}
              onRefresh={loadData}
              onOpen={onOpen}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <CreateTaskModal isOpen={isOpen} onClose={onClose} onTaskCreated={loadData} />

      {/* Modal pentru confirmarea acțiunilor */}
      <Modal isOpen={isActionModalOpen} onClose={onActionModalClose} size="md">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="xl">
          <ModalHeader>
            <HStack>
              <Icon as={FiAlertTriangle} color="orange.500" />
              <Text>Confirmă Acțiunea</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTask && (
              <VStack spacing={4} align="stretch">
                <Alert status="info" borderRadius="lg">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Task: {selectedTask.title}</AlertTitle>
                    <AlertDescription>
                      Ești sigur că vrei să schimbi statusul acestui task?
                    </AlertDescription>
                  </Box>
                </Alert>
                
                <Box p={4} bg={cardBg} borderRadius="lg">
                  <Text fontWeight="bold" mb={2}>Acțiuni disponibile:</Text>
                  <VStack spacing={2} align="stretch">
                    {selectedTask.status === 'PENDING' && (
                      <Button
                        leftIcon={<FiPlay />}
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => confirmStatusChange('IN_PROGRESS')}
                        isLoading={actionLoading}
                      >
                        Începe Task-ul
                      </Button>
                    )}
                    {selectedTask.status === 'IN_PROGRESS' && (
                      <Button
                        leftIcon={<FiCheck />}
                        colorScheme="green"
                        variant="outline"
                        onClick={() => confirmStatusChange('COMPLETED')}
                        isLoading={actionLoading}
                      >
                        Completează Task-ul
                      </Button>
                    )}
                    {selectedTask.status !== 'COMPLETED' && selectedTask.status !== 'CANCELLED' && (
                      <Button
                        leftIcon={<FiX />}
                        colorScheme="red"
                        variant="outline"
                        onClick={() => confirmStatusChange('CANCELLED')}
                        isLoading={actionLoading}
                      >
                        Anulează Task-ul
                      </Button>
                    )}
                  </VStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal pentru comentarii */}
      <Modal isOpen={isCommentModalOpen} onClose={onCommentModalClose} size="lg">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="xl">
          <ModalHeader>
            <HStack>
              <Icon as={FiMessageSquare} color="blue.500" />
              <Text>Adaugă Comentariu</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTask && (
              <VStack spacing={4} align="stretch">
                <Box p={4} bg={cardBg} borderRadius="lg">
                  <Text fontWeight="bold">{selectedTask.title}</Text>
                  <Text color="gray.600" fontSize="sm">{selectedTask.description}</Text>
                </Box>
                
                <FormControl>
                  <FormLabel>Comentariul tău</FormLabel>
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Scrie un comentariu despre progresul task-ului..."
                    rows={4}
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="outline" onClick={onCommentModalClose}>
                Anulează
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleAddComment}
                isLoading={actionLoading}
                isDisabled={!commentText.trim()}
              >
                Adaugă Comentariu
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

interface TaskListProps {
  tasks: Task[];
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  onStatusChange: (taskId: number, status: string) => void;
  onRefresh: () => void;
  onOpen: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function TaskList({ 
  tasks, 
  viewMode, 
  setViewMode, 
  filters, 
  setFilters, 
  onStatusChange, 
  onRefresh,
  onOpen,
  currentPage,
  totalPages,
  onPageChange
}: TaskListProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box>
      {/* Filtre și Controale */}
      <Flex gap={4} mb={4} wrap="wrap" align="center">
        <InputGroup maxW="300px">
          <InputLeftElement>
            <FiSearch />
          </InputLeftElement>
          <Input 
            placeholder="Caută task-uri..." 
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </InputGroup>
        
        <Select 
          maxW="150px" 
          value={filters.status || ''} 
          onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
        >
          <option value="">Toate statusurile</option>
          <option value="PENDING">În așteptare</option>
          <option value="IN_PROGRESS">În progres</option>
          <option value="COMPLETED">Completat</option>
          <option value="CANCELLED">Anulat</option>
        </Select>
        
        <Select 
          maxW="150px" 
          value={filters.priority || ''} 
          onChange={(e) => setFilters({ ...filters, priority: e.target.value || undefined })}
        >
          <option value="">Toate prioritățile</option>
          <option value="CRITICAL">Critic</option>
          <option value="HIGH">Ridicat</option>
          <option value="MEDIUM">Mediu</option>
          <option value="LOW">Scăzut</option>
        </Select>
        
        <ButtonGroup size="sm" isAttached variant="outline">
          <IconButton
            aria-label="Vizualizare listă"
            icon={<FiMenu />}
            onClick={() => setViewMode('list')}
            colorScheme={viewMode === 'list' ? 'blue' : 'gray'}
          />
          <IconButton
            aria-label="Vizualizare grilă"
            icon={<FiSquare />}
            onClick={() => setViewMode('grid')}
            colorScheme={viewMode === 'grid' ? 'blue' : 'gray'}
          />
        </ButtonGroup>
        
        <Button leftIcon={<FiRefreshCw />} onClick={onRefresh} colorScheme="blue" variant="outline">
          Reîmprospătează
        </Button>
        
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen}>
          Task Nou
        </Button>
      </Flex>

      {/* Lista Task-uri */}
      <Fade in={true}>
        {viewMode === 'list' ? (
          <VStack spacing={3} align="stretch">
            {tasks.length === 0 ? (
              <Center py={8}>
                <VStack spacing={2}>
                  <FiMenu size={32} color="gray.400" />
                  <Text color="gray.500">Nu s-au găsit task-uri</Text>
                </VStack>
              </Center>
            ) : (
              tasks.map((task, index) => (
                <ScaleFade key={task.id} in={true} initialScale={0.9} delay={index * 0.1}>
                  <TaskCard 
                    task={task} 
                    onStatusChange={onStatusChange}
                  />
                </ScaleFade>
              ))
            )}
          </VStack>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {tasks.map((task, index) => (
              <ScaleFade key={task.id} in={true} initialScale={0.9} delay={index * 0.1}>
                <TaskCard 
                  task={task} 
                  onStatusChange={onStatusChange}
                  compact
                />
              </ScaleFade>
            ))}
          </SimpleGrid>
        )}
      </Fade>

      {/* Paginare */}
      {totalPages > 1 && tasks.length > 0 && (
        <Flex justify="center" align="center" mt={6} gap={2}>
          <Text fontSize="sm" color="gray.500" mr={4}>
            Pagina {currentPage} din {totalPages} ({tasks.length} task-uri afișate)
          </Text>
          
          <Button
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            isDisabled={currentPage === 1}
            leftIcon={<FiArrowLeft />}
            variant="outline"
          >
            Anterior
          </Button>
          
          <HStack spacing={2}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (page > totalPages) return null;
              
              return (
                <Button
                  key={page}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  colorScheme={page === currentPage ? 'blue' : 'gray'}
                  variant={page === currentPage ? 'solid' : 'outline'}
                  minW="40px"
                >
                  {page}
                </Button>
              );
            })}
          </HStack>
          
          <Button
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            isDisabled={currentPage === totalPages}
            rightIcon={<FiArrowRight />}
            variant="outline"
          >
            Următor
          </Button>
        </Flex>
      )}
    </Box>
  );
}

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: number, status: string) => void;
  compact?: boolean;
}

function TaskCard({ task, onStatusChange, compact = false }: TaskCardProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const priorityColor = TaskService.getPriorityColor(task.priority);
  const statusColor = TaskService.getStatusColor(task.status);

  return (
    <Card 
      bg={bgColor}
      border="1px solid" 
      borderColor={borderColor}
      borderRadius="xl"
      overflow="hidden"
      position="relative"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: '2xl',
        transition: 'all 0.3s ease'
      }}
      cursor="pointer"
    >
      {/* Gradient border based on priority */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="4px"
        bgGradient={
          priorityColor === 'red' ? 'linear(to-r, red.400, red.600)' :
          priorityColor === 'orange' ? 'linear(to-r, orange.400, orange.600)' :
          priorityColor === 'yellow' ? 'linear(to-r, yellow.400, yellow.600)' :
          'linear(to-r, green.400, green.600)'
        }
      />
      
      <CardBody p={compact ? 4 : 6}>
        <VStack align="stretch" spacing={3}>
          {/* Header */}
          <Flex justify="space-between" align="start" gap={2}>
            <Box flex={1} minW={0}>
              <Text 
                fontWeight="bold" 
                fontSize={compact ? "md" : "lg"}
                color={useColorModeValue('gray.800', 'white')}
                noOfLines={2}
              >
                {task.title}
              </Text>
              {task.description && (
                <Text 
                  color={useColorModeValue('gray.600', 'gray.300')} 
                  fontSize="sm"
                  noOfLines={compact ? 1 : 2}
                  mt={1}
                >
                  {task.description}
                </Text>
              )}
            </Box>
          </Flex>
          
          {/* Badges */}
          <Flex gap={2} flexWrap="wrap">
            <Badge
              px={2}
              py={1}
              borderRadius="full"
              fontSize="xs"
              fontWeight="bold"
              bg={`${priorityColor}.100`}
              color={`${priorityColor}.700`}
              border="1px solid"
              borderColor={`${priorityColor}.200`}
            >
              {TaskService.getPriorityLabel(task.priority)}
            </Badge>
            <Badge
              px={2}
              py={1}
              borderRadius="full"
              fontSize="xs"
              fontWeight="bold"
              bg={`${statusColor}.100`}
              color={`${statusColor}.700`}
              border="1px solid"
              borderColor={`${statusColor}.200`}
            >
              {TaskService.getStatusLabel(task.status)}
            </Badge>
          </Flex>
          
          {/* Due Date */}
          {task.due_date && (
            <HStack spacing={2} fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
              <FiCalendar />
              <Text>
                {TaskService.formatDueDate(task.due_date)}
                {TaskService.isOverdue(task) && (
                  <Badge ml={2} colorScheme="red" size="sm">Întârziat</Badge>
                )}
                {TaskService.isDueToday(task) && (
                  <Badge ml={2} colorScheme="orange" size="sm">Astăzi</Badge>
                )}
              </Text>
            </HStack>
          )}
          
          {/* Assigned To */}
          {task.assigned_to_user && (
            <HStack spacing={2} fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
              <Avatar size="xs" name={`${task.assigned_to_user.first_name} ${task.assigned_to_user.last_name}`} />
              <Text>
                {task.assigned_to_user.first_name} {task.assigned_to_user.last_name}
              </Text>
            </HStack>
          )}
          
          {/* Hours */}
          {(task.estimated_hours || task.actual_hours > 0) && (
            <HStack spacing={2} fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
              <FiClock />
              <Text>
                {task.actual_hours > 0 ? `${task.actual_hours}h` : ''}
                {task.estimated_hours && task.actual_hours > 0 && ' / '}
                {task.estimated_hours && `${task.estimated_hours}h`}
              </Text>
            </HStack>
          )}
          
          {/* Progress bar for in progress tasks */}
          {task.status === 'IN_PROGRESS' && (
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>Progres</Text>
              <Progress 
                value={task.actual_hours && task.estimated_hours ? 
                  Math.min((task.actual_hours / task.estimated_hours) * 100, 100) : 0} 
                colorScheme="blue" 
                size="sm" 
                borderRadius="full"
              />
            </Box>
          )}
          
          {/* Actions */}
          {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
            <Flex gap={2} mt={2}>
              {task.status === 'PENDING' && (
                <Button
                  size="sm"
                  colorScheme="blue"
                  leftIcon={<FiPlay />}
                  onClick={() => onStatusChange(task.id, 'IN_PROGRESS')}
                  borderRadius="lg"
                >
                  Începe
                </Button>
              )}
              {task.status === 'IN_PROGRESS' && (
                <Button
                  size="sm"
                  colorScheme="green"
                  leftIcon={<FiCheck />}
                  onClick={() => onStatusChange(task.id, 'COMPLETED')}
                  borderRadius="lg"
                >
                  Completează
                </Button>
              )}
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                onClick={() => onStatusChange(task.id, 'CANCELLED')}
                borderRadius="lg"
              >
                Anulează
              </Button>
            </Flex>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
} 