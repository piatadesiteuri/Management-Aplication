import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Divider,
  Avatar,
  IconButton,
  Textarea,
  Select,
  useColorModeValue,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepDescription,
  StepSeparator,
  useSteps,
  Tooltip,
  Flex,
  Progress,
  Tag,
  TagLabel,
  TagLeftIcon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Spinner,
  useDisclosure
} from '@chakra-ui/react';
import { 
  FiCheck, 
  FiX, 
  FiClock, 
  FiUser, 
  FiCalendar, 
  FiMessageSquare, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiXCircle,
  FiMoreVertical,
  FiEye,
  FiEdit2,
  FiArrowRight,
  FiArrowLeft,
  FiSend,
  FiUserCheck,
  FiShield,
  FiFileText,
  FiTrendingUp
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { DSPPermissionService } from '../../services/DSPPermissionService';
import type { CalendarEvent, EventStatus, UserRole } from '../../types/calendar';

// Tipuri pentru workflow-ul de aprobare
export interface ApprovalStep {
  id: string;
  name: string;
  description: string;
  requiredRole: UserRole;
  order: number;
  isRequired: boolean;
  autoApprove?: boolean;
  timeoutHours?: number;
}

export interface ApprovalRequest {
  id: string;
  eventId: string;
  stepId: string;
  requesterId: number;
  approverId?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'TIMEOUT' | 'CANCELLED';
  requestedAt: string;
  respondedAt?: string;
  comments?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  deadline?: string;
  rejectionReason?: string;
  escalatedTo?: number;
  escalatedAt?: string;
}

export interface ApprovalHistory {
  id: string;
  eventId: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'CANCELLED' | 'TIMEOUT';
  performedBy: number;
  performedAt: string;
  comments?: string;
  fromStatus?: EventStatus;
  toStatus?: EventStatus;
  stepName?: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  };
}

interface EventApprovalWorkflowProps {
  eventId: string;
  eventTitle: string;
  eventType: string;
  eventStatus: EventStatus;
  approvalStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: number;
  approvedAt?: string;
  isOpen: boolean;
  onClose: () => void;
  onApprovalChange?: (newStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED') => void;
}

// Configurație workflow-uri pentru diferite tipuri de evenimente DSP
const DSP_APPROVAL_WORKFLOWS: Record<string, ApprovalStep[]> = {
  INSPECTION: [
    {
      id: 'inspector-review',
      name: 'Verificare Inspector',
      description: 'Verificarea detaliilor inspecției de către inspector responsabil',
      requiredRole: 'INSPECTOR',
      order: 1,
      isRequired: true,
      timeoutHours: 24
    },
    {
      id: 'manager-approval',
      name: 'Aprobare Manager',
      description: 'Aprobare de către managerul de departament',
      requiredRole: 'MANAGER',
      order: 2,
      isRequired: true,
      timeoutHours: 48
    },
    {
      id: 'department-admin-approval',
      name: 'Aprobare Șef Departament',
      description: 'Aprobare finală de către șeful de departament',
      requiredRole: 'DEPARTMENT_ADMIN',
      order: 3,
      isRequired: true,
      timeoutHours: 72
    }
  ],
  HEALTH_EMERGENCY: [
    {
      id: 'immediate-review',
      name: 'Verificare Imediată',
      description: 'Verificare urgentă pentru situații de urgență sanitară',
      requiredRole: 'MANAGER',
      order: 1,
      isRequired: true,
      timeoutHours: 2
    },
    {
      id: 'department-admin-urgent',
      name: 'Aprobare Urgentă',
      description: 'Aprobare urgentă de către șeful de departament',
      requiredRole: 'DEPARTMENT_ADMIN',
      order: 2,
      isRequired: true,
      timeoutHours: 4
    }
  ],
  EPIDEMIOLOGICAL_CONTROL: [
    {
      id: 'epidemiologist-review',
      name: 'Verificare Epidemiolog',
      description: 'Verificarea protocolului epidemiologic',
      requiredRole: 'INSPECTOR',
      order: 1,
      isRequired: true,
      timeoutHours: 12
    },
    {
      id: 'department-admin-epi',
      name: 'Aprobare Epidemiologică',
      description: 'Aprobare pentru controlul epidemiologic',
      requiredRole: 'DEPARTMENT_ADMIN',
      order: 2,
      isRequired: true,
      timeoutHours: 24
    }
  ],
  ADMINISTRATIVE: [
    {
      id: 'manager-admin-review',
      name: 'Verificare Manager',
      description: 'Verificarea activității administrative',
      requiredRole: 'MANAGER',
      order: 1,
      isRequired: false,
      autoApprove: true,
      timeoutHours: 24
    }
  ],
  DEFAULT: [
    {
      id: 'standard-review',
      name: 'Verificare Standard',
      description: 'Verificarea standard pentru evenimente obișnuite',
      requiredRole: 'MANAGER',
      order: 1,
      isRequired: true,
      timeoutHours: 48
    }
  ]
};

const permissionService = DSPPermissionService.getInstance();

const statusColors = {
  DRAFT: 'gray',
  PENDING: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red'
};

const statusIcons = {
  DRAFT: FiFileText,
  PENDING: FiClock,
  APPROVED: FiCheckCircle,
  REJECTED: FiXCircle
};

const requestStatusColors = {
  PENDING: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  TIMEOUT: 'orange',
  CANCELLED: 'gray'
};

const priorityColors = {
  LOW: 'green',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red'
};

export default function EventApprovalWorkflow({
  eventId,
  eventTitle,
  eventType,
  eventStatus,
  approvalStatus,
  approvedBy,
  approvedAt,
  isOpen,
  onClose,
  onApprovalChange
}: EventApprovalWorkflowProps) {
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [selectedAction, setSelectedAction] = useState<'APPROVE' | 'REJECT' | 'ESCALATE' | null>(null);
  const [escalateToUserId, setEscalateToUserId] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [availableApprovers, setAvailableApprovers] = useState<any[]>([]);
  
  const { isOpen: isActionModalOpen, onOpen: onActionModalOpen, onClose: onActionModalClose } = useDisclosure();
  const { user } = useAuth();
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  // Obține workflow-ul pentru tipul de eveniment
  const workflow = DSP_APPROVAL_WORKFLOWS[eventType] || DSP_APPROVAL_WORKFLOWS.DEFAULT;
  
  // Configurare stepper
  const { activeStep, setActiveStep } = useSteps({
    index: currentStep,
    count: workflow.length,
  });

  // Încarcă datele de aprobare
  useEffect(() => {
    if (isOpen && eventId) {
      loadApprovalData();
    }
  }, [isOpen, eventId]);

  const loadApprovalData = async () => {
    try {
      setLoading(true);
      
      // TODO: Implementare API pentru încărcarea datelor de aprobare
      // Pentru moment folosim mock data
      const mockRequests: ApprovalRequest[] = [
        {
          id: '1',
          eventId: eventId,
          stepId: 'inspector-review',
          requesterId: 1,
          approverId: 2,
          status: 'APPROVED',
          requestedAt: new Date(Date.now() - 86400000).toISOString(),
          respondedAt: new Date(Date.now() - 82800000).toISOString(),
          comments: 'Detaliile inspecției sunt complete și corecte.',
          priority: 'MEDIUM'
        },
        {
          id: '2',
          eventId: eventId,
          stepId: 'manager-approval',
          requesterId: 2,
          status: 'PENDING',
          requestedAt: new Date(Date.now() - 3600000).toISOString(),
          priority: 'HIGH',
          deadline: new Date(Date.now() + 172800000).toISOString()
        }
      ];

      const mockHistory: ApprovalHistory[] = [
        {
          id: '1',
          eventId: eventId,
          action: 'SUBMITTED',
          performedBy: 1,
          performedAt: new Date(Date.now() - 86400000).toISOString(),
          fromStatus: 'DRAFT',
          toStatus: 'PENDING',
          stepName: 'Verificare Inspector',
          user: {
            id: 1,
            firstName: 'Ion',
            lastName: 'Popescu',
            email: 'ion.popescu@dsp.dolj.ro',
            role: 'INSPECTOR'
          }
        },
        {
          id: '2',
          eventId: eventId,
          action: 'APPROVED',
          performedBy: 2,
          performedAt: new Date(Date.now() - 82800000).toISOString(),
          comments: 'Detaliile inspecției sunt complete și corecte.',
          stepName: 'Verificare Inspector',
          user: {
            id: 2,
            firstName: 'Maria',
            lastName: 'Ionescu',
            email: 'maria.ionescu@dsp.dolj.ro',
            role: 'INSPECTOR'
          }
        }
      ];

      setApprovalRequests(mockRequests);
      setApprovalHistory(mockHistory);

      // Calculează pasul curent
      const completedSteps = mockRequests.filter(r => r.status === 'APPROVED').length;
      setCurrentStep(completedSteps);
      setActiveStep(completedSteps);

    } catch (error) {
      console.error('Error loading approval data:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca datele de aprobare.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (action: 'APPROVE' | 'REJECT' | 'ESCALATE') => {
    if (!user) return;

    try {
      setActionLoading(true);

      // TODO: Implementare API pentru acțiuni de aprobare
      const actionData = {
        eventId,
        action,
        comments,
        rejectionReason: action === 'REJECT' ? rejectionReason : undefined,
        escalateToUserId: action === 'ESCALATE' ? escalateToUserId : undefined,
        performedBy: user.id
      };

      console.log('Performing approval action:', actionData);

      // Simulare API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Actualizare locală
      if (action === 'APPROVE') {
        const newStep = currentStep + 1;
        setCurrentStep(newStep);
        setActiveStep(newStep);
        
        if (newStep >= workflow.length) {
          onApprovalChange?.('APPROVED');
          toast({
            title: 'Eveniment aprobat! ✅',
            description: 'Evenimentul a fost aprobat cu succes.',
            status: 'success',
            duration: 4000,
            isClosable: true,
          });
        } else {
          toast({
            title: 'Pasul aprobat! ✅',
            description: `Evenimentul a trecut la următorul pas de aprobare.`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
      } else if (action === 'REJECT') {
        onApprovalChange?.('REJECTED');
        toast({
          title: 'Eveniment respins! ❌',
          description: 'Evenimentul a fost respins.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      } else if (action === 'ESCALATE') {
        toast({
          title: 'Eveniment escaladat! ⬆️',
          description: 'Evenimentul a fost escaladat către un superior.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }

      // Reîncarcă datele
      await loadApprovalData();
      
      // Resetare formular
      setComments('');
      setRejectionReason('');
      setEscalateToUserId('');
      setSelectedAction(null);
      onActionModalClose();

    } catch (error) {
      console.error('Error performing approval action:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut efectua acțiunea de aprobare.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const canApproveCurrentStep = () => {
    if (!user || currentStep >= workflow.length) return false;
    
    const currentWorkflowStep = workflow[currentStep];
    const userRole = user.roles[0] as UserRole; // Presupunem primul rol
    
    return permissionService.canPerformAction(userRole, 'APPROVE_EVENT') &&
           (currentWorkflowStep.requiredRole === userRole || 
            ['SUPER_ADMIN', 'DEPARTMENT_ADMIN'].includes(userRole));
  };

  const getCurrentStepInfo = () => {
    if (currentStep >= workflow.length) {
      return { name: 'Complet', description: 'Toate etapele au fost finalizate' };
    }
    return workflow[currentStep];
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'complete';
    if (stepIndex === currentStep) return 'active';
    return 'incomplete';
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} zi${diffDays > 1 ? 'le' : ''} în urmă`;
    } else if (diffHours > 0) {
      return `${diffHours} or${diffHours > 1 ? 'e' : 'ă'} în urmă`;
    } else {
      return 'Acum câteva minute';
    }
  };

  const StatusIcon = statusIcons[approvalStatus];
  const currentStepInfo = getCurrentStepInfo();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent bg={bgColor} maxH="90vh">
        <ModalHeader 
          bgGradient="linear(to-r, blue.500, purple.600)" 
          color="white" 
          borderTopRadius="md"
          py={6}
        >
          <HStack spacing={4}>
            <Box p={2} bg="whiteAlpha.200" borderRadius="md">
              <StatusIcon size="24" />
            </Box>
            <VStack align="start" spacing={1}>
              <Heading size="lg">Workflow Aprobare</Heading>
              <Text fontSize="md" opacity={0.9}>
                {eventTitle}
              </Text>
            </VStack>
            <Badge 
              colorScheme={statusColors[approvalStatus]} 
              fontSize="sm" 
              px={3} 
              py={1} 
              borderRadius="full"
            >
              {approvalStatus}
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="white" />
        
        <ModalBody p={6}>
          {loading ? (
            <VStack spacing={4} py={8}>
              <Spinner size="xl" color="blue.500" />
              <Text>Încărcare workflow aprobare...</Text>
            </VStack>
          ) : (
            <VStack spacing={6} align="stretch">
              {/* Statistici generale */}
              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                <Stat>
                  <StatLabel>Status Aprobare</StatLabel>
                  <StatNumber fontSize="lg">
                    <Badge colorScheme={statusColors[approvalStatus]} fontSize="md">
                      {approvalStatus}
                    </Badge>
                  </StatNumber>
                  <StatHelpText>
                    {approvalStatus === 'APPROVED' && approvedAt && (
                      <>
                        <StatArrow type="increase" />
                        Aprobat {getTimeAgo(approvedAt)}
                      </>
                    )}
                  </StatHelpText>
                </Stat>
                
                <Stat>
                  <StatLabel>Progres</StatLabel>
                  <StatNumber fontSize="lg">
                    {currentStep}/{workflow.length}
                  </StatNumber>
                  <StatHelpText>
                    {Math.round((currentStep / workflow.length) * 100)}% complet
                  </StatHelpText>
                </Stat>
                
                <Stat>
                  <StatLabel>Etapa Curentă</StatLabel>
                  <StatNumber fontSize="sm">
                    {currentStepInfo.name}
                  </StatNumber>
                  <StatHelpText>
                    {currentStepInfo.description}
                  </StatHelpText>
                </Stat>
                
                <Stat>
                  <StatLabel>Cereri Active</StatLabel>
                  <StatNumber fontSize="lg">
                    {approvalRequests.filter(r => r.status === 'PENDING').length}
                  </StatNumber>
                  <StatHelpText>
                    În așteptare
                  </StatHelpText>
                </Stat>
              </SimpleGrid>

              {/* Progres workflow */}
              <Card>
                <CardHeader>
                  <HStack>
                    <FiTrendingUp />
                    <Heading size="md">Progres Workflow</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <Progress 
                      value={(currentStep / workflow.length) * 100} 
                      colorScheme="blue" 
                      size="lg" 
                      borderRadius="md"
                      w="100%"
                    />
                    
                    <Stepper index={activeStep} orientation="vertical" height="200px" gap="0">
                      {workflow.map((step, index) => (
                        <Step key={step.id}>
                          <StepIndicator>
                            <StepStatus
                              complete={<FiCheck />}
                              incomplete={<StepNumber />}
                              active={<FiClock />}
                            />
                          </StepIndicator>

                          <Box flexShrink="0">
                            <StepTitle>{step.name}</StepTitle>
                            <StepDescription>{step.description}</StepDescription>
                            <HStack mt={2} spacing={2}>
                              <Badge size="sm" colorScheme="blue">
                                {step.requiredRole}
                              </Badge>
                              {step.timeoutHours && (
                                <Badge size="sm" colorScheme="orange">
                                  {step.timeoutHours}h
                                </Badge>
                              )}
                              {step.isRequired && (
                                <Badge size="sm" colorScheme="red">
                                  Obligatoriu
                                </Badge>
                              )}
                            </HStack>
                          </Box>

                          <StepSeparator />
                        </Step>
                      ))}
                    </Stepper>
                  </VStack>
                </CardBody>
              </Card>

              {/* Cereri de aprobare active */}
              <Card>
                <CardHeader>
                  <HStack justify="space-between">
                    <HStack>
                      <FiUserCheck />
                      <Heading size="md">Cereri de Aprobare</Heading>
                    </HStack>
                    {canApproveCurrentStep() && (
                      <Button
                        colorScheme="blue"
                        size="sm"
                        leftIcon={<FiSend />}
                        onClick={() => {
                          setSelectedAction('APPROVE');
                          onActionModalOpen();
                        }}
                      >
                        Acționează
                      </Button>
                    )}
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    {approvalRequests.length === 0 ? (
                      <Alert status="info">
                        <AlertIcon />
                        <AlertTitle>Nicio cerere de aprobare!</AlertTitle>
                        <AlertDescription>
                          Nu există cereri de aprobare pentru acest eveniment.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      approvalRequests.map((request) => (
                        <Card key={request.id} bg={cardBg} border="1px" borderColor={borderColor}>
                          <CardBody>
                            <HStack justify="space-between" align="start">
                              <VStack align="start" spacing={2}>
                                <HStack>
                                  <Badge 
                                    colorScheme={requestStatusColors[request.status]}
                                    fontSize="sm"
                                  >
                                    {request.status}
                                  </Badge>
                                  <Badge 
                                    colorScheme={priorityColors[request.priority]}
                                    fontSize="sm"
                                  >
                                    {request.priority}
                                  </Badge>
                                  <Text fontSize="sm" color={mutedColor}>
                                    {workflow.find(s => s.id === request.stepId)?.name}
                                  </Text>
                                </HStack>
                                
                                <Text fontSize="sm">
                                  <strong>Cerut:</strong> {formatDateTime(request.requestedAt)}
                                </Text>
                                
                                {request.respondedAt && (
                                  <Text fontSize="sm">
                                    <strong>Răspuns:</strong> {formatDateTime(request.respondedAt)}
                                  </Text>
                                )}
                                
                                {request.deadline && (
                                  <Text fontSize="sm" color="orange.500">
                                    <strong>Deadline:</strong> {formatDateTime(request.deadline)}
                                  </Text>
                                )}
                                
                                {request.comments && (
                                  <Text fontSize="sm" fontStyle="italic">
                                    "{request.comments}"
                                  </Text>
                                )}
                              </VStack>
                              
                              <Menu>
                                <MenuButton
                                  as={IconButton}
                                  icon={<FiMoreVertical />}
                                  size="sm"
                                  variant="ghost"
                                />
                                <MenuList>
                                  <MenuItem icon={<FiEye />}>
                                    Vizualizează detalii
                                  </MenuItem>
                                  {canApproveCurrentStep() && request.status === 'PENDING' && (
                                    <>
                                      <MenuDivider />
                                      <MenuItem 
                                        icon={<FiCheck />} 
                                        color="green.500"
                                        onClick={() => {
                                          setSelectedAction('APPROVE');
                                          onActionModalOpen();
                                        }}
                                      >
                                        Aprobă
                                      </MenuItem>
                                      <MenuItem 
                                        icon={<FiX />} 
                                        color="red.500"
                                        onClick={() => {
                                          setSelectedAction('REJECT');
                                          onActionModalOpen();
                                        }}
                                      >
                                        Respinge
                                      </MenuItem>
                                      <MenuItem 
                                        icon={<FiArrowRight />} 
                                        color="blue.500"
                                        onClick={() => {
                                          setSelectedAction('ESCALATE');
                                          onActionModalOpen();
                                        }}
                                      >
                                        Escalează
                                      </MenuItem>
                                    </>
                                  )}
                                </MenuList>
                              </Menu>
                            </HStack>
                          </CardBody>
                        </Card>
                      ))
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {/* Istoric aprobare */}
              <Card>
                <CardHeader>
                  <HStack>
                    <FiClock />
                    <Heading size="md">Istoric Aprobare</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    {approvalHistory.length === 0 ? (
                      <Alert status="info">
                        <AlertIcon />
                        <AlertTitle>Niciun istoric!</AlertTitle>
                        <AlertDescription>
                          Nu există istoric de aprobare pentru acest eveniment.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      approvalHistory.map((historyItem, index) => (
                        <HStack key={historyItem.id} spacing={4} align="start">
                          <Avatar 
                            size="sm" 
                            name={`${historyItem.user?.firstName} ${historyItem.user?.lastName}`}
                          />
                          <VStack align="start" spacing={1} flex={1}>
                            <HStack>
                              <Text fontWeight="bold">
                                {historyItem.user?.firstName} {historyItem.user?.lastName}
                              </Text>
                              <Badge size="sm" colorScheme="gray">
                                {historyItem.user?.role}
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color={mutedColor}>
                              {historyItem.action} - {formatDateTime(historyItem.performedAt)}
                            </Text>
                            {historyItem.stepName && (
                              <Text fontSize="sm">
                                <strong>Etapa:</strong> {historyItem.stepName}
                              </Text>
                            )}
                            {historyItem.comments && (
                              <Text fontSize="sm" fontStyle="italic">
                                "{historyItem.comments}"
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                      ))
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Închide
          </Button>
        </ModalFooter>
      </ModalContent>

      {/* Modal pentru acțiuni de aprobare */}
      <Modal isOpen={isActionModalOpen} onClose={onActionModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedAction === 'APPROVE' && 'Aprobă Eveniment'}
            {selectedAction === 'REJECT' && 'Respinge Eveniment'}
            {selectedAction === 'ESCALATE' && 'Escalează Eveniment'}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4}>
              {selectedAction === 'REJECT' && (
                <FormControl isRequired>
                  <FormLabel>Motiv respingere</FormLabel>
                  <Select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Selectează motivul respingerii"
                  >
                    <option value="INCOMPLETE_DOCUMENTATION">Documentație incompletă</option>
                    <option value="INVALID_PROCEDURE">Procedură invalidă</option>
                    <option value="MISSING_APPROVALS">Aprobări lipsă</option>
                    <option value="POLICY_VIOLATION">Încălcare politică</option>
                    <option value="RESOURCE_UNAVAILABLE">Resurse indisponibile</option>
                    <option value="OTHER">Altele</option>
                  </Select>
                </FormControl>
              )}
              
              {selectedAction === 'ESCALATE' && (
                <FormControl isRequired>
                  <FormLabel>Escalează către</FormLabel>
                  <Select
                    value={escalateToUserId}
                    onChange={(e) => setEscalateToUserId(e.target.value)}
                    placeholder="Selectează utilizatorul"
                  >
                    <option value="1">Dr. Maria Popescu - Șef Departament</option>
                    <option value="2">Dr. Ion Ionescu - Director Adjunct</option>
                    <option value="3">Dr. Ana Georgescu - Director</option>
                  </Select>
                </FormControl>
              )}
              
              <FormControl>
                <FormLabel>Comentarii</FormLabel>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Adaugă comentarii despre decizia ta..."
                  rows={4}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onActionModalClose}>
              Anulează
            </Button>
            <Button
              colorScheme={selectedAction === 'APPROVE' ? 'green' : selectedAction === 'REJECT' ? 'red' : 'blue'}
              onClick={() => handleApprovalAction(selectedAction!)}
              isLoading={actionLoading}
              loadingText="Procesare..."
            >
              {selectedAction === 'APPROVE' && 'Aprobă'}
              {selectedAction === 'REJECT' && 'Respinge'}
              {selectedAction === 'ESCALATE' && 'Escalează'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Modal>
  );
} 