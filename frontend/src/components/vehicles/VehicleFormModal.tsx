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
  Select,
  VStack,
  SimpleGrid,
  useToast,
  FormErrorMessage,
  NumberInput,
  NumberInputField,
  Textarea,
  Box,
  Divider,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import { Vehicle, VehicleStatus } from '../../types/vehicles';
import { VehicleService } from '../../services/vehicles/VehicleService';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: Vehicle;
  onSuccess: () => void;
}

const initialFormData = {
  registration_number: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  status: 'AVAILABLE' as VehicleStatus,
  category: '',
  fuel_type: '',
  tank_capacity: 0,
  current_mileage: 0,
  assigned_department_id: undefined,
  observations: '',
};

const vehicleService = new VehicleService();

export default function VehicleFormModal({
  isOpen,
  onClose,
  vehicle,
  onSuccess,
}: VehicleFormModalProps) {
  const [formData, setFormData] = useState(vehicle || initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.registration_number) {
      newErrors.registration_number = 'Numărul de înmatriculare este obligatoriu';
    }
    if (!formData.brand) {
      newErrors.brand = 'Marca este obligatorie';
    }
    if (!formData.model) {
      newErrors.model = 'Modelul este obligatoriu';
    }
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Anul trebuie să fie valid';
    }
    if (!formData.category) {
      newErrors.category = 'Categoria este obligatorie';
    }
    if (!formData.fuel_type) {
      newErrors.fuel_type = 'Tipul de combustibil este obligatoriu';
    }
    if (formData.tank_capacity <= 0) {
      newErrors.tank_capacity = 'Capacitatea rezervorului trebuie să fie pozitivă';
    }
    if (formData.current_mileage < 0) {
      newErrors.current_mileage = 'Kilometrajul nu poate fi negativ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: 'Eroare de validare',
        description: 'Vă rugăm să completați toate câmpurile obligatorii corect.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      
      // Convertim datele pentru a fi compatibile cu backend-ul
      const vehicleData = {
        brand: formData.brand,
        model: formData.model,
        registrationNumber: formData.registration_number,
        year: formData.year,
        status: formData.status,
        category: formData.category,
        fuelType: formData.fuel_type,
        tankCapacity: formData.tank_capacity,
        currentMileage: formData.current_mileage,
        assignedDepartmentId: formData.assigned_department_id,
        observations: formData.observations,
      };

      if (vehicle) {
        await vehicleService.updateVehicle(vehicle.id, vehicleData);
      } else {
        await vehicleService.createVehicle(vehicleData);
      }

      toast({
        title: 'Succes',
        description: vehicle
          ? 'Vehiculul a fost actualizat cu succes'
          : 'Vehiculul a fost adăugat cu succes',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut salva vehiculul. Vă rugăm să încercați din nou.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    field: keyof typeof formData,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      motionPreset="slideInBottom"
      scrollBehavior="inside"
    >
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent borderRadius="xl">
        <ModalHeader>
          {vehicle ? 'Editare Vehicul' : 'Adăugare Vehicul Nou'}
        </ModalHeader>

        <ModalBody>
          <VStack spacing={6}>
            {/* Informații de bază */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                Informații de Bază
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isInvalid={!!errors.registration_number}>
                  <FormLabel>Număr Înmatriculare</FormLabel>
                  <Input
                    value={formData.registration_number}
                    onChange={(e) =>
                      handleChange('registration_number', e.target.value)
                    }
                    placeholder="ex: DJ-01-DSP"
                  />
                  <FormErrorMessage>{errors.registration_number}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.brand}>
                  <FormLabel>Marcă</FormLabel>
                  <Input
                    value={formData.brand}
                    onChange={(e) => handleChange('brand', e.target.value)}
                    placeholder="ex: Dacia"
                  />
                  <FormErrorMessage>{errors.brand}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.model}>
                  <FormLabel>Model</FormLabel>
                  <Input
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    placeholder="ex: Logan"
                  />
                  <FormErrorMessage>{errors.model}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.year}>
                  <FormLabel>An Fabricație</FormLabel>
                  <NumberInput
                    value={formData.year}
                    onChange={(_, value) => handleChange('year', value)}
                    min={1900}
                    max={new Date().getFullYear() + 1}
                  >
                    <NumberInputField placeholder="ex: 2025" />
                  </NumberInput>
                  <FormErrorMessage>{errors.year}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Detalii Tehnice */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                Detalii Tehnice
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isInvalid={!!errors.category}>
                  <FormLabel>Categorie</FormLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    placeholder="Selectează categoria"
                  >
                    <option value="SEDAN">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="VAN">Van</option>
                    <option value="UTILITY">Utilitar</option>
                  </Select>
                  <FormErrorMessage>{errors.category}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.status}>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) =>
                      handleChange('status', e.target.value as VehicleStatus)
                    }
                  >
                    <option value="AVAILABLE">Disponibil</option>
                    <option value="IN_USE">În folosință</option>
                    <option value="MAINTENANCE">În mentenanță</option>
                    <option value="OUT_OF_SERVICE">Indisponibil</option>
                  </Select>
                  <FormErrorMessage>{errors.status}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.fuel_type}>
                  <FormLabel>Tip Combustibil</FormLabel>
                  <Select
                    value={formData.fuel_type}
                    onChange={(e) => handleChange('fuel_type', e.target.value)}
                    placeholder="Selectează tipul"
                  >
                    <option value="PETROL">Benzină</option>
                    <option value="DIESEL">Motorină</option>
                    <option value="HYBRID">Hibrid</option>
                    <option value="ELECTRIC">Electric</option>
                  </Select>
                  <FormErrorMessage>{errors.fuel_type}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.tank_capacity}>
                  <FormLabel>Capacitate Rezervor (L)</FormLabel>
                  <NumberInput
                    value={formData.tank_capacity}
                    onChange={(_, value) => handleChange('tank_capacity', value)}
                    min={0}
                  >
                    <NumberInputField placeholder="ex: 50" />
                  </NumberInput>
                  <FormErrorMessage>{errors.tank_capacity}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.current_mileage}>
                  <FormLabel>Kilometraj Actual</FormLabel>
                  <NumberInput
                    value={formData.current_mileage}
                    onChange={(_, value) => handleChange('current_mileage', value)}
                    min={0}
                  >
                    <NumberInputField placeholder="ex: 50000" />
                  </NumberInput>
                  <FormErrorMessage>{errors.current_mileage}</FormErrorMessage>
                </FormControl>

                <FormControl>
                  <FormLabel>Departament</FormLabel>
                  <Select
                    value={formData.assigned_department_id || ''}
                    onChange={(e) =>
                      handleChange(
                        'assigned_department_id',
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    placeholder="Selectează departamentul"
                  >
                    <option value="1">Departament 1</option>
                    <option value="2">Departament 2</option>
                    <option value="3">Departament 3</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Observații */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                Observații
              </Text>
              <FormControl>
                <FormLabel>Observații Generale</FormLabel>
                <Textarea
                  value={formData.observations || ''}
                  onChange={(e) => handleChange('observations', e.target.value)}
                  placeholder="Introduceți observații despre vehicul..."
                  rows={4}
                />
              </FormControl>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose}>
            Anulează
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleSubmit}
            isLoading={loading}
            loadingText="Se salvează..."
          >
            {vehicle ? 'Salvează Modificările' : 'Adaugă Vehicul'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 