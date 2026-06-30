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
  VStack,
  SimpleGrid,
  useToast,
  FormErrorMessage,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react';
import { useState } from 'react';
import { VehicleService } from '../../services/vehicles/VehicleService';

interface UsageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: number;
  onSuccess: () => void;
}

const initialFormData = {
  userId: 1, // Default user ID
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  startMileage: 0,
  endMileage: 0,
  purpose: '',
  route: '',
};

export default function UsageFormModal({
  isOpen,
  onClose,
  vehicleId,
  onSuccess,
}: UsageFormModalProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.startDate) {
      newErrors.startDate = 'Data de început este obligatorie';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'Data de sfârșit este obligatorie';
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'Data de sfârșit trebuie să fie după data de început';
    }
    if (formData.startMileage < 0) {
      newErrors.startMileage = 'Kilometrajul de început nu poate fi negativ';
    }
    if (formData.endMileage < 0) {
      newErrors.endMileage = 'Kilometrajul de sfârșit nu poate fi negativ';
    }
    if (formData.endMileage <= formData.startMileage) {
      newErrors.endMileage = 'Kilometrajul de sfârșit trebuie să fie mai mare decât cel de început';
    }
    if (!formData.purpose) {
      newErrors.purpose = 'Scopul deplasării este obligatoriu';
    }
    if (!formData.route) {
      newErrors.route = 'Traseul este obligatoriu';
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
      await vehicleService.addUsageRecord(vehicleId, formData);

      toast({
        title: 'Succes',
        description: 'Înregistrarea de utilizare a fost adăugată cu succes.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onSuccess();
      onClose();
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error adding usage record:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut adăuga înregistrarea de utilizare.',
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
  };

  const kmTraveled = formData.endMileage - formData.startMileage;

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
        <ModalHeader>Adaugă Înregistrare Utilizare</ModalHeader>

        <ModalBody>
          <VStack spacing={4}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
              <FormControl isInvalid={!!errors.startDate}>
                <FormLabel>Data Început</FormLabel>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                />
                <FormErrorMessage>{errors.startDate}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.endDate}>
                <FormLabel>Data Sfârșit</FormLabel>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                />
                <FormErrorMessage>{errors.endDate}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.startMileage}>
                <FormLabel>Kilometraj Început</FormLabel>
                <NumberInput
                  value={formData.startMileage}
                  onChange={(_, value) => handleChange('startMileage', value || 0)}
                  min={0}
                >
                  <NumberInputField placeholder="0" />
                </NumberInput>
                <FormErrorMessage>{errors.startMileage}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.endMileage}>
                <FormLabel>Kilometraj Sfârșit</FormLabel>
                <NumberInput
                  value={formData.endMileage}
                  onChange={(_, value) => handleChange('endMileage', value || 0)}
                  min={0}
                >
                  <NumberInputField placeholder="0" />
                </NumberInput>
                <FormErrorMessage>{errors.endMileage}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Utilizator ID</FormLabel>
                <NumberInput
                  value={formData.userId}
                  onChange={(_, value) => handleChange('userId', value || 1)}
                  min={1}
                >
                  <NumberInputField placeholder="1" />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Km Parcurși</FormLabel>
                <Input
                  value={kmTraveled > 0 ? kmTraveled : ''}
                  isReadOnly
                  placeholder="Se calculează automat"
                  bg="gray.50"
                />
              </FormControl>
            </SimpleGrid>

            <FormControl isInvalid={!!errors.purpose}>
              <FormLabel>Scopul Deplasării</FormLabel>
              <Input
                value={formData.purpose}
                onChange={(e) => handleChange('purpose', e.target.value)}
                placeholder="ex: Inspecție în teren"
              />
              <FormErrorMessage>{errors.purpose}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.route}>
              <FormLabel>Traseu</FormLabel>
              <Textarea
                value={formData.route}
                onChange={(e) => handleChange('route', e.target.value)}
                placeholder="ex: Craiova - Calafat - Craiova"
                rows={3}
              />
              <FormErrorMessage>{errors.route}</FormErrorMessage>
            </FormControl>
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