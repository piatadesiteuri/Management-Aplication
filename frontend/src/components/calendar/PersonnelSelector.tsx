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
      <FormLabel>
        <HStack spacing={3}>
          <Box
            p={2}
            borderRadius="lg"
            bg={`linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`}
            color="white"
            animation={`${pulseGlow} 2s infinite`}
          >
            <Icon as={FiUsers} boxSize={5} />
          </Box>
          <Text fontWeight="bold" fontSize="lg">Personal Asignat</Text>
          <Badge 
            colorScheme="blue" 
            variant="solid"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="sm"
            fontWeight="bold"
          >
            {selectedPersonnel.length} selectați
          </Badge>
        </HStack>
      </FormLabel>

      <VStack spacing={6} align="stretch">
        {/* Statistici rapide - modernizate */}
        <SimpleGrid columns={4} spacing={3}>
          <Card 
            size="sm" 
            bg={bgColor}
            border="1px solid" 
            borderColor={borderColor}
            borderRadius="xl"
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: 'lg',
              borderColor: primaryColor,
            }}
            transition="all 0.3s"
          >
            <CardBody p={4} textAlign="center">
              <VStack spacing={2}>
                <Box
                  p={2}
                  borderRadius="full"
                  bg={`${primaryColor}10`}
                  color={primaryColor}
                >
                  <Icon as={FiUsers} boxSize={4} />
                </Box>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                {stats.available}
              </Text>
                <Text fontSize="xs" color={mutedTextColor} fontWeight="medium" textTransform="uppercase" letterSpacing="wide">
                Disponibili
              </Text>
              </VStack>
            </CardBody>
          </Card>
          
          <Card 
            size="sm" 
            bg={bgColor}
            border="1px solid" 
            borderColor={borderColor}
            borderRadius="xl"
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: 'lg',
              borderColor: 'orange.300',
            }}
            transition="all 0.3s"
          >
            <CardBody p={4} textAlign="center">
              <VStack spacing={2}>
                <Box
                  p={2}
                  borderRadius="full"
                  bg="orange.100"
                  color="orange.500"
                >
                  <Icon as={FiClock} boxSize={4} />
                </Box>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                {stats.unavailable}
              </Text>
                <Text fontSize="xs" color={mutedTextColor} fontWeight="medium" textTransform="uppercase" letterSpacing="wide">
                Ocupați
              </Text>
              </VStack>
            </CardBody>
          </Card>
          
          <Card 
            size="sm" 
            bg={bgColor}
            border="1px solid" 
            borderColor={borderColor}
            borderRadius="xl"
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: 'lg',
              borderColor: secondaryColor,
            }}
            transition="all 0.3s"
          >
            <CardBody p={4} textAlign="center">
              <VStack spacing={2}>
                <Box
                  p={2}
                  borderRadius="full"
                  bg={`${secondaryColor}10`}
                  color={secondaryColor}
                >
                  <Icon as={FiUserCheck} boxSize={4} />
                </Box>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                {stats.assigned}
              </Text>
                <Text fontSize="xs" color={mutedTextColor} fontWeight="medium" textTransform="uppercase" letterSpacing="wide">
                Asignați
              </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card 
            size="sm" 
            bg={bgColor}
            border="1px solid" 
            borderColor={borderColor}
            borderRadius="xl"
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: 'lg',
              borderColor: mutedTextColor,
            }}
            transition="all 0.3s"
          >
            <CardBody p={4} textAlign="center">
              <VStack spacing={2}>
                <Box
                  p={2}
                  borderRadius="full"
                  bg={`${mutedTextColor}20`}
                  color={mutedTextColor}
                >
                  <Icon as={FiDatabase} boxSize={4} />
                </Box>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                {stats.total}
              </Text>
                <Text fontSize="xs" color={mutedTextColor} fontWeight="medium" textTransform="uppercase" letterSpacing="wide">
                Total
              </Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Buton pentru deschiderea modalului */}
            <Button
              leftIcon={<FiPlus />}
          onClick={onOpen}
          isDisabled={isDisabled || loading}
          size="lg"
          borderRadius="xl"
          bg={useColorModeValue('blue.500', 'blue.400')}
          color="white"
          border="2px solid"
          borderColor={useColorModeValue('blue.600', 'blue.300')}
          fontWeight="bold"
          fontSize="md"
          px={8}
          py={6}
          _hover={{
            transform: 'translateY(-3px)',
            boxShadow: 'xl',
            bg: useColorModeValue('blue.600', 'blue.500'),
            borderColor: useColorModeValue('blue.700', 'blue.400'),
          }}
          _active={{
            transform: 'translateY(-1px)',
            bg: useColorModeValue('blue.700', 'blue.600'),
          }}
          _disabled={{
            opacity: 0.6,
            cursor: 'not-allowed',
            transform: 'none',
            bg: useColorModeValue('gray.400', 'gray.600'),
            borderColor: useColorModeValue('gray.500', 'gray.500'),
          }}
          transition="all 0.3s"
          position="relative"
          overflow="hidden"
          boxShadow="lg"
            >
          {loading ? 'Se încarcă...' : '+ Selectează Personal'}
          {loading && <Spinner size="sm" ml={2} color="white" />}
            </Button>

        {/* Personal asignat - modernizat */}
        {selectedPersonnel.length > 0 && (
          <ScaleFade in={true}>
            <Card
              border="2px solid"
              borderColor={borderColor}
              borderRadius="2xl"
              overflow="hidden"
              boxShadow="lg"
            >
              <CardBody p={6}>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <HStack spacing={3}>
                      <Box
                        p={2}
                        borderRadius="lg"
                        bg="blue.100"
                        color="blue.600"
                      >
                        <Icon as={FiUserCheck} boxSize={5} />
                      </Box>
                      <Text fontWeight="bold" fontSize="lg">
                        Personal Asignat ({selectedPersonnel.length})
                      </Text>
                    </HStack>
                    <AvatarGroup size="sm" max={3}>
                      {getSelectedPersonnelInfo().map((person) => (
                        <Avatar 
                          key={person.id} 
                          name={person.fullName}
                          bg={person.isAvailable ? 'green.500' : 'red.500'}
                        />
                      ))}
                    </AvatarGroup>
                  </HStack>
                  
                <VStack spacing={3} align="stretch">
                  {getSelectedPersonnelInfo().map((person, index) => (
                    <Box key={person.id}>
                        <HStack 
                          justify="space-between" 
                          p={4} 
                          bg={bgColor} 
                          borderRadius="xl" 
                          border="1px solid" 
                          borderColor={person.isAvailable ? 'green.200' : 'red.200'}
                          _hover={{
                            transform: 'translateX(4px)',
                            boxShadow: 'md',
                          }}
                          transition="all 0.3s"
                        >
                          <HStack spacing={4}>
                            <Avatar 
                              name={person.fullName}
                              size="md"
                              bg={person.isAvailable ? 'green.500' : 'red.500'}
                          />
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="bold" fontSize="lg">
                                {person.fullName}
                            </Text>
                              <HStack spacing={2} color="gray.600">
                                <HStack spacing={1}>
                                  <Icon as={FiMail} boxSize={3} />
                                  <Text fontSize="sm">{person.email}</Text>
                                </HStack>
                                <HStack spacing={1}>
                                  <Icon as={FiMapPin} boxSize={3} />
                                  <Text fontSize="sm">{person.departmentName}</Text>
                                </HStack>
                              </HStack>
                            {person.roles.length > 0 && (
                              <HStack spacing={1} mt={1}>
                                {person.roles.slice(0, 2).map(role => (
                                    <Badge key={role} size="sm" colorScheme="purple" variant="solid">
                                    {role}
                                  </Badge>
                                ))}
                                {person.roles.length > 2 && (
                                    <Badge size="sm" colorScheme="gray" variant="solid">
                                    +{person.roles.length - 2}
                                  </Badge>
                                )}
                              </HStack>
                            )}
                          </VStack>
                        </HStack>
                        
                        <HStack spacing={2}>
                          {!person.isAvailable && (
                            <Tooltip label={person.conflictReason} placement="top">
                                <Box
                                  p={2}
                                  borderRadius="full"
                                  bg="orange.100"
                                  color="orange.600"
                                >
                                  <Icon as={FiInfo} boxSize={4} />
                                </Box>
                            </Tooltip>
                          )}
                          <IconButton
                            aria-label="Elimină persoana"
                            icon={<FiTrash2 />}
                              size="md"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleRemovePersonnel(person.id)}
                            isDisabled={isDisabled}
                              _hover={{
                                transform: 'scale(1.1)',
                                bg: 'red.100',
                              }}
                              transition="all 0.2s"
                          />
                        </HStack>
                      </HStack>
                      {!person.isAvailable && person.conflictReason && (
                          <Alert status="warning" size="sm" mt={3} borderRadius="xl">
                          <AlertIcon />
                          <Box>
                              <Text fontSize="sm" fontWeight="medium">
                              <strong>Conflict:</strong> {person.conflictReason}
                            </Text>
                          </Box>
                        </Alert>
                      )}
                      {index < getSelectedPersonnelInfo().length - 1 && (
                          <Divider mt={4} />
                      )}
                    </Box>
                  ))}
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          </ScaleFade>
        )}

        {/* Mesaj dacă nu există personal disponibil */}
        {!loading && availablePersonnel.length === 0 && (
          <SlideFade in={true}>
            <Alert status="info" borderRadius="xl" border="2px solid" borderColor="blue.200">
            <AlertIcon />
            <Box>
                <Text fontSize="sm" fontWeight="medium">
                Nu există personal disponibil pentru acest interval orar.
              </Text>
            </Box>
          </Alert>
          </SlideFade>
        )}

        {/* Mesaj informativ pentru conflicte */}
        {selectedPersonnel.some(id => {
          const person = availablePersonnel.find(p => p.id === id);
          return person && !person.isAvailable;
        }) && (
          <SlideFade in={true}>
            <Alert status="warning" borderRadius="xl" border="2px solid" borderColor="orange.200">
            <AlertIcon />
            <Box>
                <Text fontSize="sm" fontWeight="medium">
                <strong>Atenție:</strong> Aveți personal asignat care are conflicte de programare. 
                Verificați detaliile pentru fiecare persoană.
              </Text>
            </Box>
          </Alert>
          </SlideFade>
        )}
      </VStack>

      {/* Modal pentru selecția personalului */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.300" />
        <ModalContent borderRadius="2xl" overflow="hidden">
          <ModalHeader 
            bg={`linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`}
            color="white"
            textAlign="center"
          >
            <HStack justify="center" spacing={3}>
              <Icon as={FiUsers} boxSize={6} />
              <Text fontSize="xl" fontWeight="bold">
                Selectează Personal pentru Eveniment
              </Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          
          <ModalBody py={6}>
            <VStack spacing={6} align="stretch">
              {/* Căutare */}
              <InputGroup>
                <InputLeftElement>
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Caută după nume, email sau departament..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  borderRadius="xl"
                  borderWidth="2px"
                  _focus={{
                    borderColor: primaryColor,
                    boxShadow: `0 0 0 1px ${primaryColor}`,
                  }}
                />
              </InputGroup>

              {/* Lista personalului */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {getFilteredPersonnel().map((person) => (
                  <Card
                    key={person.id}
                    border="2px solid"
                    borderColor={person.isAvailable ? 'green.200' : 'red.200'}
                    borderRadius="xl"
                    overflow="hidden"
                    _hover={{
                      transform: 'translateY(-4px)',
                      boxShadow: 'xl',
                    }}
                    transition="all 0.3s"
                    animation={`${slideInUp} 0.5s ease-out`}
                  >
                    <CardBody p={6}>
                      <VStack spacing={4} align="stretch">
                        <HStack justify="space-between">
                          <HStack spacing={4}>
                            <Avatar 
                              name={person.fullName}
                              size="lg"
                              bg={person.isAvailable ? 'green.500' : 'red.500'}
                            />
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="bold" fontSize="lg">
                                {person.fullName}
                              </Text>
                              <Text fontSize="sm" color="gray.600">
                                {person.email}
                              </Text>
                              <Badge colorScheme="blue" variant="solid">
                                {person.departmentName}
                              </Badge>
                            </VStack>
                          </HStack>
                          <Box
                            p={2}
                            borderRadius="full"
                            bg={person.isAvailable ? 'green.100' : 'red.100'}
                            color={person.isAvailable ? 'green.600' : 'red.600'}
                          >
                            <Icon 
                              as={person.isAvailable ? FiUserCheck : FiUserX} 
                              boxSize={5}
                            />
                          </Box>
                        </HStack>

                        {person.roles.length > 0 && (
                          <HStack spacing={1} flexWrap="wrap">
                            {person.roles.map(role => (
                              <Badge key={role} size="sm" colorScheme="purple" variant="solid">
                                {role}
                              </Badge>
                            ))}
                          </HStack>
                        )}

                        {!person.isAvailable && person.conflictReason && (
                          <Alert status="warning" size="sm" borderRadius="lg">
                            <AlertIcon />
                            <Text fontSize="sm">
                              <strong>Conflict:</strong> {person.conflictReason}
                            </Text>
                          </Alert>
                        )}

                        <Button
                          leftIcon={<FiPlus />}
                          onClick={() => handleAddPersonnel(person.id)}
                          isDisabled={selectedPersonnel.includes(person.id)}
                          colorScheme={person.isAvailable ? 'green' : 'red'}
                          variant="solid"
                          borderRadius="xl"
                          _hover={{
                            transform: 'scale(1.05)',
                          }}
                          transition="all 0.2s"
                        >
                          {selectedPersonnel.includes(person.id) 
                            ? 'Deja Asignat' 
                            : person.isAvailable 
                              ? 'Adaugă Personal' 
                              : 'Adaugă (Conflict)'
                          }
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>

              {getFilteredPersonnel().length === 0 && (
                <Box textAlign="center" py={8}>
                  <Icon as={FiUsers} boxSize={16} color="gray.300" mb={4} />
                  <Text fontSize="lg" color="gray.500">
                    Nu s-au găsit rezultate pentru "{searchTerm}"
                  </Text>
                </Box>
              )}
            </VStack>
          </ModalBody>
          
          <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
            <Button variant="ghost" onClick={onClose}>
              Închide
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </FormControl>
  );
} 