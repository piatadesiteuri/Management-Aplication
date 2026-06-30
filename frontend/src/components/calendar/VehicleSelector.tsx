import {
  Box,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  Text,
  Badge,
  Select,
  Icon,
  useColorModeValue,
  Alert,
  AlertIcon,
  Spinner,
  Switch,
  SimpleGrid,
  Card,
  CardBody,
  useToast,
  Tooltip,
  ScaleFade,
  SlideFade,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useState, useEffect } from 'react';
import { FiTruck, FiCheck, FiX, FiInfo, FiAlertTriangle, FiSettings, FiClock, FiDatabase } from 'react-icons/fi';
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
    transform: translateY(10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

interface VehicleSelectorProps {
  needsVehicle: boolean;
  onNeedsVehicleChange: (needs: boolean) => void;
  selectedVehicleId?: number;
  onVehicleChange: (vehicleId?: number) => void;
  startTime: string;
  endTime: string;
  excludeEventId?: string;
  isDisabled?: boolean;
}

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  registration_number: string;
  status: string;
  category: string;
  fuel_type: string;
  isAvailable: boolean;
  conflictReason?: string;
}

const calendarService = new CalendarService();

export default function VehicleSelector({
  needsVehicle,
  onNeedsVehicleChange,
  selectedVehicleId,
  onVehicleChange,
  startTime,
  endTime,
  excludeEventId,
  isDisabled = false
}: VehicleSelectorProps) {
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const availableBg = useColorModeValue('green.50', 'green.900');
  const unavailableBg = useColorModeValue('red.50', 'red.900');
  const primaryColor = useColorModeValue('teal.500', 'teal.300');
  const secondaryColor = useColorModeValue('blue.500', 'blue.300');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.300');

  // Încărcăm vehiculele disponibile când se schimbă intervalul orar
  useEffect(() => {
    if (needsVehicle && startTime && endTime) {
      loadVehicleAvailability();
    }
  }, [needsVehicle, startTime, endTime, excludeEventId]);

  const loadVehicleAvailability = async () => {
    try {
      setLoading(true);
      console.log('🚗 Loading vehicle availability:', { startTime, endTime, excludeEventId });
      
      const vehicles = await calendarService.checkVehicleAvailability(
        startTime,
        endTime,
        excludeEventId
      );
      
      setAvailableVehicles(vehicles);
      console.log('✅ Vehicle availability loaded:', {
        total: vehicles.length,
        available: vehicles.filter(v => v.isAvailable).length,
        occupied: vehicles.filter(v => !v.isAvailable).length
      });

      // Verificăm dacă vehiculul selectat nu mai este disponibil
      if (selectedVehicleId) {
        const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
        if (selectedVehicle && !selectedVehicle.isAvailable) {
          toast({
            title: 'Vehicul indisponibil',
            description: `${selectedVehicle.brand} ${selectedVehicle.model} nu mai este disponibil în acest interval.`,
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    } catch (error) {
      console.error('❌ Error loading vehicle availability:', error);
      toast({
        title: 'Eroare la încărcarea vehiculelor',
        description: 'Nu s-a putut verifica disponibilitatea vehiculelor',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleChange = (vehicleId: string) => {
    const id = vehicleId ? parseInt(vehicleId) : undefined;
    onVehicleChange(id);
    
    if (id) {
      const vehicle = availableVehicles.find(v => v.id === id);
      if (vehicle) {
        toast({
          title: 'Vehicul selectat! 🚗',
          description: `${vehicle.brand} ${vehicle.model} a fost asignat`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const getVehicleStats = () => {
    const total = availableVehicles.length;
    const available = availableVehicles.filter(v => v.isAvailable).length;
    const occupied = total - available;
    
    return { total, available, occupied };
  };

  const getSelectedVehicle = () => {
    return selectedVehicleId ? availableVehicles.find(v => v.id === selectedVehicleId) : undefined;
  };

  const stats = getVehicleStats();
  const selectedVehicle = getSelectedVehicle();

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
            <Icon as={FiTruck} boxSize={5} />
          </Box>
          <Text fontWeight="bold" fontSize="lg" color={textColor}>
            Transport și Vehicule
          </Text>
        </HStack>
      </FormLabel>

      <VStack spacing={6} align="stretch">
        {/* Switch pentru activarea transportului - modernizat */}
        <Card
          border="2px solid"
          borderColor={needsVehicle ? primaryColor : borderColor}
          borderRadius="xl"
          overflow="hidden"
          bg={needsVehicle ? `${primaryColor}10` : bgColor}
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
          }}
          transition="all 0.3s"
        >
          <CardBody p={6}>
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold" fontSize="lg" color={textColor}>
                  Necesită vehicul pentru acest eveniment
                </Text>
                <Text fontSize="sm" color={mutedTextColor}>
                  Activează pentru a selecta un vehicul din parcul auto
                </Text>
              </VStack>
              <Switch
                size="lg"
                isChecked={needsVehicle}
                onChange={(e) => {
                  onNeedsVehicleChange(e.target.checked);
                  if (!e.target.checked) {
                    onVehicleChange(undefined);
                  }
                }}
                colorScheme="teal"
                isDisabled={isDisabled}
              />
            </HStack>
          </CardBody>
        </Card>

        {needsVehicle && (
          <SlideFade in={true}>
            <VStack spacing={6} align="stretch">
              {/* Statistici vehicule - modernizate */}
              <SimpleGrid columns={3} spacing={3}>
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
                        <Icon as={FiTruck} boxSize={4} />
                      </Box>
                      <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                        {stats.available}
                      </Text>
                      <Text fontSize="xs" color={mutedTextColor} fontWeight="medium" textTransform="uppercase" letterSpacing="wide">
                        Disponibile
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
                        {stats.occupied}
                      </Text>
                      <Text fontSize="xs" color={mutedTextColor} fontWeight="medium" textTransform="uppercase" letterSpacing="wide">
                        Ocupate
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

              {/* Selectarea vehiculului - modernizat */}
              <Card
                border="2px solid"
                borderColor={borderColor}
                borderRadius="xl"
                overflow="hidden"
              >
                <CardBody p={6}>
                  <VStack spacing={4} align="stretch">
                    <HStack spacing={3}>
                                             <Box
                         p={2}
                         borderRadius="lg"
                         bg="blue.100"
                         color="blue.600"
                       >
                         <Icon as={FiTruck} boxSize={5} />
                       </Box>
                      <Text fontWeight="bold" fontSize="lg" color={textColor}>
                        Selectează Vehicul
                      </Text>
                    </HStack>
                    
                    <HStack spacing={3} align="start">
                      <Select
                        placeholder={loading ? "Se încarcă vehiculele..." : "Selectează vehicul"}
                        value={selectedVehicleId || ''}
                        onChange={(e) => handleVehicleChange(e.target.value)}
                        isDisabled={isDisabled || loading}
                        size="lg"
                        borderRadius="xl"
                        borderWidth="2px"
                        borderColor={selectedVehicleId ? primaryColor : borderColor}
                        bg={bgColor}
                        color={textColor}
                        _focus={{
                          borderColor: primaryColor,
                          boxShadow: `0 0 0 1px ${primaryColor}`,
                        }}
                        _hover={{
                          borderColor: secondaryColor,
                        }}
                        transition="all 0.3s"
                        flex={1}
                      >
                        <optgroup label="🟢 Disponibile">
                          {availableVehicles
                            .filter(v => v.isAvailable)
                            .map(vehicle => (
                              <option key={`available-${vehicle.id}`} value={vehicle.id}>
                                ✅ {vehicle.brand} {vehicle.model} ({vehicle.registration_number}) - {vehicle.category}
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="🔴 Ocupate (nu recomandați)">
                          {availableVehicles
                            .filter(v => !v.isAvailable)
                            .map(vehicle => (
                              <option key={`occupied-${vehicle.id}`} value={vehicle.id}>
                                ❌ {vehicle.brand} {vehicle.model} ({vehicle.registration_number}) - {vehicle.category}
                              </option>
                            ))}
                        </optgroup>
                      </Select>
                      {loading && <Spinner size="md" color={primaryColor} />}
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Informații despre vehiculul selectat - modernizat */}
              {selectedVehicle && (
                <ScaleFade in={true}>
                  <Card
                    border="2px solid"
                    borderColor={selectedVehicle.isAvailable ? 'green.200' : 'red.200'}
                    borderRadius="xl"
                    overflow="hidden"
                    bg={selectedVehicle.isAvailable ? `${availableBg}` : `${unavailableBg}`}
                  >
                    <CardBody p={6}>
                      <VStack spacing={4} align="stretch">
                        <HStack justify="space-between">
                          <HStack spacing={3}>
                            <Box
                              p={2}
                              borderRadius="lg"
                              bg={selectedVehicle.isAvailable ? 'green.100' : 'red.100'}
                              color={selectedVehicle.isAvailable ? 'green.600' : 'red.600'}
                            >
                              <Icon 
                                as={selectedVehicle.isAvailable ? FiCheck : FiX}
                                boxSize={5}
                              />
                            </Box>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold" fontSize="lg" color={textColor}>
                                {selectedVehicle.brand} {selectedVehicle.model}
                              </Text>
                              <Text fontSize="sm" color={mutedTextColor}>
                                {selectedVehicle.registration_number}
                              </Text>
                            </VStack>
                          </HStack>
                          {!selectedVehicle.isAvailable && (
                            <Tooltip label="Vehicul cu conflict" placement="top">
                              <Box
                                p={2}
                                borderRadius="full"
                                bg="orange.100"
                                color="orange.600"
                              >
                                <Icon as={FiAlertTriangle} boxSize={4} />
                              </Box>
                            </Tooltip>
                          )}
                        </HStack>

                        <SimpleGrid columns={2} spacing={4}>
                          <HStack spacing={2}>
                            <Box
                              p={1}
                              borderRadius="full"
                              bg={`${primaryColor}20`}
                              color={primaryColor}
                            >
                              <Icon as={FiTruck} boxSize={3} />
                            </Box>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color={mutedTextColor}>
                                Categorie
                              </Text>
                              <Text fontSize="sm" fontWeight="medium" color={textColor}>
                                {selectedVehicle.category}
                              </Text>
                            </VStack>
                          </HStack>
                          
                          <HStack spacing={2}>
                            <Box
                              p={1}
                              borderRadius="full"
                              bg={`${secondaryColor}20`}
                              color={secondaryColor}
                            >
                              <Icon as={FiSettings} boxSize={3} />
                            </Box>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color={mutedTextColor}>
                                Combustibil
                              </Text>
                              <Text fontSize="sm" fontWeight="medium" color={textColor}>
                                {selectedVehicle.fuel_type}
                              </Text>
                            </VStack>
                          </HStack>
                          
                          <HStack spacing={2}>
                            <Box
                              p={1}
                              borderRadius="full"
                              bg="purple.100"
                              color="purple.600"
                            >
                              <Icon as={FiSettings} boxSize={3} />
                            </Box>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color={mutedTextColor}>
                                Status
                              </Text>
                              <Text fontSize="sm" fontWeight="medium" color={textColor}>
                                {selectedVehicle.status}
                              </Text>
                            </VStack>
                          </HStack>
                        </SimpleGrid>

                        {selectedVehicle.conflictReason && (
                          <Alert status="warning" size="sm" borderRadius="xl" border="2px solid" borderColor="orange.200">
                            <AlertIcon />
                            <Box>
                              <Text fontSize="sm" fontWeight="medium">
                                <strong>Conflict:</strong> {selectedVehicle.conflictReason}
                              </Text>
                            </Box>
                          </Alert>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </ScaleFade>
              )}

              {/* Mesaj dacă nu există vehicule disponibile */}
              {!loading && availableVehicles.length === 0 && (
                <SlideFade in={true}>
                  <Alert status="info" borderRadius="xl" border="2px solid" borderColor="blue.200">
                    <AlertIcon />
                    <Box>
                      <Text fontSize="sm" fontWeight="medium">
                        Nu există vehicule disponibile pentru acest interval orar.
                      </Text>
                    </Box>
                  </Alert>
                </SlideFade>
              )}

              {/* Atenționare pentru vehicul ocupat */}
              {selectedVehicle && !selectedVehicle.isAvailable && (
                <SlideFade in={true}>
                  <Alert status="warning" borderRadius="xl" border="2px solid" borderColor="orange.200">
                    <AlertIcon />
                    <Box>
                      <Text fontSize="sm" fontWeight="medium">
                        <strong>Atenție:</strong> Vehiculul selectat are un conflict de programare. 
                        Considerați selectarea unui alt vehicul disponibil.
                      </Text>
                    </Box>
                  </Alert>
                </SlideFade>
              )}

              {/* Mesaj informativ pentru recomandări */}
              {needsVehicle && stats.available > 0 && (
                <SlideFade in={true}>
                  <Alert status="info" borderRadius="xl" border="2px solid" borderColor="blue.200">
                    <AlertIcon />
                    <Box>
                      <Text fontSize="sm" fontWeight="medium">
                        💡 <strong>Recomandare:</strong> Sunt disponibile {stats.available} vehicule 
                        în intervalul selectat. Selectați un vehicul marcat cu ✅ pentru evitarea conflictelor.
                      </Text>
                    </Box>
                  </Alert>
                </SlideFade>
              )}
            </VStack>
          </SlideFade>
        )}
      </VStack>
    </FormControl>
  );
} 