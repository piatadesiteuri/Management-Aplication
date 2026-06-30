import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  IconButton,
  useToast,
  Box,
  Divider,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Spinner,
  Center,
  Flex,
  Card,
  CardBody,
  CardHeader,
  Icon,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import {
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiDownload,
  FiPlus,
  FiAlertCircle,
  FiCheckCircle,
  FiFileText,
  FiCalendar,
  FiRefreshCw,
  FiInfo,
  FiEye,
  FiZoomIn,
  FiZoomOut,
  FiRotateCw,
  FiX,
  FiMaximize2,
  FiMinimize2,
  FiChevronLeft,
  FiChevronRight,
  FiTruck,
  FiAlertTriangle,
  FiClock,
  FiShield,
} from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { Vehicle, VehicleDocument } from '../../types/vehicles';
import { VehicleService } from '../../services/vehicles/VehicleService';
import DocumentUpload from './DocumentUpload';

// Animații
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

interface VehicleDocumentsProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
}

// Componenta pentru vizualizarea PDF-urilor
interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: VehicleDocument;
  vehicleId: number;
}

const PDFViewerModal = ({ isOpen, onClose, document, vehicleId }: PDFViewerModalProps) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const toast = useToast();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedText = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    if (isOpen) {
      loadPDF();
      setCurrentPage(1);
      setTotalPages(2); // Setez un număr realist de pagini pentru demonstrație
      setZoom(1);
    }
    return () => {
      if (pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
      setPdfUrl('');
      setLoadError('');
    };
  }, [isOpen]);



  // Adaug keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handlePreviousPage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleNextPage();
          break;
        case '+':
        case '=':
          event.preventDefault();
          handleZoomIn();
          break;
        case '-':
          event.preventDefault();
          handleZoomOut();
          break;
        case '0':
          event.preventDefault();
          handleResetZoom();
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPage, totalPages, zoom]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      setLoadError('');

      if (pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }

      const blob = await vehicleService.viewVehicleDocument(vehicleId, document.id);
      const objectUrl = URL.createObjectURL(blob);

      console.log(`👁️ [DEBUG] Loading PDF from fetched blob for document ${document.id}`);
      setPdfUrl(objectUrl);
    } catch (error: any) {
      console.error('❌ Error loading PDF:', error);
      const status = error?.response?.status;
      const message =
        status === 404
          ? 'Documentul nu mai există sau fișierul a fost șters de pe server.'
          : 'Nu s-a putut încărca documentul pentru vizualizare.';

      setPdfUrl('');
      setLoadError(message);
      toast({
        title: 'Eroare încărcare PDF',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setIsChangingPage(true);
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setIsChangingPage(true);
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePageInputChange = (value: string) => {
    const pageNum = parseInt(value);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setIsChangingPage(true);
      setCurrentPage(pageNum);
    }
  };

  const handleDownload = async () => {
    try {
      const vehicleService = new (await import('../../services/vehicles/VehicleService')).VehicleService();
      const blob = await vehicleService.downloadVehicleDocument(vehicleId, document.id);
      
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${document.type}-${document.number}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Descărcare inițiată',
        description: `Documentul ${document.type} se descarcă...`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('❌ Error downloading document:', error);
      toast({
        title: 'Eroare descărcare',
        description: 'Nu s-a putut descărca documentul.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={isFullscreen ? "full" : "6xl"}
      motionPreset="slideInBottom"
      scrollBehavior="inside"
    >
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent 
        borderRadius={isFullscreen ? "none" : "xl"} 
        bg={bgColor}
        h={isFullscreen ? "100vh" : "90vh"}
        maxH={isFullscreen ? "100vh" : "90vh"}
      >
        <ModalHeader 
          borderBottom="1px solid" 
          borderColor={borderColor}
          py={3}
        >
          <Flex justify="space-between" align="center">
            <VStack align="start" spacing={0}>
              <HStack>
                <FiFileText />
                <Text fontSize="lg" fontWeight="semibold">
                  {document.type} - {document.number}
                </Text>
              </HStack>
              <Text fontSize="sm" color="gray.500">
                Emis de: {document.issuingAuthority} • Folosește ← → pentru navigare, +/- pentru zoom
              </Text>
            </VStack>
            
            <HStack spacing={2}>
              {/* Controale navigare pagini */}
              <IconButton
                aria-label="Pagina anterioară"
                icon={<FiChevronLeft />}
                size="sm"
                variant="ghost"
                onClick={handlePreviousPage}
                isDisabled={currentPage <= 1}
              />
              <HStack spacing={1} minW="120px" justify="center">
                <Input
                  size="sm"
                  width="50px"
                  textAlign="center"
                  value={currentPage}
                  onChange={(e) => handlePageInputChange(e.target.value)}
                  borderRadius="md"
                />
                <Text fontSize="sm" color="gray.500">
                  / {totalPages}
                </Text>
              </HStack>
              <IconButton
                aria-label="Pagina următoare"
                icon={<FiChevronRight />}
                size="sm"
                variant="ghost"
                onClick={handleNextPage}
                isDisabled={currentPage >= totalPages}
              />
              
              <Divider orientation="vertical" h="20px" />
              
              {/* Controale zoom */}
              <IconButton
                aria-label="Zoom out"
                icon={<FiZoomOut />}
                size="sm"
                variant="ghost"
                onClick={handleZoomOut}
                isDisabled={zoom <= 0.5}
              />
              <Text fontSize="sm" minW="60px" textAlign="center">
                {Math.round(zoom * 100)}%
              </Text>
              <IconButton
                aria-label="Zoom in"
                icon={<FiZoomIn />}
                size="sm"
                variant="ghost"
                onClick={handleZoomIn}
                isDisabled={zoom >= 3}
              />
              <IconButton
                aria-label="Reset zoom"
                icon={<FiRotateCw />}
                size="sm"
                variant="ghost"
                onClick={handleResetZoom}
              />
              
              <Divider orientation="vertical" h="20px" />
              
              {/* Controale fereastră */}
              <IconButton
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                icon={isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
                size="sm"
                variant="ghost"
                onClick={toggleFullscreen}
              />
              <IconButton
                aria-label="Download"
                icon={<FiDownload />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onClick={handleDownload}
              />
              <IconButton
                aria-label="Close"
                icon={<FiX />}
                size="sm"
                variant="ghost"
                onClick={onClose}
              />
            </HStack>
          </Flex>
        </ModalHeader>

        <ModalBody p={0} overflow="hidden">
          {loading ? (
            <Center h="full">
              <VStack spacing={4}>
                <Spinner size="xl" color="brand.500" />
                <Text>Se încarcă documentul...</Text>
              </VStack>
            </Center>
          ) : pdfUrl ? (
            <Box 
              h="full" 
              overflow="hidden"
              bg="transparent"
              position="relative"
            >
              <iframe
                key={`pdf-${currentPage}-${zoom}`}
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&page=${currentPage}&view=FitH&zoom=${Math.round(zoom * 100)}`}
                width="100%"
                height="100%"
                style={{
                  border: 'none',
                  display: 'block',
                  backgroundColor: 'transparent',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease',
                }}
                title={`${document.type} - ${document.number}`}
                onLoad={() => {
                  console.log(`📄 PDF loaded: page ${currentPage}, zoom ${zoom}%`);
                  setIsChangingPage(false);
                }}
              />
              
              {isChangingPage && (
                <Center
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  bg="rgba(0, 0, 0, 0.7)"
                  borderRadius="md"
                  p={4}
                  zIndex={10}
                >
                  <HStack spacing={3}>
                    <Spinner size="md" color="white" />
                    <Text fontSize="sm" color="white">
                      Pagina {currentPage}
                    </Text>
                  </HStack>
                </Center>
              )}
            </Box>
          ) : loadError ? (
            <Center h="full">
              <VStack spacing={4} maxW="420px" textAlign="center">
                <FiFileText size={48} color="gray" />
                <Text color="gray.500">{loadError}</Text>
                <HStack>
                  <Button onClick={loadPDF} colorScheme="brand" size="sm">
                    Încearcă din nou
                  </Button>
                  <Button onClick={onClose} variant="ghost" size="sm">
                    Închide
                  </Button>
                </HStack>
              </VStack>
            </Center>
          ) : (
            <Center h="full">
              <VStack spacing={4}>
                <FiFileText size={48} color="gray" />
                <Text color="gray.500">Nu s-a putut încărca documentul</Text>
                <Button onClick={loadPDF} colorScheme="brand" size="sm">
                  Încearcă din nou
                </Button>
              </VStack>
            </Center>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const vehicleService = new VehicleService();

export default function VehicleDocuments({
  isOpen,
  onClose,
  vehicle,
}: VehicleDocumentsProps) {
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<VehicleDocument | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPDFViewerOpen, setIsPDFViewerOpen] = useState(false);
  const [documentToView, setDocumentToView] = useState<VehicleDocument | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Simulez documente pentru demonstrație
  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      // Încarc documentele din baza de date
      const vehicleService = new (await import('../../services/vehicles/VehicleService')).VehicleService();
      const documentsData = await vehicleService.getVehicleDocuments(vehicle.id);
      
      console.log('📄 Raw documents from API:', documentsData);
      
      // Transform datele pentru a fi compatibile cu interfața
      const transformedDocuments = documentsData.map((doc: any) => ({
        id: doc.id,
        type: doc.type,
        number: doc.number,
        issueDate: doc.issue_date,
        expiryDate: doc.expiry_date,
        issuingAuthority: doc.issuing_authority,
        filePath: doc.file_path
      }));
      
      console.log('✅ Documents loaded from database:', transformedDocuments);
      setDocuments(transformedDocuments);
      
      if (transformedDocuments.length === 0) {
        console.log('ℹ️ No documents found for this vehicle');
      }
    } catch (error: any) {
      console.error('❌ Error loading documents from database:', error);
      
      // Afișez eroarea dar nu mai folosesc fallback
      toast({
        title: 'Eroare încărcare documente',
        description: error.response?.data?.message || 'Nu s-au putut încărca documentele din baza de date.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      // Setez lista goală în caz de eroare
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (document: VehicleDocument) => {
    try {
      setLoading(true);
      
      const vehicleService = new (await import('../../services/vehicles/VehicleService')).VehicleService();
      await vehicleService.deleteVehicleDocument(vehicle.id, document.id);
      
      // Actualizez lista locală
      setDocuments(prev => prev.filter(doc => doc.id !== document.id));
      
      toast({
        title: 'Succes',
        description: 'Documentul a fost șters cu succes din baza de date.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      setIsDeleteAlertOpen(false);
      setSelectedDocument(null);
    } catch (error: any) {
      console.error('❌ Error deleting document:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Eroare necunoscută';
      
      toast({
        title: 'Eroare',
        description: `Nu s-a putut șterge documentul: ${errorMessage}`,
        status: 'error',
        duration: 8000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (doc: VehicleDocument) => {
    setDocumentToView(doc);
    setIsPDFViewerOpen(true);
  };

  const handleDownloadDocument = async (doc: VehicleDocument) => {
    try {
      const vehicleService = new (await import('../../services/vehicles/VehicleService')).VehicleService();
      const blob = await vehicleService.downloadVehicleDocument(vehicle.id, doc.id);
      
      // Creez un URL temporar pentru blob
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${doc.type}-${doc.number}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Descărcare inițiată',
        description: `Documentul ${doc.type} se descarcă...`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('❌ Error downloading document:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Eroare necunoscută';
      
      toast({
        title: 'Eroare descărcare',
        description: `Nu s-a putut descărca documentul: ${errorMessage}`,
        status: 'error',
        duration: 8000,
        isClosable: true,
      });
    }
  };

  const isDocumentExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const getExpiryStatus = (document: VehicleDocument) => {
    const expiryDate = new Date(document.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      return {
        label: 'Expirat',
        color: 'red',
        icon: FiAlertCircle,
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        label: `Expiră în ${daysUntilExpiry} zile`,
        color: 'orange',
        icon: FiAlertCircle,
      };
    } else {
      return {
        label: 'Valid',
        color: 'green',
        icon: FiCheckCircle,
      };
    }
  };

  const expiredDocs = documents.filter(doc => isDocumentExpired(doc.expiryDate));
  const expiringSoonDocs = documents.filter(doc => {
    const daysUntilExpiry = Math.ceil(
      (new Date(doc.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  });

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="6xl"
      motionPreset="slideInBottom"
      scrollBehavior="inside"
    >
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent 
        borderRadius="2xl" 
        bg={bgColor}
        boxShadow="2xl"
        border="1px solid"
        borderColor={borderColor}
        animation={`${fadeInUp} 0.3s ease-out`}
      >
        <ModalHeader 
          borderBottom="1px solid" 
          borderColor={borderColor}
          pb={6}
        >
          <VStack align="start" spacing={3}>
            <HStack justify="space-between" w="full">
              <HStack spacing={3}>
                <Box
                  p={2}
                  borderRadius="lg"
                  bgGradient="linear(to-r, blue.100, blue.200)"
                  color="blue.600"
                >
                  <Icon as={FiFileText} boxSize={5} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="xl" fontWeight="bold" color={textColor}>
                    Documente Vehicul
                  </Text>
                  <Text fontSize="sm" color={mutedText}>
                    {vehicle.brand} {vehicle.model} - {vehicle.registration_number}
                  </Text>
                </VStack>
              </HStack>
              <HStack spacing={3}>
                <Tooltip label="Reîmprospătează lista" placement="top">
                  <IconButton
                    aria-label="Reîmprospătează lista"
                    icon={<Icon as={FiRefreshCw} />}
                    size="md"
                    variant="ghost"
                    onClick={loadDocuments}
                    isLoading={loading}
                    borderRadius="xl"
                    _hover={{
                      transform: 'rotate(180deg)',
                      bg: useColorModeValue('gray.100', 'gray.700'),
                    }}
                    transition="all 0.3s"
                  />
                </Tooltip>
                <Button
                  leftIcon={<Icon as={FiPlus} />}
                  rightIcon={<Icon as={FiFileText} />}
                  colorScheme="blue"
                  size="md"
                  onClick={() => setIsUploadModalOpen(true)}
                  borderRadius="xl"
                  boxShadow="md"
                  bgGradient="linear(to-r, blue.400, blue.600)"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                    bgGradient: "linear(to-r, blue.500, blue.700)",
                  }}
                  _active={{
                    transform: 'translateY(0)',
                    bgGradient: "linear(to-r, blue.600, blue.800)",
                  }}
                  transition="all 0.2s"
                >
                  Adaugă Document
                </Button>
              </HStack>
            </HStack>
          </VStack>
        </ModalHeader>

        <ModalBody p={8}>
          <VStack spacing={8} align="stretch">
            {/* Enhanced Statistics Cards */}
            <Box animation={`${fadeInUp} 0.5s ease-out`}>
              <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={4}>
                Statistici Documente
              </Text>
              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
                <Card
                  bg={cardBg}
                  borderRadius="xl"
                  boxShadow="lg"
                  _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
                  transition="all 0.3s"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <CardBody p={6}>
                    <HStack spacing={4}>
                      <Box
                        p={3}
                        borderRadius="lg"
                        bgGradient="linear(to-r, blue.100, blue.200)"
                        color="blue.600"
                      >
                        <Icon as={FiFileText} boxSize={5} />
                      </Box>
                      <Stat>
                        <StatLabel color={mutedText} fontSize="sm" fontWeight="medium">
                          Total Documente
                        </StatLabel>
                        <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>
                          {documents.length}
                        </StatNumber>
                        <StatHelpText color="blue.500" fontSize="sm">
                          Toate documentele
                        </StatHelpText>
                      </Stat>
                    </HStack>
                  </CardBody>
                </Card>

                <Card
                  bg={cardBg}
                  borderRadius="xl"
                  boxShadow="lg"
                  _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
                  transition="all 0.3s"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <CardBody p={6}>
                    <HStack spacing={4}>
                      <Box
                        p={3}
                        borderRadius="lg"
                        bgGradient="linear(to-r, red.100, red.200)"
                        color="red.600"
                      >
                        <Icon as={FiAlertTriangle} boxSize={5} />
                      </Box>
                      <Stat>
                        <StatLabel color={mutedText} fontSize="sm" fontWeight="medium">
                          Documente Expirate
                        </StatLabel>
                        <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>
                          {expiredDocs.length}
                        </StatNumber>
                        <StatHelpText color="red.500" fontSize="sm">
                          Necesită reînnoire
                        </StatHelpText>
                      </Stat>
                    </HStack>
                  </CardBody>
                </Card>

                <Card
                  bg={cardBg}
                  borderRadius="xl"
                  boxShadow="lg"
                  _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
                  transition="all 0.3s"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <CardBody p={6}>
                    <HStack spacing={4}>
                      <Box
                        p={3}
                        borderRadius="lg"
                        bgGradient="linear(to-r, orange.100, orange.200)"
                        color="orange.600"
                      >
                        <Icon as={FiClock} boxSize={5} />
                      </Box>
                      <Stat>
                        <StatLabel color={mutedText} fontSize="sm" fontWeight="medium">
                          Expiră în 30 zile
                        </StatLabel>
                        <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>
                          {expiringSoonDocs.length}
                        </StatNumber>
                        <StatHelpText color="orange.500" fontSize="sm">
                          Atenție necesară
                        </StatHelpText>
                      </Stat>
                    </HStack>
                  </CardBody>
                </Card>

                <Card
                  bg={cardBg}
                  borderRadius="xl"
                  boxShadow="lg"
                  _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
                  transition="all 0.3s"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <CardBody p={6}>
                    <HStack spacing={4}>
                      <Box
                        p={3}
                        borderRadius="lg"
                        bgGradient="linear(to-r, green.100, green.200)"
                        color="green.600"
                      >
                        <Icon as={FiCheckCircle} boxSize={5} />
                      </Box>
                      <Stat>
                        <StatLabel color={mutedText} fontSize="sm" fontWeight="medium">
                          Documente Valide
                        </StatLabel>
                        <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>
                          {documents.length - expiredDocs.length - expiringSoonDocs.length}
                        </StatNumber>
                        <StatHelpText color="green.500" fontSize="sm">
                          În regulă
                        </StatHelpText>
                      </Stat>
                    </HStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </Box>

            {/* Information Alert */}
            <Alert
              status="info"
              variant="subtle"
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              borderRadius="xl"
              bg={useColorModeValue('blue.50', 'blue.900')}
              color={useColorModeValue('blue.800', 'blue.200')}
              animation={`${fadeInUp} 0.7s ease-out`}
            >
              <AlertIcon as={FiInfo} />
              <Box>
                <AlertTitle fontWeight="semibold">
                  Cum să vizualizez documentele?
                </AlertTitle>
                <AlertDescription>
                  Faceți clic pe "Vizualizează" pentru a vedea documentul în modal sau pe "Descarcă" pentru a-l salva local.
                </AlertDescription>
              </Box>
            </Alert>

            {/* Enhanced Document List */}
            <Box animation={`${fadeInUp} 0.9s ease-out`}>
              <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={4}>
                Lista Documente
              </Text>
              <Card
                bg={cardBg}
                borderRadius="xl"
                boxShadow="lg"
                border="1px solid"
                borderColor={borderColor}
                overflow="hidden"
              >
                <CardBody p={0}>
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                        <Tr>
                          <Th color={textColor} fontWeight="semibold">Tip Document</Th>
                          <Th color={textColor} fontWeight="semibold">Număr</Th>
                          <Th color={textColor} fontWeight="semibold">Data Emiterii</Th>
                          <Th color={textColor} fontWeight="semibold">Data Expirării</Th>
                          <Th color={textColor} fontWeight="semibold">Status</Th>
                          <Th color={textColor} fontWeight="semibold">Emitent</Th>
                          <Th color={textColor} fontWeight="semibold">Acțiuni</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {documents.map((doc, index) => {
                          const status = getExpiryStatus(doc);
                          return (
                            <Tr
                              key={doc.id}
                              _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                              transition="all 0.2s"
                              animation={`${slideIn} ${0.1 * index}s ease-out`}
                            >
                              <Td>
                                <Badge
                                  colorScheme="purple"
                                  px={3}
                                  py={1}
                                  borderRadius="full"
                                  fontSize="sm"
                                  fontWeight="medium"
                                >
                                  {doc.type}
                                </Badge>
                              </Td>
                              <Td fontWeight="medium" color={textColor}>
                                {doc.number}
                              </Td>
                              <Td>
                                <HStack spacing={2}>
                                  <Icon as={FiCalendar} color={mutedText} boxSize={4} />
                                  <Text color={textColor}>
                                    {new Date(doc.issueDate).toLocaleDateString('ro-RO')}
                                  </Text>
                                </HStack>
                              </Td>
                              <Td>
                                <HStack spacing={2}>
                                  <Icon as={FiCalendar} color={mutedText} boxSize={4} />
                                  <Text color={textColor}>
                                    {new Date(doc.expiryDate).toLocaleDateString('ro-RO')}
                                  </Text>
                                </HStack>
                              </Td>
                              <Td>
                                <Badge
                                  colorScheme={status.color as any}
                                  px={3}
                                  py={1}
                                  borderRadius="full"
                                  fontSize="sm"
                                  fontWeight="medium"
                                >
                                  <HStack spacing={1}>
                                    <Icon as={status.icon} boxSize={3} />
                                    <Text>{status.label}</Text>
                                  </HStack>
                                </Badge>
                              </Td>
                              <Td color={textColor} fontWeight="medium">
                                {doc.issuingAuthority}
                              </Td>
                              <Td>
                                <Menu>
                                  <Tooltip label="Acțiuni" placement="top">
                                    <MenuButton
                                      as={IconButton}
                                      aria-label="Acțiuni"
                                      icon={<Icon as={FiMoreVertical} />}
                                      variant="ghost"
                                      size="sm"
                                      borderRadius="lg"
                                      _hover={{ 
                                        bg: useColorModeValue('gray.100', 'gray.600'),
                                        transform: 'scale(1.1)'
                                      }}
                                      transition="all 0.2s"
                                    />
                                  </Tooltip>
                                  <MenuList>
                                    <MenuItem
                                      icon={<Icon as={FiEye} />}
                                      onClick={() => handleViewDocument(doc)}
                                    >
                                      Vizualizează
                                    </MenuItem>
                                    <MenuItem
                                      icon={<Icon as={FiDownload} />}
                                      onClick={() => handleDownloadDocument(doc)}
                                    >
                                      Descarcă
                                    </MenuItem>
                                    <Divider />
                                    <MenuItem
                                      icon={<Icon as={FiEdit2} />}
                                      onClick={() => {
                                        setSelectedDocument(doc);
                                        setIsEditModalOpen(true);
                                      }}
                                    >
                                      Editează
                                    </MenuItem>
                                    <MenuItem
                                      icon={<Icon as={FiTrash2} />}
                                      color="red.500"
                                      onClick={() => {
                                        setSelectedDocument(doc);
                                        setIsDeleteAlertOpen(true);
                                      }}
                                    >
                                      Șterge
                                    </MenuItem>
                                  </MenuList>
                                </Menu>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </Box>
                </CardBody>
              </Card>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor} pt={6}>
          <Button
            onClick={onClose}
            colorScheme="gray"
            variant="outline"
            borderRadius="xl"
            px={8}
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: 'md'
            }}
            transition="all 0.2s"
          >
            Închide
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

      {/* Alert Dialog pentru ștergere */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteAlertOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Șterge Document
            </AlertDialogHeader>

            <AlertDialogBody>
              Ești sigur că vrei să ștergi documentul{' '}
              <strong>{selectedDocument?.type} - {selectedDocument?.number}</strong>?
              Această acțiune nu poate fi anulată.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button 
                ref={cancelRef} 
                onClick={() => setIsDeleteAlertOpen(false)}
                variant="ghost"
                color={useColorModeValue('gray.600', 'gray.300')}
                _hover={{
                  bg: useColorModeValue('gray.100', 'gray.700'),
                  color: useColorModeValue('gray.800', 'gray.100'),
                }}
              >
                Anulează
              </Button>
              <Button
                colorScheme="red"
                onClick={() => selectedDocument && handleDeleteDocument(selectedDocument)}
                ml={3}
                isLoading={loading}
                color="white"
                bg="red.500"
                _hover={{
                  bg: 'red.600',
                }}
                _active={{
                  bg: 'red.700',
                }}
              >
                Șterge
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Modal Upload Documente */}
      <DocumentUpload
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        vehicleId={vehicle.id}
        onSuccess={() => {
          loadDocuments(); // Reîmprospătez lista de documente
          setIsUploadModalOpen(false);
        }}
      />

      {/* Modal PDF Viewer */}
      {documentToView && (
        <PDFViewerModal
          isOpen={isPDFViewerOpen}
          onClose={() => {
            setIsPDFViewerOpen(false);
            setDocumentToView(null);
          }}
          document={documentToView}
          vehicleId={vehicle.id}
        />
      )}
    </>
  );
} 