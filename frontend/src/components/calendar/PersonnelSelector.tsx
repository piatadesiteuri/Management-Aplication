import {
  Box,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Select,
  Icon,
  useColorModeValue,
  Alert,
  AlertIcon,
  Spinner,
  Tooltip,
  SimpleGrid,
  Card,
  CardBody,
  IconButton,
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Avatar,
  AvatarGroup,
  ScaleFade,
  SlideFade,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useState, useEffect } from 'react';
import { FiUsers, FiUserPlus, FiUserX, FiUserCheck, FiMail, FiMapPin, FiTrash2, FiInfo, FiClock, FiDatabase, FiPlus, FiSearch } from 'react-icons/fi';
import { CalendarService } from '../../services/CalendarService';

// Animații moderne
const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(56, 178, 172, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(56, 178, 172, 0); }
  100% { box-shadow: 0 0 0 0 rgba(56, 178, 172, 0); }
`;

const slideInUp = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

interface PersonnelSelectorProps {
  selectedPersonnel: number[];
  onPersonnelChange: (personnel: number[]) => void;
  startTime: string;
  endTime: string;
  departmentId?: number;
  excludeEventId?: string;
  isDisabled?: boolean;
}

interface PersonnelMember {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: string[];
  departmentName: string;
  departmentId: number;
  isAvailable: boolean;
  conflictReason?: string;
}

const calendarService = new CalendarService();

export default function PersonnelSelector({
  selectedPersonnel,
  onPersonnelChange,
  startTime,
  endTime,
  departmentId,
  excludeEventId,
  isDisabled = false
}: PersonnelSelectorProps) {
  const [availablePersonnel, setAvailablePersonnel] = useState<PersonnelMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const availableBg = useColorModeValue('green.50', 'green.900');
  const unavailableBg = useColorModeValue('red.50', 'red.900');
  const primaryColor = useColorModeValue('teal.500', 'teal.300');
  const secondaryColor = useColorModeValue('blue.500', 'blue.300');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.300');

  // Încărcăm personalul disponibil când se schimbă intervalul orar
  useEffect(() => {
    if (startTime && endTime) {
      loadPersonnelAvailability();
    }
  }, [startTime, endTime, departmentId, excludeEventId]);

  const loadPersonnelAvailability = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading personnel availability:', { startTime, endTime, departmentId, excludeEventId });
      
      const personnel = await calendarService.checkPersonnelAvailability(
        startTime,
        endTime,
        excludeEventId,
        departmentId
      );
      
      setAvailablePersonnel(personnel);
      console.log('✅ Personnel availability loaded:', {
        total: personnel.length,
        available: personnel.filter(p => p.isAvailable).length,
        occupied: personnel.filter(p => !p.isAvailable).length
      });
    } catch (error) {
      console.error('❌ Error loading personnel availability:', error);
      toast({
        title: 'Eroare la încărcarea personalului',
        description: 'Nu s-a putut verifica disponibilitatea personalului',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPersonnel = (userId: number) => {
    if (selectedPersonnel.includes(userId)) {
      toast({
        title: 'Personal deja asignat',
        description: 'Această persoană este deja asignată la eveniment',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newPersonnel = [...selectedPersonnel, userId];
    onPersonnelChange(newPersonnel);
    
    const person = availablePersonnel.find(p => p.id === userId);
    if (person) {
      toast({
        title: 'Personal adăugat! 👥',
        description: `${person.fullName} a fost asignat la eveniment`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRemovePersonnel = (userId: number) => {
    const newPersonnel = selectedPersonnel.filter(id => id !== userId);
    onPersonnelChange(newPersonnel);
    
    const person = availablePersonnel.find(p => p.id === userId);
    if (person) {
      toast({
        title: 'Personal eliminat',
        description: `${person.fullName} a fost eliminat din eveniment`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getSelectedPersonnelInfo = () => {
    return availablePersonnel.filter(person => selectedPersonnel.includes(person.id));
  };

  const getFilteredPersonnel = () => {
    return availablePersonnel.filter(person => 
      person.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getPersonnelStats = () => {
    const total = availablePersonnel.length;
    const available = availablePersonnel.filter(p => p.isAvailable).length;
    const assigned = selectedPersonnel.length;
    const unavailable = total - available;
    
    return { total, available, assigned, unavailable };
  };

  const stats = getPersonnelStats();

  return (
    <FormControl>
      <FormLabel fontSize="sm" fontWeight="medium" mb={2}>
        Personal asignat
        {selectedPersonnel.length > 0 && (
          <Badge ml={2} colorScheme="blue" variant="subtle" fontSize="xs">
            {selectedPersonnel.length}
          </Badge>
        )}
      </FormLabel>

      <VStack spacing={3} align="stretch">
        <HStack spacing={4} fontSize="xs" color={mutedTextColor} flexWrap="wrap">
          <Text>{stats.available} disponibili</Text>
          <Text>·</Text>
          <Text>{stats.unavailable} ocupați</Text>
          <Text>·</Text>
          <Text>{stats.assigned} asignați</Text>
        </HStack>

        <Button
          leftIcon={<FiPlus />}
          onClick={onOpen}
          isDisabled={isDisabled || loading}
          size="sm"
          variant="outline"
          colorScheme="blue"
          alignSelf="flex-start"
        >
          {loading ? 'Se încarcă...' : 'Selectează personal'}
          {loading && <Spinner size="sm" ml={2} />}
        </Button>

        {/* Personal asignat */}
        {selectedPersonnel.length > 0 && (
          <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" p={3}>
            <VStack spacing={2} align="stretch">
              {getSelectedPersonnelInfo().map((person) => (
                <HStack
                  key={person.id}
                  justify="space-between"
                  p={2}
                  borderRadius="md"
                  bg={bgColor}
                  borderWidth="1px"
                  borderColor={person.isAvailable ? borderColor : 'orange.300'}
                >
                  <HStack spacing={2}>
                    <Avatar name={person.fullName} size="sm" />
                    <Box>
                      <Text fontSize="sm" fontWeight="medium">{person.fullName}</Text>
                      <Text fontSize="xs" color={mutedTextColor}>{person.departmentName}</Text>
                    </Box>
                  </HStack>
                  <HStack spacing={1}>
                    {!person.isAvailable && (
                      <Tooltip label={person.conflictReason} placement="top">
                        <Icon as={FiInfo} color="orange.500" boxSize={4} />
                      </Tooltip>
                    )}
                    <IconButton
                      aria-label="Elimină persoana"
                      icon={<FiTrash2 />}
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleRemovePersonnel(person.id)}
                      isDisabled={isDisabled}
                    />
                  </HStack>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}

        {!loading && availablePersonnel.length === 0 && (
          <Alert status="info" size="sm" borderRadius="md">
            <AlertIcon />
            Nu există personal disponibil pentru acest interval orar.
          </Alert>
        )}

        {selectedPersonnel.some(id => {
          const person = availablePersonnel.find(p => p.id === id);
          return person && !person.isAvailable;
        }) && (
          <Alert status="warning" size="sm" borderRadius="md">
            <AlertIcon />
            Personal asignat cu conflicte de programare.
          </Alert>
        )}
      </VStack>

      {/* Modal pentru selecția personalului */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize="md" py={3}>
            Selectează personal
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody py={4}>
            <VStack spacing={4} align="stretch">
              {/* Căutare */}
              <InputGroup>
                <InputLeftElement>
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Caută după nume, email sau departament..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="sm"
                />
              </InputGroup>

              <VStack spacing={2} align="stretch" maxH="50vh" overflowY="auto">
                {getFilteredPersonnel().map((person) => (
                  <HStack
                    key={person.id}
                    justify="space-between"
                    p={2}
                    borderWidth="1px"
                    borderColor={person.isAvailable ? borderColor : 'orange.300'}
                    borderRadius="md"
                  >
                    <HStack spacing={2}>
                      <Avatar name={person.fullName} size="sm" />
                      <Box>
                        <Text fontSize="sm" fontWeight="medium">{person.fullName}</Text>
                        <Text fontSize="xs" color={mutedTextColor}>{person.departmentName}</Text>
                      </Box>
                    </HStack>
                    <Button
                      size="xs"
                      onClick={() => handleAddPersonnel(person.id)}
                      isDisabled={selectedPersonnel.includes(person.id)}
                      colorScheme={person.isAvailable ? 'blue' : 'orange'}
                      variant={selectedPersonnel.includes(person.id) ? 'ghost' : 'outline'}
                    >
                      {selectedPersonnel.includes(person.id) ? 'Asignat' : 'Adaugă'}
                    </Button>
                  </HStack>
                ))}
              </VStack>

              {getFilteredPersonnel().length === 0 && (
                <Text textAlign="center" py={6} fontSize="sm" color={mutedTextColor}>
                  Nu s-au găsit rezultate
                </Text>
              )}
            </VStack>
          </ModalBody>
          
          <ModalFooter borderTopWidth="1px" borderColor={borderColor} py={2}>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Închide
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </FormControl>
  );
} 