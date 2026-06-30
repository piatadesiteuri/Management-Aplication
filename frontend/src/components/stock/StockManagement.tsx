import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Icon,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Textarea,
  SimpleGrid,
  Card,
  CardBody,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  TableContainer,
  Progress,
  Spinner,
  Center
} from '@chakra-ui/react';
import { FiPackage, FiTrendingUp, FiTrendingDown, FiAlertTriangle, FiDollarSign, FiChevronDown } from 'react-icons/fi';
import { StockService, StockItem, StockHistoryItem, StockAlert, NotificationItem } from '../../services/StockService';
import { useAuth } from '../../hooks/useAuth';

const StockManagement: React.FC = () => {
  const { user } = useAuth();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<StockItem | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [changeType, setChangeType] = useState<'IN' | 'OUT' | 'ADJUSTMENT' | 'LOSS' | 'EXPIRED'>('ADJUSTMENT');
  const [stockHistory] = useState<StockHistoryItem[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  
  // State pentru referat cerere
  const [requestProduct, setRequestProduct] = useState<StockItem | null>(null);
  const [requestQuantity, setRequestQuantity] = useState<number>(0);
  const [requestReason, setRequestReason] = useState<string>('');
  const [requestPriority, setRequestPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isRequestOpen, onOpen: onRequestOpen, onClose: onRequestClose } = useDisclosure();
  
  const cardBgColor = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const stockService = new StockService();
      const [stockData, alertsData, notificationsData, statsData] = await Promise.all([
        stockService.getStockItems(),
        StockService.getStockAlerts(),
        StockService.getNotifications(),
        StockService.getStockStatistics()
      ]);
      
      setStockItems(stockData);
      setStockAlerts(alertsData);
      setNotifications(notificationsData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Error loading stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async () => {
    if (!selectedProduct) return;
    
    try {
      await StockService.updateStock(
        selectedProduct.product_id,
        selectedProduct.supplier_id,
        newStock,
        reason
      );
      
      // Reload data
      await loadData();
      onClose();
      
      // Reset form
      setNewStock(0);
      setReason('');
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const openStockUpdateModal = (item: StockItem) => {
    setSelectedProduct(item);
    setNewStock(item.current_stock);
    onOpen();
  };

  const handleCreateRequest = async () => {
    if (!requestProduct || requestQuantity <= 0) return;
    
    try {
      // Creează cererea de materiale
      const requestData = {
        product_id: requestProduct.id,
        supplier_id: requestProduct.supplier_id,
        quantity_requested: requestQuantity,
        priority: requestPriority,
        reason: requestReason,
        requester_id: user?.id
      };
      
      // TODO: Implementare API call pentru creare cerere
      console.log('Creating material request:', requestData);
      
      // Simulez crearea cererii
      const response = await fetch('/api/material-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        // Trimite notificare inspectorului
        await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
          },
          body: JSON.stringify({
            type: 'MATERIAL_REQUEST',
            message: `Nouă cerere de materiale: ${requestProduct.product_name} (${requestQuantity} ${requestProduct.unit})`,
            priority: requestPriority,
            data: {
              request_id: 'new_request_id',
              product_name: requestProduct.product_name,
              quantity: requestQuantity,
              requester: user?.first_name + ' ' + user?.last_name
            }
          })
        });
        
        // Reset form
        setRequestProduct(null);
        setRequestQuantity(0);
        setRequestReason('');
        setRequestPriority('MEDIUM');
        onRequestClose();
        
        // Reload data
        await loadData();
        
        // Afișează mesaj de succes
        alert('✅ Cererea a fost creată cu succes! Inspectorul va fi notificat.');
      } else {
        throw new Error('Eroare la crearea cererii');
      }
    } catch (error) {
      console.error('Error creating request:', error);
      alert('❌ Eroare la crearea cererii. Te rog să încerci din nou.');
    }
  };

  const getStockStatusColor = (current: number, min: number) => {
    if (current === 0) return 'red';
    if (current <= min) return 'orange';
    if (current <= min * 1.5) return 'yellow';
    return 'green';
  };

  const getStockStatusText = (current: number, min: number) => {
    if (current === 0) return 'Stoc epuizat';
    if (current <= min) return 'Stoc scăzut';
    if (current <= min * 1.5) return 'Stoc limitat';
    return 'Stoc normal';
  };

  if (loading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Se încarcă datele stocului...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2} color={textColor}>
            <Icon as={FiPackage} mr={3} />
            Gestionare Stoc
          </Heading>
          <Text color={mutedTextColor}>
            Gestionează stocul produselor și urmărește livrările
          </Text>
        </Box>

        {/* Dropdown Gestionare Stoc */}
        <HStack spacing={4} justify="flex-end">
          <Menu>
            <MenuButton as={Button} colorScheme="blue" rightIcon={<Icon as={FiChevronDown} />}>
              <Icon as={FiPackage} mr={2} />
              Gestionare Stoc
            </MenuButton>
            <MenuList>
              <MenuItem 
                icon={<Icon as={FiTrendingUp} color="green.500" />}
                onClick={() => {/* TODO: Implementare intrare stoc */}}
              >
                + Intrare Stoc
              </MenuItem>
              <MenuItem 
                icon={<Icon as={FiTrendingDown} color="red.500" />}
                onClick={() => {/* TODO: Implementare ieșire stoc */}}
              >
                - Ieșire Stoc
              </MenuItem>
              <MenuItem 
                icon={<Icon as={FiAlertTriangle} color="blue.500" />}
                onClick={onRequestOpen}
              >
                📋 Referat Cerere
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>

        {/* Statistici */}
        {statistics && (
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <Card bg={cardBgColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Produse</StatLabel>
                  <StatNumber>{statistics.total_products}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    în stoc
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBgColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Valoare Totală</StatLabel>
                  <StatNumber>{statistics.total_value.toFixed(2)} lei</StatNumber>
                  <StatHelpText>
                    <Icon as={FiDollarSign} />
                    inventar
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBgColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Stoc Scăzut</StatLabel>
                  <StatNumber color="orange.500">{statistics.low_stock_count}</StatNumber>
                  <StatHelpText>
                    <Icon as={FiAlertTriangle} />
                    produse
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBgColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Stoc Epuizat</StatLabel>
                  <StatNumber color="red.500">{statistics.out_of_stock_count}</StatNumber>
                  <StatHelpText>
                    <Icon as={FiAlertTriangle} />
                    produse
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        {/* Alerte */}
        {stockAlerts.length > 0 && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Atenție! Stoc scăzut</AlertTitle>
              <AlertDescription>
                {stockAlerts.length} produse au stoc scăzut sau epuizat
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Tabs pentru diferite secțiuni */}
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Stoc Actual</Tab>
            <Tab>Istoric Stoc</Tab>
            <Tab>Notificări</Tab>
          </TabList>

          <TabPanels>
            {/* Tab Stoc Actual */}
            <TabPanel px={0}>
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Produs</Th>
                      <Th>Furnizor</Th>
                      <Th>Stoc Actual</Th>
                      <Th>Stoc Min</Th>
                      <Th>Status</Th>
                      <Th>Preț Unit</Th>
                      <Th>Acțiuni</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {stockItems.map((item) => (
                      <Tr key={item.id}>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold">{item.product_name}</Text>
                            <Text fontSize="sm" color={mutedTextColor}>
                              ID: {item.product_id}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>{item.supplier_name}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <Text fontWeight="bold">{item.current_stock}</Text>
                            <Progress
                              value={(item.current_stock / item.max_stock_level) * 100}
                              colorScheme={getStockStatusColor(item.current_stock, item.min_stock_level)}
                              size="sm"
                              width="60px"
                            />
                          </HStack>
                        </Td>
                        <Td>{item.min_stock_level}</Td>
                        <Td>
                          <Badge
                            colorScheme={getStockStatusColor(item.current_stock, item.min_stock_level)}
                            variant="solid"
                          >
                            {getStockStatusText(item.current_stock, item.min_stock_level)}
                          </Badge>
                        </Td>
                        <Td>{item.unit_price.toFixed(2)} lei</Td>
                        <Td>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            variant="outline"
                            onClick={() => openStockUpdateModal(item)}
                          >
                            Actualizează
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Tab Istoric Stoc */}
            <TabPanel px={0}>
              <Text mb={4} color={mutedTextColor}>
                Istoricul modificărilor de stoc pentru ultimele 50 de operații
              </Text>
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Produs</Th>
                      <Th>Tip Schimbare</Th>
                      <Th>Cantitate</Th>
                      <Th>Stoc Anterior</Th>
                      <Th>Stoc Nou</Th>
                      <Th>Motiv</Th>
                      <Th>Data</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {stockHistory.map((item) => (
                      <Tr key={item.id}>
                        <Td>{item.product_name}</Td>
                        <Td>
                          <Badge
                            colorScheme={
                              item.change_type === 'IN' ? 'green' :
                              item.change_type === 'OUT' ? 'red' :
                              item.change_type === 'ADJUSTMENT' ? 'blue' :
                              item.change_type === 'LOSS' ? 'orange' : 'gray'
                            }
                            variant="solid"
                          >
                            {item.change_type}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            {item.change_type === 'IN' ? (
                              <Icon as={FiTrendingUp} color="green.500" />
                            ) : (
                              <Icon as={FiTrendingDown} color="red.500" />
                            )}
                            <Text>{item.quantity_change}</Text>
                          </HStack>
                        </Td>
                        <Td>{item.previous_stock}</Td>
                        <Td>{item.new_stock}</Td>
                        <Td>{item.reason}</Td>
                        <Td>{new Date(item.created_at).toLocaleDateString('ro-RO')}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Tab Notificări */}
            <TabPanel px={0}>
              <VStack spacing={4} align="stretch">
                {notifications.map((notification) => (
                  <Card key={notification.id} bg={cardBgColor}>
                    <CardBody>
                      <HStack justify="space-between" align="start">
                        <VStack align="start" spacing={2}>
                          <HStack spacing={2}>
                            <Text fontWeight="semibold">{notification.title}</Text>
                            <Badge
                              colorScheme={
                                notification.priority === 'URGENT' ? 'red' :
                                notification.priority === 'HIGH' ? 'orange' :
                                notification.priority === 'MEDIUM' ? 'blue' : 'gray'
                              }
                              variant="solid"
                            >
                              {notification.priority}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color={mutedTextColor}>
                            {notification.message}
                          </Text>
                          <Text fontSize="xs" color={mutedTextColor}>
                            {new Date(notification.created_at).toLocaleString('ro-RO')}
                          </Text>
                        </VStack>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          onClick={() => StockService.markNotificationAsRead(notification.id)}
                        >
                          Marchează ca citit
                        </Button>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Modal pentru actualizarea stocului */}
        <Modal isOpen={isOpen} onClose={onClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Actualizează Stoc</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedProduct && (
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontWeight="semibold">{selectedProduct.product_name}</Text>
                    <Text fontSize="sm" color={mutedTextColor}>
                      Furnizor: {selectedProduct.supplier_name}
                    </Text>
                  </Box>
                  
                  <FormControl>
                    <FormLabel>Tip Schimbare</FormLabel>
                    <Select value={changeType} onChange={(e) => setChangeType(e.target.value as any)}>
                      <option value="IN">Intrare</option>
                      <option value="OUT">Ieșire</option>
                      <option value="ADJUSTMENT">Ajustare</option>
                      <option value="LOSS">Pierdere</option>
                      <option value="EXPIRED">Expirat</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Stoc Nou</FormLabel>
                    <NumberInput
                      value={newStock}
                      onChange={(valueString) => setNewStock(parseInt(valueString) || 0)}
                      min={0}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Motiv</FormLabel>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Descrie motivul modificării stocului..."
                    />
                  </FormControl>
                  
                  <HStack spacing={3}>
                    <Button colorScheme="blue" onClick={handleStockUpdate}>
                      Actualizează
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                      Anulează
                    </Button>
                  </HStack>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Modal pentru referat cerere */}
        <Modal isOpen={isRequestOpen} onClose={onRequestClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>📋 Referat Cerere Materiale</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Selectează Produs</FormLabel>
                  <Select 
                    placeholder="Alege produsul pentru care faci cererea..."
                    value={requestProduct?.id || ''}
                    onChange={(e) => {
                      const productId = parseInt(e.target.value);
                      const product = stockItems.find(p => p.id === productId);
                      setRequestProduct(product || null);
                    }}
                  >
                    {stockItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.product_name} - Stoc curent: {item.current_stock} {item.unit}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                {requestProduct && (
                  <>
                    <Box p={4} bg={cardBgColor} borderRadius="md">
                      <Text fontWeight="semibold">{requestProduct.product_name}</Text>
                      <Text fontSize="sm" color={mutedTextColor}>
                        Furnizor: {requestProduct.supplier_name}
                      </Text>
                      <Text fontSize="sm" color={mutedTextColor}>
                        Stoc curent: {requestProduct.current_stock} {requestProduct.unit}
                      </Text>
                      <Text fontSize="sm" color={mutedTextColor}>
                        Stoc minim: {requestProduct.min_stock_level} {requestProduct.unit}
                      </Text>
                    </Box>

                    <FormControl>
                      <FormLabel>Cantitate Cerută</FormLabel>
                      <NumberInput
                        value={requestQuantity}
                        onChange={(valueString) => setRequestQuantity(parseInt(valueString) || 0)}
                        min={1}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Prioritate</FormLabel>
                      <Select 
                        value={requestPriority} 
                        onChange={(e) => setRequestPriority(e.target.value as any)}
                      >
                        <option value="LOW">Scăzută</option>
                        <option value="MEDIUM">Medie</option>
                        <option value="HIGH">Ridicată</option>
                        <option value="URGENT">Urgentă</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Motivul Cererii</FormLabel>
                      <Textarea
                        value={requestReason}
                        onChange={(e) => setRequestReason(e.target.value)}
                        placeholder="Descrie motivul pentru care ai nevoie de acest produs..."
                        rows={3}
                      />
                    </FormControl>

                    <HStack spacing={3}>
                      <Button colorScheme="blue" onClick={handleCreateRequest}>
                        📋 Creează Cerere
                      </Button>
                      <Button variant="outline" onClick={onRequestClose}>
                        Anulează
                      </Button>
                    </HStack>
                  </>
                )}
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default StockManagement;
