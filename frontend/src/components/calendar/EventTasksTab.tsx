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
  Progress,
  Tooltip,
  Icon,
  Avatar,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import {
  FiCheckCircle,
  FiClock,
  FiUser,
  FiPlay,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiInfo,
  FiList,
  FiPlus,
} from 'react-icons/fi';
import TaskService from '../../services/TaskService';

interface EventTasksTabProps {
  eventId: number;
  eventType: string;
  onTasksGenerated?: () => void;
}

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  estimated_hours?: number;
  actual_hours: number;
  workflow_step?: string;
  task_type?: string;
  created_at: string;
  assigned_to_user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface WorkflowProgress {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  currentStep: string | null;
}

export default function EventTasksTab({ eventId, eventType, onTasksGenerated }: EventTasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState<WorkflowProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    loadEventTasks();
  }, [eventId]);

  const loadEventTasks = async () => {
    try {
      setLoading(true);
      
      // Încarcă task-urile pentru eveniment
      const tasksResponse = await fetch(`/api/task-workflows/events/${eventId}/tasks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);
      }
      
      // Încarcă progresul workflow-ului
      const progressResponse = await fetch(`/api/task-workflows/events/${eventId}/progress`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setProgress(progressData);
      }
    } catch (error) {
      console.error('Error loading event tasks:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca task-urile pentru eveniment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTasksForEvent = async () => {
    try {
      setGeneratingTasks(true);
      
      const response = await fetch('/api/task-workflows/generate-tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventId,
          eventType,
          assignedUserId: 1 // TODO: Obține din context sau props
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Succes',
          description: `S-au generat ${result.taskIds.length} task-uri pentru eveniment`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        loadEventTasks();
        onTasksGenerated?.();
      } else {
        throw new Error('Failed to generate tasks');
      }
    } catch (error) {
      console.error('Error generating tasks:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut genera task-urile pentru eveniment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setGeneratingTasks(false);
    }
  };

  const handleTaskAction = async (taskId: number, action: string) => {
    setSelectedTask(tasks.find(t => t.id === taskId) || null);
    onOpen();
  };

  const confirmTaskAction = async (action: string) => {
    if (!selectedTask) return;
    
    setActionLoading(true);
    
    try {
      let updatedTask;
      let actionMessage = '';
      
      switch (action) {
        case 'start':
          updatedTask = await TaskService.startTask(selectedTask.id);
          actionMessage = 'Task-ul a fost început cu succes!';
          break;
        case 'complete':
          updatedTask = await TaskService.completeTask(selectedTask.id);
          actionMessage = 'Task-ul a fost completat cu succes!';
          break;
        case 'cancel':
          updatedTask = await TaskService.cancelTask(selectedTask.id);
          actionMessage = 'Task-ul a fost anulat!';
          break;
        default:
          throw new Error('Invalid action');
      }
      
      setTasks(tasks.map(task => task.id === selectedTask.id ? updatedTask : task));
      
      toast({
        title: 'Succes',
        description: actionMessage,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      loadEventTasks(); // Reîncarcă pentru a actualiza progresul
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
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

  if (loading) {
    return (
      <Center py={10}>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.500">Se încarcă task-urile...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box>
      {/* Header cu progres */}
      {progress && (
        <Card mb={6} bg={bgColor} border="1px solid" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="lg" fontWeight="bold">Progres Workflow</Text>
                <Badge colorScheme="blue" variant="outline">
                  {progress.completed}/{progress.total} completate
                </Badge>
              </HStack>
              
              <Progress 
                value={(progress.completed / progress.total) * 100} 
                colorScheme="blue" 
                size="lg" 
                borderRadius="full"
              />
              
              <HStack justify="space-between" fontSize="sm" color="gray.600">
                <Text>În așteptare: {progress.pending}</Text>
                <Text>În progres: {progress.inProgress}</Text>
                <Text>Completate: {progress.completed}</Text>
              </HStack>
              
              {progress.currentStep && (
                <Alert status="info" borderRadius="lg">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Pas curent</AlertTitle>
                    <AlertDescription>
                      {progress.currentStep}
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Acțiuni */}
      <HStack justify="space-between" mb={6}>
        <Text fontSize="xl" fontWeight="bold">Task-uri Eveniment</Text>
        
        {tasks.length === 0 && (
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={generateTasksForEvent}
            isLoading={generatingTasks}
          >
            Generează Task-uri
          </Button>
        )}
      </HStack>

      {/* Lista task-uri */}
      {tasks.length === 0 ? (
        <Center py={8}>
          <VStack spacing={4}>
            <Icon as={FiList} w={12} h={12} color="gray.400" />
            <Text color="gray.500" fontSize="lg">
              Nu există task-uri pentru acest eveniment
            </Text>
            <Text color="gray.400" fontSize="sm">
              Apasă "Generează Task-uri" pentru a crea workflow-ul automat
            </Text>
          </VStack>
        </Center>
      ) : (
        <VStack spacing={4} align="stretch">
          {tasks.map((task) => (
            <Card key={task.id} bg={bgColor} border="1px solid" borderColor={borderColor}>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <Box flex={1}>
                      <Text fontWeight="bold" fontSize="lg">
                        {task.title}
                      </Text>
                      {task.description && (
                        <Text color="gray.600" fontSize="sm" mt={1}>
                          {task.description}
                        </Text>
                      )}
                    </Box>
                    
                    <HStack spacing={2}>
                      <Badge
                        px={2}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        bg={`${getPriorityColor(task.priority)}.100`}
                        color={`${getPriorityColor(task.priority)}.700`}
                      >
                        {getPriorityLabel(task.priority)}
                      </Badge>
                      <Badge
                        px={2}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        bg={`${getStatusColor(task.status)}.100`}
                        color={`${getStatusColor(task.status)}.700`}
                      >
                        {getStatusLabel(task.status)}
                      </Badge>
                    </HStack>
                  </HStack>
                  
                  {task.workflow_step && (
                    <HStack spacing={2} fontSize="sm" color="gray.600">
                      <FiInfo />
                      <Text>Pas workflow: {task.workflow_step}</Text>
                    </HStack>
                  )}
                  
                  {task.assigned_to_user && (
                    <HStack spacing={2} fontSize="sm" color="gray.600">
                      <FiUser />
                      <Text>
                        {task.assigned_to_user.first_name} {task.assigned_to_user.last_name}
                      </Text>
                    </HStack>
                  )}
                  
                  {(task.estimated_hours || task.actual_hours > 0) && (
                    <HStack spacing={2} fontSize="sm" color="gray.600">
                      <FiClock />
                      <Text>
                        {task.actual_hours > 0 ? `${task.actual_hours}h` : ''}
                        {task.estimated_hours && task.actual_hours > 0 && ' / '}
                        {task.estimated_hours && `${task.estimated_hours}h`}
                      </Text>
                    </HStack>
                  )}
                  
                  {/* Acțiuni */}
                  {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                    <HStack spacing={2} mt={2}>
                      {task.status === 'PENDING' && (
                        <Button
                          size="sm"
                          colorScheme="blue"
                          leftIcon={<FiPlay />}
                          onClick={() => handleTaskAction(task.id, 'start')}
                        >
                          Începe
                        </Button>
                      )}
                      {task.status === 'IN_PROGRESS' && (
                        <Button
                          size="sm"
                          colorScheme="green"
                          leftIcon={<FiCheck />}
                          onClick={() => handleTaskAction(task.id, 'complete')}
                        >
                          Completează
                        </Button>
                      )}
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        leftIcon={<FiX />}
                        onClick={() => handleTaskAction(task.id, 'cancel')}
                      >
                        Anulează
                      </Button>
                    </HStack>
                  )}
                </VStack>
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}

      {/* Modal pentru confirmarea acțiunilor */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
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
                
                <Box p={4} bg="gray.50" borderRadius="lg">
                  <Text fontWeight="bold" mb={2}>Acțiuni disponibile:</Text>
                  <VStack spacing={2} align="stretch">
                    {selectedTask.status === 'PENDING' && (
                      <Button
                        leftIcon={<FiPlay />}
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => confirmTaskAction('start')}
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
                        onClick={() => confirmTaskAction('complete')}
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
                        onClick={() => confirmTaskAction('cancel')}
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
    </Box>
  );
} 