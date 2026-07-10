import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Collapse,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useColorModeValue,
  useBreakpointValue,
  useDisclosure,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorMode,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Badge,
  Divider,
  Tooltip,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import {
  HamburgerIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
  BellIcon,
} from '@chakra-ui/icons'
import {
  FiHome,
  FiCalendar,
  FiCheckSquare,
  FiTruck,
  FiPackage,
  FiUsers,
  FiSettings,
  FiBarChart,
  FiDollarSign,
  FiFileText,
  FiTrendingUp,
  FiAlertTriangle,
  FiActivity,
  FiDatabase,
  FiShield,
  FiMonitor,
  FiBell,
  FiUser,
  FiRepeat,
} from 'react-icons/fi'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState, useRef } from 'react';
import { fetchNotifications, markAllAsRead, markAsRead, connectNotificationsWS, Notification } from '../../services/NotificationsService';
import { ActivityLogService, ActivityLog } from '../../services/ActivityLogService';
import { ADMIN_ENTRY_ROLES } from '../../config/permissions';

interface NavItem {
  label: string
  subLabel?: string
  children?: Array<NavItem>
  href?: string
  icon?: any
  badge?: string
  adminOnly?: boolean
  requiredPermissions?: string[]
  requiredRoles?: string[];
}

// Animații
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`

// Removed unused slideIn animation

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`

const filterNavItemsByPermission = (
  items: NavItem[],
  hasPermission: (permission: string) => boolean
): NavItem[] =>
  items
    .map((item) => {
      const filteredChildren = item.children
        ? item.children.filter((child) =>
            !child.requiredPermissions || child.requiredPermissions.some((permission) => hasPermission(permission))
          )
        : undefined;

      const isAllowed =
        !item.requiredPermissions || item.requiredPermissions.some((permission) => hasPermission(permission));

      if (item.children) {
        if (!filteredChildren || filteredChildren.length === 0) {
          return null;
        }
        return { ...item, children: filteredChildren };
      }

      return isAllowed ? item : null;
    })
    .filter(Boolean) as NavItem[];

const NAV_ITEMS: Array<NavItem> = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: FiHome,
    requiredPermissions: ['dashboard.view'],
  },
  {
    label: 'Calendar',
    href: '/admin/calendar',
    icon: FiCalendar,
    requiredPermissions: ['calendar.view'],
  },
  {
    label: 'Note interne',
    href: '/admin/tasks',
    icon: FiCheckSquare,
    requiredPermissions: ['tasks.view'],
  },
  {
    label: 'Parc Auto',
    href: '/admin/vehicles',
    icon: FiTruck,
    requiredPermissions: ['vehicles.view'],
  },
  {
  label: 'Trasabilitate',
  href: '/admin/traceability',
  icon: FiShield,
  requiredRoles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN'],
  requiredPermissions: ['traceability.view'],
},
  {
    label: 'Gestiune Stocuri',
    icon: FiPackage,
    children: [
      {
        label: 'Furnizori',
        subLabel: 'Gestionează furnizorii',
        href: '/admin/supply/suppliers',
        icon: FiUsers,
        requiredPermissions: ['supply.view'],
      },
      {
        label: 'Produse',
        subLabel: 'Gestionează produsele și stocurile',
        href: '/admin/supply/products',
        icon: FiPackage,
        requiredPermissions: ['supply.view'],
      },
      {
        label: 'Stoc',
        subLabel: 'Vizualizează stocul curent',
        href: '/admin/supply/inventory',
        icon: FiDatabase,
        requiredPermissions: ['supply.view'],
      },
      {
        label: 'Audit Stoc',
        subLabel: 'Istoricul modificărilor de stoc',
        href: '/admin/stock-audit',
        icon: FiFileText,
        requiredPermissions: ['stock_audit.view'],
      },
      {
        label: 'Trasabilitate Completă',
        subLabel: 'Audit trail pentru cereri și evenimente',
        href: '/admin/traceability',
        icon: FiShield,
        requiredPermissions: ['traceability.view'],
      },
    ],
  },
  {
    label: 'Rapoarte',
    icon: FiBarChart,
    children: [
      {
        label: 'Rapoarte Manuale',
        subLabel: 'Generează rapoarte la cerere',
        href: '/admin/reports',
        icon: FiFileText,
        requiredPermissions: ['reports.view'],
      },
      {
        label: 'Buget & Execuție',
        subLabel: 'Buget anual + cont de execuție (cheltuieli)',
        href: '/admin/budget',
        icon: FiDollarSign,
        adminOnly: true,
        requiredPermissions: ['budget.view'],
      },
      {
        label: 'Business Intelligence',
        subLabel: 'Dashboard-uri executive',
        href: '/admin/business-intelligence',
        icon: FiTrendingUp,
        requiredPermissions: ['bi.view'],
      },
      {
        label: 'Rapoarte Automate',
        subLabel: 'Programe de generare automată',
        href: '/admin/automated-reports',
        icon: FiActivity,
        adminOnly: true,
        requiredPermissions: ['automated_reports.view'],
      },
    ],
  },
  {
    label: 'Administrare',
    icon: FiShield,
    adminOnly: true,
    children: [
      {
        label: 'Pacienți (PAM)',
        subLabel: 'Identitate · episoade · programări · observații',
        href: '/admin/patients',
        icon: FiUser,
        requiredPermissions: ['patients.view'],
      },
      {
        label: 'Portal pacienți',
        subLabel: 'Dosar · programări online · comunicare · documente',
        href: '/admin/portal',
        icon: FiUser,
        requiredPermissions: ['patient_portal.view'],
      },
      {
        label: 'Motor fluxuri',
        subLabel: 'Modelare + execuție + rollback/versionare',
        href: '/admin/workflows',
        icon: FiRepeat,
        requiredPermissions: ['workflows.view'],
      },
      {
        label: 'Utilizatori',
        subLabel: 'Gestionează utilizatorii sistemului',
        href: '/admin/users',
        icon: FiUsers,
        requiredPermissions: ['users.manage'],
      },
      {
        label: 'Setări Sistem',
        subLabel: 'Configurează parametrii sistemului',
        href: '/admin/settings',
        icon: FiSettings,
        requiredPermissions: ['system_settings.manage', 'roles.manage'],
      },
    ],
  },
  {
    label: 'Monitorizare',
    icon: FiActivity,
    children: [
      {
        label: 'Alerte',
        subLabel: 'Sistemul de alerte',
        href: '/admin/alerts',
        icon: FiAlertTriangle,
        requiredPermissions: ['alerts.view'],
      },
      {
        label: 'Loguri Activitate',
        subLabel: 'Istoricul activităților',
        href: '/admin/activity-logs',
        icon: FiActivity,
        requiredPermissions: ['activity_logs.view'],
      },
      {
        label: 'Raport Acces Date Personale',
        subLabel: 'Monitorizare acces date cu caracter personal',
        href: '/admin/personal-data-access-report',
        icon: FiShield,
        requiredPermissions: ['personal_data_access.view'],
      },
    ],
  },
]

export default function Navbar() {
  const { isOpen, onToggle } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // Removed unused dropdownOpen state
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();
  
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();

  // Culori și teme
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const brandColor = useColorModeValue('blue.500', 'blue.300');
  const notificationBg = useColorModeValue('blue.50', 'blue.900');
  const notificationHoverBg = useColorModeValue('blue.100', 'blue.800');
  const notificationTextColor = useColorModeValue('gray.800', 'white');
  const notificationTimestampColor = useColorModeValue('gray.500', 'gray.400');

  // Fetch inițial + WebSocket
  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications().then(setNotifications);
    wsRef.current = connectNotificationsWS(Number(user.id), (notif) => {
      // Validare completă pentru notificare
      if (!notif || typeof notif !== 'object') {
        console.warn('🚫 Invalid notification object received:', notif);
        return;
      }
      
      if (!notif.message || typeof notif.message !== 'string' || notif.message.trim() === "") {
        console.warn('🚫 Empty or invalid notification message:', notif);
        return;
      }
      
      if (!notif.type || typeof notif.type !== 'string') {
        console.warn('🚫 Invalid notification type:', notif);
        return;
      }
      
      const newNotification = {
        id: Date.now(),
        user_id: Number(user.id),
        message: notif.message.trim(),
        type: notif.type,
        status: 'unread' as 'unread' | 'read',
        created_at: new Date().toISOString(),
      };
      
      // Adaugă la navbar
      setNotifications((prev) => [newNotification, ...prev]);
      
      // Trimite către NotificationsPage
      window.dispatchEvent(new CustomEvent('notificationUpdate', {
        detail: { action: 'newNotification', newNotification }
      }));
    });

    return () => {
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

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
    
    // Sincronizare cu NotificationsPage
    window.dispatchEvent(new CustomEvent('notificationUpdate', {
      detail: { action: 'markAllAsRead' }
    }));
  };

  const handleMarkAsRead = async (notificationId: number) => {
    await markAsRead(notificationId);
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, status: 'read' } : n
    ));
    
    // Sincronizare cu NotificationsPage
    window.dispatchEvent(new CustomEvent('notificationUpdate', {
      detail: { action: 'markAsRead', notificationId }
    }));
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    onModalOpen();
    if (notification.status === 'unread') {
      handleMarkAsRead(notification.id);
    }
  };

  const handleViewEvent = () => {
    if (selectedNotification) {
      // Marchează notificarea ca citită
      if (selectedNotification.status === 'unread') {
        handleMarkAsRead(selectedNotification.id);
      }
      
      const isAdmin = user?.roles?.some((role) => ADMIN_ENTRY_ROLES.includes(role));
      const basePath = isAdmin ? '/admin' : '/user';

      const notificationType = (selectedNotification as any).type;
      
      // Material Request notifications use request_id (not event_id)
      const requestId = (selectedNotification as any).request_id;
      if (notificationType === 'MATERIAL_REQUEST' && requestId) {
        window.location.href = `${basePath}/material-requests?request=${requestId}`;
        onModalClose();
        return;
      }

      // Automated Report notifications - navigate to reports page with report ID
      if (notificationType === 'AUTOMATED_REPORT') {
        const reportData = (selectedNotification as any).data;
        if (reportData?.reportId) {
          // Extract numeric ID from reportId (format: "report_1768978844691_1" or just numeric ID)
          const reportId = reportData.reportId.toString().replace('report_', '').split('_')[0];
          window.location.href = `${basePath}/automated-reports?report=${reportId}`;
        } else {
          window.location.href = `${basePath}/automated-reports`;
        }
        onModalClose();
        return;
      }

      // Otherwise, try to open a calendar event
      const eventId = (selectedNotification as any).event_id;
      if (eventId) {
        window.location.href = `${basePath}/calendar?event=${eventId}`;
        onModalClose();
        return;
      }

      console.warn('No event_id/request_id found in notification:', selectedNotification);
    }
    onModalClose();
  };

  const loadActivityLogs = async (eventId: number) => {
    if (!eventId) return;
    
    setLoadingLogs(true);
    try {
      const logs = await ActivityLogService.getEventActivityLogs(eventId);
      setActivityLogs(logs);
    } catch (error) {
      console.error('Error loading activity logs:', error);
      setActivityLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Încarcă logurile de activitate când se deschide modalul
  useEffect(() => {
    if (isModalOpen && selectedNotification) {
      const notificationType = (selectedNotification as any).type;
      // For material requests and automated reports, there is no event; don't load EVENT logs.
      if (notificationType === 'MATERIAL_REQUEST' || notificationType === 'AUTOMATED_REPORT') {
        setActivityLogs([]);
        return;
      }

      // Try to extract event_id (directly or from message)
      let eventId = (selectedNotification as any).event_id;
      if (!eventId && selectedNotification.message) {
        const message = selectedNotification.message;
        const idMatch = message.match(/#(\d+)/) || message.match(/event[_-]?id[:\s]*(\d+)/i);
        if (idMatch) eventId = parseInt(idMatch[1]);
      }

      if (eventId) loadActivityLogs(eventId);
    }
  }, [isModalOpen, selectedNotification]);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const isAdmin = user?.roles?.some((role) => ADMIN_ENTRY_ROLES.includes(role)) || false;
  const filteredNavItems = filterNavItemsByPermission(NAV_ITEMS, hasPermission);

  return (
    <Box
      as="nav"
      position="sticky"
      top={0}
      zIndex={1000}
      bg={bg}
      borderBottom={1}
      borderStyle={'solid'}
      borderColor={borderColor}
      boxShadow="0 2px 10px rgba(0,0,0,0.1)"
      animation={`${fadeIn} 0.5s ease-out`}
    >
      <Flex
        color={textColor}
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 4 }}
        align={'center'}
        maxW="1400px"
        mx="auto"
      >
        <Flex
          flex={{ base: 1, md: 'auto' }}
          ml={{ base: -2 }}
          display={{ base: 'flex', md: 'none' }}
        >
          <IconButton
            onClick={onToggle}
            icon={
              isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
            }
            variant={'ghost'}
            aria-label={'Toggle Navigation'}
          />
        </Flex>

        {/* Logo */}
        <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }}>
          <Box
            as={RouterLink}
            to="/admin/dashboard"
            cursor="pointer"
            _hover={{ transform: 'scale(1.05)' }}
            transition="all 0.3s"
          >
            <Badge
              px={4}
              py={2.5}
              borderRadius="xl"
              bgGradient="linear(135deg, blue.500 0%, purple.600 50%, pink.500 100%)"
              color="white"
              fontSize="sm"
              fontWeight="bold"
              letterSpacing="wide"
              boxShadow="xl"
              position="relative"
              overflow="hidden"
              border="2px solid"
              borderColor="whiteAlpha.300"
              _hover={{
                boxShadow: '2xl',
                borderColor: 'whiteAlpha.500',
              }}
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                animation: 'shimmer 3s infinite',
              }}
              sx={{
                '@keyframes shimmer': {
                  '0%': { left: '-100%' },
                  '100%': { left: '100%' },
                },
              }}
            >
              <HStack spacing={2.5}>
                <Text fontSize="xl" lineHeight="1">🏥</Text>
                <VStack spacing={0} align="start" lineHeight="1.2">
                  <Text fontSize="xs" fontWeight="extrabold" letterSpacing="wider">
                    SPITAL
                  </Text>
                  <Text fontSize="xs" fontWeight="extrabold" letterSpacing="wider">
                    CRAIOVA
                  </Text>
                </VStack>
              </HStack>
            </Badge>
          </Box>
        </Flex>

        {/* Desktop Navigation */}
        <Stack
          flex={{ base: 1, md: 0 }}
          justify={'flex-end'}
          direction={'row'}
          spacing={6}
          display={{ base: 'none', md: 'flex' }}
        >
          <DesktopNav location={location} isAdmin={isAdmin} items={filteredNavItems} />
        </Stack>

        {/* Right side controls */}
        <HStack spacing={4} ml={4}>
          {/* Notifications */}
          <Menu>
            <Tooltip label="Notificări" placement="bottom">
              <MenuButton
                as={IconButton}
                icon={
                  <Box position="relative">
                    <BellIcon />
                    {unreadCount > 0 && (
                      <Badge
                        position="absolute"
                        top="-8px"
                        right="-8px"
                        colorScheme="red"
                        borderRadius="full"
                        fontSize="xs"
                        minW="18px"
                        h="18px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        animation={`${pulse} 1s infinite`}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Box>
                }
                variant="ghost"
                size="md"
                aria-label="Notificări"
              />
            </Tooltip>
            <MenuList maxH="400px" overflowY="auto" w="350px" bg={useColorModeValue('white', 'gray.800')} borderColor={borderColor}>
              <Box p={3} borderBottom="1px solid" borderColor={borderColor}>
                <Flex justify="space-between" align="center">
                  <Text fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>Notificări</Text>
                  <HStack spacing={2}>
                    <Button size="sm" variant="ghost" onClick={() => navigate('/admin/notifications')}>
                      Vezi toate
                    </Button>
                    {unreadCount > 0 && (
                      <Button size="sm" variant="ghost" onClick={handleMarkAllRead}>
                        Marchează toate ca citite
                      </Button>
                    )}
                  </HStack>
                </Flex>
              </Box>
              {notifications.length === 0 ? (
                <Box p={4} textAlign="center">
                  <Text color={useColorModeValue('gray.500', 'gray.400')}>Nu ai notificări noi</Text>
                </Box>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <MenuItem
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    bg={notification.status === 'unread' ? notificationBg : 'transparent'}
                    _hover={{ bg: notificationHoverBg }}
                    color={notificationTextColor}
                  >
                    <VStack align="start" spacing={1} w="full">
                      <Text fontSize="sm" fontWeight="medium" color={notificationTextColor}>
                        {notification.message}
                      </Text>
                      <Text fontSize="xs" color={notificationTimestampColor}>
                        {new Date(notification.created_at).toLocaleString('ro-RO')}
                      </Text>
                    </VStack>
                  </MenuItem>
                ))
              )}
            </MenuList>
          </Menu>

          {/* Color mode toggle */}
          <Tooltip label={colorMode === 'light' ? 'Mod întunecat' : 'Mod luminos'} placement="bottom">
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              variant="ghost"
              size="md"
            />
          </Tooltip>

          {/* User menu */}
          <Menu>
            <MenuButton
              as={Button}
              rounded={'full'}
              variant={'link'}
              cursor={'pointer'}
              minW={0}
            >
              <Avatar
                size={'sm'}
                                 src={`https://avatars.dicebear.com/api/initials/${user?.first_name || 'U'}${user?.last_name || 'S'}.svg`}
              />
            </MenuButton>
            <MenuList>
              <MenuItem>
                <VStack align="start" spacing={0}>
                                     <Text fontWeight="bold">
                     {user?.first_name} {user?.last_name}
                   </Text>
                  <Text fontSize="sm" color="gray.500">
                    {user?.email}
                  </Text>
                </VStack>
              </MenuItem>
              <Divider />
              <MenuItem icon={<Icon as={FiSettings} />}>
                Profil
              </MenuItem>
              <MenuItem onClick={logout} color="red.500">
                Deconectare
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {/* Mobile Navigation */}
      <Collapse in={isOpen} animateOpacity>
        <MobileNav logout={logout} items={filteredNavItems} />
      </Collapse>

      {/* Notification Modal - Modern Design */}
      <Modal isOpen={isModalOpen} onClose={onModalClose} size="4xl" isCentered>
        <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.300" />
        <ModalContent borderRadius="2xl" overflow="hidden" boxShadow="2xl" maxH="90vh">
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
          
          <ModalBody p={8} maxH="70vh" overflowY="auto">
            {selectedNotification && (
              <VStack align="stretch" spacing={6}>
                {/* Main Notification Content */}
                <Box>
                  <Text fontSize="xl" fontWeight="bold" color={useColorModeValue('gray.800', 'white')} mb={3}>
                    {selectedNotification.message}
                  </Text>
                  
                  {/* Report-specific info for AUTOMATED_REPORT */}
                  {(selectedNotification as any).type === 'AUTOMATED_REPORT' && (selectedNotification as any).data ? (
                    <Box p={4} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="md" mb={4}>
                      <Text fontSize="sm" color={useColorModeValue('blue.800', 'blue.200')} fontWeight="bold" mb={2}>
                        📊 Detalii Raport:
                      </Text>
                      <VStack align="stretch" spacing={2}>
                        {(selectedNotification as any).data.reportId && (
                          <HStack>
                            <Text fontSize="xs" color={useColorModeValue('blue.700', 'blue.300')} fontWeight="semibold">
                              ID Raport:
                            </Text>
                            <Text fontSize="xs" color={useColorModeValue('blue.700', 'blue.300')} fontFamily="mono">
                              {(selectedNotification as any).data.reportId}
                            </Text>
                          </HStack>
                        )}
                        {(selectedNotification as any).data.reportType && (
                          <HStack>
                            <Text fontSize="xs" color={useColorModeValue('blue.700', 'blue.300')} fontWeight="semibold">
                              Tip:
                            </Text>
                            <Text fontSize="xs" color={useColorModeValue('blue.700', 'blue.300')}>
                              {(selectedNotification as any).data.reportType === 'DAILY_EVENTS_SUMMARY' ? 'Raport Zilnic Evenimente' : (selectedNotification as any).data.reportType}
                            </Text>
                          </HStack>
                        )}
                        {(selectedNotification as any).data.generatedAt && (
                          <HStack>
                            <Text fontSize="xs" color={useColorModeValue('blue.700', 'blue.300')} fontWeight="semibold">
                              Generat la:
                            </Text>
                            <Text fontSize="xs" color={useColorModeValue('blue.700', 'blue.300')}>
                              {new Date((selectedNotification as any).data.generatedAt).toLocaleString('ro-RO')}
                            </Text>
                          </HStack>
                        )}
                      </VStack>
                    </Box>
                  ) : (
                    /* Debug info - doar pentru development, ascunde în producție */
                    import.meta.env.DEV && (
                      <Box p={3} bg={useColorModeValue('yellow.50', 'yellow.900')} borderRadius="md" mb={4}>
                        <Text fontSize="sm" color={useColorModeValue('yellow.800', 'yellow.200')} fontWeight="bold">
                          🔍 Debug Info:
                        </Text>
                        <Text fontSize="xs" color={useColorModeValue('yellow.700', 'yellow.300')} fontFamily="mono">
                          Event ID: {(selectedNotification as any).event_id || 'Nu există'}
                        </Text>
                        <Text fontSize="xs" color={useColorModeValue('yellow.700', 'yellow.300')} fontFamily="mono">
                          Data: {JSON.stringify(selectedNotification, null, 2)}
                        </Text>
                      </Box>
                    )
                  )}
                  
                  <VStack align="stretch" spacing={3} mt={4}>
                    <HStack>
                      <Icon as={FiCalendar} color={useColorModeValue('gray.500', 'gray.400')} />
                      <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
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
                          selectedNotification.type === 'MATERIAL_REQUEST' ? 'orange' :
                          selectedNotification.type === 'AUTOMATED_REPORT' ? 'cyan' :
                          selectedNotification.type === 'assignment' ? 'green' : 'gray'
                        }
                        fontSize="sm"
                        px={3}
                        py={1}
                        borderRadius="full"
                      >
                        {selectedNotification.type === 'TRANSPORT_EVENT' ? '🚚 Transport Nou' :
                         selectedNotification.type === 'TRANSPORT_EVENT_UPDATE' ? '📦 Transport Actualizat' :
                         selectedNotification.type === 'MATERIAL_REQUEST' ? '📋 Cerere materiale' :
                         selectedNotification.type === 'AUTOMATED_REPORT' ? '📊 Raport Automat' :
                         selectedNotification.type === 'assignment' ? 'Asignare' :
                         selectedNotification.type === 'unassignment' ? 'Dezasignare' : selectedNotification.type}
                      </Badge>
                    </HStack>
                  </VStack>
                </Box>

                {/* Activity Logs Section - Enhanced (only for notifications with event_id) */}
                {(selectedNotification as any).type !== 'AUTOMATED_REPORT' && (selectedNotification as any).type !== 'MATERIAL_REQUEST' && (
                  <Box>
                    <Divider my={6} borderColor={useColorModeValue('gray.300', 'gray.600')} />
                    <VStack align="stretch" spacing={4}>
                      <HStack spacing={3} mb={2}>
                        <Icon as={FiActivity} boxSize={6} color={useColorModeValue('blue.500', 'blue.300')} />
                        <Text fontSize="2xl" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
                          📋 Istoricul Modificărilor
                        </Text>
                      </HStack>
                      
                      {loadingLogs ? (
                        <Box textAlign="center" py={8}>
                          <Text color={useColorModeValue('gray.500', 'gray.400')} fontSize="lg">
                            Se încarcă detaliile modificărilor...
                          </Text>
                        </Box>
                      ) : activityLogs.length > 0 ? (
                        <VStack align="stretch" spacing={4} maxH="500px" overflowY="auto" pr={2}>
                          {activityLogs.map((log) => (
                            <Box
                              key={log.id}
                              p={6}
                              bg={useColorModeValue('white', 'gray.800')}
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
                                    <Text fontSize="lg" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
                                      {log.action_type === 'EVENT_CREATED' ? 'Eveniment creat' :
                                       log.action_type === 'EVENT_UPDATED' ? 'Eveniment actualizat' :
                                       log.action_type === 'EVENT_DELETED' ? 'Eveniment șters' :
                                       log.action_type}
                                    </Text>
                                    <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>
                                      {new Date(log.created_at).toLocaleString('ro-RO')}
                                    </Text>
                                  </VStack>
                                </HStack>
                              </HStack>
                              
                              <VStack align="stretch" spacing={3}>
                                <HStack>
                                  <Icon as={FiUser} boxSize={4} color={useColorModeValue('gray.500', 'gray.400')} />
                                  <Text fontSize="md" color={useColorModeValue('gray.700', 'gray.300')}>
                                    <strong>Modificat de:</strong> {log.first_name} {log.last_name}
                                  </Text>
                                </HStack>
                                
                                <HStack align="start">
                                  <Icon as={FiFileText} boxSize={4} color={useColorModeValue('gray.500', 'gray.400')} mt={1} />
                                  <Text fontSize="md" color={useColorModeValue('gray.700', 'gray.300')}>
                                    <strong>Descriere:</strong> {log.description}
                                  </Text>
                                </HStack>
                                
                                {log.details && log.details.changes && Object.keys(log.details.changes).length > 0 && (
                                  <Box mt={4} p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                                    <Text fontSize="md" fontWeight="bold" color={useColorModeValue('gray.700', 'gray.200')} mb={3}>
                                      🔍 Detalii Modificări:
                                    </Text>
                                    <VStack align="stretch" spacing={2}>
                                      {Object.entries(log.details.changes).map(([key, value]) => (
                                        <HStack key={key} justify="space-between" p={2} bg={useColorModeValue('white', 'gray.600')} borderRadius="md">
                                          <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('gray.600', 'gray.300')}>
                                            {key}:
                                          </Text>
                                          <Text fontSize="sm" color={useColorModeValue('gray.800', 'white')} fontFamily="mono">
                                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                          </Text>
                                        </HStack>
                                      ))}
                                    </VStack>
                                  </Box>
                                )}
                              </VStack>
                            </Box>
                          ))}
                        </VStack>
                      ) : (
                        <Box textAlign="center" py={8} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="xl">
                          <Icon as={FiFileText} boxSize={12} color={useColorModeValue('gray.400', 'gray.500')} mb={4} />
                          <Text color={useColorModeValue('gray.500', 'gray.400')} fontSize="lg" fontStyle="italic" mb={4}>
                            Nu există modificări înregistrate pentru acest eveniment.
                          </Text>
                          <Text color={useColorModeValue('gray.400', 'gray.500')} fontSize="sm">
                            Pentru a vedea modificările, evenimentul trebuie să aibă un ID valid.
                          </Text>
                        </Box>
                      )}
                    </VStack>
                  </Box>
                )}
                
              </VStack>
            )}
          </ModalBody>
          
          <ModalFooter bg={useColorModeValue('gray.50', 'gray.700')} borderTop="1px solid" borderColor={useColorModeValue('gray.200', 'gray.600')}>
            <HStack spacing={3} width="100%" justify="flex-end">
              <Button 
                variant="ghost" 
                onClick={onModalClose}
                leftIcon={<CloseIcon />}
                _hover={{ bg: useColorModeValue('gray.200', 'gray.600') }}
              >
                Închide
              </Button>
              
              {selectedNotification && (
                <Button 
                  bgGradient="linear(135deg, blue.500 0%, purple.600 100%)"
                  color="white"
                  leftIcon={<Icon as={(selectedNotification as any)?.type === 'AUTOMATED_REPORT' ? FiFileText : FiCalendar} />}
                  onClick={handleViewEvent}
                  _hover={{
                    bgGradient: "linear(135deg, blue.600 0%, purple.700 100%)",
                    transform: 'translateY(-2px)',
                    boxShadow: 'xl',
                  }}
                  transition="all 0.2s"
                  boxShadow="md"
                >
                  {(selectedNotification as any)?.type === 'MATERIAL_REQUEST' ? 'Deschide Cererea' :
                   (selectedNotification as any)?.type === 'AUTOMATED_REPORT' ? 'Vezi Raport' :
                   'Deschide Evenimentul'}
                </Button>
              )}
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

const DesktopNav = ({ location, isAdmin, items }: { location: { pathname: string }, isAdmin: boolean, items: NavItem[] }) => {
  const linkColor = useColorModeValue('gray.600', 'gray.200')
  const linkHoverColor = useColorModeValue('gray.800', 'white')
  const popoverContentBgColor = useColorModeValue('white', 'gray.800')

  return (
    <Stack direction={'row'} spacing={4}>
      {items.map((navItem) => (
        <Box key={navItem.label}>
          {navItem.adminOnly && !isAdmin && (
            <Popover trigger={'hover'} placement={'bottom-start'}>
              <PopoverTrigger>
                <Box
                  p={2}
                  fontSize={'sm'}
                  fontWeight={500}
                  color={linkColor}
                  _hover={{
                    textDecoration: 'none',
                    color: linkHoverColor,
                  }}
                  cursor="not-allowed"
                  opacity={0.6}
                >
                  {navItem.label}
                </Box>
              </PopoverTrigger>
            </Popover>
          )}
          {navItem.adminOnly && isAdmin && (
            <Popover trigger={'hover'} placement={'bottom-start'}>
              <PopoverTrigger>
                {navItem.href ? (
                  <Box
                    as={RouterLink}
                    to={navItem.href}
                    p={2}
                    fontSize={'sm'}
                    fontWeight={500}
                    color={location.pathname === navItem.href ? 'brand.primary.500' : linkColor}
                    _hover={{
                      textDecoration: 'none',
                      color: linkHoverColor,
                    }}
                    position="relative"
                    _after={location.pathname === navItem.href ? {
                      content: '""',
                      position: 'absolute',
                      bottom: '-2px',
                      left: '0',
                      right: '0',
                      height: '2px',
                      bg: 'brand.primary.500',
                      borderRadius: 'full',
                    } : undefined}
                  >
                    <HStack spacing={2}>
                      <Icon as={navItem.icon} />
                      {navItem.label}
                    </HStack>
                  </Box>
                ) : (
                  <Box
                    p={2}
                    fontSize={'sm'}
                    fontWeight={500}
                    color={linkColor}
                    _hover={{
                      textDecoration: 'none',
                      color: linkHoverColor,
                    }}
                  >
                    <HStack spacing={2}>
                      <Icon as={navItem.icon} />
                      {navItem.label}
                    </HStack>
                  </Box>
                )}
              </PopoverTrigger>

              {navItem.children && (
                <PopoverContent
                  border={0}
                  boxShadow={'xl'}
                  bg={popoverContentBgColor}
                  p={4}
                  rounded={'xl'}
                  minW={'sm'}>
                  <Stack>
                    {navItem.children.map((child) => (
                      <DesktopSubNav key={child.label} {...child} />
                    ))}
                  </Stack>
                </PopoverContent>
              )}
            </Popover>
          )}
          {!navItem.adminOnly && (
            <Popover trigger={'hover'} placement={'bottom-start'}>
              <PopoverTrigger>
                {navItem.href ? (
                  <Box
                    as={RouterLink}
                    to={navItem.href}
                    p={2}
                    fontSize={'sm'}
                    fontWeight={500}
                    color={location.pathname === navItem.href ? 'brand.primary.500' : linkColor}
                    _hover={{
                      textDecoration: 'none',
                      color: linkHoverColor,
                    }}
                    position="relative"
                    _after={location.pathname === navItem.href ? {
                      content: '""',
                      position: 'absolute',
                      bottom: '-2px',
                      left: '0',
                      right: '0',
                      height: '2px',
                      bg: 'brand.primary.500',
                      borderRadius: 'full',
                    } : undefined}
                  >
                    <HStack spacing={2}>
                      <Icon as={navItem.icon} />
                      {navItem.label}
                    </HStack>
                  </Box>
                ) : (
                  <Box
                    p={2}
                    fontSize={'sm'}
                    fontWeight={500}
                    color={linkColor}
                    _hover={{
                      textDecoration: 'none',
                      color: linkHoverColor,
                    }}
                  >
                    <HStack spacing={2}>
                      <Icon as={navItem.icon} />
                      {navItem.label}
                    </HStack>
                  </Box>
                )}
              </PopoverTrigger>

              {navItem.children && (
                <PopoverContent
                  border={0}
                  boxShadow={'xl'}
                  bg={popoverContentBgColor}
                  p={4}
                  rounded={'xl'}
                  minW={'sm'}>
                  <Stack>
                    {navItem.children.map((child) => (
                      <DesktopSubNav key={child.label} {...child} />
                    ))}
                  </Stack>
                </PopoverContent>
              )}
            </Popover>
          )}
        </Box>
      ))}
    </Stack>
  )
}

const DesktopSubNav = ({ label, href, subLabel, icon }: NavItem) => {
  return (
    <Box
      as={RouterLink}
      to={href ?? '#'}
      role={'group'}
      display={'block'}
      p={2}
      rounded={'md'}
      _hover={{ bg: useColorModeValue('brand.primary.50', 'gray.900') }}>
      <Stack direction={'row'} align={'center'}>
        <Box>
          <HStack spacing={2}>
            {icon && <Icon as={icon} />}
            <Text
              transition={'all .3s ease'}
              _groupHover={{ color: 'brand.primary.500' }}
              fontWeight={500}>
              {label}
            </Text>
          </HStack>
          <Text fontSize={'sm'}>{subLabel}</Text>
        </Box>
        <Flex
          transition={'all .3s ease'}
          transform={'translateX(-10px)'}
          opacity={0}
          _groupHover={{ opacity: 1, transform: 'translateX(0)' }}
          justify={'flex-end'}
          align={'center'}
          flex={1}>
          <Icon color={'brand.primary.500'} w={5} h={5} as={ChevronRightIcon} />
        </Flex>
      </Stack>
    </Box>
  )
}

const MobileNav = ({ logout, items }: { logout: () => void, items: NavItem[] }) => {
  return (
    <Stack
      bg={useColorModeValue('white', 'gray.800')}
      p={4}
      display={{ md: 'none' }}>
      {items.map((navItem) => (
        <MobileNavItem key={navItem.label} {...navItem} />
      ))}
      <Box
        py={2}
        onClick={logout}
        color="red.500"
        fontWeight={600}
        cursor="pointer"
        _hover={{
          bg: 'red.50',
        }}
      >
        Deconectare
      </Box>
    </Stack>
  )
}

const MobileNavItem = ({ label, children, href }: NavItem) => {
  const { isOpen, onToggle } = useDisclosure()

  return (
    <Stack spacing={4} onClick={children && onToggle}>
      {href ? (
        <Box
          as={RouterLink}
          to={href}
          py={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          _hover={{
            textDecoration: 'none',
          }}>
          <Text
            fontWeight={600}
            color={useColorModeValue('gray.600', 'gray.200')}>
            {label}
          </Text>
          {children && (
            <Icon
              as={ChevronDownIcon}
              transition={'all .25s ease-in-out'}
              transform={isOpen ? 'rotate(180deg)' : ''}
              w={6}
              h={6}
            />
          )}
        </Box>
      ) : (
        <Box
          py={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          _hover={{
            textDecoration: 'none',
          }}>
          <Text
            fontWeight={600}
            color={useColorModeValue('gray.600', 'gray.200')}>
            {label}
          </Text>
          {children && (
            <Icon
              as={ChevronDownIcon}
              transition={'all .25s ease-in-out'}
              transform={isOpen ? 'rotate(180deg)' : ''}
              w={6}
              h={6}
            />
          )}
        </Box>
      )}

      <Collapse in={isOpen} animateOpacity>
        <Stack
          mt={2}
          pl={4}
          borderLeft={1}
          borderStyle={'solid'}
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          align={'start'}>
          {children &&
            children.map((child) => (
              <Box as={RouterLink} key={child.label} py={2} to={child.href ?? '#'}>
                {child.label}
              </Box>
            ))}
        </Stack>
      </Collapse>
    </Stack>
  )
} 