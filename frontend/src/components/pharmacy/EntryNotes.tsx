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
import { FaPlus, FaEdit, FaEye, FaCheck, FaTimes } from 'react-icons/fa';
import api from '../../services/api';

interface EntryNote {
  id: number;
  note_number: string;
  storage_id: number;
  supplier_id: number;
  entry_date: string;
  reception_date?: string;
  document_number?: string;
  document_date?: string;
  total_value: number;
  notes?: string;
  status: string;
  storage_name?: string;
  storage_code?: string;
  supplier_name?: string;
  supplier_code?: string;
  items?: EntryNoteItem[];
}

interface EntryNoteItem {
  id?: number;
  article_id: number;
  quantity: number;
  unit_cost: number;
  batch_number?: string;
  expiry_date?: string;
  article_name?: string;
  article_code?: string;
}

export default function EntryNotes() {
  const toast = useToast();
  const [entryNotes, setEntryNotes] = useState<EntryNote[]>([]);
  const [storages, setStorages] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  
  const [selectedNote, setSelectedNote] = useState<EntryNote | null>(null);
  const [formData, setFormData] = useState({
    note_number: '',
    storage_id: '',
    supplier_id: '',
    entry_date: new Date().toISOString().split('T')[0],
    reception_date: new Date().toISOString().split('T')[0],
    document_number: '',
    document_date: '',
    notes: '',
    status: 'DRAFT'
  });
  const [items, setItems] = useState<EntryNoteItem[]>([]);

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
      const [notesRes, storagesRes, suppliersRes, articlesRes] = await Promise.all([
        api.get('/pharmacy/entry-notes'),
        api.get('/pharmacy/storages'),
        api.get('/pharmacy/suppliers'),
        api.get('/pharmacy/articles')
      ]);
      setEntryNotes(notesRes.data);
      setStorages(storagesRes.data);
      setSuppliers(suppliersRes.data);
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
      // Preia următorul număr de notă automat
      const response = await api.get('/pharmacy/entry-notes/next-number');
      const nextNumber = response.data.next_number;
      
      setSelectedNote(null);
      setFormData({
        note_number: nextNumber,
        storage_id: '',
        supplier_id: '',
        entry_date: new Date().toISOString().split('T')[0],
        reception_date: new Date().toISOString().split('T')[0],
        document_number: '',
        document_date: '',
        notes: '',
        status: 'DRAFT'
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
      // Deschide modalul chiar dacă nu s-a putut genera numărul
      setSelectedNote(null);
      setFormData({
        note_number: '',
        storage_id: '',
        supplier_id: '',
        entry_date: new Date().toISOString().split('T')[0],
        reception_date: new Date().toISOString().split('T')[0],
        document_number: '',
        document_date: '',
        notes: '',
        status: 'DRAFT'
      });
      setItems([]);
      onModalOpen();
    }
  };

  const handleEditClick = async (note: EntryNote) => {
    try {
      const response = await api.get(`/pharmacy/entry-notes/${note.id}`);
      const noteData = response.data;
      setSelectedNote(noteData);
      setFormData({
        note_number: noteData.note_number,
        storage_id: noteData.storage_id.toString(),
        supplier_id: noteData.supplier_id.toString(),
        entry_date: noteData.entry_date,
        reception_date: noteData.reception_date || noteData.entry_date,
        document_number: noteData.document_number || '',
        document_date: noteData.document_date || '',
        notes: noteData.notes || '',
        status: noteData.status
      });
      setItems(noteData.items || []);
      onModalOpen();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la încărcarea notei',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleViewClick = async (note: EntryNote) => {
    try {
      const response = await api.get(`/pharmacy/entry-notes/${note.id}`);
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
      if (!formData.note_number || !formData.storage_id || !formData.supplier_id || items.length === 0) {
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
        supplier_id: parseInt(formData.supplier_id),
        items: items.map(item => ({
          article_id: item.article_id,
          quantity: parseFloat(item.quantity.toString()),
          unit_cost: parseFloat(item.unit_cost.toString()),
          batch_number: item.batch_number || null,
          expiry_date: item.expiry_date || null
        }))
      };

      if (selectedNote) {
        await api.put(`/pharmacy/entry-notes/${selectedNote.id}`, payload);
        toast({ title: 'Succes', description: 'Nota de intrare actualizată', status: 'success', duration: 3000 });
      } else {
        await api.post('/pharmacy/entry-notes', payload);
        toast({ title: 'Succes', description: 'Nota de intrare creată', status: 'success', duration: 3000 });
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
        <Heading size="md" color={textColor}>Note de Intrare (Recepție)</Heading>
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={handleAddClick}>
          Adaugă Notă de Intrare
        </Button>
      </HStack>

      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th color={textColor}>Număr</Th>
              <Th color={textColor}>Data</Th>
              <Th color={textColor}>Furnizor</Th>
              <Th color={textColor}>Gestiune</Th>
              <Th color={textColor}>Valoare Totală</Th>
              <Th color={textColor}>Status</Th>
              <Th color={textColor}>Acțiuni</Th>
            </Tr>
          </Thead>
          <Tbody>
            {entryNotes.length === 0 ? (
              <Tr>
                <Td colSpan={7} textAlign="center" color={textColor}>
                  Nu există note de intrare
                </Td>
              </Tr>
            ) : (
              entryNotes.map((note) => (
                <Tr key={note.id}>
                  <Td color={textColor}>{note.note_number}</Td>
                  <Td color={textColor}>{new Date(note.entry_date).toLocaleDateString('ro-RO')}</Td>
                  <Td color={textColor}>{note.supplier_name}</Td>
                  <Td color={textColor}>{note.storage_name}</Td>
                  <Td color={textColor}>{Number(note.total_value || 0).toFixed(2)} RON</Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(note.status)}>
                      {getStatusLabel(note.status)}
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
                        onClick={() => handleViewClick(note)}
                      />
                      <IconButton
                        aria-label="Editează"
                        icon={<FaEdit />}
                        size="sm"
                        colorScheme="green"
                        variant="ghost"
                        onClick={() => handleEditClick(note)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Modal pentru Adăugare/Editare */}
      <Modal isOpen={isModalOpen} onClose={onModalClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent bg={cardBg} maxH="90vh">
          <ModalHeader color={textColor}>
            {selectedNote ? 'Editează Nota de Intrare' : 'Adaugă Notă de Intrare'}
          </ModalHeader>
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
                  <FormLabel color={textColor}>Data Intrării *</FormLabel>
                  <Input
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} width="100%">
                <FormControl flex={1}>
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
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Furnizor *</FormLabel>
                  <Select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  >
                    <option value="">Selectează furnizorul</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} ({supplier.code})
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>

              <HStack spacing={4} width="100%">
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Număr Document</FormLabel>
                  <Input
                    value={formData.document_number}
                    onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Data Document</FormLabel>
                  <Input
                    type="date"
                    value={formData.document_date}
                    onChange={(e) => setFormData({ ...formData, document_date: e.target.value })}
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

              {selectedNote && (
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
                    <option value="RECEIVED">Recepționată</option>
                    <option value="VALIDATED">Validată</option>
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
              <Heading size="md">Detalii Notă de Intrare</Heading>
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
                {/* Informații generale */}
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
                        Furnizor
                      </Text>
                      <Text color={textColor} fontWeight="medium">
                        {selectedNote.supplier_name}
                      </Text>
                    </Box>
                    <Box flex="1" minW="220px">
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mb={1}>
                        Gestiune
                      </Text>
                      <Text color={textColor} fontWeight="medium">
                        {selectedNote.storage_name}
                      </Text>
                    </Box>
                  </HStack>
                  {selectedNote.document_number && (
                    <Box mt={4}>
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mb={1}>
                        Document
                      </Text>
                      <Text color={textColor} fontWeight="medium">
                        {selectedNote.document_number}
                        {selectedNote.document_date && ` din ${new Date(selectedNote.document_date).toLocaleDateString('ro-RO')}`}
                      </Text>
                    </Box>
                  )}
                  {selectedNote.notes && (
                    <Box mt={4}>
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mb={1}>
                        Observații
                      </Text>
                      <Text color={textColor}>{selectedNote.notes}</Text>
                    </Box>
                  )}
                </Box>

                {/* Articole */}
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
