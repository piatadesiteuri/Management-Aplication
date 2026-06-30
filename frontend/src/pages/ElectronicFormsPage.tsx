import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
  SimpleGrid,
  Badge,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  HStack,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Checkbox,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Wrap,
  WrapItem,
  Divider,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import {
  FiFileText,
  FiPlus,
  FiEdit,
  FiEye,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiClock,
  FiX,
  FiSave,
  FiSend,
  FiFile,
  FiDownload,
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface FormCategory {
  id: number;
  name: string;
  description: string;
  type: 'CLINIC' | 'NON_CLINIC' | 'PRESCRIPTION';
}

interface FormTemplate {
  id: number;
  code: string;
  name: string;
  description: string;
  category_id: number;
  category_name: string;
  category_type: string;
  requires_signature: boolean;
  field_count: number;
  fields?: FormField[];
}

interface FormField {
  id: number;
  field_key: string;
  field_type: string;
  label: string;
  placeholder?: string;
  description?: string;
  is_required: boolean;
  validation_rules?: any;
  options?: any;
  default_value?: string;
  display_order: number;
  section?: string;
}

interface FormInstance {
  id: number;
  instance_number: string;
  template_id: number;
  template_name: string;
  template_code: string;
  status: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'SIGNED' | 'ARCHIVED';
  form_data: any;
  attachments?: any[];
  created_by: number;
  created_by_first_name: string;
  created_by_last_name: string;
  submitted_by?: number;
  submitted_by_first_name?: string;
  submitted_by_last_name?: string;
  created_at: string;
  submitted_at?: string;
}

export default function ElectronicFormsPage() {
  const { user } = useAuth();
  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  const [categories, setCategories] = useState<FormCategory[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [instances, setInstances] = useState<FormInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const { isOpen: isTemplateOpen, onOpen: onTemplateOpen, onClose: onTemplateClose } = useDisclosure();
  const { isOpen: isInstanceOpen, onOpen: onInstanceOpen, onClose: onInstanceClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();

  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<FormInstance | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, templatesRes, instancesRes] = await Promise.all([
        api.get('/electronic-forms/categories'),
        api.get('/electronic-forms/templates'),
        api.get('/electronic-forms/instances'),
      ]);
      setCategories(categoriesRes.data || []);
      setTemplates(templatesRes.data || []);
      setInstances(instancesRes.data || []);
    } catch (error) {
      console.error('Error loading forms data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInstance = async (template: FormTemplate) => {
    try {
      // Încărcăm template-ul complet cu câmpurile
      const res = await api.get(`/electronic-forms/templates/${template.id}`);
      setSelectedTemplate(res.data);
      setFormData({});
      onInstanceOpen();
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedTemplate) return;
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('templateId', selectedTemplate.id.toString());
      formDataToSend.append('formData', JSON.stringify(formData));
      formDataToSend.append('status', 'DRAFT');

      // Adăugăm fișierele dacă există
      const fileFields = selectedTemplate.fields?.filter(f => f.field_type === 'FILE') || [];
      for (const field of fileFields) {
        const files = formData[field.field_key];
        if (files && Array.isArray(files)) {
          for (const file of files) {
            formDataToSend.append('attachments', file);
          }
        }
      }

      await api.post('/electronic-forms/instances', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onInstanceClose();
      loadData();
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTemplate) return;
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('templateId', selectedTemplate.id.toString());
      formDataToSend.append('formData', JSON.stringify(formData));
      formDataToSend.append('status', 'SUBMITTED');

      const res = await api.post('/electronic-forms/instances', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Dacă formularul necesită semnătură, îl trimitem pentru review
      if (selectedTemplate.requires_signature) {
        await api.post(`/electronic-forms/instances/${res.data.id}/submit`);
      }

      onInstanceClose();
      loadData();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleViewInstance = async (instance: FormInstance) => {
    try {
      const res = await api.get(`/electronic-forms/instances/${instance.id}`);
      setSelectedInstance(res.data);
      onViewOpen();
    } catch (error) {
      console.error('Error loading instance:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'gray';
      case 'SUBMITTED': return 'blue';
      case 'IN_REVIEW': return 'orange';
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'SIGNED': return 'purple';
      case 'ARCHIVED': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Ciornă';
      case 'SUBMITTED': return 'Trimis';
      case 'IN_REVIEW': return 'În revizie';
      case 'APPROVED': return 'Aprobat';
      case 'REJECTED': return 'Respins';
      case 'SIGNED': return 'Semnat';
      case 'ARCHIVED': return 'Arhivat';
      default: return status;
    }
  };

  const filteredTemplates = templates.filter(t => {
    if (selectedCategory !== 'all' && t.category_type !== selectedCategory) return false;
    if (searchTerm && !t.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !t.description?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filteredInstances = instances.filter(i => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (searchTerm && !i.template_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !i.instance_number.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <Container maxW="7xl" py={10}>
        <Center>
          <Spinner size="xl" />
        </Center>
      </Container>
    );
  }

  return (
    <Container maxW="7xl" py={8}>
      <VStack align="stretch" spacing={6}>
        {/* Header */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Heading size="lg">Aplicația de Formulare Electronice</Heading>
            <Button leftIcon={<Icon as={FiPlus} />} colorScheme="blue" onClick={onTemplateOpen}>
              Formular Nou
            </Button>
          </HStack>
          <Text color={mutedText}>
            Constructor de formulare și gestionare formulare electronice (clinice și non-clinice)
          </Text>
        </Box>

        {/* Tabs */}
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>
              <HStack spacing={2}>
                <Icon as={FiFileText} />
                <Text>Template-uri Formulare</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <Icon as={FiEdit} />
                <Text>Formulare Mele</Text>
                {instances.length > 0 && (
                  <Badge colorScheme="blue">{instances.length}</Badge>
                )}
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Tab 1: Template-uri */}
            <TabPanel>
              <VStack align="stretch" spacing={4}>
                {/* Filtre */}
                <Card bg={bg} border="1px solid" borderColor={border}>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <FormControl>
                        <FormLabel>Categorie</FormLabel>
                        <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                          <option value="all">Toate</option>
                          <option value="CLINIC">Clinice</option>
                          <option value="NON_CLINIC">Non-Clinice</option>
                          <option value="PRESCRIPTION">Prescripții</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Căutare</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FiSearch} color="gray.400" />
                          </InputLeftElement>
                          <Input
                            placeholder="Caută formulare..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </InputGroup>
                      </FormControl>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Lista template-uri */}
                {filteredTemplates.length === 0 ? (
                  <Card bg={bg} border="1px solid" borderColor={border}>
                    <CardBody>
                      <Text color={mutedText} textAlign="center" py={4}>
                        Nu există template-uri de formulare disponibile
                      </Text>
                    </CardBody>
                  </Card>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {filteredTemplates.map((template) => (
                      <Card key={template.id} bg={bg} border="1px solid" borderColor={border} borderRadius="xl" shadow="md">
                        <CardBody>
                          <VStack align="stretch" spacing={3}>
                            <HStack justify="space-between">
                              <Badge colorScheme={
                                template.category_type === 'CLINIC' ? 'blue' :
                                template.category_type === 'NON_CLINIC' ? 'green' : 'purple'
                              }>
                                {template.category_name}
                              </Badge>
                              {template.requires_signature && (
                                <Icon as={FiCheckCircle} color="orange.500" />
                              )}
                            </HStack>
                            <Heading size="sm">{template.name}</Heading>
                            <Text fontSize="sm" color={mutedText} noOfLines={2}>
                              {template.description || 'Fără descriere'}
                            </Text>
                            <HStack justify="space-between" fontSize="xs" color={mutedText}>
                              <Text>{template.field_count || 0} câmpuri</Text>
                              <Text>{template.code}</Text>
                            </HStack>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              leftIcon={<Icon as={FiPlus} />}
                              onClick={() => handleCreateInstance(template)}
                            >
                              Completează Formular
                            </Button>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}
              </VStack>
            </TabPanel>

            {/* Tab 2: Instanțe (Formulare mele) */}
            <TabPanel>
              <VStack align="stretch" spacing={4}>
                {/* Filtre */}
                <Card bg={bg} border="1px solid" borderColor={border}>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <FormControl>
                        <FormLabel>Status</FormLabel>
                        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                          <option value="all">Toate</option>
                          <option value="DRAFT">Ciornă</option>
                          <option value="SUBMITTED">Trimise</option>
                          <option value="IN_REVIEW">În revizie</option>
                          <option value="APPROVED">Aprobate</option>
                          <option value="REJECTED">Respinse</option>
                          <option value="SIGNED">Semnate</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Căutare</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FiSearch} color="gray.400" />
                          </InputLeftElement>
                          <Input
                            placeholder="Caută formulare..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </InputGroup>
                      </FormControl>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Lista instanțe */}
                {filteredInstances.length === 0 ? (
                  <Card bg={bg} border="1px solid" borderColor={border}>
                    <CardBody>
                      <Text color={mutedText} textAlign="center" py={4}>
                        Nu există formulare {statusFilter !== 'all' ? `cu statusul "${getStatusLabel(statusFilter)}"` : ''}
                      </Text>
                    </CardBody>
                  </Card>
                ) : (
                  <Card bg={bg} border="1px solid" borderColor={border}>
                    <CardBody>
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Număr</Th>
                              <Th>Formular</Th>
                              <Th>Status</Th>
                              <Th>Creat de</Th>
                              <Th>Data</Th>
                              <Th>Acțiuni</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {filteredInstances.map((instance) => (
                              <Tr key={instance.id}>
                                <Td>
                                  <Text fontWeight="semibold" fontSize="sm">
                                    {instance.instance_number}
                                  </Text>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">{instance.template_name}</Text>
                                  <Text fontSize="xs" color={mutedText}>
                                    {instance.template_code}
                                  </Text>
                                </Td>
                                <Td>
                                  <Badge colorScheme={getStatusColor(instance.status)}>
                                    {getStatusLabel(instance.status)}
                                  </Badge>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {instance.created_by_first_name} {instance.created_by_last_name}
                                  </Text>
                                </Td>
                                <Td>
                                  <Text fontSize="xs" color={mutedText}>
                                    {new Date(instance.created_at).toLocaleDateString('ro-RO')}
                                  </Text>
                                </Td>
                                <Td>
                                  <HStack spacing={2}>
                                    <Button
                                      size="xs"
                                      leftIcon={<Icon as={FiEye} />}
                                      onClick={() => handleViewInstance(instance)}
                                    >
                                      Vezi
                                    </Button>
                                    {instance.status === 'DRAFT' && (
                                      <Button
                                        size="xs"
                                        colorScheme="blue"
                                        leftIcon={<Icon as={FiEdit} />}
                                      >
                                        Continuă
                                      </Button>
                                    )}
                                  </HStack>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Modal: Completează Formular */}
      <Modal isOpen={isInstanceOpen} onClose={onInstanceClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Completează Formular: {selectedTemplate?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTemplate && selectedTemplate.fields ? (
              <VStack align="stretch" spacing={4}>
                {selectedTemplate.fields
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((field) => (
                    <FormControl key={field.id} isRequired={field.is_required}>
                      <FormLabel>{field.label}</FormLabel>
                      {field.description && (
                        <Text fontSize="xs" color={mutedText} mb={2}>
                          {field.description}
                        </Text>
                      )}
                      {field.field_type === 'TEXT' && (
                        <Input
                          placeholder={field.placeholder}
                          value={formData[field.field_key] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.field_key]: e.target.value })}
                        />
                      )}
                      {field.field_type === 'TEXTAREA' && (
                        <Textarea
                          placeholder={field.placeholder}
                          value={formData[field.field_key] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.field_key]: e.target.value })}
                          rows={4}
                        />
                      )}
                      {field.field_type === 'DATE' && (
                        <Input
                          type="date"
                          value={formData[field.field_key] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.field_key]: e.target.value })}
                        />
                      )}
                      {field.field_type === 'NUMBER' && (
                        <Input
                          type="number"
                          placeholder={field.placeholder}
                          value={formData[field.field_key] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.field_key]: e.target.value })}
                        />
                      )}
                      {field.field_type === 'SELECT' && field.options && (
                        <Select
                          placeholder="Selectează..."
                          value={formData[field.field_key] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.field_key]: e.target.value })}
                        >
                          {Array.isArray(field.options) && field.options.map((opt: string, idx: number) => (
                            <option key={idx} value={opt}>{opt}</option>
                          ))}
                        </Select>
                      )}
                      {field.field_type === 'CHECKBOX' && (
                        <Checkbox
                          isChecked={formData[field.field_key] || false}
                          onChange={(e) => setFormData({ ...formData, [field.field_key]: e.target.checked })}
                        >
                          {field.label}
                        </Checkbox>
                      )}
                      {field.field_type === 'FILE' && (
                        <Input
                          type="file"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files) {
                              setFormData({ ...formData, [field.field_key]: Array.from(files) });
                            }
                          }}
                          multiple
                        />
                      )}
                    </FormControl>
                  ))}
              </VStack>
            ) : (
              <Center py={8}>
                <Spinner />
              </Center>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onInstanceClose}>
                Anulează
              </Button>
              <Button leftIcon={<Icon as={FiSave} />} onClick={handleSaveDraft}>
                Salvează Ciornă
              </Button>
              <Button
                colorScheme="blue"
                leftIcon={<Icon as={FiSend} />}
                onClick={handleSubmit}
              >
                Trimite Formular
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: Vezi Formular */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Formular: {selectedInstance?.template_name} - {selectedInstance?.instance_number}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedInstance && (
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between">
                  <Badge colorScheme={getStatusColor(selectedInstance.status)}>
                    {getStatusLabel(selectedInstance.status)}
                  </Badge>
                  <Text fontSize="sm" color={mutedText}>
                    Creat: {new Date(selectedInstance.created_at).toLocaleString('ro-RO')}
                  </Text>
                </HStack>
                <Divider />
                {selectedInstance.form_data && Object.entries(selectedInstance.form_data).map(([key, value]) => (
                  <Box key={key} p={3} bg={cardBg} borderRadius="md">
                    <Text fontWeight="semibold" fontSize="sm" mb={1}>
                      {key}
                    </Text>
                    <Text fontSize="sm">{String(value)}</Text>
                  </Box>
                ))}
                {selectedInstance.attachments && selectedInstance.attachments.length > 0 && (
                  <Box>
                    <Heading size="sm" mb={2}>Atașamente</Heading>
                    <VStack align="stretch" spacing={2}>
                      {selectedInstance.attachments.map((att: any, idx: number) => (
                        <HStack key={idx} p={2} bg={cardBg} borderRadius="md">
                          <Icon as={FiFile} />
                          <Text fontSize="sm" flex={1}>{att.name}</Text>
                          <Button size="xs" leftIcon={<Icon as={FiDownload} />}>
                            Descarcă
                          </Button>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onViewClose}>Închide</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
