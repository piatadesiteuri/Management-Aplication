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
import * as XLSX from 'xlsx-js-style';

interface TransportOrderDocumentProps {
  orderData: any;
  supplierData: any;
  orderItems: any[];
  userRoles?: string[];
}

const TVA_RATE = 19;

// Structura documentului respectă macheta oficială DSP Dolj:
// 12 coloane (A-L), header pe 2 rânduri (titluri + subtitluri -LEI-/ZI/LUNA/AN),
// rânduri de produse fără merge, rând TOTAL, semnături.
const HEADER_ROW_1 = 15; // rândul cu NR.CRT / DENUMIREA / U.M. / ...
const HEADER_ROW_2 = 16; // rândul cu -LEI-/-LEI-/-LEI- și ZI/LUNA/AN
const ITEMS_START = 17;

export default function TransportOrderDocument({
  orderData,
  supplierData,
  orderItems,
  userRoles = []
}: TransportOrderDocumentProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.400', 'gray.600');
  const headerBg = useColorModeValue('blue.50', 'blue.900');
  const totalBg = useColorModeValue('green.50', 'green.900');

  const items = orderItems.map((item) => {
    const unitPrice = parseFloat(item.unit_price || item.unitPrice || item.supplierPrice || 0);
    const quantity = parseFloat(item.quantity || 0);
    const totalPriceRaw = parseFloat(item.total_price || item.totalPrice || 0);
    const totalPrice = totalPriceRaw || quantity * unitPrice;
    const totalWithTva = totalPrice * (1 + TVA_RATE / 100);
    return {
      name: item.product_name || item.productName || item.name || '',
      unit: item.product_unit || item.unitOfMeasure || 'buc',
      quantity,
      unitPrice,
      totalPrice,
      totalWithTva,
    };
  });

  const subtotal = items.reduce((sum, it) => sum + it.totalPrice, 0);
  const total = items.reduce((sum, it) => sum + it.totalWithTva, 0);

  const orderDate = orderData?.orderDate ? new Date(orderData.orderDate) : new Date();
  const zi = Number.isNaN(orderDate.getTime()) ? '' : String(orderDate.getDate()).padStart(2, '0');
  const luna = Number.isNaN(orderDate.getTime()) ? '' : String(orderDate.getMonth() + 1).padStart(2, '0');
  const an = Number.isNaN(orderDate.getTime()) ? '' : String(orderDate.getFullYear());

  const supplierName = supplierData?.name || 'Necunoscut';
  const supplierCity = supplierData?.city || '';
  const supplierAddress = supplierData?.address || '';
  const supplierCounty = supplierData?.county || '';
  const supplierPhone = supplierData?.phone || '';
  const orderNumber = orderData?.orderNumber || '';

  const totalRowIndex = ITEMS_START + items.length;
  const signRow1 = totalRowIndex + 1;
  const signRow2 = totalRowIndex + 2;
  const noteRow = totalRowIndex + 4;

  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const data: any[][] = [];

    data.push(['MINISTERUL SANATATII']);
    data.push(['DIRECTIA DE SANATATE PUBLICA DOLJ', null, null, null, null, null, null, null, null, null, 'Fila']);
    data.push(['LOCALITATEA    CRAIOVA       COD POŞTAL', null, null, null, null, null, null, 'COMANDĂ']);
    data.push(['STRADA      TABACI             NR.            1']);
    data.push(['TELEFON/ FAX 0251-310067  JUDEŢUL  DOLJ', null, null, null, null, null, null, null, `Către furnizor  ${supplierName}`]);
    data.push([null, null, null, null, null, null, null, null, supplierCity ? `Localitatea     ${supplierCity}` : 'Localitatea']);
    data.push(['Cod operații', 'Cod fiscal', 'Nr. comandă', null, 'Data', null, null, null, `Strada  ${supplierAddress || '_____________________'}`]);
    data.push([null, null, null, null, 'Zi', 'Luna', 'An', null, `Județul/ Sector   ${supplierCounty || '_____________________'}`]);
    data.push([null, 11333620, orderNumber, null, zi, luna, an, null, `FAX/Tel:  ${supplierPhone || '_____________________'}`]);
    data.push([null]);
    data.push(['Rugăm a expedia la adresa : Localitatea     CRAIOVA           Strada     TABACI       Nr. 1']);
    data.push(['Cod poştal__________________________________________Judeţul   DOLJ']);
    data.push(['Prin_________________________________________ la staţia _____________________________________']);
    data.push(['Plata se va face: Nr. Cont ________ Banca _____________ Poz. plan ______ Capitol ___________ Nr. rep. _______']);
    data.push([' Conform  contract /referat/adresa nr. _______________________________  __________________________']);
    data.push(['NR.CRT', 'DENUMIREA PRODUSULUI SI CARACTERISTICI', 'U.M.', 'ARTICOL BUGETAR', 'SURSA DE FINANTARE', 'CANT.', 'PREȚ UNITAR', 'VALOARE', 'VAL. CU TVA', 'TERMEN DE LIVRARE']);
    data.push([null, null, null, null, null, null, '-LEI-', '-LEI-', '-LEI-', 'ZI', 'LUNA', 'AN']);

    items.forEach((it, i) => {
      data.push([
        i + 1,
        it.name,
        it.unit,
        null,
        null,
        Math.round(it.quantity),
        Number(it.unitPrice.toFixed(2)),
        Number(it.totalPrice.toFixed(2)),
        Number(it.totalWithTva.toFixed(2)),
        null, null, null
      ]);
    });

    data.push([null, null, null, null, null, 'TOTAL', null, Number(subtotal.toFixed(2)), Number(total.toFixed(2))]);
    data.push([null, 'DIRECTOR EXECUTIV,                               DIRECTOR EXECUTIV ADJ ECONOMIC,                                SEF SERVICIU ADMINISTRATIV MENTENANTA']);
    data.push([null, 'Ec. MICU DORIN VIOREL                        Ec. NICOLAE MARCU                                                   ', null, null, null, null, null, null, '          Ing. ALINA POPA']);
    data.push([null]);
    data.push([null, 'Produsele sa fie insotite de aviz de insotire a marfii, certificate de calitate, declaratie de conformitate.']);

    const ws = XLSX.utils.aoa_to_sheet(data);

    ws['!merges'] = [
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
      { s: { r: HEADER_ROW_1, c: 2 }, e: { r: HEADER_ROW_2, c: 2 } },
      { s: { r: HEADER_ROW_1, c: 4 }, e: { r: HEADER_ROW_2, c: 4 } },
      { s: { r: HEADER_ROW_1, c: 5 }, e: { r: HEADER_ROW_2, c: 5 } },
      { s: { r: HEADER_ROW_1, c: 9 }, e: { r: HEADER_ROW_1, c: 11 } },
      { s: { r: 6, c: 4 }, e: { r: 6, c: 5 } },
      { s: { r: 4, c: 8 }, e: { r: 4, c: 11 } },
      { s: { r: 5, c: 8 }, e: { r: 5, c: 11 } },
      { s: { r: 8, c: 8 }, e: { r: 8, c: 11 } },
    ];

    ws['!cols'] = [
      { wch: 10 }, { wch: 33 }, { wch: 9 }, { wch: 11 }, { wch: 11 },
      { wch: 8 }, { wch: 10 }, { wch: 11 }, { wch: 12 }, { wch: 7 }, { wch: 7 }, { wch: 8 },
    ];

    const thin = { style: 'thin', color: { rgb: '000000' } };
    const fullBorder = { top: thin, bottom: thin, left: thin, right: thin };

    const setStyle = (r: number, c: number, style: any) => {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      ws[addr].s = { ...(ws[addr].s || {}), ...style };
    };

    // Bordură + aliniere DOAR pentru cele două zone tabelare (info + produse).
    // IMPORTANT: nu creăm celule goale în restul rândurilor (11-15, semnături etc.),
    // altfel Excel nu mai lasă textul lung dintr-o singură celulă să "curgă" peste
    // celulele vecine goale, iar textul apare trunchiat la marginea coloanei A.
    const applyGridBorder = (rowStart: number, rowEnd: number, colStart: number, colEnd: number) => {
      for (let R = rowStart; R <= rowEnd; R++) {
        for (let C = colStart; C <= colEnd; C++) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[addr]) ws[addr] = { t: 's', v: '' };
          if (!ws[addr].s) ws[addr].s = {};
          ws[addr].s.alignment = { vertical: 'center', horizontal: 'left', wrapText: false };
          ws[addr].s.border = fullBorder;
        }
      }
    };
    applyGridBorder(6, 8, 0, 6); // Cod operații / Cod fiscal / Nr. comandă / Data / Zi-Luna-An
    applyGridBorder(HEADER_ROW_1, totalRowIndex, 0, 11); // header produse + produse + TOTAL

    setStyle(0, 0, { font: { bold: true, sz: 12 } });
    setStyle(1, 0, { font: { bold: true, sz: 11 } });
    setStyle(1, 10, { font: { bold: true }, alignment: { horizontal: 'right' } });
    setStyle(2, 0, { font: { bold: true, sz: 10 } });
    setStyle(2, 7, { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center', vertical: 'center' } });
    setStyle(3, 0, { font: { bold: true, sz: 10 } });
    setStyle(4, 0, { font: { bold: true, sz: 10 } });
    setStyle(4, 8, { font: { bold: true, sz: 9 } });
    setStyle(5, 8, { font: { sz: 9 } });
    setStyle(6, 0, { font: { sz: 9 } });
    setStyle(6, 1, { font: { sz: 9 } });
    setStyle(6, 2, { font: { sz: 9 } });
    setStyle(6, 4, { font: { sz: 9 }, alignment: { horizontal: 'center' } });
    setStyle(6, 8, { font: { sz: 9 } });
    setStyle(7, 4, { font: { sz: 9 }, alignment: { horizontal: 'center' } });
    setStyle(7, 5, { font: { sz: 9 }, alignment: { horizontal: 'center' } });
    setStyle(7, 6, { font: { sz: 9 }, alignment: { horizontal: 'center' } });
    setStyle(7, 8, { font: { sz: 9 } });
    setStyle(8, 1, { font: { bold: true, sz: 10 } });
    setStyle(8, 2, { font: { bold: true, sz: 10 } });
    setStyle(8, 4, { font: { bold: true, sz: 10 }, alignment: { horizontal: 'center' } });
    setStyle(8, 5, { font: { bold: true, sz: 10 }, alignment: { horizontal: 'center' } });
    setStyle(8, 6, { font: { bold: true, sz: 10 }, alignment: { horizontal: 'center' } });
    setStyle(8, 8, { font: { sz: 9 } });

    for (let c = 0; c <= 11; c++) {
      setStyle(HEADER_ROW_1, c, { font: { bold: true, sz: 9 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } });
      setStyle(HEADER_ROW_2, c, { font: { bold: true, sz: 8 }, alignment: { horizontal: 'center', vertical: 'center' } });
    }

    items.forEach((_, i) => {
      const r = ITEMS_START + i;
      setStyle(r, 0, { alignment: { horizontal: 'center' } });
      for (let c = 5; c <= 8; c++) setStyle(r, c, { alignment: { horizontal: 'right' } });
    });

    setStyle(totalRowIndex, 5, { font: { bold: true }, alignment: { horizontal: 'center' } });
    setStyle(totalRowIndex, 7, { font: { bold: true }, alignment: { horizontal: 'right' } });
    setStyle(totalRowIndex, 8, { font: { bold: true }, alignment: { horizontal: 'right' } });
    setStyle(signRow1, 1, { font: { bold: true, sz: 9 } });
    setStyle(signRow2, 1, { font: { bold: true, sz: 10 } });
    setStyle(signRow2, 8, { font: { bold: true, sz: 10 } });
    setStyle(noteRow, 1, { font: { italic: true, sz: 9 } });

    XLSX.utils.book_append_sheet(wb, ws, 'Comandă');
    const safeDate = new Date().toLocaleDateString('ro-RO').replace(/\//g, '-');
    XLSX.writeFile(wb, `Comanda_${orderNumber || 'Transport'}_${safeDate}.xlsx`);
  };

  return (
    <Box bg={bgColor} w="full" maxW="100%" overflow="hidden">
      <VStack spacing={3} align="stretch">
        {userRoles.some(role => ['INSPECTOR', 'ADMIN', 'SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'WAREHOUSE_KEEPER'].includes(role)) && (
          <HStack justify="flex-end" spacing={3} className="no-print">
            <Button leftIcon={<Icon as={FiDownload} />} colorScheme="green" size="md" onClick={handleExportToExcel} shadow="md">
              Export Excel
            </Button>
            <Button leftIcon={<Icon as={FiPrinter} />} colorScheme="blue" size="md" onClick={() => window.print()} shadow="md">
              Printează
            </Button>
          </HStack>
        )}

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
                borderColor: 'transparent',
                padding: '4px 6px',
                fontSize: '11px',
                color: useColorModeValue('gray.900', 'gray.100'),
                lineHeight: '1.3',
                verticalAlign: 'middle',
              },
              'table': { tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }
            }}
          >
            <Tbody>
              <Tr><Td colSpan={12} fontWeight="bold" fontSize="14px">MINISTERUL SANATATII</Td></Tr>
              <Tr>
                <Td colSpan={10} fontWeight="bold" fontSize="13px">DIRECTIA DE SANATATE PUBLICA DOLJ</Td>
                <Td colSpan={2} textAlign="right" fontWeight="bold">Fila</Td>
              </Tr>
              <Tr>
                <Td colSpan={7} fontWeight="bold" fontSize="10px">LOCALITATEA&nbsp;&nbsp;&nbsp;CRAIOVA&nbsp;&nbsp;&nbsp;&nbsp;COD POŞTAL</Td>
                <Td colSpan={5} textAlign="center" fontWeight="bold" fontSize="16px">COMANDĂ</Td>
              </Tr>
              <Tr><Td colSpan={12} fontWeight="bold" fontSize="10px">STRADA&nbsp;&nbsp;&nbsp;TABACI&nbsp;&nbsp;&nbsp;&nbsp;NR.&nbsp;&nbsp;&nbsp;&nbsp;1</Td></Tr>
              <Tr>
                <Td colSpan={8} fontWeight="bold" fontSize="10px">TELEFON/ FAX 0251-310067&nbsp;&nbsp;JUDEŢUL&nbsp;&nbsp;DOLJ</Td>
                <Td colSpan={4} fontWeight="bold" fontSize="10px">Către furnizor: {supplierName}</Td>
              </Tr>
              <Tr>
                <Td colSpan={8}></Td>
                <Td colSpan={4} fontSize="10px">{supplierCity ? `Localitatea: ${supplierCity}` : 'Localitatea'}</Td>
              </Tr>
              <Tr>
                <Td fontSize="10px">Cod operații</Td>
                <Td fontSize="10px">Cod fiscal</Td>
                <Td fontSize="10px">Nr. comandă</Td>
                <Td></Td>
                <Td colSpan={2} textAlign="center" fontSize="10px">Data</Td>
                <Td></Td>
                <Td></Td>
                <Td colSpan={4} fontSize="10px">Strada: {supplierAddress || '_____________'}</Td>
              </Tr>
              <Tr>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td textAlign="center" fontSize="10px">Zi</Td>
                <Td textAlign="center" fontSize="10px">Luna</Td>
                <Td textAlign="center" fontSize="10px">An</Td>
                <Td></Td>
                <Td colSpan={4} fontSize="10px">Județul/Sector: {supplierCounty || '_____________'}</Td>
              </Tr>
              <Tr>
                <Td></Td>
                <Td fontWeight="bold" fontSize="10px">11333620</Td>
                <Td fontWeight="bold" fontSize="10px">{orderNumber}</Td>
                <Td></Td>
                <Td textAlign="center" fontWeight="bold" fontSize="10px">{zi}</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="10px">{luna}</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="10px">{an}</Td>
                <Td></Td>
                <Td colSpan={4} fontSize="10px">FAX/Tel: {supplierPhone || '_____________'}</Td>
              </Tr>
              <Tr><Td colSpan={12} height="10px"></Td></Tr>
              <Tr><Td colSpan={12} fontSize="10px">Rugăm a expedia la adresa: Localitatea CRAIOVA, Strada TABACI, Nr. 1</Td></Tr>
              <Tr><Td colSpan={12} fontSize="10px">Cod poștal ______________________ Județul DOLJ</Td></Tr>
              <Tr><Td colSpan={12} fontSize="10px">Prin ______________________ la stația ______________________</Td></Tr>
              <Tr><Td colSpan={12} fontSize="10px">Plata se va face: Nr. Cont ______ Banca ______ Poz. plan ______ Capitol ______ Nr. rep. ______</Td></Tr>
              <Tr><Td colSpan={12} fontSize="10px">Conform contract/referat/adresa nr. ______________________</Td></Tr>

              <Tr bg={headerBg}>
                <Td rowSpan={2} textAlign="center" fontWeight="bold" fontSize="10px">NR.CRT</Td>
                <Td rowSpan={2} textAlign="center" fontWeight="bold" fontSize="10px">DENUMIREA PRODUSULUI SI CARACTERISTICI</Td>
                <Td rowSpan={2} textAlign="center" fontWeight="bold" fontSize="10px">U.M.</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="10px">ARTICOL BUGETAR</Td>
                <Td rowSpan={2} textAlign="center" fontWeight="bold" fontSize="10px">SURSA DE FINANȚARE</Td>
                <Td rowSpan={2} textAlign="center" fontWeight="bold" fontSize="10px">CANT.</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="10px">PREȚ UNITAR</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="10px">VALOARE</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="10px">VAL. CU TVA</Td>
                <Td colSpan={3} textAlign="center" fontWeight="bold" fontSize="10px">TERMEN DE LIVRARE</Td>
              </Tr>
              <Tr bg={headerBg}>
                <Td textAlign="center" fontSize="9px"></Td>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">-LEI-</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">-LEI-</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">-LEI-</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">ZI</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">LUNA</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">AN</Td>
              </Tr>

              {items.map((it, i) => (
                <Tr key={i}>
                  <Td textAlign="center">{i + 1}</Td>
                  <Td>{it.name}</Td>
                  <Td textAlign="center">{it.unit}</Td>
                  <Td></Td>
                  <Td></Td>
                  <Td textAlign="center">{Math.round(it.quantity)}</Td>
                  <Td textAlign="right">{it.unitPrice.toFixed(2)}</Td>
                  <Td textAlign="right">{it.totalPrice.toFixed(2)}</Td>
                  <Td textAlign="right">{it.totalWithTva.toFixed(2)}</Td>
                  <Td></Td>
                  <Td></Td>
                  <Td></Td>
                </Tr>
              ))}

              <Tr bg={totalBg}>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td textAlign="center" fontWeight="bold">TOTAL</Td>
                <Td></Td>
                <Td textAlign="right" fontWeight="bold">{subtotal.toFixed(2)}</Td>
                <Td textAlign="right" fontWeight="bold">{total.toFixed(2)}</Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
              </Tr>

              <Tr>
                <Td></Td>
                <Td colSpan={4} fontWeight="bold" fontSize="9px">DIRECTOR EXECUTIV,</Td>
                <Td colSpan={4} fontWeight="bold" fontSize="9px">DIRECTOR EXECUTIV ADJ ECONOMIC,</Td>
                <Td colSpan={3} fontWeight="bold" fontSize="9px">ȘEF SERVICIU ADMINISTRATIV MENTENANȚĂ</Td>
              </Tr>
              <Tr>
                <Td></Td>
                <Td colSpan={4} fontWeight="bold" fontSize="10px">Ec. MICU DORIN VIOREL</Td>
                <Td colSpan={4} fontWeight="bold" fontSize="10px">Ec. NICOLAE MARCU</Td>
                <Td colSpan={3} fontWeight="bold" fontSize="10px">Ing. ALINA POPA</Td>
              </Tr>
              <Tr><Td colSpan={12} height="10px"></Td></Tr>
              <Tr>
                <Td colSpan={12} fontSize="9px" fontStyle="italic">
                  Produsele sa fie insotite de aviz de insotire a marfii, certificate de calitate, declaratie de conformitate.
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </Box>

        <style>{`
          @media print {
            .no-print { display: none !important; }
            .excel-document { box-shadow: none !important; border: 1px solid black !important; }
          }
        `}</style>
      </VStack>
    </Box>
  );
}
