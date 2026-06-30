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
  Divider,
} from '@chakra-ui/react';
import { FiCalendar, FiTruck, FiFileText, FiUsers, FiCheckCircle } from 'react-icons/fi';

// Tipuri de activități
type ActivityType = 'EVENT' | 'VEHICLE' | 'DOCUMENT' | 'USER' | 'TASK';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  user?: string;
}

// Date simulate pentru activități
const recentActivities: Activity[] = [
  {
    id: '1',
    type: 'EVENT',
    title: 'Inspecție programată',
    description: 'Inspecție la Spitalul Județean',
    timestamp: '2025-07-08T10:30:00',
    status: 'Programat',
    user: 'Dr. Popescu',
  },
  {
    id: '2',
    type: 'VEHICLE',
    title: 'Mașină alocată',
    description: 'Vehicul alocat pentru deplasare',
    timestamp: '2025-07-08T09:15:00',
    status: 'Confirmat',
    user: 'Ion Ionescu',
  },
  {
    id: '3',
    type: 'DOCUMENT',
    title: 'Document nou',
    description: 'Raport de inspecție încărcat',
    timestamp: '2025-07-08T08:45:00',
    user: 'Maria Marinescu',
  },
  {
    id: '4',
    type: 'USER',
    title: 'Utilizator nou',
    description: 'Cont nou creat în sistem',
    timestamp: '2025-07-07T16:20:00',
    status: 'Activ',
  },
  {
    id: '5',
    type: 'TASK',
    title: 'Sarcină finalizată',
    description: 'Verificare documente completată',
    timestamp: '2025-07-07T15:00:00',
    status: 'Finalizat',
    user: 'Ana Popescu',
  },
];

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'EVENT':
      return FiCalendar;
    case 'VEHICLE':
      return FiTruck;
    case 'DOCUMENT':
      return FiFileText;
    case 'USER':
      return FiUsers;
    case 'TASK':
      return FiCheckCircle;
    default:
      return FiCalendar;
  }
};

const getActivityColor = (type: ActivityType) => {
  switch (type) {
    case 'EVENT':
      return 'blue';
    case 'VEHICLE':
      return 'green';
    case 'DOCUMENT':
      return 'purple';
    case 'USER':
      return 'orange';
    case 'TASK':
      return 'teal';
    default:
      return 'gray';
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function ActivityFeed() {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const dividerColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Card
      bg={bgColor}
      shadow="xl"
      borderRadius="xl"
      border="1px solid"
      borderColor={borderColor}
    >
      <CardHeader pb={0}>
        <Text fontSize="lg" fontWeight="medium">
          Activitate Recentă
        </Text>
      </CardHeader>

      <CardBody>
        <VStack spacing={4} align="stretch">
          {recentActivities.map((activity, index) => (
            <Box key={activity.id}>
              <HStack spacing={4} align="flex-start">
                <Box
                  p={2}
                  bg={`${getActivityColor(activity.type)}.100`}
                  color={`${getActivityColor(activity.type)}.500`}
                  borderRadius="lg"
                >
                  <Icon as={getActivityIcon(activity.type)} boxSize={5} />
                </Box>

                <VStack align="start" spacing={1} flex={1}>
                  <HStack justify="space-between" width="100%">
                    <Text fontWeight="medium">{activity.title}</Text>
                    <Text fontSize="sm" color={textColor}>
                      {formatTimestamp(activity.timestamp)}
                    </Text>
                  </HStack>

                  <Text fontSize="sm" color={textColor}>
                    {activity.description}
                  </Text>

                  <HStack spacing={2}>
                    {activity.user && (
                      <Badge colorScheme="gray" fontSize="xs">
                        {activity.user}
                      </Badge>
                    )}
                    {activity.status && (
                      <Badge
                        colorScheme={getActivityColor(activity.type)}
                        fontSize="xs"
                      >
                        {activity.status}
                      </Badge>
                    )}
                  </HStack>
                </VStack>
              </HStack>

              {index < recentActivities.length - 1 && (
                <Divider my={4} borderColor={dividerColor} />
              )}
            </Box>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );
} 