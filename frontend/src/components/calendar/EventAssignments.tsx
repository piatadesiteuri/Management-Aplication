import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Flex,
  useColorModeValue,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiCheck,
  FiX,
  FiClock,
  FiMoreVertical,
  FiUser,
  FiMail,
  FiCalendar,
  FiAlertCircle,
  FiSearch,
} from 'react-icons/fi';
import { useState, useEffect, useMemo } from 'react';
import { CalendarService } from '../../services/CalendarService';
import { EventAssignment } from '../../types/calendar';
import { useAuth } from '../../hooks/useAuth';

interface EventAssignmentsProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventStatus: string;
  isOpen: boolean;
  onClose: () => void;
  canEdit: boolean;
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
}

const calendarService = new CalendarService();

const roleLabels = {
  ORGANIZER: 'Organizator',
  PARTICIPANT: 'Participant',
  OBSERVER: 'Observator',
  DRIVER: 'Șofer',
  RESPONSIBLE: 'Responsabil'
};

const statusLabels = {
  PENDING: 'În așteptare',
  ACCEPTED: 'Acceptat',
  DECLINED: 'Refuzat',
  MAYBE: 'Poate'
};

const statusColors = {
  PENDING: 'yellow',
  ACCEPTED: 'green',
  DECLINED: 'red',
  MAYBE: 'blue'
};

export default function EventAssignments({
  eventId,
  eventTitle,
  eventDate,
  eventStatus,
  isOpen,
  onClose,
  canEdit
}: EventAssignmentsProps) {
  const [assignments, setAssignments] = useState<EventAssignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('PARTICIPANT');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [notes, setNotes] = useState('');
  
  const { isOpen: isAddModalOpen, onOpen: onAddModalOpen, onClose: onAddModalClose } = useDisclosure();
  const { user } = useAuth();
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  // Verific dacă evenimentul este în trecut și finalizat
  const isEventPast = new Date(eventDate) < new Date();
  const isEventCompleted = eventStatus === 'COMPLETED';
  const canModifyAssignments = canEdit && (!isEventPast || !isEventCompleted);

  // Filtrez utilizatorii bazat pe căutare
  const filteredUsers = useMemo(() => {
    const assignedUserIds = assignments.map(a => a.userId);
    const availableUsers = users.filter(u => !assignedUserIds.includes(u.id));
    
    if (!searchTerm) return availableUsers;
    
    return availableUsers.filter(user => 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, assignments, searchTerm]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading assignments for event:', eventId);
      
      const data = await calendarService.getEventAssignments(eventId);
      console.log('📋 Loaded assignments:', data);
      
      // Verificăm structura datelor pentru debugging
      if (data && data.length > 0) {
        console.log('📋 Sample assignment structure:', {
          id: data[0].id,
          userId: data[0].user_id || data[0].userId,
          user: data[0].user,
          role: data[0].role,
          status: data[0].status
        });
      }
      
      setAssignments(data);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast({
        title: 'Eroare',
        description: `Nu s-au putut încărca asignările: ${error instanceof Error ? error.message : 'Eroare necunoscută'}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      console.log('👥 Loading users from API...');
      
      const token = localStorage.getItem('jwt_token');
      console.log('🔑 Token check:', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenStart: token ? token.substring(0, 10) + '...' : 'none'
      });
      
      if (!token) {
        console.warn('❌ No token found, using fallback users');
        setFallbackUsers();
        return;
      }

      console.log('🌐 Making request to /api/auth/users with token');
      const response = await fetch('/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('👥 Users API response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Received users from database:', {
          count: userData.length,
          users: userData.map((u: any) => ({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, roles: u.roles }))
        });
        setUsers(userData);
      } else {
        const errorText = await response.text();
        console.warn('❌ Users API failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        setFallbackUsers();
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
      console.warn('🔄 Using fallback users due to error');
      setFallbackUsers();
    } finally {
      setUsersLoading(false);
    }
  };

  const setFallbackUsers = () => {
    console.warn('⚠️ Using fallback users - this should not happen in production!');
    const mockUsers = [
      { id: 1, email: 'admin@dspdolj.ro', firstName: 'Admin', lastName: 'System', isActive: true, roles: ['SUPER_ADMIN'] },
      { id: 2, email: 'inspector@dspdolj.ro', firstName: 'Ion', lastName: 'Popescu', isActive: true, roles: ['INSPECTOR'] },
      { id: 3, email: 'manager@dspdolj.ro', firstName: 'Maria', lastName: 'Ionescu', isActive: true, roles: ['MANAGER'] },
      { id: 4, email: 'operator@dspdolj.ro', firstName: 'Gheorghe', lastName: 'Vasilescu', isActive: true, roles: ['OPERATOR'] },
    ];
    console.log('🔄 Setting fallback users:', mockUsers);
    setUsers(mockUsers);
  };

  useEffect(() => {
    if (isOpen) {
      loadAssignments();
      loadUsers();
    }
  }, [isOpen, eventId]);

  const handleAddAssignment = async () => {
    try {
      if (!selectedUserId) {
        toast({
          title: 'Eroare',
          description: 'Selectați un utilizator.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Verifică dacă utilizatorul este deja asignat
      const isAlreadyAssigned = assignments.some(assignment => 
        assignment.userId === parseInt(selectedUserId)
      );
      
      if (isAlreadyAssigned) {
        toast({
          title: 'Eroare',
          description: 'Acest utilizator este deja asignat la eveniment.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      console.log('➕ Creating assignment:', { 
        eventId, 
        selectedUserId, 
        selectedRole, 
        notes,
        token: localStorage.getItem('jwt_token') ? 'Token exists' : 'No token'
      });
      
      const result = await calendarService.createEventAssignment(eventId, {
        userId: parseInt(selectedUserId),
        role: selectedRole,
        notes: notes || undefined
      });
      console.log('✅ Assignment created successfully:', result);

      toast({
        title: 'Succes',
        description: 'Asignarea a fost creată cu succes.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form
      setSelectedUserId('');
      setSelectedRole('PARTICIPANT');
      setNotes('');
      setSearchTerm('');
      onAddModalClose();
      loadAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: 'Eroare',
        description: `Nu s-a putut crea asignarea: ${error instanceof Error ? error.message : 'Eroare necunoscută'}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUpdateAssignment = async (assignmentId: string, status: string, notes?: string) => {
    try {
      console.log('📝 Updating assignment:', { assignmentId, status, notes });
      await calendarService.updateEventAssignment(eventId, assignmentId, {
        status,
        notes
      });

      toast({
        title: 'Succes',
        description: 'Asignarea a fost actualizată cu succes.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      loadAssignments();
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza asignarea.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      console.log('🗑️ Deleting assignment:', assignmentId);
      await calendarService.deleteEventAssignment(eventId, assignmentId);

      toast({
        title: 'Succes',
        description: 'Asignarea a fost ștearsă cu succes.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      loadAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge asignarea.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getUserName = (assignment: any) => {
    // Încercăm mai întâi să folosim datele din assignment.user (din backend)
    if (assignment.user && assignment.user.firstName && assignment.user.lastName) {
      return `${assignment.user.firstName} ${assignment.user.lastName}`;
    }
    
    // Dacă nu avem date din backend, căutăm în lista locală de utilizatori
    const user = users.find(u => u.id === assignment.userId || u.id === assignment.user_id);
    if (user) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    // Fallback pentru cazurile când nu găsim utilizatorul
    return 'Utilizator necunoscut';
  };

  const getUserEmail = (assignment: any) => {
    // Încercăm mai întâi să folosim datele din assignment.user (din backend)
    if (assignment.user && assignment.user.email) {
      return assignment.user.email;
    }
    
    // Dacă nu avem date din backend, căutăm în lista locală de utilizatori
    const user = users.find(u => u.id === assignment.userId || u.id === assignment.user_id);
    if (user) {
      return user.email;
    }
    
    // Fallback pentru cazurile când nu găsim utilizatorul
    return 'email necunoscut';
  };

  const resetAddForm = () => {
    setSelectedUserId('');
    setSelectedRole('PARTICIPANT');
    setNotes('');
    setSearchTerm('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" motionPreset="slideInBottom">
      <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.600" />
      <ModalContent borderRadius="2xl" mx={4} maxH="90vh">
        <ModalHeader
          bg={useColorModeValue('blue.500', 'blue.600')}
          color="white"
          borderTopRadius="2xl"
          py={6}
        >
          <VStack align="start" spacing={2}>
            <HStack>
              <FiUsers size={24} />
              <Text fontSize="xl" fontWeight="bold">Asignări Eveniment</Text>
            </HStack>
            <Text fontSize="md" opacity={0.9}>
              {eventTitle}
            </Text>
            {isEventPast && (
              <Badge colorScheme="orange" fontSize="sm">
                <FiAlertCircle style={{ marginRight: '4px' }} />
                Eveniment trecut
              </Badge>
            )}
            {isEventCompleted && (
              <Badge colorScheme="green" fontSize="sm">
                <FiCheck style={{ marginRight: '4px' }} />
                Eveniment finalizat
              </Badge>
            )}
          </VStack>
        </ModalHeader>
        <ModalCloseButton color="white" />

        <ModalBody p={6}>
          <VStack spacing={6} align="stretch">
            {/* Informații despre restricții */}
            {isEventPast && isEventCompleted && (
              <Alert status="info" borderRadius="lg">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold">Eveniment finalizat</Text>
                  <Text fontSize="sm">
                    Nu se pot modifica asignările pentru evenimente finalizate.
                  </Text>
                </VStack>
              </Alert>
            )}

            {/* Statistici */}
            <Card bg={cardBg} borderRadius="xl">
              <CardBody>
                <HStack justify="space-between" wrap="wrap" spacing={4}>
                  <VStack align="start">
                    <Text fontSize="sm" color="gray.500">Total Asignări</Text>
                    <Text fontSize="2xl" fontWeight="bold">{assignments.length}</Text>
                  </VStack>
                  <VStack align="start">
                    <Text fontSize="sm" color="gray.500">Acceptate</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="green.500">
                      {assignments.filter(a => a.status === 'ACCEPTED').length}
                    </Text>
                  </VStack>
                  <VStack align="start">
                    <Text fontSize="sm" color="gray.500">În așteptare</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="yellow.500">
                      {assignments.filter(a => a.status === 'PENDING').length}
                    </Text>
                  </VStack>
                  <VStack align="start">
                    <Text fontSize="sm" color="gray.500">Refuzate</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="red.500">
                      {assignments.filter(a => a.status === 'DECLINED').length}
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>

            {/* Buton pentru adăugare asignare */}
            {canModifyAssignments && (
              <Button
                leftIcon={<FiPlus />}
                colorScheme="blue"
                size="lg"
                onClick={onAddModalOpen}
                isDisabled={filteredUsers.length === 0 && !searchTerm}
                borderRadius="xl"
              >
                Adaugă Persoană
              </Button>
            )}

            {/* Lista asignărilor */}
            <Box>
              <Heading size="md" mb={4}>Persoane Asignate</Heading>
              {loading ? (
                <Center py={8}>
                  <Spinner size="lg" />
                </Center>
              ) : assignments.length === 0 ? (
                <Center py={8}>
                  <VStack>
                    <FiUsers size={48} color="gray" />
                    <Text color="gray.500">Nu există persoane asignate</Text>
                  </VStack>
                </Center>
              ) : (
                <Table variant="simple" size="md">
                  <Thead>
                    <Tr>
                      <Th>Persoană</Th>
                      <Th>Rol</Th>
                      <Th>Status</Th>
                      <Th>Data Răspuns</Th>
                      {canModifyAssignments && <Th>Acțiuni</Th>}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {assignments.map((assignment) => (
                      <Tr key={assignment.id}>
                        <Td>
                          <HStack>
                            <Avatar 
                              size="sm" 
                              name={getUserName(assignment)}
                              bg="blue.500"
                            />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium">
                                {getUserName(assignment)}
                              </Text>
                              <Text fontSize="sm" color="gray.500">
                                {getUserEmail(assignment)}
                              </Text>
                            </VStack>
                          </HStack>
                        </Td>
                        <Td>
                          <Badge colorScheme="purple" variant="subtle">
                            {roleLabels[assignment.role as keyof typeof roleLabels]}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge 
                            colorScheme={statusColors[assignment.status as keyof typeof statusColors]}
                            variant="subtle"
                          >
                            {statusLabels[assignment.status as keyof typeof statusLabels]}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="gray.500">
                            {assignment.responseDate 
                              ? new Date(assignment.responseDate).toLocaleDateString('ro-RO')
                              : '-'
                            }
                          </Text>
                        </Td>
                        {canModifyAssignments && (
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
                                  icon={<FiCheck />}
                                  onClick={() => handleUpdateAssignment(assignment.id.toString(), 'ACCEPTED')}
                                  isDisabled={assignment.status === 'ACCEPTED'}
                                >
                                  Acceptă
                                </MenuItem>
                                <MenuItem
                                  icon={<FiX />}
                                  onClick={() => handleUpdateAssignment(assignment.id.toString(), 'DECLINED')}
                                  isDisabled={assignment.status === 'DECLINED'}
                                >
                                  Refuză
                                </MenuItem>
                                <MenuItem
                                  icon={<FiClock />}
                                  onClick={() => handleUpdateAssignment(assignment.id.toString(), 'PENDING')}
                                  isDisabled={assignment.status === 'PENDING'}
                                >
                                  Marchează ca în așteptare
                                </MenuItem>
                                <Divider />
                                <MenuItem
                                  icon={<FiTrash2 />}
                                  onClick={() => handleDeleteAssignment(assignment.id.toString())}
                                  color="red.500"
                                >
                                  Șterge asignarea
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </Td>
                        )}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>

      {/* Modal pentru adăugare asignare cu căutare îmbunătățită */}
      <Modal isOpen={isAddModalOpen} onClose={() => { onAddModalClose(); resetAddForm(); }} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Adaugă Persoană la Eveniment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              {/* Căutare utilizatori */}
              <FormControl>
                <FormLabel>Caută Utilizator</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <FiSearch color="gray" />
                  </InputLeftElement>
                  <Input
                    placeholder="Caută după nume sau email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
                {usersLoading && <Text fontSize="sm" color="gray.500">Se încarcă utilizatorii...</Text>}
              </FormControl>

              {/* Lista utilizatori filtrați */}
              <FormControl>
                <FormLabel>Selectează Utilizator</FormLabel>
                <Box 
                  maxH="300px" 
                  overflowY="auto" 
                  border="1px solid" 
                  borderColor={borderColor} 
                  borderRadius="md"
                  sx={{
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      width: '10px',
                      backgroundColor: useColorModeValue('gray.100', 'gray.700'),
                      borderRadius: '8px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: useColorModeValue('gray.400', 'gray.500'),
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: useColorModeValue('gray.500', 'gray.400'),
                      },
                    },
                  }}
                >
                  {filteredUsers.length === 0 ? (
                    <Center p={4}>
                      <Text color="gray.500">
                        {searchTerm ? 'Nu s-au găsit utilizatori' : 'Toți utilizatorii sunt asignați'}
                      </Text>
                    </Center>
                  ) : (
                    <VStack spacing={0} align="stretch">
                      {filteredUsers.map((user) => (
                        <Box
                          key={user.id}
                          p={4}
                          cursor="pointer"
                          bg={selectedUserId === user.id.toString() ? useColorModeValue('blue.50', 'blue.900') : 'transparent'}
                          _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                          onClick={() => setSelectedUserId(user.id.toString())}
                          borderBottom="1px solid"
                          borderColor={borderColor}
                          transition="all 0.2s"
                          position="relative"
                        >
                          <HStack spacing={3}>
                            <Avatar size="sm" name={`${user.firstName} ${user.lastName}`} bg="blue.500" />
                            <VStack align="start" spacing={1} flex={1}>
                              <Text fontWeight="medium" fontSize="md">{user.firstName} {user.lastName}</Text>
                              <Text fontSize="sm" color="gray.500">{user.email}</Text>
                              <HStack spacing={1}>
                                {user.roles.map(role => (
                                  <Badge key={role} size="sm" colorScheme="blue" variant="subtle" fontSize="xs">
                                    {role}
                                  </Badge>
                                ))}
                              </HStack>
                            </VStack>
                            {selectedUserId === user.id.toString() && (
                              <Box
                                bg="green.500"
                                color="white"
                                borderRadius="full"
                                p={1}
                                boxShadow="md"
                              >
                                <FiCheck size={16} />
                              </Box>
                            )}
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </Box>
              </FormControl>

              <FormControl>
                <FormLabel>Rol</FormLabel>
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Notițe (opțional)</FormLabel>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notițe suplimentare..."
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => { onAddModalClose(); resetAddForm(); }}>
              Anulează
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleAddAssignment}
              isDisabled={!selectedUserId || usersLoading}
            >
              Adaugă
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Modal>
  );
} 