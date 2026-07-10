import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Icon,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Flex,
  IconButton,
  Tooltip,
  useToast,
  Skeleton,
  SkeletonText,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiTrash2,
  FiAlertTriangle,
  FiInfo,
  FiRefreshCw,
  FiInbox,
} from 'react-icons/fi';
import { fetchNotifications, markAsRead, markAllAsRead, deleteNotification, connectNotificationsWS } from '../services/NotificationsService';
import { useAuth } from '../hooks/useAuth';

// Animații simple și elegante
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

interface Notification {
  id: number;
  user_id: number;
  message: string;
  type: string;
  status: 'unread' | 'read';
  created_at: string;
}

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const toast = useToast();

  const itemsPerPage = 10;

  // Culori și teme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const primaryColor = useColorModeValue('blue.500', 'blue.400');
  const successColor = useColorModeValue('green.500', 'green.400');
  const warningColor = useColorModeValue('orange.500', 'orange.400');

  // Funcții pentru notificări
  const loadNotifications = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetchNotifications();
      const filteredNotifications = filter === 'all' 
        ? response 
        : response.filter(n => n.status === filter);
      
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);
      
      setNotifications(paginatedNotifications);
      setTotalPages(Math.ceil(filteredNotifications.length / itemsPerPage));
      setCurrentPage(page);
    } catch (error) {
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca notificările',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, status: 'read' } : n
      ));
      
      // Sincronizare cu navbar
      window.dispatchEvent(new CustomEvent('notificationUpdate', {
        detail: { action: 'markAsRead', notificationId }
      }));
      
      toast({
        title: 'Notificare marcată ca citită',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut marca notificarea ca citită',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
      
      // Sincronizare cu navbar
      window.dispatchEvent(new CustomEvent('notificationUpdate', {
        detail: { action: 'markAllAsRead' }
      }));
      
      toast({
        title: 'Toate notificările marcate ca citite',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut marca toate notificările ca citite',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Sincronizare cu navbar
      window.dispatchEvent(new CustomEvent('notificationUpdate', {
        detail: { action: 'delete', notificationId }
      }));
      
      toast({
        title: 'Notificare ștearsă',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge notificarea',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification({ ...notification, status: 'read' });
    onModalOpen();
    
    if (notification.status === 'unread') {
      handleMarkAsRead(notification.id);
    }
  };
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return FiAlertTriangle;
      case 'assignment':
        return FiCheckCircle;
      case 'event':
        return FiBell;
      default:
        return FiInfo;
    }
  };

  const getNotificationColor = (type: string, status: string) => {
    if (status === 'unread') {
      switch (type) {
        case 'alert':
          return warningColor;
        case 'assignment':
          return successColor;
        case 'event':
          return primaryColor;
        default:
          return primaryColor;
      }
    }
    return mutedTextColor;
  };

  const getNotificationBg = (type: string, status: string) => {
    if (status === 'unread') {
      switch (type) {
        case 'alert':
          return useColorModeValue('orange.50', 'orange.900');
        case 'assignment':
          return useColorModeValue('green.50', 'green.900');
        case 'event':
          return useColorModeValue('blue.50', 'blue.900');
        default:
          return useColorModeValue('blue.50', 'blue.900');
      }
    }
    return useColorModeValue('gray.50', 'gray.700');
  };

  // useEffect(() => {
  //   if (!user) return;
  //   
  //   const ws = connectNotificationsWS(Number(user.id), (notif) => {
  //     setNotifications(prev => [{
  //       id: Date.now(),
  //       user_id: Number(user.id),
  //       message: notif.message || notif.data?.message,
  //       type: notif.data?.type || 'event',
  //       status: 'unread',
  //       created_at: new Date().toISOString(),
  //     }, ...prev.slice(0, itemsPerPage - 1)]);
  //   });
  //
  //   return () => ws.close();
  // }, [user]);

  useEffect(() => {
    const handleNotificationUpdate = (event: CustomEvent) => {
      const { action, notificationId, newNotification } = event.detail;
      
      if (action === 'newNotification' && newNotification) {
        // Adaugă notificarea nouă la începutul listei
        setNotifications(prev => [newNotification, ...prev.slice(0, itemsPerPage - 1)]);
      } else if (action === 'markAsRead') {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, status: 'read' } : n
        ));
      } else if (action === 'markAllAsRead') {
        setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
      } else if (action === 'delete') {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    };

    window.addEventListener('notificationUpdate', handleNotificationUpdate as EventListener);
    return () => {
      window.removeEventListener('notificationUpdate', handleNotificationUpdate as EventListener);
    };
  }, []);

  // Încărcare inițială
  useEffect(() => {
    loadNotifications();
  }, [filter]);

  return (
    <Box bg={bgColor} minH="100vh" py={6}>
      <VStack spacing={6} align="stretch" maxW="4xl" mx="auto">
        {/* Header */}
        <Card bg={cardBg} boxShadow="md" border="1px solid" borderColor={borderColor}>
          <CardBody>
            <Flex align="center" justify="space-between">
              <HStack spacing={4}>
                <Box
                  p={3}
                  bgGradient="linear(to-r, blue.400, purple.500)"
                  borderRadius="full"
                >
                  <Icon as={FiInbox} color="white" boxSize={6} />
                </Box>
                <VStack align="start" spacing={1}>
                  <Heading size="lg" color={textColor}>
                    Inbox Notificări
                  </Heading>
                  <Text color={mutedTextColor}>
                    Gestionează toate notificările tale într-un singur loc
                  </Text>
                </VStack>
              </HStack>
              
              <HStack spacing={3}>
                <Button
                  leftIcon={<FiRefreshCw />}
                  variant="outline"
                  onClick={() => loadNotifications(currentPage)}
                  isLoading={loading}
                >
                  Reîmprospătează
                </Button>
                <Button
                  leftIcon={<FiCheck />}
                  colorScheme="green"
                  onClick={handleMarkAllAsRead}
                  isDisabled={!notifications.some(n => n.status === 'unread')}
                >
                  Marchează toate ca citite
                </Button>
              </HStack>
            </Flex>
          </CardBody>
        </Card>

        {/* Filtre */}
        <Card bg={cardBg} boxShadow="md" border="1px solid" borderColor={borderColor}>
          <CardBody>
            <HStack spacing={4} justify="center">
              <Button
                variant={filter === 'all' ? 'solid' : 'outline'}
                colorScheme="blue"
                leftIcon={<FiInbox />}
                onClick={() => setFilter('all')}
              >
                Toate ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'solid' : 'outline'}
                colorScheme="orange"
                leftIcon={<FiBell />}
                onClick={() => setFilter('unread')}
              >
                Necitite ({notifications.filter(n => n.status === 'unread').length})
              </Button>
              <Button
                variant={filter === 'read' ? 'solid' : 'outline'}
                colorScheme="green"
                leftIcon={<FiCheckCircle />}
                onClick={() => setFilter('read')}
              >
                Citite ({notifications.filter(n => n.status === 'read').length})
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Lista de notificări */}
        <VStack spacing={4} align="stretch">
          {loading ? (
            // Skeleton loading
            Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} bg={cardBg} boxShadow="md" border="1px solid" borderColor={borderColor}>
                <CardBody>
                  <Skeleton height="20px" mb={2} />
                  <SkeletonText noOfLines={2} spacing={2} />
                </CardBody>
              </Card>
            ))
          ) : notifications.length === 0 ? (
            // Empty state
            <Card bg={cardBg} boxShadow="md" border="1px solid" borderColor={borderColor}>
              <CardBody textAlign="center" py={12}>
                <Icon as={FiInbox} boxSize={16} color={mutedTextColor} mb={4} />
                <Heading size="md" color={textColor} mb={2}>
                  Nu ai notificări
                </Heading>
                <Text color={mutedTextColor}>
                  {filter === 'all' 
                    ? 'Nu ai încă nicio notificare. Vor apărea aici când vei primi mesaje noi.'
                    : `Nu ai notificări ${filter === 'unread' ? 'necitite' : 'citite'}.`
                  }
                </Text>
              </CardBody>
            </Card>
          ) : (
            // Notificări
            notifications.map((notification) => (
             <Card
                key={notification.id}
                bg={getNotificationBg(notification.type, notification.status)}
                boxShadow="md"
                border="1px solid"
                borderColor={getNotificationColor(notification.type, notification.status)}
                borderRadius="lg"
                cursor="pointer"
                opacity={notification.status === 'read' ? 0.5 : 1}
                transition="all 0.2s"
                _hover={{
                  transform: 'translateY(-1px)',
                  boxShadow: 'lg',
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardBody p={4}>
                  <Flex align="start" justify="space-between">
                    <HStack spacing={3} flex={1}>
                      <Icon
                        as={getNotificationIcon(notification.type)}
                        boxSize={5}
                        color={getNotificationColor(notification.type, notification.status)}
                      />
                      <VStack align="start" spacing={1} flex={1}>
                        <Text
                          fontSize="sm"
                          fontWeight={notification.status === 'unread' ? 'bold' : 'normal'}
                          color={getNotificationColor(notification.type, notification.status)}
                          noOfLines={2}
                        >
                          {notification.message}
                        </Text>
                        <HStack spacing={2}>
                          <Badge
                            size="sm"
                            colorScheme={notification.status === 'read' ? 'gray' : (notification.type === 'alert' ? 'orange' : notification.type === 'assignment' ? 'green' : 'blue')}
                            variant="subtle"
                          >
                            {notification.type === 'alert' ? 'Alertă' : 
                             notification.type === 'assignment' ? 'Asignare' : 
                             notification.type === 'event' ? 'Eveniment' : notification.type}
                          </Badge>
                          <Text fontSize="xs" color={mutedTextColor}>
                            {new Date(notification.created_at).toLocaleString('ro-RO')}
                          </Text>
                        </HStack>
                      </VStack>
                    </HStack>
                    
                    <HStack spacing={1}>
                      {notification.status === 'unread' && (
                        <Tooltip label="Marchează ca citită">
                          <IconButton
                            icon={<FiCheck />}
                            size="sm"
                            variant="ghost"
                            colorScheme="green"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            aria-label="Marchează ca citită"
                          />
                        </Tooltip>
                      )}
                      <Tooltip label="Șterge">
                        <IconButton
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notification.id);
                          }}
                          aria-label="Șterge notificare"
                        />
                      </Tooltip>
                    </HStack>
                  </Flex>
                </CardBody>
              </Card>
            ))
          )}
        </VStack>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card bg={cardBg} boxShadow="md" border="1px solid" borderColor={borderColor}>
            <CardBody textAlign="center">
              <HStack spacing={2} justify="center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadNotifications(currentPage - 1)}
                  isDisabled={currentPage === 1}
                >
                  Anterior
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    size="sm"
                    variant={currentPage === page ? 'solid' : 'outline'}
                    colorScheme="blue"
                    onClick={() => loadNotifications(page)}
                  >
                    {page}
                  </Button>
                ))}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadNotifications(currentPage + 1)}
                  isDisabled={currentPage === totalPages}
                >
                  Următor
                </Button>
              </HStack>
            </CardBody>
          </Card>
        )}
      </VStack>

      {/* Modal pentru detalii notificare */}
      <Modal isOpen={isModalOpen} onClose={onModalClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Icon as={FiBell} color="green.500" />
              <Text>Detalii Notificare</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedNotification && (
              <VStack align="stretch" spacing={4}>
                <Box 
                  p={4} 
                  bg={selectedNotification.status === 'unread' ? 'green.50' : 'gray.50'} 
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={selectedNotification.status === 'unread' ? 'green.200' : 'gray.200'}
                >
                  <Text fontSize="lg" fontWeight="bold" color={selectedNotification.status === 'unread' ? 'green.800' : 'gray.700'}>
                    {selectedNotification.message}
                  </Text>
                  <Text fontSize="sm" color="gray.500" mt={2}>
                    <strong>Tip:</strong> {selectedNotification.type === 'assignment' ? 'Asignare' : selectedNotification.type === 'unassignment' ? 'Dezasignare' : selectedNotification.type}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    <strong>Data:</strong> {new Date(selectedNotification.created_at).toLocaleString('ro-RO')}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    <strong>Status:</strong> {selectedNotification.status === 'unread' ? 'Necitită' : 'Citită'}
                  </Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onModalClose}>
              Închide
            </Button>
            {selectedNotification?.status === 'unread' && (
              <Button 
                colorScheme="green" 
                onClick={() => {
                  handleMarkAsRead(selectedNotification.id);
                  onModalClose();
                }}
              >
                Marchează ca citită
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default NotificationsPage; 