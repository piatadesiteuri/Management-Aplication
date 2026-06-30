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
import { FaPlus, FaEye, FaCheck, FaTimes } from 'react-icons/fa';
import api from '../../services/api';

interface StockInitItem {
  id?: number;
  article_id: number;
  quantity: number;
  unit_cost: number;
  batch_number?: string;
  expiry_date?: string;
  article_name?: string;
  article_code?: string;
}

interface StockInitialization {
  id: number;
  note_number: string;
  storage_id: number;
  entry_date: string;
  total_value: number;
  status: string;
  notes?: string;
  storage_name?: string;
  storage_code?: string;
  items?: StockInitItem[];
}

export default function StockInitialization() {
  const toast = useToast();
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  
  const [initializations, setInitializations] = useState<StockInitialization[]>([]);
  const [storages, setStorages] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedInit, setSelectedInit] = useState<StockInitialization | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    note_number: '',
    storage_id: '',
    entry_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  
  const [items, setItems] = useState<StockInitItem[]>([]);
  const [newItem, setNewItem] = useState({
    article_id: '',
    quantity: '',
    unit_cost: '',
    batch_number: '',
    expiry_date: '',
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
      const response = await api.get('/pharmacy/stock-initializations');
      setInitializations(response.data);
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la încărcarea inițializărilor',
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
        description: 'Completează toate câmpurile obligatorii pentru articol',
        status: 'error',
        duration: 3000
      });
      return;
    }

    const article = articles.find(a => a.id === parseInt(newItem.article_id));
    const item: StockInitItem = {
      article_id: parseInt(newItem.article_id),
      quantity: parseFloat(newItem.quantity),
      unit_cost: parseFloat(newItem.unit_cost),
      batch_number: newItem.batch_number || undefined,
      expiry_date: newItem.expiry_date || undefined,
      article_name: article?.name,
      article_code: article?.code,
    };

    setItems([...items, item]);
    setNewItem({ article_id: '', quantity: '', unit_cost: '', batch_number: '', expiry_date: '' });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleOpenModal = async () => {
    try {
      // Preia următorul număr de inițializare automat
      const response = await api.get('/pharmacy/stock-initializations/next-number');
      const nextNumber = response.data.next_number;
      
      setSelectedInit(null);
      setFormData({
        note_number: nextNumber,
        storage_id: '',
        entry_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setItems([]);
      onModalOpen();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la generarea numărului',
        status: 'error',
        duration: 3000
      });
      setSelectedInit(null);
      setFormData({
        note_number: '',
        storage_id: '',
        entry_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setItems([]);
      onModalOpen();
    }
  };

  const handleViewDetails = async (id: number) => {
    try {
      const response = await api.get(`/pharmacy/stock-initializations/${id}`);
      setSelectedInit(response.data);
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
      if (!formData.note_number || !formData.storage_id || items.length === 0) {
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
          unit_cost: parseFloat(item.unit_cost.toString()),
          batch_number: item.batch_number || null,
          expiry_date: item.expiry_date || null,
        }))
      };

      await api.post('/pharmacy/stock-initializations', payload);
      toast({ title: 'Succes', description: 'Inițializare stoc creată', status: 'success', duration: 3000 });
      
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

  const handleValidate = async (id: number) => {
    try {
      await api.post(`/pharmacy/stock-initializations/${id}/validate`);
      toast({ title: 'Succes', description: 'Inițializare stoc validată', status: 'success', duration: 3000 });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la validare',
        status: 'error',
        duration: 3000
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VALIDATED': return 'green';
      case 'DRAFT': return 'gray';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'VALIDATED': return 'Validată';
      case 'DRAFT': return 'Ciornă';
      case 'CANCELLED': return 'Anulată';
      default: return status;
    }
  };

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Heading size="md" color={textColor}>Inițializare Stoc</Heading>
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={handleOpenModal}>
          Adaugă Inițializare
        </Button>
      </HStack>

      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th color={textColor}>Număr</Th>
              <Th color={textColor}>Data</Th>
              <Th color={textColor}>Gestiune</Th>
              <Th color={textColor}>Valoare Totală</Th>
              <Th color={textColor}>Status</Th>
              <Th color={textColor}>Acțiuni</Th>
            </Tr>
          </Thead>
          <Tbody>
            {initializations.length === 0 ? (
              <Tr>
                <Td colSpan={6} textAlign="center" color={textColor}>
                  Nu există inițializări de stoc
                </Td>
              </Tr>
            ) : (
              initializations.map((init) => (
                <Tr key={init.id}>
                  <Td color={textColor}>{init.note_number}</Td>
                  <Td color={textColor}>
                    {new Date(init.entry_date).toLocaleDateString('ro-RO')}
                  </Td>
                  <Td color={textColor}>{init.storage_name}</Td>
                  <Td color={textColor}>{Number(init.total_value || 0).toFixed(2)} RON</Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(init.status)}>
                      {getStatusLabel(init.status)}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Vezi detalii"
                        icon={<FaEye />}
                        size="sm"
                        onClick={() => handleViewDetails(init.id)}
                      />
                      {init.status === 'DRAFT' && (
                        <IconButton
                          aria-label="Validează"
                          icon={<FaCheck />}
                          size="sm"
                          colorScheme="green"
                          onClick={() => handleValidate(init.id)}
                        />
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Modal pentru creare */}
      <Modal isOpen={isModalOpen} onClose={onModalClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxW="1400px" maxH="90vh">
          <ModalHeader color={textColor}>Adaugă Inițializare Stoc</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto">
            <VStack spacing={4}>
              <HStack spacing={4} w="100%">
                <FormControl>
                  <FormLabel color={textColor}>Număr Notă *</FormLabel>
                  <Input
                    value={formData.note_number}
                    onChange={(e) => setFormData({ ...formData, note_number: e.target.value })}
                    bg={cardBg}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color={textColor}>Data *</FormLabel>
                  <Input
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
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

              <Box w="100%" borderWidth="1px" borderRadius="md" p={4} borderColor={borderColor}>
                <Heading size="sm" mb={4} color={textColor}>Produse (minim 5)</Heading>
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
                    <FormControl flex={1}>
                      <FormLabel color={textColor}>Lot</FormLabel>
                      <Input
                        value={newItem.batch_number}
                        onChange={(e) => setNewItem({ ...newItem, batch_number: e.target.value })}
                        bg={cardBg}
                        color={textColor}
                        borderColor={borderColor}
                      />
                    </FormControl>
                    <FormControl flex={1}>
                      <FormLabel color={textColor}>Expirare</FormLabel>
                      <Input
                        type="date"
                        value={newItem.expiry_date}
                        onChange={(e) => setNewItem({ ...newItem, expiry_date: e.target.value })}
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
                            <Th color={textColor}>Lot</Th>
                            <Th color={textColor}>Expirare</Th>
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
                              <Td color={textColor}>
                                {(Number(item.quantity || 0) * Number(item.unit_cost || 0)).toFixed(2)} RON
                              </Td>
                              <Td color={textColor}>{item.batch_number || '-'}</Td>
                              <Td color={textColor}>
                                {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('ro-RO') : '-'}
                              </Td>
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
          <ModalHeader color={textColor}>Detalii Inițializare Stoc</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto">
            {selectedInit && (
              <VStack spacing={6} align="stretch">
                <HStack spacing={6} flexWrap="wrap">
                  <Box minW="220px" p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                    <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Număr</Text>
                    <Text fontWeight="bold" color={textColor}>{selectedInit.note_number}</Text>
                  </Box>
                  <Box minW="220px" p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                    <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Data</Text>
                    <Text fontWeight="bold" color={textColor}>
                      {new Date(selectedInit.entry_date).toLocaleDateString('ro-RO')}
                    </Text>
                  </Box>
                  <Box minW="220px" p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                    <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Gestiune</Text>
                    <Text fontWeight="bold" color={textColor}>{selectedInit.storage_name}</Text>
                  </Box>
                  <Box minW="220px" p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                    <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Status</Text>
                    <Badge colorScheme={getStatusColor(selectedInit.status)}>
                      {getStatusLabel(selectedInit.status)}
                    </Badge>
                  </Box>
                </HStack>

                {selectedInit.items && selectedInit.items.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={4} color={textColor}>Produse</Text>
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th color={textColor} minW="250px">Articol</Th>
                            <Th color={textColor} minW="100px">Cantitate</Th>
                            <Th color={textColor} minW="120px">Preț Unit</Th>
                            <Th color={textColor} minW="120px">Total</Th>
                            <Th color={textColor} minW="100px">Lot</Th>
                            <Th color={textColor} minW="120px">Expirare</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {selectedInit.items.map((item, index) => (
                            <Tr key={index}>
                              <Td color={textColor}>
                                {item.article_name} ({item.article_code})
                              </Td>
                              <Td color={textColor}>{Number(item.quantity || 0).toFixed(2)}</Td>
                              <Td color={textColor}>{Number(item.unit_cost || 0).toFixed(2)} RON</Td>
                              <Td color={textColor}>
                                {(Number(item.quantity || 0) * Number(item.unit_cost || 0)).toFixed(2)} RON
                              </Td>
                              <Td color={textColor}>{item.batch_number || '-'}</Td>
                              <Td color={textColor}>
                                {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('ro-RO') : '-'}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                    <Box mt={4} textAlign="right">
                      <Text fontWeight="bold" color={textColor}>
                        Valoare Totală: {Number(selectedInit.total_value || 0).toFixed(2)} RON
                      </Text>
                    </Box>
                  </Box>
                )}

                {selectedInit.notes && (
                  <Box>
                    <Text fontWeight="bold" mb={2} color={textColor}>Observații</Text>
                    <Text color={textColor}>{selectedInit.notes}</Text>
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
