import * as XLSX from 'xlsx';
import { DailyActivitySheet } from './DailyActivityService';

export interface DailyActivityExportData {
    month: string;
    year: string;
    vehicleInfo: {
        registrationNumber: string;
        brand: string;
        model: string;
        fuelType: string;
        averagePrice: number;
    };
    rows: DailyActivitySheet[];
}

export class DailyActivityExportService {
    static exportToExcel(data: DailyActivityExportData): void {
        // Creează workbook nou
        const workbook = XLSX.utils.book_new();
        
        // Creează worksheet
        const worksheet = XLSX.utils.aoa_to_sheet([]);
        
        // Setează lățimea coloanelor (MARI ca în imaginea 2) - 19 coloane pentru 4 sub-celule în PARCURS
        const colWidths = [
            { wch: 25 }, // A - Nr. Foaie (MARE pentru text vertical)
            { wch: 20 }, // B - Data (MARE pentru text vertical)
            { wch: 30 }, // C - Nr. înmatriculare (MARE pentru text vertical)
            { wch: 35 }, // D - Nume șofer (MARE pentru text vertical)
            { wch: 25 }, // E - Timp exploatare (MARE pentru text vertical)
            { wch: 15 }, // F - INTERIOR (Sub EFECTIV) - ECHILIBRAT
            { wch: 15 }, // G - EXTERIOR (Sub EFECTIV) - ECHILIBRAT
            { wch: 18 }, // H - ECHIVALENT (Sub PARCURS) - ECHILIBRAT
            { wch: 25 }, // I - REST ÎN REZERVOR LA ÎNCEPUTUL ZILEI (MARE pentru text vertical) - ECHILIBRAT
            { wch: 15 }, // J - LICHID (Sub ALIMENTĂRI) - ECHILIBRAT
            { wch: 15 }, // K - NUMERIC (Sub BCF) - ECHILIBRAT
            { wch: 20 }, // L - ECHIVALENT LITRI (MARE pentru text vertical) - ECHILIBRAT
            { wch: 20 }, // M - CONSUM EFECTIV (MARE pentru text vertical) - ECHILIBRAT
            { wch: 15 }, // N - Urban (Sub CONSUM) - ECHILIBRAT
            { wch: 15 }, // O - Extraurban (Sub CONSUM) - ECHILIBRAT
            { wch: 25 }, // P - REST ÎN REZERVOR LA SFÂRȘITUL ZILEI (MARE pentru text vertical) - ECHILIBRAT
            { wch: 20 }, // Q - Preț/litru (Sub CALCUL ALIMENTĂRI)
            { wch: 30 }  // R - Valoare alimentată în lei (MARE pentru text vertical)
        ];
        worksheet['!cols'] = colWidths;
        
        // Setează înălțimea rândurilor (MARI pentru text vertical) - 4 RÂNDURI DE HEADER (ca PARCURS)
        const rowHeights = [
            { hpt: 30 }, // Rândul 1 - Titlu
            { hpt: 20 }, // Rândul 2 - gol
            { hpt: 25 }, // Rândul 3 - Info vehicul
            { hpt: 25 }, // Rândul 4 - Preț mediu
            { hpt: 25 }, // Rândul 5 - Calcul alimentări
            { hpt: 20 }, // Rândul 6 - gol
            { hpt: 80 }, // Rândul 7 - Header (MARE pentru text vertical)
            { hpt: 60 }, // Rândul 8 - Sub-header (MARE pentru text vertical)
            { hpt: 50 }, // Rândul 9 - Sub-sub-header cu BCF
            { hpt: 40 }, // Rândul 10 - Sub-sub-sub-header pentru NUMERIC/ECHIVALENT LITRI
        ];
        worksheet['!rows'] = rowHeights;
        
        // Definiește stilurile
        const headerStyle = {
            font: { bold: true, size: 12 },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
            }
        };
        
        const verticalTextStyle = {
            font: { bold: true, size: 12 },
            alignment: { horizontal: 'center', vertical: 'center', textRotation: 90, wrapText: true },
            border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
            }
        };
        
        const dataStyle = {
            font: { size: 12 },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
            }
        };
        
        const numberStyle = {
            font: { size: 12 },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
            }
        };
        
        // Header-uri și informații generale
        const rows = [];
        
        // Rândul 1 - Titlul principal
        rows.push(['DIRECȚIA DE SĂNĂTATE PUBLICĂ DOLJ', '', '', '', 'FIȘA ACTIVITĂȚII ZILNICE PENTRU AUTOVEHICULE', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        
        // Rândul 2 - gol
        rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        
        // Rândul 3 - Informații vehicul
        rows.push(['LUNA', data.month, data.year, '', 'Nr. de înmatriculare', data.vehicleInfo.registrationNumber, 'MARCA ȘI TIPUL', data.vehicleInfo.brand + ' ' + data.vehicleInfo.model, '', '', '', '', '', '', '', 'COMBUSTIBIL', data.vehicleInfo.fuelType, '']);
        
        // Rândul 4 - Preț mediu
        rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Valoare medie motorina lei/litru', '', data.vehicleInfo.averagePrice]);
        
        // Rândul 5 - gol
        rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        
        // Rândul 6 - gol
        rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        
        // Header-urile tabelului - Rândul 7 (Index 6) - Antet Părinte
        const headerRow7 = [
            'Nr. Foaie de parcurs',
            'DATA',
            'NR. ÎNMATRICULARE',
            'NUME PRENUME ȘOFER',
            'TIMP ÎN EXPLOATARE',
            'PARCURS (KM)', '', '', // F, G, H (3 coloane pentru PARCURS)
            'CARBURANȚI', '', '', '', '', '', '', '', '', // I-Q (9 coloane pentru CARBURANȚI)
            'Calcul alimentări', '' // Q-R (Calcul alimentări unit cu celula goală din stânga)
        ];
        rows.push(headerRow7);
        
        // Header-urile tabelului - Rândul 8 (Index 7) - Antet Copil cu EFECTIV și ECHIVALENT separate
        const headerRow8 = [
            '', '', '', '', '', // A-E goale (primele 5 coloane pe un singur rând)
            'EFECTIV', // F (merge cu G)
            '', // G (va fi INTERIOR pe rândul 9)
            'ECHIVALENT', // H (va fi ECHIVALENT pe 2 rânduri)
            'REST ÎN REZERVOR LA ÎNCEPUTUL ZILEI', // I (sub CARBURANȚI)
            'ALIMENTĂRI', '', '', // J-L (merge pe 3 coloane pentru LICHID și BCF)
            'CONSUM', '', '', '', // M-P (merge pe 4 coloane pentru CONSUM EFECTIV, CONSUM NORMAT L/100KM și REST ÎN REZERVOR LA SFÂRȘITUL ZILEI)
            'Preț/litru', // Q (sub Calcul alimentări)
            'Valoare alimentată în lei' // R (sub Calcul alimentări)
        ];
        rows.push(headerRow8);
        
        // Header-urile tabelului - Rândul 9 (Index 8) - SUB-COLOANELE PE 2 RÂNDURI
        const headerRow9 = [
            '', '', '', '', '', // A-E goale (primele 5 coloane pe un singur rând)
            'INTERIOR', // F (Sub EFECTIV) - TEXT VERTICAL pe 2 rânduri
            'EXTERIOR', // G (Sub EFECTIV) - TEXT VERTICAL pe 2 rânduri
            '', // H (se uneste cu ECHIVALENT de deasupra pe 3 rânduri)
            '', // I (se uneste cu REST ÎN REZERVOR de deasupra pe 3 rânduri)
            'LICHID', // J (Sub ALIMENTĂRI) - TEXT VERTICAL pe 2 rânduri
            'BCF', '', // K-L (BCF merge doar pe 2 coloane pentru NUMERIC și ECHIVALENT LITRI)
            'CONSUM EFECTIV', // M (Sub CONSUM) - TEXT VERTICAL pe 2 rânduri
            'CONSUM NORMAT L/100KM', '', // N-O (CONSUM NORMAT L/100KM merge pe 2 coloane pentru Urban și Extraurban)
            'REST ÎN REZERVOR LA SFÂRȘITUL ZILEI', // P (Sub CONSUM) - TEXT VERTICAL pe 2 rânduri (ca CONSUM EFECTIV)
            '', // Q (se uneste cu Preț/litru de deasupra pe 2 rânduri)
            ''  // R (se uneste cu Valoare de deasupra pe 2 rânduri)
        ];
        rows.push(headerRow9);
        
        // Header-urile tabelului - Rândul 10 (Index 9) - Sub-coloane pentru BCF (NUMERIC și ECHIVALENT LITRI)
        const headerRow10 = [
            '', '', '', '', '', // A-E goale (primele 5 coloane pe un singur rând)
            '', '', '', '', '', // F-J goale (se unesc cu celulele de deasupra)
            'NUMERIC', // K (Sub BCF - în stânga)
            'ECHIVALENT LITRI', // L (Sub BCF - în dreapta)
            '', // M (se uneste cu CONSUM EFECTIV de deasupra)
            'Urban', // N (Sub CONSUM NORMAT L/100KM - în stânga)
            'Extraurban', // O (Sub CONSUM NORMAT L/100KM - în dreapta)
            '', // P (se uneste cu REST ÎN REZERVOR LA SFÂRȘITUL ZILEI de deasupra)
            '', // Q (se uneste cu Preț/litru de deasupra)
            ''  // R (se uneste cu Valoare de deasupra)
        ];
        rows.push(headerRow10);
        
        // Adaugă datele
        data.rows.forEach((row) => {
            const dateStr = row.date ? new Date(row.date).toLocaleDateString('ro-RO') : '';
            const dataRow = [
                row.trip_sheet_number || '', // A
                dateStr, // B
                row.registration_number || '', // C
                `${row.first_name || ''} ${row.last_name || ''}`.trim() || '', // D
                row.operating_time_hours || '', // E
                row.kilometers_interior || '', // F (INTERIOR - Sub EFECTIV)
                row.kilometers_exterior || '', // G (EXTERIOR - Sub EFECTIV)
                row.kilometers_equivalent || '', // H (ECHIVALENT)
                row.start_day_fuel_liters || '', // I (REST ÎN REZERVOR LA ÎNCEPUTUL ZILEI)
                row.liquid_fuel_added || '', // J (LICHID - Sub ALIMENTĂRI)
                row.numeric_fuel || '', // K (NUMERIC - Sub ALIMENTĂRI)
                row.equivalent_liters || '', // L (ECHIVALENT LITRI - Sub ALIMENTĂRI)
                row.actual_consumption_liters || '', // M (CONSUM EFECTIV - Sub CARBURANȚI)
                row.standard_consumption_urban || '', // N (URBAN - consum normat urban)
                row.standard_consumption_extraurban || '', // O (EXTRAURBAN - consum normat extraurban)
                row.end_day_fuel_liters || '', // P (REST ÎN REZERVOR LA SFÂRȘITUL ZILEI)
                row.price_per_liter || '', // Q (Preț/litru)
                ((Number(row.liquid_fuel_added) || 0) * (Number(row.price_per_liter) || 0)).toFixed(2) // R (Valoare alimentată în lei = LICHID * Preț/litru)
            ];
            rows.push(dataRow);
        });
        
        // Calculează totalurile din datele existente
        const totals = {
            totalInterior: data.rows.reduce((sum: number, row: any) => sum + (parseFloat(row.kilometers_interior) || 0), 0),
            totalExterior: data.rows.reduce((sum: number, row: any) => sum + (parseFloat(row.kilometers_exterior) || 0), 0),
            totalLiquid: data.rows.reduce((sum: number, row: any) => sum + (parseFloat(row.liquid_fuel_added) || 0), 0),
            totalNumeric: data.rows.reduce((sum: number, row: any) => sum + (parseFloat(row.numeric_fuel) || 0), 0),
            totalEquivalent: data.rows.reduce((sum: number, row: any) => sum + (parseFloat(row.equivalent_liters) || 0), 0),
            totalConsumption: data.rows.reduce((sum: number, row: any) => sum + (parseFloat(row.actual_consumption_liters) || 0), 0),
            totalUrban: data.rows.reduce((sum: number, row: any) => sum + (parseFloat(row.standard_consumption_urban) || 0), 0),
            totalExtraurban: data.rows.reduce((sum: number, row: any) => sum + (parseFloat(row.standard_consumption_extraurban) || 0), 0),
            totalValue: data.rows.reduce((sum: number, row: any) => sum + ((Number(row.liquid_fuel_added) || 0) * (Number(row.price_per_liter) || 0)), 0)
        };
        
        // Adaugă rândul TOTAL sub tabel (după datele din tabel) - poziționat ca restul rândurilor
        rows.push([
            'TOTAL', // A - doar "TOTAL" în prima coloană
            '', // B
            '', // C
            '', // D
            '', // E
            totals.totalInterior.toFixed(2), // F - INTERIOR
            totals.totalExterior.toFixed(2), // G - EXTERIOR
            '0', // H - ECHIVALENT (nu se calculează în totaluri)
            '', // I - REST ÎN REZERVOR LA ÎNCEPUTUL ZILEI (nu se include în totaluri)
            totals.totalLiquid.toFixed(2), // J - LICHID
            totals.totalNumeric.toFixed(2), // K - NUMERIC
            totals.totalEquivalent.toFixed(2), // L - ECHIVALENT LITRI
            totals.totalConsumption.toFixed(2), // M - CONSUM EFECTIV
            totals.totalUrban.toFixed(2), // N - Urban (consum normat urban total)
            totals.totalExtraurban.toFixed(2), // O - Extraurban (consum normat extraurban total)
            '', // P - REST ÎN REZERVOR LA SFÂRȘITUL ZILEI (nu se include în totaluri)
            '', // Q - Preț/litru (nu se include în totaluri)
            totals.totalValue.toFixed(2) // R - Valoare alimentată în lei
        ]);
        
        // Adaugă secțiunea de sumar după rândul TOTAL (fără borduri)
        const startFuel = data.rows.length > 0 ? (Number(data.rows[0].start_day_fuel_liters) || 0) : 0;
        const endFuel = data.rows.length > 0 ? (Number(data.rows[data.rows.length - 1].end_day_fuel_liters) || 0) : 0;
        
        rows.push(['']); // Rând gol pentru separare
        rows.push(['Rest în rezervor la începutul lunii (litri)', startFuel.toFixed(2)]);
        rows.push(['Nr. Total de km parcurși', (totals.totalInterior + totals.totalExterior).toFixed(2)]);
        rows.push(['Total alimentat', (totals.totalLiquid + totals.totalNumeric + totals.totalEquivalent).toFixed(2)]);
        rows.push(['Consum total de carburant (litri)', totals.totalConsumption.toFixed(2)]);
        rows.push(['Rest în rezervor la sfârșitul lunii (litri)', endFuel.toFixed(2)]);
        rows.push(['Valoare totală alimentată (lei)', totals.totalValue.toFixed(2)]);
        
        // Adaugă datele în worksheet
        XLSX.utils.sheet_add_aoa(worksheet, rows);
        
        // Aplică stilurile
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:S1');
        
        // Stilizează header-urile (Index 6, 7) - Text vertical pe mai multe coloane - SIMPLIFICAT
        for (let row = 6; row <= 7; row++) {
            for (let col = 0; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                if (worksheet[cellAddress]) {
                    // Rândul 7 (Index 6) - Header principal
                    if (row === 6) {
                        if ([0, 1, 2, 3, 4, 14].includes(col)) { // Coloane cu text vertical pe rândul principal (A-E pe 4 rânduri, fără coloana 8 - REST ÎN REZERVOR, fără coloana 9 - CARBURANȚI, fără coloana 9-11 - ALIMENTĂRI)
                            worksheet[cellAddress].s = verticalTextStyle;
                        } else {
                            worksheet[cellAddress].s = headerStyle; // Toate celelalte coloane, inclusiv Calcul alimentări (coloanele 16-17)
                        }
                    }
                    // Rândul 8 (Index 7) - Sub-header cu EFECTIV și ECHIVALENT
                    else if (row === 7) {
                        if ([0, 1, 2, 3, 4, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17].includes(col)) { // Coloane cu text vertical (cu coloana 8 - REST ÎN REZERVOR, cu coloana 9 - LICHID, cu coloana 12 - CONSUM EFECTIV, cu coloanele 13-15 - Urban, Extraurban și REST ÎN REZERVOR LA SFÂRȘITUL ZILEI, cu coloanele 16-17 - Preț/litru și Valoare alimentată)
                            worksheet[cellAddress].s = verticalTextStyle;
                        } else {
                            worksheet[cellAddress].s = headerStyle;
                        }
                    }
                }
            }
        }
        
        // Stilizează datele (rândurile 8+)
        for (let row = 8; row <= range.e.r; row++) {
            for (let col = 0; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                if (worksheet[cellAddress]) {
                    // Excepție pentru rândul TOTAL și rândurile de sumar - fără borduri
                    const totalRowIndex = 10 + data.rows.length; // Index-ul rândului TOTAL (10 rânduri de header + date)
                    const summaryStartIndex = totalRowIndex + 2; // Index-ul primului rând de sumar (după rândul gol)
                    const summaryEndIndex = summaryStartIndex + 5; // Ultimul rând de sumar (6 rânduri de sumar: 0-5)
                    
                    if (row === totalRowIndex) { // Rândul TOTAL
                        // Stil fără borduri pentru rândul TOTAL - fără bold pentru a se potrivi cu restul
                        const noBorderStyle = {
                            font: { bold: false, size: 12 },
                            alignment: { 
                                horizontal: col === 0 ? 'left' : 'right',
                                vertical: 'center'
                            },
                            border: {
                                top: { style: 'none' },
                                bottom: { style: 'none' },
                                left: { style: 'none' },
                                right: { style: 'none' }
                            }
                        };
                        worksheet[cellAddress].s = noBorderStyle;
                    } else if (row >= summaryStartIndex && row <= summaryEndIndex) { // Rândurile de sumar
                        // Stil fără borduri pentru rândurile de sumar
                        const summaryStyle = {
                            font: { size: 12 },
                            alignment: { 
                                horizontal: col === 0 ? 'left' : 'right',
                                vertical: 'center'
                            },
                            border: {
                                top: { style: 'none' },
                                bottom: { style: 'none' },
                                left: { style: 'none' },
                                right: { style: 'none' }
                            }
                        };
                        worksheet[cellAddress].s = summaryStyle;
                    } else {
                        // Coloanele cu numere (inclusiv coloanele 14 și 15 pentru Urban și Extraurban)
                        if ([4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].includes(col)) {
                            worksheet[cellAddress].s = numberStyle;
                        } else {
                            // Pentru coloana C (NR. ÎNMATRICULARE) - forțează alinierea la centru
                            if (col === 2) {
                                const centeredStyle = {
                                    font: { size: 12 },
                                    alignment: { horizontal: 'center', vertical: 'center' },
                                    border: {
                                        top: { style: 'thin' },
                                        bottom: { style: 'thin' },
                                        left: { style: 'thin' },
                                        right: { style: 'thin' }
                                    }
                                };
                                worksheet[cellAddress].s = centeredStyle;
                            } else {
                                worksheet[cellAddress].s = dataStyle;
                            }
                        }
                    }
                }
            }
        }
        
        // *** MERGES MINIMALE PENTRU FORMAT VALID ***
        const merges = [
            // Rândul 1 (Index 0) - Titlul principal
            { s: { r: 0, c: 0 }, e: { r: 0, c: 17 } },
            
            
            // STRUCTURA EXACTĂ CA ÎN POZA 2:
            // Anteturi principale pe rândul 7 (index 6), coloanele A-E, pe 4 rânduri (ca în imagine)
            { s: { r: 6, c: 0 }, e: { r: 9, c: 0 } }, // A - Nr. Foaie de parcurs pe 4 rânduri
            { s: { r: 6, c: 1 }, e: { r: 9, c: 1 } }, // B - DATA pe 4 rânduri
            { s: { r: 6, c: 2 }, e: { r: 9, c: 2 } }, // C - NR. ÎNMATRICULARE pe 4 rânduri
            { s: { r: 6, c: 3 }, e: { r: 9, c: 3 } }, // D - NUME PRENUME ȘOFER pe 4 rânduri
            { s: { r: 6, c: 4 }, e: { r: 9, c: 4 } }, // E - TIMP ÎN EXPLOATARE pe 4 rânduri
            
            // PARCURS (KM) pe rândul 7 (index 6), coloanele F-H
            { s: { r: 6, c: 5 }, e: { r: 6, c: 7 } }, // F-H - PARCURS (KM)
            
            // EFECTIV pe rândul 8 (index 7), coloanele F-G (o singură celulă)
            { s: { r: 7, c: 5 }, e: { r: 7, c: 6 } }, // F-G - EFECTIV (o singură celulă)
            
            // INTERIOR pe rândul 9 (index 8), coloana F, pe 2 rânduri
            { s: { r: 8, c: 5 }, e: { r: 9, c: 5 } }, // F - INTERIOR pe 2 rânduri
            
            // EXTERIOR pe rândul 9 (index 8), coloana G, pe 2 rânduri
            { s: { r: 8, c: 6 }, e: { r: 9, c: 6 } }, // G - EXTERIOR pe 2 rânduri
            
            // ECHIVALENT pe rândul 8 (index 7), coloana H, pe toată lungimea
            { s: { r: 7, c: 7 }, e: { r: 9, c: 7 } }, // H - ECHIVALENT pe 3 rânduri
            
            // CARBURANȚI pe rândul 7 (index 6), coloanele I-Q
            { s: { r: 6, c: 8 }, e: { r: 6, c: 15 } }, // I-Q - CARBURANȚI
            
            // Calcul alimentări pe rândul 7 (index 6), coloanele Q-R (unite cu celula goală din stânga)
            { s: { r: 6, c: 16 }, e: { r: 6, c: 17 } }, // Q-R - Calcul alimentări (unite cu celula goală din stânga, deasupra celor două subcoloane)
            
            // REST ÎN REZERVOR LA ÎNCEPUTUL ZILEI pe rândul 8 (index 7), coloana I, pe 3 rânduri
            { s: { r: 7, c: 8 }, e: { r: 9, c: 8 } }, // I - REST ÎN REZERVOR LA ÎNCEPUTUL ZILEI pe 3 rânduri
            
            // ALIMENTĂRI pe rândul 8 (index 7), coloanele J-L
            { s: { r: 7, c: 9 }, e: { r: 7, c: 11 } }, // J-L - ALIMENTĂRI (3 coloane pentru LICHID și BCF)
            
            // LICHID pe rândul 9 (index 8), coloana J, pe 2 rânduri
            { s: { r: 8, c: 9 }, e: { r: 9, c: 9 } }, // J - LICHID pe 2 rânduri
            
            // BCF pe rândul 9 (index 8), coloanele K-L
            { s: { r: 8, c: 10 }, e: { r: 8, c: 11 } }, // K-L - BCF (2 coloane pentru NUMERIC și ECHIVALENT LITRI)
            
            // CONSUM pe rândul 8 (index 7), coloanele M-P
            { s: { r: 7, c: 12 }, e: { r: 7, c: 15 } }, // M-P - CONSUM (4 coloane pentru CONSUM EFECTIV, CONSUM NORMAT L/100KM și REST ÎN REZERVOR LA SFÂRȘITUL ZILEI)
            
            // CONSUM EFECTIV pe rândul 9 (index 8), coloana M, pe 2 rânduri (ca LICHID)
            { s: { r: 8, c: 12 }, e: { r: 9, c: 12 } }, // M - CONSUM EFECTIV pe 2 rânduri
            
            // CONSUM NORMAT L/100KM pe rândul 9 (index 8), coloanele N-O
            { s: { r: 8, c: 13 }, e: { r: 8, c: 14 } }, // N-O - CONSUM NORMAT L/100KM (2 coloane pentru Urban și Extraurban)
            
            // Urban pe rândul 10 (index 9), coloana N, pe 2 rânduri (ca NUMERIC)
            { s: { r: 9, c: 13 }, e: { r: 10, c: 13 } }, // N - Urban pe 2 rânduri
            
            // Extraurban pe rândul 10 (index 9), coloana O, pe 2 rânduri (ca ECHIVALENT LITRI)
            { s: { r: 9, c: 14 }, e: { r: 10, c: 14 } }, // O - Extraurban pe 2 rânduri
            
            // REST ÎN REZERVOR LA SFÂRȘITUL ZILEI pe rândul 9 (index 8), coloana P, pe 2 rânduri (ca CONSUM EFECTIV)
            { s: { r: 8, c: 15 }, e: { r: 10, c: 15 } }, // P - REST ÎN REZERVOR LA SFÂRȘITUL ZILEI pe 3 rânduri (pentru text vertical complet)
            
            // Preț/litru pe rândul 8 (index 7), coloana Q, pe 3 rânduri
            { s: { r: 7, c: 16 }, e: { r: 9, c: 16 } }, // Q - Preț/litru pe 3 rânduri
            
            // Valoare alimentată în lei pe rândul 8 (index 7), coloana R, pe 3 rânduri
            { s: { r: 7, c: 17 }, e: { r: 9, c: 17 } }, // R - Valoare alimentată în lei pe 3 rânduri
        ];
        
        worksheet['!merges'] = merges;
        
        // Setează înălțimea rândurilor pentru a face celulele mai înalte
        worksheet['!rows'] = [
            { hpt: 30 }, // Rândul 1 - Titlu principal
            { hpt: 20 }, // Rândul 2
            { hpt: 20 }, // Rândul 3
            { hpt: 20 }, // Rândul 4
            { hpt: 20 }, // Rândul 5
            { hpt: 20 }, // Rândul 6
            { hpt: 25 }, // Rândul 7 - Header principal
            { hpt: 80 }, // Rândul 8 - Header cu text vertical (mai înalt pentru REST ÎN REZERVOR)
            { hpt: 25 }, // Rândul 9 - Sub-header
            { hpt: 25 }, // Rândul 10 - Sub-header
        ];
        
        // Elimină liniile de delimitare (page breaks) care apar ca linii albastre punctate
        worksheet['!margins'] = {
            left: 0.7,
            right: 0.7,
            top: 0.75,
            bottom: 0.75,
            header: 0.3,
            footer: 0.3
        };
        
        // Elimină page breaks și liniile de delimitare
        worksheet['!pageSetup'] = {
            paperSize: 9, // A4
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 1,
            horizontalCentered: true,
            verticalCentered: false
        };
        
        // Elimină liniile de delimitare verticale
        worksheet['!printGridlines'] = false;
        
        // Adaugă worksheet-ul la workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Fișa Activității');
        
        // Generează numele fișierului
        const fileName = `Fisa_Activitati_${data.vehicleInfo.registrationNumber}_${data.month}_${data.year}.xlsx`;
        
        // Exportă fișierul
        XLSX.writeFile(workbook, fileName);
    }
}
