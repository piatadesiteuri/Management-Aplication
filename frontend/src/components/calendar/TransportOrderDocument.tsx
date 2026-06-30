import {
  Box,
  VStack,
  HStack,
  Button,
  Table,
  Tbody,
  Tr,
  Td,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { FiDownload, FiPrinter } from 'react-icons/fi';
import * as XLSX from 'xlsx';

interface TransportOrderDocumentProps {
  orderData: any;
  supplierData: any;
  orderItems: any[];
  userRoles?: string[];
}

export default function TransportOrderDocument({
  orderData,
  supplierData,
  orderItems,
  userRoles = []
}: TransportOrderDocumentProps) {
  // Debug: să vedem ce date primim
  console.log('TransportOrderDocument - orderData:', orderData);
  console.log('TransportOrderDocument - supplierData:', supplierData);
  console.log('TransportOrderDocument - orderItems:', orderItems);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.400', 'gray.600');
  
  const tvaRate = 19;
  const subtotal = orderItems.reduce((sum, item) => {
    const totalPrice = parseFloat(item.total_price || item.totalPrice || 0);
    console.log('🔢 Calculating subtotal - item:', item.product_name, 'total_price:', item.total_price, 'parsed:', totalPrice);
    return sum + totalPrice;
  }, 0);
  const tvaAmount = subtotal * (tvaRate / 100);
  const total = subtotal + tvaAmount;
  
  console.log('💰 Final calculations - subtotal:', subtotal, 'tvaAmount:', tvaAmount, 'total:', total);
  console.log('💰 OrderItems for calculation:', orderItems.map(item => ({
    name: item.product_name,
    total_price: item.total_price,
    parsed: parseFloat(item.total_price || 0)
  })));
  
  // Funcție export la Excel EXACT ca în poza 2
  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Structură EXACTĂ ca în poza 2
    const data: any[][] = [];
    
    // Rând 1: MINISTERUL SANATATII
    data.push(['MINISTERUL SANATATII', '', '', '', '', '', '', '', '', '', '', '', '']);
    // Rând 2: DIRECTIA DE SANATATE PUBLICA DOLJ | Fila (coloana K)
    data.push(['DIRECTIA DE SANATATE PUBLICA DOLJ', '', '', '', '', '', '', '', '', '', '', 'Fila', '']);
    // Rând 3: LOCALITATEA + CRAIOVA COD POȘTAL (ambele în B) | COMANDĂ (coloana H)
    data.push(['LOCALITATEA', 'CRAIOVA COD POȘTAL', '', '', '', '', '', 'COMANDĂ', '', '', '', '', '']);
    // Rând 4: STRADA + NR. | (dreapta gol)
    data.push(['STRADA', 'TABACI', 'NR.', '1', '', '', '', '', '', '', '', '', '']);
    // Rând 5: TELEFON/ FAX + numărul + JUDEȚUL + DOLJ | Către furnizor (cu numele furnizorului)
    data.push(['TELEFON/ FAX', '0251-310067', 'JUDEȚUL', 'DOLJ', '', '', '', `Către furnizor: ${supplierData?.name || 'Nume furnizor'}`, '', '', '', '', '']);
    // Rând 6: Localitatea (sub Către furnizor) - text normal
    data.push(['', '', '', '', '', '', '', 'Localitatea', '', '', '', '', '']);
    // Rând 7: Cod operații, Cod fiscal (doar B), Nr. comandă (în C), Data (cu 2 sub-coloane) | Strada + Nr. (text cu ______)
    data.push(['Cod operații', 'Cod fiscal', 'Nr. comandă', '', 'Data', '', 'An', 'Strada _____________', '', '', 'Nr. _____________', '']);
    // Rând 8: (gol) | Zi Luna (sub-coloanele pentru Data) | (gol pentru merge cu Strada)
    data.push(['', '', '', '', 'Zi', 'Luna', '', '', '', '', '', '']);
    // Rând 9: Date (11333620, orderNumber REAL în C) | Județul/Sector (text cu ______)
    data.push(['', '11333620', orderData.orderNumber || '2i', '', '', '', '', 'Județul/ Sector _____________', '', '', '', '', '']);
    // Rând 10: FAX (text normal)
    data.push(['', '', '', '', '', '', '', 'FAX:', '', '', '', '', '']);
    // Rând 10: gol
    data.push(['', '', '', '', '', '', '', '', '', '', '', '', '']);
    // Rând 11: Rugăm a expedia
    data.push(['Rugăm a expedia la adresa : Localitatea', '', 'CRAIOVA', 'Strada', 'TABACI', 'Nr. 1', '', '', '', '', '', '', '']);
    // Rând 12: Cod poștal
    data.push(['Cod poștal', '', '', 'Județul', 'DOLJ', '', '', '', '', '', '', '', '']);
    // Rând 13: Prin
    data.push(['Prin', '', '', 'la stația', '', '', '', '', '', '', '', '', '']);
    // Rând 14: Plata se va face
    data.push(['Plata se va face: Nr. Cont', '', 'Banca', '', 'Poz. plan', '', 'Capitol', '', 'Nr. rep.', '', '', '', '']);
    // Rând 15: Conform contract
    data.push(['Conform contract /referat/adresa nr.', '', '', '', '', '', '', '', '', '', '', '', '']);
    // Rând 16: Header tabel - DOAR O LINIE (NR.CRT se îmbină vertical cu coloana de produse)
    data.push(['NR.CRT', 'DENUMIREA PRODUSULUI SI CARACTERISTICI', '', 'U.M.', 'ARTICOL BUGETAR', 'SURSA DE FINANTARE', 'CANT.', 'PRET UNITAR', 'VALOARE', 'VAL. CU TVA', '', 'TERMEN DE LIVRARE', '', '']);
    
    // Rândurile 17-20: Produse - DOAR produsele existente
    orderItems.forEach((item, i) => {
      const unitPrice = parseFloat(item.unit_price || item.unitPrice || item.supplierPrice || 0);
      const quantity = parseFloat(item.quantity || 0);
      const totalPrice = parseFloat(item.total_price || item.totalPrice || 0);
      const itemTotal = totalPrice || (quantity * unitPrice);
      const itemTotalWithTVA = itemTotal * (1 + tvaRate / 100);
      
      data.push([
        (i + 1).toString(),
        item.product_name || item.productName || item.name || '',
        '',
        item.product_unit || item.unitOfMeasure || 'buc',
        '',
        '',
        Math.round(quantity).toString(),
        unitPrice.toFixed(2),
        itemTotal.toFixed(2),
        itemTotalWithTVA.toFixed(2),
        '',
        '',
        ''
      ]);
    });
    
    // Rând TOTAL - ultimul rând din tabel, în coloana CANT (G)
    data.push(['', '', '', '', '', '', 'TOTAL', '', subtotal.toFixed(2), total.toFixed(2), '', '']);
    
    // Rând Semnături - titlurile (3 poziții separate, FĂRĂ delimitări între ele)
    data.push(['DIRECTOR EXECUTIV,', '', '', '', 'DIRECTOR EXECUTIV ADJ ECONOMIC,', '', '', '', 'ȘEF SERVICIU ADMINISTRATIV MENTANȚA', '', '', '', '']);
    // Rând Numele (3 persoane separate, FĂRĂ delimitări între ele) - EXACT sub titluri
    data.push(['Ec. MICU DORIN,', '', '', '', 'Ec. NICOLAE MARCU,', '', '', '', 'Ing. ALINA POPA', '', '', '', '']);
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Merge-uri de celule EXACT ca în șablon
    ws['!merges'] = [
      // Rând 1: MINISTERUL SANATATII (A1:M1)
      { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
      // Rând 2: DIRECTIA (A2:J2)
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
      // Rând 3: COD POȘTAL merge eliminat - acum este în B3 cu CRAIOVA
      // Rând 3: COMANDĂ merge eliminat - acum este doar în H3
      // Rând 5: TELEFON/ FAX merge (A5:B5)
      { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
      // Rând 5: Către furnizor (H5:I5)
      { s: { r: 4, c: 7 }, e: { r: 4, c: 8 } },
      // Rând 6: Localitatea (H6:I6)
      { s: { r: 5, c: 7 }, e: { r: 5, c: 8 } },
      // Rând 7: Cod fiscal - NU mai este îmbinat cu C (doar B7)
      // Rând 7: Data merge (E7:F7) - header pentru Zi, Luna
      { s: { r: 6, c: 4 }, e: { r: 6, c: 5 } },
      // Rând 7: Strada (H7:I8) - merge vertical pentru a face rândul mai mare
      { s: { r: 6, c: 7 }, e: { r: 7, c: 8 } },
      // Rând 7: Nr. (K7:L7) - merge orizontal pentru numărul
      { s: { r: 6, c: 10 }, e: { r: 6, c: 11 } },
      // Rând 9: Județul/Sector (H9:I9)
      { s: { r: 8, c: 7 }, e: { r: 8, c: 8 } },
      // Rând 10: FAX (H10:I10)
      { s: { r: 9, c: 7 }, e: { r: 9, c: 8 } },
      // Rând 11: Rugăm a expedia (A11:B11)
      { s: { r: 10, c: 0 }, e: { r: 10, c: 1 } },
      // Rând 14: Plata se va face merge (A14:B14)
      { s: { r: 13, c: 0 }, e: { r: 13, c: 1 } },
      // Rând 15: Conform contract merge (A15:M15)
      { s: { r: 14, c: 0 }, e: { r: 14, c: 12 } },
      // Rând 16: Header tabel - DOAR O LINIE
      // DENUMIREA merge (B16:C16)
      { s: { r: 15, c: 1 }, e: { r: 15, c: 2 } },
      // VAL. CU TVA merge (J16:J16) - doar o coloană
      // TERMEN DE LIVRARE merge (K16:M16) - o singură celulă mare pe toate 3 sub-coloane
      { s: { r: 15, c: 10 }, e: { r: 15, c: 12 } },
      // Produse (rânduri 17-23) - merge pentru DENUMIREA (B:C pentru fiecare rând de produs)
      // Rândurile 17-20: Produse - DOAR produsele existente
      ...orderItems.map((_, i) => ({ s: { r: 16 + i, c: 1 }, e: { r: 16 + i, c: 2 } })),
      // Rând TOTAL - NU are merge, fiecare celulă este separată (G, I, J)
      // Rând Semnături - 3 zone separate cu merge-uri corecte (după TOTAL)
      { s: { r: 17 + orderItems.length + 1, c: 0 }, e: { r: 17 + orderItems.length + 1, c: 3 } }, // Blocul 1: A-D
      { s: { r: 17 + orderItems.length + 1, c: 4 }, e: { r: 17 + orderItems.length + 1, c: 7 } }, // Blocul 2: E-H  
      { s: { r: 17 + orderItems.length + 1, c: 8 }, e: { r: 17 + orderItems.length + 1, c: 11 } }, // Blocul 3: I-L
      // Rând Nume - 3 zone separate cu merge-uri corecte (aceleași ca titlurile)
      { s: { r: 17 + orderItems.length + 2, c: 0 }, e: { r: 17 + orderItems.length + 2, c: 3 } }, // Blocul 1: A-D
      { s: { r: 17 + orderItems.length + 2, c: 4 }, e: { r: 17 + orderItems.length + 2, c: 7 } }, // Blocul 2: E-H
      { s: { r: 17 + orderItems.length + 2, c: 8 }, e: { r: 17 + orderItems.length + 2, c: 11 } }, // Blocul 3: I-L
    ];
    
    // Setări pentru coloane
    ws['!cols'] = [
      { wch: 12 }, // A - NR.CRT
      { wch: 30 }, // B - DENUMIREA (larg!)
      { wch: 8 },  // C
      { wch: 8 },  // D - U.M.
      { wch: 15 }, // E - ARTICOL BUGETAR
      { wch: 15 }, // F - SURSA DE FINANTARE
      { wch: 8 },  // G - CANT.
      { wch: 12 }, // H - PRET UNITAR
      { wch: 10 }, // I - VALOARE
      { wch: 12 }, // J - VAL. CU TVA
      { wch: 8 },  // K
      { wch: 18 }, // L - TERMEN DE LIVRARE
      { wch: 8 }   // M
    ];
    
    // Adăugăm formatare EXACT ca în șablon - 2 TABELE SEPARATE
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:M30');
    
    // Aplicăm formatare pe toate celulele
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        
        // Creăm celula dacă nu există
        if (!ws[cellAddress]) {
          ws[cellAddress] = { t: 's', v: '' };
        }
        
        if (!ws[cellAddress].s) ws[cellAddress].s = {};
        
        // BORDERE doar pe 2 TABELE:
        // TABEL 1: Rânduri 7-9 (Cod operații, date) - DOAR coloanele A-J (0-9)
        // TABEL 2: Rânduri 16-24 (Header tabel + produse + TOTAL)
        const cellValue = ws[cellAddress].v || '';
        
        // TABEL 1: rânduri 6-8 (indexare de la 0), COLOANE A-G (0-6)
        // Coloana D (index 3) NU are bordere verticale și NU are bordere orizontale interne
        const isTable1 = (R >= 6 && R <= 8) && (C >= 0 && C <= 6); // Acoperă A-G pentru rândurile 7-9
        // TABEL 2: rânduri 15-23 (header + produse + total) - doar produsele existente
        const isTable2 = (R >= 15 && R <= 15 + orderItems.length + 1); // Header + produse + TOTAL
        
        const needsBorder = isTable1 || isTable2;
        
        if (needsBorder) {
          // Pentru TABEL 1: bordere exterioare continue (A-G), interne doar pe A-C și E-G
          if (isTable1) {
            // Bordere exterioare: sus și jos pe toată lățimea (A-G)
            const isTopRow = (R === 6); // Rândul 7 (index 6)
            const isBottomRow = (R === 8); // Rândul 9 (index 8)
            
            // Bordere interne: doar pe A-C și E-G, NU pe D
            const isInternalRow = (R === 7); // Rândul 8 (index 7)
            const isLeftBlock = (C >= 0 && C <= 2); // A-C
            const isRightBlock = (C >= 4 && C <= 6); // E-G
            const isColumnD = (C === 3); // Coloana D
            
            // Bordere exterioare: sus și jos pe toată lățimea (A-G) EXEPT coloana D
            if (isTopRow || isBottomRow) {
              if (!isColumnD) {
                ws[cellAddress].s.border = {
                  top: { style: 'thin', color: { rgb: '000000' } },
                  bottom: { style: 'thin', color: { rgb: '000000' } },
                  left: { style: 'thin', color: { rgb: '000000' } },
                  right: { style: 'thin', color: { rgb: '000000' } }
                };
              } else {
                // Pentru coloana D: bordere sus/jos + stânga/dreapta (D6-D7 și D9-D10)
                ws[cellAddress].s.border = {
                  top: { style: 'thin', color: { rgb: '000000' } },
                  bottom: { style: 'thin', color: { rgb: '000000' } },
                  left: { style: 'thin', color: { rgb: '000000' } },
                  right: { style: 'thin', color: { rgb: '000000' } }
                };
              }
            }
            // Bordere interne: doar pe A-C și E-G, NU pe D
            else if (isInternalRow) {
              if (isLeftBlock || isRightBlock) {
                ws[cellAddress].s.border = {
                  top: { style: 'thin', color: { rgb: '000000' } },
                  bottom: { style: 'thin', color: { rgb: '000000' } },
                  left: { style: 'thin', color: { rgb: '000000' } },
                  right: { style: 'thin', color: { rgb: '000000' } }
                };
              } else if (isColumnD) {
                // Pentru coloana D: NU avem bordere interne - doar sus și jos (simple, nu îngroșate)
                ws[cellAddress].s.border = {
                  top: { style: 'none', color: { rgb: '000000' } },
                  bottom: { style: 'none', color: { rgb: '000000' } },
                  left: { style: 'none', color: { rgb: '000000' } },
                  right: { style: 'none', color: { rgb: '000000' } }
                };
              }
            }
          } else if (isTable2) {
            // Pentru TABEL 2: bordere complete, EXCEPT pentru rândul TOTAL la coloanele B-C
            const isTotalRow = (R === 16 + orderItems.length); // Rândul TOTAL (header este 15, produsele încep de la 16)
            const isTotalRowProductName = isTotalRow && (C >= 1 && C <= 2); // Coloanele B-C pentru DENUMIREA
            
            if (isTotalRowProductName) {
              // Pentru rândul TOTAL, coloanele B-C (DENUMIREA) - NU avem bordere
              ws[cellAddress].s.border = {
                top: { style: 'none', color: { rgb: '000000' } },
                bottom: { style: 'none', color: { rgb: '000000' } },
                left: { style: 'none', color: { rgb: '000000' } },
                right: { style: 'none', color: { rgb: '000000' } }
              };
            } else {
              // Pentru restul TABEL 2: bordere complete
              ws[cellAddress].s.border = {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } }
              };
            }
          }
        }
        
        // ALINIERE IMPLICITĂ - toate la stânga, centru vertical
        ws[cellAddress].s.alignment = { 
          vertical: 'center', 
          horizontal: 'left',
          wrapText: false
        };
        
        // RÂND 1: MINISTERUL SANATATII - bold, stânga
        if (R === 0) {
          ws[cellAddress].s.font = { bold: true, sz: 11 };
          ws[cellAddress].s.alignment = { vertical: 'center', horizontal: 'left' };
        }
        
        // RÂND 2: DIRECTIA DE SANATATE PUBLICA DOLJ - bold, stânga
        if (R === 1) {
          ws[cellAddress].s.font = { bold: true, sz: 11 };
          ws[cellAddress].s.alignment = { vertical: 'center', horizontal: 'left' };
        }
        
        // RÂND 3: LOCALITATEA (nu bold), CRAIOVA COD POȘTAL (ambele în B), COMANDĂ
        if (R === 2) {
          if (cellValue === 'LOCALITATEA') {
            ws[cellAddress].s.font = { bold: false, sz: 10 };
          }
          if (cellValue === 'CRAIOVA COD POȘTAL') {
            // Pentru formatare parțială, folosim rich text
            ws[cellAddress].s.font = { bold: false, sz: 10 };
            // Formatare parțială: doar "CRAIOVA" bold, "COD POȘTAL" normal
            ws[cellAddress].s.richText = [
              { text: 'CRAIOVA ', font: { bold: true, sz: 10 } },
              { text: 'COD POȘTAL', font: { bold: false, sz: 10 } }
            ];
          }
          if (cellValue === 'COMANDĂ') {
            ws[cellAddress].s.font = { bold: true, sz: 14 };
            ws[cellAddress].s.alignment = { vertical: 'center', horizontal: 'center' };
          }
        }
        
        // RÂND 4: STRADA, TABACI, NR., 1
        if (R === 3) {
          if (cellValue === 'STRADA' || cellValue === 'TABACI' || cellValue === 'NR.' || cellValue === '1') {
            ws[cellAddress].s.font = { bold: true, sz: 10 };
          }
        }
        
        // RÂND 5: TELEFON/ FAX, JUDEȚUL, DOLJ | Către furnizor (text liber)
        if (R === 4) {
          if (cellValue === 'TELEFON/ FAX' || cellValue === '0251-310067' || cellValue === 'JUDEȚUL' || cellValue === 'DOLJ') {
            ws[cellAddress].s.font = { bold: true, sz: 10 };
          }
          // Câmpuri de completare din dreapta - text normal FĂRĂ linie de subliniere
          if (cellValue && cellValue.includes('Către furnizor')) {
            console.log('✅ Formatting Către furnizor:', cellAddress, cellValue);
            ws[cellAddress].s.font = { sz: 9 };
            ws[cellAddress].s.alignment = { vertical: 'center', horizontal: 'left' };
          }
        }
        
        // RÂND 6: Localitatea - text normal
        if (R === 5) {
          if (cellValue && cellValue.includes('Localitatea')) {
            console.log('✅ Formatting Localitatea:', cellAddress, cellValue);
            ws[cellAddress].s.font = { sz: 9 };
            ws[cellAddress].s.alignment = { vertical: 'center', horizontal: 'left' };
          }
        }
        
        // RÂNDURI 7-9: Cod operații, date (stânga cu bordere) | Câmpuri completare (dreapta fără bordere)
        if (R >= 6 && R <= 8) {
          if (cellValue === 'Cod operații' || cellValue === 'Cod fiscal' || cellValue === 'Nr. comandă' || 
              cellValue === 'Data' || cellValue === 'Zi' || cellValue === 'Luna' || cellValue === 'An') {
            ws[cellAddress].s.font = { bold: false, sz: 9 };
          }
          // RÂND 7: Data - CENTRAT
          if (R === 6 && cellValue === 'Data') {
            ws[cellAddress].s.alignment = { vertical: 'center', horizontal: 'center' };
          }
          // RÂND 8: Zi, Luna, An - CENTRATE
          if (R === 7 && (cellValue === 'Zi' || cellValue === 'Luna' || cellValue === 'An')) {
            ws[cellAddress].s.alignment = { vertical: 'center', horizontal: 'center' };
          }
          // Câmpuri de completare din dreapta - text normal cu ______ (fără border)
          if (cellValue && (cellValue.includes('Strada') || cellValue.includes('Nr. _______'))) {
            console.log('✅ Formatting completion field:', cellAddress, cellValue);
            ws[cellAddress].s.font = { sz: 9 };
            ws[cellAddress].s.alignment = { vertical: 'center', horizontal: 'left' };
          }
          // Date din tabel (11333620, orderNumber)
          if (cellValue === '11333620' || cellValue === orderData.orderNumber || cellValue === '2i') {
            ws[cellAddress].s.font = { bold: true, sz: 10 };
          }
        }
        
        // RÂNDURI 9-10: Câmpuri de completare - text normal
        if (R >= 8 && R <= 9) {
          if (cellValue && (cellValue.includes('Județul/ Sector') || cellValue.includes('FAX:'))) {
            console.log('✅ Formatting completion field:', cellAddress, cellValue);
            ws[cellAddress].s.font = { sz: 9 };
            ws[cellAddress].s.alignment = { vertical: 'center', horizontal: 'left' };
            // FAX: fără border, Județul/ Sector cu ______ (fără border)
          }
        }
        
        // RÂNDURI 11-15: Rugăm a expedia, Cod poștal, etc.
        if (R >= 10 && R <= 14) {
          if (cellValue.includes('Rugăm') || cellValue === 'Cod poștal' || cellValue === 'Prin' || 
              cellValue.includes('Plata') || cellValue.includes('Conform')) {
            ws[cellAddress].s.font = { sz: 9 };
          }
          if (cellValue === 'CRAIOVA' || cellValue === 'TABACI' || cellValue === 'Nr. 1' || 
              cellValue === 'DOLJ' || cellValue === 'Banca' || cellValue === 'Capitol') {
            ws[cellAddress].s.font = { bold: true, sz: 9 };
          }
        }
        
        // RÂND 16: HEADER TABEL - DOAR O LINIE, bold, centrat, FĂRĂ culori de fundal!
        if (R === 15) {
          ws[cellAddress].s.font = { bold: true, sz: 9 };
          ws[cellAddress].s.alignment = { 
            vertical: 'center', 
            horizontal: 'center',
            wrapText: true 
          };
          
          // TERMEN DE LIVRARE - centrat pe mijlocul celor 3 sub-coloane (K, L, M)
          if (cellValue === 'TERMEN DE LIVRARE') {
            ws[cellAddress].s.alignment = { 
              vertical: 'center', 
              horizontal: 'center'
            };
          }
        }
        
        // RÂNDURI 17-23: PRODUSE (7 rânduri)
        if (R >= 16 && R <= 22) {
          // Numerele produselor (1-7) - centrat
          if (C === 0 && cellValue) {
            ws[cellAddress].s.alignment = { vertical: 'center', horizontal: 'center' };
          }
          // Coloanele cu valori numerice - aliniere dreapta
          if (C >= 6 && C <= 9) {
            ws[cellAddress].s.alignment = { vertical: 'center', horizontal: 'right' };
          }
        }
        
        // RÂND TOTAL - ultimul rând din tabel, în coloana CANT (G)
        const totalRowIndex = 17 + orderItems.length; // Rândul TOTAL (header este 16, produsele încep de la 17)
        if (R === totalRowIndex) {
          if (cellValue === 'TOTAL') {
            ws[cellAddress].s.font = { bold: true, sz: 10 };
            ws[cellAddress].s.alignment = { vertical: 'center', horizontal: 'center' };
          }
          // Valorile TOTAL - bold, dreapta
          if (C === 8 || C === 9) {
            ws[cellAddress].s.font = { bold: true, sz: 10 };
            ws[cellAddress].s.alignment = { vertical: 'center', horizontal: 'right' };
          }
        }
        
        // RÂNDURI SEMNĂTURI - bold și vizibile cu virgule, left-aligned în celulele unite
        const signatureRow1Index = totalRowIndex + 1; // Rândul cu titlurile
        const signatureRow2Index = totalRowIndex + 2; // Rândul cu numele
        if (R === signatureRow1Index || R === signatureRow2Index) {
          if (cellValue.includes('DIRECTOR') || cellValue.includes('Ec.') || cellValue.includes('Ing.') || 
              cellValue.includes('ȘEF SERVICIU')) {
            ws[cellAddress].s.font = { bold: true, sz: 10 };
            ws[cellAddress].s.alignment = { vertical: 'center', horizontal: 'left' };
          }
        }
      }
    }
    
    
    XLSX.utils.book_append_sheet(wb, ws, 'Comandă');
    
    // Scriem fișierul Excel
    XLSX.writeFile(wb, `Comanda_${orderData.orderNumber || 'Transport'}_${new Date().toLocaleDateString('ro-RO')}.xlsx`);
  };

  return (
    <Box bg={bgColor} w="full" maxW="100%" overflow="hidden">
      <VStack spacing={3} align="stretch">
        {/* Butoane acțiuni - doar pentru inspector și admin */}
        {userRoles.some(role => ['INSPECTOR', 'ADMIN', 'SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER'].includes(role)) && (
          <HStack justify="flex-end" spacing={3} className="no-print">
            <Button
              leftIcon={<Icon as={FiDownload} />}
              colorScheme="green"
              size="md"
              onClick={handleExportToExcel}
              shadow="md"
            >
              Export Excel
            </Button>
            <Button
              leftIcon={<Icon as={FiPrinter} />}
              colorScheme="blue"
              size="md"
              onClick={() => window.print()}
              shadow="md"
            >
              Printează
            </Button>
          </HStack>
        )}
        
        {/* Document EXACT ca în poza 2 */}
        <Box 
          border="2px solid" 
          borderColor={borderColor}
          bg={bgColor}
          className="excel-document"
          w="100%"
          maxW="100%"
          overflow="auto"
          shadow="lg"
          borderRadius="md"
        >
          <Table 
            variant="simple" 
            size="sm"
            w="100%"
            sx={{
              'td': {
                border: '1px solid',
                borderColor: useColorModeValue('gray.400', 'gray.500'),
                padding: '6px 8px',
                fontSize: '11px',
                color: useColorModeValue('gray.900', 'gray.100'),
                lineHeight: '1.3',
                verticalAlign: 'middle',
                height: '28px'
              },
              'table': {
                tableLayout: 'fixed',
                width: '100%',
                borderCollapse: 'collapse'
              }
            }}
          >
            <Tbody>
              {/* Rând 1: MINISTERUL SANATATII */}
              <Tr>
                <Td colSpan={13} textAlign="left" fontWeight="bold" fontSize="14px" bg={useColorModeValue('white', 'gray.800')}>
                  MINISTERUL SANATATII
                </Td>
              </Tr>
              
              {/* Rând 2: DIRECTIA DE SANATATE PUBLICA DOLJ */}
              <Tr>
                <Td colSpan={10} textAlign="left" fontWeight="bold" fontSize="13px" bg={useColorModeValue('white', 'gray.800')}>
                  DIRECTIA DE SANATATE PUBLICA DOLJ
                </Td>
                <Td fontWeight="bold" textAlign="right">Fila</Td>
                <Td></Td>
                <Td></Td>
              </Tr>
              
              {/* Rând 3: gol */}
              <Tr><Td colSpan={13} height="20px" bg={useColorModeValue('white', 'gray.800')}></Td></Tr>
              
              {/* Rând 4: LOCALITATEA + COMANDĂ */}
              <Tr>
                <Td fontWeight="bold" width="150px">LOCALITATEA</Td>
                <Td fontWeight="bold" width="150px">CRAIOVA COD POȘTAL</Td>
                <Td width="80px"></Td>
                <Td width="80px"></Td>
                <Td width="80px"></Td>
                <Td width="80px"></Td>
                <Td width="80px"></Td>
                <Td width="80px"></Td>
                <Td colSpan={2} fontWeight="bold" fontSize="16px" textAlign="center">COMANDĂ</Td>
                <Td width="80px"></Td>
                <Td width="80px"></Td>
                <Td width="80px"></Td>
              </Tr>
              
              {/* Rând 5: STRADA */}
              <Tr>
                <Td fontWeight="bold">STRADA</Td>
                <Td fontWeight="bold">TABACI</Td>
                <Td fontWeight="bold">NR.</Td>
                <Td fontWeight="bold">1</Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td fontWeight="bold">Către furnizor: {supplierData?.name || 'Nume furnizor'}</Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
              </Tr>
              
              {/* Rând 6: TELEFON */}
              <Tr>
                <Td fontWeight="bold">TELEFON/ FAX</Td>
                <Td fontWeight="bold">0251-310067</Td>
                <Td fontWeight="bold">JUDEȚUL</Td>
                <Td fontWeight="bold">DOLJ</Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td fontWeight="bold">Localitatea _____________</Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
              </Tr>
              
              {/* Rând 7: gol */}
              <Tr><Td colSpan={13} height="20px"></Td></Tr>
              
              {/* Rând 8: Cod operații */}
              <Tr>
                <Td fontWeight="bold">Cod operații</Td>
                <Td fontWeight="bold">Cod fiscal</Td>
                <Td fontWeight="bold">Nr. comandă</Td>
                <Td></Td>
                <Td colSpan={3} fontWeight="bold" textAlign="center">Data</Td>
                <Td></Td>
                <Td fontWeight="bold">Strada _____________ Nr. _______</Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
              </Tr>
              
              {/* Rând 9: Zi Luna An */}
              <Tr>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td fontWeight="bold" textAlign="center">Zi</Td>
                <Td fontWeight="bold" textAlign="center">Luna</Td>
                <Td fontWeight="bold" textAlign="center">An</Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
              </Tr>
              
              {/* Rând 10: Date */}
              <Tr>
                <Td></Td>
                <Td fontWeight="bold">11333620</Td>
                <Td fontWeight="bold">{orderData.orderNumber || '175922959'}</Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td fontWeight="bold">Județul/ Sector _____________</Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
              </Tr>
              
              {/* Rând 11: FAX */}
              <Tr>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td fontWeight="bold">FAX: _____________</Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
              </Tr>
              
              {/* Rând 12: gol */}
              <Tr><Td colSpan={13} height="20px"></Td></Tr>
              
              {/* Rând 13: Rugăm a expedia */}
              <Tr>
                <Td colSpan={2} fontWeight="bold">Rugăm a expedia la adresa : Localitatea</Td>
                <Td fontWeight="bold">CRAIOVA</Td>
                <Td fontWeight="bold">Strada</Td>
                <Td fontWeight="bold">TABACI</Td>
                <Td fontWeight="bold">Nr. 1</Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
              </Tr>
              
              {/* Rând 13: Cod poștal */}
              <Tr>
                <Td fontWeight="bold">Cod poștal</Td>
                <Td></Td>
                <Td></Td>
                <Td fontWeight="bold">Județul</Td>
                <Td fontWeight="bold">DOLJ</Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
              </Tr>
              
              {/* Rând 14: Prin */}
              <Tr>
                <Td fontWeight="bold">Prin</Td>
                <Td></Td>
                <Td></Td>
                <Td fontWeight="bold">la stația</Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
              </Tr>
              
              {/* Rând 15: Plata se va face */}
              <Tr>
                <Td fontWeight="bold">Plata se va face: Nr. Cont</Td>
                <Td></Td>
                <Td fontWeight="bold">Banca</Td>
                <Td></Td>
                <Td fontWeight="bold">Poz. plan</Td>
                <Td></Td>
                <Td fontWeight="bold">Capitol</Td>
                <Td></Td>
                <Td fontWeight="bold">Nr. rep.</Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
              </Tr>
              
              {/* Rând 16: Conform contract */}
              <Tr>
                <Td fontWeight="bold">Conform contract /referat/adresa nr.</Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
              </Tr>
              
              {/* Rând 16: Header tabel produse - UN SINGUR RÂND ca în șablon */}
              <Tr bg={useColorModeValue('blue.50', 'blue.900')}>
                <Td textAlign="center" fontWeight="bold" fontSize="10px">NR.CRT</Td>
                <Td colSpan={2} textAlign="center" fontWeight="bold" fontSize="10px">
                  DENUMIREA PRODUSULUI SI CARACTERISTICI
                </Td>
                <Td textAlign="center" fontWeight="bold" fontSize="10px">U.M.</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="10px">ARTICOL BUGETAR</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="10px">
                  SURSA DE FINANȚARE
                </Td>
                <Td textAlign="center" fontWeight="bold" fontSize="10px">CANT.</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="10px">PREȚ UNITAR</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="10px">VALOARE</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="10px">VAL. CU TVA</Td>
                <Td></Td>
                <Td textAlign="center" fontWeight="bold" fontSize="10px">TERMEN DE LIVRARE</Td>
                <Td></Td>
              </Tr>
              
              {/* Rândurile 17-20: Produse - DOAR produsele existente */}
              {orderItems.map((item, i) => {
                const unitPrice = parseFloat(item.unit_price || item.unitPrice || item.supplierPrice || 0);
                const quantity = parseFloat(item.quantity || 0);
                const totalPrice = parseFloat(item.total_price || item.totalPrice || 0);
                const itemTotal = totalPrice || (quantity * unitPrice);
                const itemTotalWithTVA = itemTotal * (1 + tvaRate / 100);
                
                return (
                  <Tr key={i}>
                    <Td textAlign="center">{(i + 1).toString()}</Td>
                    <Td colSpan={2}>{item.product_name || item.productName || item.name || ''}</Td>
                    <Td textAlign="center">{item.product_unit || item.unitOfMeasure || 'buc'}</Td>
                    <Td></Td>
                    <Td></Td>
                    <Td textAlign="center">{Math.round(quantity)}</Td>
                    <Td textAlign="right">{unitPrice.toFixed(2)}</Td>
                    <Td textAlign="right">{itemTotal.toFixed(2)}</Td>
                    <Td textAlign="right">{itemTotalWithTVA.toFixed(2)}</Td>
                    <Td></Td>
                    <Td></Td>
                    <Td></Td>
                  </Tr>
                );
              })}
              
              {/* Rând liber după produse */}
              <Tr>
                <Td colSpan={13} height="20px"></Td>
              </Tr>
              
              {/* Rând 25: TOTAL - poziționat exact ca în șablon */}
              <Tr bg={useColorModeValue('green.50', 'green.900')}>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td textAlign="center" fontWeight="bold" fontSize="12px">TOTAL</Td>
                <Td></Td>
                <Td textAlign="right" fontWeight="bold" fontSize="12px" color={useColorModeValue('blue.700', 'blue.300')}>
                  {subtotal.toFixed(2)}
                </Td>
                <Td textAlign="right" fontWeight="bold" fontSize="12px" color={useColorModeValue('green.700', 'green.300')}>
                  {total.toFixed(2)}
                </Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
              </Tr>
              
              {/* Rând 26: Semnături */}
              <Tr>
                <Td colSpan={2} fontWeight="bold" fontSize="10px">DIRECTOR EXECUTIV,</Td>
                <Td colSpan={3} fontWeight="bold" fontSize="10px">DIRECTOR EXECUTIV ADJ ECONOMIC,</Td>
                <Td colSpan={5} fontWeight="bold" fontSize="10px">ȘEF SERVICIU ADMINISTRATIV MENTENANȚA</Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
              </Tr>
              
              {/* Rând 27: Nume */}
              <Tr>
                <Td colSpan={2} fontWeight="bold" fontSize="11px">Ec. MICU DORIN VIOREL</Td>
                <Td colSpan={3} fontWeight="bold" fontSize="11px">Ec. NICOLAE MARCU</Td>
                <Td colSpan={5} fontWeight="bold" fontSize="11px">Ing. ALINA POPA</Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
              </Tr>
              
              {/* Rând 29: gol */}
              <Tr><Td colSpan={13} height="20px"></Td></Tr>
              
              {/* Rând 30: Notă finală */}
              <Tr>
                <Td colSpan={13} fontSize="10px" fontStyle="italic">
                  Produsele sa fie insotite de aviz de insotire a marfii, certificate de calitate, declaratie de conformitate.
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </Box>
        
        {/* Stil pentru print */}
        <style>{`
          @media print {
            .no-print {
              display: none !important;
            }
            .excel-document {
              box-shadow: none !important;
              border: 1px solid black !important;
            }
          }
        `}</style>
      </VStack>
    </Box>
  );
}