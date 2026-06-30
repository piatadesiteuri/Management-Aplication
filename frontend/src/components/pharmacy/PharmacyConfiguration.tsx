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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
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
  Switch,
  Text,
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaCog, FaBox, FaFileInvoice, FaFileExport } from 'react-icons/fa';
import api from '../../services/api';

interface Unit {
  id: number;
  code: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

interface Storage {
  id: number;
  unit_id: number;
  code: string;
  name: string;
  description?: string;
  storage_type: string;
  location?: string;
  responsible_person?: string;
  is_active: boolean;
  unit_name?: string;
  unit_code?: string;
}

interface Article {
  id: number;
  code: string;
  name: string;
  description?: string;
  article_type_id: number;
  manufacturer_id?: number;
  unit_of_measure_id: number;
  atc_code?: string;
  cim_code?: string;
  barcode?: string;
  requires_prescription: boolean;
  is_controlled: boolean;
  min_stock_level: number;
  max_stock_level: number;
  is_active: boolean;
  article_type_name?: string;
  manufacturer_name?: string;
  unit_of_measure_name?: string;
}

interface Supplier {
  id: number;
  code: string;
  name: string;
  fiscal_code?: string;
  registration_number?: string;
  address?: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  payment_terms?: string;
  delivery_terms?: string;
  is_active: boolean;
}

export default function PharmacyConfiguration() {
  const toast = useToast();
  const [configTab, setConfigTab] = useState(0);
  const [unitsStoragesTab, setUnitsStoragesTab] = useState(0); // 0 = Unități, 1 = Gestiuni
  
  // State pentru Unități
  const [units, setUnits] = useState<Unit[]>([]);
  const { isOpen: isUnitOpen, onOpen: onUnitOpen, onClose: onUnitClose } = useDisclosure();
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [unitForm, setUnitForm] = useState({ code: '', name: '', description: '', address: '', phone: '', email: '', is_active: true });

  // State pentru Gestiuni
  const [storages, setStorages] = useState<Storage[]>([]);
  const { isOpen: isStorageOpen, onOpen: onStorageOpen, onClose: onStorageClose } = useDisclosure();
  const [selectedStorage, setSelectedStorage] = useState<Storage | null>(null);
  const [storageForm, setStorageForm] = useState({ unit_id: '', code: '', name: '', description: '', storage_type: 'PRINCIPAL', location: '', responsible_person: '', is_active: true });

  // State pentru Articole
  const [articles, setArticles] = useState<Article[]>([]);
  const [articleTypes, setArticleTypes] = useState<any[]>([]);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<any[]>([]);
  const { isOpen: isArticleOpen, onOpen: onArticleOpen, onClose: onArticleClose } = useDisclosure();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articleForm, setArticleForm] = useState({
    code: '', name: '', description: '', article_type_id: '', manufacturer_id: '', unit_of_measure_id: '',
    atc_code: '', cim_code: '', barcode: '', requires_prescription: false, is_controlled: false,
    min_stock_level: 0, max_stock_level: 0, is_active: true
  });

  // State pentru Furnizori
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { isOpen: isSupplierOpen, onOpen: onSupplierOpen, onClose: onSupplierClose } = useDisclosure();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    code: '', name: '', fiscal_code: '', registration_number: '', address: '', phone: '', email: '',
    contact_person: '', payment_terms: '', delivery_terms: '', is_active: true
  });

  // Culori
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    loadAllData();
  }, [configTab]);

  const loadAllData = async () => {
    if (configTab === 0) {
      // Tab "Unități și Gestiuni"
      await loadUnits(); // Întotdeauna încarcă unitățile pentru dropdown
      if (unitsStoragesTab === 1) {
        await loadStorages();
      }
    } else if (configTab === 1) {
      // Tab "Articole"
      await loadArticles();
      await loadArticleTypes();
      await loadManufacturers();
      await loadUnitsOfMeasure();
    } else if (configTab === 2) {
      // Tab "Furnizori"
      await loadSuppliers();
    }
  };

  // Efect pentru a reîncărca datele când se schimbă sub-tab-ul
  useEffect(() => {
    if (configTab === 0 && unitsStoragesTab === 1) {
      loadStorages();
    }
  }, [unitsStoragesTab]);

  // ========== UNITĂȚI ==========
  const loadUnits = async () => {
    try {
      const response = await api.get('/pharmacy/units');
      setUnits(response.data);
    } catch (error) {
      console.error('Error loading units:', error);
    }
  };

  const handleUnitClick = (unit?: Unit) => {
    if (unit) {
      setSelectedUnit(unit);
      setUnitForm({
        code: unit.code,
        name: unit.name,
        description: unit.description || '',
        address: unit.address || '',
        phone: unit.phone || '',
        email: unit.email || '',
        is_active: unit.is_active
      });
    } else {
      setSelectedUnit(null);
      setUnitForm({ code: '', name: '', description: '', address: '', phone: '', email: '', is_active: true });
    }
    onUnitOpen();
  };

  const handleSaveUnit = async () => {
    try {
      if (selectedUnit) {
        await api.put(`/pharmacy/units/${selectedUnit.id}`, unitForm);
        toast({ title: 'Succes', description: 'Unitate actualizată', status: 'success', duration: 3000 });
      } else {
        await api.post('/pharmacy/units', unitForm);
        toast({ title: 'Succes', description: 'Unitate creată', status: 'success', duration: 3000 });
      }
      onUnitClose();
      loadUnits();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la salvare',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleDeleteUnit = async (id: number) => {
    if (window.confirm('Sigur doriți să ștergeți această unitate?')) {
      try {
        await api.delete(`/pharmacy/units/${id}`);
        toast({ title: 'Succes', description: 'Unitate ștearsă', status: 'success', duration: 3000 });
        loadUnits();
      } catch (error: any) {
        toast({
          title: 'Eroare',
          description: error.response?.data?.message || 'Eroare la ștergere',
          status: 'error',
          duration: 3000
        });
      }
    }
  };

  // ========== GESTIUNI ==========
  const loadStorages = async () => {
    try {
      const response = await api.get('/pharmacy/storages');
      setStorages(response.data);
    } catch (error) {
      console.error('Error loading storages:', error);
    }
  };

  const handleStorageClick = (storage?: Storage) => {
    if (storage) {
      setSelectedStorage(storage);
      setStorageForm({
        unit_id: storage.unit_id.toString(),
        code: storage.code,
        name: storage.name,
        description: storage.description || '',
        storage_type: storage.storage_type,
        location: storage.location || '',
        responsible_person: storage.responsible_person || '',
        is_active: storage.is_active
      });
    } else {
      setSelectedStorage(null);
      setStorageForm({ unit_id: '', code: '', name: '', description: '', storage_type: 'PRINCIPAL', location: '', responsible_person: '', is_active: true });
    }
    onStorageOpen();
  };

  const handleSaveStorage = async () => {
    try {
      if (selectedStorage) {
        await api.put(`/pharmacy/storages/${selectedStorage.id}`, storageForm);
        toast({ title: 'Succes', description: 'Gestiune actualizată', status: 'success', duration: 3000 });
      } else {
        await api.post('/pharmacy/storages', storageForm);
        toast({ title: 'Succes', description: 'Gestiune creată', status: 'success', duration: 3000 });
      }
      onStorageClose();
      loadStorages();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la salvare',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleDeleteStorage = async (id: number) => {
    if (window.confirm('Sigur doriți să ștergeți această gestiune?')) {
      try {
        await api.delete(`/pharmacy/storages/${id}`);
        toast({ title: 'Succes', description: 'Gestiune ștearsă', status: 'success', duration: 3000 });
        loadStorages();
      } catch (error: any) {
        toast({
          title: 'Eroare',
          description: error.response?.data?.message || 'Eroare la ștergere',
          status: 'error',
          duration: 3000
        });
      }
    }
  };

  // ========== ARTICOLE ==========
  const loadArticles = async () => {
    try {
      const response = await api.get('/pharmacy/articles');
      setArticles(response.data);
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  };

  const loadArticleTypes = async () => {
    try {
      const response = await api.get('/pharmacy/article-types');
      setArticleTypes(response.data);
    } catch (error) {
      console.error('Error loading article types:', error);
    }
  };

  const loadManufacturers = async () => {
    try {
      const response = await api.get('/pharmacy/manufacturers');
      setManufacturers(response.data);
    } catch (error) {
      console.error('Error loading manufacturers:', error);
    }
  };

  const loadUnitsOfMeasure = async () => {
    try {
      const response = await api.get('/pharmacy/units-of-measure');
      setUnitsOfMeasure(response.data);
    } catch (error) {
      console.error('Error loading units of measure:', error);
    }
  };

  const handleArticleClick = (article?: Article) => {
    if (article) {
      setSelectedArticle(article);
      setArticleForm({
        code: article.code,
        name: article.name,
        description: article.description || '',
        article_type_id: article.article_type_id.toString(),
        manufacturer_id: article.manufacturer_id?.toString() || '',
        unit_of_measure_id: article.unit_of_measure_id.toString(),
        atc_code: article.atc_code || '',
        cim_code: article.cim_code || '',
        barcode: article.barcode || '',
        requires_prescription: article.requires_prescription,
        is_controlled: article.is_controlled,
        min_stock_level: article.min_stock_level,
        max_stock_level: article.max_stock_level,
        is_active: article.is_active
      });
    } else {
      setSelectedArticle(null);
      setArticleForm({
        code: '', name: '', description: '', article_type_id: '', manufacturer_id: '', unit_of_measure_id: '',
        atc_code: '', cim_code: '', barcode: '', requires_prescription: false, is_controlled: false,
        min_stock_level: 0, max_stock_level: 0, is_active: true
      });
    }
    onArticleOpen();
  };

  const handleSaveArticle = async () => {
    try {
      const data = {
        ...articleForm,
        article_type_id: parseInt(articleForm.article_type_id),
        manufacturer_id: articleForm.manufacturer_id ? parseInt(articleForm.manufacturer_id) : null,
        unit_of_measure_id: parseInt(articleForm.unit_of_measure_id),
        min_stock_level: parseFloat(articleForm.min_stock_level.toString()),
        max_stock_level: parseFloat(articleForm.max_stock_level.toString())
      };
      
      if (selectedArticle) {
        await api.put(`/pharmacy/articles/${selectedArticle.id}`, data);
        toast({ title: 'Succes', description: 'Articol actualizat', status: 'success', duration: 3000 });
      } else {
        await api.post('/pharmacy/articles', data);
        toast({ title: 'Succes', description: 'Articol creat', status: 'success', duration: 3000 });
      }
      onArticleClose();
      loadArticles();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la salvare',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (window.confirm('Sigur doriți să ștergeți acest articol?')) {
      try {
        await api.delete(`/pharmacy/articles/${id}`);
        toast({ title: 'Succes', description: 'Articol șters', status: 'success', duration: 3000 });
        loadArticles();
      } catch (error: any) {
        toast({
          title: 'Eroare',
          description: error.response?.data?.message || 'Eroare la ștergere',
          status: 'error',
          duration: 3000
        });
      }
    }
  };

  // ========== FURNIZORI ==========
  const loadSuppliers = async () => {
    try {
      const response = await api.get('/pharmacy/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const handleSupplierClick = (supplier?: Supplier) => {
    if (supplier) {
      setSelectedSupplier(supplier);
      setSupplierForm({
        code: supplier.code,
        name: supplier.name,
        fiscal_code: supplier.fiscal_code || '',
        registration_number: supplier.registration_number || '',
        address: supplier.address || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        contact_person: supplier.contact_person || '',
        payment_terms: supplier.payment_terms || '',
        delivery_terms: supplier.delivery_terms || '',
        is_active: supplier.is_active
      });
    } else {
      setSelectedSupplier(null);
      setSupplierForm({
        code: '', name: '', fiscal_code: '', registration_number: '', address: '', phone: '', email: '',
        contact_person: '', payment_terms: '', delivery_terms: '', is_active: true
      });
    }
    onSupplierOpen();
  };

  const handleSaveSupplier = async () => {
    try {
      if (selectedSupplier) {
        await api.put(`/pharmacy/suppliers/${selectedSupplier.id}`, supplierForm);
        toast({ title: 'Succes', description: 'Furnizor actualizat', status: 'success', duration: 3000 });
      } else {
        await api.post('/pharmacy/suppliers', supplierForm);
        toast({ title: 'Succes', description: 'Furnizor creat', status: 'success', duration: 3000 });
      }
      onSupplierClose();
      loadSuppliers();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.response?.data?.message || 'Eroare la salvare',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (window.confirm('Sigur doriți să ștergeți acest furnizor?')) {
      try {
        await api.delete(`/pharmacy/suppliers/${id}`);
        toast({ title: 'Succes', description: 'Furnizor șters', status: 'success', duration: 3000 });
        loadSuppliers();
      } catch (error: any) {
        toast({
          title: 'Eroare',
          description: error.response?.data?.message || 'Eroare la ștergere',
          status: 'error',
          duration: 3000
        });
      }
    }
  };

  return (
    <Box>
      <Tabs variant="enclosed" colorScheme="blue" index={configTab} onChange={setConfigTab}>
        <TabList>
          <Tab onClick={() => setConfigTab(0)}>
            <HStack spacing={2}>
              <FaCog />
              <span>Unități și Gestiuni</span>
            </HStack>
          </Tab>
          <Tab onClick={() => setConfigTab(1)}>
            <HStack spacing={2}>
              <FaBox />
              <span>Articole</span>
            </HStack>
          </Tab>
          <Tab onClick={() => setConfigTab(2)}>
            <HStack spacing={2}>
              <FaFileInvoice />
              <span>Furnizori</span>
            </HStack>
          </Tab>
          <Tab onClick={() => setConfigTab(3)}>
            <HStack spacing={2}>
              <FaFileExport />
              <span>Importuri Nomenclatoare</span>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* Tab Unități și Gestiuni */}
          <TabPanel>
            <Tabs variant="line" colorScheme="blue" index={unitsStoragesTab} onChange={setUnitsStoragesTab}>
              <TabList>
                <Tab>Unități</Tab>
                <Tab>Gestiuni</Tab>
              </TabList>
              <TabPanels>
                {/* Unități */}
                <TabPanel>
                  <HStack justify="space-between" mb={4}>
                    <Heading size="md">Unități</Heading>
                    <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={() => handleUnitClick()}>
                      Adaugă Unitate
                    </Button>
                  </HStack>
                  <TableContainer>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Cod</Th>
                          <Th>Denumire</Th>
                          <Th>Adresă</Th>
                          <Th>Telefon</Th>
                          <Th>Email</Th>
                          <Th>Status</Th>
                          <Th>Acțiuni</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {units.length === 0 ? (
                          <Tr>
                            <Td colSpan={7} textAlign="center" color={textColor}>
                              Nu există unități
                            </Td>
                          </Tr>
                        ) : (
                          units.map((unit) => (
                            <Tr key={unit.id}>
                              <Td fontWeight="semibold" color={textColor}>{unit.code}</Td>
                              <Td color={textColor}>{unit.name}</Td>
                              <Td color={secondaryTextColor}>{unit.address || '-'}</Td>
                              <Td color={secondaryTextColor}>{unit.phone || '-'}</Td>
                              <Td color={secondaryTextColor}>{unit.email || '-'}</Td>
                              <Td>
                                <Badge colorScheme={unit.is_active ? 'green' : 'red'}>
                                  {unit.is_active ? 'Activă' : 'Inactivă'}
                                </Badge>
                              </Td>
                              <Td>
                                <HStack spacing={2}>
                                  <IconButton
                                    icon={<FaEdit />}
                                    aria-label="Editează"
                                    size="sm"
                                    colorScheme="blue"
                                    onClick={() => handleUnitClick(unit)}
                                  />
                                  <IconButton
                                    icon={<FaTrash />}
                                    aria-label="Șterge"
                                    size="sm"
                                    colorScheme="red"
                                    onClick={() => handleDeleteUnit(unit.id)}
                                  />
                                </HStack>
                              </Td>
                            </Tr>
                          ))
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </TabPanel>

                {/* Gestiuni */}
                <TabPanel>
                  <HStack justify="space-between" mb={4}>
                    <Heading size="md">Gestiuni</Heading>
                    <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={() => handleStorageClick()}>
                      Adaugă Gestiune
                    </Button>
                  </HStack>
                  <TableContainer>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Cod</Th>
                          <Th>Denumire</Th>
                          <Th>Unitate</Th>
                          <Th>Tip</Th>
                          <Th>Locație</Th>
                          <Th>Responsabil</Th>
                          <Th>Status</Th>
                          <Th>Acțiuni</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {storages.length === 0 ? (
                          <Tr>
                            <Td colSpan={8} textAlign="center" color={textColor}>
                              Nu există gestiuni
                            </Td>
                          </Tr>
                        ) : (
                          storages.map((storage) => (
                            <Tr key={storage.id}>
                              <Td fontWeight="semibold" color={textColor}>{storage.code}</Td>
                              <Td color={textColor}>{storage.name}</Td>
                              <Td color={secondaryTextColor}>{storage.unit_name || '-'}</Td>
                              <Td>
                                <Badge colorScheme="blue">{storage.storage_type}</Badge>
                              </Td>
                              <Td color={secondaryTextColor}>{storage.location || '-'}</Td>
                              <Td color={secondaryTextColor}>{storage.responsible_person || '-'}</Td>
                              <Td>
                                <Badge colorScheme={storage.is_active ? 'green' : 'red'}>
                                  {storage.is_active ? 'Activă' : 'Inactivă'}
                                </Badge>
                              </Td>
                              <Td>
                                <HStack spacing={2}>
                                  <IconButton
                                    icon={<FaEdit />}
                                    aria-label="Editează"
                                    size="sm"
                                    colorScheme="blue"
                                    onClick={() => handleStorageClick(storage)}
                                  />
                                  <IconButton
                                    icon={<FaTrash />}
                                    aria-label="Șterge"
                                    size="sm"
                                    colorScheme="red"
                                    onClick={() => handleDeleteStorage(storage.id)}
                                  />
                                </HStack>
                              </Td>
                            </Tr>
                          ))
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </TabPanel>

          {/* Tab Articole */}
          <TabPanel>
            <HStack justify="space-between" mb={4}>
              <Heading size="md">Articole</Heading>
              <Button leftIcon={<FaPlus />} colorScheme="green" onClick={() => handleArticleClick()}>
                Adaugă Articol
              </Button>
            </HStack>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Cod</Th>
                    <Th>Denumire</Th>
                    <Th>Tip</Th>
                    <Th>Producător</Th>
                    <Th>Unitate Măsură</Th>
                    <Th>Cod ATC</Th>
                    <Th>Status</Th>
                    <Th>Acțiuni</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {articles.length === 0 ? (
                    <Tr>
                      <Td colSpan={8} textAlign="center" color={textColor}>
                        Nu există articole
                      </Td>
                    </Tr>
                  ) : (
                    articles.map((article) => (
                      <Tr key={article.id}>
                        <Td fontWeight="semibold" color={textColor}>{article.code}</Td>
                        <Td color={textColor}>{article.name}</Td>
                        <Td color={secondaryTextColor}>{article.article_type_name || '-'}</Td>
                        <Td color={secondaryTextColor}>{article.manufacturer_name || '-'}</Td>
                        <Td color={secondaryTextColor}>{article.unit_of_measure_name || '-'}</Td>
                        <Td color={secondaryTextColor}>{article.atc_code || '-'}</Td>
                        <Td>
                          <Badge colorScheme={article.is_active ? 'green' : 'red'}>
                            {article.is_active ? 'Activ' : 'Inactiv'}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              icon={<FaEdit />}
                              aria-label="Editează"
                              size="sm"
                              colorScheme="blue"
                              onClick={() => handleArticleClick(article)}
                            />
                            <IconButton
                              icon={<FaTrash />}
                              aria-label="Șterge"
                              size="sm"
                              colorScheme="red"
                              onClick={() => handleDeleteArticle(article.id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Tab Furnizori */}
          <TabPanel>
            <HStack justify="space-between" mb={4}>
              <Heading size="md">Furnizori</Heading>
              <Button leftIcon={<FaPlus />} colorScheme="purple" onClick={() => handleSupplierClick()}>
                Adaugă Furnizor
              </Button>
            </HStack>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Cod</Th>
                    <Th>Denumire</Th>
                    <Th>CIF</Th>
                    <Th>Nr. Înregistrare</Th>
                    <Th>Telefon</Th>
                    <Th>Email</Th>
                    <Th>Status</Th>
                    <Th>Acțiuni</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {suppliers.length === 0 ? (
                    <Tr>
                      <Td colSpan={8} textAlign="center" color={textColor}>
                        Nu există furnizori
                      </Td>
                    </Tr>
                  ) : (
                    suppliers.map((supplier) => (
                      <Tr key={supplier.id}>
                        <Td fontWeight="semibold" color={textColor}>{supplier.code}</Td>
                        <Td color={textColor}>{supplier.name}</Td>
                        <Td color={secondaryTextColor}>{supplier.fiscal_code || '-'}</Td>
                        <Td color={secondaryTextColor}>{supplier.registration_number || '-'}</Td>
                        <Td color={secondaryTextColor}>{supplier.phone || '-'}</Td>
                        <Td color={secondaryTextColor}>{supplier.email || '-'}</Td>
                        <Td>
                          <Badge colorScheme={supplier.is_active ? 'green' : 'red'}>
                            {supplier.is_active ? 'Activ' : 'Inactiv'}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              icon={<FaEdit />}
                              aria-label="Editează"
                              size="sm"
                              colorScheme="blue"
                              onClick={() => handleSupplierClick(supplier)}
                            />
                            <IconButton
                              icon={<FaTrash />}
                              aria-label="Șterge"
                              size="sm"
                              colorScheme="red"
                              onClick={() => handleDeleteSupplier(supplier.id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Tab Importuri Nomenclatoare */}
          <TabPanel>
            <Box p={4} bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor}>
              <Heading size="md" mb={4} color={textColor}>Importuri Nomenclatoare</Heading>
              <Text color={textColor}>
                Funcționalitatea de import nomenclatoare va fi implementată în viitor.
              </Text>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modal Unitate */}
      <Modal isOpen={isUnitOpen} onClose={onUnitClose} size="lg">
        <ModalOverlay />
        <ModalContent bg={cardBg}>
          <ModalHeader color={textColor}>{selectedUnit ? 'Editează Unitate' : 'Adaugă Unitate'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel color={textColor}>Cod *</FormLabel>
                <Input
                  value={unitForm.code}
                  onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>
              <FormControl>
                <FormLabel color={textColor}>Denumire *</FormLabel>
                <Input
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>
              <FormControl>
                <FormLabel color={textColor}>Descriere</FormLabel>
                <Textarea
                  value={unitForm.description}
                  onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>
              <FormControl>
                <FormLabel color={textColor}>Adresă</FormLabel>
                <Input
                  value={unitForm.address}
                  onChange={(e) => setUnitForm({ ...unitForm, address: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>
              <FormControl>
                <FormLabel color={textColor}>Telefon</FormLabel>
                <Input
                  value={unitForm.phone}
                  onChange={(e) => setUnitForm({ ...unitForm, phone: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>
              <FormControl>
                <FormLabel color={textColor}>Email</FormLabel>
                <Input
                  type="email"
                  value={unitForm.email}
                  onChange={(e) => setUnitForm({ ...unitForm, email: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel color={textColor} mb={0}>Activă</FormLabel>
                <Switch
                  isChecked={unitForm.is_active}
                  onChange={(e) => setUnitForm({ ...unitForm, is_active: e.target.checked })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onUnitClose}>Anulează</Button>
            <Button colorScheme="blue" onClick={handleSaveUnit}>Salvează</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Gestiune */}
      <Modal isOpen={isStorageOpen} onClose={onStorageClose} size="lg">
        <ModalOverlay />
        <ModalContent bg={cardBg}>
          <ModalHeader color={textColor}>{selectedStorage ? 'Editează Gestiune' : 'Adaugă Gestiune'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel color={textColor}>Unitate *</FormLabel>
                <Select
                  value={storageForm.unit_id}
                  onChange={(e) => setStorageForm({ ...storageForm, unit_id: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                >
                  <option value="">Selectează unitatea</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.name} ({unit.code})</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel color={textColor}>Cod *</FormLabel>
                <Input
                  value={storageForm.code}
                  onChange={(e) => setStorageForm({ ...storageForm, code: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>
              <FormControl>
                <FormLabel color={textColor}>Denumire *</FormLabel>
                <Input
                  value={storageForm.name}
                  onChange={(e) => setStorageForm({ ...storageForm, name: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>
              <FormControl>
                <FormLabel color={textColor}>Tip Gestiune</FormLabel>
                <Select
                  value={storageForm.storage_type}
                  onChange={(e) => setStorageForm({ ...storageForm, storage_type: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                >
                  <option value="PRINCIPAL">Principal</option>
                  <option value="SECUNDAR">Secundar</option>
                  <option value="DEPOZIT">Depozit</option>
                  <option value="SECȚIE">Secție</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel color={textColor}>Locație</FormLabel>
                <Input
                  value={storageForm.location}
                  onChange={(e) => setStorageForm({ ...storageForm, location: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>
              <FormControl>
                <FormLabel color={textColor}>Persoană Responsabilă</FormLabel>
                <Input
                  value={storageForm.responsible_person}
                  onChange={(e) => setStorageForm({ ...storageForm, responsible_person: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel color={textColor} mb={0}>Activă</FormLabel>
                <Switch
                  isChecked={storageForm.is_active}
                  onChange={(e) => setStorageForm({ ...storageForm, is_active: e.target.checked })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onStorageClose}>Anulează</Button>
            <Button colorScheme="blue" onClick={handleSaveStorage}>Salvează</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Articol */}
      <Modal isOpen={isArticleOpen} onClose={onArticleClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent bg={cardBg} maxH="90vh">
          <ModalHeader color={textColor}>{selectedArticle ? 'Editează Articol' : 'Adaugă Articol'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel color={textColor}>Cod *</FormLabel>
                <Input
                  value={articleForm.code}
                  onChange={(e) => setArticleForm({ ...articleForm, code: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>
              <FormControl>
                <FormLabel color={textColor}>Denumire *</FormLabel>
                <Input
                  value={articleForm.name}
                  onChange={(e) => setArticleForm({ ...articleForm, name: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>
              <FormControl>
                <FormLabel color={textColor}>Descriere</FormLabel>
                <Textarea
                  value={articleForm.description}
                  onChange={(e) => setArticleForm({ ...articleForm, description: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>
              <HStack spacing={4} width="100%">
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Tip Articol *</FormLabel>
                  <Select
                    value={articleForm.article_type_id}
                    onChange={(e) => setArticleForm({ ...articleForm, article_type_id: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  >
                    <option value="">Selectează tipul</option>
                    {articleTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Producător</FormLabel>
                  <Select
                    value={articleForm.manufacturer_id}
                    onChange={(e) => setArticleForm({ ...articleForm, manufacturer_id: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  >
                    <option value="">Selectează producătorul</option>
                    {manufacturers.map((mfr) => (
                      <option key={mfr.id} value={mfr.id}>{mfr.name}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Unitate de Măsură *</FormLabel>
                  <Select
                    value={articleForm.unit_of_measure_id}
                    onChange={(e) => setArticleForm({ ...articleForm, unit_of_measure_id: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  >
                    <option value="">Selectează unitatea</option>
                    {unitsOfMeasure.map((uom) => (
                      <option key={uom.id} value={uom.id}>{uom.name} ({uom.abbreviation})</option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>
              <HStack spacing={4} width="100%">
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Cod ATC</FormLabel>
                  <Input
                    value={articleForm.atc_code}
                    onChange={(e) => setArticleForm({ ...articleForm, atc_code: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Cod CIM</FormLabel>
                  <Input
                    value={articleForm.cim_code}
                    onChange={(e) => setArticleForm({ ...articleForm, cim_code: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Cod de Bare</FormLabel>
                  <Input
                    value={articleForm.barcode}
                    onChange={(e) => setArticleForm({ ...articleForm, barcode: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
              </HStack>
              <HStack spacing={4} width="100%">
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Stoc Minim</FormLabel>
                  <Input
                    type="number"
                    value={articleForm.min_stock_level}
                    onChange={(e) => setArticleForm({ ...articleForm, min_stock_level: parseFloat(e.target.value) || 0 })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Stoc Maxim</FormLabel>
                  <Input
                    type="number"
                    value={articleForm.max_stock_level}
                    onChange={(e) => setArticleForm({ ...articleForm, max_stock_level: parseFloat(e.target.value) || 0 })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
              </HStack>
              <HStack spacing={4} width="100%">
                <FormControl display="flex" alignItems="center">
                  <FormLabel color={textColor} mb={0}>Necesită Prescripție</FormLabel>
                  <Switch
                    isChecked={articleForm.requires_prescription}
                    onChange={(e) => setArticleForm({ ...articleForm, requires_prescription: e.target.checked })}
                  />
                </FormControl>
                <FormControl display="flex" alignItems="center">
                  <FormLabel color={textColor} mb={0}>Medicament Controlat</FormLabel>
                  <Switch
                    isChecked={articleForm.is_controlled}
                    onChange={(e) => setArticleForm({ ...articleForm, is_controlled: e.target.checked })}
                  />
                </FormControl>
                <FormControl display="flex" alignItems="center">
                  <FormLabel color={textColor} mb={0}>Activ</FormLabel>
                  <Switch
                    isChecked={articleForm.is_active}
                    onChange={(e) => setArticleForm({ ...articleForm, is_active: e.target.checked })}
                  />
                </FormControl>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onArticleClose}>Anulează</Button>
            <Button colorScheme="green" onClick={handleSaveArticle}>Salvează</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Furnizor */}
      <Modal isOpen={isSupplierOpen} onClose={onSupplierClose} size="lg">
        <ModalOverlay />
        <ModalContent bg={cardBg}>
          <ModalHeader color={textColor}>{selectedSupplier ? 'Editează Furnizor' : 'Adaugă Furnizor'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <HStack spacing={4} width="100%">
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Cod *</FormLabel>
                  <Input
                    value={supplierForm.code}
                    onChange={(e) => setSupplierForm({ ...supplierForm, code: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Denumire *</FormLabel>
                  <Input
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
              </HStack>
              <HStack spacing={4} width="100%">
                <FormControl flex={1}>
                  <FormLabel color={textColor}>CIF</FormLabel>
                  <Input
                    value={supplierForm.fiscal_code}
                    onChange={(e) => setSupplierForm({ ...supplierForm, fiscal_code: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Nr. Înregistrare</FormLabel>
                  <Input
                    value={supplierForm.registration_number}
                    onChange={(e) => setSupplierForm({ ...supplierForm, registration_number: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel color={textColor}>Adresă</FormLabel>
                <Textarea
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>
              <HStack spacing={4} width="100%">
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Telefon</FormLabel>
                  <Input
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Email</FormLabel>
                  <Input
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel color={textColor}>Persoană de Contact</FormLabel>
                <Input
                  value={supplierForm.contact_person}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                />
              </FormControl>
              <HStack spacing={4} width="100%">
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Termeni de Plată</FormLabel>
                  <Input
                    value={supplierForm.payment_terms}
                    onChange={(e) => setSupplierForm({ ...supplierForm, payment_terms: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel color={textColor}>Termeni de Livrare</FormLabel>
                  <Input
                    value={supplierForm.delivery_terms}
                    onChange={(e) => setSupplierForm({ ...supplierForm, delivery_terms: e.target.value })}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </FormControl>
              </HStack>
              <FormControl display="flex" alignItems="center">
                <FormLabel color={textColor} mb={0}>Activ</FormLabel>
                <Switch
                  isChecked={supplierForm.is_active}
                  onChange={(e) => setSupplierForm({ ...supplierForm, is_active: e.target.checked })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onSupplierClose}>Anulează</Button>
            <Button colorScheme="purple" onClick={handleSaveSupplier}>Salvează</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
