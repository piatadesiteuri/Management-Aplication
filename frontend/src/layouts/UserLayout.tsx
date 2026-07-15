import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Icon,
  useColorModeValue,
  IconButton,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  Button,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Divider,
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import {
  FiMenu,
  FiHome,
  FiCalendar,
  FiList,
  FiFileText,
  FiBarChart,
  FiUser,
  FiSettings,
  FiLogOut,
  FiChevronDown,
  FiBell,
  FiSearch,
  FiPackage,
  FiUsers,
  FiDatabase,
  FiActivity,
  FiShield,
  FiDroplet,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchNotifications, fetchInternalNotesInboxCount, markAllAsRead, markAsRead, connectNotificationsWS, Notification } from '../services/NotificationsService';
import { ActivityLog, ActivityLogService } from '../services/ActivityLogService';
import { StockService } from '../services/StockService';
import { NavIconBadge } from '../components/common/NavIconBadge';
import { resolveNotificationPath, resolveNotificationEventId } from '../utils/notificationNavigation';

interface UserLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  icon: React.ElementType;
  path: string;
  badge?: string;
  requiredPermissions?: string[];
}

export default function UserLayout({ children }: UserLayoutProps) {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newNotesCount, setNewNotesCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [materialRequestDetails, setMaterialRequestDetails] = useState<any>(null);
  const [loadingRequestDetails, setLoadingRequestDetails] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const sidebarBg = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeBg = useColorModeValue('teal.50', 'teal.900');
  const headerBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)');
  
  // Additional color values to avoid calling useColorModeValue inside render functions
  const gray100 = useColorModeValue('gray.100', 'gray.700');
  const gray50 = useColorModeValue('gray.50', 'gray.700');
  const gray200 = useColorModeValue('gray.200', 'gray.600');
  const gray500 = useColorModeValue('gray.500', 'gray.400');
  const gray600 = useColorModeValue('gray.600', 'gray.300');
  const gray700 = useColorModeValue('gray.700', 'gray.300');
  const gray800 = useColorModeValue('gray.800', 'white');
  const white = useColorModeValue('white', 'gray.800');
  const teal500 = useColorModeValue('teal.500', 'teal.400');
  const orange50 = useColorModeValue('orange.50', 'orange.900');
  const orange100 = useColorModeValue('orange.100', 'orange.800');
  const orange300 = useColorModeValue('orange.300', 'orange.600');
  const orange800 = useColorModeValue('orange.800', 'orange.200');
  const green50 = useColorModeValue('green.50', 'green.900');
  const green100 = useColorModeValue('green.100', 'green.800');
  const green200 = useColorModeValue('green.200', 'green.600');
  const green800 = useColorModeValue('green.800', 'green.200');
  const red50 = useColorModeValue('red.50', 'red.900');

  const getRoleDisplayName = (roles: string[]) => {
    if (roles.includes('BUDGET_OFFICER')) return 'Bugetar';
    if (roles.includes('INSPECTOR')) return 'Inspector DSP';
    if (roles.includes('OPERATOR')) return 'Operator';
    if (roles.includes('MANAGER')) return 'Manager';
    if (roles.includes('DEPARTMENT_ADMIN')) return 'Administrator Departament';
    if (roles.includes('WAREHOUSE_KEEPER')) return 'Magazioner';
    return 'Utilizator';
  };

  const navItems: NavItem[] = [
    { name: 'Dashboard', icon: FiHome, path: '/user/dashboard', requiredPermissions: ['dashboard.view'] },
    { name: 'Calendar', icon: FiCalendar, path: '/user/calendar', requiredPermissions: ['calendar.view'] },
    { name: 'Note interne', icon: FiList, path: '/user/tasks', requiredPermissions: ['tasks.view'] },
    { name: 'Documente', icon: FiFileText, path: '/user/documents', requiredPermissions: ['documents.view'] },
    { name: 'Portal pacienți', icon: FiUser, path: '/user/portal', requiredPermissions: ['patient_portal.view'] },
    { name: 'Rapoarte', icon: FiBarChart, path: '/user/reports', requiredPermissions: ['reports.view'] },
    { name: 'Buget', icon: FiBarChart, path: '/user/budget', requiredPermissions: ['budget.view'] },
    { name: 'Trasabilitate', icon: FiShield, path: '/user/traceability', requiredPermissions: ['traceability.view'] },
    { name: 'Laborator', icon: FiDroplet, path: '/user/lims', requiredPermissions: ['lims.view'] },
    { name: 'Audit Stoc', icon: FiFileText, path: '/user/stock-audit', requiredPermissions: ['stock_audit.view'] },
    { name: 'Furnizori', icon: FiUsers, path: '/user/supply/suppliers', requiredPermissions: ['supply.view'] },
    { name: 'Produse', icon: FiPackage, path: '/user/supply/products', requiredPermissions: ['supply.view'] },
    { name: 'Stoc', icon: FiDatabase, path: '/user/supply/inventory', requiredPermissions: ['supply.view'] },
    { name: 'Farmacie', icon: FiPackage, path: '/user/pharmacy', requiredPermissions: ['pharmacy.view'] },
    { name: 'Profil', icon: FiUser, path: '/user/profile', requiredPermissions: ['profile.view'] },
  ].filter((item) =>
    !item.requiredPermissions || item.requiredPermissions.some((permission) => hasPermission(permission))
  );

  const displayedNavItems = navItems.map((item) =>
    item.name === 'Note interne' && newNotesCount > 0
      ? { ...item, badge: String(newNotesCount > 9 ? '9+' : newNotesCount) }
      : item
  );

  // Fetch inițial + WebSocket
  useEffect(() => {
    if (!user?.id) return;

    const refreshInboxCount = () => {
      if (!hasPermission('tasks.view')) return;
      fetchInternalNotesInboxCount().then(setNewNotesCount);
    };

    fetchNotifications().then(setNotifications);
    refreshInboxCount();

    const handleInboxUpdate = () => refreshInboxCount();
    window.addEventListener('internalNoteUpdate', handleInboxUpdate);

    wsRef.current = connectNotificationsWS(Number(user.id), (notif) => {
      // Validare completă pentru notificare
      if (!notif || typeof notif !== 'object') {
        console.warn('🚫 UserLayout: Invalid notification object received:', notif);
        return;
      }
      
      if (!notif.message || typeof notif.message !== 'string' || notif.message.trim() === "") {
        console.warn('🚫 UserLayout: Empty or invalid notification message:', notif);
        return;
      }
      
      if (!notif.type || typeof notif.type !== 'string') {
        console.warn('🚫 UserLayout: Invalid notification type:', notif);
        return;
      }
      
      const newNotification = {
        id: Date.now(),
        user_id: Number(user.id),
        message: notif.message.trim(),
        type: notif.type,
        status: 'unread' as 'unread' | 'read',
        created_at: new Date().toISOString(),
        // Păstrează datele suplimentare pentru cererile de materiale
        ...(notif.type === 'MATERIAL_REQUEST' && {
          product_name: notif.product_name,
          quantity_requested: notif.quantity_requested,
          product_unit: notif.product_unit,
          requester_name: notif.requester_name,
          priority: notif.priority,
          reason: notif.reason,
          request_id: notif.request_id
        }),
        ...(notif.type === 'INTERNAL_NOTE' && { task_id: notif.task_id }),
      };
      
      // Adaugă la UserLayout
      setNotifications((prev) => [newNotification, ...prev]);

      if (notif.type === 'INTERNAL_NOTE') {
        window.dispatchEvent(new CustomEvent('internalNoteUpdate'));
      }
      
      // Trimite către NotificationsPage
      window.dispatchEvent(new CustomEvent('notificationUpdate', {
        detail: { action: 'newNotification', newNotification }
      }));
    });
    return () => {
      window.removeEventListener('internalNoteUpdate', handleInboxUpdate);
      const socket = wsRef.current;
      wsRef.current = null;
      if (!socket) return;

      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;

      if (socket.readyState === WebSocket.OPEN) {
        socket.close(1000, 'cleanup');
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (location.pathname.endsWith('/tasks')) {
      fetchInternalNotesInboxCount().then(setNewNotesCount);
    }
  }, [location.pathname]);

  // Sincronizare cu NotificationsPage
  useEffect(() => {
    const handleNotificationUpdate = (event: CustomEvent) => {
      const { action, notificationId } = event.detail;
      if (action === 'markAsRead') {
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

  // Încarcă logurile de activitate când se deschide modalul
  useEffect(() => {
    if (isModalOpen && selectedNotification) {
      if (selectedNotification.type === 'MATERIAL_REQUEST' || selectedNotification.type === 'MATERIAL_REQUEST_UPDATE') {
        setActivityLogs([]);
        return;
      }
      loadSpecificNotificationLogs(selectedNotification);
    }
  }, [isModalOpen, selectedNotification]);

  // Încarcă detaliile cererii de materiale când se deschide modalul pentru MATERIAL_REQUEST
  useEffect(() => {
    if (isModalOpen && selectedNotification && selectedNotification.type === 'MATERIAL_REQUEST') {
      const fetchRequestDetails = async () => {
        setLoadingRequestDetails(true);
        try {
          const requestId = (selectedNotification as any).request_id;
          console.log('🔍 Fetching material request details for notification:', selectedNotification);
          console.log('🔍 Request ID from notification:', requestId);
          
          if (requestId) {
            console.log('🔍 Making API call to fetch material request details...');
            const response = await StockService.getMaterialRequestById(requestId);
            console.log('✅ Material request details fetched:', response.data);
            setMaterialRequestDetails(response.data);
          } else {
            console.warn('⚠️ No request_id found in notification, trying to extract from message');
            // Încearcă să extragi request_id din mesaj
            const message = selectedNotification.message;
            const match = message.match(/MR-\d{4}-\d{6}/);
            if (match) {
              console.log('🔍 Found request number in message:', match[0]);
              // Pentru moment, nu putem face fetch doar cu numărul cererii
              // Trebuie să avem request_id-ul real
              setMaterialRequestDetails(null);
            } else {
              console.warn('⚠️ Could not extract request information from notification');
              setMaterialRequestDetails(null);
            }
          }
        } catch (error) {
          console.error('❌ Error fetching material request details:', error);
          setMaterialRequestDetails(null);
        } finally {
          setLoadingRequestDetails(false);
        }
      };
      fetchRequestDetails();
    } else {
      setMaterialRequestDetails(null);
    }
  }, [isModalOpen, selectedNotification]);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications(n => n.map(notif => ({ ...notif, status: 'read' })));
    
    // Sincronizare cu NotificationsPage
    window.dispatchEvent(new CustomEvent('notificationUpdate', {
      detail: { action: 'markAllAsRead' }
    }));
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead(notificationId);
      setNotifications(n => n.map(notif => 
        notif.id === notificationId ? { ...notif, status: 'read' } : notif
      ));
      
      // Sincronizare cu NotificationsPage
      window.dispatchEvent(new CustomEvent('notificationUpdate', {
        detail: { action: 'markAsRead', notificationId }
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.type === 'INTERNAL_NOTE') {
      if (notification.status === 'unread') {
        handleMarkAsRead(notification.id);
      }
      setDropdownOpen(false);
      const taskId = notification.task_id;
      navigate(taskId ? `/user/tasks?note=${taskId}` : '/user/tasks');
      return;
    }

    if (notification.type === 'MATERIAL_REQUEST' || notification.type === 'MATERIAL_REQUEST_UPDATE') {
      if (notification.status === 'unread') {
        handleMarkAsRead(notification.id);
      }
      setDropdownOpen(false);
      const path = await resolveNotificationPath(notification, user?.roles || []);
      navigate(path);
      return;
    }

    setSelectedNotification(notification);
    onModalOpen();
    // Marchează ca citită automat când se deschide modalul
    if (notification.status === 'unread') {
      handleMarkAsRead(notification.id);
    }
  };

  const loadSpecificNotificationLogs = async (notification: Notification) => {
    setLoadingLogs(true);
    try {
      // 1) Determină eventId din notificare sau din mesaj
      let eventId = (notification as any).event_id as number | undefined;
      if (!eventId && notification.message) {
        const match = notification.message.match(/#(\d{5,})/);
        if (match) {
          eventId = Number(match[1]);
        }
      }

      // 2) Dacă avem eventId, încearcă să găsești logul exact pentru această notificare
      if (eventId) {
        const logs = await ActivityLogService.getEventActivityLogs(eventId);
        const notifTime = new Date(notification.created_at).getTime();
        // caută log-ul cel mai apropiat în jurul timestamp-ului notificării
        let closest: ActivityLog | null = null;
        let bestDelta = Infinity;
        for (const l of logs) {
          const t = new Date(l.created_at).getTime();
          const delta = Math.abs(t - notifTime);
          if (delta < bestDelta) {
            bestDelta = delta;
            closest = l;
          }
        }

        if (closest) {
          setActivityLogs([closest]);
          return;
        }
      }

      // 3) Fallback: generează un log sintetic din notificare (doar această acțiune)
      const syntheticLog: ActivityLog = {
        id: Date.now(),
        user_id: user?.id ? Number(user.id) : 0,
        action_type: 'EVENT_UPDATED',
        entity_type: 'EVENT',
        entity_id: eventId || 0,
        description: `A actualizat evenimentul "${notification.message.split(' - ')[0] || 'Eveniment'}"`,
        details: {
          changes: {
            status: 'Actualizat',
            modifiedAt: new Date(notification.created_at).toLocaleString('ro-RO'),
            notificationType: notification.type,
            message: notification.message,
          }
        },
        ip_address: '127.0.0.1',
        created_at: notification.created_at,
        first_name: user?.first_name || 'Utilizator',
        last_name: user?.last_name || 'Necunoscut',
        email: user?.email || 'necunoscut@example.com'
      };
      setActivityLogs([syntheticLog]);
    } catch (error) {
      console.error('Error loading specific notification logs:', error);
      setActivityLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleViewEvent = async () => {
    if (!selectedNotification) {
      onModalClose();
      return;
    }

    if (selectedNotification.status === 'unread') {
      handleMarkAsRead(selectedNotification.id);
    }

    const eventId = await resolveNotificationEventId(selectedNotification);
    const path = await resolveNotificationPath(selectedNotification, user?.roles || []);
    navigate(path);
    if (eventId) {
      window.dispatchEvent(new CustomEvent('openCalendarEvent', { detail: { eventId } }));
    }
    onModalClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <VStack spacing={0} align="stretch" h="full">
      {/* Logo/Header */}
      <Box p={6} borderBottom="1px" borderColor={borderColor}>
        <VStack spacing={2} align="start">
          <Text fontSize="2xl" fontWeight="bold" color={textColor} letterSpacing="tight">
            DSPD
          </Text>
          <Text fontSize="xs" color={mutedTextColor} fontWeight="medium" letterSpacing="wide">
            Direcția de Sănătate Publică
          </Text>
        </VStack>
      </Box>

      {/* Navigation */}
      <VStack spacing={2} align="stretch" flex={1} p={4}>
        {displayedNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.name}
              variant={isActive ? 'solid' : 'ghost'}
              colorScheme={isActive ? 'teal' : undefined}
              leftIcon={
                <NavIconBadge count={item.badge}>
                  <Icon as={item.icon} boxSize={4} />
                </NavIconBadge>
              }
              justifyContent="start"
              h="48px"
              onClick={() => navigate(item.path)}
              position="relative"
              borderRadius="lg"
              _hover={{
                bg: isActive ? activeBg : gray100,
              }}
              _active={{
                transform: 'translateX(2px)',
              }}
              transition="all 0.2s ease"
              fontWeight={isActive ? 'semibold' : 'medium'}
            >
              <Text fontSize="sm">{item.name}</Text>
            </Button>
          );
        })}
      </VStack>
    </VStack>
  );

  return (
    <Box minH="100vh" bg={bgColor}>
      <Box>
        {/* Header */}
        <Box
          position="sticky"
          top={0}
          zIndex={5}
          borderBottom="1px"
          borderColor={borderColor}
          px={6}
          py={4}
          backdropFilter="blur(10px)"
          bg={headerBg}
        >
          <Flex justify="space-between" align="center" gap={4}>
            <HStack spacing={4}>
              <IconButton
                display={{ base: 'flex', lg: 'none' }}
                onClick={onOpen}
                icon={<FiMenu />}
                variant="ghost"
                aria-label="Open menu"
                size="sm"
              />
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  DSPD
                </Text>
                <Text fontSize="xs" color={mutedTextColor} display={{ base: 'none', md: 'block' }}>
                  Direcția de Sănătate Publică
                </Text>
              </VStack>
            </HStack>

            <HStack spacing={4}>
              {/* Notifications */}
              <Box position="relative">
                <IconButton
                  icon={<FiBell />}
                  variant="ghost"
                  aria-label="Notifications"
                  size="sm"
                  position="relative"
                  color={mutedTextColor}
                  _hover={{ color: textColor }}
                  onClick={() => setDropdownOpen((v) => !v)}
                />
                {unreadCount > 0 && (
                  <Badge
                    position="absolute"
                    top={1}
                    right={1}
                    colorScheme="red"
                    variant="solid"
                    size="sm"
                    borderRadius="full"
                  >
                    {unreadCount}
                  </Badge>
                )}
                {/* Dropdown inbox notificări */}
                {dropdownOpen && (
                  <Box 
                    position="absolute" 
                    right={0} 
                    mt={2} 
                    w="340px" 
                    maxH="400px" 
                    bg={white} 
                    boxShadow="xl" 
                    borderRadius="md" 
                    zIndex={9999} 
                    p={2} 
                    overflowY="auto" 
                    border="2px solid #2196F3"
                  >
                    <HStack justify="space-between" align="center" mb={2}>
                      <Text fontWeight="bold">Notificări</Text>
                      <HStack spacing={2}>
                        <Button size="xs" variant="ghost" onClick={() => navigate('/user/notifications')}>
                          Vezi toate
                        </Button>
                        <Button size="xs" variant="ghost" onClick={handleMarkAllRead}>
                          Marchează toate ca citite
                        </Button>
                      </HStack>
                    </HStack>
                    {notifications.length === 0 ? (
                      <Text color="gray.400" fontSize="sm">Nu ai notificări</Text>
                    ) : (
                      notifications.map((notif) => {
                        const isAlert = notif.type === 'alert';
                        const isInternalNote = notif.type === 'INTERNAL_NOTE';
                        const isUnread = notif.status === 'unread';
                        
                        // Stiluri diferite pentru alerte vs notificări normale
                        const bgColor = isAlert 
                          ? (isUnread ? orange50 : gray50)
                          : isInternalNote
                            ? (isUnread ? 'blue.50' : gray50)
                          : (isUnread ? green50 : gray50);
                        
                        const borderColor = isAlert 
                          ? (isUnread ? orange300 : gray200)
                          : isInternalNote
                            ? (isUnread ? 'blue.300' : gray200)
                          : (isUnread ? green200 : gray200);
                        
                        const textColor = isAlert 
                          ? (isUnread ? orange800 : gray700)
                          : isInternalNote
                            ? (isUnread ? 'blue.800' : gray700)
                          : (isUnread ? green800 : gray700);
                        
                        const hoverBg = isAlert 
                          ? (isUnread ? orange100 : gray100)
                          : isInternalNote
                            ? (isUnread ? 'blue.100' : gray100)
                          : (isUnread ? green100 : gray100);
                        
                        const dotColor = isAlert ? 'orange.500' : isInternalNote ? 'blue.500' : 'green.500';
                        
                        return (
                          <Box 
                            key={notif.id} 
                            p={3} 
                            mb={2} 
                            borderRadius="lg" 
                            bg={bgColor}
                            border={isUnread ? '2px solid' : '1px solid'}
                            borderColor={borderColor}
                            fontWeight={isUnread ? 'bold' : 'normal'}
                            cursor="pointer"
                            _hover={{ 
                              bg: hoverBg,
                              transform: 'translateY(-2px)',
                              boxShadow: 'lg',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => handleNotificationClick(notif)}
                            position="relative"
                          >
                            <HStack spacing={2} align="start">
                              {isAlert && (
                                <Box
                                  w={2}
                                  h={2}
                                  bg="orange.500"
                                  borderRadius="full"
                                  flexShrink={0}
                                  mt={1}
                                />
                              )}
                              <VStack align="start" spacing={1} flex={1}>
                                <Text fontSize="sm" color={textColor}>
                                  {notif.message}
                                </Text>
                                <Text fontSize="xs" color={gray500}>
                                  {new Date(notif.created_at).toLocaleString('ro-RO')}
                                </Text>
                              </VStack>
                            </HStack>
                            {isUnread && (
                              <Box
                                position="absolute"
                                top={3}
                                right={3}
                                w={3}
                                h={3}
                                bg={dotColor}
                                borderRadius="full"
                                boxShadow="0 0 0 2px white"
                              />
                            )}
                          </Box>
                        );
                      })
                    )}
                  </Box>
                )}
              </Box>

              {/* User menu */}
              <Menu>
                <MenuButton 
                  as={Button} 
                  variant="ghost" 
                  rightIcon={<FiChevronDown />}
                  size="sm"
                  px={3}
                  py={2}
                  borderRadius="lg"
                  _hover={{ bg: gray100 }}
                >
                  <HStack spacing={2}>
                    <Avatar 
                      size="sm" 
                      name={`${user?.first_name} ${user?.last_name}`}
                      bg={teal500}
                      color="white"
                    />
                    <VStack align="start" spacing={0} display={{ base: 'none', lg: 'flex' }}>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>
                        {user?.first_name} {user?.last_name}
                      </Text>
                      <Text fontSize="xs" color={mutedTextColor}>
                        {getRoleDisplayName(user?.roles || [])}
                      </Text>
                    </VStack>
                  </HStack>
                </MenuButton>
                <MenuList 
                  bg={white}
                  borderColor={borderColor}
                  boxShadow="xl"
                >
                  <MenuItem 
                    icon={<FiUser />} 
                    onClick={() => navigate('/user/profile')}
                    _hover={{ bg: gray50 }}
                  >
                    Profil
                  </MenuItem>
                  <MenuItem 
                    icon={<FiSettings />} 
                    onClick={() => navigate('/user/settings')}
                    _hover={{ bg: gray50 }}
                  >
                    Setări
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem 
                    icon={<FiLogOut />} 
                    onClick={handleLogout} 
                    color="red.500"
                    _hover={{ bg: red50 }}
                  >
                    Deconectare
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>

          <Box mt={4} display={{ base: 'none', lg: 'block' }}>
            <HStack spacing={2} overflowX="auto" pb={1}>
              {displayedNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? 'solid' : 'ghost'}
                    colorScheme={isActive ? 'teal' : undefined}
                    leftIcon={
                      <NavIconBadge count={item.badge}>
                        <Icon as={item.icon} boxSize={4} />
                      </NavIconBadge>
                    }
                    borderRadius="full"
                    onClick={() => navigate(item.path)}
                    whiteSpace="nowrap"
                    minW="fit-content"
                    _hover={{ bg: isActive ? activeBg : gray100 }}
                  >
                    {item.name}
                  </Button>
                );
              })}
            </HStack>
          </Box>
        </Box>

        {/* Page content */}
        <Box p={6}>
          {children}
        </Box>
      </Box>

      {/* Mobile sidebar */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg={sidebarBg}>
          <DrawerCloseButton />
          <DrawerHeader borderBottom="1px" borderColor={borderColor}>
            <Text fontSize="xl" fontWeight="bold" color={textColor}>
              DSPD
            </Text>
          </DrawerHeader>
          <DrawerBody p={0}>
            <SidebarContent />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Modal pentru detalii notificare - Modern Design */}
      <Modal isOpen={isModalOpen} onClose={onModalClose} size="4xl" isCentered>
        <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.300" />
        <ModalContent borderRadius="2xl" overflow="hidden" boxShadow="2xl">
          <Box
            bgGradient="linear(135deg, blue.500 0%, purple.600 100%)"
            px={6}
            py={8}
            color="white"
            position="relative"
          >
            <HStack spacing={3}>
              <Icon as={FiBell} boxSize={6} />
              <Text fontSize="2xl" fontWeight="bold">
                Detalii Notificare
              </Text>
            </HStack>
            
            <ModalCloseButton 
              color="white" 
              _hover={{ bg: 'whiteAlpha.200' }}
              position="absolute"
              right={6}
              top={6}
            />
          </Box>
          
          <ModalBody p={6}>
            {selectedNotification && (
              <VStack align="stretch" spacing={6}>
                {/* Main Notification Content */}
                <Box>
                  <Text fontSize="xl" fontWeight="bold" color={gray800} mb={3}>
                    {selectedNotification.message}
                  </Text>
                  
                  <VStack align="stretch" spacing={3} mt={4}>
                    <HStack>
                      <Icon as={FiCalendar} color={gray500} />
                      <Text fontSize="sm" color={gray600}>
                    <strong>Data:</strong> {new Date(selectedNotification.created_at).toLocaleString('ro-RO')}
                  </Text>
                    </HStack>
                    
                    <HStack>
                      <Badge 
                        colorScheme={selectedNotification.status === 'unread' ? 'green' : 'gray'}
                        fontSize="sm"
                        px={3}
                        py={1}
                        borderRadius="full"
                      >
                        {selectedNotification.status === 'unread' ? 'Necitită' : 'Citită'}
                      </Badge>
                      
                      <Badge 
                        colorScheme={
                          selectedNotification.type === 'TRANSPORT_EVENT' ? 'blue' :
                          selectedNotification.type === 'TRANSPORT_EVENT_UPDATE' ? 'purple' :
                          selectedNotification.type === 'assignment' ? 'green' : 'gray'
                        }
                        fontSize="sm"
                        px={3}
                        py={1}
                        borderRadius="full"
                      >
                        {selectedNotification.type === 'TRANSPORT_EVENT' ? '🚚 Transport Nou' :
                         selectedNotification.type === 'TRANSPORT_EVENT_UPDATE' ? '📦 Transport Actualizat' :
                         selectedNotification.type === 'assignment' ? 'Asignare' :
                         selectedNotification.type === 'unassignment' ? 'Dezasignare' : selectedNotification.type}
                      </Badge>
                    </HStack>
                  </VStack>
                </Box>
                
                {selectedNotification.type === 'MATERIAL_REQUEST_UPDATE' && (
                  <Box p={5} bg={useColorModeValue('green.50', 'whiteAlpha.100')} borderRadius="xl" border="1px solid" borderColor={useColorModeValue('green.200', 'whiteAlpha.200')}>
                    <Text fontWeight="semibold" mb={2}>Cererea ta a fost procesată</Text>
                    <Text color={gray700}>{selectedNotification.message}</Text>
                    <Text fontSize="sm" color={mutedTextColor} mt={3}>
                      Poți deschide livrarea planificată pentru a confirma primirea produselor când sosesc.
                    </Text>
                  </Box>
                )}

                {/* Material Request Details Section - With API Data */}
                {selectedNotification.type === 'MATERIAL_REQUEST' && (
                  <Box>
                    <Divider my={6} borderColor={gray200} />
                    <VStack align="stretch" spacing={4}>
                      <HStack spacing={3} mb={2}>
                        <Icon as={FiPackage} boxSize={6} color="blue.500" />
                        <Text fontSize="2xl" fontWeight="bold" color={gray800}>
                          📦 Detalii Cerere Materiale
                        </Text>
                      </HStack>
                      
                      {loadingRequestDetails ? (
                        <Box textAlign="center" py={8}>
                          <Text color="gray.500" fontSize="lg">
                            Se încarcă detaliile cererii...
                          </Text>
                        </Box>
                      ) : materialRequestDetails ? (
                        <Box p={6} bg={gray50} borderRadius="xl" border="2px solid" borderColor={gray200}>
                          <VStack align="stretch" spacing={4}>
                            <HStack>
                              <Icon as={FiPackage} color="blue.600" />
                              <Text fontSize="lg" fontWeight="bold" color={gray800}>
                                Cerere de Materiale
                              </Text>
                            </HStack>
                            
                            <Box>
                              <Text fontSize="sm" color={gray600} mb={2}>
                                <strong>Produs:</strong>
                              </Text>
                              <Text fontSize="md" color={gray800} fontWeight="medium">
                                {materialRequestDetails.product_name || 'N/A'}
                              </Text>
                            </Box>
                            
                            <HStack spacing={6}>
                              <Box>
                                <Text fontSize="sm" color={gray600} mb={1}>
                                  <strong>Cantitate Cerută:</strong>
                                </Text>
                                <Text fontSize="md" color="blue.600" fontWeight="bold">
                                  {materialRequestDetails.quantity_requested || 'N/A'} {materialRequestDetails.product_unit || 'buc'}
                                </Text>
                              </Box>
                              
                              <Box>
                                <Text fontSize="sm" color={gray600} mb={1}>
                                  <strong>Prioritate:</strong>
                                </Text>
                                <Badge 
                                  colorScheme={
                                    materialRequestDetails.priority === 'URGENT' ? 'red' :
                                    materialRequestDetails.priority === 'HIGH' ? 'orange' :
                                    materialRequestDetails.priority === 'MEDIUM' ? 'yellow' : 'green'
                                  }
                                  fontSize="sm"
                                  px={3}
                                  py={1}
                                  borderRadius="full"
                                >
                                  {materialRequestDetails.priority === 'URGENT' ? '🔴 URGENT' :
                                   materialRequestDetails.priority === 'HIGH' ? '🟠 ÎNALTĂ' :
                                   materialRequestDetails.priority === 'MEDIUM' ? '🟡 MEDIE' : '🟢 SCĂZUTĂ'}
                                </Badge>
                              </Box>
                            </HStack>
                            
                            <Box>
                              <Text fontSize="sm" color={gray600} mb={2}>
                                <strong>Solicitant:</strong>
                              </Text>
                              <Text fontSize="md" color={gray800}>
                                {materialRequestDetails.requester_first_name} {materialRequestDetails.requester_last_name}
                              </Text>
                            </Box>
                            
                            <Box>
                              <Text fontSize="sm" color={gray600} mb={2}>
                                <strong>Motivul Cererii:</strong>
                              </Text>
                              <Text fontSize="md" color={gray800} fontStyle="italic">
                                {materialRequestDetails.reason || 'Nu a fost specificat'}
                              </Text>
                            </Box>
                            
                            <Box>
                              <Text fontSize="sm" color={gray600} mb={2}>
                                <strong>Status Cerere:</strong>
                              </Text>
                              <Badge 
                                colorScheme={
                                  materialRequestDetails.status === 'APPROVED' ? 'green' :
                                  materialRequestDetails.status === 'REJECTED' ? 'red' : 'blue'
                                }
                                fontSize="sm"
                                px={3}
                                py={1}
                                borderRadius="full"
                              >
                                {materialRequestDetails.status === 'APPROVED' ? '✅ APROBATĂ' :
                                 materialRequestDetails.status === 'REJECTED' ? '❌ RESPINSĂ' : '📋 ÎN AȘTEPTARE'}
                              </Badge>
                            </Box>

                            {materialRequestDetails.request_number && (
                              <Box>
                                <Text fontSize="sm" color={gray600} mb={2}>
                                  <strong>Număr Cerere:</strong>
                                </Text>
                                <Text fontSize="md" color="blue.600" fontWeight="bold">
                                  {materialRequestDetails.request_number}
                                </Text>
                              </Box>
                            )}

                            {materialRequestDetails.created_at && (
                              <Box>
                                <Text fontSize="sm" color={gray600} mb={2}>
                                  <strong>Data Creării:</strong>
                                </Text>
                                <Text fontSize="md" color={gray800}>
                                  {new Date(materialRequestDetails.created_at).toLocaleString('ro-RO')}
                                </Text>
                              </Box>
                            )}
                          </VStack>
                        </Box>
                      ) : (
                        <Box textAlign="center" py={8} bg={gray50} borderRadius="xl">
                          <Text color="gray.500" fontSize="lg" fontStyle="italic" mb={4}>
                            Nu s-au putut încărca detaliile cererii de materiale.
                          </Text>
                          <Text color="gray.400" fontSize="sm">
                            Verificați conexiunea la internet sau contactați suportul.
                          </Text>
                        </Box>
                      )}
                    </VStack>
                  </Box>
                )}

                {/* Activity Logs Section - Only for non-MATERIAL_REQUEST notifications */}
                {selectedNotification.type !== 'MATERIAL_REQUEST' && selectedNotification.type !== 'MATERIAL_REQUEST_UPDATE' && (
                  <Box>
                    <Divider my={6} borderColor={gray200} />
                    <VStack align="stretch" spacing={4}>
                      <HStack spacing={3} mb={2}>
                        <Icon as={FiActivity} boxSize={6} color="blue.500" />
                        <Text fontSize="2xl" fontWeight="bold" color={gray800}>
                          📋 Modificarea Specifică
                        </Text>
                      </HStack>
                      
                      {loadingLogs ? (
                        <Box textAlign="center" py={8}>
                          <Text color="gray.500" fontSize="lg">
                            Se încarcă detaliile modificărilor...
                          </Text>
                        </Box>
                      ) : activityLogs.length > 0 ? (
                      <VStack align="stretch" spacing={4} maxH="500px" overflowY="auto" pr={2}>
                        {activityLogs.map((log) => (
                          <Box
                            key={log.id}
                            p={6}
                            bg={white}
                            borderRadius="xl"
                            border="2px solid"
                            borderColor={
                              log.action_type === 'EVENT_CREATED' ? 'green.200' :
                              log.action_type === 'EVENT_UPDATED' ? 'blue.200' :
                              log.action_type === 'EVENT_DELETED' ? 'red.200' :
                              'gray.200'
                            }
                            boxShadow="lg"
                            _hover={{ 
                              transform: 'translateY(-2px)',
                              boxShadow: 'xl',
                              transition: 'all 0.2s'
                            }}
                          >
                            <HStack justify="space-between" mb={4}>
                              <HStack spacing={3}>
                                <Box
                                  p={2}
                                  borderRadius="full"
                                  bg={
                                    log.action_type === 'EVENT_CREATED' ? 'green.100' :
                                    log.action_type === 'EVENT_UPDATED' ? 'blue.100' :
                                    log.action_type === 'EVENT_DELETED' ? 'red.100' :
                                    'gray.100'
                                  }
                                >
                                  {log.action_type === 'EVENT_CREATED' ? '🆕' :
                                   log.action_type === 'EVENT_UPDATED' ? '✏️' :
                                   log.action_type === 'EVENT_DELETED' ? '🗑️' : '📝'}
                                </Box>
                                <VStack align="start" spacing={1}>
                                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                                    {log.action_type === 'EVENT_CREATED' ? 'Eveniment creat' :
                                     log.action_type === 'EVENT_UPDATED' ? 'Eveniment actualizat' :
                                     log.action_type === 'EVENT_DELETED' ? 'Eveniment șters' :
                                     log.action_type}
                                  </Text>
                                  <Text fontSize="sm" color="gray.500">
                                    {new Date(log.created_at).toLocaleString('ro-RO')}
                                  </Text>
                                </VStack>
                              </HStack>
                            </HStack>
                            
                            <VStack align="stretch" spacing={3}>
                              <HStack>
                                <Icon as={FiUser} boxSize={4} color="gray.500" />
                                <Text fontSize="md" color={gray700}>
                                  <strong>Modificat de:</strong> {log.first_name} {log.last_name}
                                </Text>
                              </HStack>
                              
                              <HStack align="start">
                                <Icon as={FiFileText} boxSize={4} color={gray500} mt={1} />
                                <Text fontSize="md" color={gray700}>
                                  <strong>Descriere:</strong> {log.description}
                                </Text>
                              </HStack>
                              
                              {(() => {
                                const details: any = log.details || {};
                                const changes: any = details.changes || {};
                                // Acceptă mai multe formate posibile pentru schimbările pe produse
                                const productChanges = changes.productChanges || changes.products || changes.orderItems || {};
                                const added = productChanges.added || productChanges.adaugate || [];
                                const removed = productChanges.removed || productChanges.sterse || [];
                                const updated = productChanges.updated || productChanges.modificate || [];

                                const hasAny = (added.length + removed.length + updated.length) > 0;
                                
                                // Debug logging
                                console.log('🔍 Product changes debug:', {
                                  productChanges,
                                  added,
                                  updated,
                                  removed,
                                  hasAny,
                                  changes
                                });
                                
                                if (!hasAny) {
                                  return null;
                                }

                                const Section = ({ title, color, items }: { title: string; color: string; items: any[] }) => (
                                  <Box>
                                    <HStack mb={2}>
                                      <Badge colorScheme={color} variant="subtle">{title}</Badge>
                                      <Text fontSize="sm" color={gray600}>({items.length})</Text>
                                    </HStack>
                                    <VStack align="stretch" spacing={1}>
                                      {items.map((it, idx) => {
                                        const name = it.productName || it.name || it.product || 'Produs';
                                        const oldQ = it.oldQty ?? it.old_quantity ?? it.oldQuantity ?? it.from ?? undefined;
                                        const newQ = it.newQty ?? it.new_quantity ?? it.newQuantity ?? it.to ?? undefined;
                                        const unit = it.unit || it.uom || 'buc';
                                        
                                        // Debug logging pentru fiecare item
                                        console.log(`🔍 Item ${idx} (${title}):`, {
                                          name,
                                          oldQ,
                                          newQ,
                                          unit,
                                          fullItem: it
                                        });
                                        
                                        const line = newQ !== undefined && oldQ !== undefined
                                          ? `${name}: ${oldQ} → ${newQ} ${unit}`
                                          : newQ !== undefined
                                            ? `${name}: +${newQ} ${unit}`
                                            : oldQ !== undefined
                                              ? `${name}: -${oldQ} ${unit}`
                                              : String(name);
                                        return (
                                          <Box key={`${title}-${idx}`} p={2} bg={white} borderRadius="md" border="1px solid" borderColor={gray200}>
                                            <Text fontSize="sm" color={gray700}>{line}</Text>
                                          </Box>
                                        );
                                      })}
                                    </VStack>
                                  </Box>
                                );

                                return (
                                  <Box mt={4} p={4} bg={gray50} borderRadius="md">
                                    <Text fontSize="md" fontWeight="bold" color={gray700} mb={3}>
                                      🔍 Detalii Modificări Produse
                                    </Text>
                                    <VStack align="stretch" spacing={3}>
                                      {added.length > 0 && <Section title="Adăugate" color="green" items={added} />}
                                      {updated.length > 0 && <Section title="Modificate" color="blue" items={updated} />}
                                      {removed.length > 0 && <Section title="Șterse" color="red" items={removed} />}
                                    </VStack>
                                  </Box>
                                );
                              })()}
                            </VStack>
                          </Box>
                        ))}
                      </VStack>
                    ) : (
                      <Box textAlign="center" py={8} bg={gray50} borderRadius="xl">
                        <Icon as={FiFileText} boxSize={12} color="gray.400" mb={4} />
                        <Text color="gray.500" fontSize="lg" fontStyle="italic" mb={4}>
                          Nu s-au găsit detalii specifice pentru această notificare.
                    </Text>
                        <Text color="gray.400" fontSize="sm">
                          Modificarea specifică care a generat această notificare nu este disponibilă.
                    </Text>
                      </Box>
                    )}
                    </VStack>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          
          <ModalFooter bg={gray50} borderTop="1px solid" borderColor={gray200}>
            <HStack spacing={3} width="100%" justify="flex-end">
              <Button 
                variant="ghost" 
                onClick={onModalClose}
                leftIcon={<CloseIcon />}
                _hover={{ bg: gray200 }}
              >
              Închide
            </Button>
              
              {selectedNotification && (
                <Button 
                  bgGradient={
                    selectedNotification.type === 'MATERIAL_REQUEST' 
                      ? "linear(135deg, green.500 0%, teal.600 100%)"
                      : "linear(135deg, blue.500 0%, purple.600 100%)"
                  }
                  color="white"
                  leftIcon={
                    <Icon as={
                      selectedNotification.type === 'MATERIAL_REQUEST' 
                        ? FiPackage 
                        : FiCalendar
                    } />
                  }
                  onClick={handleViewEvent}
                  _hover={{
                    bgGradient: selectedNotification.type === 'MATERIAL_REQUEST' 
                      ? "linear(135deg, green.600 0%, teal.700 100%)"
                      : "linear(135deg, blue.600 0%, purple.700 100%)",
                    transform: 'translateY(-2px)',
                    boxShadow: 'xl',
                  }}
                  transition="all 0.2s"
                  boxShadow="md"
                >
                  {selectedNotification.type === 'MATERIAL_REQUEST' 
                    ? 'Vezi Cererile de Materiale'
                    : selectedNotification.type === 'MATERIAL_REQUEST_UPDATE'
                      ? 'Deschide Livrarea'
                    : 'Deschide Evenimentul'
                  }
              </Button>
            )}
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 