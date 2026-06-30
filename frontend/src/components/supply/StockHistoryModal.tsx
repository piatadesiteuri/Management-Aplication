import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Divider,
  Progress,
} from '@chakra-ui/react';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiRotateCcw, 
  FiArrowRight,
  FiUser,
  FiCalendar,
  FiFileText,
  FiDollarSign,
  FiPackage,
  FiMapPin,
  FiClock
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { SupplyService } from '../../services/supply/SupplyService';
import { StockMovement, StockMovementType } from '../../types/supply';

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryId: number;
  productName: string;
  productCode: string;
  productUnit: string;
  currentStock: number;
}

const movementTypeColors = {
  'IN': 'green',
  'OUT': 'red',
  'ADJUSTMENT': 'blue',
  'TRANSFER': 'purple',
};

const movementTypeLabels = {
  'IN': 'Intrare',
  'OUT': 'Ieșire',
  'ADJUSTMENT': 'Ajustare',
  'TRANSFER': 'Transfer',
};

const movementTypeIcons = {
  'IN': FiTrendingUp,
  'OUT': FiTrendingDown,
  'ADJUSTMENT': FiRotateCcw,
  'TRANSFER': FiArrowRight,
};

export default function StockHistoryModal({
  isOpen,
  onClose,
  inventoryId,
  productName,
  productCode,
  productUnit,
  currentStock,
}: StockHistoryModalProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supplyService = new SupplyService();

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (isOpen) {
      loadMovements();
    }
  }, [isOpen, inventoryId]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supplyService.getStockMovements(inventoryId);
      setMovements(data);
    } catch (err: any) {
      console.error('Error loading stock movements:', err);
      setError('Nu s-au putut încărca mișcările de stoc');
    } finally {
      setLoading(false);
    }
  };

  const getMovementIcon = (type: StockMovementType) => {
    return movementTypeIcons[type] || FiPackage;
  };

  const calculateRunningStock = () => {
    let runningStock = currentStock;
    const movementsWithStock = movements.map((movement, index) => {
      const movementWithStock = {
        ...movement,
        stockAfter: runningStock,
      };
      
      // Calculate stock before this movement (reverse calculation)
      if (movement.type === 'IN') {
        runningStock -= movement.quantity;
      } else if (movement.type === 'OUT') {
        runningStock += movement.quantity;
      } else if (movement.type === 'ADJUSTMENT') {
        // For adjustments, we need to calculate differently
        // This is approximate since we don't have the exact before/after in the data
        runningStock = movement.quantity;
      }
      
      return {
        ...movementWithStock,
        stockBefore: runningStock,
      };
    });
    
    return movementsWithStock.reverse(); // Show chronological order
  };

  const movementsWithStock = calculateRunningStock();

  const totalIncoming = movements
    .filter(m => m.type === 'IN')
    .reduce((sum, m) => sum + m.quantity, 0);

  const totalOutgoing = movements
    .filter(m => m.type === 'OUT' || m.type === 'TRANSFER')
    .reduce((sum, m) => sum + m.quantity, 0);

  const totalAdjustments = movements
    .filter(m => m.type === 'ADJUSTMENT')
    .length;

  const totalValue = movements
    .filter(m => m.type === 'IN')
    .reduce((sum, m) => sum + (m.total_cost || 0), 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="6xl"
      motionPreset="slideInBottom"
      scrollBehavior="inside"
    >
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent borderRadius="xl" maxH="90vh">
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <HStack>
              <Icon as={FiClock} color="blue.500" />
              <Text>Istoric Mișcări Stoc</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="blue" px={2} py={1}>
                {productCode}
              </Badge>
              <Text fontSize="md" color={textColor}>
                {productName}
              </Text>
            </HStack>
          </VStack>
        </ModalHeader>

        <ModalBody>
          <VStack spacing={6}>
            {/* Statistici Generale */}
            <Box w="full" p={4} bg={cardBg} borderRadius="lg">
              <Text fontSize="lg" fontWeight="semibold" mb={4}>
                Statistici Generale
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                <Stat>
                  <StatLabel>
                    <HStack>
                      <Icon as={FiTrendingUp} color="green.500" />
                      <Text>Total Intrări</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber color="green.500">
                    {totalIncoming} {productUnit}
                  </StatNumber>
                  <StatHelpText>
                    {movements.filter(m => m.type === 'IN').length} operațiuni
                  </StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel>
                    <HStack>
                      <Icon as={FiTrendingDown} color="red.500" />
                      <Text>Total Ieșiri</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber color="red.500">
                    {totalOutgoing} {productUnit}
                  </StatNumber>
                  <StatHelpText>
                    {movements.filter(m => m.type === 'OUT' || m.type === 'TRANSFER').length} operațiuni
                  </StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel>
                    <HStack>
                      <Icon as={FiRotateCcw} color="blue.500" />
                      <Text>Ajustări</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber color="blue.500">
                    {totalAdjustments}
                  </StatNumber>
                  <StatHelpText>Corecții inventar</StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel>
                    <HStack>
                      <Icon as={FiDollarSign} color="purple.500" />
                      <Text>Valoare Intrări</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber color="purple.500">
                    {new Intl.NumberFormat('ro-RO', {
                      style: 'currency',
                      currency: 'RON'
                    }).format(totalValue)}
                  </StatNumber>
                  <StatHelpText>Cost total achiziții</StatHelpText>
                </Stat>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Tabel Mișcări */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="semibold" mb={4}>
                Istoric Detaliat Mișcări
              </Text>
              
              {loading ? (
                <Box textAlign="center" py={8}>
                  <Spinner size="lg" />
                  <Text mt={4}>Se încarcă istoricul...</Text>
                </Box>
              ) : error ? (
                <Alert status="error" borderRadius="lg">
                  <AlertIcon />
                  {error}
                </Alert>
              ) : movements.length === 0 ? (
                <Box textAlign="center" py={8} bg={cardBg} borderRadius="lg">
                  <Icon as={FiPackage} size={48} color="gray.400" />
                  <Text mt={4} fontSize="lg" color={textColor}>
                    Nu există mișcări înregistrate
                  </Text>
                  <Text color={textColor}>
                    Istoricul va fi afișat după prima mișcare de stoc
                  </Text>
                </Box>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple" bg={bgColor} borderRadius="lg">
                    <Thead bg={cardBg}>
                      <Tr>
                        <Th>Data & Ora</Th>
                        <Th>Tip</Th>
                        <Th>Cantitate</Th>
                        <Th>Cost Unitar</Th>
                        <Th>Valoare</Th>
                        <Th>Stoc Înainte</Th>
                        <Th>Stoc După</Th>
                        <Th>Document</Th>
                        <Th>Motiv</Th>
                        <Th>Operator</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {movementsWithStock.map((movement) => {
                        const MovementIcon = getMovementIcon(movement.type);
                        
                        return (
                          <Tr key={movement.id}>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontSize="sm" fontWeight="semibold">
                                  {new Date(movement.movement_date).toLocaleDateString('ro-RO')}
                                </Text>
                                <Text fontSize="xs" color={textColor}>
                                  {new Date(movement.created_at).toLocaleTimeString('ro-RO')}
                                </Text>
                              </VStack>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={movementTypeColors[movement.type]}
                                px={2}
                                py={1}
                              >
                                <HStack spacing={1}>
                                  <MovementIcon size={12} />
                                  <Text>{movementTypeLabels[movement.type]}</Text>
                                </HStack>
                              </Badge>
                            </Td>
                            <Td>
                              <Text 
                                fontWeight="semibold"
                                color={movement.type === 'IN' ? 'green.500' : 'red.500'}
                              >
                                {movement.type === 'IN' ? '+' : movement.type === 'OUT' ? '-' : ''}
                                {Math.abs(movement.quantity)} {productUnit}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {movement.unit_cost ? 
                                  new Intl.NumberFormat('ro-RO', {
                                    style: 'currency',
                                    currency: 'RON'
                                  }).format(movement.unit_cost) : '-'
                                }
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm" fontWeight="semibold">
                                {movement.total_cost ? 
                                  new Intl.NumberFormat('ro-RO', {
                                    style: 'currency',
                                    currency: 'RON'
                                  }).format(movement.total_cost) : '-'
                                }
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {movement.stockBefore} {productUnit}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm" fontWeight="semibold">
                                {movement.stockAfter} {productUnit}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="xs" color={textColor}>
                                {movement.reference_document || '-'}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="xs" color={textColor}>
                                {movement.reason || '-'}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="xs" color={textColor}>
                                {movement.performed_by || '-'}
                              </Text>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Închide
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 