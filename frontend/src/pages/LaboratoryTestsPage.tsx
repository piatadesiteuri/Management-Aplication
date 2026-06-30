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
  VStack,
  Text,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
} from '@chakra-ui/react';
import { FaSearch, FaPlus, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

type Test = {
  id: number;
  name: string;
  code: string;
  description?: string;
  sample_type: string;
  unit?: string;
  normal_values?: string;
  estimated_duration_hours?: number;
  category_name?: string;
};

type Category = {
  id: number;
  name: string;
  code: string;
  description?: string;
};

export default function LaboratoryTestsPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const infoBoxBg = useColorModeValue('blue.50', 'blue.900');
  const infoBoxText = useColorModeValue('blue.900', 'blue.100');
  const categoryHeadingColor = useColorModeValue('blue.600', 'blue.300');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [testsResponse, categoriesResponse] = await Promise.all([
        api.get('/lims/tests'),
        api.get('/lims/test-categories')
      ]);
      setTests(testsResponse.data);
      setCategories(categoriesResponse.data);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca datele',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTests = async () => {
    try {
      setLoading(true);
      let url = '/lims/tests';
      const params: string[] = [];
      
      if (searchTerm) {
        params.push(`search=${encodeURIComponent(searchTerm)}`);
      }
      if (selectedCategory) {
        params.push(`category_id=${selectedCategory}`);
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const response = await api.get(url);
      setTests(response.data);
    } catch (error) {
      console.error('Error filtering tests:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut filtra testele',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getSampleTypeColor = (sampleType: string) => {
    const colors: Record<string, string> = {
      SANGE: 'red',
      URINA: 'yellow',
      SPUTA: 'orange',
      FECES: 'brown',
      LICHID_CEFALORAHIDIAN: 'purple',
      ALTUL: 'gray',
    };
    return colors[sampleType] || 'gray';
  };

  const getSampleTypeLabel = (sampleType: string) => {
    const labels: Record<string, string> = {
      SANGE: 'Sânge',
      URINA: 'Urină',
      SPUTA: 'Spută',
      FECES: 'Fecale',
      LICHID_CEFALORAHIDIAN: 'Lichid cefalorahidian',
      ALTUL: 'Altul',
    };
    return labels[sampleType] || sampleType;
  };

  // Nu mai filtrăm manual, datele vin deja filtrate de la backend
  const filteredTests = tests;

  return (
    <Container maxW="full" py={8}>
      <HStack mb={6}>
        <Button
          leftIcon={<FaArrowLeft />}
          variant="ghost"
          onClick={() => {
            const currentPath = window.location.pathname;
            if (currentPath.startsWith('/admin')) {
              navigate('/admin/lims');
            } else {
              navigate('/user/lims');
            }
          }}
        >
          Înapoi la LIMS
        </Button>
        <Heading size="lg" flex={1}>Teste Laborator - Catalog Complet</Heading>
      </HStack>

      <Card bg={bgColor} borderColor={borderColor} mb={6}>
        <CardBody>
          <HStack spacing={4} mb={4}>
            <InputGroup flex={1}>
              <InputLeftElement pointerEvents="none">
                <FaSearch color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Caută teste după nume sau cod..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    filterTests();
                  }
                }}
              />
            </InputGroup>
            <Button onClick={filterTests} colorScheme="blue">
              Caută
            </Button>
            {(searchTerm || selectedCategory) && (
              <Button onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                loadData();
              }} variant="outline">
                Resetează
              </Button>
            )}
            <Select
              placeholder="Toate categoriile"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value ? parseInt(e.target.value) : '');
              }}
              onBlur={filterTests}
              w="250px"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </HStack>

          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>Listă Teste ({filteredTests.length})</Tab>
              <Tab>Pe Categorii</Tab>
            </TabList>

            <TabPanels>
              {/* Tab 1: Listă completă */}
              <TabPanel>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Cod</Th>
                        <Th>Nume Test</Th>
                        <Th>Categorie</Th>
                        <Th>Tip Probă</Th>
                        <Th>Unitate</Th>
                        <Th>Durată</Th>
                        <Th>Valori Normale</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {loading ? (
                        <Tr>
                          <Td colSpan={7} textAlign="center" color={textColor}>
                            Se încarcă...
                          </Td>
                        </Tr>
                      ) : filteredTests.length === 0 ? (
                        <Tr>
                          <Td colSpan={7} textAlign="center" color={textColor}>
                            Nu s-au găsit teste
                          </Td>
                        </Tr>
                      ) : (
                        filteredTests.map((test) => (
                          <Tr key={test.id}>
                            <Td>
                              <Badge colorScheme="blue">{test.code}</Badge>
                            </Td>
                            <Td>
                              <Text fontWeight="semibold" color={textColor}>{test.name}</Text>
                              {test.description && (
                                <Text fontSize="sm" color={secondaryTextColor}>
                                  {test.description}
                                </Text>
                              )}
                            </Td>
                            <Td>
                              <Badge colorScheme="purple">
                                {test.category_name || 'N/A'}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme={getSampleTypeColor(test.sample_type)}>
                                {getSampleTypeLabel(test.sample_type)}
                              </Badge>
                            </Td>
                            <Td color={textColor}>{test.unit || <Text color={secondaryTextColor}>-</Text>}</Td>
                            <Td>
                              {test.estimated_duration_hours ? (
                                <Text color={textColor}>{test.estimated_duration_hours}h</Text>
                              ) : (
                                <Text color={secondaryTextColor}>-</Text>
                              )}
                            </Td>
                            <Td>
                              {test.normal_values ? (
                                <Text fontSize="sm" maxW="200px" isTruncated color={textColor}>
                                  {test.normal_values}
                                </Text>
                              ) : (
                                <Text color={secondaryTextColor}>-</Text>
                              )}
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </TabPanel>

              {/* Tab 2: Pe categorii */}
              <TabPanel>
                <VStack align="stretch" spacing={6}>
                  {categories.map((category) => {
                    const categoryTests = filteredTests.filter(
                      test => test.category_name === category.name
                    );
                    
                    if (categoryTests.length === 0) return null;

                    return (
                      <Box key={category.id} p={4} border="1px" borderColor={borderColor} borderRadius="md" bg={bgColor}>
                        <Heading size="md" mb={4} color={categoryHeadingColor}>
                          {category.name} ({categoryTests.length} teste)
                        </Heading>
                        {category.description && (
                          <Text fontSize="sm" color={secondaryTextColor} mb={4}>
                            {category.description}
                          </Text>
                        )}
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                          {categoryTests.map((test) => (
                            <Box
                              key={test.id}
                              p={3}
                              bg={cardBg}
                              borderRadius="md"
                              border="1px"
                              borderColor={borderColor}
                            >
                              <HStack justify="space-between" mb={2}>
                                <Text fontWeight="semibold" fontSize="sm" color={textColor}>
                                  {test.name}
                                </Text>
                                <Badge colorScheme="blue" fontSize="xs">
                                  {test.code}
                                </Badge>
                              </HStack>
                              <VStack align="stretch" spacing={1} fontSize="xs">
                                <HStack>
                                  <Text color={secondaryTextColor}>Probă:</Text>
                                  <Badge
                                    size="sm"
                                    colorScheme={getSampleTypeColor(test.sample_type)}
                                  >
                                    {getSampleTypeLabel(test.sample_type)}
                                  </Badge>
                                </HStack>
                                {test.unit && (
                                  <Text color={secondaryTextColor}>
                                    Unitate: <strong style={{ color: textColor }}>{test.unit}</strong>
                                  </Text>
                                )}
                                {test.estimated_duration_hours && (
                                  <Text color={secondaryTextColor}>
                                    Durată: <strong style={{ color: textColor }}>{test.estimated_duration_hours}h</strong>
                                  </Text>
                                )}
                                {test.normal_values && (
                                  <Box mt={1} p={2} bg={infoBoxBg} borderRadius="sm">
                                    <Text fontSize="xs" fontWeight="medium" color={infoBoxText}>
                                      Valori normale: {test.normal_values}
                                    </Text>
                                  </Box>
                                )}
                              </VStack>
                            </Box>
                          ))}
                        </SimpleGrid>
                      </Box>
                    );
                  })}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>

      <Card bg={bgColor} borderColor={borderColor}>
        <CardBody>
          <VStack align="stretch" spacing={4}>
            <Heading size="md" color={textColor}>Informații despre Teste</Heading>
            <Text color={textColor}>
              <strong>Total teste disponibile:</strong> {tests.length}
            </Text>
            <Text color={textColor}>
              <strong>Categorii:</strong> {categories.length}
            </Text>
            <Box p={4} bg={infoBoxBg} borderRadius="md" border="1px" borderColor={borderColor}>
              <Text fontWeight="semibold" mb={2} color={infoBoxText}>Cum funcționează testele?</Text>
              <Text fontSize="sm" color={infoBoxText}>
                Testele sunt stocate în baza de date și pot fi selectate la crearea unei cereri de analize.
                Fiecare test are un cod unic, tipul de probă necesar, unitatea de măsură și valorile normale de referință.
                Testele sunt organizate pe categorii pentru ușurința căutării.
              </Text>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </Container>
  );
}
