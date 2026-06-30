import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useToast,
  Spinner,
  Center,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Card,
  CardBody,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Flex,
  TableContainer,
  Modal,
  ModalOverlay,
  ModalContent,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { FiUpload, FiFile, FiDownload, FiTrash2, FiEye, FiPlus, FiRefreshCw, FiMoreVertical, FiEdit3, FiShare2, FiClock, FiUser, FiSearch, FiFilter, FiBarChart, FiHardDrive, FiX, FiMinimize2, FiMaximize2, FiChevronLeft, FiChevronRight, FiZoomOut, FiZoomIn, FiRotateCw } from 'react-icons/fi';
import { CalendarService } from '../../services/CalendarService';
import EventDocumentUpload from './EventDocumentUpload';
import DocumentViewerModal from './DocumentViewerModal';

interface EventDocument {
  id: number;
  event_id: number;
  document_type: string;
  title: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  version: number;
  is_active: boolean;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
  uploaded_by_user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface EventDocumentsProps {
  eventId: string;
  canEdit: boolean;
  open: boolean;
  onclose: () => void;
  onViewDocument?: (doc: EventDocument) => void;
}

const documentTypeNames: Record<string, string> = {
  CONTRACT: 'Contract',
  FACTURA: 'Factură',
  AVIZ_TEHNIC: 'Aviz Tehnic',
  CERTIFICAT: 'Certificat',
  RAPORT: 'Raport',
  PROTOCOL: 'Protocol',
  AUTORIZATIE: 'Autorizație',
  DECIZIE: 'Decizie',
  NOTA_VERBALA: 'Notă Verbală',
  ALTELE: 'Altele'
};

const documentTypeColors: Record<string, string> = {
  CONTRACT: 'blue',
  FACTURA: 'green',
  AVIZ_TEHNIC: 'orange',
  CERTIFICAT: 'purple',
  RAPORT: 'teal',
  PROTOCOL: 'cyan',
  AUTORIZATIE: 'yellow',
  DECIZIE: 'red',
  NOTA_VERBALA: 'gray',
  ALTELE: 'gray'
};

const MotionBox = motion(Box);
const MotionCard = motion(Card);

export default function EventDocuments({
  eventId,
  canEdit,
  open,
  onclose,
  onViewDocument
}: EventDocumentsProps) {
  const [documents, setDocuments] = useState<EventDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<EventDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<EventDocument | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const toast = useToast();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const bgColor = useColorModeValue('gray.900', 'gray.900');
  const cardBgColor = useColorModeValue('gray.800', 'gray.800');
  const borderColor = useColorModeValue('gray.600', 'gray.600');
  const textColor = useColorModeValue('white', 'white');
  const mutedTextColor = useColorModeValue('gray.300', 'gray.300');

  const loadDocuments = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const calendarService = new CalendarService();
      const response = await calendarService.getEventDocuments(eventId);
      console.log('✅ Documents loaded:', response);
      
      setDocuments(response);
      setFilteredDocuments(response);
      
    } catch (error) {
      console.error('❌ Error loading documents:', error);
        toast({
        title: 'Eroare la încărcarea documentelor',
        description: 'Nu s-au putut încărca documentele evenimentului',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [eventId]);

  // Filtrare documente
  useEffect(() => {
    let filtered = documents;

    // Filtrare după termenul de căutare
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtrare după tip
    if (selectedType && selectedType !== '') {
      filtered = filtered.filter(doc => doc.document_type === selectedType);
    }

    setFilteredDocuments(filtered);
    setCurrentPage(1); // Reset la prima pagină când se schimbă filtrele
  }, [documents, searchTerm, selectedType]);

  // Paginare
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDocuments = filteredDocuments.slice(startIndex, endIndex);

  const handleDocumentAdded = async () => {
    setIsUploadModalOpen(false);
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadDocuments(false);
    
        toast({
      title: 'Document adăugat cu succes! 🎉',
      description: 'Documentul a fost adăugat și este disponibil în listă',
      status: 'success',
      duration: 4000,
          isClosable: true,
        });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDocuments(false);
      toast({
      title: 'Lista actualizată',
      description: 'Documentele au fost reîmprospătate',
      status: 'info',
      duration: 2000,
        isClosable: true,
      });
  };

  const handleDeleteDocument = async (documentId: number) => {
    setDocumentToDelete(documents.find(doc => doc.id === documentId) || null);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      setDeleting(true);
      const calendarService = new CalendarService();
      await calendarService.deleteEventDocument(documentToDelete.id.toString());

      toast({
        title: 'Document șters cu succes! 🗑️',
        description: 'Documentul a fost eliminat din sistem',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      await loadDocuments(false);
    } catch (error) {
      console.error('❌ Error deleting document:', error);
      toast({
        title: 'Eroare la ștergerea documentului',
        description: 'Nu s-a putut șterge documentul',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleViewDocument = (documentId: number) => {
    const doc = documents.find(d => d.id === documentId);
    if (!doc) return;
    if (onViewDocument) {
      onViewDocument(doc);
    } else {
      setViewerDoc(doc);
      onclose();
    }
  };

  const handleDownloadDocument = (documentId: number) => {
    const doc = documents.find(d => d.id === documentId);
    if (!doc) return;
    
    const link = document.createElement('a');
    link.href = `/api/calendar/documents/${documentId}/download`;
    link.download = doc.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel')) return '📊';
    return '📎';
  };

  // Adaug variabilele lipsă
  const documentTypes = ['AVIZ TEHNIC', 'RAPORT', 'CERTIFICAT', 'FACTURA', 'CONTRACT', 'ALTUL'];
  const totalSize = documents.reduce((acc, doc) => acc + doc.file_size, 0);
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  const [viewerDoc, setViewerDoc] = useState<EventDocument | null>(null);

  return (
    <Modal isOpen={open} onClose={onclose} size="6xl" isCentered>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent 
        bg="gray.900" 
        maxW="90vw" 
        maxH="85vh" 
        mx={4}
        borderRadius="xl"
        overflow="hidden"
      >
        {/* Header */}
        <Box bg="linear-gradient(135deg, teal.600 0%, blue.600 100%)" p={6}>
          <Flex justify="space-between" align="center">
            <Box>
              <Text color="white" fontSize="xl" fontWeight="semibold">
                Documente Evenimente
              </Text>
              <Text color="white" fontSize="sm" opacity={0.9}>
                MedSupply SRL
              </Text>
            </Box>
            <IconButton
              aria-label="Close modal"
              icon={<FiX />}
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              onClick={onclose}
            />
          </Flex>
        </Box>

        {/* Content */}
        <Box p={6} overflow="hidden" display="flex" flexDirection="column" h="full">
          {/* Main header */}
          <Flex justify="space-between" align="center" mb={6}>
    <Box>
              <Text color="teal.400" fontSize="lg" fontWeight="semibold">
                Documente Evenimente
              </Text>
              <Text color="gray.400" fontSize="sm">
                Eveniment #{eventId}
              </Text>
            </Box>
            <HStack spacing={3}>
              <IconButton
                aria-label="Refresh documents"
                icon={<FiRefreshCw />}
                onClick={handleRefresh}
                variant="ghost"
                color="gray.400"
                _hover={{ color: 'teal.400' }}
                isLoading={refreshing}
              />
        {canEdit && (
          <Button
            leftIcon={<FiPlus />}
                  onClick={() => setIsUploadModalOpen(true)}
                  colorScheme="teal"
                  bg="teal.600"
                  _hover={{ bg: 'teal.700' }}
          >
            Adaugă Document
          </Button>
        )}
      </HStack>
          </Flex>

          {/* Search and filter bar */}
          <Flex direction={{ base: 'column', sm: 'row' }} gap={4} mb={6}>
            <Box flex={1}>
              <InputGroup maxW="400px">
                <InputLeftElement>
                  <FiSearch color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Caută în documente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  bg="gray.800"
                  borderColor="gray.700"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                  _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                />
              </InputGroup>
            </Box>
            <Box w={{ base: 'full', sm: '200px' }}>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                bg="gray.800"
                borderColor="gray.700"
                color="white"
                _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
              >
                <option value="">Toate tipurile</option>
                {documentTypes.map((type: string) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </Box>
          </Flex>

          {/* Statistics cards */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
            <Stat
              bg="gray.800"
              p={4}
              borderRadius="lg"
              border="1px solid"
              borderColor="gray.700"
            >
              <Flex justify="space-between" align="center">
                <Box>
                  <StatLabel color="gray.400" fontSize="sm">Total Documente</StatLabel>
                  <StatNumber color="white" fontSize="2xl" fontWeight="bold">
                    {filteredDocuments.length}
                  </StatNumber>
                </Box>
                <Box color="teal.400">
                  <FiBarChart size={32} />
                </Box>
              </Flex>
            </Stat>

            <Stat
              bg="gray.800"
              p={4}
              borderRadius="lg"
              border="1px solid"
              borderColor="gray.700"
            >
              <Flex justify="space-between" align="center">
                <Box>
                  <StatLabel color="gray.400" fontSize="sm">Spațiu Utilizat</StatLabel>
                  <StatNumber color="white" fontSize="2xl" fontWeight="bold">
                    {formatFileSize(totalSize)}
                  </StatNumber>
                </Box>
                <Box color="teal.400">
                  <FiHardDrive size={32} />
                </Box>
              </Flex>
            </Stat>

            <Stat
              bg="gray.800"
              p={4}
              borderRadius="lg"
              border="1px solid"
              borderColor="gray.700"
            >
              <Flex justify="space-between" align="center">
                <Box>
                  <StatLabel color="gray.400" fontSize="sm">Rezultate Căutare</StatLabel>
                  <StatNumber color="white" fontSize="2xl" fontWeight="bold">
                    {filteredDocuments.length}
                  </StatNumber>
                </Box>
                <Box color="teal.400">
                  <FiSearch size={32} />
                </Box>
              </Flex>
            </Stat>
          </SimpleGrid>

          {/* Documents table */}
          <Box 
            bg="gray.800" 
            borderRadius="lg" 
            border="1px solid" 
            borderColor="gray.700" 
            overflow="hidden"
            flex={1}
            display="flex"
            flexDirection="column"
          >
            <Box px={6} py={4} borderBottom="1px solid" borderColor="gray.700">
              <Text color="white" fontWeight="semibold">
                Documente ({filteredDocuments.length})
              </Text>
            </Box>
            
            {loading ? (
              <Center py={8} flex={1}>
                <VStack spacing={4}>
                  <Spinner size="xl" color="teal.400" thickness="4px" />
                  <Text color="gray.400">Se încarcă documentele...</Text>
                </VStack>
              </Center>
            ) : filteredDocuments.length === 0 ? (
              <Center py={8} flex={1}>
                <VStack spacing={6}>
                  <Box
                    p={8}
                    borderRadius="full"
                    bg="gray.700"
                    color="gray.400"
                    fontSize="6xl"
                  >
                    📄
                  </Box>
                  <VStack spacing={2}>
                    <Text fontSize="lg" fontWeight="semibold" color="gray.400">
                      Nu există documente
                    </Text>
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Adaugă primul document pentru acest eveniment
                    </Text>
                  </VStack>
                </VStack>
              </Center>
            ) : (
              <Box overflow="auto" flex={1}>
                <Table variant="simple" colorScheme="gray">
                  <Thead bg="gray.700">
                    <Tr>
                      <Th color="gray.300" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                        Document
                      </Th>
                      <Th color="gray.300" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                        Tip
                      </Th>
                      <Th color="gray.300" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                        Mărime
                      </Th>
                      <Th color="gray.300" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                        Data
                      </Th>
                      <Th color="gray.300" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                        Utilizator
                      </Th>
                      <Th color="gray.300" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                        Acțiuni
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {paginatedDocuments.map((doc: any) => (
                      <Tr key={doc.id} _hover={{ bg: 'gray.700' }} transition="background 0.2s">
                        <Td>
                          <Flex align="start" gap={3}>
                            <Box flexShrink={0}>
                              <FiFile size={32} color="#38B2AC" />
                            </Box>
                            <Box flex={1} minW={0}>
                              <Text color="white" fontWeight="medium" noOfLines={1}>
                                {doc.title || 'Document fără titlu'}
                              </Text>
                              <Text color="gray.400" fontSize="sm" noOfLines={1}>
                                {doc.file_name}
                              </Text>
                              {doc.description && (
                                <Text color="gray.500" fontSize="xs" noOfLines={1}>
                                  Descriere
                                </Text>
                              )}
                            </Box>
                          </Flex>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={
                              doc.document_type === 'AVIZ TEHNIC' ? 'yellow' :
                              doc.document_type === 'RAPORT' ? 'green' :
                              doc.document_type === 'CERTIFICAT' ? 'blue' :
                              doc.document_type === 'FACTURA' ? 'purple' :
                              doc.document_type === 'CONTRACT' ? 'indigo' :
                              'gray'
                            }
                            variant="subtle"
                            fontSize="xs"
                            px={2}
                            py={1}
                            borderRadius="full"
                          >
                            {doc.document_type || 'NECUNOSCUT'}
                  </Badge>
                        </Td>
                        <Td>
                          <Text color="gray.300" fontSize="sm">
                            {formatFileSize(doc.file_size)}
                          </Text>
                        </Td>
                        <Td>
                          <Text color="gray.300" fontSize="sm">
                            {new Date(doc.created_at).toLocaleDateString('ro-RO', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </Td>
                        <Td>
                          <Text color="gray.300" fontSize="sm">
                            {doc.uploaded_by_user ? 
                              `${doc.uploaded_by_user.firstName} ${doc.uploaded_by_user.lastName}` : 
                              'Utilizator necunoscut'
                            }
                          </Text>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                      <IconButton
                              aria-label="View document"
                        icon={<FiEye />}
                              size="sm"
                        variant="ghost"
                              color="teal.400"
                              _hover={{ color: 'teal.300' }}
                              onClick={() => handleViewDocument(doc.id)}
                      />
                      <IconButton
                              aria-label="Download document"
                        icon={<FiDownload />}
                              size="sm"
                        variant="ghost"
                              color="blue.400"
                              _hover={{ color: 'blue.300' }}
                              onClick={() => handleDownloadDocument(doc.id)}
                      />
                        <IconButton
                              aria-label="Delete document"
                          icon={<FiTrash2 />}
                              size="sm"
                          variant="ghost"
                              color="red.400"
                              _hover={{ color: 'red.300' }}
                              onClick={() => handleDeleteDocument(doc.id)}
                            />
                  </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </Box>

          {/* Pagination */}
          {filteredDocuments.length > 0 && (
            <Flex justify="space-between" align="center" mt={6}>
              <Text fontSize="sm" color="gray.400">
                Afișez {startIndex + 1}-{Math.min(endIndex, filteredDocuments.length)} din {filteredDocuments.length}
              </Text>
              <HStack spacing={2}>
                <Select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  size="sm"
                  maxW="80px"
                  bg="gray.800"
                  borderColor="gray.700"
                  color="white"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </Select>
                <Text color="gray.400" fontSize="sm">per pagină</Text>
              </HStack>
            </Flex>
          )}
        </Box>
      </ModalContent>

      {/* Add Document Modal */}
      <EventDocumentUpload
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        eventId={eventId}
        onSuccess={handleDocumentAdded}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} leastDestructiveRef={cancelRef}>
        <AlertDialogOverlay />
        <AlertDialogContent bg="gray.800" borderColor="gray.700">
          <AlertDialogHeader color="white">Șterge Document</AlertDialogHeader>
          <AlertDialogBody color="gray.300">
            Ești sigur că vrei să ștergi acest document? Această acțiune nu poate fi anulată.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={() => setIsDeleteDialogOpen(false)} variant="ghost">
              Anulează
            </Button>
            <Button colorScheme="red" ml={3} onClick={confirmDelete} isLoading={deleting}>
              Șterge
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Viewer Modal */}
      {viewerDoc && (
        <DocumentViewerModal
          isOpen={!!viewerDoc}
          onClose={() => {
            setViewerDoc(null);
            // Închidem complet modal-ul documentelor
          }}
          documentId={viewerDoc.id}
          fileName={viewerDoc.file_name}
          mimeType={viewerDoc.mime_type}
        />
      )}
      </Modal>
  );
} 