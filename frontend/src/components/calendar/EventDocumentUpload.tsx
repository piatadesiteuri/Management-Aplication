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
  IconButton,
  useToast,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
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
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUpload,
  FiX,
  FiSave,
  FiArrowRight,
  FiArrowLeft,
} from 'react-icons/fi';
import { useState, useRef } from 'react';
import { CalendarService } from '../../services/CalendarService';
import DocumentPreview from '../common/DocumentPreview';

interface DocumentMetadata {
  title: string;
  description?: string;
}

interface DocumentWithFile extends DocumentMetadata {
  id: string;
  file?: File;
  filePreview?: string;
  uploadProgress: number;
  status: 'draft' | 'uploading' | 'completed' | 'error';
  documentType: string;
}

interface EventDocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onSuccess: () => void;
}

const documentTypes = [
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'FACTURA', label: 'Factură' },
  { value: 'AVIZ_TEHNIC', label: 'Aviz Tehnic' },
  { value: 'CERTIFICAT', label: 'Certificat' },
  { value: 'RAPORT', label: 'Raport' },
  { value: 'PROTOCOL', label: 'Protocol' },
  { value: 'AUTORIZATIE', label: 'Autorizație' },
  { value: 'DECIZIE', label: 'Decizie' },
  { value: 'NOTA_VERBALA', label: 'Notă Verbală' },
  { value: 'ALTELE', label: 'Altele' },
];

const steps = [
  { title: '📝 Detalii Document', description: 'Completează informațiile' },
  { title: '📁 Încărcare Fișier', description: 'Adaugă documentul' },
  { title: '✅ Verificare', description: 'Confirmă și salvează' },
];

const MotionBox = motion(Box);

export default function EventDocumentUpload({
  isOpen,
  onClose,
  eventId,
  onSuccess,
}: EventDocumentUploadProps) {
  const [document, setDocument] = useState<DocumentWithFile>({
    id: '',
    title: '',
    description: '',
    uploadProgress: 0,
    status: 'draft',
    documentType: 'ALTELE',
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
    if (!document.title) {
      newErrors.title = 'Titlul documentului este obligatoriu';
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

  const handleInputChange = (field: keyof DocumentMetadata | 'documentType', value: string) => {
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
    const allowedTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'image/gif',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint', // .ppt
      'text/plain', // .txt
      'application/rtf', // .rtf
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Tip fișier neacceptat',
        description: 'Acceptăm doar fișiere PDF, JPG, PNG, GIF, Word (.doc/.docx), Excel (.xls/.xlsx), PowerPoint (.ppt/.pptx), TXT sau RTF.',
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

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!document.file) {
        throw new Error('Fișierul este obligatoriu');
      }

      console.log('📄 Saving event document:', {
        eventId,
        title: document.title,
        description: document.description,
        fileName: document.file.name,
        file: document.file,
        fileType: document.file.type,
        fileSize: document.file.size
      });
      
      // Simulez upload-ul pentru UI
      setDocument(prev => ({ ...prev, status: 'uploading', uploadProgress: 0 }));
      
      // Progress simulation pentru experiența utilizatorului
      const progressInterval = setInterval(() => {
        setDocument(prev => ({
          ...prev,
          uploadProgress: Math.min(prev.uploadProgress + Math.random() * 15, 90)
        }));
      }, 200);

      // Creez FormData pentru upload
      const formData = new FormData();
      formData.append('file', document.file);
      formData.append('documentType', document.documentType || 'ALTELE');
      formData.append('title', document.title);
      if (document.description) {
        formData.append('description', document.description);
      }

      // DEBUG: Loghez conținutul FormData
      for (let pair of formData.entries()) {
        console.log('🟢 [FormData]', pair[0], pair[1]);
      }

      // Salvez documentul folosind CalendarService
      const calendarService = new CalendarService();
      const savedDocument = await calendarService.createEventDocument(eventId, formData);
      
      // Finalizez progress-ul
      clearInterval(progressInterval);
      setDocument(prev => ({ ...prev, uploadProgress: 100, status: 'completed' }));
      
      // Aștept puțin pentru a arăta progresul complet
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: 'Document salvat cu succes',
        description: `Documentul ${document.title} a fost salvat în baza de date.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      console.log('✅ Event document saved successfully:', savedDocument);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('❌ Error saving event document:', error);
      
      setDocument(prev => ({ ...prev, status: 'error' }));
      
      toast({
        title: 'Eroare la salvarea documentului',
        description: error.response?.data?.message || error.message || 'A apărut o eroare neașteptată',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setDocument({
      id: '',
      title: '',
      description: '',
      uploadProgress: 0,
      status: 'draft',
      documentType: 'ALTELE',
    });
    setErrors({});
    setActiveStep(0);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent bg={bgColor} borderRadius="xl" overflow="hidden" maxH="90vh">
        <ModalHeader 
          bgGradient="linear(135deg, teal.500, teal.600)" 
          color="white" 
          borderRadius="xl"
          position="relative"
          overflow="hidden"
          py={6}
        >
          <Box
            position="absolute"
            top="-50%"
            right="-50%"
            width="200%"
            height="200%"
            bg="whiteAlpha.100"
            borderRadius="full"
            animation="pulse 3s infinite"
          />
          <HStack justify="space-between" position="relative" zIndex={1}>
            <VStack align="start" spacing={2}>
              <Text fontSize="xl" fontWeight="bold">
                📄 Adaugă Document Eveniment
              </Text>
              <Text fontSize="md" opacity={0.9}>
                Eveniment #{eventId}
              </Text>
            </VStack>
            <IconButton
              aria-label="Close"
              icon={<FiX />}
              onClick={handleClose}
              variant="ghost"
              color="white"
              size="lg"
              _hover={{ bg: 'whiteAlpha.200' }}
              _active={{
                transform: 'scale(0.95)',
              }}
              transition="all 0.2s"
            />
          </HStack>
        </ModalHeader>

        <ModalBody p={8}>
          <AnimatePresence mode="wait">
            <>
              {/* Stepper */}
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                mb={8}
              >
                <Stepper index={activeStep} size="lg">
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
                        <StepTitle fontSize="md">{step.title}</StepTitle>
                        <StepDescription fontSize="sm">{step.description}</StepDescription>
                      </Box>
                      <StepSeparator />
                    </Step>
                  ))}
                </Stepper>
              </MotionBox>

              {/* Step 1: Detalii document - adaug select pentru tip document */}
              {activeStep === 0 && (
                <VStack align="stretch" spacing={6} mt={4}>
                  <FormControl isRequired isInvalid={!!errors.documentType}>
                    <FormLabel>Tip Document</FormLabel>
                    <Select
                      placeholder="Selectează tipul documentului"
                      value={document.documentType}
                      onChange={e => handleInputChange('documentType', e.target.value)}
                      bg="gray.100"
                      _dark={{ bg: 'gray.700' }}
                    >
                      {documentTypes.map(dt => (
                        <option key={dt.value} value={dt.value}>{dt.label}</option>
                      ))}
                    </Select>
                    {errors.documentType && <Text color="red.400" fontSize="sm">{errors.documentType}</Text>}
                  </FormControl>
                  <FormControl isRequired isInvalid={!!errors.title}>
                    <FormLabel>Titlu</FormLabel>
                    <Input
                      value={document.title}
                      onChange={e => handleInputChange('title', e.target.value)}
                      placeholder="Titlul documentului"
                      bg="gray.100"
                      _dark={{ bg: 'gray.700' }}
                    />
                    {errors.title && <Text color="red.400" fontSize="sm">{errors.title}</Text>}
                  </FormControl>
                  <FormControl>
                    <FormLabel>Descriere</FormLabel>
                    <Textarea
                      value={document.description}
                      onChange={e => handleInputChange('description', e.target.value)}
                      placeholder="Descriere opțională"
                      bg="gray.100"
                      _dark={{ bg: 'gray.700' }}
                    />
                  </FormControl>
                </VStack>
              )}

              {/* Step 2: Încărcare Fișier */}
              {activeStep === 1 && (
                <MotionBox
                  key="step2"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                >
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
                          borderColor: 'teal.400',
                          bg: useColorModeValue('teal.50', 'teal.900'),
                        }}
                        transition="all 0.2s"
                      >
                        <VStack spacing={4}>
                          <Icon as={FiUpload} size="48px" color="teal.400" />
                          <VStack spacing={2}>
                            <Text fontSize="lg" fontWeight="semibold">
                               Încarcă documentul
                            </Text>
                            <Text color={textColor}>
                              Poți trage și lăsa fișierele aici sau faceți clic pentru a selecta.
                            </Text>
                            <Text fontSize="sm" color={textColor}>
                              Acceptăm: PDF, JPG, PNG, GIF, Word (.doc/.docx), Excel (.xls/.xlsx), PowerPoint (.ppt/.pptx), TXT, RTF (max 10MB)
                            </Text>
                          </VStack>
                          <Button
                            leftIcon={<FiUpload />}
                            colorScheme="teal"
                            size="lg"
                            color="white"
                            bg="teal.500"
                            _hover={{ bg: 'teal.600' }}
                            _active={{ bg: 'teal.700' }}
                          >
                            Selectează Fișierul
                          </Button>
                        </VStack>
                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf"
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

                        {document.status === 'uploading' && (
                          <Box>
                            <Text fontSize="sm" mb={2}>
                              Se încarcă... {Math.round(document.uploadProgress)}%
                            </Text>
                            <Progress
                              value={document.uploadProgress}
                              colorScheme="teal"
                              borderRadius="full"
                            />
                          </Box>
                        )}

                        {document.status === 'completed' && (
                          <Alert status="success" borderRadius="md">
                            <AlertIcon />
                            <Text>Fișier încărcat cu succes!</Text>
                          </Alert>
                        )}

                        {document.status === 'error' && (
                          <Alert status="error" borderRadius="md">
                            <AlertIcon />
                            <Text>Eroare la încărcarea fișierului</Text>
                          </Alert>
                        )}
                      </VStack>
                    )}
                  </VStack>
                </MotionBox>
              )}

              {/* Step 3: Verificare */}
              {activeStep === 2 && (
                <MotionBox
                  key="step3"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                >
                  <VStack spacing={6} align="stretch">
                    <Alert status="info" borderRadius="lg" bg="green.50" border="1px solid" borderColor="green.200" p={4}>
                      <AlertIcon color="green.500" boxSize={5} />
                      <Text color="green.700" fontSize="md" fontWeight="medium">✅ Verifică informațiile înainte de a salva documentul.</Text>
                    </Alert>

                    <Card>
                      <CardHeader>
                        <Text fontWeight="bold" fontSize="lg">📋 Detalii Document</Text>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={4} align="stretch">
                          <HStack justify="space-between">
                            <Text fontWeight="semibold" fontSize="md">Titlu:</Text>
                            <Text fontSize="md">{document.title}</Text>
                          </HStack>
                          {document.description && (
                            <HStack justify="space-between" align="start">
                              <Text fontWeight="semibold" fontSize="md">Descriere:</Text>
                              <Text fontSize="md" maxW="60%">{document.description}</Text>
                            </HStack>
                          )}
                          <HStack justify="space-between">
                            <Text fontWeight="semibold" fontSize="md">Fișier:</Text>
                            <Text fontSize="md">{document.file?.name}</Text>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  </VStack>
                </MotionBox>
              )}
            </>
          </AnimatePresence>
        </ModalBody>

        <ModalFooter bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="xl">
          <HStack spacing={3}>
            {activeStep > 0 && (
              <Button
                leftIcon={<FiArrowLeft />}
                onClick={handlePrevious}
                variant="outline"
                colorScheme="teal"
              >
                Înapoi
              </Button>
            )}
            
            {activeStep < steps.length - 1 ? (
              <Button
                rightIcon={<FiArrowRight />}
                onClick={handleNext}
                colorScheme="teal"
                color="white"
                bg="teal.500"
                _hover={{ bg: 'teal.600' }}
              >
                Următorul
              </Button>
            ) : (
              <Button
                leftIcon={<FiSave />}
                onClick={handleSave}
                colorScheme="teal"
                color="white"
                bg="teal.500"
                _hover={{ bg: 'teal.600' }}
                isLoading={saving}
                loadingText="Se salvează..."
              >
                Salvează Documentul
              </Button>
            )}
            
            <Button onClick={handleClose} variant="ghost">
              Anulează
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 