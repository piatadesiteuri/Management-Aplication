import { useState, useEffect } from 'react';
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
  Textarea,
  VStack,
  HStack,
  Badge,
  IconButton,
  useToast,
  Box,
  Text,
  Checkbox,
  Divider,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import { FaSearch, FaTimes, FaPlus } from 'react-icons/fa';
import api from '../../services/api';
import CreatePatientModal from '../patients/CreatePatientModal';

type Patient = {
  id: number;
  first_name: string;
  last_name: string;
  identity_number: string;
  date_of_birth?: string;
  gender: string;
};

type Laboratory = {
  id: number;
  name: string;
  code: string;
};

type LaboratoryDoctor = {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  is_responsible: boolean;
};

type Test = {
  id: number;
  name: string;
  code: string;
  sample_type: string;
  category_id?: number;
};

type TestCategory = {
  id: number;
  name: string;
  code: string;
};

interface CreateAnalysisRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAnalysisRequestModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateAnalysisRequestModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [selectedLaboratory, setSelectedLaboratory] = useState<number | ''>('');
  const [laboratoryDoctors, setLaboratoryDoctors] = useState<LaboratoryDoctor[]>([]);
  const [selectedResponsibleDoctor, setSelectedResponsibleDoctor] = useState<number | ''>('');
  const [selectedReferringDoctor, setSelectedReferringDoctor] = useState<number | ''>('');
  const [observations, setObservations] = useState('');
  const [testCategories, setTestCategories] = useState<TestCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [tests, setTests] = useState<Test[]>([]);
  const [filteredTests, setFilteredTests] = useState<Test[]>([]);
  const [testSearch, setTestSearch] = useState('');
  const [selectedTests, setSelectedTests] = useState<number[]>([]);
  const [receptionType, setReceptionType] = useState<'WITH_RECEPTION' | 'WITH_LABELING' | 'WITHOUT_RECEPTION'>('WITHOUT_RECEPTION');
  const toast = useToast();
  const { isOpen: isNewPatientOpen, onOpen: onNewPatientOpen, onClose: onNewPatientClose } = useDisclosure();

  // Culori pentru tema întunecată
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('blue.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectedTestBg = useColorModeValue('blue.50', 'blue.900');

  useEffect(() => {
    if (isOpen) {
      loadLaboratories();
      loadTestCategories();
      loadTests();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedLaboratory) {
      loadLaboratoryDoctors(selectedLaboratory as number);
    } else {
      setLaboratoryDoctors([]);
    }
  }, [selectedLaboratory]);

  useEffect(() => {
    if (selectedCategory) {
      loadTestsByCategory(selectedCategory as number);
    } else {
      loadTests();
    }
  }, [selectedCategory]);

  const loadLaboratories = async () => {
    try {
      const response = await api.get('/lims/laboratories');
      setLaboratories(response.data);
    } catch (error) {
      console.error('Error loading laboratories:', error);
    }
  };

  const loadTestCategories = async () => {
    try {
      const response = await api.get('/lims/test-categories');
      setTestCategories(response.data);
    } catch (error) {
      console.error('Error loading test categories:', error);
    }
  };

  const loadTests = async () => {
    try {
      const response = await api.get('/lims/tests');
      setTests(response.data);
      setFilteredTests(response.data);
    } catch (error) {
      console.error('Error loading tests:', error);
    }
  };

  const loadTestsByCategory = async (categoryId: number) => {
    try {
      const response = await api.get(`/lims/tests?category_id=${categoryId}`);
      setTests(response.data);
      setFilteredTests(response.data);
      setTestSearch(''); // Reset search when category changes
    } catch (error) {
      console.error('Error loading tests by category:', error);
    }
  };

  useEffect(() => {
    if (testSearch) {
      const filtered = tests.filter(
        (t) =>
          t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
          t.code.toLowerCase().includes(testSearch.toLowerCase())
      );
      setFilteredTests(filtered);
    } else {
      setFilteredTests(tests);
    }
  }, [testSearch, tests]);

  const loadLaboratoryDoctors = async (laboratoryId: number) => {
    try {
      const response = await api.get(`/lims/laboratories/${laboratoryId}/doctors`);
      setLaboratoryDoctors(response.data);
    } catch (error) {
      console.error('Error loading laboratory doctors:', error);
    }
  };

  const searchPatients = async () => {
    if (!patientSearch.trim()) {
      setPatients([]);
      return;
    }

    try {
      setSearchingPatient(true);
      const response = await api.get(`/patients?search=${encodeURIComponent(patientSearch)}`);
      
      console.log("Răspuns API pacienți:", response.data);
      
      let patientsData: Patient[] = [];
      if (Array.isArray(response.data)) {
        patientsData = response.data;
      } else if (response.data?.patients && Array.isArray(response.data.patients)) {
        patientsData = response.data.patients;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        patientsData = response.data.data;
      } else if (response.data?.items && Array.isArray(response.data.items)) {
        patientsData = response.data.items;
      } else {
        const possibleArray = Object.values(response.data || {}).find(v => Array.isArray(v));
        if (possibleArray) patientsData = possibleArray as Patient[];
      }

      setPatients(patientsData);
      
      if (patientsData.length === 0) {
        toast({
          title: 'Informație',
          description: 'Nu s-au găsit pacienți. Puteți adăuga un pacient nou.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      console.error('Error searching patients:', error);
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Nu s-au putut căuta pacienții',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSearchingPatient(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch('');
    setPatients([]);
    setStep(2);
  };

  const handleAddTest = (testId: number) => {
    if (!selectedTests.includes(testId)) {
      setSelectedTests([...selectedTests, testId]);
    }
  };

  const handleRemoveTest = (testId: number) => {
    setSelectedTests(selectedTests.filter((id) => id !== testId));
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !selectedLaboratory || selectedTests.length === 0) {
      toast({
        title: 'Eroare',
        description: 'Completați toate câmpurile obligatorii',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      await api.post('/lims/analysis-requests', {
        patient_id: selectedPatient.id,
        laboratory_id: selectedLaboratory,
        responsible_doctor_id: selectedResponsibleDoctor || null,
        referring_doctor_id: selectedReferringDoctor || null,
        diagnosis: null, // Nu mai trimitem diagnosticul
        observations: observations || null,
        reception_type: receptionType,
        test_ids: selectedTests,
      });

      // Reset form
      setSelectedPatient(null);
      setSelectedLaboratory('');
      setSelectedResponsibleDoctor('');
      setSelectedReferringDoctor('');
      setObservations('');
      setSelectedTests([]);
      setTestSearch('');
      setSelectedCategory('');
      setReceptionType('WITHOUT_RECEPTION');
      setStep(1);

      onSuccess();
    } catch (error: any) {
      console.error('Error creating analysis request:', error);
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Nu s-a putut crea cererea de analize',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPatient(null);
      setSelectedLaboratory('');
      setSelectedResponsibleDoctor('');
      setSelectedReferringDoctor('');
      setObservations('');
      setSelectedTests([]);
      setTestSearch('');
      setSelectedCategory('');
      setReceptionType('WITHOUT_RECEPTION');
      setStep(1);
      setPatientSearch('');
      setPatients([]);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent bg={bgColor}>
          <ModalHeader>
            {step === 1 && 'Căutare Pacient'}
            {step === 2 && 'Detalii Cerere și Selectare Teste'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {step === 1 && (
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Căutare pacient (nume, CNP, etc.)</FormLabel>
                  <HStack>
                    <Input
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
                      placeholder="Introduceți nume sau CNP..."
                    />
                    <Button
                      leftIcon={<FaSearch />}
                      onClick={searchPatients}
                      isLoading={searchingPatient}
                    >
                      Caută
                    </Button>
                  </HStack>
                </FormControl>

                {patients.length > 0 && (
                  <Box>
                    <Text fontWeight="semibold" mb={2}>Rezultate căutare:</Text>
                    <VStack align="stretch" spacing={2} maxH="300px" overflowY="auto">
                      {patients.map((patient) => (
                        <Box
                          key={patient.id}
                          p={3}
                          border="1px"
                          borderColor="gray.200"
                          borderRadius="md"
                          cursor="pointer"
                          _hover={{ bg: 'gray.50' }}
                          onClick={() => handleSelectPatient(patient)}
                        >
                          <Text fontWeight="medium">
                            {patient.first_name} {patient.last_name}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            CNP: {patient.identity_number}
                            {patient.date_of_birth && ` | ${new Date(patient.date_of_birth).toLocaleDateString('ro-RO')}`}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}

                {selectedPatient && (
                  <Box p={3} bg="blue.50" borderRadius="md">
                    <Text fontWeight="semibold">Pacient selectat:</Text>
                    <Text>
                      {selectedPatient.first_name} {selectedPatient.last_name} ({selectedPatient.identity_number})
                    </Text>
                  </Box>
                )}

                <HStack spacing={2}>
                  <Button
                    colorScheme="blue"
                    onClick={onNewPatientOpen}
                    variant="outline"
                  >
                    Adaugă pacient nou
                  </Button>
                  {selectedPatient && (
                    <Button
                      colorScheme="green"
                      onClick={() => {
                        const basePath = window.location.pathname.startsWith('/admin') ? '/admin' : '/user';
                        window.open(`${basePath}/patients?id=${selectedPatient.id}`, '_blank');
                      }}
                      variant="outline"
                    >
                      Actualizează date pacient
                    </Button>
                  )}
                </HStack>
              </VStack>
            )}

            {step === 2 && selectedPatient && (
              <VStack spacing={4} align="stretch">
                <Box p={3} bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor}>
                  <HStack justify="space-between">
                    <Box>
                      <Text fontWeight="semibold" color={textColor}>Pacient selectat:</Text>
                      <Text color={textColor}>
                        {selectedPatient.first_name} {selectedPatient.last_name} ({selectedPatient.identity_number})
                      </Text>
                      {selectedPatient.date_of_birth && (
                        <Text fontSize="sm" color={secondaryTextColor}>
                          Data nașterii: {new Date(selectedPatient.date_of_birth).toLocaleDateString('ro-RO')}
                        </Text>
                      )}
                    </Box>
                  <Button
                      size="sm"
                      colorScheme="blue"
                      variant="outline"
                      onClick={() => {
                        const basePath = window.location.pathname.startsWith('/admin') ? '/admin' : '/user';
                        window.open(`${basePath}/patients?id=${selectedPatient.id}`, '_blank');
                      }}
                    >
                      Verifică/Actualizează date
                    </Button>
                  </HStack>
                </Box>

                <FormControl isRequired>
                  <FormLabel color={textColor}>Laborator *</FormLabel>
                  <Select
                    value={selectedLaboratory}
                    onChange={(e) => setSelectedLaboratory(parseInt(e.target.value) || '')}
                    placeholder="Selectați laboratorul"
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  >
                    {laboratories.map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                {selectedLaboratory && (
                  <FormControl>
                    <FormLabel color={textColor}>Medic responsabil laborator</FormLabel>
                    <Select
                      value={selectedResponsibleDoctor}
                      onChange={(e) => setSelectedResponsibleDoctor(parseInt(e.target.value) || '')}
                      placeholder="Selectați medicul responsabil"
                      bg={bgColor}
                      color={textColor}
                      borderColor={borderColor}
                    >
                      {laboratoryDoctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.first_name} {doctor.last_name}
                          {doctor.is_responsible && ' (Responsabil)'}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <FormControl>
                  <FormLabel color={textColor}>Medic trimițător (opțional)</FormLabel>
                  <Select
                    value={selectedReferringDoctor}
                    onChange={(e) => setSelectedReferringDoctor(parseInt(e.target.value) || '')}
                    placeholder="Selectați medicul trimițător"
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  >
                    <option value="">Niciunul</option>
                    {/* Aici ar trebui să încărci lista de medici */}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel color={textColor}>Observații (opțional)</FormLabel>
                  <Textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Introduceți observații..."
                    rows={3}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                    _placeholder={{ color: secondaryTextColor }}
                  />
                </FormControl>

                <Divider />

                <Box>
                  <Text fontWeight="semibold" mb={3} fontSize="lg" color={textColor}>
                    Selectare Teste *
                  </Text>
                  <Text fontSize="sm" color={secondaryTextColor} mb={3}>
                    Selectați testele ce se doresc a fi efectuate, fie prin căutarea acestora după denumire fie prin selectarea din lista de teste și apăsarea butonului Adaugă.
                  </Text>

                  <FormControl mb={3}>
                    <FormLabel color={textColor}>Categorie teste</FormLabel>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(parseInt(e.target.value) || '')}
                      placeholder="Toate categoriile"
                      bg={bgColor}
                      color={textColor}
                      borderColor={borderColor}
                    >
                      <option value="">Toate categoriile</option>
                      {testCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl mb={3}>
                    <FormLabel color={textColor}>Căutare test după nume sau cod</FormLabel>
                    <Input
                      placeholder="Caută test..."
                      value={testSearch}
                      onChange={(e) => setTestSearch(e.target.value)}
                      bg={bgColor}
                      color={textColor}
                      borderColor={borderColor}
                      _placeholder={{ color: secondaryTextColor }}
                    />
                  </FormControl>

                  <Box>
                    <Text fontWeight="semibold" mb={2} color={textColor}>
                      Teste disponibile ({filteredTests.length})
                    </Text>
                    <Box maxH="300px" overflowY="auto" border="1px" borderColor={borderColor} borderRadius="md" p={2} bg={bgColor}>
                      <VStack align="stretch" spacing={2}>
                        {filteredTests.length === 0 ? (
                          <Text textAlign="center" color={secondaryTextColor} py={4}>
                            Nu s-au găsit teste
                          </Text>
                        ) : (
                          filteredTests.map((test) => (
                            <HStack
                              key={test.id}
                              p={2}
                              border="1px"
                              borderColor={borderColor}
                              borderRadius="md"
                              justify="space-between"
                              bg={bgColor}
                              _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                              style={{ backgroundColor: bgColor }}
                            >
                              <Box flex={1}>
                                <Text fontWeight="medium" color={textColor}>{test.name}</Text>
                                <Text fontSize="sm" color={secondaryTextColor}>
                                  {test.code} - {test.sample_type}
                                </Text>
                              </Box>
                              {selectedTests.includes(test.id) ? (
                                <Badge colorScheme="green">Adăugat</Badge>
                              ) : (
                                <IconButton
                                  icon={<FaPlus />}
                                  aria-label="Adaugă test"
                                  size="sm"
                                  colorScheme="blue"
                                  onClick={() => handleAddTest(test.id)}
                                />
                              )}
                            </HStack>
                          ))
                        )}
                      </VStack>
                    </Box>
                  </Box>

                  {selectedTests.length > 0 && (
                    <Box mt={4}>
                      <Text fontWeight="semibold" mb={2} color={textColor}>
                        Teste selectate ({selectedTests.length})
                      </Text>
                      <VStack align="stretch" spacing={2}>
                        {selectedTests.map((testId) => {
                          const test = tests.find((t) => t.id === testId);
                          if (!test) return null;
                          return (
                            <HStack
                              key={testId}
                              p={2}
                              bg={selectedTestBg}
                              borderRadius="md"
                              justify="space-between"
                              border="1px"
                              borderColor={borderColor}
                            >
                              <Text color={textColor}>{test.name} ({test.code})</Text>
                              <IconButton
                                icon={<FaTimes />}
                                aria-label="Elimină test"
                                size="sm"
                                colorScheme="red"
                                onClick={() => handleRemoveTest(testId)}
                              />
                            </HStack>
                          );
                        })}
                      </VStack>
                    </Box>
                  )}
                </Box>

                <Divider />

                <FormControl>
                  <FormLabel color={textColor}>Tip recepție</FormLabel>
                  <Select
                    value={receptionType}
                    onChange={(e) => setReceptionType(e.target.value as any)}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  >
                    <option value="WITHOUT_RECEPTION">Fără recepție și etichetare</option>
                    <option value="WITH_RECEPTION">Cu recepție</option>
                    <option value="WITH_LABELING">Cu recepție și etichetare</option>
                  </Select>
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack>
              {step > 1 && (
                <Button onClick={() => setStep(step - 1)}>Înapoi</Button>
              )}
              {step === 1 ? (
                <Button
                  colorScheme="blue"
                  onClick={() => {
                    if (selectedPatient) {
                      setStep(2);
                    }
                  }}
                  isDisabled={!selectedPatient}
                >
                  Următorul
                </Button>
              ) : (
                <Button
                  colorScheme="green"
                  onClick={handleSubmit}
                  isLoading={loading}
                  isDisabled={!selectedLaboratory || selectedTests.length === 0}
                >
                  Salvează Cererea
                </Button>
              )}
              <Button onClick={handleClose}>Anulează</Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <CreatePatientModal 
        isOpen={isNewPatientOpen} 
        onClose={onNewPatientClose} 
        onSuccess={() => {
          onNewPatientClose();
          toast({
            title: 'Succes',
            description: 'Pacientul a fost salvat. Îl poți căuta acum în listă.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }} 
      />
    </>
  );
}