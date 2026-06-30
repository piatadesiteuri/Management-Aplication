import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Badge,
  VStack,
  HStack,
  Box,
  Text,
  useColorModeValue,
  useToast,
  Spinner,
  Center,
  Divider,
  Icon,
  Flex,
  Grid,
  GridItem,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FiCalendar, FiClock, FiUser, FiMapPin, FiFileText, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import TaskService, { Task } from '../../services/TaskService';
import { useAuth } from '../../hooks/useAuth';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  department?: string;
}

interface Department {
  id: number;
  name: string;
}

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated }: CreateTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    department_id: '',
    priority: 'MEDIUM',
    due_date: '',
    estimated_hours: ''
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { user } = useAuth();
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadDepartments();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const api = (await import('../../services/api')).default;
      const response = await api.get('/auth/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const api = (await import('../../services/api')).default;
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: 'Eroare',
        description: 'Titlul este obligatoriu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : (user?.id || 1), // Setează utilizatorul curent dacă nu este selectat altcineva
        department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
        priority: formData.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        due_date: formData.due_date || undefined,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : undefined
      } as Partial<Task>;

      await TaskService.createTask(taskData);
      
      toast({
        title: 'Succes',
        description: 'Task-ul a fost creat cu succes',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onTaskCreated();
      handleClose();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut crea task-ul',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      assigned_to: '',
      department_id: '',
      priority: 'MEDIUM',
      due_date: '',
      estimated_hours: ''
    });
    onClose();
  };

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return { color: 'red', label: 'CRITICĂ', icon: FiAlertCircle };
      case 'HIGH':
        return { color: 'orange', label: 'RIDICATĂ', icon: FiAlertCircle };
      case 'MEDIUM':
        return { color: 'yellow', label: 'MEDIE', icon: FiCheckCircle };
      case 'LOW':
        return { color: 'green', label: 'SCĂZUTĂ', icon: FiCheckCircle };
      default:
        return { color: 'gray', label: 'MEDIE', icon: FiCheckCircle };
    }
  };

  const priorityInfo = getPriorityInfo(formData.priority);

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <Center py={10}>
            <Spinner size="xl" color="blue.500" />
          </Center>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent 
        bg={bgColor} 
        borderRadius="xl" 
        boxShadow="2xl"
        maxH="90vh"
        overflow="hidden"
      >
        <ModalHeader 
          bg={cardBg} 
          borderBottom="1px solid" 
          borderColor={borderColor}
          borderRadius="xl 0 0 0"
        >
          <Flex align="center" gap={3}>
            <Icon as={FiFileText} w={6} h={6} color="blue.500" />
            <Box>
              <Text fontSize="2xl" fontWeight="bold">Creează Task Nou</Text>
              <Text fontSize="sm" color="gray.500">Delegă o sarcină către un inspector</Text>
            </Box>
          </Flex>
        </ModalHeader>

        <ModalBody p={0} overflow="auto">
          <Box p={6}>
            <form onSubmit={handleSubmit}>
              <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                {/* Coloana stângă */}
                <GridItem colSpan={{ base: 2, lg: 1 }}>
                  <VStack spacing={6} align="stretch">
                    {/* Informații Generale */}
                    <Box>
                      <Text fontSize="lg" fontWeight="semibold" mb={4} color="blue.600">
                        <Icon as={FiFileText} mr={2} />
                        Informații Generale
                      </Text>
                      
                      <VStack spacing={4}>
                        <FormControl isRequired>
                          <FormLabel fontWeight="medium">Titlu Task</FormLabel>
                          <Input
                            placeholder="Ex: Inspecție sanitară Restaurant La Mama"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            size="lg"
                            borderRadius="lg"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel fontWeight="medium">Descriere</FormLabel>
                          <Textarea
                            placeholder="Detalii despre task, obiective, cerințe specifice..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            size="lg"
                            borderRadius="lg"
                          />
                        </FormControl>
                      </VStack>
                    </Box>

                    {/* Asignare și Prioritate */}
                    <Box>
                      <Text fontSize="lg" fontWeight="semibold" mb={4} color="blue.600">
                        <Icon as={FiUser} mr={2} />
                        Asignare și Prioritate
                      </Text>
                      
                      <VStack spacing={4}>
                        <FormControl isRequired>
                          <FormLabel fontWeight="medium">Asignează la</FormLabel>
                          <Select
                            placeholder="Selectează persoana responsabilă"
                            value={formData.assigned_to}
                            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                            size="lg"
                            borderRadius="lg"
                          >
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.first_name} {user.last_name} - {user.email}
                              </option>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel fontWeight="medium">Departament (opțional)</FormLabel>
                          <Select
                            placeholder="Selectează departamentul (optional)"
                            value={formData.department_id}
                            onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                            size="lg"
                            borderRadius="lg"
                          >
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel fontWeight="medium">Prioritate</FormLabel>
                          <Select
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            size="lg"
                            borderRadius="lg"
                          >
                            <option value="LOW">Scăzută</option>
                            <option value="MEDIUM">Medie</option>
                            <option value="HIGH">Ridicată</option>
                            <option value="CRITICAL">Critică</option>
                          </Select>
                          <HStack mt={2}>
                            <Badge colorScheme={priorityInfo.color} variant="subtle" size="lg">
                              <Icon as={priorityInfo.icon} mr={1} />
                              {priorityInfo.label}
                            </Badge>
                          </HStack>
                        </FormControl>
                      </VStack>
                    </Box>
                  </VStack>
                </GridItem>

                {/* Coloana dreaptă */}
                <GridItem colSpan={{ base: 2, lg: 1 }}>
                  <VStack spacing={6} align="stretch">
                    {/* Termen și Estimări */}
                    <Box>
                      <Text fontSize="lg" fontWeight="semibold" mb={4} color="blue.600">
                        <Icon as={FiCalendar} mr={2} />
                        Termen și Estimări
                      </Text>
                      
                      <VStack spacing={4}>
                        <FormControl>
                          <FormLabel fontWeight="medium">Termen limită</FormLabel>
                          <Input
                            type="datetime-local"
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            size="lg"
                            borderRadius="lg"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel fontWeight="medium">Ore estimate</FormLabel>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            placeholder="Ex: 4.5"
                            value={formData.estimated_hours}
                            onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                            size="lg"
                            borderRadius="lg"
                          />
                        </FormControl>
                      </VStack>
                    </Box>

                    {/* Preview și Exemple */}
                    <Box>
                      <Text fontSize="lg" fontWeight="semibold" mb={4} color="blue.600">
                        <Icon as={FiCheckCircle} mr={2} />
                        Preview Task
                      </Text>
                      
                      <Box p={4} bg={cardBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                        <VStack align="stretch" spacing={3}>
                          <Text fontWeight="bold" fontSize="lg">
                            {formData.title || 'Titlu Task'}
                          </Text>
                          
                          {formData.description && (
                            <Text color="gray.600" fontSize="sm">
                              {formData.description}
                            </Text>
                          )}
                          
                          <HStack spacing={2}>
                            <Badge colorScheme={priorityInfo.color} variant="subtle">
                              {priorityInfo.label}
                            </Badge>
                            <Badge colorScheme="blue" variant="subtle">
                              ÎN AȘTEPTARE
                            </Badge>
                          </HStack>
                          
                          {formData.due_date && (
                            <Text fontSize="sm" color="gray.500">
                              <Icon as={FiCalendar} mr={1} />
                              Termen: {new Date(formData.due_date).toLocaleDateString('ro-RO')}
                            </Text>
                          )}
                          
                          {formData.estimated_hours && (
                            <Text fontSize="sm" color="gray.500">
                              <Icon as={FiClock} mr={1} />
                              Estimare: {formData.estimated_hours}h
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    </Box>

                    {/* Exemple de Task-uri */}
                    <Box>
                      <Text fontSize="md" fontWeight="medium" mb={3} color="gray.600">
                        Exemple de Task-uri DSPD:
                      </Text>
                      
                      <VStack spacing={2} align="stretch">
                        <Box p={3} bg={cardBg} borderRadius="md" fontSize="sm">
                          <Text fontWeight="medium">Inspecție Sanitară</Text>
                          <Text color="gray.500">Verificare conformitate norme sanitare</Text>
                        </Box>
                        <Box p={3} bg={cardBg} borderRadius="md" fontSize="sm">
                          <Text fontWeight="medium">Monitorizare Boli Infecțioase</Text>
                          <Text color="gray.500">Urmărirea cazurilor și raportare</Text>
                        </Box>
                        <Box p={3} bg={cardBg} borderRadius="md" fontSize="sm">
                          <Text fontWeight="medium">Control Calitate Apă</Text>
                          <Text color="gray.500">Verificarea calității apei publice</Text>
                        </Box>
                      </VStack>
                    </Box>
                  </VStack>
                </GridItem>
              </Grid>
            </form>
          </Box>
        </ModalBody>

        <ModalFooter 
          bg={cardBg} 
          borderTop="1px solid" 
          borderColor={borderColor}
          borderRadius="0 0 xl xl"
        >
          <HStack spacing={3}>
            <Button 
              variant="outline" 
              onClick={handleClose}
              size="lg"
              borderRadius="lg"
            >
              Anulează
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleSubmit}
              isLoading={submitting}
              loadingText="Se creează..."
              size="lg"
              borderRadius="lg"
              leftIcon={<FiCheckCircle />}
            >
              Creează Task
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 