import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Card,
  CardBody,
  CardHeader,
  useColorModeValue,
  Badge,
  Button,
} from '@chakra-ui/react';
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiInfo,
  FiBell,
  FiChevronRight,
} from 'react-icons/fi';

type AlertType = 'ERROR' | 'WARNING' | 'INFO' | 'NOTIFICATION';

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
}

// Date simulate pentru alerte
const alerts: Alert[] = [
  {
    id: '1',
    type: 'ERROR',
    title: 'Eroare sistem',
    description: 'Sincronizare eșuată cu serverul de documente',
    timestamp: '2025-07-08T10:30:00',
    isRead: false,
  },
  {
    id: '2',
    type: 'WARNING',
    title: 'ITP Expirat',
    description: 'Vehiculul DJ-01-DSP are ITP-ul expirat',
    timestamp: '2025-07-08T09:15:00',
    isRead: false,
  },
  {
    id: '3',
    type: 'INFO',
    title: 'Mentenanță Programată',
    description: 'Actualizare sistem programată pentru 22:00',
    timestamp: '2025-07-08T08:45:00',
    isRead: true,
  },
  {
    id: '4',
    type: 'NOTIFICATION',
    title: 'Document Nou',
    description: 'S-a încărcat un nou document pentru verificare',
    timestamp: '2025-07-07T16:20:00',
    isRead: true,
  },
];

const getAlertIcon = (type: AlertType) => {
  switch (type) {
    case 'ERROR':
      return FiAlertCircle;
    case 'WARNING':
      return FiAlertTriangle;
    case 'INFO':
      return FiInfo;
    case 'NOTIFICATION':
      return FiBell;
    default:
      return FiBell;
  }
};

const getAlertColor = (type: AlertType) => {
  switch (type) {
    case 'ERROR':
      return 'red';
    case 'WARNING':
      return 'orange';
    case 'INFO':
      return 'blue';
    case 'NOTIFICATION':
      return 'purple';
    default:
      return 'gray';
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AlertsPanel() {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  return (
    <Card
      bg={bgColor}
      shadow="xl"
      borderRadius="xl"
      border="1px solid"
      borderColor={borderColor}
    >
      <CardHeader pb={2}>
        <HStack justify="space-between" align="center">
          <HStack>
            <Text fontSize="lg" fontWeight="medium">
              Alerte și Notificări
            </Text>
            {unreadCount > 0 && (
              <Badge
                colorScheme="red"
                borderRadius="full"
                px={2}
                fontSize="sm"
              >
                {unreadCount} noi
              </Badge>
            )}
          </HStack>
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<FiChevronRight />}
            color={textColor}
            _hover={{ color: 'brand.500' }}
          >
            Vezi toate
          </Button>
        </HStack>
      </CardHeader>

      <CardBody>
        <VStack spacing={2} align="stretch">
          {alerts.map((alert) => (
            <Box
              key={alert.id}
              p={3}
              borderRadius="lg"
              borderLeft="4px solid"
              borderLeftColor={`${getAlertColor(alert.type)}.500`}
              bg={alert.isRead ? bgColor : `${getAlertColor(alert.type)}.50`}
              _hover={{ bg: hoverBg }}
              transition="all 0.2s"
              cursor="pointer"
            >
              <HStack spacing={4} align="flex-start">
                <Icon
                  as={getAlertIcon(alert.type)}
                  color={`${getAlertColor(alert.type)}.500`}
                  boxSize={5}
                />

                <VStack align="start" spacing={1} flex={1}>
                  <HStack justify="space-between" width="100%">
                    <Text fontWeight="medium">
                      {alert.title}
                    </Text>
                    <Text fontSize="sm" color={textColor}>
                      {formatTimestamp(alert.timestamp)}
                    </Text>
                  </HStack>

                  <Text fontSize="sm" color={textColor}>
                    {alert.description}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );
} 