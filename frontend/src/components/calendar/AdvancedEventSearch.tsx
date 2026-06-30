import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  Text,
  Badge,
  Box,
  Icon,
  SimpleGrid,
  Card,
  CardBody,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  Divider,
  Flex,
  Avatar,
  Tag,
  TagLabel,
  TagLeftIcon,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Heading,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiCalendar, 
  FiMapPin, 
  FiUsers, 
  FiTruck, 
  FiClock,
  FiFilter,
  FiEye,
  FiUser,
  FiFileText
} from 'react-icons/fi';
import { CalendarEvent, EventType, EventStatus } from '../../types/calendar';
import { CalendarService } from '../../services/CalendarService';

interface AdvancedEventSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onEventSelect?: (event: CalendarEvent) => void;
}

const calendarService = new CalendarService();

const eventTypeNames: Partial<Record<EventType, string>> = {
  INSPECTION: 'Inspecție Sanitară',
  EPIDEMIOLOGICAL_CONTROL: 'Control Epidemiologic',
  MEETING: 'Ședință',
  REPORTING: 'Raportare',
  HEALTH_EMERGENCY: 'Urgență Sanitară',
  ADMINISTRATIVE: 'Administrativ',
  TRAVEL: 'Deplasare',
  TRAINING: 'Formare Profesională',
  PUBLIC_HEALTH_ACTION: 'Acțiune Sănătate Publică',
  OTHER: 'Altele'
};

const eventStatusNames: Partial<Record<EventStatus, string>> = {
  DRAFT: 'Ciornă',
  PENDING: 'În așteptare',
  APPROVED: 'Aprobat',
  IN_PROGRESS: 'În desfășurare',
  COMPLETED: 'Finalizat',
  CANCELLED: 'Anulat',
  POSTPONED: 'Amânat',
  URGENT: 'Urgent'
};

export default function AdvancedEventSearch({ 
  isOpen, 
  onClose, 
  onEventSelect 
}: AdvancedEventSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<EventType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<EventStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBgColor = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    if (isOpen) {
      loadAllEvents();
    }
  }, [isOpen]);

  useEffect(() => {
    filterEvents();
    setCurrentPage(1); // Reset la prima pagină când se schimbă filtrele
  }, [searchTerm, selectedType, selectedStatus, startDate, endDate, location, events]);

  const loadAllEvents = async () => {
    try {
      setLoading(true);
      const allEvents = await calendarService.getEvents();
      setEvents(allEvents);
      setFilteredEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca evenimentele.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Filtrare după termenul de căutare
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.location?.toLowerCase().includes(term)
      );
    }

    // Filtrare după tip
    if (selectedType) {
      filtered = filtered.filter(event => event.type === selectedType);
    }

    // Filtrare după status
    if (selectedStatus) {
      filtered = filtered.filter(event => event.status === selectedStatus);
    }

    // Filtrare după interval de date
    if (startDate) {
      filtered = filtered.filter(event => 
        new Date(event.start) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(event => 
        new Date(event.end) <= new Date(endDate + 'T23:59:59')
      );
    }

    // Filtrare după locație
    if (location) {
      const locationTerm = location.toLowerCase();
      filtered = filtered.filter(event => 
        event.location?.toLowerCase().includes(locationTerm)
      );
    }

    setFilteredEvents(filtered);
    setHasSearched(true);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setLocation('');
    setFilteredEvents(events);
    setHasSearched(false);
  };

  const getEventTypeColor = (eventType: EventType) => {
    switch (eventType) {
      case 'INSPECTION': return 'blue';
      case 'TRAVEL': return 'green';
      case 'MEETING': return 'orange';
      default: return 'gray';
    }
  };

  const getEventStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'DRAFT': return 'gray';
      case 'PENDING': return 'yellow';
      case 'APPROVED': return 'blue';
      case 'IN_PROGRESS': return 'orange';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      case 'POSTPONED': return 'purple';
      case 'URGENT': return 'red';
      default: return 'gray';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Dată invalidă';
      }
      return date.toLocaleString('ro-RO', { 
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return 'Dată invalidă';
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (onEventSelect) {
      onEventSelect(event);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(20px)" bg="blackAlpha.700" />
      <ModalContent
        bg={bgColor}
        borderRadius="3xl"
        border="none"
        shadow="2xl"
        overflow="hidden"
        mx={4}
        maxH="90vh"
      >
        <ModalHeader
          bgGradient={useColorModeValue(
            'linear(135deg, purple.500, blue.600)',
            'linear(135deg, purple.600, blue.700)'
          )}
          color="white"
          p={8}
          borderTopRadius="3xl"
        >
          <Flex align="center" justify="space-between">
            <HStack spacing={4}>
              <Box
                bg="whiteAlpha.200"
                p={3}
                borderRadius="xl"
                backdropFilter="blur(10px)"
              >
                <Icon as={FiSearch} boxSize={6} />
              </Box>
              <Box>
                <Heading size="xl" fontWeight="bold">
                  Căutare Avansată Evenimente
                </Heading>
                <Text fontSize="sm" opacity={0.9} mt={1}>
                  Găsește rapid orice eveniment din sistem
                </Text>
              </Box>
            </HStack>
            <ModalCloseButton
              position="static"
              color="white"
              size="lg"
              _hover={{ bg: 'whiteAlpha.200', transform: 'rotate(90deg)' }}
              transition="all 0.2s"
            />
          </Flex>
        </ModalHeader>

        <ModalBody p={8}>
          <VStack spacing={8} align="stretch">
            {/* Filtre de căutare */}
            <Box
              bg={cardBgColor}
              p={6}
              borderRadius="2xl"
              border="1px solid"
              borderColor={borderColor}
            >
              <HStack mb={6}>
                <Icon as={FiFilter} color="purple.500" boxSize={5} />
                <Text fontSize="lg" fontWeight="bold">
                  Filtre de Căutare
                </Text>
              </HStack>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {/* Căutare generală */}
                <FormControl>
                  <FormLabel>Căutare Generală</FormLabel>
                  <InputGroup>
                    <InputLeftElement>
                      <Icon as={FiSearch} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="Titlu, descriere, locație..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      borderRadius="xl"
                    />
                  </InputGroup>
                </FormControl>

                {/* Tip eveniment */}
                <FormControl>
                  <FormLabel>Tip Eveniment</FormLabel>
                  <Select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as EventType | '')}
                    placeholder="Toate tipurile"
                    borderRadius="xl"
                  >
                    {Object.entries(eventTypeNames).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                {/* Status */}
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as EventStatus | '')}
                    placeholder="Toate statusurile"
                    borderRadius="xl"
                  >
                    {Object.entries(eventStatusNames).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                {/* Data început */}
                <FormControl>
                  <FormLabel>De la Data</FormLabel>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    borderRadius="xl"
                  />
                </FormControl>

                {/* Data sfârșit */}
                <FormControl>
                  <FormLabel>Până la Data</FormLabel>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    borderRadius="xl"
                  />
                </FormControl>

                {/* Locație */}
                <FormControl>
                  <FormLabel>Locație</FormLabel>
                  <InputGroup>
                    <InputLeftElement>
                      <Icon as={FiMapPin} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="Căutare după locație..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      borderRadius="xl"
                    />
                  </InputGroup>
                </FormControl>
              </SimpleGrid>

              <Flex justify="space-between" align="center" mt={6}>
                <Text fontSize="sm" color="gray.500">
                  {hasSearched && (
                    <>Găsite {filteredEvents.length} din {events.length} evenimente</>
                  )}
                </Text>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  borderRadius="xl"
                >
                  Resetează Filtrele
                </Button>
              </Flex>
            </Box>

            <Divider />

            {/* Rezultate căutare */}
            <Box>
              <HStack mb={6}>
                <Icon as={FiEye} color="blue.500" boxSize={5} />
                <Text fontSize="lg" fontWeight="bold">
                  Rezultate Căutare
                </Text>
              </HStack>

              {loading ? (
                <Center py={12}>
                  <VStack spacing={4}>
                    <Spinner size="xl" color="purple.500" />
                    <Text color="gray.500">Se încarcă evenimente...</Text>
                  </VStack>
                </Center>
              ) : filteredEvents.length === 0 ? (
                <Center py={12}>
                  <VStack spacing={4}>
                    <Icon as={FiCalendar} boxSize={16} color="gray.300" />
                    <Text fontSize="xl" fontWeight="semibold" color="gray.500">
                      {hasSearched ? 'Niciun rezultat găsit' : 'Folosește filtrele pentru căutare'}
                    </Text>
                    <Text fontSize="md" color="gray.400" textAlign="center">
                      {hasSearched 
                        ? 'Încearcă să modifici criteriile de căutare'
                        : 'Introdu criterii de căutare pentru a găsi evenimente'
                      }
                    </Text>
                  </VStack>
                </Center>
              ) : (
                <>
                  {/* Informații paginare */}
                  <Flex justify="space-between" align="center" mb={6}>
                    <Text fontSize="sm" color="gray.500">
                      Pagina {currentPage} din {Math.ceil(filteredEvents.length / itemsPerPage)} 
                      ({((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredEvents.length)} din {filteredEvents.length} rezultate)
                    </Text>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        isDisabled={currentPage === 1}
                        borderRadius="lg"
                      >
                        Anterior
                      </Button>
                      <Text fontSize="sm" px={2}>
                        {currentPage} / {Math.ceil(filteredEvents.length / itemsPerPage)}
                      </Text>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredEvents.length / itemsPerPage), prev + 1))}
                        isDisabled={currentPage >= Math.ceil(filteredEvents.length / itemsPerPage)}
                        borderRadius="lg"
                      >
                        Următor
                      </Button>
                    </HStack>
                  </Flex>

                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                    {filteredEvents
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((event) => (
                    <Card
                      key={event.id}
                      bg={cardBgColor}
                      borderRadius="2xl"
                      border="1px solid"
                      borderColor={borderColor}
                      cursor="pointer"
                      transition="all 0.3s ease"
                      _hover={{
                        transform: 'translateY(-4px)',
                        shadow: 'xl',
                        borderColor: useColorModeValue('purple.200', 'purple.600')
                      }}
                      onClick={() => handleEventClick(event)}
                    >
                      <CardBody p={6}>
                        <VStack align="start" spacing={4}>
                          {/* Header */}
                          <HStack justify="space-between" w="full">
                            <Badge
                              colorScheme={getEventTypeColor(event.type)}
                              fontSize="xs"
                              px={3}
                              py={1}
                              borderRadius="full"
                              fontWeight="semibold"
                            >
                              {eventTypeNames[event.type] || event.type}
                            </Badge>
                            <Badge
                              colorScheme={getEventStatusColor(event.status)}
                              fontSize="xs"
                              px={3}
                              py={1}
                              borderRadius="full"
                              variant="subtle"
                            >
                              {eventStatusNames[event.status] || event.status}
                            </Badge>
                          </HStack>

                          {/* Titlu și descriere */}
                          <Box w="full">
                            <Text fontSize="lg" fontWeight="bold" mb={2} lineHeight="1.2">
                              {event.title}
                            </Text>
                            {event.description && (
                              <Text fontSize="sm" color={useColorModeValue('gray.700', 'gray.300')} fontWeight="medium" lineHeight="1.4">
                                {event.description.length > 120 
                                  ? `${event.description.substring(0, 120)}...` 
                                  : event.description
                                }
                              </Text>
                            )}
                          </Box>

                          {/* Detalii */}
                          <VStack align="start" spacing={3} w="full">
                            {/* Data și ora */}
                            <HStack>
                              <Icon as={FiClock} boxSize={4} color="blue.500" />
                              <Text fontSize="sm" fontWeight="medium">
                                {formatTime(event.start)}
                              </Text>
                            </HStack>

                            {/* Locație */}
                            {event.location && (
                              <HStack align="start">
                                <Icon as={FiMapPin} boxSize={4} color="teal.500" mt={0.5} />
                                <Text fontSize="sm" color={useColorModeValue('gray.700', 'gray.300')} fontWeight="medium">
                                  {event.location.length > 60 
                                    ? `${event.location.substring(0, 60)}...` 
                                    : event.location
                                  }
                                </Text>
                              </HStack>
                            )}

                            {/* Tags pentru caracteristici */}
                            <HStack spacing={2} flexWrap="wrap">
                              {event.vehicleId && (
                                <Tag size="sm" colorScheme="green" borderRadius="full">
                                  <TagLeftIcon as={FiTruck} />
                                  <TagLabel>Vehicul</TagLabel>
                                </Tag>
                              )}
                              
                              {event.assignments && event.assignments.length > 0 && (
                                <Tag size="sm" colorScheme="purple" borderRadius="full">
                                  <TagLeftIcon as={FiUsers} />
                                  <TagLabel>{event.assignments.length} asignați</TagLabel>
                                </Tag>
                              )}

                              {event.isPrivate && (
                                <Tag size="sm" colorScheme="red" borderRadius="full">
                                  <TagLeftIcon as={FiUser} />
                                  <TagLabel>Privat</TagLabel>
                                </Tag>
                              )}

                              {event.documents && event.documents.length > 0 && (
                                <Tag size="sm" colorScheme="teal" borderRadius="full">
                                  <TagLeftIcon as={FiFileText} />
                                  <TagLabel>{event.documents.length} doc.</TagLabel>
                                </Tag>
                              )}
                            </HStack>
                          </VStack>
                        </VStack>
                      </CardBody>
                    </Card>
                    ))}
                  </SimpleGrid>
                </>
              )}
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter
          bg={cardBgColor}
          borderTop="1px solid"
          borderColor={borderColor}
          p={6}
          borderBottomRadius="3xl"
        >
          <Button
            variant="outline"
            onClick={onClose}
            size="lg"
            borderRadius="xl"
            px={8}
          >
            Închide
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 