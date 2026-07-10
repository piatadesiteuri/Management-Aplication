import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  useToast,
} from '@chakra-ui/react';
import api from '../../services/api';

interface CreatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePatientModal({ isOpen, onClose, onSuccess }: CreatePatientModalProps) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    identityType: 'CNP',
    identityNumber: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.identityNumber || !formData.firstName || !formData.lastName) {
      toast({ title: 'Eroare', description: 'Completați câmpurile obligatorii', status: 'error', duration: 3000 });
      return;
    }

    try {
      setLoading(true);
      await api.post('/patients', {
        identityType: formData.identityType,
        identityNumber: formData.identityNumber,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || 'UNKNOWN',
        contactData: { phone: formData.phone, email: formData.email },
      });

      toast({ title: 'Succes', description: 'Pacient adăugat cu succes', status: 'success', duration: 3000 });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({ title: 'Eroare', description: error.response?.data?.message || 'Eroare la creare', status: 'error', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Adăugare Pacient Nou</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <HStack w="full">
              <FormControl isRequired>
                <FormLabel>Tip Act</FormLabel>
                <Select name="identityType" value={formData.identityType} onChange={handleChange}>
                  <option value="CNP">CNP</option>
                  <option value="PASSPORT">Pașaport</option>
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Număr Act / CNP</FormLabel>
                <Input name="identityNumber" value={formData.identityNumber} onChange={handleChange} />
              </FormControl>
            </HStack>
            
            <HStack w="full">
              <FormControl isRequired>
                <FormLabel>Nume</FormLabel>
                <Input name="lastName" value={formData.lastName} onChange={handleChange} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Prenume</FormLabel>
                <Input name="firstName" value={formData.firstName} onChange={handleChange} />
              </FormControl>
            </HStack>

            <HStack w="full">
              <FormControl>
                <FormLabel>Data Nașterii</FormLabel>
                <Input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
              </FormControl>
              <FormControl>
                <FormLabel>Sex</FormLabel>
                <Select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Nespecificat</option>
                  <option value="M">Masculin</option>
                  <option value="F">Feminin</option>
                </Select>
              </FormControl>
            </HStack>

            <HStack w="full">
              <FormControl>
                <FormLabel>Telefon</FormLabel>
                <Input name="phone" value={formData.phone} onChange={handleChange} />
              </FormControl>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input type="email" name="email" value={formData.email} onChange={handleChange} />
              </FormControl>
            </HStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Anulează</Button>
          <Button colorScheme="blue" onClick={handleSubmit} isLoading={loading}>Salvează</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}