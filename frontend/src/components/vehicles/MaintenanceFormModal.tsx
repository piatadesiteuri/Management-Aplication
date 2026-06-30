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

interface MaintenanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: number;
  onSuccess: () => void;
}

const initialFormData = {
  date: new Date().toISOString().split('T')[0],
  type: '',
  description: '',
  cost: 0,
  mileage: 0,
  performedBy: '',
  status: 'COMPLETED' as const,
  priority: 'MEDIUM' as const,
};

export default function MaintenanceFormModal({
  isOpen,
  onClose,
  vehicleId,
  onSuccess,
}: MaintenanceFormModalProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Data este obligatorie';
    }
    if (!formData.type) {
      newErrors.type = 'Tipul intervenției este obligatoriu';
    }
    if (!formData.description) {
      newErrors.description = 'Descrierea este obligatorie';
    }
    if (formData.cost < 0) {
      newErrors.cost = 'Costul nu poate fi negativ';
    }
    if (formData.mileage < 0) {
      newErrors.mileage = 'Kilometrajul nu poate fi negativ';
    }
    if (!formData.performedBy) {
      newErrors.performedBy = 'Executantul este obligatoriu';
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
      await vehicleService.addMaintenanceRecord(vehicleId, formData);

      toast({
        title: 'Succes',
        description: 'Înregistrarea de mentenanță a fost adăugată cu succes.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onSuccess();
      onClose();
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut adăuga înregistrarea de mentenanță.',
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
        <ModalHeader>Adaugă Înregistrare Mentenanță</ModalHeader>

        <ModalBody>
          <VStack spacing={4}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
              <FormControl isInvalid={!!errors.date}>
                <FormLabel>Data Intervenției</FormLabel>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                />
                <FormErrorMessage>{errors.date}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.type}>
                <FormLabel>Tip Intervenție</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  placeholder="Selectează tipul"
                >
                  <option value="Revizie periodică">Revizie periodică</option>
                  <option value="Reparație">Reparație</option>
                  <option value="ITP">ITP</option>
                  <option value="Înlocuire piese">Înlocuire piese</option>
                  <option value="Verificare tehnică">Verificare tehnică</option>
                </Select>
                <FormErrorMessage>{errors.type}</FormErrorMessage>
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

              <FormControl isInvalid={!!errors.performedBy}>
                <FormLabel>Executant</FormLabel>
                <Input
                  value={formData.performedBy}
                  onChange={(e) => handleChange('performedBy', e.target.value)}
                  placeholder="ex: Service Auto Dolj"
                />
                <FormErrorMessage>{errors.performedBy}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="PENDING">În așteptare</option>
                  <option value="IN_PROGRESS">În progres</option>
                  <option value="COMPLETED">Completat</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Prioritate</FormLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                >
                  <option value="LOW">Scăzută</option>
                  <option value="MEDIUM">Medie</option>
                  <option value="HIGH">Ridicată</option>
                  <option value="CRITICAL">Critică</option>
                </Select>
              </FormControl>
            </SimpleGrid>

            <FormControl isInvalid={!!errors.description}>
              <FormLabel>Descriere</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descrierea detaliată a intervenției..."
                rows={4}
              />
              <FormErrorMessage>{errors.description}</FormErrorMessage>
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