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
import { FaPlus, FaEye, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import api from '../../services/api';

interface ElaborationItem {
  id?: number;
  article_id: number;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  article_name?: string;
  article_code?: string;
}

interface Elaboration {
  id: number;
  elaboration_number: string;
  storage_id: number;
  elaboration_date: string;
  name: string;
  description?: string;
  resulting_article_id?: number;
  total_cost: number;
  resulting_quantity: number;
  status: string;
  notes?: string;
  storage_name?: string;
  storage_code?: string;
  resulting_article_name?: string;
  resulting_article_code?: string;
  items?: ElaborationItem[];
}

export default function Elaborations() {
  const toast = useToast();
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  
  const [elaborations, setElaborations] = useState<Elaboration[]>([]);
  const [storages, setStorages] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedElaboration, setSelectedElaboration] = useState<Elaboration | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    elaboration_number: '',
    storage_id: '',
    elaboration_date: new Date().toISOString().split('T')[0],
    name: '',
    description: '',
    resulting_article_id: '',
    resulting_quantity: '',
    notes: '',
    status: 'DRAFT',
  });
  
  const [items, setItems] = useState<ElaborationItem[]>([]);
  const [newItem, setNewItem] = useState({
    article_id: '',
    quantity: '',
    unit_cost: '',
  });

  const textColor = useColorModeValue('gray.800', 'white');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    loadData();
    loadStorages();
    loadArticles();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/pharmacy/elaborations');
      setElaborations(response.data);
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la încărcarea elaborărilor',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStorages = async () => {
    try {
      const response = await api.get('/pharmacy/storages');
      setStorages(response.data);
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la încărcarea gestiunilor',
        status: 'error',
        duration: 3000
      });
    }
  };

  const loadArticles = async () => {
    try {
      const response = await api.get('/pharmacy/articles');
      setArticles(response.data);
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la încărcarea articolelor',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleAddItem = () => {
    if (!newItem.article_id || !newItem.quantity || !newItem.unit_cost) {
      toast({
        title: 'Eroare',
        description: 'Completează toate câmpurile pentru articol',
        status: 'error',
        duration: 3000
      });
      return;
    }

    const article = articles.find(a => a.id === parseInt(newItem.article_id));
    const item: ElaborationItem = {
      article_id: parseInt(newItem.article_id),
      quantity: parseFloat(newItem.quantity),
      unit_cost: parseFloat(newItem.unit_cost),
      total_cost: parseFloat(newItem.quantity) * parseFloat(newItem.unit_cost),
      article_name: article?.name,
      article_code: article?.code,
    };

    setItems([...items, item]);
    setNewItem({ article_id: '', quantity: '', unit_cost: '' });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleOpenModal = async (elaboration?: Elaboration) => {
    if (elaboration) {
      setSelectedElaboration(elaboration);
      setFormData({
        elaboration_number: elaboration.elaboration_number,
        storage_id: elaboration.storage_id.toString(),
        elaboration_date: elaboration.elaboration_date,
        name: elaboration.name,
        description: elaboration.description || '',
        resulting_article_id: elaboration.resulting_article_id?.toString() || '',
        resulting_quantity: elaboration.resulting_quantity.toString(),
        notes: elaboration.notes || '',
        status: elaboration.status,
      });
      setItems(elaboration.items || []);
    } else {
      try {
        // Preia următorul număr de elaborare automat
        const response = await api.get('/pharmacy/elaborations/next-number');
        const nextNumber = response.data.next_number;
        
        setSelectedElaboration(null);
        setFormData({
          elaboration_number: nextNumber,
          storage_id: '',
          elaboration_date: new Date().toISOString().split('T')[0],
          name: '',
          description: '',
          resulting_article_id: '',
          resulting_quantity: '',
          notes: '',
          status: 'DRAFT',
        });
        setItems([]);
      } catch (error: any) {
        toast({
          title: 'Eroare',
          description: error.response?.data?.message || 'Eroare la generarea numărului',
          status: 'error',
          duration: 3000
        });
        setSelectedElaboration(null);
        setFormData({
          elaboration_number: '',
          storage_id: '',
          elaboration_date: new Date().toISOString().split('T')[0],
          name: '',
          description: '',
          resulting_article_id: '',
          resulting_quantity: '',
          notes: '',
          status: 'DRAFT',
        });
        setItems([]);
      }
    }
    onModalOpen();
  };

  const handleViewDetails = async (id: number) => {
    try {
      const response = await api.get(`/pharmacy/elaborations/${id}`);
      setSelectedElaboration(response.data);
      onViewOpen();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la încărcarea detaliilor',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.elaboration_number || !formData.storage_id || !formData.name || items.length === 0) {
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
        resulting_article_id: formData.resulting_article_id ? parseInt(formData.resulting_article_id) : null,
        resulting_quantity: parseFloat(formData.resulting_quantity),
        items: items.map(item => ({
          article_id: item.article_id,
          quantity: parseFloat(item.quantity.toString()),
          unit_cost: parseFloat(item.unit_cost.toString()),
        }))
      };

      if (selectedElaboration) {
        await api.put(`/pharmacy/elaborations/${selectedElaboration.id}`, payload);
        toast({ title: 'Succes', description: 'Elaborare actualizată', status: 'success', duration: 3000 });
      } else {
        await api.post('/pharmacy/elaborations', payload);
        toast({ title: 'Succes', description: 'Elaborare creată', status: 'success', duration: 3000 });
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
      case 'COMPLETED': return 'green';
      case 'DRAFT': return 'gray';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Finalizată';
      case 'DRAFT': return 'Ciornă';
      case 'CANCELLED': return 'Anulată';
      default: return status;
    }
  };

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Heading size="md" color={textColor}>Elaborări</Heading>
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={() => handleOpenModal()}>
          Adaugă Elaborare
        </Button>
      </HStack>

      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th color={textColor}>Număr</Th>
              <Th color={textColor}>Data</Th>
              <Th color={textColor}>Nume</Th>
              <Th color={textColor}>Gestiune</Th>
              <Th color={textColor}>Articol Rezultat</Th>
              <Th color={textColor}>Cantitate</Th>
              <Th color={textColor}>Cost Total</Th>
              <Th color={textColor}>Status</Th>
              <Th color={textColor}>Acțiuni</Th>
            </Tr>
          </Thead>
          <Tbody>
            {elaborations.length === 0 ? (
              <Tr>
                <Td colSpan={9} textAlign="center" color={textColor}>
                  Nu există elaborări
                </Td>
              </Tr>
            ) : (
              elaborations.map((elaboration) => (
                <Tr key={elaboration.id}>
                  <Td color={textColor}>{elaboration.elaboration_number}</Td>
                  <Td color={textColor}>
                    {new Date(elaboration.elaboration_date).toLocaleDateString('ro-RO')}
                  </Td>
                  <Td color={textColor}>{elaboration.name}</Td>
                  <Td color={textColor}>{elaboration.storage_name}</Td>
                  <Td color={textColor}>
                    {elaboration.resulting_article_name || '-'}
                  </Td>
                  <Td color={textColor}>{Number(elaboration.resulting_quantity || 0).toFixed(2)}</Td>
                  <Td color={textColor}>{Number(elaboration.total_cost || 0).toFixed(2)} RON</Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(elaboration.status)}>
                      {getStatusLabel(elaboration.status)}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Vezi detalii"
                        icon={<FaEye />}
                        size="sm"
                        onClick={() => handleViewDetails(elaboration.id)}
                      />
                      <IconButton
                        aria-label="Editează"
                        icon={<FaEdit />}
                        size="sm"
                        onClick={() => handleOpenModal(elaboration)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Modal pentru creare/editare */}
      <Modal isOpen={isModalOpen} onClose={onModalClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxW="1400px" maxH="90vh">
          <ModalHeader color={textColor}>
            {selectedElaboration ? 'Editează Elaborare' : 'Adaugă Elaborare'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto">
            <VStack spacing={4}>
              <HStack spacing={4} w="100%">
                <FormControl>
                  <FormLabel color={textColor}>Număr Elaborare *</FormLabel>
                  <Input
                    value={formData.elaboration_number}
                    onChange={(e) => setFormData({ ...formData, elaboration_number: e.target.value })}
                    bg={cardBg}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color={textColor}>Data *</FormLabel>
                  <Input
                    type="date"
                    value={formData.elaboration_date}
                    onChange={(e) => setFormData({ ...formData, elaboration_date: e.target.value })}
                    bg={cardBg}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color={textColor}>Gestiune *</FormLabel>
                  <Select
                    value={formData.storage_id}
                    onChange={(e) => setFormData({ ...formData, storage_id: e.target.value })}
                    bg={cardBg}
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
              </HStack>

              <FormControl>
                <FormLabel color={textColor}>Nume Elaborare *</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  bg={cardBg}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>

              <FormControl>
                <FormLabel color={textColor}>Descriere</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  bg={cardBg}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>

              <HStack spacing={4} w="100%">
                <FormControl>
                  <FormLabel color={textColor}>Articol Rezultat</FormLabel>
                  <Select
                    value={formData.resulting_article_id}
                    onChange={(e) => setFormData({ ...formData, resulting_article_id: e.target.value })}
                    bg={cardBg}
                    color={textColor}
                    borderColor={borderColor}
                  >
                    <option value="">Selectează articol</option>
                    {articles.map((article) => (
                      <option key={article.id} value={article.id}>
                        {article.name} ({article.code})
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel color={textColor}>Cantitate Rezultată *</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.resulting_quantity}
                    onChange={(e) => setFormData({ ...formData, resulting_quantity: e.target.value })}
                    bg={cardBg}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color={textColor}>Status</FormLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    bg={cardBg}
                    color={textColor}
                    borderColor={borderColor}
                  >
                    <option value="DRAFT">Ciornă</option>
                    <option value="COMPLETED">Finalizată</option>
                    <option value="CANCELLED">Anulată</option>
                  </Select>
                </FormControl>
              </HStack>

              <Box w="100%" borderWidth="1px" borderRadius="md" p={4} borderColor={borderColor}>
                <Heading size="sm" mb={4} color={textColor}>Componente</Heading>
                <VStack spacing={3} align="stretch">
                  <HStack spacing={3}>
                    <FormControl flex={2}>
                      <FormLabel color={textColor}>Articol</FormLabel>
                      <Select
                        value={newItem.article_id}
                        onChange={(e) => setNewItem({ ...newItem, article_id: e.target.value })}
                        bg={cardBg}
                        color={textColor}
                        borderColor={borderColor}
                        minW="300px"
                      >
                        <option value="">Selectează articol</option>
                        {articles.map((article) => (
                          <option key={article.id} value={article.id}>
                            {article.name} ({article.code})
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl flex={1}>
                      <FormLabel color={textColor}>Cantitate</FormLabel>
                      <Input
                        type="number"
                        step="0.01"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                        bg={cardBg}
                        color={textColor}
                        borderColor={borderColor}
                      />
                    </FormControl>
                    <FormControl flex={1}>
                      <FormLabel color={textColor}>Preț Unit</FormLabel>
                      <Input
                        type="number"
                        step="0.01"
                        value={newItem.unit_cost}
                        onChange={(e) => setNewItem({ ...newItem, unit_cost: e.target.value })}
                        bg={cardBg}
                        color={textColor}
                        borderColor={borderColor}
                      />
                    </FormControl>
                    <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={handleAddItem} mt={8}>
                      Adaugă
                    </Button>
                  </HStack>

                  {items.length > 0 && (
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th color={textColor}>Articol</Th>
                            <Th color={textColor}>Cantitate</Th>
                            <Th color={textColor}>Preț Unit</Th>
                            <Th color={textColor}>Total</Th>
                            <Th color={textColor}>Acțiuni</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {items.map((item, index) => (
                            <Tr key={index}>
                              <Td color={textColor}>
                                {item.article_name} ({item.article_code})
                              </Td>
                              <Td color={textColor}>{Number(item.quantity || 0).toFixed(2)}</Td>
                              <Td color={textColor}>{Number(item.unit_cost || 0).toFixed(2)} RON</Td>
                              <Td color={textColor}>{Number(item.total_cost || 0).toFixed(2)} RON</Td>
                              <Td>
                                <IconButton
                                  aria-label="Șterge"
                                  icon={<FaTimes />}
                                  size="sm"
                                  colorScheme="red"
                                  onClick={() => handleRemoveItem(index)}
                                />
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  )}
                </VStack>
              </Box>

              <FormControl>
                <FormLabel color={textColor}>Observații</FormLabel>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  bg={cardBg}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onModalClose}>
              Anulează
            </Button>
            <Button colorScheme="blue" onClick={handleSave}>
              Salvează
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal pentru vizualizare detalii */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxW="1400px" maxH="90vh">
          <ModalHeader color={textColor}>Detalii Elaborare</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto">
            {selectedElaboration && (
              <VStack spacing={6} align="stretch">
                <HStack spacing={6} flexWrap="wrap">
                  <Box minW="220px" p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                    <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Număr</Text>
                    <Text fontWeight="bold" color={textColor}>{selectedElaboration.elaboration_number}</Text>
                  </Box>
                  <Box minW="220px" p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                    <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Data</Text>
                    <Text fontWeight="bold" color={textColor}>
                      {new Date(selectedElaboration.elaboration_date).toLocaleDateString('ro-RO')}
                    </Text>
                  </Box>
                  <Box minW="220px" p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                    <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Gestiune</Text>
                    <Text fontWeight="bold" color={textColor}>{selectedElaboration.storage_name}</Text>
                  </Box>
                  <Box minW="220px" p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                    <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Status</Text>
                    <Badge colorScheme={getStatusColor(selectedElaboration.status)}>
                      {getStatusLabel(selectedElaboration.status)}
                    </Badge>
                  </Box>
                </HStack>

                <Box>
                  <Text fontWeight="bold" mb={2} color={textColor}>Nume: {selectedElaboration.name}</Text>
                  {selectedElaboration.description && (
                    <Text color={textColor}>Descriere: {selectedElaboration.description}</Text>
                  )}
                </Box>

                {selectedElaboration.resulting_article_name && (
                  <Box>
                    <Text fontWeight="bold" mb={2} color={textColor}>Articol Rezultat</Text>
                    <Text color={textColor}>
                      {selectedElaboration.resulting_article_name} ({selectedElaboration.resulting_article_code})
                    </Text>
                    <Text color={textColor}>
                      Cantitate: {Number(selectedElaboration.resulting_quantity || 0).toFixed(2)}
                    </Text>
                  </Box>
                )}

                {selectedElaboration.items && selectedElaboration.items.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={4} color={textColor}>Componente</Text>
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th color={textColor} minW="250px">Articol</Th>
                            <Th color={textColor} minW="100px">Cantitate</Th>
                            <Th color={textColor} minW="120px">Preț Unit</Th>
                            <Th color={textColor} minW="120px">Total</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {selectedElaboration.items.map((item, index) => (
                            <Tr key={index}>
                              <Td color={textColor}>
                                {item.article_name} ({item.article_code})
                              </Td>
                              <Td color={textColor}>{Number(item.quantity || 0).toFixed(2)}</Td>
                              <Td color={textColor}>{Number(item.unit_cost || 0).toFixed(2)} RON</Td>
                              <Td color={textColor}>{Number(item.total_cost || 0).toFixed(2)} RON</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                    <Box mt={4} textAlign="right">
                      <Text fontWeight="bold" color={textColor}>
                        Cost Total: {Number(selectedElaboration.total_cost || 0).toFixed(2)} RON
                      </Text>
                    </Box>
                  </Box>
                )}

                {selectedElaboration.notes && (
                  <Box>
                    <Text fontWeight="bold" mb={2} color={textColor}>Observații</Text>
                    <Text color={textColor}>{selectedElaboration.notes}</Text>
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
    </Box>
  );
}
