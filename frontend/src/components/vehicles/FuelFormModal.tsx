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
} from '@chakra-ui/react';
import { useState } from 'react';
import { VehicleService } from '../../services/vehicles/VehicleService';

interface FuelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: number;
  onSuccess: () => void;
}

const initialFormData = {
  date: new Date().toISOString().split('T')[0],
  quantity: 0,
  cost: 0,
  mileage: 0,
  fuelType: 'DIESEL' as 'DIESEL' | 'PETROL' | 'HYBRID' | 'ELECTRIC',
  location: '',
  driver: '',
  efficiency: 0,
  costPerKm: 0,
};

export default function FuelFormModal({
  isOpen,
  onClose,
  vehicleId,
  onSuccess,
}: FuelFormModalProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Data este obligatorie';
    }
    if (formData.quantity <= 0) {
      newErrors.quantity = 'Cantitatea trebuie să fie pozitivă';
    }
    if (formData.cost <= 0) {
      newErrors.cost = 'Costul trebuie să fie pozitiv';
    }
    if (formData.mileage < 0) {
      newErrors.mileage = 'Kilometrajul nu poate fi negativ';
    }
    if (!formData.location) {
      newErrors.location = 'Locația este obligatorie';
    }
    if (!formData.driver) {
      newErrors.driver = 'Șoferul este obligatoriu';
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
      
      const vehicleService = new VehicleService();
      await vehicleService.addFuelRecord(vehicleId, formData);

      toast({
        title: 'Succes',
        description: 'Înregistrarea de combustibil a fost adăugată cu succes.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onSuccess();
      onClose();
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error adding fuel record:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut adăuga înregistrarea de combustibil.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Calculez automat eficiența și costul per km dacă am suficiente date
    if (field === 'quantity' || field === 'cost') {
      const newFormData = { ...formData, [field]: value };
      
      if (newFormData.quantity > 0 && newFormData.cost > 0) {
        // Calculez costul per litru
        const costPerLiter = newFormData.cost / newFormData.quantity;
        
        // Estimez eficiența bazată pe tipul de combustibil
        let estimatedEfficiency = 0;
        switch (newFormData.fuelType) {
          case 'DIESEL':
            estimatedEfficiency = 7.5; // L/100km pentru diesel
            break;
          case 'PETROL':
            estimatedEfficiency = 8.5; // L/100km pentru benzină
            break;
          case 'HYBRID':
            estimatedEfficiency = 5.5; // L/100km pentru hibrid
            break;
          default:
            estimatedEfficiency = 7.5;
        }
        
        // Calculez costul per km
        const costPerKm = (costPerLiter * estimatedEfficiency) / 100;
        
        setFormData(prev => ({
          ...prev,
          [field]: value,
          efficiency: estimatedEfficiency,
          costPerKm: costPerKm,
        }));
      }
    }
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
        <ModalHeader>Adaugă Înregistrare Combustibil</ModalHeader>

        <ModalBody>
          <VStack spacing={4}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
              <FormControl isInvalid={!!errors.date}>
                <FormLabel>Data Alimentării</FormLabel>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                />
                <FormErrorMessage>{errors.date}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.fuelType}>
                <FormLabel>Tip Combustibil</FormLabel>
                <Select
                  value={formData.fuelType}
                  onChange={(e) => handleChange('fuelType', e.target.value)}
                >
                  <option value="DIESEL">Motorină</option>
                  <option value="PETROL">Benzină</option>
                  <option value="HYBRID">Hibrid</option>
                  <option value="ELECTRIC">Electric</option>
                </Select>
                <FormErrorMessage>{errors.fuelType}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.quantity}>
                <FormLabel>Cantitate (L)</FormLabel>
                <NumberInput
                  value={formData.quantity}
                  onChange={(_, value) => handleChange('quantity', value || 0)}
                  min={0}
                  precision={2}
                >
                  <NumberInputField placeholder="0.00" />
                </NumberInput>
                <FormErrorMessage>{errors.quantity}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.cost}>
                <FormLabel>Cost (RON)</FormLabel>
                <NumberInput
                  value={formData.cost}
                  onChange={(_, value) => handleChange('cost', value || 0)}
                  min={0}
                  precision={2}
                >
                  <NumberInputField placeholder="0.00" />
                </NumberInput>
                <FormErrorMessage>{errors.cost}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.mileage}>
                <FormLabel>Kilometraj</FormLabel>
                <NumberInput
                  value={formData.mileage}
                  onChange={(_, value) => handleChange('mileage', value || 0)}
                  min={0}
                >
                  <NumberInputField placeholder="0" />
                </NumberInput>
                <FormErrorMessage>{errors.mileage}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.location}>
                <FormLabel>Locație</FormLabel>
                <Input
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="ex: Petrom Craiova"
                />
                <FormErrorMessage>{errors.location}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.driver}>
                <FormLabel>Șofer</FormLabel>
                <Input
                  value={formData.driver}
                  onChange={(e) => handleChange('driver', e.target.value)}
                  placeholder="ex: Ion Popescu"
                />
                <FormErrorMessage>{errors.driver}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Eficiență (L/100km)</FormLabel>
                <NumberInput
                  value={formData.efficiency}
                  onChange={(_, value) => handleChange('efficiency', value || 0)}
                  min={0}
                  precision={1}
                >
                  <NumberInputField placeholder="0.0" />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Cost per km (RON)</FormLabel>
                <NumberInput
                  value={formData.costPerKm}
                  onChange={(_, value) => handleChange('costPerKm', value || 0)}
                  min={0}
                  precision={4}
                >
                  <NumberInputField placeholder="0.0000" />
                </NumberInput>
              </FormControl>
            </SimpleGrid>
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
            Adaugă Înregistrare
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 