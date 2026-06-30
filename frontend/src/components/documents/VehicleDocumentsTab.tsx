import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Badge,
  IconButton,
  useColorModeValue,
  useToast,
  Spinner,
  Center,
  Flex,
  Avatar,
  Divider,
  Tooltip,
  useDisclosure,
  Card,
  CardBody,
  CardHeader,
  Collapse,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiEye,
  FiDownload,
  FiTruck,
  FiFileText,
  FiAlertTriangle,
  FiCheckCircle,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import DocumentViewerModal from '../calendar/DocumentViewerModal';

interface VehicleDocument {
  id: number;
  vehicle_id: number;
  type: string;
  number: string;
  file_name?: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  issue_date?: string;
  expiry_date?: string;
  issuing_authority?: string;
  created_at: string;
  updated_at: string;
  vehicle?: {
    id: number;
    brand: string;
    model: string;
    registration_number: string;
    year?: number;
    fuel_type?: string;
    department?: string;
  };
}

interface VehicleWithDocuments {
  vehicle: {
    id: number;
    brand: string;
    model: string;
    registration_number: string;
    year?: number;
    fuel_type?: string;
    department?: string;
  };
  documents: VehicleDocument[];
}

interface VehicleDocumentsTabProps {
  onStatsUpdate?: () => void;
  user?: any;
}

export default function VehicleDocumentsTab({ }: VehicleDocumentsTabProps) {
  const [vehiclesWithDocuments, setVehiclesWithDocuments] = useState<VehicleWithDocuments[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleWithDocuments[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState<VehicleDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // paginare la 5
  const [expandedVehicles, setExpandedVehicles] = useState<Set<number>>(new Set());

  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const avatarBg = useColorModeValue('blue.100', 'blue.900');
  const avatarColor = useColorModeValue('blue.600', 'blue.200');
  const listItemBg = useColorModeValue('gray.50', 'gray.700');
  const listItemBorderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    loadVehiclesWithDocuments();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [vehiclesWithDocuments, searchTerm, filterType]);

  // Reset la pagina 1 când se schimbă filtrele
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const loadVehiclesWithDocuments = async () => {
    try {
      setLoading(true);
      const api = (await import('../../services/api')).default;
      const response = await api.get('/documents/vehicles');
      const documents: VehicleDocument[] = response.data;
      
      // Grupează documentele pe vehicule
      const vehiclesMap = new Map<number, VehicleWithDocuments>();
      
      documents.forEach(doc => {
        if (doc.vehicle) {
          if (!vehiclesMap.has(doc.vehicle.id)) {
            vehiclesMap.set(doc.vehicle.id, {
              vehicle: doc.vehicle,
              documents: []
            });
          }
          vehiclesMap.get(doc.vehicle.id)!.documents.push(doc);
        }
      });
      
      const vehiclesArray = Array.from(vehiclesMap.values());
      setVehiclesWithDocuments(vehiclesArray);
      setFilteredVehicles(vehiclesArray);
    } catch (error) {
      console.error('Error loading vehicle documents:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca documentele vehiculelor',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = () => {
    let filtered = vehiclesWithDocuments;

    // Filtrare după termen de căutare
    if (searchTerm) {
      filtered = filtered.filter(vehicleData =>
        vehicleData.vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicleData.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicleData.vehicle.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicleData.documents.some(doc => 
          doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.number.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filtrare după tip
    if (filterType !== 'all') {
      if (filterType === 'expired') {
        filtered = filtered.filter(vehicleData =>
          vehicleData.documents.some(doc => isDocumentExpired(doc.expiry_date))
        );
      } else if (filterType === 'valid') {
        filtered = filtered.filter(vehicleData =>
          vehicleData.documents.some(doc => !isDocumentExpired(doc.expiry_date))
        );
      } else {
        filtered = filtered.filter(vehicleData =>
          vehicleData.documents.some(doc => doc.type === filterType)
        );
      }
    }

    setFilteredVehicles(filtered);
  };

  // Calculare paginare
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVehicles = filteredVehicles.slice(startIndex, endIndex);

  const isDocumentExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const getDocumentStatus = (document: VehicleDocument) => {
    if (!document.expiry_date) return { status: 'unknown', color: 'gray', text: 'Fără dată expirare' };
    
    const expiryDate = new Date(document.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'red', text: 'Expirat' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', color: 'orange', text: `Expiră în ${daysUntilExpiry} zile` };
    } else {
      return { status: 'valid', color: 'green', text: 'Valid' };
    }
  };

  const handleViewDocument = (document: VehicleDocument) => {
    setSelectedDocument(document);
    onOpen();
  };

  const handleDownloadDocument = async (document: VehicleDocument) => {
    try {
      const api = (await import('../../services/api')).default;
      const response = await api.get(`/documents/vehicles/${document.id}/download`, {
        responseType: 'blob'
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name || `document-${document.id}`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);

      toast({
        title: 'Succes',
        description: 'Documentul a fost descărcat',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut descărca documentul',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };


  const getDocumentTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'rca':
      case 'asigurare':
        return FiCheckCircle;
      case 'itp':
      case 'inspecție':
        return FiAlertTriangle;
      case 'carte':
      case 'certificat':
        return FiFileText;
      default:
        return FiFileText;
    }
  };

  const toggleVehicleExpansion = (vehicleId: number) => {
    const newExpanded = new Set(expandedVehicles);
    if (newExpanded.has(vehicleId)) {
      newExpanded.delete(vehicleId);
    } else {
      newExpanded.add(vehicleId);
    }
    setExpandedVehicles(newExpanded);
  };


  if (loading) {
    return (
      <Center py={10}>
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <Box>
      {/* Header aerisit */}
      <Box mb={4}>
        <Text fontSize="2xl" fontWeight="bold" mb={1}>Documente Vehicule</Text>
        <Text color="gray.400" fontSize="md">Vizualizează documentele atașate la vehicule</Text>
      </Box>
      {/* Statistici compacte */}
      <HStack spacing={4} mb={4}>
        <Box p={3} bg={cardBg} borderRadius="md" border="1px solid" borderColor={borderColor} minW="120px" textAlign="center">
          <Text fontSize="sm" color="gray.400">Vehicule</Text>
          <Text fontWeight="bold" color="blue.400" fontSize="xl">{vehiclesWithDocuments.length}</Text>
        </Box>
        <Box p={3} bg={cardBg} borderRadius="md" border="1px solid" borderColor={borderColor} minW="120px" textAlign="center">
          <Text fontSize="sm" color="gray.400">Documente</Text>
          <Text fontWeight="bold" color="blue.400" fontSize="xl">{vehiclesWithDocuments.reduce((sum, v) => sum + v.documents.length, 0)}</Text>
        </Box>
        <Box p={3} bg={cardBg} borderRadius="md" border="1px solid" borderColor={borderColor} minW="120px" textAlign="center">
          <Text fontSize="sm" color="gray.400">Valide</Text>
          <Text fontWeight="bold" color="green.400" fontSize="xl">{vehiclesWithDocuments.reduce((sum, v) => sum + v.documents.filter(doc => !isDocumentExpired(doc.expiry_date)).length, 0)}</Text>
        </Box>
      </HStack>
      {/* Filtre compacte */}
      <Flex gap={2} mb={4} align="center">
        <InputGroup maxW="250px">
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input size="sm" placeholder="Caută vehicule sau documente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </InputGroup>
        <Select size="sm" maxW="180px" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">Toate vehiculele</option>
          <option value="valid">Cu documente valide</option>
          <option value="expired">Cu documente expirate</option>
          <option value="RCA">Cu RCA</option>
          <option value="ITP">Cu ITP</option>
          <option value="Carte">Cu carte tehnică</option>
        </Select>
        <Button size="sm" leftIcon={<FiRefreshCw />} onClick={loadVehiclesWithDocuments} colorScheme="blue" variant="outline">Reîmprospătează</Button>
      </Flex>
      {/* Lista vehicule compacte */}
      <VStack spacing={3} align="stretch">
        {currentVehicles.length === 0 ? (
          <Center py={8}>
            <VStack spacing={2}>
              <FiTruck size={32} color="gray.400" />
              <Text color="gray.500" fontSize="md">Nu s-au găsit vehicule</Text>
            </VStack>
          </Center>
        ) : (
          currentVehicles.map((vehicleData) => {
            const isExpanded = expandedVehicles.has(vehicleData.vehicle.id);
            return (
              <Card key={vehicleData.vehicle.id} bg={bgColor} border="1px solid" borderColor={borderColor} px={3} py={2} borderRadius="md" _hover={{ boxShadow: 'md', transform: 'translateY(-1px)', transition: 'all 0.15s' }}>
                <CardHeader p={2} pb={1}>
                  <Flex justify="space-between" align="center">
                    <Flex align="center" gap={3} minW={0}>
                      <Avatar icon={<FiTruck />} bg={avatarBg} color={avatarColor} size="sm" />
                      <Box minW={0}>
                        <Text fontWeight="bold" fontSize="md" isTruncated>{vehicleData.vehicle.brand} {vehicleData.vehicle.model}</Text>
                        <Text color="gray.500" fontSize="sm" isTruncated>{vehicleData.vehicle.registration_number}</Text>
                      </Box>
                    </Flex>
                    <Button size="xs" variant="ghost" onClick={() => toggleVehicleExpansion(vehicleData.vehicle.id)} rightIcon={isExpanded ? <FiChevronUp /> : <FiChevronDown />}>{isExpanded ? 'Ascunde' : 'Documente'}</Button>
                  </Flex>
                </CardHeader>
                <Collapse in={isExpanded}>
                  <CardBody pt={0} pb={2}>
                    <Divider mb={2} />
                    {vehicleData.documents.length === 0 ? (
                      <Center py={2}><Text color="gray.500">Nu există documente pentru acest vehicul</Text></Center>
                    ) : (
                      <List spacing={2}>
                        {vehicleData.documents.map((document) => {
                          const status = getDocumentStatus(document);
                          const TypeIcon = getDocumentTypeIcon(document.type);
                          return (
                            <ListItem key={document.id} p={2} bg={listItemBg} borderRadius="md" border="1px solid" borderColor={listItemBorderColor} fontSize="sm">
                              <Flex justify="space-between" align="center">
                                <Flex align="center" gap={2} minW={0}>
                                  <ListIcon as={TypeIcon} color={`${status.color}.500`} />
                                  <Text fontWeight="semibold" isTruncated>{document.type}</Text>
                                  <Badge colorScheme={status.color} variant="subtle" size="sm">{status.text}</Badge>
                                </Flex>
                                <HStack spacing={1}>
                                  <Tooltip label="Vizualizează documentul"><IconButton aria-label="Vizualizează" icon={<FiEye />} size="xs" colorScheme="blue" variant="ghost" onClick={() => handleViewDocument(document)} /></Tooltip>
                                  <Tooltip label="Descarcă documentul"><IconButton aria-label="Descarcă" icon={<FiDownload />} size="xs" colorScheme="green" variant="ghost" onClick={() => handleDownloadDocument(document)} /></Tooltip>
                                </HStack>
                              </Flex>
                            </ListItem>
                          );
                        })}
                      </List>
                    )}
                  </CardBody>
                </Collapse>
              </Card>
            );
          })
        )}
      </VStack>
      {/* Paginare */}
      {totalPages > 1 && (
        <Flex justify="center" align="center" mt={4} gap={2}>
          <Button size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} isDisabled={currentPage === 1}>Anterior</Button>
          <Text fontSize="sm" color="gray.400">Pagina {currentPage} din {totalPages}</Text>
          <Button size="sm" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} isDisabled={currentPage === totalPages}>Următor</Button>
        </Flex>
      )}
      {/* Modal pentru vizualizare document */}
      {selectedDocument && (
        <DocumentViewerModal
          isOpen={isOpen}
          onClose={() => {
            onClose();
            setSelectedDocument(null);
          }}
          documentId={selectedDocument.id}
          fileName={selectedDocument.file_name || selectedDocument.file_path?.split('/').pop() || `document-${selectedDocument.id}`}
          mimeType={selectedDocument.mime_type || ''}
        />
      )}
    </Box>
  );
} 