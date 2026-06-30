import { useState, useEffect } from 'react';
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
    Input,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Badge,
    useToast,
    Spinner,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Heading,
    useColorModeValue,
    IconButton,
    Tooltip,
    FormControl,
    FormLabel,
    Select
} from '@chakra-ui/react';
import { FiSave, FiCheck, FiCalendar, FiPlus, FiTrash2, FiMove, FiDownload } from 'react-icons/fi';
import { DailyActivityService } from '../../services/DailyActivityService';
import { VehicleService } from '../../services/vehicles/VehicleService';
import { FuelConsumptionService } from '../../services/FuelConsumptionService';
import { DailyActivityExportService } from '../../services/DailyActivityExportService';

interface DailyActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ActivityRow {
    id?: number;
    vehicle_id: number;
    driver_id: number;
    registration_number: string;
    driver_name: string;
    date: string;
    trip_sheet_number: string;
    operating_time_hours: number;
    kilometers_interior: number;
    kilometers_exterior: number;
    kilometers_equivalent: number;
    start_day_fuel_liters: number;
    liquid_fuel_added: number;
    numeric_fuel: number;
    bcf_fuel: number;
    equivalent_liters: number;
    actual_consumption_liters: number;
    standard_consumption_urban: number;
    standard_consumption_extraurban: number;
    end_day_fuel_liters: number;
    price_per_liter: number;
    total_value_lei: number;
    status: 'DRAFT' | 'COMPLETED';
    notes?: string;
    isNew?: boolean;
    created_by?: number;
    updated_by?: number;
}

export default function DailyActivityModal({ isOpen, onClose }: DailyActivityModalProps) {
    const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedVehicle, setSelectedVehicle] = useState<string>('');
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [activityRows, setActivityRows] = useState<ActivityRow[]>([]);
    const [modifiedRows, setModifiedRows] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isFinalized, setIsFinalized] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [rowToDelete, setRowToDelete] = useState<number | null>(null);
    const toast = useToast();

    const bgColor = useColorModeValue('white', 'gray.800');
    const calculatedBgColor = useColorModeValue('gray.100', 'gray.700');
    const newRowBgColor = useColorModeValue('blue.50', 'blue.900');

    // Încarcă datele la deschiderea modalului
    useEffect(() => {
        if (isOpen) {
            loadInitialData();
        }
    }, [isOpen]);

    // Încarcă datele pentru luna selectată
    useEffect(() => {
        if (isOpen && selectedMonth && selectedYear && selectedVehicle) {
            // Resetează statusul de finalizat când se schimbă selecția
            setIsFinalized(false);
            loadDataForMonth();
        }
    }, [selectedMonth, selectedYear, selectedVehicle, isOpen]);

    const loadDataForMonth = async () => {
        setLoading(true);
        try {
            // Încarcă toate datele din luna selectată pentru vehiculul selectat
            const monthData = await DailyActivityService.getMonthlyActivity(
                selectedYear, 
                selectedMonth, 
                parseInt(selectedVehicle)
            );
            
            if (monthData && monthData.length > 0) {
                // Convertim datele în formatul pentru rânduri
                const rows: ActivityRow[] = monthData.map(data => ({
                    id: data.id,
                    vehicle_id: data.vehicle_id,
                    driver_id: data.driver_id,
                    registration_number: data.registration_number || '',
                    driver_name: data.first_name && data.last_name 
                        ? `${data.last_name} ${data.first_name}` 
                        : '',
                    date: data.date ? new Date(data.date).toISOString().split('T')[0] : `${selectedYear}-${selectedMonth}-01`,
                    trip_sheet_number: data.trip_sheet_number || '',
                    operating_time_hours: Number(data.operating_time_hours) || 0,
                    kilometers_interior: Number(data.kilometers_interior) || 0,
                    kilometers_exterior: Number(data.kilometers_exterior) || 0,
                    kilometers_equivalent: Number(data.kilometers_equivalent) || 0,
                    start_day_fuel_liters: Number(data.start_day_fuel_liters) || 0,
                    liquid_fuel_added: Number(data.liquid_fuel_added) || 0,
                    numeric_fuel: Number(data.numeric_fuel) || 0,
                    bcf_fuel: Number(data.bcf_fuel) || 0,
                    equivalent_liters: Number(data.equivalent_liters) || 0,
                    actual_consumption_liters: Number(data.actual_consumption_liters) || 0,
                    standard_consumption_urban: Number(data.standard_consumption_urban) || 8.40,
                    standard_consumption_extraurban: Number(data.standard_consumption_extraurban) || 6.30,
                    end_day_fuel_liters: Number(data.end_day_fuel_liters) || 0,
                    price_per_liter: Number(data.price_per_liter) || 0,
                    total_value_lei: Number(data.total_value_lei) || 0,
                    status: data.status || 'DRAFT',
                    notes: data.notes || '',
                    isNew: false // Rândurile încărcate din baza de date nu sunt noi
                }));
                setActivityRows(rows);
                setIsFinalized(monthData.some(data => data.status === 'COMPLETED'));
                
                // Recalculează carryover-ul pentru a asigura consistența
                console.log('🔄 Recalculating carryover consistency...');
                const recalculatedRows = [...rows];
                
                // Sortează rândurile după dată pentru a asigura ordinea corectă
                recalculatedRows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                
                // Recalculează carryover-ul pentru fiecare vehicul separat
                const vehicles = [...new Set(recalculatedRows.map(row => row.vehicle_id))];
                
                vehicles.forEach(vehicleId => {
                    const vehicleRows = recalculatedRows.filter(row => row.vehicle_id === vehicleId);
                    
                    for (let i = 1; i < vehicleRows.length; i++) {
                        const currentRow = vehicleRows[i];
                        const previousRow = vehicleRows[i - 1];
                        
                        // Actualizează start_day_fuel_liters cu end_day_fuel_liters din rândul precedent
                        const oldStart = currentRow.start_day_fuel_liters;
                        currentRow.start_day_fuel_liters = previousRow.end_day_fuel_liters;
                        
                        // Recalculează end_day_fuel_liters cu noua valoare
                        currentRow.end_day_fuel_liters = Number((Number(currentRow.liquid_fuel_added) + Number(currentRow.start_day_fuel_liters) + Number(currentRow.equivalent_liters) - currentRow.actual_consumption_liters).toFixed(2));
                        
                        if (oldStart !== currentRow.start_day_fuel_liters) {
                            console.log(`  🔧 Fixed carryover for vehicle ${vehicleId}, date ${currentRow.date}: ${oldStart}L -> ${currentRow.start_day_fuel_liters}L`);
                        }
                    }
                });
                
                setActivityRows(recalculatedRows);
            } else {
                // Nu există date pentru această lună, creează rânduri goale
                setActivityRows([]);
                setIsFinalized(false);
            }
        } catch (error) {
            console.error('Error loading monthly data:', error);
            toast({
                title: 'Eroare',
                description: 'Nu s-au putut încărca datele pentru această lună',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            setActivityRows([]);
        } finally {
            setLoading(false);
        }
    };

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const vehicleService = new VehicleService();
            const [vehiclesData, driversData] = await Promise.all([
                vehicleService.getVehicles(),
                FuelConsumptionService.getActiveDrivers()
            ]);

            setVehicles(vehiclesData);
            setDrivers(driversData);
        } catch (error) {
            console.error('Error loading initial data:', error);
            toast({
                title: 'Eroare',
                description: 'Nu s-au putut încărca datele inițiale',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };


    const loadPreviousDayData = async (date: string, vehicleId: number = 0) => {
        try {
            const previousDayData = await DailyActivityService.getPreviousDayActivity(date, vehicleId);
            
            // Creează rânduri noi cu datele din ziua anterioară
            const newRows = vehicles.map(vehicle => {
                const previousData = previousDayData.find(pd => pd.vehicle_id === vehicle.id);
                
                return {
                    vehicle_id: vehicle.id,
                    driver_id: 0, // Va fi selectat manual
                    registration_number: vehicle.registration_number,
                    driver_name: '',
                    date: date,
                    trip_sheet_number: '',
                    operating_time_hours: 0,
                    kilometers_interior: 0,
                    kilometers_exterior: 0,
                    kilometers_equivalent: 0,
                    start_day_fuel_liters: Number(previousData?.end_day_fuel_liters || 0),
                    liquid_fuel_added: 0,
                    numeric_fuel: 0,
                    bcf_fuel: 0,
                    equivalent_liters: 0,
                    actual_consumption_liters: 0,
                    standard_consumption_urban: 8.40,
                    standard_consumption_extraurban: 6.30,
                    end_day_fuel_liters: Number(previousData?.end_day_fuel_liters || 0),
                    price_per_liter: 0,
                    total_value_lei: 0,
                    status: 'DRAFT' as const,
                    notes: '',
                    isNew: true
                };
            });
            
            setActivityRows(newRows);
            setIsFinalized(false);
        } catch (error) {
            console.error('Error loading previous day data:', error);
            // Dacă nu există date anterioare, creează rânduri goale
            const emptyRows = vehicles.map(vehicle => ({
                vehicle_id: vehicle.id,
                driver_id: 0,
                registration_number: vehicle.registration_number,
                driver_name: '',
                date: date,
                trip_sheet_number: '',
                operating_time_hours: 0,
                kilometers_interior: 0,
                kilometers_exterior: 0,
                kilometers_equivalent: 0,
                start_day_fuel_liters: 0,
                liquid_fuel_added: 0,
                numeric_fuel: 0,
                bcf_fuel: 0,
                equivalent_liters: 0,
                actual_consumption_liters: 0,
                standard_consumption_urban: 8.40,
                standard_consumption_extraurban: 6.30,
                end_day_fuel_liters: 0,
                price_per_liter: 0,
                total_value_lei: 0,
                status: 'DRAFT' as const,
                notes: '',
                isNew: true
            }));
            setActivityRows(emptyRows);
            setIsFinalized(false);
        }
    };

    const addNewRow = async () => {
        const selectedVehicleObj = vehicles.find(v => v.id.toString() === selectedVehicle);
        
        // Găsește ultimul rând pentru același vehicul (din sesiunea curentă)
        const lastRow = activityRows
            .filter(row => row.vehicle_id === parseInt(selectedVehicle))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .pop();
        
        // Calculează data următoare
        let nextDate = `${selectedYear}-${selectedMonth}-01`;
        if (lastRow && lastRow.date) {
            const lastDate = new Date(lastRow.date);
            lastDate.setDate(lastDate.getDate() + 1);
            nextDate = lastDate.toISOString().split('T')[0];
        }
        
        // Încearcă să preiei restul din ziua precedentă din baza de date
        let previousDayFuel = 0;
        let previousDayPrice = 0;
        let previousDayStandards = { urban: 8.40, extraurban: 6.30 };
        
        try {
            console.log(`🔍 Loading previous day data for date: ${nextDate}, vehicle: ${selectedVehicle}`);
            const previousDayData = await DailyActivityService.getPreviousDayActivity(nextDate, parseInt(selectedVehicle));
            
            if (previousDayData && previousDayData.length > 0) {
                const previousData = previousDayData.find(pd => pd.vehicle_id === parseInt(selectedVehicle));
                if (previousData) {
                    previousDayFuel = Number(previousData.end_day_fuel_liters) || 0;
                    previousDayPrice = Number(previousData.price_per_liter) || 0;
                    previousDayStandards.urban = Number(previousData.standard_consumption_urban) || 8.40;
                    previousDayStandards.extraurban = Number(previousData.standard_consumption_extraurban) || 6.30;
                    console.log(`✅ Found previous day data: fuel=${previousDayFuel}, price=${previousDayPrice}`);
                }
            }
        } catch (error) {
            console.log(`⚠️ Could not load previous day data, using fallback values`);
            // Folosește valorile din ultimul rând din sesiunea curentă ca fallback
            if (lastRow) {
                previousDayFuel = lastRow.end_day_fuel_liters;
                previousDayPrice = lastRow.price_per_liter;
                previousDayStandards.urban = lastRow.standard_consumption_urban;
                previousDayStandards.extraurban = lastRow.standard_consumption_extraurban;
            }
        }
        
        const newRow: ActivityRow = {
            vehicle_id: selectedVehicle ? parseInt(selectedVehicle) : 0,
            driver_id: 0,
            registration_number: selectedVehicleObj?.registration_number || '',
            driver_name: '',
            date: nextDate,
            trip_sheet_number: '',
            operating_time_hours: 0,
            kilometers_interior: 0,
            kilometers_exterior: 0,
            kilometers_equivalent: 0,
            start_day_fuel_liters: previousDayFuel, // Preia restul din ziua precedentă din baza de date
            liquid_fuel_added: 0,
            numeric_fuel: 0,
            bcf_fuel: 0,
            equivalent_liters: 0,
            actual_consumption_liters: 0,
            standard_consumption_urban: previousDayStandards.urban,
            standard_consumption_extraurban: previousDayStandards.extraurban,
            end_day_fuel_liters: previousDayFuel, // Inițial, la fel ca start_day_fuel_liters
            price_per_liter: previousDayPrice, // Preia prețul pe litru din ziua precedentă
            total_value_lei: 0,
            status: 'DRAFT',
            notes: '',
            isNew: true
        };
        
        const newIndex = activityRows.length;
        setActivityRows([...activityRows, newRow]);
        // Marchează noul rând ca fiind modificat
        setModifiedRows(prev => new Set([...prev, newIndex]));
        
        console.log(`➕ Added new row with previous day fuel: ${previousDayFuel}L`);
    };

    const confirmDeleteRow = (index: number) => {
        setRowToDelete(index);
        setShowDeleteModal(true);
    };

    const removeRow = async (index: number) => {
        try {
            const rowToRemove = activityRows[index];
            
            // Dacă rândul are ID, înseamnă că este salvat în baza de date - șterge permanent
            if (rowToRemove.id) {
                await DailyActivityService.deleteDailyActivity(rowToRemove.id);
                console.log('🗑️ Deleted row from database:', rowToRemove.id);
            }
            
            // Șterge rândul din state
            const newRows = activityRows.filter((_, i) => i !== index);
            setActivityRows(newRows);
            
            // Actualizează indexurile în modifiedRows după ștergere
            setModifiedRows(prev => {
                const newSet = new Set<number>();
                prev.forEach(idx => {
                    if (idx < index) {
                        newSet.add(idx);
                    } else if (idx > index) {
                        newSet.add(idx - 1);
                    }
                    // idx === index este șters, nu îl adăugăm
                });
                return newSet;
            });
            
            // Închide modalul de confirmare
            setShowDeleteModal(false);
            setRowToDelete(null);
            
            toast({
                title: 'Succes',
                description: rowToRemove.id ? 'Rândul a fost șters permanent din baza de date' : 'Rândul a fost șters',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Error deleting row:', error);
            toast({
                title: 'Eroare',
                description: 'Nu s-a putut șterge rândul din baza de date',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setRowToDelete(null);
    };


    // Funcții pentru gestionarea datei și vehiculului



    const goToToday = () => {
        const today = new Date();
        setSelectedMonth((today.getMonth() + 1).toString().padStart(2, '0'));
        setSelectedYear(today.getFullYear());
    };

    const handleVehicleChange = (vehicleId: string) => {
        setSelectedVehicle(vehicleId);
        const vehicle = vehicles.find(v => v.id.toString() === vehicleId);
        if (vehicle) {
            // Actualizează numărul de înmatriculare în rânduri
            setActivityRows(prev => prev.map(row => ({
                ...row,
                vehicle_id: parseInt(vehicleId),
                registration_number: vehicle.registration_number
            })));
        }
    };

    const updateRow = (index: number, field: keyof ActivityRow, value: any) => {
        const newRows = [...activityRows];
        newRows[index] = { ...newRows[index], [field]: value };
        
        // Recalculează valorile derivate pentru rândul curent
        const row = newRows[index];
        
        // Calculează consumul efectiv conform formulei: =(N/100*F)+(O/100*G)
        // N = standard_consumption_urban (Urban), F = kilometers_interior
        // O = standard_consumption_extraurban (Extraurban), G = kilometers_exterior
        const urbanConsumption = (Number(row.standard_consumption_urban) / 100) * Number(row.kilometers_interior);
        const extraurbanConsumption = (Number(row.standard_consumption_extraurban) / 100) * Number(row.kilometers_exterior);
        row.actual_consumption_liters = Number((urbanConsumption + extraurbanConsumption).toFixed(2));
        
        // Calculează restul final conform formulei: =I+J+L-M
        // I = start_day_fuel_liters (Rest început), J = liquid_fuel_added (Alimentat lichid), L = equivalent_liters (Alimentat echivalent), M = actual_consumption_liters (Consum efectiv)
        row.end_day_fuel_liters = Number((Number(row.liquid_fuel_added) + Number(row.start_day_fuel_liters) + Number(row.equivalent_liters) - row.actual_consumption_liters).toFixed(2));
        
        // Calculează valoarea totală
        row.total_value_lei = Number((Number(row.liquid_fuel_added) * Number(row.price_per_liter)).toFixed(2));
        
        // Actualizează numele șoferului dacă se schimbă driver_id
        if (field === 'driver_id' && value) {
            const selectedDriver = drivers.find(d => d.id === value);
            if (selectedDriver) {
                row.driver_name = `${selectedDriver.first_name} ${selectedDriver.last_name}`;
            }
        }
        
        // Actualizează numărul de înmatriculare dacă se schimbă vehicle_id
        if (field === 'vehicle_id' && value) {
            const selectedVehicle = vehicles.find(v => v.id === value);
            if (selectedVehicle) {
                row.registration_number = selectedVehicle.registration_number;
            }
        }
        
        // RECALCULEAZĂ ÎN CASCADĂ TOATE RÂNDURILE URMĂTOARE
        // Dacă s-a schimbat ceva ce afectează carryover-ul, actualizează rândurile următoare
        const fieldsAffectingCarryover = ['kilometers_interior', 'kilometers_exterior', 'liquid_fuel_added', 'equivalent_liters', 'actual_consumption_liters', 'end_day_fuel_liters'];
        
        if (fieldsAffectingCarryover.includes(field)) {
            console.log(`🔄 Cascade recalculation triggered by field: ${field}`);
            
            // Recalculează rândurile următoare pentru același vehicul
            for (let i = index + 1; i < newRows.length; i++) {
                const nextRow = newRows[i];
                
                // Doar pentru același vehicul
                if (nextRow.vehicle_id === row.vehicle_id) {
                    // Actualizează start_day_fuel_liters cu valoarea end_day_fuel_liters din rândul precedent
                    const previousRow = newRows[i - 1];
                    nextRow.start_day_fuel_liters = previousRow.end_day_fuel_liters;
                    
                    // Recalculează consumul efectiv pentru rândul curent
                    const nextUrbanConsumption = (Number(nextRow.standard_consumption_urban) / 100) * Number(nextRow.kilometers_interior);
                    const nextExtraurbanConsumption = (Number(nextRow.standard_consumption_extraurban) / 100) * Number(nextRow.kilometers_exterior);
                    nextRow.actual_consumption_liters = Number((nextUrbanConsumption + nextExtraurbanConsumption).toFixed(2));
                    
                    // Recalculează restul final pentru rândul curent
                    nextRow.end_day_fuel_liters = Number((Number(nextRow.liquid_fuel_added) + Number(nextRow.start_day_fuel_liters) + Number(nextRow.equivalent_liters) - nextRow.actual_consumption_liters).toFixed(2));
                    
                    // Recalculează valoarea totală
                    nextRow.total_value_lei = Number((Number(nextRow.liquid_fuel_added) * Number(nextRow.price_per_liter)).toFixed(2));
                    
                    console.log(`  📊 Updated row ${i}: start=${nextRow.start_day_fuel_liters}L, end=${nextRow.end_day_fuel_liters}L`);
                }
            }
        }
        
        // Marchează rândul ca fiind modificant
        setModifiedRows(prev => new Set([...prev, index]));
        
        setActivityRows(newRows);
    };

    const saveData = async () => {
        setSaving(true);
        try {
            // Salvează doar rândurile modificate sau noi
            console.log('🔍 Debug saveData:', {
                totalRows: activityRows.length,
                modifiedRows: Array.from(modifiedRows),
                rowsWithId: activityRows.filter(row => row.id).length,
                rowsWithIsNew: activityRows.filter(row => row.isNew).length,
                activityRows: activityRows.map((row, index) => ({
                    index,
                    id: row.id,
                    isNew: row.isNew,
                    isModified: modifiedRows.has(index),
                    date: row.date,
                    vehicle_id: row.vehicle_id
                }))
            });

            const rowsToSave = activityRows
                .filter((row, index) => {
                    // Include rândurile modificate sau rândurile noi (isNew)
                    const shouldSave = modifiedRows.has(index) || row.isNew;
                    console.log(`🔍 Row ${index}: id=${row.id}, isNew=${row.isNew}, isModified=${modifiedRows.has(index)}, shouldSave=${shouldSave}`);
                    return shouldSave;
                })
                .filter(row => {
                    // Validare relaxată: cel puțin vehiculul și șoferul trebuie selectate
                    // și cel puțin un câmp completat (data, nr. foaie, sau orice alt câmp numeric > 0)
                    const hasVehicleAndDriver = row.vehicle_id > 0 && row.driver_id > 0;
                    const hasAnyData = row.date || 
                                     row.trip_sheet_number || 
                                     (row.operating_time_hours && row.operating_time_hours > 0) ||
                                     (row.kilometers_interior && row.kilometers_interior > 0) ||
                                     (row.kilometers_exterior && row.kilometers_exterior > 0) ||
                                     (row.kilometers_equivalent && row.kilometers_equivalent > 0) ||
                                     (row.start_day_fuel_liters && row.start_day_fuel_liters > 0) ||
                                     (row.liquid_fuel_added && row.liquid_fuel_added > 0) ||
                                     (row.numeric_fuel && row.numeric_fuel > 0) ||
                                     (row.bcf_fuel && row.bcf_fuel > 0) ||
                                     (row.equivalent_liters && row.equivalent_liters > 0) ||
                                     (row.price_per_liter && row.price_per_liter > 0);
                    
                    return hasVehicleAndDriver && hasAnyData;
                });

            if (rowsToSave.length === 0) {
                toast({
                    title: 'Informare',
                    description: 'Nu sunt modificări de salvat sau rândurile nu sunt completate (necesar: vehicul, șofer și cel puțin un câmp)',
                    status: 'info',
                    duration: 4000,
                    isClosable: true,
                });
                return;
            }

            console.log('💾 Salvând rândurile modificate:', rowsToSave.map(r => ({ 
                id: r.id, 
                trip_sheet_number: r.trip_sheet_number, 
                isNew: r.isNew,
                date: r.date 
            })));
            console.log('📊 Modified rows set:', Array.from(modifiedRows));
            console.log('📊 All rows:', activityRows.map((r, i) => ({ 
                index: i, 
                id: r.id, 
                isNew: r.isNew, 
                trip_sheet_number: r.trip_sheet_number,
                date: r.date
            })));
            console.log('🔍 DEBUG: rowsToSave details:', rowsToSave.map(r => ({
                id: r.id,
                isNew: r.isNew,
                hasId: !!r.id,
                willUsePost: !r.id || r.isNew,
                willUsePut: !!r.id && !r.isNew,
                trip_sheet_number: r.trip_sheet_number,
                date: r.date,
                vehicle_id: r.vehicle_id,
                driver_id: r.driver_id
            })));

            const promises = rowsToSave.map(row => {
                const activityData = {
                    id: row.isNew ? undefined : row.id, // Pentru rândurile noi, nu trimitem ID
                    date: row.date,
                    vehicle_id: row.vehicle_id,
                    driver_id: row.driver_id,
                    trip_sheet_number: row.trip_sheet_number,
                    operating_time_hours: row.operating_time_hours,
                    kilometers_interior: row.kilometers_interior,
                    kilometers_exterior: row.kilometers_exterior,
                    kilometers_equivalent: row.kilometers_equivalent,
                    start_day_fuel_liters: row.start_day_fuel_liters,
                    liquid_fuel_added: row.liquid_fuel_added,
                    numeric_fuel: row.numeric_fuel,
                    bcf_fuel: row.bcf_fuel,
                    equivalent_liters: row.equivalent_liters,
                    standard_consumption_urban: row.standard_consumption_urban,
                    standard_consumption_extraurban: row.standard_consumption_extraurban,
                    price_per_liter: row.price_per_liter,
                    status: row.status,
                    notes: row.notes
                };
                
                console.log('💾 Salvând rândul:', { 
                    id: activityData.id, 
                    isNew: row.isNew, 
                    trip_sheet_number: row.trip_sheet_number,
                    date: row.date 
                });
                
                return DailyActivityService.saveDailyActivity(activityData);
            });

            const savedResults = await Promise.all(promises);
            
            // Actualizează rândurile cu ID-urile primite de la backend
            setActivityRows(prev => prev.map((row, index) => {
                if (modifiedRows.has(index) || row.isNew) {
                    // Găsește rezultatul salvat pentru acest rând
                    const savedResult = savedResults.find(result => 
                        result.date === row.date && 
                        result.vehicle_id === row.vehicle_id &&
                        result.trip_sheet_number === row.trip_sheet_number
                    );
                    
                    if (savedResult) {
                        console.log(`🔄 Updating row ${index} with new ID: ${savedResult.id}`);
                        return {
                            ...row,
                            id: savedResult.id,
                            isNew: false
                        };
                    }
                }
                return { ...row, isNew: false };
            }));
            
            // Șterge rândurile din lista de modificări după salvare
            setModifiedRows(new Set());
            
            toast({
                title: 'Succes',
                description: `${rowsToSave.length} rând(uri) au fost salvate cu succes`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Error saving data:', error);
            toast({
                title: 'Eroare',
                description: 'Nu s-au putut salva datele',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setSaving(false);
        }
    };

    const finalizeData = async () => {
        setSaving(true);
        try {
            await saveData();
            await DailyActivityService.finalizeDailyActivity(`${selectedYear}-${selectedMonth}-01`);
            setIsFinalized(true);
            
            toast({
                title: 'Succes',
                description: 'Fișa activității a fost finalizată',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Error finalizing data:', error);
            toast({
                title: 'Eroare',
                description: 'Nu s-a putut finaliza fișa activității',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleExportExcel = () => {
        try {
            const selectedVehicleInfo = vehicles.find(v => v.id === parseInt(selectedVehicle));
            
            const exportData = {
                month: selectedMonth,
                year: selectedYear.toString(),
                vehicleInfo: {
                    registrationNumber: selectedVehicleInfo?.registration_number || '',
                    brand: selectedVehicleInfo?.brand || '',
                    model: selectedVehicleInfo?.model || '',
                    fuelType: 'DIESEL',
                    averagePrice: activityRows.reduce((sum, row) => sum + (row.price_per_liter || 0), 0) / activityRows.length || 7.68
                },
                rows: activityRows.map(row => ({
                    ...row,
                    created_by: row.created_by || 1,
                    updated_by: row.updated_by || 1
                }))
            };

            DailyActivityExportService.exportToExcel(exportData);
            
            toast({
                title: 'Succes',
                description: 'Fișa activității a fost exportată în Excel',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast({
                title: 'Eroare',
                description: 'Nu s-a putut exporta fișa activității',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleClose = () => {
        setActivityRows([]);
        setIsFinalized(false);
        onClose();
    };

    return (
        <>
        <Modal isOpen={isOpen} onClose={handleClose} size="full" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent bg={bgColor}>
                <ModalHeader>
                    <HStack spacing={4}>
                        <FiCalendar size={24} />
                        <VStack align="start" spacing={0}>
                            <Heading size="md">Fișa Activitații Zilnice</Heading>
                            <Text fontSize="sm" color="gray.500">
                                Gestionare zilnică activitate vehicule
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
                            {/* Header cu lună, an, vehicul și zi */}
                            <HStack justify="space-between" p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                                <HStack spacing={4}>
                                    {/* Lună și An */}
                                    <FormControl width="120px">
                                        <FormLabel fontSize="sm">Luna:</FormLabel>
                                        <Select
                                            value={selectedMonth}
                                            onChange={(e) => {
                                                setSelectedMonth(e.target.value);
                                            }}
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
                                    
                                    <FormControl width="120px">
                                        <FormLabel fontSize="sm">Anul:</FormLabel>
                                        <Select
                                            value={selectedYear}
                                            onChange={(e) => {
                                                setSelectedYear(parseInt(e.target.value));
                                            }}
                                        >
                                            <option value="2024">2024</option>
                                            <option value="2025">2025</option>
                                            <option value="2026">2026</option>
                                            <option value="2027">2027</option>
                                        </Select>
                                    </FormControl>

                                    {/* Vehicul */}
                                    <FormControl width="200px">
                                        <FormLabel fontSize="sm">Vehicul:</FormLabel>
                                        <Select
                                            value={selectedVehicle}
                                            onChange={(e) => handleVehicleChange(e.target.value)}
                                            placeholder="Selectează vehiculul"
                                        >
                                            {vehicles.map(vehicle => (
                                                <option key={vehicle.id} value={vehicle.id.toString()}>
                                                    {vehicle.registration_number} - {vehicle.brand}
                                                </option>
                                            ))}
                                        </Select>
                                    </FormControl>


                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={goToToday}
                                        leftIcon={<FiCalendar />}
                                    >
                                        Luna Curentă
                                    </Button>
                                    
                                    {isFinalized && (
                                        <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                                            FINALIZAT
                                        </Badge>
                                    )}
                                </HStack>
                                
                                <HStack spacing={2}>
                                    <Tooltip label={!selectedVehicle ? "Selectează mai întâi un vehicul" : "Adaugă un rând nou"}>
                                        <Button
                                            leftIcon={<FiPlus />}
                                            onClick={addNewRow}
                                            disabled={isFinalized || !selectedVehicle}
                                            size="sm"
                                            colorScheme="blue"
                                            variant="outline"
                                        >
                                            Adaugă Rând
                                        </Button>
                                    </Tooltip>
                                    <Tooltip label="Salvează modificările">
                                        <Button
                                            leftIcon={<FiSave />}
                                            onClick={saveData}
                                            isLoading={saving}
                                            disabled={isFinalized}
                                            size="sm"
                                        >
                                            Salvează
                                        </Button>
                                    </Tooltip>
                                    <Tooltip label="Finalizează fișa activității">
                                        <Button
                                            leftIcon={<FiCheck />}
                                            onClick={finalizeData}
                                            isLoading={saving}
                                            disabled={isFinalized}
                                            colorScheme="green"
                                            size="sm"
                                        >
                                            Finalizează
                                        </Button>
                                    </Tooltip>
                                    <Tooltip label="Export Excel">
                                        <Button
                                            leftIcon={<FiDownload />}
                                            onClick={handleExportExcel}
                                            colorScheme="blue"
                                            variant="outline"
                                            size="sm"
                                        >
                                            Export Excel
                                        </Button>
                                    </Tooltip>
                                </HStack>
                            </HStack>

                            {/* Tabel cu datele */}
                            <Box overflowX="auto" maxW="100%">
                                <Table variant="simple" size="xs" fontSize="xs">
                                    <Thead>
                                        <Tr>
                                            <Th fontSize="xs" py={2}>Nr. Foaie</Th>
                                            <Th fontSize="xs" py={2}>Data</Th>
                                            <Th fontSize="xs" py={2}>Șofer</Th>
                                            <Th fontSize="xs" py={2}>Timp (h)</Th>
                                            <Th fontSize="xs" py={2}>Int. (km)</Th>
                                            <Th fontSize="xs" py={2}>Ext. (km)</Th>
                                            <Th fontSize="xs" py={2}>Echiv. (km)</Th>
                                            <Th fontSize="xs" py={2}>Rest Înc. (l)</Th>
                                            <Th fontSize="xs" py={2}>Alim. Liq. (l)</Th>
                                            <Th fontSize="xs" py={2}>Alim. Num. (l)</Th>
                                            <Th fontSize="xs" py={2}>Alim. BCF (l)</Th>
                                            <Th fontSize="xs" py={2}>Alim. Ech. (l)</Th>
                                            <Th fontSize="xs" py={2}>Cons. Efect. (l)</Th>
                                            <Th fontSize="xs" py={2}>Cons. Urb. (l)</Th>
                                            <Th fontSize="xs" py={2}>Cons. Ext. (l)</Th>
                                            <Th fontSize="xs" py={2}>Rest Final (l)</Th>
                                            <Th fontSize="xs" py={2}>Preț (l)</Th>
                                            <Th fontSize="xs" py={2}>Valoare (lei)</Th>
                                            <Th fontSize="xs" py={2}>Acțiuni</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {activityRows.map((row, index) => (
                                            <Tr 
                                                key={`${row.vehicle_id}-${index}`} 
                                                bg={row.isNew ? newRowBgColor : undefined}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    e.dataTransfer.dropEffect = 'move';
                                                }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                                    const dropIndex = index;
                                                    
                                                    if (dragIndex !== dropIndex) {
                                                        const newRows = [...activityRows];
                                                        const draggedRow = newRows[dragIndex];
                                                        newRows.splice(dragIndex, 1);
                                                        newRows.splice(dropIndex, 0, draggedRow);
                                                        setActivityRows(newRows);
                                                    }
                                                }}
                                            >
                                                <Td py={1}>
                                                    <Input
                                                        value={row.trip_sheet_number}
                                                        onChange={(e) => updateRow(index, 'trip_sheet_number', e.target.value)}
                                                        size="xs"
                                                        fontSize="xs"
                                                        isDisabled={isFinalized}
                                                        placeholder="Nr. foaie"
                                                        w="80px"
                                                    />
                                                </Td>
                                                <Td py={1}>
                                                    <Input
                                                        type="date"
                                                        value={row.date}
                                                        onChange={(e) => {
                                                            const selectedDate = e.target.value;
                                                            // Validare: nu permite să selectezi o dată anterioară celei din rândul de sus
                                                            const previousRow = activityRows
                                                                .filter((r, i) => i < index && r.vehicle_id === row.vehicle_id)
                                                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                                                .pop();
                                                            
                                                            if (previousRow && selectedDate <= previousRow.date) {
                                                                toast({
                                                                    title: 'Eroare',
                                                                    description: `Data trebuie să fie după ${previousRow.date}`,
                                                                    status: 'error',
                                                                    duration: 3000,
                                                                    isClosable: true,
                                                                });
                                                                return;
                                                            }
                                                            
                                                            updateRow(index, 'date', selectedDate);
                                                        }}
                                                        size="xs"
                                                        fontSize="xs"
                                                        isDisabled={isFinalized}
                                                        min={`${selectedYear}-${selectedMonth}-01`}
                                                        max={`${selectedYear}-${selectedMonth}-${new Date(selectedYear, parseInt(selectedMonth), 0).getDate()}`}
                                                        w="120px"
                                                        onFocus={(e) => {
                                                            // Când dai click pe dată, deschide popup-ul de dată
                                                            e.target.showPicker?.();
                                                        }}
                                                    />
                                                </Td>
                                                <Td py={1}>
                                                    <Select
                                                        value={row.driver_id}
                                                        onChange={(e) => updateRow(index, 'driver_id', parseInt(e.target.value))}
                                                        size="xs"
                                                        fontSize="xs"
                                                        isDisabled={isFinalized}
                                                        w="140px"
                                                    >
                                                        <option value={0}>Selectează șofer</option>
                                                        {drivers.map(driver => (
                                                            <option key={driver.id} value={driver.id}>
                                                                {driver.last_name} {driver.first_name}
                                                            </option>
                                                        ))}
                                                    </Select>
                                                </Td>
                                                <Td py={1}>
                                                    <NumberInput
                                                        value={row.operating_time_hours}
                                                        onChange={(_, value) => updateRow(index, 'operating_time_hours', value || 0)}
                                                        precision={2}
                                                        step={0.1}
                                                        min={0}
                                                        size="xs"
                                                        isDisabled={isFinalized}
                                                        w="80px"
                                                    >
                                                        <NumberInputField fontSize="xs" />
                                                        <NumberInputStepper>
                                                            <NumberIncrementStepper />
                                                            <NumberDecrementStepper />
                                                        </NumberInputStepper>
                                                    </NumberInput>
                                                </Td>
                                                <Td py={1}>
                                                    <Input
                                                        value={row.kilometers_interior === 0 ? '' : row.kilometers_interior}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            if (value === '' || value === ',') {
                                                                updateRow(index, 'kilometers_interior', 0);
                                                            } else {
                                                                const normalizedValue = value.replace(',', '.');
                                                                const numValue = parseFloat(normalizedValue) || 0;
                                                                updateRow(index, 'kilometers_interior', numValue);
                                                            }
                                                        }}
                                                        onKeyPress={(e) => {
                                                            if (!/[0-9.,]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        placeholder="0.00"
                                                        size="xs"
                                                        isDisabled={isFinalized}
                                                        w="80px"
                                                        fontSize="xs"
                                                        type="number"
                                                        step="any"
                                                    />
                                                </Td>
                                                <Td py={1}>
                                                    <Input
                                                        value={row.kilometers_exterior === 0 ? '' : row.kilometers_exterior}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            if (value === '' || value === ',') {
                                                                updateRow(index, 'kilometers_exterior', 0);
                                                            } else {
                                                                const normalizedValue = value.replace(',', '.');
                                                                const numValue = parseFloat(normalizedValue) || 0;
                                                                updateRow(index, 'kilometers_exterior', numValue);
                                                            }
                                                        }}
                                                        onKeyPress={(e) => {
                                                            if (!/[0-9.,]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        placeholder="0.00"
                                                        size="xs"
                                                        isDisabled={isFinalized}
                                                        w="80px"
                                                        fontSize="xs"
                                                        type="number"
                                                        step="any"
                                                    />
                                                </Td>
                                                <Td py={1}>
                                                    <NumberInput
                                                        value={row.kilometers_equivalent}
                                                        onChange={(_, value) => updateRow(index, 'kilometers_equivalent', value || 0)}
                                                        precision={2}
                                                        step={0.1}
                                                        min={0}
                                                        size="xs"
                                                        isDisabled={isFinalized}
                                                        w="80px"
                                                    >
                                                        <NumberInputField fontSize="xs" />
                                                        <NumberInputStepper>
                                                            <NumberIncrementStepper />
                                                            <NumberDecrementStepper />
                                                        </NumberInputStepper>
                                                    </NumberInput>
                                                </Td>
                                                <Td py={1}>
                                                    <Input
                                                        value={row.start_day_fuel_liters === 0 ? '' : row.start_day_fuel_liters}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            // Dacă input-ul este gol, setează 0, altfel convertește valoarea
                                                            if (value === '' || value === ',') {
                                                                updateRow(index, 'start_day_fuel_liters', 0);
                                                            } else {
                                                                const normalizedValue = value.replace(',', '.');
                                                                const numValue = parseFloat(normalizedValue) || 0;
                                                                updateRow(index, 'start_day_fuel_liters', numValue);
                                                            }
                                                        }}
                                                        onKeyPress={(e) => {
                                                            // Permite doar numere, puncte și virgule
                                                            if (!/[0-9.,]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        placeholder="0.00"
                                                        size="xs"
                                                        isDisabled={isFinalized}
                                                        w="80px"
                                                        fontSize="xs"
                                                        type="number"
                                                        step="any"
                                                    />
                                                </Td>
                                                <Td py={1}>
                                                    <Input
                                                        value={row.liquid_fuel_added === 0 ? '' : row.liquid_fuel_added}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            if (value === '' || value === ',') {
                                                                updateRow(index, 'liquid_fuel_added', 0);
                                                            } else {
                                                                const normalizedValue = value.replace(',', '.');
                                                                const numValue = parseFloat(normalizedValue) || 0;
                                                                updateRow(index, 'liquid_fuel_added', numValue);
                                                            }
                                                        }}
                                                        onKeyPress={(e) => {
                                                            if (!/[0-9.,]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        placeholder="0.00"
                                                        size="xs"
                                                        isDisabled={isFinalized}
                                                        w="80px"
                                                        fontSize="xs"
                                                        type="number"
                                                        step="any"
                                                    />
                                                </Td>
                                                <Td py={1}>
                                                    <NumberInput
                                                        value={row.numeric_fuel}
                                                        onChange={(_, value) => updateRow(index, 'numeric_fuel', value || 0)}
                                                        precision={2}
                                                        step={0.1}
                                                        min={0}
                                                        size="xs"
                                                        isDisabled={isFinalized}
                                                        w="80px"
                                                    >
                                                        <NumberInputField fontSize="xs" />
                                                        <NumberInputStepper>
                                                            <NumberIncrementStepper />
                                                            <NumberDecrementStepper />
                                                        </NumberInputStepper>
                                                    </NumberInput>
                                                </Td>
                                                <Td py={1}>
                                                    <NumberInput
                                                        value={row.bcf_fuel}
                                                        onChange={(_, value) => updateRow(index, 'bcf_fuel', value || 0)}
                                                        precision={2}
                                                        step={0.1}
                                                        min={0}
                                                        size="xs"
                                                        isDisabled={isFinalized}
                                                        w="80px"
                                                    >
                                                        <NumberInputField fontSize="xs" />
                                                        <NumberInputStepper>
                                                            <NumberIncrementStepper />
                                                            <NumberDecrementStepper />
                                                        </NumberInputStepper>
                                                    </NumberInput>
                                                </Td>
                                                <Td py={1}>
                                                    <NumberInput
                                                        value={row.equivalent_liters}
                                                        onChange={(_, value) => updateRow(index, 'equivalent_liters', value || 0)}
                                                        precision={2}
                                                        step={0.1}
                                                        min={0}
                                                        size="xs"
                                                        isDisabled={isFinalized}
                                                        w="80px"
                                                    >
                                                        <NumberInputField fontSize="xs" />
                                                        <NumberInputStepper>
                                                            <NumberIncrementStepper />
                                                            <NumberDecrementStepper />
                                                        </NumberInputStepper>
                                                    </NumberInput>
                                                </Td>
                                                <Td py={1} bg={calculatedBgColor} fontSize="xs" textAlign="center" w="80px">
                                                    {Number(row.actual_consumption_liters || 0).toFixed(2)}
                                                </Td>
                                                <Td py={1} bg={calculatedBgColor} fontSize="xs" textAlign="center" w="80px">
                                                    {Number(row.standard_consumption_urban || 8.40).toFixed(2)}
                                                </Td>
                                                <Td py={1} bg={calculatedBgColor} fontSize="xs" textAlign="center" w="80px">
                                                    {Number(row.standard_consumption_extraurban || 6.30).toFixed(2)}
                                                </Td>
                                                <Td py={1} bg={calculatedBgColor} fontSize="xs" textAlign="center" w="80px">
                                                    {Number(row.end_day_fuel_liters || 0).toFixed(2)}
                                                </Td>
                                                <Td py={1}>
                                                    <Input
                                                        value={row.price_per_liter === 0 ? '' : row.price_per_liter}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            if (value === '' || value === ',') {
                                                                updateRow(index, 'price_per_liter', 0);
                                                            } else {
                                                                const normalizedValue = value.replace(',', '.');
                                                                const numValue = parseFloat(normalizedValue) || 0;
                                                                updateRow(index, 'price_per_liter', numValue);
                                                            }
                                                        }}
                                                        onKeyPress={(e) => {
                                                            if (!/[0-9.,]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        placeholder="0.00"
                                                        size="xs"
                                                        isDisabled={isFinalized}
                                                        w="80px"
                                                        fontSize="xs"
                                                        type="number"
                                                        step="any"
                                                    />
                                                </Td>
                                                <Td py={1} bg={calculatedBgColor} fontSize="xs" textAlign="center" w="80px">
                                                    {Number(row.total_value_lei || 0).toFixed(2)}
                                                </Td>
                                                <Td py={1}>
                                                    <HStack spacing={1}>
                                                        <IconButton
                                                            aria-label="Trage pentru a reordona"
                                                            icon={<FiMove />}
                                                            size="xs"
                                                            colorScheme="gray"
                                                            variant="ghost"
                                                            draggable={!isFinalized}
                                                            onDragStart={(e) => {
                                                                e.dataTransfer.setData('text/plain', index.toString());
                                                                e.dataTransfer.effectAllowed = 'move';
                                                            }}
                                                            cursor={!isFinalized ? 'grab' : 'default'}
                                                            _active={{ cursor: 'grabbing' }}
                                                        />
                                                        <IconButton
                                                            aria-label="Șterge rând"
                                                            icon={<FiTrash2 />}
                                                            size="xs"
                                                            colorScheme="red"
                                                            variant="ghost"
                                                            onClick={() => confirmDeleteRow(index)}
                                                            isDisabled={isFinalized}
                                                        />
                                                    </HStack>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </Box>

                            {/* Informații despre calcule */}
                            <Alert status="info">
                                <AlertIcon />
                                <Box>
                                    <AlertTitle>Informații despre calcule:</AlertTitle>
                                    <AlertDescription fontSize="sm">
                                        <VStack align="start" spacing={1}>
                                            <Text>• Consum efectiv = (km interior/100 × consum urban) + (km exterior/100 × consum extraurban)</Text>
                                            <Text>• Rest final = Rest început + Alimentat - Consum efectiv</Text>
                                            <Text>• Valoare totală = Alimentat × Preț/litru</Text>
                                            <Text>• Consumul normat: Urban 8.40 L/100km, Extraurban 6.30 L/100km</Text>
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

        {/* Modal de confirmare pentru ștergerea rândului */}
        <Modal isOpen={showDeleteModal} onClose={cancelDelete} size="md">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Confirmă Ștergerea</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Text>
                        Ești sigur că vrei să ștergi acest rând? Această acțiune nu poate fi anulată.
                    </Text>
                    {rowToDelete !== null && activityRows[rowToDelete] && (
                        <Box mt={4} p={3} bg={calculatedBgColor} borderRadius="md">
                            <Text fontSize="sm" fontWeight="bold">Detalii rând:</Text>
                            <Text fontSize="sm">
                                Data: {activityRows[rowToDelete].date}<br/>
                                Șofer: {activityRows[rowToDelete].driver_name || 'Neselectat'}<br/>
                                Vehicul: {activityRows[rowToDelete].registration_number}
                            </Text>
                        </Box>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={cancelDelete}>
                        Anulează
                    </Button>
                    <Button 
                        colorScheme="red" 
                        onClick={() => rowToDelete !== null && removeRow(rowToDelete)}
                    >
                        Șterge Rândul
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
        </>
    );
}
