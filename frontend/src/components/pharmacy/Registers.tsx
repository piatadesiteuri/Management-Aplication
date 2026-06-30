import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  HStack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Badge,
  useToast,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  IconButton,
  Text,
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaEye, FaTimes } from 'react-icons/fa';
import api from '../../services/api';

interface Register {
  id: number;
  register_number: string;
  storage_id: number;
  register_date: string;
  patient_name?: string;
  patient_identity?: string;
  doctor_name?: string;
  prescription_number?: string;
  total_value: number;
  notes?: string;
  status: string;
  storage_name?: string;
  storage_code?: string;
  items?: RegisterItem[];
}

interface RegisterItem {
  id?: number;
  article_id: number;
  quantity: number;
  unit_price: number;
  article_name?: string;
  article_code?: string;
}

export default function Registers() {
  const toast = useToast();
  const [registers, setRegisters] = useState<Register[]>([]);
  const [storages, setStorages] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [searchingDoctor, setSearchingDoctor] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  
  const [selectedRegister, setSelectedRegister] = useState<Register | null>(null);
  const [formData, setFormData] = useState({
    register_number: '',
    storage_id: '',
    register_date: new Date().toISOString().split('T')[0],
    patient_name: '',
    patient_identity: '',
    doctor_name: '',
    prescription_number: '',
    notes: '',
    status: 'DRAFT'
  });
  const [items, setItems] = useState<RegisterItem[]>([]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.100', 'gray.600');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const readonlyBg = useColorModeValue('gray.100', 'gray.700');

  useEffect(() => {
    loadData();
    loadDoctors();
  }, []);

  useEffect(() => {
    if (patientSearch.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        searchPatients();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setPatients([]);
    }
  }, [patientSearch]);

  useEffect(() => {
    if (doctorSearch.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        searchDoctors();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setDoctors([]);
    }
  }, [doctorSearch]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [registersRes, storagesRes, articlesRes] = await Promise.all([
        api.get('/pharmacy/registers'),
        api.get('/pharmacy/storages'),
        api.get('/pharmacy/articles')
      ]);
      setRegisters(registersRes.data);
      setStorages(storagesRes.data);
      setArticles(articlesRes.data);
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la încărcarea datelor',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await api.get('/pharmacy/doctors');
      setDoctors(response.data);
    } catch (error: any) {
      console.error('Error loading doctors:', error);
    }
  };

  const searchPatients = async () => {
    if (!patientSearch.trim()) {
      setPatients([]);
      return;
    }

    try {
      setSearchingPatient(true);
      const response = await api.get(`/patients?search=${encodeURIComponent(patientSearch)}&limit=20`);
      const patientsData = response.data.patients || (Array.isArray(response.data) ? response.data : []);
      setPatients(patientsData);
    } catch (error: any) {
      console.error('Error searching patients:', error);
    } finally {
      setSearchingPatient(false);
    }
  };

  const searchDoctors = async () => {
    if (!doctorSearch.trim()) {
      setDoctors([]);
      return;
    }

    try {
      setSearchingDoctor(true);
      const response = await api.get(`/pharmacy/doctors?search=${encodeURIComponent(doctorSearch)}`);
      setDoctors(response.data);
    } catch (error: any) {
      console.error('Error searching doctors:', error);
    } finally {
      setSearchingDoctor(false);
    }
  };

  const handleSelectPatient = (patient: any) => {
    setFormData({
      ...formData,
      patient_name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
      patient_identity: patient.identity_number || ''
    });
    setPatientSearch('');
    setPatients([]);
  };

  const handleSelectDoctor = (doctor: any) => {
    setFormData({
      ...formData,
      doctor_name: doctor.name
    });
    setDoctorSearch('');
    setDoctors([]);
  };

  const handleAddClick = async () => {
    try {
      // Preia următorul număr de condică automat
      const response = await api.get('/pharmacy/registers/next-number');
      const nextNumber = response.data.next_number;
      
      setSelectedRegister(null);
      setFormData({
        register_number: nextNumber,
        storage_id: '',
        register_date: new Date().toISOString().split('T')[0],
        patient_name: '',
        patient_identity: '',
        doctor_name: '',
        prescription_number: '',
        notes: '',
        status: 'DRAFT'
      });
      setPatientSearch('');
      setDoctorSearch('');
      setPatients([]);
      setItems([]);
      onModalOpen();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la generarea numărului',
        status: 'error',
        duration: 3000
      });
      setSelectedRegister(null);
      setFormData({
        register_number: '',
        storage_id: '',
        register_date: new Date().toISOString().split('T')[0],
        patient_name: '',
        patient_identity: '',
        doctor_name: '',
        prescription_number: '',
        notes: '',
        status: 'DRAFT'
      });
      setPatientSearch('');
      setDoctorSearch('');
      setPatients([]);
      setItems([]);
      onModalOpen();
    }
  };

  const handleEditClick = async (register: Register) => {
    try {
      const response = await api.get(`/pharmacy/registers/${register.id}`);
      const registerData = response.data;
      setSelectedRegister(registerData);
      setFormData({
        register_number: registerData.register_number,
        storage_id: registerData.storage_id.toString(),
        register_date: registerData.register_date,
        patient_name: registerData.patient_name || '',
        patient_identity: registerData.patient_identity || '',
        doctor_name: registerData.doctor_name || '',
        prescription_number: registerData.prescription_number || '',
        notes: registerData.notes || '',
        status: registerData.status
      });
      setPatientSearch(registerData.patient_name || '');
      setDoctorSearch(registerData.doctor_name || '');
      setPatients([]);
      setItems(registerData.items || []);
      onModalOpen();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la încărcarea condicii',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleViewClick = async (register: Register) => {
    try {
      const response = await api.get(`/pharmacy/registers/${register.id}`);
      setSelectedRegister(response.data);
      onViewOpen();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la încărcarea condicii',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleAddItem = () => {
    setItems([...items, { article_id: 0, quantity: 0, unit_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSave = async () => {
    try {
      if (!formData.register_number || !formData.storage_id || items.length === 0) {
        toast({
          title: 'Eroare',
          description: 'Completează toate câmpurile obligatorii și adaugă cel puțin un articol',
          status: 'error',
          duration: 3000
        });
        return;
      }

      const payload = {
        ...formData,
        storage_id: parseInt(formData.storage_id),
        items: items.map(item => ({
          article_id: item.article_id,
          quantity: parseFloat(item.quantity.toString()),
          unit_price: parseFloat(item.unit_price.toString())
        }))
      };

      if (selectedRegister) {
        await api.put(`/pharmacy/registers/${selectedRegister.id}`, payload);
        toast({ title: 'Succes', description: 'Condică actualizată', status: 'success', duration: 3000 });
      } else {
        await api.post('/pharmacy/registers', payload);
        toast({ title: 'Succes', description: 'Condică creată', status: 'success', duration: 3000 });
      }
      
      onModalClose();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la salvare',
        status: 'error',
        duration: 3000
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ISSUED': return 'green';
      case 'DRAFT': return 'gray';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ISSUED': return 'Eliberată';
      case 'DRAFT': return 'Ciornă';
      case 'CANCELLED': return 'Anulată';
      default: return status;
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Heading size="md" color={textColor}>Condici</Heading>
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={handleAddClick}>
          Adaugă Condică
        </Button>
      </HStack>

      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th color={textColor}>Număr</Th>
              <Th color={textColor}>Data</Th>
              <Th color={textColor}>Pacient</Th>
              <Th color={textColor}>Medic</Th>
              <Th color={textColor}>Gestiune</Th>
              <Th color={textColor}>Valoare</Th>
              <Th color={textColor}>Status</Th>
              <Th color={textColor}>Acțiuni</Th>
            </Tr>
          </Thead>
          <Tbody>
            {registers.length === 0 ? (
              <Tr>
                <Td colSpan={8} textAlign="center" color={textColor}>
                  Nu există condici
                </Td>
              </Tr>
            ) : (
              registers.map((register) => (
                <Tr key={register.id}>
                  <Td color={textColor}>{register.register_number}</Td>
                  <Td color={textColor}>{new Date(register.register_date).toLocaleDateString('ro-RO')}</Td>
                  <Td color={textColor}>{register.patient_name || '-'}</Td>
                  <Td color={textColor}>{register.doctor_name || '-'}</Td>
                  <Td color={textColor}>{register.storage_name}</Td>
                  <Td color={textColor}>{Number(register.total_value || 0).toFixed(2)} RON</Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(register.status)}>
                      {getStatusLabel(register.status)}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Vezi"
                        icon={<FaEye />}
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        onClick={() => handleViewClick(register)}
                      />
                      <IconButton
                        aria-label="Editează"
                        icon={<FaEdit />}
                        size="sm"
                        colorScheme="green"
                        variant="ghost"
                        onClick={() => handleEditClick(register)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Modal pentru Adăugare/Editare - Similar cu EntryNotes, adaptat pentru Condici */}
      <Modal isOpen={isModalOpen} onClose={onModalClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent bg={cardBg} maxH="90vh">
          <ModalHeader color={textColor}>
            {selectedRegister ? 'Editează Condică' : 'Adaugă Condică'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <HStack spacing={4} width="100%">
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Număr Condică *</FormLabel>
                  <Input
                    value={formData.register_number}
                    onChange={(e) => setFormData({ ...formData, register_number: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Data *</FormLabel>
                  <Input
                    type="date"
                    value={formData.register_date}
                    onChange={(e) => setFormData({ ...formData, register_date: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel color={textColor}>Gestiune *</FormLabel>
                <Select
                  value={formData.storage_id}
                  onChange={(e) => setFormData({ ...formData, storage_id: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                >
                  <option value="">Selectează gestiunea</option>
                  {storages.map((storage) => (
                    <option key={storage.id} value={storage.id}>
                      {storage.name} ({storage.code})
                    </option>
                  ))}
                </Select>
              </FormControl>

              <HStack spacing={4} width="100%">
                <FormControl flex={1} position="relative">
                  <FormLabel color={textColor}>Pacient</FormLabel>
                  <Input
                    value={patientSearch || formData.patient_name}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      if (!e.target.value) {
                        setFormData({ ...formData, patient_name: '', patient_identity: '' });
                      }
                    }}
                    onFocus={() => {
                      if (formData.patient_name) {
                        setPatientSearch(formData.patient_name);
                      }
                    }}
                    placeholder="Caută pacient (nume sau CNP)..."
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                  {patients.length > 0 && (
                    <Box
                      position="absolute"
                      zIndex={1000}
                      w="100%"
                      mt={1}
                      bg={cardBg}
                      border="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                      maxH="200px"
                      overflowY="auto"
                      boxShadow="lg"
                    >
                      {patients.map((patient) => (
                        <Box
                          key={patient.id}
                          p={2}
                          cursor="pointer"
                          _hover={{ bg: hoverBg }}
                          onClick={() => handleSelectPatient(patient)}
                        >
                          <Text fontWeight="medium" color={textColor}>
                            {patient.first_name} {patient.last_name}
                          </Text>
                          {patient.identity_number && (
                            <Text fontSize="sm" color={mutedText}>
                              CNP: {patient.identity_number}
                            </Text>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel color={textColor}>CNP Pacient</FormLabel>
                  <Input
                    value={formData.patient_identity}
                    readOnly
                    bg={readonlyBg}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} width="100%">
                <FormControl flex={1} position="relative">
                  <FormLabel color={textColor}>Medic</FormLabel>
                  <Input
                    value={doctorSearch || formData.doctor_name}
                    onChange={(e) => {
                      setDoctorSearch(e.target.value);
                      if (!e.target.value) {
                        setFormData({ ...formData, doctor_name: '' });
                      }
                    }}
                    onFocus={() => {
                      if (formData.doctor_name) {
                        setDoctorSearch(formData.doctor_name);
                      }
                    }}
                    placeholder="Caută medic (nume sau email)..."
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                  {doctors.length > 0 && (
                    <Box
                      position="absolute"
                      zIndex={1000}
                      w="100%"
                      mt={1}
                      bg={cardBg}
                      border="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                      maxH="200px"
                      overflowY="auto"
                      boxShadow="lg"
                    >
                      {doctors.map((doctor) => (
                        <Box
                          key={doctor.id}
                          p={2}
                          cursor="pointer"
                          _hover={{ bg: hoverBg }}
                          onClick={() => handleSelectDoctor(doctor)}
                        >
                          <Text fontWeight="medium" color={textColor}>
                            {doctor.name}
                          </Text>
                          {doctor.email && (
                            <Text fontSize="sm" color={mutedText}>
                              {doctor.email}
                            </Text>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Număr Prescripție</FormLabel>
                  <Input
                    value={formData.prescription_number}
                    onChange={(e) => setFormData({ ...formData, prescription_number: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel color={textColor}>Observații</FormLabel>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>

              <Box width="100%">
                <HStack justify="space-between" mb={2}>
                  <Heading size="sm" color={textColor}>Articole</Heading>
                  <Button size="sm" leftIcon={<FaPlus />} onClick={handleAddItem}>
                    Adaugă Articol
                  </Button>
                </HStack>
                <TableContainer>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th color={textColor} minW="300px">Articol</Th>
                        <Th color={textColor}>Cantitate</Th>
                        <Th color={textColor}>Preț Unit</Th>
                        <Th color={textColor}>Acțiuni</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {items.map((item, index) => (
                        <Tr key={index}>
                          <Td minW="300px">
                            <Select
                              value={item.article_id}
                              onChange={(e) => handleItemChange(index, 'article_id', parseInt(e.target.value))}
                              bg={bgColor}
                              color={textColor}
                              borderColor={borderColor}
                              minW="280px"
                            >
                              <option value="0">Selectează articol</option>
                              {articles.map((article) => (
                                <option key={article.id} value={article.id}>
                                  {article.name} ({article.code})
                                </option>
                              ))}
                            </Select>
                          </Td>
                          <Td>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                              bg={bgColor}
                              color={textColor}
                              borderColor={borderColor}
                            />
                          </Td>
                          <Td>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              bg={bgColor}
                              color={textColor}
                              borderColor={borderColor}
                            />
                          </Td>
                          <Td>
                            <IconButton
                              aria-label="Șterge"
                              icon={<FaTimes />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => handleRemoveItem(index)}
                            />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
                {items.length > 0 && (
                  <Box mt={2} textAlign="right">
                    <Text color={textColor} fontWeight="bold">
                      Total: {totalValue.toFixed(2)} RON
                    </Text>
                  </Box>
                )}
              </Box>

              {selectedRegister && (
                <FormControl>
                  <FormLabel color={textColor}>Status</FormLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  >
                    <option value="DRAFT">Ciornă</option>
                    <option value="ISSUED">Eliberată</option>
                    <option value="CANCELLED">Anulată</option>
                  </Select>
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onModalClose}>Anulează</Button>
            <Button colorScheme="blue" onClick={handleSave}>Salvează</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal pentru Vizualizare */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="6xl">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent bg={cardBg} borderRadius="lg" boxShadow="xl" maxW="1400px" maxH="90vh">
          <ModalHeader 
            color={textColor} 
            borderBottom="1px" 
            borderColor={borderColor}
            pb={4}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Heading size="md">Detalii Condică</Heading>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} mt={1}>
                {selectedRegister?.register_number}
              </Text>
            </Box>
            {selectedRegister && (
              <Badge 
                colorScheme={getStatusColor(selectedRegister.status)} 
                fontSize="md" 
                px={3} 
                py={1}
                borderRadius="full"
              >
                {getStatusLabel(selectedRegister.status)}
              </Badge>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6} overflowY="auto">
            {selectedRegister && (
              <VStack spacing={6} align="stretch">
                {/* Informații generale */}
                <Box 
                  bg={useColorModeValue('gray.50', 'gray.800')} 
                  p={4} 
                  borderRadius="md"
                  border="1px"
                  borderColor={borderColor}
                >
                  <HStack spacing={6} flexWrap="wrap" mb={4}>
                    <Box flex="1" minW="220px">
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mb={1}>
                        Data
                      </Text>
                      <Text color={textColor} fontWeight="medium">
                        {new Date(selectedRegister.register_date).toLocaleDateString('ro-RO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                    </Box>
                    <Box flex="1" minW="220px">
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mb={1}>
                        Gestiune
                      </Text>
                      <Text color={textColor} fontWeight="medium">
                        {selectedRegister.storage_name}
                      </Text>
                    </Box>
                  </HStack>
                  
                  <HStack spacing={6} flexWrap="wrap" mb={4}>
                    <Box flex="1" minW="220px">
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mb={1}>
                        Pacient
                      </Text>
                      <Text color={textColor} fontWeight="medium">
                        {selectedRegister.patient_name || '-'}
                      </Text>
                      {selectedRegister.patient_identity && (
                        <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mt={1}>
                          CNP: {selectedRegister.patient_identity}
                        </Text>
                      )}
                    </Box>
                    <Box flex="1" minW="220px">
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mb={1}>
                        Medic
                      </Text>
                      <Text color={textColor} fontWeight="medium">
                        {selectedRegister.doctor_name || '-'}
                      </Text>
                      {selectedRegister.prescription_number && (
                        <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mt={1}>
                          Prescripție: {selectedRegister.prescription_number}
                        </Text>
                      )}
                    </Box>
                  </HStack>
                  
                  {selectedRegister.notes && (
                    <Box>
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mb={1}>
                        Observații
                      </Text>
                      <Text color={textColor}>{selectedRegister.notes}</Text>
                    </Box>
                  )}
                </Box>

                {/* Articole */}
                {selectedRegister.items && selectedRegister.items.length > 0 && (
                  <Box>
                    <Heading size="sm" mb={4} color={textColor}>Articole</Heading>
                    <TableContainer>
                      <Table variant="simple" size="md" width="100%">
                        <Thead>
                          <Tr bg={useColorModeValue('gray.100', 'gray.700')}>
                            <Th color={textColor} fontWeight="bold" minW="250px">Articol</Th>
                            <Th color={textColor} fontWeight="bold" isNumeric minW="100px">Cantitate</Th>
                            <Th color={textColor} fontWeight="bold" isNumeric minW="120px">Preț Unit</Th>
                            <Th color={textColor} fontWeight="bold" isNumeric minW="120px">Total</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {selectedRegister.items.map((item: any, index: number) => (
                            <Tr 
                              key={index}
                              _hover={{ bg: useColorModeValue('gray.50', 'gray.750') }}
                              borderBottom="1px"
                              borderColor={borderColor}
                            >
                              <Td color={textColor} fontWeight="medium" minW="250px">
                                {item.article_name}
                              </Td>
                              <Td color={textColor} isNumeric minW="100px">{Number(item.quantity || 0)}</Td>
                              <Td color={textColor} isNumeric minW="120px">{Number(item.unit_price || 0).toFixed(2)} RON</Td>
                              <Td color={textColor} isNumeric fontWeight="bold" minW="120px">
                                {(Number(item.quantity || 0) * Number(item.unit_price || 0)).toFixed(2)} RON
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                    <Box 
                      mt={4} 
                      pt={4} 
                      borderTop="2px" 
                      borderColor={borderColor}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Text color={textColor} fontSize="lg" fontWeight="bold">
                        Total General
                      </Text>
                      <Text color={textColor} fontSize="xl" fontWeight="bold">
                        {Number(selectedRegister.total_value || 0).toFixed(2)} RON
                      </Text>
                    </Box>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTop="1px" borderColor={borderColor} pt={4}>
            <Button colorScheme="blue" onClick={onViewClose} size="md">
              Închide
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
