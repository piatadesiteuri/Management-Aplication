import {
  Box,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  Text,
  Select,
  Icon,
  useColorModeValue,
  Alert,
  AlertIcon,
  Spinner,
  Switch,
  useToast,
  Tooltip,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { CalendarService } from '../../services/CalendarService';

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

  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    if (needsVehicle && startTime && endTime) {
      loadVehicleAvailability();
    }
  }, [needsVehicle, startTime, endTime, excludeEventId]);

  const loadVehicleAvailability = async () => {
    try {
      setLoading(true);
      const vehicles = await calendarService.checkVehicleAvailability(
        startTime,
        endTime,
        excludeEventId
      );

      setAvailableVehicles(vehicles);

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
      console.error('Error loading vehicle availability:', error);
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
      <FormLabel fontSize="sm" fontWeight="medium" mb={2}>
        Transport și vehicule
      </FormLabel>

      <VStack spacing={3} align="stretch">
        <HStack justify="space-between" align="center" py={1}>
          <Text fontSize="sm" color={mutedTextColor}>
            Necesită vehicul
          </Text>
          <Switch
            size="md"
            isChecked={needsVehicle}
            onChange={(e) => {
              onNeedsVehicleChange(e.target.checked);
              if (!e.target.checked) {
                onVehicleChange(undefined);
              }
            }}
            colorScheme="blue"
            isDisabled={isDisabled}
          />
        </HStack>

        {needsVehicle && (
          <VStack spacing={3} align="stretch">
            <HStack spacing={4} fontSize="xs" color={mutedTextColor}>
              <Text>{stats.available} disponibile</Text>
              <Text>·</Text>
              <Text>{stats.occupied} ocupate</Text>
            </HStack>

            <HStack spacing={2} align="start">
              <Select
                placeholder={loading ? 'Se încarcă...' : 'Selectează vehicul'}
                value={selectedVehicleId || ''}
                onChange={(e) => handleVehicleChange(e.target.value)}
                isDisabled={isDisabled || loading}
                size="sm"
                flex={1}
              >
                <optgroup label="Disponibile">
                  {availableVehicles
                    .filter(v => v.isAvailable)
                    .map(vehicle => (
                      <option key={`available-${vehicle.id}`} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} ({vehicle.registration_number})
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Ocupate">
                  {availableVehicles
                    .filter(v => !v.isAvailable)
                    .map(vehicle => (
                      <option key={`occupied-${vehicle.id}`} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} ({vehicle.registration_number}) — ocupat
                      </option>
                    ))}
                </optgroup>
              </Select>
              {loading && <Spinner size="sm" />}
            </HStack>

            {selectedVehicle && (
              <Box
                p={3}
                borderWidth="1px"
                borderColor={selectedVehicle.isAvailable ? borderColor : 'orange.300'}
                borderRadius="md"
                fontSize="sm"
              >
                <HStack justify="space-between">
                  <Box>
                    <Text fontWeight="medium">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </Text>
                    <Text fontSize="xs" color={mutedTextColor}>
                      {selectedVehicle.registration_number} · {selectedVehicle.category}
                    </Text>
                  </Box>
                  {!selectedVehicle.isAvailable && (
                    <Tooltip label={selectedVehicle.conflictReason} placement="top">
                      <Icon as={FiAlertTriangle} color="orange.500" />
                    </Tooltip>
                  )}
                </HStack>
                {selectedVehicle.conflictReason && (
                  <Text fontSize="xs" color="orange.500" mt={1}>
                    {selectedVehicle.conflictReason}
                  </Text>
                )}
              </Box>
            )}

            {!loading && availableVehicles.length === 0 && (
              <Alert status="info" size="sm" borderRadius="md">
                <AlertIcon />
                Nu există vehicule disponibile pentru acest interval.
              </Alert>
            )}
          </VStack>
        )}
      </VStack>
    </FormControl>
  );
}
