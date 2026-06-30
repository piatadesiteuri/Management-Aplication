import {
  Box,
  Container,
  Heading,
  Text,
  useColorModeValue,
  SimpleGrid,
  VStack,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { FiUser } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import KPICards from './KPICards';
import StatisticsChart from './StatisticsChart';
import ActivityFeed from './ActivityFeed';
import AlertsPanel from './AlertsPanel';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  console.log('📊 Dashboard rendered:', {
    user,
    isAuthenticated,
    userName: user?.name,
  });

  return (
    <Box bg={bgColor} minH="calc(100vh - 64px)" py={8}>
      <Container maxW="7xl">
        {/* Header */}
        <VStack align="start" spacing={1} mb={8}>
          <HStack spacing={3}>
            <Icon as={FiUser} boxSize={6} color="brand.500" />
            <Heading size="lg">
              Bine ai venit, {user?.name || 'Administrator'}!
            </Heading>
          </HStack>
          <Text color={textColor} fontSize="lg">
            Aici aveți o privire de ansamblu asupra activității DSP Dolj
          </Text>
        </VStack>

        {/* KPI Cards */}
        <Box mb={8}>
          <KPICards role={user?.roles?.[0] as any} />
            </Box>

        {/* Main Content Grid */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} mb={8}>
          {/* Left Column */}
          <VStack spacing={8} align="stretch">
            {/* Statistics Chart */}
              <StatisticsChart />

            {/* Activity Feed */}
            <ActivityFeed />
          </VStack>

          {/* Right Column */}
          <VStack spacing={8} align="stretch">
            {/* Alerts Panel */}
            <AlertsPanel />
          </VStack>
        </SimpleGrid>
      </Container>
    </Box>
  );
} 