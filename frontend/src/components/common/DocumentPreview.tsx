import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  IconButton,
  useColorModeValue,
  Spinner,
  Center,
  Badge,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Image,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  FiFile,
  FiFileText,
  FiImage,
  FiEye,
  FiX,
  FiDownload,
  FiZoomIn,
  FiZoomOut,
  FiRotateCw,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/src/Page/AnnotationLayer.css';
import 'react-pdf/src/Page/TextLayer.css';

// Configurare PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface DocumentPreviewProps {
  file: File;
  onRemove?: () => void;
  showPreview?: boolean;
  maxHeight?: string;
  maxWidth?: string;
}

interface FullscreenPreviewProps {
  file: File;
  isOpen: boolean;
  onClose: () => void;
}

// Componenta pentru preview-ul complet
function FullscreenPreview({ file, isOpen, onClose }: FullscreenPreviewProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    if (isOpen && file) {
      setLoading(true);
      setError(null);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
          setLoading(false);
        };
        reader.onerror = () => {
          setError('Eroare la încărcarea imaginii');
          setLoading(false);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
          setLoading(false);
        };
        reader.onerror = () => {
          setError('Eroare la încărcarea PDF-ului');
          setLoading(false);
        };
        reader.readAsDataURL(file);
      } else {
        setError('Tip de fișier neacceptat pentru preview');
        setLoading(false);
      }
    }
  }, [isOpen, file]);

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
  const handleResetZoom = () => setScale(1);
  const handleRotate = () => setRotation(r => (r + 90) % 360);
  const handleNextPage = () => setPageNumber(p => Math.min(p + 1, numPages));
  const handlePrevPage = () => setPageNumber(p => Math.max(p - 1, 1));

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return FiImage;
    if (type === 'application/pdf') return FiFileText;
    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        type === 'application/msword') return FiFileText; // Word
    if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        type === 'application/vnd.ms-excel') return FiFileText; // Excel
    if (type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
        type === 'application/vnd.ms-powerpoint') return FiFileText; // PowerPoint
    if (type === 'text/plain') return FiFileText; // TXT
    if (type === 'application/rtf') return FiFileText; // RTF
    return FiFile;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent bg={bgColor} borderRadius="xl" maxH="90vh">
        <ModalHeader borderBottom="1px solid" borderColor={borderColor}>
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Icon as={getFileIcon(file.type)} color="blue.500" />
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold">{file.name}</Text>
                <Text fontSize="sm" color="gray.500">
                  {formatFileSize(file.size)} • {file.type}
                </Text>
              </VStack>
            </HStack>
            <HStack spacing={2}>
              {file.type === 'application/pdf' && numPages > 1 && (
                <HStack spacing={2}>
                  <IconButton
                    aria-label="Pagina anterioară"
                    icon={<FiChevronLeft />}
                    size="sm"
                    variant="ghost"
                    onClick={handlePrevPage}
                    isDisabled={pageNumber <= 1}
                  />
                  <Text fontSize="sm" minW="60px" textAlign="center">
                    {pageNumber} / {numPages}
                  </Text>
                  <IconButton
                    aria-label="Pagina următoare"
                    icon={<FiChevronRight />}
                    size="sm"
                    variant="ghost"
                    onClick={handleNextPage}
                    isDisabled={pageNumber >= numPages}
                  />
                </HStack>
              )}
              <IconButton
                aria-label="Zoom out"
                icon={<FiZoomOut />}
                size="sm"
                variant="ghost"
                onClick={handleZoomOut}
              />
              <IconButton
                aria-label="Reset zoom"
                icon={<FiRefreshCw />}
                size="sm"
                variant="ghost"
                onClick={handleResetZoom}
              />
              <IconButton
                aria-label="Zoom in"
                icon={<FiZoomIn />}
                size="sm"
                variant="ghost"
                onClick={handleZoomIn}
              />
              <IconButton
                aria-label="Rotate"
                icon={<FiRotateCw />}
                size="sm"
                variant="ghost"
                onClick={handleRotate}
              />
            </HStack>
          </HStack>
        </ModalHeader>

        <ModalBody p={0}>
          <Center minH="60vh" p={4}>
            {loading ? (
              <VStack spacing={4}>
                <Spinner size="xl" color="blue.500" />
                <Text>Se încarcă preview-ul...</Text>
              </VStack>
            ) : error ? (
              <Alert status="error" borderRadius="lg">
                <AlertIcon />
                <Text>{error}</Text>
              </Alert>
            ) : file.type.startsWith('image/') ? (
              <Box
                maxW="100%"
                maxH="70vh"
                overflow="auto"
                borderRadius="lg"
                border="1px solid"
                borderColor={borderColor}
              >
                <Image
                  src={previewUrl}
                  alt={file.name}
                  style={{
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    transformOrigin: 'center',
                    transition: 'transform 0.3s ease',
                  }}
                  maxW="100%"
                  maxH="70vh"
                  objectFit="contain"
                />
              </Box>
            ) : file.type === 'application/pdf' ? (
              <Box
                maxW="100%"
                maxH="70vh"
                overflow="auto"
                borderRadius="lg"
                border="1px solid"
                borderColor={borderColor}
              >
                <Document
                  file={previewUrl}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  onLoadError={() => setError('Eroare la încărcarea PDF-ului')}
                  loading={
                    <Center p={8}>
                      <Spinner size="xl" color="blue.500" />
                    </Center>
                  }
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    rotate={rotation}
                    loading={
                      <Center p={4}>
                        <Spinner size="lg" color="blue.500" />
                      </Center>
                    }
                  />
                </Document>
              </Box>
            ) : (
              <VStack spacing={4}>
                <Icon as={FiFile} size="64px" color="gray.400" />
                <Text color="gray.500">Preview nu este disponibil pentru acest tip de fișier</Text>
                <Button
                  leftIcon={<FiDownload />}
                  colorScheme="blue"
                  onClick={() => {
                    const url = URL.createObjectURL(file);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = file.name;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Descarcă fișierul
                </Button>
              </VStack>
            )}
          </Center>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <HStack spacing={3}>
            <Button
              leftIcon={<FiDownload />}
              colorScheme="blue"
              onClick={() => {
                const url = URL.createObjectURL(file);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Descarcă
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Închide
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// Componenta principală de preview
export default function DocumentPreview({ 
  file, 
  onRemove, 
  showPreview = true,
  maxHeight = "200px",
  maxWidth = "300px"
}: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    if (file && showPreview) {
      setLoading(true);
      setError(null);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
          setLoading(false);
        };
        reader.onerror = () => {
          setError('Eroare la încărcarea imaginii');
          setLoading(false);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
          setLoading(false);
        };
        reader.onerror = () => {
          setError('Eroare la încărcarea PDF-ului');
          setLoading(false);
        };
        reader.readAsDataURL(file);
      } else {
        setLoading(false);
      }
    }
  }, [file, showPreview]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return FiImage;
    if (type === 'application/pdf') return FiFileText;
    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        type === 'application/msword') return FiFileText; // Word
    if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        type === 'application/vnd.ms-excel') return FiFileText; // Excel
    if (type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
        type === 'application/vnd.ms-powerpoint') return FiFileText; // PowerPoint
    if (type === 'text/plain') return FiFileText; // TXT
    if (type === 'application/rtf') return FiFileText; // RTF
    return FiFile;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeColor = (type: string) => {
    if (type.startsWith('image/')) return 'green';
    if (type === 'application/pdf') return 'red';
    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        type === 'application/msword') return 'blue'; // Word
    if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        type === 'application/vnd.ms-excel') return 'green'; // Excel
    if (type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
        type === 'application/vnd.ms-powerpoint') return 'orange'; // PowerPoint
    if (type === 'text/plain') return 'gray'; // TXT
    if (type === 'application/rtf') return 'purple'; // RTF
    return 'gray';
  };

  return (
    <>
      <Box
        border="1px solid"
        borderColor={borderColor}
        borderRadius="lg"
        bg={bgColor}
        overflow="hidden"
        position="relative"
        _hover={{
          transform: 'translateY(-2px)',
          boxShadow: 'lg',
          transition: 'all 0.2s'
        }}
      >
        {/* Header cu informații despre fișier */}
        <HStack
          p={3}
          bg={cardBg}
          borderBottom="1px solid"
          borderColor={borderColor}
          justify="space-between"
        >
          <HStack spacing={2} flex={1} minW={0}>
            <Icon as={getFileIcon(file.type)} color={`${getFileTypeColor(file.type)}.500`} />
            <VStack align="start" spacing={0} flex={1} minW={0}>
              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                {file.name}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {formatFileSize(file.size)}
              </Text>
            </VStack>
          </HStack>
          
          <HStack spacing={1}>
            {showPreview && (
              <IconButton
                aria-label="Vezi preview"
                icon={<FiEye />}
                size="sm"
                variant="ghost"
                onClick={onOpen}
                colorScheme="blue"
              />
            )}
            {onRemove && (
              <IconButton
                aria-label="Șterge fișierul"
                icon={<FiX />}
                size="sm"
                variant="ghost"
                onClick={onRemove}
                colorScheme="red"
              />
            )}
          </HStack>
        </HStack>

        {/* Preview content */}
        {showPreview && (
          <Box p={3}>
            {loading ? (
              <Center h={maxHeight}>
                <Spinner size="md" color="blue.500" />
              </Center>
            ) : error ? (
              <Center h={maxHeight}>
                <VStack spacing={2}>
                  <Icon as={FiFile} size="32px" color="gray.400" />
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    {error}
                  </Text>
                </VStack>
              </Center>
            ) : file.type.startsWith('image/') ? (
              <Box
                maxH={maxHeight}
                maxW={maxWidth}
                borderRadius="md"
                overflow="hidden"
                border="1px solid"
                borderColor={borderColor}
                cursor="pointer"
                onClick={onOpen}
                _hover={{
                  transform: 'scale(1.02)',
                  transition: 'transform 0.2s'
                }}
              >
                <Image
                  src={previewUrl}
                  alt={file.name}
                  w="100%"
                  h="100%"
                  objectFit="cover"
                  maxH={maxHeight}
                />
              </Box>
            ) : file.type === 'application/pdf' ? (
              <Box
                maxH={maxHeight}
                maxW={maxWidth}
                borderRadius="md"
                overflow="hidden"
                border="1px solid"
                borderColor={borderColor}
                cursor="pointer"
                onClick={onOpen}
                _hover={{
                  transform: 'scale(1.02)',
                  transition: 'transform 0.2s'
                }}
              >
                <Document
                  file={previewUrl}
                  loading={
                    <Center h={maxHeight}>
                      <Spinner size="md" color="blue.500" />
                    </Center>
                  }
                >
                  <Page
                    pageNumber={1}
                    scale={0.5}
                    loading={
                      <Center h={maxHeight}>
                        <Spinner size="md" color="blue.500" />
                      </Center>
                    }
                  />
                </Document>
              </Box>
            ) : (
              <Center h={maxHeight}>
                <VStack spacing={2}>
                  <Icon as={getFileIcon(file.type)} size="48px" color="gray.400" />
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    {file.type}
                  </Text>
                  <Badge colorScheme={getFileTypeColor(file.type)} variant="subtle">
                    {file.type.split('/')[1]?.toUpperCase() || 'FIȘIER'}
                  </Badge>
                </VStack>
              </Center>
            )}
          </Box>
        )}
      </Box>

      {/* Modal pentru preview complet */}
      <FullscreenPreview file={file} isOpen={isOpen} onClose={onClose} />
    </>
  );
} 