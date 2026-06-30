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

interface TransferNote {
  id: number;
  note_number: string;
  storage_id: number;
  entry_date: string;
  document_number?: string;
  total_value: number;
  notes?: string;
  status: string;
  storage_name?: string;
  storage_code?: string;
  items?: TransferNoteItem[];
}

interface TransferNoteItem {
  id?: number;
  article_id: number;
  quantity: number;
  unit_cost: number;
  batch_number?: string;
  expiry_date?: string;
  article_name?: string;
  article_code?: string;
}

export default function TransferNotes() {
  const toast = useToast();
  const [transferNotes, setTransferNotes] = useState<TransferNote[]>([]);
  const [storages, setStorages] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  
  const [selectedNote, setSelectedNote] = useState<TransferNote | null>(null);
  const [formData, setFormData] = useState({
    note_number: '',
    from_storage_id: '',
    to_storage_id: '',
    transfer_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [items, setItems] = useState<TransferNoteItem[]>([]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [notesRes, storagesRes, articlesRes] = await Promise.all([
        api.get('/pharmacy/transfer-notes'),
        api.get('/pharmacy/storages'),
        api.get('/pharmacy/articles')
      ]);
      setTransferNotes(notesRes.data);
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

  const handleAddClick = async () => {
    try {
      // Preia următorul număr de notă de transfer automat
      const response = await api.get('/pharmacy/transfer-notes/next-number');
      const nextNumber = response.data.next_number;
      
      setSelectedNote(null);
      setFormData({
        note_number: nextNumber,
        from_storage_id: '',
        to_storage_id: '',
        transfer_date: new Date().toISOString().split('T')[0],
        notes: ''
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
      setSelectedNote(null);
      setFormData({
        note_number: '',
        from_storage_id: '',
        to_storage_id: '',
        transfer_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setItems([]);
      onModalOpen();
    }
  };

  const handleViewClick = async (note: TransferNote) => {
    try {
      const response = await api.get(`/pharmacy/transfer-notes/${note.id}`);
      setSelectedNote(response.data);
      onViewOpen();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la încărcarea notei',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleAddItem = () => {
    setItems([...items, { article_id: 0, quantity: 0, unit_cost: 0 }]);
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
      if (!formData.note_number || !formData.from_storage_id || !formData.to_storage_id || items.length === 0) {
        toast({
          title: 'Eroare',
          description: 'Completează toate câmpurile obligatorii și adaugă cel puțin un articol',
          status: 'error',
          duration: 3000
        });
        return;
      }

      if (formData.from_storage_id === formData.to_storage_id) {
        toast({
          title: 'Eroare',
          description: 'Gestiunea sursă și destinația trebuie să fie diferite',
          status: 'error',
          duration: 3000
        });
        return;
      }

      const payload = {
        ...formData,
        from_storage_id: parseInt(formData.from_storage_id),
        to_storage_id: parseInt(formData.to_storage_id),
        items: items.map(item => ({
          article_id: item.article_id,
          quantity: parseFloat(item.quantity.toString()),
          unit_cost: parseFloat(item.unit_cost.toString()),
          batch_number: item.batch_number || null,
          expiry_date: item.expiry_date || null
        }))
      };

      await api.post('/pharmacy/transfer-notes', payload);
      toast({ title: 'Succes', description: 'Nota de transfer creată', status: 'success', duration: 3000 });
      
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
      case 'VALIDATED': return 'green';
      case 'RECEIVED': return 'blue';
      case 'DRAFT': return 'gray';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'VALIDATED': return 'Validată';
      case 'RECEIVED': return 'Recepționată';
      case 'DRAFT': return 'Ciornă';
      case 'CANCELLED': return 'Anulată';
      default: return status;
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Heading size="md" color={textColor}>Note de Transfer</Heading>
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={handleAddClick}>
          Adaugă Notă de Transfer
        </Button>
      </HStack>

      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th color={textColor}>Număr</Th>
              <Th color={textColor}>Data</Th>
              <Th color={textColor}>Gestiune Destinație</Th>
              <Th color={textColor}>Valoare Totală</Th>
              <Th color={textColor}>Status</Th>
              <Th color={textColor}>Acțiuni</Th>
            </Tr>
          </Thead>
          <Tbody>
            {transferNotes.length === 0 ? (
              <Tr>
                <Td colSpan={6} textAlign="center" color={textColor}>
                  Nu există note de transfer
                </Td>
              </Tr>
            ) : (
              transferNotes.map((note) => (
                <Tr key={note.id}>
                  <Td color={textColor}>{note.note_number}</Td>
                  <Td color={textColor}>{new Date(note.entry_date).toLocaleDateString('ro-RO')}</Td>
                  <Td color={textColor}>{note.storage_name}</Td>
                  <Td color={textColor}>{Number(note.total_value || 0).toFixed(2)} RON</Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(note.status)}>
                      {getStatusLabel(note.status)}
                    </Badge>
                  </Td>
                  <Td>
                    <IconButton
                      aria-label="Vezi"
                      icon={<FaEye />}
                      size="sm"
                      colorScheme="blue"
                      variant="ghost"
                      onClick={() => handleViewClick(note)}
                    />
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Modal pentru Adăugare */}
      <Modal isOpen={isModalOpen} onClose={onModalClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent bg={cardBg} maxH="90vh">
          <ModalHeader color={textColor}>Adaugă Notă de Transfer</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <HStack spacing={4} width="100%">
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Număr Notă *</FormLabel>
                  <Input
                    value={formData.note_number}
                    onChange={(e) => setFormData({ ...formData, note_number: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Data Transfer *</FormLabel>
                  <Input
                    type="date"
                    value={formData.transfer_date}
                    onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} width="100%">
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Gestiune Sursă *</FormLabel>
                  <Select
                    value={formData.from_storage_id}
                    onChange={(e) => setFormData({ ...formData, from_storage_id: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  >
                    <option value="">Selectează gestiunea sursă</option>
                    {storages.map((storage) => (
                      <option key={storage.id} value={storage.id}>
                        {storage.name} ({storage.code})
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Gestiune Destinație *</FormLabel>
                  <Select
                    value={formData.to_storage_id}
                    onChange={(e) => setFormData({ ...formData, to_storage_id: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  >
                    <option value="">Selectează gestiunea destinație</option>
                    {storages.map((storage) => (
                      <option key={storage.id} value={storage.id}>
                        {storage.name} ({storage.code})
                      </option>
                    ))}
                  </Select>
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
                        <Th color={textColor}>Lot</Th>
                        <Th color={textColor}>Expirare</Th>
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
                              value={item.unit_cost}
                              onChange={(e) => handleItemChange(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                              bg={bgColor}
                              color={textColor}
                              borderColor={borderColor}
                            />
                          </Td>
                          <Td>
                            <Input
                              value={item.batch_number || ''}
                              onChange={(e) => handleItemChange(index, 'batch_number', e.target.value)}
                              bg={bgColor}
                              color={textColor}
                              borderColor={borderColor}
                            />
                          </Td>
                          <Td>
                            <Input
                              type="date"
                              value={item.expiry_date || ''}
                              onChange={(e) => handleItemChange(index, 'expiry_date', e.target.value)}
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
              <Heading size="md">Detalii Notă de Transfer</Heading>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} mt={1}>
                {selectedNote?.note_number}
              </Text>
            </Box>
            {selectedNote && (
              <Badge 
                colorScheme={getStatusColor(selectedNote.status)} 
                fontSize="md" 
                px={3} 
                py={1}
                borderRadius="full"
              >
                {getStatusLabel(selectedNote.status)}
              </Badge>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6} overflowY="auto">
            {selectedNote && (
              <VStack spacing={6} align="stretch">
                <Box 
                  bg={useColorModeValue('gray.50', 'gray.800')} 
                  p={4} 
                  borderRadius="md"
                  border="1px"
                  borderColor={borderColor}
                >
                  <HStack spacing={6} flexWrap="wrap">
                    <Box flex="1" minW="220px">
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mb={1}>
                        Data
                      </Text>
                      <Text color={textColor} fontWeight="medium">
                        {new Date(selectedNote.entry_date).toLocaleDateString('ro-RO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                    </Box>
                    <Box flex="1" minW="220px">
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mb={1}>
                        Gestiune Destinație
                      </Text>
                      <Text color={textColor} fontWeight="medium">
                        {selectedNote.storage_name}
                      </Text>
                    </Box>
                  </HStack>
                  {selectedNote.notes && (
                    <Box mt={4}>
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mb={1}>
                        Observații
                      </Text>
                      <Text color={textColor}>{selectedNote.notes}</Text>
                    </Box>
                  )}
                </Box>

                {selectedNote.items && selectedNote.items.length > 0 && (
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
                          {selectedNote.items.map((item: any, index: number) => (
                            <Tr 
                              key={index}
                              _hover={{ bg: useColorModeValue('gray.50', 'gray.750') }}
                              borderBottom="1px"
                              borderColor={borderColor}
                            >
                              <Td color={textColor} fontWeight="medium" minW="250px">
                                {item.article_name}
                                {item.batch_number && (
                                  <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mt={1}>
                                    Lot: {item.batch_number}
                                    {item.expiry_date && ` | Exp: ${new Date(item.expiry_date).toLocaleDateString('ro-RO')}`}
                                  </Text>
                                )}
                              </Td>
                              <Td color={textColor} isNumeric minW="100px">{Number(item.quantity || 0)}</Td>
                              <Td color={textColor} isNumeric minW="120px">{Number(item.unit_cost || 0).toFixed(2)} RON</Td>
                              <Td color={textColor} isNumeric fontWeight="bold" minW="120px">
                                {(Number(item.quantity || 0) * Number(item.unit_cost || 0)).toFixed(2)} RON
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
                        {Number(selectedNote.total_value || 0).toFixed(2)} RON
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
