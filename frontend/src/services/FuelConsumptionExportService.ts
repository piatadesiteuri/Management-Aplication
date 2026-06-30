import * as XLSX from 'xlsx';

export interface FuelConsumptionData {
    month: string;
    year: string;
    fuelType: 'motorina' | 'benzina';
    vehicles: Array<{
        registrationNumber: string;
        driverName: string;
        startFuelLiters: number;
        startFuelLei: number;
        fuelAddedLiters: number;
        fuelAddedLei: number;
        totalFuelLiters: number;
        totalFuelLei: number;
        fuelConsumedLiters: number;
        fuelConsumedLei: number;
        endFuelLiters: number;
        endFuelLei: number;
    }>;
}

export class FuelConsumptionExportService {
    static exportToExcel(data: FuelConsumptionData): void {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([]);
        
        // Definirea stilurilor
        const titleStyle = {
            font: { bold: true, size: 14 },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: 'FFFFFF' } }
        };
        
        const monthStyle = {
            font: { bold: true, size: 12 },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: 'FFFFFF' } }
        };
        
        const headerStyle = {
            font: { bold: true, size: 10 },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            fill: { fgColor: { rgb: 'D3D3D3' } },
            border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
            }
        };
        
        const dataStyle = {
            font: { size: 10 },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
            }
        };
        
        const totalStyle = {
            font: { bold: true, size: 10 },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: 'A9A9A9' } },
            border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
            }
        };
        
        // Construirea datelor pentru export
        const rows = [];
        
        // Rândul 1 - Titlul principal
        rows.push(['', '', '', 'CENTRALIZATOR CONSUM MOTORINA', '', '', '', '', '', '', '', '']);
        
        // Rândul 2 - Luna
        const monthName = this.getMonthName(data.month);
        rows.push(['', '', '', `${monthName}.${data.year.slice(-2)}`, '', '', '', '', '', '', '', '']);
        
        // Rândul 3 - gol
        rows.push(['', '', '', '', '', '', '', '', '', '', '', '']);
        
        // Rândul 4 - Header principal (primul rând)
        rows.push([
            'Nr. Crt.',
            'Nr. înmatriculare',
            'Nume Prenume',
            'Rest în rezervor la începutul luni',
            '',
            'Carburant alimentat',
            '',
            'Total carburant /lună',
            '',
            'Carburant consumat /lună (litri)',
            'Valoare totală carburant consumat (lei)',
            'Rest în rezervor la sfârșitul luni',
            ''
        ]);
        
        // Rândul 5 - Header secundar (al doilea rând)
        rows.push([
            '',
            '',
            '',
            '(litri)',
            '(lei)*',
            '(litri)',
            '/lună (lei)',
            '/lună (litri) (4+6)',
            '/lună (lei) (5+7)',
            '',
            '',
            '(litri) (4+10)',
            '(lei)**'
        ]);
        
        // Datele pentru vehicule
        data.vehicles.forEach((vehicle, index) => {
            rows.push([
                index + 1,
                vehicle.registrationNumber,
                vehicle.driverName,
                vehicle.startFuelLiters.toFixed(2),
                vehicle.startFuelLei.toFixed(2),
                vehicle.fuelAddedLiters.toFixed(2),
                vehicle.fuelAddedLei.toFixed(2),
                vehicle.totalFuelLiters.toFixed(2),
                vehicle.totalFuelLei.toFixed(2),
                vehicle.fuelConsumedLiters.toFixed(2),
                vehicle.fuelConsumedLei.toFixed(2),
                vehicle.endFuelLiters.toFixed(2),
                vehicle.endFuelLei.toFixed(2)
            ]);
        });
        
        // Rândul TOTALURI
        const totals = this.calculateTotals(data.vehicles);
        rows.push([
            'TOTALURI',
            '',
            '',
            totals.totalStartFuelLiters.toFixed(2),
            totals.totalStartFuelLei.toFixed(2),
            totals.totalFuelAddedLiters.toFixed(2),
            totals.totalFuelAddedLei.toFixed(2),
            totals.totalFuelLiters.toFixed(2),
            totals.totalFuelLei.toFixed(2),
            totals.totalFuelConsumedLiters.toFixed(2),
            totals.totalFuelConsumedLei.toFixed(2),
            totals.totalEndFuelLiters.toFixed(2),
            totals.totalEndFuelLei.toFixed(2)
        ]);
        
        // Adaugă rânduri goale pentru separare
        rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '']);
        rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '']);
        rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '']);
        
        // Secțiunea de sumar (în afara tabelului, fără borduri)
        const avgConsumedLiters = data.vehicles.length > 0 ? 
            (totals.totalFuelConsumedLiters / data.vehicles.length).toFixed(2) : '0.00';
        const avgSuppliedLiters = data.vehicles.length > 0 ? 
            (totals.totalFuelAddedLiters / data.vehicles.length).toFixed(2) : '0.00';
            
        // Rândul pentru cantitatea medie consumată - mergează coloanele A-C, valoarea în D
        rows.push([
            'Cant. medie de carburant consumat per total parc auto',
            '', // Coloana B - se va merge cu A și C
            '', // Coloana C - se va merge cu A și B
            avgConsumedLiters, // Coloana D - valoarea calculată (ca în Excel original)
            '', // Coloana E
            '', // Coloana F
            '', // Coloana G
            '', // Coloana H
            '', // Coloana I
            '', // Coloana J
            '', // Coloana K
            '', // Coloana L
            ''  // Coloana M
        ]);
        
        // Rândul pentru cantitatea medie alimentată - mergează coloanele A-C, valoarea în D
        rows.push([
            'Cant. medie de carburant alimentat per total parc auto',
            '', // Coloana B - se va merge cu A și C
            '', // Coloana C - se va merge cu A și B
            avgSuppliedLiters, // Coloana D - valoarea calculată (ca în Excel original)
            '', // Coloana E
            '', // Coloana F
            '', // Coloana G
            '', // Coloana H
            '', // Coloana I
            '', // Coloana J
            '', // Coloana K
            '', // Coloana L
            ''  // Coloana M
        ]);
        
        // Rândul pentru semnătura - "Intocmit" mergează J:K, "ING. LOHON ANDREI" mergează J:K pe rândul următor
        rows.push([
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            'Intocmit', // Coloana J - se va merge cu K
            '', // Coloana K - se va merge cu J
            '', // Coloana L
            ''
        ]);
        
        // Rândul pentru numele
        rows.push([
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            'ING. LOHON ANDREI', // Coloana J - se va merge cu K
            '', // Coloana K - se va merge cu J
            '', // Coloana L
            ''
        ]);
        
        // Adaugă rânduri goale pentru separare
        rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '']);
        rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '']);
        rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '']);
        
        // Adaugă datele în worksheet
        XLSX.utils.sheet_add_aoa(worksheet, rows);
        
        // Aplică stilurile
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:M1');
        
        // Adaugă mergearea celulelor pentru secțiunea de sumar
        const totalRowsCount = rows.length;
        const summaryRow1Index = totalRowsCount - 7; // Rândul cu "Cant. medie de carburant consumat"
        const summaryRow2Index = totalRowsCount - 6; // Rândul cu "Cant. medie de carburant alimentat"
        const intocmitRowIndex = totalRowsCount - 5; // Rândul cu "Intocmit"
        const nameRowIndex = totalRowsCount - 4; // Rândul cu "ING. LOHON ANDREI"
        
        // Mergează celulele pentru label-uri (coloanele A-C)
        if (!worksheet['!merges']) {
            worksheet['!merges'] = [];
        }
        
        // Mergează A:C pentru primul rând de sumar (label-ul)
        worksheet['!merges'].push({
            s: { r: summaryRow1Index, c: 0 }, // Start row, col
            e: { r: summaryRow1Index, c: 2 }  // End row, col (A-C)
        });
        
        // Mergează A:C pentru al doilea rând de sumar (label-ul)
        worksheet['!merges'].push({
            s: { r: summaryRow2Index, c: 0 }, // Start row, col
            e: { r: summaryRow2Index, c: 2 }  // End row, col (A-C)
        });
        
        // Mergează J:K pentru "Intocmit"
        worksheet['!merges'].push({
            s: { r: intocmitRowIndex, c: 9 }, // Start row, col (J)
            e: { r: intocmitRowIndex, c: 10 }  // End row, col (K)
        });
        
        // Mergează J:K pentru "ING. LOHON ANDREI"
        worksheet['!merges'].push({
            s: { r: nameRowIndex, c: 9 }, // Start row, col (J)
            e: { r: nameRowIndex, c: 10 }  // End row, col (K)
        });
        
        // Stilizează titlul (rândul 1)
        for (let col = 0; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (worksheet[cellAddress]) {
                worksheet[cellAddress].s = titleStyle;
            }
        }
        
        // Stilizează luna (rândul 2)
        for (let col = 0; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col });
            if (worksheet[cellAddress]) {
                worksheet[cellAddress].s = monthStyle;
            }
        }
        
        // Stilizează header-urile (rândurile 4 și 5)
        for (let row = 3; row <= 4; row++) {
            for (let col = 0; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                if (worksheet[cellAddress]) {
                    worksheet[cellAddress].s = headerStyle;
                }
            }
        }
        
        // Stilizează datele
        for (let row = 5; row < range.e.r; row++) {
            for (let col = 0; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                if (worksheet[cellAddress]) {
                    worksheet[cellAddress].s = dataStyle;
                }
            }
        }
        
        // Stilizează rândul TOTALURI (ultimul rând)
        for (let col = 0; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: range.e.r, c: col });
            if (worksheet[cellAddress]) {
                worksheet[cellAddress].s = totalStyle;
            }
        }
        
        // Stilizează rândurile goale de sub secțiunea de sumar (fără bold, fără gri, doar liniile de grilă Excel)
        const emptyRowStyle = {
            font: { bold: false },
            fill: { fgColor: { rgb: 'FFFFFF' } },
            border: {} // Borduri goale pentru a nu face parte din tabel
        };
        
        // Stilizează rândurile goale de sub secțiunea de sumar
        for (let rowOffset = 1; rowOffset <= 4; rowOffset++) {
            const emptyRow = totalRowsCount - 4 + rowOffset;
            for (let col = 0; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: emptyRow, c: col });
                if (worksheet[cellAddress]) {
                    worksheet[cellAddress].s = emptyRowStyle;
                }
            }
        }
        
        
        // Merge cells pentru header-uri
        const merges = [
            // Titlul principal (rândul 1)
            { s: { r: 0, c: 3 }, e: { r: 0, c: 12 } },
            // Luna (rândul 2)
            { s: { r: 1, c: 3 }, e: { r: 1, c: 12 } },
            // Header principal (rândul 4)
            { s: { r: 3, c: 3 }, e: { r: 3, c: 4 } }, // Rest în rezervor la începutul lunii
            { s: { r: 3, c: 5 }, e: { r: 3, c: 6 } }, // Carburant alimentat
            { s: { r: 3, c: 7 }, e: { r: 3, c: 8 } }, // Total carburant /lună
            // Nu merge cells pentru Carburant consumat /lună - rămân separate
            { s: { r: 3, c: 11 }, e: { r: 3, c: 12 } }, // Rest în rezervor la sfârșitul lunii
            // TOTALURI (ultimul rând)
            { s: { r: range.e.r, c: 0 }, e: { r: range.e.r, c: 2 } },
            // Secțiunea de sumar - merge cells pentru textul lung
            { s: { r: summaryRow1Index, c: 0 }, e: { r: summaryRow1Index, c: 2 } }, // Primul rând de sumar
            { s: { r: summaryRow2Index, c: 0 }, e: { r: summaryRow2Index, c: 2 } }  // Al doilea rând de sumar
        ];
        
        worksheet['!merges'] = merges;
        
        // Setează lățimea coloanelor
        const colWidths = [
            { wch: 8 },  // A - Nr. Crt.
            { wch: 15 }, // B - Nr. înmatriculare
            { wch: 20 }, // C - Nume Prenume
            { wch: 10 }, // D - Litri
            { wch: 10 }, // E - Lei
            { wch: 10 }, // F - Litri
            { wch: 10 }, // G - Lei
            { wch: 10 }, // H - Litri
            { wch: 10 }, // I - Lei
            { wch: 10 }, // J - Litri
            { wch: 10 }, // K - Lei
            { wch: 10 }, // L - Litri
            { wch: 10 }  // M - Lei
        ];
        worksheet['!cols'] = colWidths;
        
        // Setează înălțimea rândurilor pentru secțiunea de sumar
        const rowHeights: XLSX.RowInfo[] = [];
        
        // Mărește înălțimea rândurilor de sumar (folosește variabilele deja declarate)
        rowHeights[summaryRow1Index] = { hpt: 25 }; // Înălțime mărită pentru primul rând de sumar
        rowHeights[summaryRow2Index] = { hpt: 25 }; // Înălțime mărită pentru al doilea rând de sumar
        
        worksheet['!rows'] = rowHeights;
        
        // Stilizează secțiunea de sumar (text normal, fără bold, apariția default Excel)
        // Aceasta trebuie să fie APLICATĂ DUPĂ toate stilurile de tabel pentru a le suprascrie
        const summaryStyle = {
            font: { bold: false, size: 10, color: { rgb: '000000' } },
            alignment: { horizontal: 'left', vertical: 'center' }
            // Nu setăm fill și border pentru a folosi apariția default Excel
        };
        
        // Stilizează rândurile de sumar (ultimele rânduri cu text)
        // Rândul cu "Cant. medie de carburant consumat"
        for (let col = 0; col <= range.e.c; col++) {
            const cellAddress1 = XLSX.utils.encode_cell({ r: summaryRow1Index, c: col });
            if (worksheet[cellAddress1]) {
                worksheet[cellAddress1].s = summaryStyle;
            }
        }
        
        // Rândul cu "Cant. medie de carburant alimentat"
        for (let col = 0; col <= range.e.c; col++) {
            const cellAddress2 = XLSX.utils.encode_cell({ r: summaryRow2Index, c: col });
            if (worksheet[cellAddress2]) {
                worksheet[cellAddress2].s = summaryStyle;
            }
        }
        
        // Rândul cu "Intocmit"
        for (let col = 0; col <= range.e.c; col++) {
            const cellAddress3 = XLSX.utils.encode_cell({ r: intocmitRowIndex, c: col });
            if (worksheet[cellAddress3]) {
                worksheet[cellAddress3].s = summaryStyle;
            }
        }
        
        // Rândul cu "ING. LOHON ANDREI"
        for (let col = 0; col <= range.e.c; col++) {
            const cellAddress4 = XLSX.utils.encode_cell({ r: nameRowIndex, c: col });
            if (worksheet[cellAddress4]) {
                worksheet[cellAddress4].s = summaryStyle;
            }
        }
        
        // Adaugă worksheet-ul în workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Consum Combustibil');
        
        // Generează numele fișierului
        const fileName = `${data.month}-${data.year}-${data.fuelType}.xlsx`;
        
        // Exportă fișierul
        XLSX.writeFile(workbook, fileName);
    }
    
    private static getMonthName(month: string): string {
        const months: { [key: string]: string } = {
            '01': 'IAN', '02': 'FEB', '03': 'MAR', '04': 'APR',
            '05': 'MAI', '06': 'IUN', '07': 'IUL', '08': 'AUG',
            '09': 'SEP', '10': 'OCT', '11': 'NOI', '12': 'DEC'
        };
        return months[month] || month;
    }
    
    private static calculateTotals(vehicles: FuelConsumptionData['vehicles']) {
        return vehicles.reduce((totals, vehicle) => {
            totals.totalStartFuelLiters += vehicle.startFuelLiters;
            totals.totalStartFuelLei += vehicle.startFuelLei;
            totals.totalFuelAddedLiters += vehicle.fuelAddedLiters;
            totals.totalFuelAddedLei += vehicle.fuelAddedLei;
            totals.totalFuelLiters += vehicle.totalFuelLiters;
            totals.totalFuelLei += vehicle.totalFuelLei;
            totals.totalFuelConsumedLiters += vehicle.fuelConsumedLiters;
            totals.totalFuelConsumedLei += vehicle.fuelConsumedLei;
            totals.totalEndFuelLiters += vehicle.endFuelLiters;
            totals.totalEndFuelLei += vehicle.endFuelLei;
            return totals;
        }, {
            totalStartFuelLiters: 0,
            totalStartFuelLei: 0,
            totalFuelAddedLiters: 0,
            totalFuelAddedLei: 0,
            totalFuelLiters: 0,
            totalFuelLei: 0,
            totalFuelConsumedLiters: 0,
            totalFuelConsumedLei: 0,
            totalEndFuelLiters: 0,
            totalEndFuelLei: 0
        });
    }
}