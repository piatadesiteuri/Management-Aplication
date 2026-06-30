import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Flex,
  Icon,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  useToast,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { FiFileText, FiTruck, FiCalendar, FiDownload, FiEye } from 'react-icons/fi';
import VehicleDocumentsTab from '../components/documents/VehicleDocumentsTab';
import EventDocumentsTab from '../components/documents/EventDocumentsTab';
import { useAuth } from '../hooks/useAuth';

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    vehicleDocuments: { total: 0, expired: 0, valid: 0 },
    eventDocuments: { total: 0, pending: 0, approved: 0 }
  });
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tabBg = useColorModeValue('gray.50', 'gray.700');
  const tabActiveBg = useColorModeValue('blue.500', 'blue.400');
  const headingColor = useColorModeValue('gray.800', 'white');
  const subHeadingColor = useColorModeValue('gray.600', 'gray.400');
  const tabHoverBg = useColorModeValue('gray.100', 'gray.600');

  useEffect(() => {
    loadDocumentStats();
  }, []);

  const loadDocumentStats = async () => {
    try {
      setLoading(true);
      
      // Încărcăm statisticile pentru documentele de vehicule
      const vehicleStatsResponse = await fetch('/api/documents/vehicles/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Încărcăm statisticile pentru documentele de evenimente
      const eventStatsResponse = await fetch('/api/documents/events/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (vehicleStatsResponse.ok) {
        const vehicleStats = await vehicleStatsResponse.json();
        setStats(prev => ({
          ...prev,
          vehicleDocuments: {
            total: vehicleStats.total || 0,
            expired: vehicleStats.expired || 0,
            valid: (vehicleStats.total || 0) - (vehicleStats.expired || 0)
          }
        }));
      }

      if (eventStatsResponse.ok) {
        const eventStats = await eventStatsResponse.json();
        setStats(prev => ({
          ...prev,
          eventDocuments: {
            total: eventStats.total || 0,
            pending: eventStats.pending || 0,
            approved: eventStats.approved || 0
          }
        }));
      }
    } catch (error) {
      console.error('Error loading document stats:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca statisticile documentelor',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };

  if (loading) {
    return (
      <Center minH="60vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <Container maxW="7xl" py={8}>
      {/* Header */}
      <Box mb={8}>
        <Flex align="center" mb={4}>
          <Icon as={FiFileText} w={8} h={8} color="blue.500" mr={3} />
          <Box>
            <Heading size="lg" color={headingColor}>
              Gestionare Documente
            </Heading>
            <Text color={subHeadingColor} mt={1}>
              Vizualizează și gestionează documentele atașate la vehicule și evenimente
            </Text>
          </Box>
        </Flex>

        {/* Statistici generale */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
          <Stat
            p={4}
            bg={bgColor}
            borderRadius="lg"
            border="1px solid"
            borderColor={borderColor}
          >
            <StatLabel color="gray.500" fontSize="sm">
              <Icon as={FiTruck} mr={2} />
              Documente Vehicule
            </StatLabel>
            <StatNumber color="blue.500" fontSize="2xl">
              {stats.vehicleDocuments.total}
            </StatNumber>
            <StatHelpText>
              {stats.vehicleDocuments.valid} valide, {stats.vehicleDocuments.expired} expirate
            </StatHelpText>
          </Stat>

          <Stat
            p={4}
            bg={bgColor}
            borderRadius="lg"
            border="1px solid"
            borderColor={borderColor}
          >
            <StatLabel color="gray.500" fontSize="sm">
              <Icon as={FiCalendar} mr={2} />
              Documente Evenimente
            </StatLabel>
            <StatNumber color="green.500" fontSize="2xl">
              {stats.eventDocuments.total}
            </StatNumber>
            <StatHelpText>
              {stats.eventDocuments.approved} aprobate, {stats.eventDocuments.pending} în așteptare
            </StatHelpText>
          </Stat>

          <Stat
            p={4}
            bg={bgColor}
            borderRadius="lg"
            border="1px solid"
            borderColor={borderColor}
          >
            <StatLabel color="gray.500" fontSize="sm">
              <Icon as={FiEye} mr={2} />
              Permisiuni
            </StatLabel>
            <StatNumber color="purple.500" fontSize="2xl">
              {user?.roles.includes('SUPER_ADMIN') || user?.roles.includes('ADMIN') ? 'Complete' : 'Limită'}
            </StatNumber>
            <StatHelpText>
              {user?.roles.includes('SUPER_ADMIN') || user?.roles.includes('ADMIN') 
                ? 'Vizualizare și editare' 
                : 'Doar vizualizare'}
            </StatHelpText>
          </Stat>

          <Stat
            p={4}
            bg={bgColor}
            borderRadius="lg"
            border="1px solid"
            borderColor={borderColor}
          >
            <StatLabel color="gray.500" fontSize="sm">
              <Icon as={FiDownload} mr={2} />
              Descărcări
            </StatLabel>
            <StatNumber color="orange.500" fontSize="2xl">
              Disponibile
            </StatNumber>
            <StatHelpText>
              Toate documentele pot fi descărcate
            </StatHelpText>
          </Stat>
        </SimpleGrid>
      </Box>

      {/* Tab-uri principale */}
      <Box
        bg={bgColor}
        borderRadius="xl"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
        boxShadow="lg"
      >
        <Tabs 
          index={activeTab} 
          onChange={handleTabChange}
          variant="enclosed"
          colorScheme="blue"
        >
          <TabList bg={tabBg} px={6} pt={6}>
            <Tab
              _selected={{
                bg: tabActiveBg,
                color: 'white',
                borderBottomColor: tabActiveBg,
              }}
              _hover={{
                bg: tabHoverBg,
              }}
              borderRadius="lg"
              mr={4}
              mb={-1}
            >
              <Flex align="center">
                <Icon as={FiTruck} mr={2} />
                <Text>Documente Vehicule</Text>
                <Badge ml={2} colorScheme="blue" variant="solid" borderRadius="full">
                  {stats.vehicleDocuments.total}
                </Badge>
              </Flex>
            </Tab>
            
            <Tab
              _selected={{
                bg: tabActiveBg,
                color: 'white',
                borderBottomColor: tabActiveBg,
              }}
              _hover={{
                bg: tabHoverBg,
              }}
              borderRadius="lg"
              mb={-1}
            >
              <Flex align="center">
                <Icon as={FiCalendar} mr={2} />
                <Text>Documente Evenimente</Text>
                <Badge ml={2} colorScheme="green" variant="solid" borderRadius="full">
                  {stats.eventDocuments.total}
                </Badge>
              </Flex>
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={6}>
              <VehicleDocumentsTab 
                onStatsUpdate={loadDocumentStats}
                user={user}
              />
            </TabPanel>
            
            <TabPanel p={6}>
              <EventDocumentsTab 
                onStatsUpdate={loadDocumentStats}
                user={user}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
} 