import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Select,
  Input,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Badge,
  IconButton,
  Switch,
  Card,
  CardBody,
  CardHeader,
  Heading,
  useColorModeValue,
  Alert,
  AlertIcon,
  SimpleGrid,
  Tooltip,
  Divider,
  Textarea,
  Checkbox,
  CheckboxGroup,
  Stack,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiBell, FiMail, FiSmartphone, FiPlus, FiEdit2, FiTrash2, FiClock, FiAlertTriangle } from 'react-icons/fi';
import { EventNotification } from '../../types/calendar';

interface EventNotificationsProps {
  eventId: string;
  eventTitle: string;
  eventStart: string;
  notifications: EventNotification[];
  canEdit: boolean;
  onNotificationAdd?: (notification: EventNotification) => void;
  onNotificationUpdate?: (notification: EventNotification) => void;
  onNotificationRemove?: (notificationId: number) => void;
}

const notificationTypeNames = {
  REMINDER: 'Memento',
  ASSIGNMENT: 'Asignare',
  CHANGE: 'Modificare',
  CANCELLATION: 'Anulare',
  APPROVAL_REQUEST: 'Cerere Aprobare'
};

const notificationTypeColors = {
  REMINDER: 'blue',
  ASSIGNMENT: 'green',
  CHANGE: 'orange',
  CANCELLATION: 'red',
  APPROVAL_REQUEST: 'purple'
};

const deliveryMethodNames = {
  EMAIL: 'Email',
  SYSTEM: 'Sistem',
  BOTH: 'Ambele'
};

const statusNames = {
  PENDING: 'În așteptare',
  SENT: 'Trimis',
  FAILED: 'Eșuat',
  CANCELLED: 'Anulat'
};

const statusColors = {
  PENDING: 'yellow',
  SENT: 'green',
  FAILED: 'red',
  CANCELLED: 'gray'
};

// Preset-uri pentru notificări DSP
const dspNotificationPresets = [
  {
    name: 'Memento Inspecție - 24h',
    type: 'REMINDER',
    title: 'Memento: Inspecție programată mâine',
    message: 'Aveți o inspecție programată mâine. Verificați documentele necesare.',
    hoursBeforeEvent: 24,
    deliveryMethod: 'BOTH'
  },
  {
    name: 'Memento Inspecție - 2h',
    type: 'REMINDER',
    title: 'Memento: Inspecție în 2 ore',
    message: 'Inspecția va începe în 2 ore. Pregătiți echipamentele necesare.',
    hoursBeforeEvent: 2,
    deliveryMethod: 'SYSTEM'
  },
  {
    name: 'Raportare Urgentă',
    type: 'REMINDER',
    title: 'URGENT: Raportare către DSP',
    message: 'Termen de raportare aproape expirat. Finalizați și trimiteți raportul.',
    hoursBeforeEvent: 4,
    deliveryMethod: 'BOTH'
  },
  {
    name: 'Ședință Departament',
    type: 'REMINDER',
    title: 'Memento: Ședință departament',
    message: 'Ședința departamentului va începe în curând. Pregătiți materialele.',
    hoursBeforeEvent: 1,
    deliveryMethod: 'SYSTEM'
  }
];

export default function EventNotifications({
  eventId,
  eventTitle,
  eventStart,
  notifications,
  canEdit,
  onNotificationAdd,
  onNotificationUpdate,
  onNotificationRemove
}: EventNotificationsProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedNotification, setSelectedNotification] = useState<EventNotification | null>(null);
  const [formData, setFormData] = useState({
    type: 'REMINDER' as EventNotification['notificationType'],
    title: '',
    message: '',
    hoursBeforeEvent: 24,
    deliveryMethod: 'BOTH' as EventNotification['deliveryMethod'],
    recipients: [] as string[]
  });
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBgColor = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    // Mock users pentru demonstrație
    setAvailableUsers([
      { id: 1, firstName: 'Ion', lastName: 'Popescu', email: 'ion.popescu@dsp.ro' },
      { id: 2, firstName: 'Maria', lastName: 'Ionescu', email: 'maria.ionescu@dsp.ro' },
      { id: 3, firstName: 'Gheorghe', lastName: 'Vasilescu', email: 'gheorghe.vasilescu@dsp.ro' }
    ]);
  }, []);

  const handlePresetSelect = (preset: any) => {
    setFormData({
      type: preset.type,
      title: preset.title,
      message: preset.message,
      hoursBeforeEvent: preset.hoursBeforeEvent,
      deliveryMethod: preset.deliveryMethod,
      recipients: []
    });
  };

  const calculateSendTime = (hoursBeforeEvent: number) => {
    const eventDate = new Date(eventStart);
    const sendTime = new Date(eventDate.getTime() - (hoursBeforeEvent * 60 * 60 * 1000));
    return sendTime.toISOString();
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: 'Date incomplete',
        description: 'Completați titlul și mesajul notificării',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const notificationData: EventNotification = {
        id: selectedNotification?.id || Date.now(),
        eventId: parseInt(eventId),
        userId: 1, // TODO: Get from auth context
        notificationType: formData.type,
        title: formData.title,
        message: formData.message,
        sendTime: calculateSendTime(formData.hoursBeforeEvent),
        isRead: false,
        deliveryMethod: formData.deliveryMethod,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (selectedNotification) {
        onNotificationUpdate?.(notificationData);
        toast({
          title: 'Notificare actualizată! 🔔',
          description: 'Notificarea a fost actualizată cu succes.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        onNotificationAdd?.(notificationData);
        toast({
          title: 'Notificare adăugată! 🔔',
          description: 'Notificarea a fost programată cu succes.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving notification:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut salva notificarea. Încercați din nou.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'REMINDER',
      title: '',
      message: '',
      hoursBeforeEvent: 24,
      deliveryMethod: 'BOTH',
      recipients: []
    });
    setSelectedNotification(null);
  };

  const handleEdit = (notification: EventNotification) => {
    setSelectedNotification(notification);
    setFormData({
      type: notification.notificationType,
      title: notification.title,
      message: notification.message,
      hoursBeforeEvent: Math.round((new Date(eventStart).getTime() - new Date(notification.sendTime).getTime()) / (60 * 60 * 1000)),
      deliveryMethod: notification.deliveryMethod,
      recipients: []
    });
    onOpen();
  };

  const handleDelete = (notificationId: number) => {
    if (window.confirm('Sigur doriți să ștergeți această notificare?')) {
      onNotificationRemove?.(notificationId);
      toast({
        title: 'Notificare ștearsă',
        description: 'Notificarea a fost ștearsă cu succes.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const formatTimeUntilSend = (sendTime: string) => {
    const now = new Date();
    const send = new Date(sendTime);
    const diffMs = send.getTime() - now.getTime();
    
    if (diffMs < 0) {
      return 'Trecut';
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `În ${diffHours}h ${diffMinutes}m`;
    } else {
      return `În ${diffMinutes}m`;
    }
  };

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Heading size="md">Notificări Programate</Heading>
        {canEdit && (
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            size="sm"
            onClick={onOpen}
          >
            Adaugă Notificare
          </Button>
        )}
      </HStack>

      {notifications.length === 0 ? (
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          Nu sunt notificări programate pentru acest eveniment.
        </Alert>
      ) : (
        <VStack spacing={4} align="stretch">
          {notifications.map((notification) => (
            <Card key={notification.id} bg={cardBgColor} size="sm">
              <CardHeader pb={2}>
                <HStack justify="space-between">
                  <HStack spacing={3}>
                    <Badge
                      colorScheme={notificationTypeColors[notification.notificationType]}
                      size="sm"
                    >
                      {notificationTypeNames[notification.notificationType]}
                    </Badge>
                    <Badge
                      colorScheme={statusColors[notification.status]}
                      size="sm"
                      variant="outline"
                    >
                      {statusNames[notification.status]}
                    </Badge>
                  </HStack>
                  <HStack spacing={1}>
                    <Tooltip label={`Trimis prin ${deliveryMethodNames[notification.deliveryMethod]}`}>
                      <Box>
                        {notification.deliveryMethod === 'EMAIL' && <FiMail color="gray" />}
                        {notification.deliveryMethod === 'SYSTEM' && <FiBell color="gray" />}
                        {notification.deliveryMethod === 'BOTH' && (
                          <HStack spacing={1}>
                            <FiMail color="gray" />
                            <FiBell color="gray" />
                          </HStack>
                        )}
                      </Box>
                    </Tooltip>
                    {canEdit && (
                      <>
                        <Tooltip label="Editare">
                          <IconButton
                            icon={<FiEdit2 />}
                            size="xs"
                            variant="ghost"
                            onClick={() => handleEdit(notification)}
                            aria-label="Editare notificare"
                          />
                        </Tooltip>
                        <Tooltip label="Ștergere">
                          <IconButton
                            icon={<FiTrash2 />}
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDelete(notification.id)}
                            aria-label="Ștergere notificare"
                          />
                        </Tooltip>
                      </>
                    )}
                  </HStack>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack align="start" spacing={2}>
                  <Text fontWeight="medium" fontSize="sm">
                    {notification.title}
                  </Text>
                  <Text fontSize="xs" color="gray.600" noOfLines={2}>
                    {notification.message}
                  </Text>
                  <HStack justify="space-between" w="full">
                    <HStack spacing={2}>
                      <FiClock size={12} />
                      <Text fontSize="xs" color="gray.500">
                        {formatTimeUntilSend(notification.sendTime)}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.500">
                      {new Date(notification.sendTime).toLocaleString('ro-RO')}
                    </Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}

      {/* Modal pentru adăugare/editare notificare */}
      <Modal isOpen={isOpen} onClose={() => { resetForm(); onClose(); }} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedNotification ? 'Editare Notificare' : 'Adaugă Notificare Nouă'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              {/* Preset-uri DSP */}
              <FormControl>
                <FormLabel>Preset-uri DSP</FormLabel>
                <SimpleGrid columns={2} spacing={2}>
                  {dspNotificationPresets.map((preset, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      onClick={() => handlePresetSelect(preset)}
                      leftIcon={<FiAlertTriangle />}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </SimpleGrid>
              </FormControl>

              <Divider />

              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Tip Notificare</FormLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  >
                    {Object.entries(notificationTypeNames).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Mod Livrare</FormLabel>
                  <Select
                    value={formData.deliveryMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryMethod: e.target.value as any }))}
                  >
                    {Object.entries(deliveryMethodNames).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired>
                <FormLabel>Titlu Notificare</FormLabel>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Titlul notificării"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Mesaj</FormLabel>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Mesajul notificării"
                  rows={3}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Timp înainte de eveniment (ore)</FormLabel>
                <Input
                  type="number"
                  value={formData.hoursBeforeEvent}
                  onChange={(e) => setFormData(prev => ({ ...prev, hoursBeforeEvent: parseInt(e.target.value) || 0 }))}
                  min={0}
                  max={168}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Notificarea va fi trimisă cu {formData.hoursBeforeEvent} ore înainte de eveniment
                </Text>
              </FormControl>

              <Box w="full">
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Previzualizare timp trimitere:
                </Text>
                <Badge colorScheme="blue" size="lg">
                  {new Date(calculateSendTime(formData.hoursBeforeEvent)).toLocaleString('ro-RO')}
                </Badge>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => { resetForm(); onClose(); }}>
              Anulează
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSave}
              isDisabled={!formData.title.trim() || !formData.message.trim()}
            >
              {selectedNotification ? 'Actualizează' : 'Adaugă'} Notificare
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 