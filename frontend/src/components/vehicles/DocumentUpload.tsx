import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Icon,
  useColorModeValue,
  Progress,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Image,
  Flex,
  Badge,
  IconButton,
  useToast,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  SimpleGrid,
  Divider,
  Card,
  CardBody,
  CardHeader,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
} from '@chakra-ui/react';
import {
  FiUpload,
  FiFile,
  FiX,
  FiEye,
  FiDownload,
  FiCheck,
  FiAlertCircle,
  FiFileText,
  FiImage,
  FiInfo,
  FiEdit3,
  FiSave,
  FiArrowRight,
  FiArrowLeft,
} from 'react-icons/fi';
import { useState, useRef } from 'react';
import DocumentPreview from '../common/DocumentPreview';

interface DocumentMetadata {
  documentType: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  observations?: string;
}

interface DocumentWithFile extends DocumentMetadata {
  id: string;
  file?: File;
  filePreview?: string;
  uploadProgress: number;
  status: 'draft' | 'uploading' | 'completed' | 'error';
}

interface DocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: number;
  onSuccess: () => void;
}

const documentTypes = [
  { value: 'ITP', label: 'ITP - Inspecție Tehnică Periodică' },
  { value: 'RCA', label: 'RCA - Răspundere Civilă Auto' },
  { value: 'ROVIGNETA', label: 'Rovignetă' },
  { value: 'CASCO', label: 'Asigurare CASCO' },
  { value: 'AUTORIZATIE_TRANSPORT', label: 'Autorizație Transport' },
  { value: 'CERTIFICAT_CONFORMITATE', label: 'Certificat Conformitate' },
  { value: 'FACTURA', label: 'Factură Achiziție' },
  { value: 'CONTRACT_LEASING', label: 'Contract Leasing' },
  { value: 'ALTELE', label: 'Altele' },
];

const issuingAuthorities = {
  ITP: ['RAR Dolj', 'RAR București', 'RAR Cluj', 'RAR Timiș'],
  RCA: ['Allianz Țiriac', 'Generali', 'City Insurance', 'Omniasig', 'Euroins'],
  ROVIGNETA: ['CNAIR'],
  CASCO: ['Allianz Țiriac', 'Generali', 'City Insurance', 'Omniasig'],
  AUTORIZATIE_TRANSPORT: ['ARR Dolj', 'Ministerul Transporturilor'],
  CERTIFICAT_CONFORMITATE: ['Reprezentanță Auto', 'ISCIR'],
  FACTURA: ['Dealer Auto', 'Furnizor'],
  CONTRACT_LEASING: ['BCR Leasing', 'BRD Leasing', 'Raiffeisen Leasing'],
  ALTELE: ['Altă instituție'],
};

const steps = [
  { title: 'Detalii Document', description: 'Completează informațiile' },
  { title: 'Încărcare Fișier', description: 'Adaugă PDF-ul documentului' },
  { title: 'Verificare', description: 'Confirmă și salvează' },
];

export default function DocumentUpload({
  isOpen,
  onClose,
  vehicleId,
  onSuccess,
}: DocumentUploadProps) {
  const [document, setDocument] = useState<DocumentWithFile>({
    id: '',
    documentType: '',
    documentNumber: '',
    issueDate: '',
    expiryDate: '',
    issuingAuthority: '',
    observations: '',
    uploadProgress: 0,
    status: 'draft',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!document.documentType) {
      newErrors.documentType = 'Tipul documentului este obligatoriu';
    }
    if (!document.documentNumber) {
      newErrors.documentNumber = 'Numărul documentului este obligatoriu';
    }
    if (!document.issueDate) {
      newErrors.issueDate = 'Data emiterii este obligatorie';
    }
    if (!document.expiryDate) {
      newErrors.expiryDate = 'Data expirării este obligatorie';
    }
    if (!document.issuingAuthority) {
      newErrors.issuingAuthority = 'Autoritatea emitentă este obligatorie';
    }

    // Validez că data expirării este după data emiterii
    if (document.issueDate && document.expiryDate) {
      if (new Date(document.expiryDate) <= new Date(document.issueDate)) {
        newErrors.expiryDate = 'Data expirării trebuie să fie după data emiterii';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    if (!document.file) {
      toast({
        title: 'Fișier lipsă',
        description: 'Vă rugăm să încărcați un fișier pentru document.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateStep1()) {
      return;
    }
    if (activeStep === 1 && !validateStep2()) {
      return;
    }
    setActiveStep(activeStep + 1);
  };

  const handlePrevious = () => {
    setActiveStep(activeStep - 1);
  };

  const handleInputChange = (field: keyof DocumentMetadata, value: string) => {
    setDocument(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Curăț eroarea pentru câmpul modificat
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Validez tipul și mărimea fișierului
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Tip fișier neacceptat',
        description: 'Acceptăm doar fișiere PDF, JPG, PNG sau GIF.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Fișier prea mare',
        description: 'Fișierul nu poate depăși 10MB.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Creez preview pentru imagini
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setDocument(prev => ({
          ...prev,
          file,
          filePreview: reader.result as string,
          status: 'draft',
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setDocument(prev => ({
        ...prev,
        file,
        status: 'draft',
      }));
    }

    toast({
      title: 'Fișier încărcat',
      description: `Fișierul "${file.name}" a fost încărcat cu succes.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      processFile(file);
    }
  };

  const removeFile = () => {
    setDocument(prev => ({
      ...prev,
      file: undefined,
      filePreview: undefined,
      status: 'draft',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const simulateUpload = () => {
    setDocument(prev => ({ ...prev, status: 'uploading', uploadProgress: 0 }));
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setDocument(prev => ({ ...prev, uploadProgress: 100, status: 'completed' }));
      } else {
        setDocument(prev => ({ ...prev, uploadProgress: progress }));
      }
    }, 200);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!document.file) {
        throw new Error('Fișierul este obligatoriu');
      }

      // Creez documentul folosind API-ul real
      const vehicleService = new (await import('../../services/vehicles/VehicleService')).VehicleService();
      
      const documentData = {
        documentType: document.documentType,
        documentNumber: document.documentNumber,
        issueDate: document.issueDate,
        expiryDate: document.expiryDate,
        issuingAuthority: document.issuingAuthority,
        observations: document.observations || '',
        file: document.file
      };

      console.log('📄 Saving document:', documentData);
      
      // Simulez upload-ul pentru UI
      setDocument(prev => ({ ...prev, status: 'uploading', uploadProgress: 0 }));
      
      // Progress simulation pentru experiența utilizatorului
      const progressInterval = setInterval(() => {
        setDocument(prev => ({
          ...prev,
          uploadProgress: Math.min(prev.uploadProgress + Math.random() * 15, 90)
        }));
      }, 200);

      // Salvez documentul în baza de date
      const savedDocument = await vehicleService.createVehicleDocument(vehicleId, documentData);
      
      // Finalizez progress-ul
      clearInterval(progressInterval);
      setDocument(prev => ({ ...prev, uploadProgress: 100, status: 'completed' }));
      
      // Aștept puțin pentru a arăta progresul complet
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: 'Document salvat cu succes',
        description: `Documentul ${document.documentType} - ${document.documentNumber} a fost salvat în baza de date.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      console.log('✅ Document saved successfully:', savedDocument);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('❌ Error saving document:', error);
      
      setDocument(prev => ({ ...prev, status: 'error', uploadProgress: 0 }));
      
      const errorMessage = error.response?.data?.message || error.message || 'Eroare necunoscută';
      
      toast({
        title: 'Eroare salvare document',
        description: `Nu s-a putut salva documentul: ${errorMessage}`,
        status: 'error',
        duration: 8000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setDocument({
      id: '',
      documentType: '',
      documentNumber: '',
      issueDate: '',
      expiryDate: '',
      issuingAuthority: '',
      observations: '',
      uploadProgress: 0,
      status: 'draft',
    });
    setErrors({});
    setActiveStep(0);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type?.startsWith('image/')) return FiImage;
    if (type === 'application/pdf') return FiFileText;
    return FiFile;
  };

  const getExpiryStatus = () => {
    if (!document.expiryDate) return null;
    
    const expiryDate = new Date(document.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      return { label: 'Expirat', color: 'red', urgent: true };
    } else if (daysUntilExpiry <= 30) {
      return { label: `Expiră în ${daysUntilExpiry} zile`, color: 'orange', urgent: true };
    } else {
      return { label: 'Valid', color: 'green', urgent: false };
    }
  };

  const expiryStatus = getExpiryStatus();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="4xl"
      motionPreset="slideInBottom"
      scrollBehavior="inside"
      closeOnOverlayClick={false}
    >
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent borderRadius="xl" bg={bgColor}>
        <ModalHeader borderBottom="1px solid" borderColor={borderColor}>
          <VStack align="start" spacing={3}>
            <HStack>
              <Icon as={FiEdit3} color="brand.500" />
              <Text>Adăugare Document Nou</Text>
            </HStack>
            
            {/* Stepper */}
            <Box w="full">
              <Stepper index={activeStep} colorScheme="brand" size="sm">
                {steps.map((step, index) => (
                  <Step key={index}>
                    <StepIndicator>
                      <StepStatus
                        complete={<StepIcon />}
                        incomplete={<StepNumber />}
                        active={<StepNumber />}
                      />
                    </StepIndicator>
                    <Box flexShrink="0">
                      <StepTitle>{step.title}</StepTitle>
                      <StepDescription>{step.description}</StepDescription>
                    </Box>
                    <StepSeparator />
                  </Step>
                ))}
              </Stepper>
            </Box>
          </VStack>
        </ModalHeader>

        <ModalBody p={6}>
          {/* Step 1: Detalii Document */}
          {activeStep === 0 && (
            <VStack spacing={6} align="stretch">
              <Alert status="info" borderRadius="lg">
                <AlertIcon />
                <Box>
                  <Text fontSize="sm">
                    Completați toate informațiile despre document înainte de a încărca fișierul.
                  </Text>
                </Box>
              </Alert>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isInvalid={!!errors.documentType} isRequired>
                  <FormLabel>Tip Document</FormLabel>
                  <Select
                    value={document.documentType}
                    onChange={(e) => handleInputChange('documentType', e.target.value)}
                    placeholder="Selectează tipul documentului"
                  >
                    {documentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                  {errors.documentType && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {errors.documentType}
                    </Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.documentNumber} isRequired>
                  <FormLabel>Număr Document</FormLabel>
                  <Input
                    value={document.documentNumber}
                    onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                    placeholder="ex: ITP-2024-001"
                  />
                  {errors.documentNumber && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {errors.documentNumber}
                    </Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.issueDate} isRequired>
                  <FormLabel>Data Emiterii</FormLabel>
                  <Input
                    type="date"
                    value={document.issueDate}
                    onChange={(e) => handleInputChange('issueDate', e.target.value)}
                  />
                  {errors.issueDate && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {errors.issueDate}
                    </Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.expiryDate} isRequired>
                  <FormLabel>Data Expirării</FormLabel>
                  <Input
                    type="date"
                    value={document.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  />
                  {errors.expiryDate && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {errors.expiryDate}
                    </Text>
                  )}
                  {expiryStatus && (
                    <Badge 
                      colorScheme={expiryStatus.color} 
                      variant="subtle"
                      mt={2}
                    >
                      {expiryStatus.label}
                    </Badge>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.issuingAuthority} isRequired>
                  <FormLabel>Autoritate Emitentă</FormLabel>
                  <Select
                    value={document.issuingAuthority}
                    onChange={(e) => handleInputChange('issuingAuthority', e.target.value)}
                    placeholder="Selectează autoritatea"
                  >
                    {document.documentType && 
                     issuingAuthorities[document.documentType as keyof typeof issuingAuthorities]?.map(authority => (
                       <option key={authority} value={authority}>
                         {authority}
                       </option>
                     ))
                    }
                  </Select>
                  {errors.issuingAuthority && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {errors.issuingAuthority}
                    </Text>
                  )}
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Observații (Opțional)</FormLabel>
                <Textarea
                  value={document.observations}
                  onChange={(e) => handleInputChange('observations', e.target.value)}
                  placeholder="Adăugați observații despre document..."
                  rows={3}
                />
              </FormControl>
            </VStack>
          )}

          {/* Step 2: Încărcare Fișier */}
          {activeStep === 1 && (
            <VStack spacing={6} align="stretch">
              {!document.file ? (
                <Box
                  p={8}
                  border="2px dashed"
                  borderColor={borderColor}
                  borderRadius="xl"
                  bg={cardBg}
                  textAlign="center"
                  cursor="pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  _hover={{
                    borderColor: 'brand.400',
                    bg: useColorModeValue('brand.50', 'brand.900'),
                  }}
                  transition="all 0.2s"
                >
                  <VStack spacing={4}>
                    <Icon as={FiUpload} size="48px" color="brand.400" />
                    <VStack spacing={2}>
                      <Text fontSize="lg" fontWeight="semibold">
                        Încarcă documentul {document.documentType}
                      </Text>
                      <Text color={textColor}>
                        Poți trage și lăsa fișierele aici sau faceți clic pentru a selecta.
                      </Text>
                      <Text fontSize="sm" color={textColor}>
                        Acceptăm: PDF, JPG, PNG, GIF (max 10MB)
                      </Text>
                    </VStack>
                    <Button
                      leftIcon={<FiUpload />}
                      colorScheme="brand"
                      size="lg"
                      color="white"
                      bg="brand.500"
                      _hover={{
                        bg: 'brand.600',
                      }}
                      _active={{
                        bg: 'brand.700',
                      }}
                    >
                      Selectează Fișierul
                    </Button>
                  </VStack>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".pdf,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileSelect}
                  />
                </Box>
              ) : (
                <VStack spacing={4} align="stretch">
                  <DocumentPreview
                    file={document.file}
                    onRemove={removeFile}
                    showPreview={true}
                    maxHeight="300px"
                    maxWidth="100%"
                  />
                  
                  <Alert status="success" borderRadius="lg">
                    <AlertIcon />
                    <Text fontSize="sm">
                      Fișierul a fost încărcat cu succes și este gata pentru salvare.
                    </Text>
                  </Alert>
                </VStack>
              )}
            </VStack>
          )}

          {/* Step 3: Verificare */}
          {activeStep === 2 && (
            <VStack spacing={6} align="stretch">
              <Alert status="info" borderRadius="lg">
                <AlertIcon />
                <Box>
                  <Text fontSize="sm">
                    Verificați informațiile înainte de salvare. După salvare, documentul va fi disponibil în lista de documente.
                  </Text>
                </Box>
              </Alert>

              <Card>
                <CardHeader>
                  <Text fontSize="lg" fontWeight="semibold">Rezumat Document</Text>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>Tip Document:</Text>
                      <Text>{documentTypes.find(t => t.value === document.documentType)?.label}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>Număr:</Text>
                      <Text>{document.documentNumber}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>Data Emiterii:</Text>
                      <Text>{new Date(document.issueDate).toLocaleDateString('ro-RO')}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>Data Expirării:</Text>
                      <HStack>
                        <Text>{new Date(document.expiryDate).toLocaleDateString('ro-RO')}</Text>
                        {expiryStatus && (
                          <Badge colorScheme={expiryStatus.color} variant="subtle">
                            {expiryStatus.label}
                          </Badge>
                        )}
                      </HStack>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>Autoritate Emitentă:</Text>
                      <Text>{document.issuingAuthority}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>Fișier:</Text>
                      <HStack>
                        <Icon as={getFileIcon(document.file?.type || '')} color="brand.500" />
                        <Text>{document.file?.name}</Text>
                      </HStack>
                    </Box>
                  </SimpleGrid>
                  
                  {document.observations && (
                    <Box mt={4}>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>Observații:</Text>
                      <Text>{document.observations}</Text>
                    </Box>
                  )}
                </CardBody>
              </Card>

              {document.status === 'uploading' && (
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="sm">Se încarcă documentul...</Text>
                    <Text fontSize="sm">{Math.round(document.uploadProgress)}%</Text>
                  </HStack>
                  <Progress
                    value={document.uploadProgress}
                    colorScheme="brand"
                    borderRadius="full"
                  />
                </Box>
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor} gap={3}>
          <Button 
            variant="ghost" 
            onClick={handleClose}
            color={useColorModeValue('gray.600', 'gray.300')}
            _hover={{
              bg: useColorModeValue('gray.100', 'gray.700'),
              color: useColorModeValue('gray.800', 'gray.100'),
            }}
          >
            Anulează
          </Button>
          
          {activeStep > 0 && (
            <Button
              leftIcon={<FiArrowLeft />}
              onClick={handlePrevious}
              variant="outline"
              color={useColorModeValue('gray.600', 'gray.300')}
              borderColor={useColorModeValue('gray.300', 'gray.600')}
              _hover={{
                bg: useColorModeValue('gray.50', 'gray.700'),
                color: useColorModeValue('gray.800', 'gray.100'),
              }}
            >
              Înapoi
            </Button>
          )}
          
          {activeStep < steps.length - 1 ? (
            <Button
              rightIcon={<FiArrowRight />}
              colorScheme="brand"
              onClick={handleNext}
              color="white"
              bg="brand.500"
              _hover={{
                bg: 'brand.600',
              }}
              _active={{
                bg: 'brand.700',
              }}
            >
              Continuă
            </Button>
          ) : (
            <Button
              leftIcon={<FiSave />}
              colorScheme="brand"
              onClick={handleSave}
              isLoading={saving || document.status === 'uploading'}
              loadingText={document.status === 'uploading' ? 'Se încarcă...' : 'Se salvează...'}
              color="white"
              bg="brand.500"
              _hover={{
                bg: 'brand.600',
              }}
              _active={{
                bg: 'brand.700',
              }}
            >
              Salvează Document
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 