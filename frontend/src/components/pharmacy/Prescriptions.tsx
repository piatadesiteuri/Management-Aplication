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

interface Prescription {
  id: number;
  prescription_number: string;
  storage_id: number;
  prescription_date: string;
  patient_name?: string;
  patient_identity?: string;
  patient_age?: number;
  patient_gender?: string;
  doctor_name?: string;
  doctor_specialty?: string;
  diagnosis?: string;
  total_value: number;
  notes?: string;
  status: string;
  storage_name?: string;
  storage_code?: string;
  items?: PrescriptionItem[];
}

interface PrescriptionItem {
  id?: number;
  article_id: number;
  quantity: number;
  unit_price: number;
  dosage?: string;
  administration_route?: string;
  frequency?: string;
  duration_days?: number;
  article_name?: string;
  article_code?: string;
}

export default function Prescriptions() {
  const toast = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
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
  
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [formData, setFormData] = useState({
    prescription_number: '',
    storage_id: '',
    prescription_date: new Date().toISOString().split('T')[0],
    patient_name: '',
    patient_identity: '',
    patient_age: '',
    patient_gender: '',
    doctor_name: '',
    doctor_specialty: '',
    diagnosis: '',
    notes: '',
    status: 'DRAFT'
  });
  const [items, setItems] = useState<PrescriptionItem[]>([]);

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
      const [prescriptionsRes, storagesRes, articlesRes] = await Promise.all([
        api.get('/pharmacy/prescriptions'),
        api.get('/pharmacy/storages'),
        api.get('/pharmacy/articles')
      ]);
      setPrescriptions(prescriptionsRes.data);
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
    const age = patient.date_of_birth ? Math.floor((new Date().getTime() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    setFormData({
      ...formData,
      patient_name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
      patient_identity: patient.identity_number || '',
      patient_age: age ? age.toString() : ''
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
      // Preia următorul număr de rețetă automat
      const response = await api.get('/pharmacy/prescriptions/next-number');
      const nextNumber = response.data.next_number;
      
      setSelectedPrescription(null);
      setFormData({
        prescription_number: nextNumber,
        storage_id: '',
        prescription_date: new Date().toISOString().split('T')[0],
        patient_name: '',
        patient_identity: '',
        patient_age: '',
        patient_gender: '',
        doctor_name: '',
        doctor_specialty: '',
        diagnosis: '',
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
      setSelectedPrescription(null);
      setFormData({
        prescription_number: '',
        storage_id: '',
        prescription_date: new Date().toISOString().split('T')[0],
        patient_name: '',
        patient_identity: '',
        patient_age: '',
        patient_gender: '',
        doctor_name: '',
        doctor_specialty: '',
        diagnosis: '',
        notes: '',
        status: 'DRAFT'
      });
      setItems([]);
      onModalOpen();
    }
  };

  const handleEditClick = async (prescription: Prescription) => {
    try {
      const response = await api.get(`/pharmacy/prescriptions/${prescription.id}`);
      const prescriptionData = response.data;
      setSelectedPrescription(prescriptionData);
      setFormData({
        prescription_number: prescriptionData.prescription_number,
        storage_id: prescriptionData.storage_id.toString(),
        prescription_date: prescriptionData.prescription_date,
        patient_name: prescriptionData.patient_name || '',
        patient_identity: prescriptionData.patient_identity || '',
        patient_age: prescriptionData.patient_age?.toString() || '',
        patient_gender: prescriptionData.patient_gender || '',
        doctor_name: prescriptionData.doctor_name || '',
        doctor_specialty: prescriptionData.doctor_specialty || '',
        diagnosis: prescriptionData.diagnosis || '',
        notes: prescriptionData.notes || '',
        status: prescriptionData.status
      });
      setPatientSearch(prescriptionData.patient_name || '');
      setDoctorSearch(prescriptionData.doctor_name || '');
      setPatients([]);
      setItems(prescriptionData.items || []);
      onModalOpen();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la încărcarea rețetei',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleViewClick = async (prescription: Prescription) => {
    try {
      const response = await api.get(`/pharmacy/prescriptions/${prescription.id}`);
      setSelectedPrescription(response.data);
      onViewOpen();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la încărcarea rețetei',
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
      if (!formData.prescription_number || !formData.storage_id || items.length === 0) {
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
        patient_age: formData.patient_age ? parseInt(formData.patient_age) : null,
        items: items.map(item => ({
          article_id: item.article_id,
          quantity: parseFloat(item.quantity.toString()),
          unit_price: parseFloat(item.unit_price.toString()),
          dosage: item.dosage || null,
          administration_route: item.administration_route || null,
          frequency: item.frequency || null,
          duration_days: item.duration_days || null
        }))
      };

      if (selectedPrescription) {
        await api.put(`/pharmacy/prescriptions/${selectedPrescription.id}`, payload);
        toast({ title: 'Succes', description: 'Rețetă actualizată', status: 'success', duration: 3000 });
      } else {
        await api.post('/pharmacy/prescriptions', payload);
        toast({ title: 'Succes', description: 'Rețetă creată', status: 'success', duration: 3000 });
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
      case 'DISPENSED': return 'green';
      case 'DRAFT': return 'gray';
      case 'CANCELLED': return 'red';
      case 'EXPIRED': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DISPENSED': return 'Eliberată';
      case 'DRAFT': return 'Ciornă';
      case 'CANCELLED': return 'Anulată';
      case 'EXPIRED': return 'Expirată';
      default: return status;
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Heading size="md" color={textColor}>Rețete</Heading>
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={handleAddClick}>
          Adaugă Rețetă
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
              <Th color={textColor}>Diagnostic</Th>
              <Th color={textColor}>Valoare</Th>
              <Th color={textColor}>Status</Th>
              <Th color={textColor}>Acțiuni</Th>
            </Tr>
          </Thead>
          <Tbody>
            {prescriptions.length === 0 ? (
              <Tr>
                <Td colSpan={8} textAlign="center" color={textColor}>
                  Nu există rețete
                </Td>
              </Tr>
            ) : (
              prescriptions.map((prescription) => (
                <Tr key={prescription.id}>
                  <Td color={textColor}>{prescription.prescription_number}</Td>
                  <Td color={textColor}>{new Date(prescription.prescription_date).toLocaleDateString('ro-RO')}</Td>
                  <Td color={textColor}>{prescription.patient_name || '-'}</Td>
                  <Td color={textColor}>{prescription.doctor_name || '-'}</Td>
                  <Td color={textColor}>{prescription.diagnosis || '-'}</Td>
                  <Td color={textColor}>{Number(prescription.total_value || 0).toFixed(2)} RON</Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(prescription.status)}>
                      {getStatusLabel(prescription.status)}
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
                        onClick={() => handleViewClick(prescription)}
                      />
                      <IconButton
                        aria-label="Editează"
                        icon={<FaEdit />}
                        size="sm"
                        colorScheme="green"
                        variant="ghost"
                        onClick={() => handleEditClick(prescription)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Modal pentru Adăugare/Editare - Similar cu Registers, adaptat pentru Rețete */}
      <Modal isOpen={isModalOpen} onClose={onModalClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent bg={cardBg} maxH="90vh">
          <ModalHeader color={textColor}>
            {selectedPrescription ? 'Editează Rețetă' : 'Adaugă Rețetă'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <HStack spacing={4} width="100%">
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Număr Rețetă *</FormLabel>
                  <Input
                    value={formData.prescription_number}
                    onChange={(e) => setFormData({ ...formData, prescription_number: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Data *</FormLabel>
                  <Input
                    type="date"
                    value={formData.prescription_date}
                    onChange={(e) => setFormData({ ...formData, prescription_date: e.target.value })}
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
                        setFormData({ ...formData, patient_name: '', patient_identity: '', patient_age: '' });
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
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Vârstă</FormLabel>
                  <Input
                    type="number"
                    value={formData.patient_age}
                    onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Gen</FormLabel>
                  <Select
                    value={formData.patient_gender}
                    onChange={(e) => setFormData({ ...formData, patient_gender: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  >
                    <option value="">Selectează</option>
                    <option value="M">Masculin</option>
                    <option value="F">Feminin</option>
                  </Select>
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
                  <FormLabel color={textColor}>Specialitate Medic</FormLabel>
                  <Input
                    value={formData.doctor_specialty}
                    onChange={(e) => setFormData({ ...formData, doctor_specialty: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel color={textColor}>Diagnostic</FormLabel>
                <Textarea
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>

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
                        <Th color={textColor}>Doza</Th>
                        <Th color={textColor}>Frecvență</Th>
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
                            <Input
                              value={item.dosage || ''}
                              onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                              bg={bgColor}
                              color={textColor}
                              borderColor={borderColor}
                              placeholder="ex: 500mg"
                            />
                          </Td>
                          <Td>
                            <Input
                              value={item.frequency || ''}
                              onChange={(e) => handleItemChange(index, 'frequency', e.target.value)}
                              bg={bgColor}
                              color={textColor}
                              borderColor={borderColor}
                              placeholder="ex: 2x/zi"
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

              {selectedPrescription && (
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
                    <option value="DISPENSED">Eliberată</option>
                    <option value="CANCELLED">Anulată</option>
                    <option value="EXPIRED">Expirată</option>
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

      {/* Modal pentru Vizualizare - Similar cu Registers */}
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
              <Heading size="md">Detalii Rețetă</Heading>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} mt={1}>
                {selectedPrescription?.prescription_number}
              </Text>
            </Box>
            {selectedPrescription && (
              <Badge 
                colorScheme={getStatusColor(selectedPrescription.status)} 
                fontSize="md" 
                px={3} 
                py={1}
                borderRadius="full"
              >
                {getStatusLabel(selectedPrescription.status)}
              </Badge>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6} overflowY="auto">
            {selectedPrescription && (
              <VStack spacing={6} align="stretch">
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
                        {new Date(selectedPrescription.prescription_date).toLocaleDateString('ro-RO', {
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
                        {selectedPrescription.storage_name}
                      </Text>
                    </Box>
                  </HStack>
                  
                  <HStack spacing={6} flexWrap="wrap" mb={4}>
                    <Box flex="1" minW="220px">
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mb={1}>
                        Pacient
                      </Text>
                      <Text color={textColor} fontWeight="medium">
                        {selectedPrescription.patient_name || '-'}
                      </Text>
                      {selectedPrescription.patient_identity && (
                        <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mt={1}>
                          CNP: {selectedPrescription.patient_identity}
                          {selectedPrescription.patient_age && ` | Vârstă: ${selectedPrescription.patient_age} ani`}
                          {selectedPrescription.patient_gender && ` | ${selectedPrescription.patient_gender === 'M' ? 'Masculin' : 'Feminin'}`}
                        </Text>
                      )}
                    </Box>
                    <Box flex="1" minW="220px">
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mb={1}>
                        Medic
                      </Text>
                      <Text color={textColor} fontWeight="medium">
                        {selectedPrescription.doctor_name || '-'}
                      </Text>
                      {selectedPrescription.doctor_specialty && (
                        <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mt={1}>
                          {selectedPrescription.doctor_specialty}
                        </Text>
                      )}
                    </Box>
                  </HStack>
                  
                  {selectedPrescription.diagnosis && (
                    <Box mb={4}>
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mb={1}>
                        Diagnostic
                      </Text>
                      <Text color={textColor}>{selectedPrescription.diagnosis}</Text>
                    </Box>
                  )}
                  
                  {selectedPrescription.notes && (
                    <Box>
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mb={1}>
                        Observații
                      </Text>
                      <Text color={textColor}>{selectedPrescription.notes}</Text>
                    </Box>
                  )}
                </Box>

                {selectedPrescription.items && selectedPrescription.items.length > 0 && (
                  <Box>
                    <Heading size="sm" mb={4} color={textColor}>Articole</Heading>
                    <TableContainer>
                      <Table variant="simple" size="md" width="100%">
                        <Thead>
                          <Tr bg={useColorModeValue('gray.100', 'gray.700')}>
                            <Th color={textColor} fontWeight="bold" minW="250px">Articol</Th>
                            <Th color={textColor} fontWeight="bold" isNumeric minW="100px">Cantitate</Th>
                            <Th color={textColor} fontWeight="bold" isNumeric minW="120px">Preț Unit</Th>
                            <Th color={textColor} fontWeight="bold" minW="150px">Doza</Th>
                            <Th color={textColor} fontWeight="bold" isNumeric minW="120px">Total</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {selectedPrescription.items.map((item: any, index: number) => (
                            <Tr 
                              key={index}
                              _hover={{ bg: useColorModeValue('gray.50', 'gray.750') }}
                              borderBottom="1px"
                              borderColor={borderColor}
                            >
                              <Td color={textColor} fontWeight="medium" minW="250px">
                                {item.article_name}
                                {item.frequency && (
                                  <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mt={1}>
                                    {item.frequency}
                                    {item.duration_days && ` | ${item.duration_days} zile`}
                                  </Text>
                                )}
                              </Td>
                              <Td color={textColor} isNumeric minW="100px">{Number(item.quantity || 0)}</Td>
                              <Td color={textColor} isNumeric minW="120px">{Number(item.unit_price || 0).toFixed(2)} RON</Td>
                              <Td color={textColor} minW="150px">{item.dosage || '-'}</Td>
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
                        {Number(selectedPrescription.total_value || 0).toFixed(2)} RON
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
