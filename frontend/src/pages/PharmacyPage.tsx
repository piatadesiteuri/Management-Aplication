import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Heading,
  HStack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Badge,
  useToast,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useDisclosure,
} from '@chakra-ui/react';
import { FaPlus, FaCog, FaBox, FaFileInvoice, FaPrescription, FaExchangeAlt, FaFlask, FaWarehouse, FaFileExport, FaFileAlt, FaList } from 'react-icons/fa';
import api from '../services/api';
import PharmacyConfiguration from '../components/pharmacy/PharmacyConfiguration';
import EntryNotes from '../components/pharmacy/EntryNotes';
import Registers from '../components/pharmacy/Registers';
import Prescriptions from '../components/pharmacy/Prescriptions';
import TransferNotes from '../components/pharmacy/TransferNotes';
import Elaborations from '../components/pharmacy/Elaborations';
import CurrentStock from '../components/pharmacy/CurrentStock';
import StockInitialization from '../components/pharmacy/StockInitialization';
import CJASExport from '../components/pharmacy/CJASExport';
import ProductSheet from '../components/pharmacy/ProductSheet';
import StockMovements from '../components/pharmacy/StockMovements';

export default function PharmacyPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  // Culori pentru dark mode
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Aici vom încărca datele pentru fiecare tab
      // Pentru moment, doar setăm loading la false
      setLoading(false);
    } catch (error) {
      console.error('Error loading pharmacy data:', error);
      setLoading(false);
    }
  };

  return (
    <Container maxW="full" py={8}>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Modul Farmacie</Heading>
      </HStack>

      <Card bg={cardBg} borderColor={borderColor}>
        <CardBody>
          <Tabs variant="enclosed" colorScheme="blue" index={activeTab} onChange={setActiveTab}>
            <TabList>
              <Tab>
                <HStack spacing={2}>
                  <FaCog />
                  <span>Configurare</span>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <FaFileInvoice />
                  <span>Note de Intrare</span>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <FaFileAlt />
                  <span>Condici</span>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <FaPrescription />
                  <span>Rețete</span>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <FaExchangeAlt />
                  <span>Note de Transfer</span>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <FaFlask />
                  <span>Elaborări</span>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <FaWarehouse />
                  <span>Stoc Curent</span>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <FaBox />
                  <span>Inițializare Stoc</span>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <FaFileExport />
                  <span>Export CJAS</span>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <FaFileAlt />
                  <span>Fișa Mărfii</span>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <FaList />
                  <span>Mișcări Stoc</span>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* Tab 1: Configurare */}
              <TabPanel>
                <PharmacyConfiguration />
              </TabPanel>

              {/* Tab 2: Note de Intrare */}
              <TabPanel>
                <EntryNotes />
              </TabPanel>

              {/* Tab 3: Condici */}
              <TabPanel>
                <Registers />
              </TabPanel>

              {/* Tab 4: Rețete */}
              <TabPanel>
                <Prescriptions />
              </TabPanel>

              {/* Tab 5: Note de Transfer */}
              <TabPanel>
                <TransferNotes />
              </TabPanel>

              {/* Tab 6: Elaborări */}
              <TabPanel>
                <Elaborations />
              </TabPanel>

              {/* Tab 7: Stoc Curent */}
              <TabPanel>
                <CurrentStock />
              </TabPanel>

              {/* Tab 8: Inițializare Stoc */}
              <TabPanel>
                <StockInitialization />
              </TabPanel>

              {/* Tab 9: Export CJAS */}
              <TabPanel>
                <CJASExport />
              </TabPanel>

              {/* Tab 10: Fișa Mărfii */}
              <TabPanel>
                <ProductSheet />
              </TabPanel>

              {/* Tab 11: Mișcări Stoc */}
              <TabPanel>
                <StockMovements />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    </Container>
  );
}
