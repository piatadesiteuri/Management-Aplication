import { useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Box,
    Text,
    HStack,
    VStack,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Select,
    useToast,
    Spinner,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Heading,
    useColorModeValue,
    Tooltip,
    FormControl,
    FormLabel
} from '@chakra-ui/react';
import { FiTruck, FiDownload } from 'react-icons/fi';
import { FuelConsumptionService } from '../../services/FuelConsumptionService';
import { FuelConsumptionExportService, FuelConsumptionData } from '../../services/FuelConsumptionExportService.js';

interface FuelConsumptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}


export default function FuelConsumptionModal({ isOpen, onClose }: FuelConsumptionModalProps) {
    const [selectedMonth, setSelectedMonth] = useState<string>(
        new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : `${new Date().getMonth() + 1}`
    );
    const [selectedYear, setSelectedYear] = useState<string>(
        new Date().getFullYear().toString()
    );
    const [selectedFuelType, setSelectedFuelType] = useState<'motorina' | 'benzina'>('motorina');
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const bgColor = useColorModeValue('white', 'gray.800');

    // Nu mai încarcă automat datele - doar când utilizatorul apasă "Caută"

    const loadMonthlyData = async () => {
        setLoading(true);
        try {
            const data = await FuelConsumptionService.getMonthlyFuelConsumption(
                selectedYear, 
                selectedMonth, 
                selectedFuelType
            );
            setMonthlyData(data);
        } catch (error) {
            console.error('Error loading monthly data:', error);
            toast({
                title: 'Eroare',
                description: 'Nu s-au putut încărca datele lunare',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            setMonthlyData([]);
        } finally {
            setLoading(false);
        }
    };


    const exportToExcel = () => {
        try {
            // Pregătește datele pentru export
            const exportData: FuelConsumptionData = {
                month: selectedMonth,
                year: selectedYear,
                fuelType: selectedFuelType,
                vehicles: monthlyData.map((vehicle) => ({
                    registrationNumber: vehicle.registration_number || '',
                    driverName: `${vehicle.first_name} ${vehicle.last_name}` || '',
                    startFuelLiters: Number(vehicle.start_month_fuel_liters) || 0,
                    startFuelLei: Number(vehicle.start_month_fuel_lei) || 0,
                    fuelAddedLiters: Number(vehicle.total_fuel_added_liters) || 0,
                    fuelAddedLei: Number(vehicle.total_fuel_added_lei) || 0,
                    totalFuelLiters: (Number(vehicle.start_month_fuel_liters) || 0) + (Number(vehicle.total_fuel_added_liters) || 0),
                    totalFuelLei: (Number(vehicle.start_month_fuel_lei) || 0) + (Number(vehicle.total_fuel_added_lei) || 0),
                    fuelConsumedLiters: Number(vehicle.total_fuel_consumed_liters) || 0,
                    fuelConsumedLei: Number(vehicle.total_fuel_consumed_lei) || 0,
                    endFuelLiters: Number(vehicle.end_month_fuel_liters) || 0,
                    endFuelLei: Number(vehicle.end_month_fuel_lei) || 0
                }))
            };

            // Exportă la Excel
            FuelConsumptionExportService.exportToExcel(exportData);
            
            toast({
                title: 'Succes',
                description: 'Fișierul Excel a fost generat cu succes',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast({
                title: 'Eroare',
                description: 'Nu s-a putut genera fișierul Excel',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleClose = () => {
        setMonthlyData([]);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="full" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent bg={bgColor}>
                <ModalHeader>
                    <HStack spacing={4}>
                        <FiTruck size={24} />
                        <VStack align="start" spacing={0}>
                            <Heading size="md">Centralizator Consum Motorină</Heading>
                            <Text fontSize="sm" color="gray.500">
                                Gestionare zilnică consum motorină
                            </Text>
                        </VStack>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton />
                
                <ModalBody pb={6}>
                    {loading ? (
                        <Box textAlign="center" py={8}>
                            <Spinner size="xl" />
                            <Text mt={4}>Se încarcă datele...</Text>
                        </Box>
                    ) : (
                        <VStack spacing={6} align="stretch">
                            {/* Header cu controale pentru selecție */}
                            <HStack justify="space-between" p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                                <HStack spacing={4}>
                                    <FormControl width="120px">
                                        <FormLabel fontSize="sm">Luna:</FormLabel>
                                        <Select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                            size="sm"
                                        >
                                            <option value="01">Ianuarie</option>
                                            <option value="02">Februarie</option>
                                            <option value="03">Martie</option>
                                            <option value="04">Aprilie</option>
                                            <option value="05">Mai</option>
                                            <option value="06">Iunie</option>
                                            <option value="07">Iulie</option>
                                            <option value="08">August</option>
                                            <option value="09">Septembrie</option>
                                            <option value="10">Octombrie</option>
                                            <option value="11">Noiembrie</option>
                                            <option value="12">Decembrie</option>
                                        </Select>
                                    </FormControl>
                                    <FormControl width="100px">
                                        <FormLabel fontSize="sm">Anul:</FormLabel>
                                        <Select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                            size="sm"
                                        >
                                            <option value="2023">2023</option>
                                            <option value="2024">2024</option>
                                            <option value="2025">2025</option>
                                            <option value="2026">2026</option>
                                        </Select>
                                    </FormControl>
                                    <FormControl width="120px">
                                        <FormLabel fontSize="sm">Tip combustibil:</FormLabel>
                                        <Select
                                            value={selectedFuelType}
                                            onChange={(e) => setSelectedFuelType(e.target.value as 'motorina' | 'benzina')}
                                            size="sm"
                                        >
                                            <option value="motorina">Motorină</option>
                                            <option value="benzina">Benzină</option>
                                        </Select>
                                    </FormControl>
                                    <Button
                                        onClick={loadMonthlyData}
                                        isLoading={loading}
                                        colorScheme="blue"
                                        size="sm"
                                        mt={6}
                                    >
                                        Caută
                                    </Button>
                                </HStack>
                                
                                <HStack spacing={2}>
                                    <Tooltip label="Export Excel - Centralizator Consum">
                                        <Button
                                            leftIcon={<FiDownload />}
                                            onClick={exportToExcel}
                                            colorScheme="blue"
                                            size="sm"
                                        >
                                            Export Excel
                                        </Button>
                                    </Tooltip>
                                </HStack>
                            </HStack>

                            {/* Tabel cu datele lunare */}
                            {monthlyData.length > 0 ? (
                                <Box overflowX="auto">
                                    <Table variant="simple" size="sm">
                                        <Thead>
                                            <Tr>
                                                <Th>Nr.Crt</Th>
                                                <Th>Nr. Înmatriculare</Th>
                                                <Th>Nume Prenume Șofer</Th>
                                                <Th>Rest în rezervor la începutul lunii (litri)</Th>
                                                <Th>Rest în rezervor la începutul lunii (lei)</Th>
                                                <Th>Carburant alimentat (litri)</Th>
                                                <Th>Valoare carburant alimentat (lei)</Th>
                                                <Th>Total carburant /lună (litri)</Th>
                                                <Th>Total carburant /lună (lei)</Th>
                                                <Th>Carburant consumat /lună (litri)</Th>
                                                <Th>Valoare totală carburant consumat (lei)</Th>
                                                <Th>Rest în rezervor la sfârșitul lunii (litri)</Th>
                                                <Th>Rest în rezervor la sfârșitul lunii (lei)</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {monthlyData.map((vehicle, index) => (
                                                <Tr key={`${vehicle.vehicle_id}-${index}`}>
                                                    <Td fontWeight="bold">{index + 1}</Td>
                                                    <Td fontWeight="bold">{vehicle.registration_number}</Td>
                                                    <Td>{`${vehicle.first_name} ${vehicle.last_name}`}</Td>
                                                    <Td>
                                                        {(Number(vehicle.start_month_fuel_liters) || 0).toFixed(2)}
                                                    </Td>
                                                    <Td>
                                                        {(Number(vehicle.start_month_fuel_lei) || 0).toFixed(2)}
                                                    </Td>
                                                    <Td>
                                                        {(Number(vehicle.total_fuel_added_liters) || 0).toFixed(2)}
                                                    </Td>
                                                    <Td>
                                                        {(Number(vehicle.total_fuel_added_lei) || 0).toFixed(2)}
                                                    </Td>
                                                    <Td bg={useColorModeValue('gray.100', 'gray.700')}>
                                                        {((Number(vehicle.start_month_fuel_liters) || 0) + (Number(vehicle.total_fuel_added_liters) || 0)).toFixed(2)}
                                                    </Td>
                                                    <Td bg={useColorModeValue('gray.100', 'gray.700')}>
                                                        {((Number(vehicle.start_month_fuel_lei) || 0) + (Number(vehicle.total_fuel_added_lei) || 0)).toFixed(2)}
                                                    </Td>
                                                    <Td>
                                                        {(Number(vehicle.total_fuel_consumed_liters) || 0).toFixed(2)}
                                                    </Td>
                                                    <Td>
                                                        {(Number(vehicle.total_fuel_consumed_lei) || 0).toFixed(2)}
                                                    </Td>
                                                    <Td bg={useColorModeValue('gray.100', 'gray.700')}>
                                                        {(Number(vehicle.end_month_fuel_liters) || 0).toFixed(2)}
                                                    </Td>
                                                    <Td bg={useColorModeValue('gray.100', 'gray.700')}>
                                                        {(Number(vehicle.end_month_fuel_lei) || 0).toFixed(2)}
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </Box>
                            ) : (
                                <Box textAlign="center" py={8}>
                                    <Text fontSize="lg" color="gray.500">
                                        Nu există date pentru luna selectată
                                    </Text>
                                    <Text fontSize="sm" color="gray.400" mt={2}>
                                        Încearcă să selectezi o altă lună sau an
                                    </Text>
                                </Box>
                            )}

                            {/* Informații despre calcule */}
                            <Alert status="info">
                                <AlertIcon />
                                <Box>
                                    <AlertTitle>Informații despre calcule lunare:</AlertTitle>
                                    <AlertDescription fontSize="sm">
                                        <VStack align="start" spacing={1}>
                                            <Text>• Total carburant = Rest inițial + Carburant alimentat</Text>
                                            <Text>• Rest final = Total carburant - Consum efectiv</Text>
                                            <Text>• Datele sunt agregate pentru întreaga lună selectată</Text>
                                            <Text>• Exportul include doar vehiculele cu tipul de combustibil selectat</Text>
                                        </VStack>
                                    </AlertDescription>
                                </Box>
                            </Alert>
                        </VStack>
                    )}
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={handleClose}>
                        Închide
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
