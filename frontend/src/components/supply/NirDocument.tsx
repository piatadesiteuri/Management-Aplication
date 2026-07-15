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

interface NirItem {
  product_id: number;
  product_name: string;
  product_unit?: string;
  ordered_quantity: number | string;
  ordered_unit_price: number | string;
  received_quantity?: number | string | null;
  received_unit_price?: number | string | null;
}

interface NirHeader {
  nir_number?: string;
  reception_date?: string;
  invoice_number?: string;
  invoice_date?: string;
  delivery_note_number?: string;
  vehicle_number?: string;
  delegate_name?: string;
  tva_rate?: number | string;
  commission_member_1?: string;
  commission_member_2?: string;
  commission_member_3?: string;
  received_by_name?: string;
}

interface NirDocumentProps {
  event: { title?: string };
  supplierName?: string;
  nir: NirHeader | null;
  items: NirItem[];
  userRoles?: string[];
}

export default function NirDocument({ event, supplierName, nir, items, userRoles = [] }: NirDocumentProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.400', 'gray.600');
  const gridColor = useColorModeValue('gray.400', 'gray.500');
  const headerBg = useColorModeValue('blue.50', 'blue.900');
  const totalBg = useColorModeValue('green.50', 'green.900');

  const tvaRate = nir?.tva_rate !== undefined && nir?.tva_rate !== null ? Number(nir.tva_rate) : 19;

  const rows = items.map((it) => {
    const orderedQuantity = Number(it.ordered_quantity || 0);
    const receivedQuantity = it.received_quantity !== undefined && it.received_quantity !== null
      ? Number(it.received_quantity)
      : orderedQuantity;
    const purchasePrice = it.received_unit_price !== undefined && it.received_unit_price !== null
      ? Number(it.received_unit_price)
      : Number(it.ordered_unit_price || 0);
    const markupUnit = 0;
    const markupPercent = 0;
    const priceWithMarkup = purchasePrice + markupUnit;
    const tvaUnit = priceWithMarkup * (tvaRate / 100);
    const tvaTotal = tvaUnit * receivedQuantity;
    const salePriceUnit = priceWithMarkup + tvaUnit;
    const salePriceTotal = salePriceUnit * receivedQuantity;
    const markupTotal = markupUnit * receivedQuantity;
    return {
      name: it.product_name,
      unit: it.product_unit || 'buc',
      orderedQuantity,
      receivedQuantity,
      purchasePrice,
      markupUnit,
      markupTotal,
      markupPercent,
      priceWithMarkup,
      tvaUnit,
      tvaTotal,
      salePriceUnit,
      salePriceTotal,
      hasDifference: receivedQuantity !== orderedQuantity || purchasePrice !== Number(it.ordered_unit_price || 0),
    };
  });

  const totalMarkup = rows.reduce((s, r) => s + r.markupTotal, 0);
  const totalTva = rows.reduce((s, r) => s + r.tvaTotal, 0);
  const totalSaleValue = rows.reduce((s, r) => s + r.salePriceTotal, 0);

  const receptionDate = nir?.reception_date ? new Date(nir.reception_date) : new Date();
  const zi = String(receptionDate.getDate()).padStart(2, '0');
  const luna = String(receptionDate.getMonth() + 1).padStart(2, '0');
  const an = String(receptionDate.getFullYear());

  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const data: any[][] = [];
    const merges: any[] = [];
    // Contor sigur de rânduri: fiecare rând știe exact indexul lui în momentul creării,
    // astfel încât merge-urile să rămână corecte indiferent de numărul de produse.
    let r = 0;
    const pushRow = (row: any[]) => { data.push(row); return r++; };
    const merge = (row: number, c1: number, c2: number) => merges.push({ s: { r: row, c: c1 }, e: { r: row, c: c2 } });

    const rowTitle = pushRow(['UNITATEA', null, null, null, null, null, null, 'NOTA DE RECEPTIE SI CONSTATARE DIFERENTE']);
    merge(rowTitle, 0, 2);
    merge(rowTitle, 3, 13);

    // Caseta cu Nr. document / Data (Zi-Luna-An) / Factura + Aviz — replică exact
    // structura din macheta NIR.xls (etichetă pe un rând, valoare pe rândul următor).
    const rowDocLabel = pushRow(['Numar document', null, null, 'Data', null, null, 'Factura / Aviz de însoțire a mărfii']);
    merge(rowDocLabel, 0, 2);
    merge(rowDocLabel, 3, 5);
    merge(rowDocLabel, 6, 13);

    const rowDocSub = pushRow([null, null, null, 'Zi', 'Luna', 'An']);
    merge(rowDocSub, 0, 2);
    merge(rowDocSub, 6, 13);

    const rowDocValue = pushRow([
      nir?.nir_number || '', null, null,
      zi, luna, an,
      `Factura: ${nir?.invoice_number || '-'}${nir?.invoice_date ? ' din ' + new Date(nir.invoice_date).toLocaleDateString('ro-RO') : ''}    |    Aviz: ${nir?.delivery_note_number || '-'}`
    ]);
    merge(rowDocValue, 0, 2);
    merge(rowDocValue, 6, 13);

    pushRow([null]);

    const rowStatement = pushRow([
      `Subsemnații, membrii comisiei de recepție am procedat la recepționarea valorilor materiale furnizate de ${supplierName || '____________'}, cu auto/vagonul nr. ${nir?.vehicle_number || '____________'}, documente însoțitoare ${nir?.delivery_note_number || '____________'}, delegat ${nir?.delegate_name || '____________'}, constatându-se următoarele:`
    ]);
    merge(rowStatement, 0, 13);

    pushRow([null]);
    const rowTva = pushRow([`Cota TVA: ${tvaRate}%`]);
    pushRow([null]);

    const headerRow = pushRow([
      'Nr.\ncrt.', 'Denumirea bunurilor recepționate', 'U/M',
      'Cant.\nconform\ndocumente', 'Cant.\nrecepționată',
      'Preț de\nachiziție\nunitar',
      'Adaos\nunitar', 'Adaos\ntotal', 'Adaos\n%',
      'Preț achiziție\n+ adaos unitar',
      'TVA\nunitară', 'TVA\ntotală',
      'Valoare vânzare\nunitară cu TVA', 'Valoare vânzare\ntotală cu TVA'
    ]);

    const itemsStart = r;
    rows.forEach((row, i) => {
      pushRow([
        i + 1,
        row.name,
        row.unit,
        Number(row.orderedQuantity.toFixed(3)),
        Number(row.receivedQuantity.toFixed(3)),
        Number(row.purchasePrice.toFixed(2)),
        Number(row.markupUnit.toFixed(2)),
        Number(row.markupTotal.toFixed(2)),
        row.markupPercent,
        Number(row.priceWithMarkup.toFixed(2)),
        Number(row.tvaUnit.toFixed(2)),
        Number(row.tvaTotal.toFixed(2)),
        Number(row.salePriceUnit.toFixed(2)),
        Number(row.salePriceTotal.toFixed(2)),
      ]);
    });
    const itemsEnd = r - 1;

    const totalRowIndex = pushRow(['', 'TOTAL', 'X', 'X', 'X', 'X', 'X', Number(totalMarkup.toFixed(2)), 'X', 'X', 'X', Number(totalTva.toFixed(2)), 'X', Number(totalSaleValue.toFixed(2))]);

    pushRow([null]);

    // Grupare echilibrată pe 2 blocuri egale (7 coloane fiecare), ca în machetă:
    // COMISIA DE RECEPTIE (Nume + Semnătură) | PRIMIT ÎN GESTIUNE (Data + Semnătură).
    const rowCommissionTitle = pushRow(['COMISIA DE RECEPTIE', null, null, null, null, null, null, 'PRIMIT ÎN GESTIUNE']);
    merge(rowCommissionTitle, 0, 6);
    merge(rowCommissionTitle, 7, 13);

    const rowCommissionSub = pushRow(['Numele și prenumele', null, null, null, 'Semnătura', null, null, 'Data', null, null, 'Semnătura']);
    merge(rowCommissionSub, 0, 3);
    merge(rowCommissionSub, 4, 6);
    merge(rowCommissionSub, 7, 9);
    merge(rowCommissionSub, 10, 13);

    // 5 rânduri complet libere pentru semnăturile comisiei, exact ca în machetă
    // (spațiu gol de completat olograf — Nume, Semnătură, Data, Semnătură pe ambele
    // coloane). Nu precompletăm nimic aici, inclusiv dacă avem date din formularul NIR,
    // ca să lăsăm efectiv spațiul liber pentru scris/semnat, la fel ca în original.
    let lastCommissionRow = rowCommissionSub;
    const commissionNames = [nir?.commission_member_1 || '', nir?.commission_member_2 || '', nir?.commission_member_3 || '', '', ''];
    commissionNames.forEach((name) => {
      const rowIdx = pushRow([name, null, null, null, '', null, null, '', null, null, '']);
      merge(rowIdx, 0, 3);
      merge(rowIdx, 4, 6);
      merge(rowIdx, 7, 9);
      merge(rowIdx, 10, 13);
      lastCommissionRow = rowIdx;
    });

    // Notă informativă (nu face parte din machetă) — apare doar dacă avem efectiv
    // numele persoanei care a primit marfa în gestiune, ca să nu arate a câmp gol/rupt.
    let rowPrimit: number | null = null;
    if (nir?.received_by_name) {
      pushRow([null]);
      rowPrimit = pushRow([`Primit în gestiune de: ${nir.received_by_name}`]);
      merge(rowPrimit, 0, 13);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!merges'] = merges;

    ws['!cols'] = [
      { wch: 6 }, { wch: 32 }, { wch: 6 }, { wch: 9 }, { wch: 9 },
      { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 6 }, { wch: 11 },
      { wch: 8 }, { wch: 9 }, { wch: 11 }, { wch: 11 },
    ];

    const thin = { style: 'thin', color: { rgb: '000000' } };
    const fullBorder = { top: thin, bottom: thin, left: thin, right: thin };

    const setStyle = (r: number, c: number, style: any) => {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      ws[addr].s = { ...(ws[addr].s || {}), ...style };
    };

    const applyGridBorder = (rowStart: number, rowEnd: number, colStart: number, colEnd: number) => {
      for (let R = rowStart; R <= rowEnd; R++) {
        for (let C = colStart; C <= colEnd; C++) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[addr]) ws[addr] = { t: 's', v: '' };
          if (!ws[addr].s) ws[addr].s = {};
          ws[addr].s.alignment = { vertical: 'center', horizontal: 'left', wrapText: true };
          ws[addr].s.border = fullBorder;
        }
      }
    };
    applyGridBorder(rowTitle, rowTitle, 0, 13);
    applyGridBorder(rowDocLabel, rowDocValue, 0, 13);
    applyGridBorder(headerRow, totalRowIndex, 0, 13);
    applyGridBorder(rowCommissionTitle, lastCommissionRow, 0, 13);

    setStyle(rowTitle, 0, { font: { bold: true, sz: 12 }, alignment: { horizontal: 'left', vertical: 'center' } });
    setStyle(rowTitle, 3, { font: { bold: true, sz: 13 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } });
    for (let c = 0; c <= 13; c++) {
      setStyle(rowDocLabel, c, { font: { bold: true, sz: 9 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } });
      setStyle(rowDocSub, c, { font: { bold: true, sz: 8 }, alignment: { horizontal: 'center', vertical: 'center' } });
      setStyle(rowDocValue, c, { font: { bold: true, sz: 10 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } });
    }
    setStyle(rowDocValue, 6, { font: { sz: 9 }, alignment: { horizontal: 'left', vertical: 'center', wrapText: true } });
    setStyle(rowTva, 0, { font: { bold: true, sz: 10 } });
    for (let c = 0; c <= 13; c++) {
      setStyle(headerRow, c, { font: { bold: true, sz: 8 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } });
    }
    rows.forEach((item, i) => {
      const R = itemsStart + i;
      setStyle(R, 0, { alignment: { horizontal: 'center' } });
      for (let c = 3; c <= 13; c++) setStyle(R, c, { alignment: { horizontal: 'right' } });
      if (item.hasDifference) {
        setStyle(R, 4, { font: { bold: true, color: { rgb: 'C0392B' } }, alignment: { horizontal: 'right' } });
        setStyle(R, 5, { font: { bold: true, color: { rgb: 'C0392B' } }, alignment: { horizontal: 'right' } });
      }
    });
    void itemsEnd;
    setStyle(totalRowIndex, 1, { font: { bold: true }, alignment: { horizontal: 'center' } });
    for (let c = 2; c <= 13; c++) setStyle(totalRowIndex, c, { font: { bold: true }, alignment: { horizontal: 'right' } });
    setStyle(rowCommissionTitle, 0, { font: { bold: true, sz: 10 } });
    setStyle(rowCommissionTitle, 9, { font: { bold: true, sz: 10 } });
    if (rowPrimit !== null) {
      setStyle(rowPrimit, 0, { font: { italic: true, sz: 9 } });
    }

    XLSX.utils.book_append_sheet(wb, ws, 'NIR');
    const safeDate = new Date().toLocaleDateString('ro-RO').replace(/\//g, '-');
    XLSX.writeFile(wb, `NIR_${nir?.nir_number?.replace(/\//g, '-') || 'document'}_${safeDate}.xlsx`);
  };

  return (
    <Box bg={bgColor} w="full" maxW="100%" overflow="hidden">
      <VStack spacing={3} align="stretch">
        {userRoles.some(role => ['INSPECTOR', 'ADMIN', 'SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'WAREHOUSE_KEEPER'].includes(role)) && (
          <HStack justify="flex-end" spacing={3} className="no-print">
            <Button leftIcon={<Icon as={FiDownload} />} colorScheme="green" size="md" onClick={handleExportToExcel} shadow="md">
              Export NIR (Excel)
            </Button>
            <Button leftIcon={<Icon as={FiPrinter} />} colorScheme="blue" size="md" onClick={() => window.print()} shadow="md">
              Printează
            </Button>
          </HStack>
        )}

        <Box border="2px solid" borderColor={borderColor} bg={bgColor} className="excel-document" w="100%" maxW="100%" overflow="auto" shadow="lg" borderRadius="md">
          <Table variant="simple" size="sm" w="100%" sx={{
            'td': { border: '1px solid', borderColor: 'transparent', padding: '4px 6px', fontSize: '11px', color: useColorModeValue('gray.900', 'gray.100'), lineHeight: '1.3', verticalAlign: 'middle' },
            'table': { tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' },
            '.nir-grid td': { borderColor: `${gridColor} !important` }
          }}>
            <Tbody>
              <Tr className="nir-grid">
                <Td colSpan={3} fontWeight="bold" fontSize="12px">UNITATEA</Td>
                <Td colSpan={11} textAlign="center" fontWeight="bold" fontSize="14px">NOTA DE RECEPTIE SI CONSTATARE DIFERENTE</Td>
              </Tr>
              <Tr><Td colSpan={14} height="8px"></Td></Tr>

              {/* Caseta Nr. document / Data (Zi-Luna-An) / Factura+Aviz, cu chenar, ca în machetă */}
              <Tr className="nir-grid" bg={headerBg}>
                <Td colSpan={3} textAlign="center" fontWeight="bold" fontSize="9px">Numar document</Td>
                <Td colSpan={3} textAlign="center" fontWeight="bold" fontSize="9px">Data</Td>
                <Td colSpan={8} textAlign="center" fontWeight="bold" fontSize="9px">Factura / Aviz de însoțire a mărfii</Td>
              </Tr>
              <Tr className="nir-grid" bg={headerBg}>
                <Td colSpan={3}></Td>
                <Td textAlign="center" fontWeight="bold" fontSize="8px">Zi</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="8px">Luna</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="8px">An</Td>
                <Td colSpan={8}></Td>
              </Tr>
              <Tr className="nir-grid">
                <Td colSpan={3} textAlign="center" fontWeight="bold" fontSize="10px">{nir?.nir_number || '-'}</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="10px">{zi}</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="10px">{luna}</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="10px">{an}</Td>
                <Td colSpan={8} fontSize="9px">
                  Factura: <b>{nir?.invoice_number || '-'}</b>{nir?.invoice_date && ` din ${new Date(nir.invoice_date).toLocaleDateString('ro-RO')}`}
                  {'    |    '}Aviz: <b>{nir?.delivery_note_number || '-'}</b>
                </Td>
              </Tr>
              <Tr><Td colSpan={14} height="8px"></Td></Tr>
              <Tr>
                <Td colSpan={14} fontSize="10px">
                  Subsemnații, membrii comisiei de recepție am procedat la recepționarea valorilor materiale furnizate de <b>{supplierName || '____________'}</b>, cu auto/vagonul nr. <b>{nir?.vehicle_number || '____________'}</b>, documente însoțitoare <b>{nir?.delivery_note_number || '____________'}</b>, delegat <b>{nir?.delegate_name || '____________'}</b>, constatându-se următoarele:
                </Td>
              </Tr>
              <Tr><Td colSpan={14} height="8px"></Td></Tr>
              <Tr><Td colSpan={14} fontWeight="bold" fontSize="10px">Cota TVA: {tvaRate}%</Td></Tr>
              <Tr><Td colSpan={14} height="6px"></Td></Tr>

              <Tr className="nir-grid" bg={headerBg}>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">Nr. crt.</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">Denumirea bunurilor recepționate</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">U/M</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">Cant. conform documente</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">Cant. recepționată</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">Preț achiziție unitar</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">Adaos unitar</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">Adaos total</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">Adaos %</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">Preț achiziție+adaos unitar</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">TVA unitară</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">TVA totală</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">Val. vânzare unitară cu TVA</Td>
                <Td textAlign="center" fontWeight="bold" fontSize="9px">Val. vânzare totală cu TVA</Td>
              </Tr>

              {rows.map((r, i) => (
                <Tr key={i} className="nir-grid">
                  <Td textAlign="center">{i + 1}</Td>
                  <Td>{r.name}</Td>
                  <Td textAlign="center">{r.unit}</Td>
                  <Td textAlign="right">{r.orderedQuantity}</Td>
                  <Td textAlign="right" fontWeight={r.hasDifference ? 'bold' : 'normal'} color={r.hasDifference ? 'red.500' : undefined}>{r.receivedQuantity}</Td>
                  <Td textAlign="right" fontWeight={r.hasDifference ? 'bold' : 'normal'} color={r.hasDifference ? 'red.500' : undefined}>{r.purchasePrice.toFixed(2)}</Td>
                  <Td textAlign="right">{r.markupUnit.toFixed(2)}</Td>
                  <Td textAlign="right">{r.markupTotal.toFixed(2)}</Td>
                  <Td textAlign="right">{r.markupPercent}</Td>
                  <Td textAlign="right">{r.priceWithMarkup.toFixed(2)}</Td>
                  <Td textAlign="right">{r.tvaUnit.toFixed(2)}</Td>
                  <Td textAlign="right">{r.tvaTotal.toFixed(2)}</Td>
                  <Td textAlign="right">{r.salePriceUnit.toFixed(2)}</Td>
                  <Td textAlign="right">{r.salePriceTotal.toFixed(2)}</Td>
                </Tr>
              ))}

              <Tr className="nir-grid" bg={totalBg}>
                <Td></Td>
                <Td textAlign="center" fontWeight="bold">TOTAL</Td>
                <Td textAlign="center">X</Td>
                <Td textAlign="center">X</Td>
                <Td textAlign="center">X</Td>
                <Td textAlign="center">X</Td>
                <Td textAlign="center">X</Td>
                <Td textAlign="right" fontWeight="bold">{totalMarkup.toFixed(2)}</Td>
                <Td textAlign="center">X</Td>
                <Td textAlign="center">X</Td>
                <Td textAlign="center">X</Td>
                <Td textAlign="right" fontWeight="bold">{totalTva.toFixed(2)}</Td>
                <Td textAlign="center">X</Td>
                <Td textAlign="right" fontWeight="bold">{totalSaleValue.toFixed(2)}</Td>
              </Tr>

              <Tr><Td colSpan={14} height="12px"></Td></Tr>
              <Tr className="nir-grid" bg={headerBg}>
                <Td colSpan={7} fontWeight="bold" fontSize="10px">COMISIA DE RECEPTIE</Td>
                <Td colSpan={7} fontWeight="bold" fontSize="10px">PRIMIT ÎN GESTIUNE</Td>
              </Tr>
              <Tr className="nir-grid" bg={headerBg}>
                <Td colSpan={4} textAlign="center" fontSize="9px">Numele și prenumele</Td>
                <Td colSpan={3} textAlign="center" fontSize="9px">Semnătura</Td>
                <Td colSpan={3} textAlign="center" fontSize="9px">Data</Td>
                <Td colSpan={4} textAlign="center" fontSize="9px">Semnătura</Td>
              </Tr>
              {/* Spațiu complet liber pentru completare olografă, exact ca în machetă
                  (nu precompletăm data/semnătura, doar numele membrilor dacă au fost introduși) */}
              <Tr className="nir-grid">
                <Td colSpan={4} fontSize="10px">{nir?.commission_member_1 || ''}</Td>
                <Td colSpan={3}></Td>
                <Td colSpan={3}></Td>
                <Td colSpan={4}></Td>
              </Tr>
              <Tr className="nir-grid">
                <Td colSpan={4} fontSize="10px">{nir?.commission_member_2 || ''}</Td>
                <Td colSpan={3}></Td>
                <Td colSpan={3}></Td>
                <Td colSpan={4}></Td>
              </Tr>
              <Tr className="nir-grid">
                <Td colSpan={4} fontSize="10px">{nir?.commission_member_3 || ''}</Td>
                <Td colSpan={3}></Td>
                <Td colSpan={3}></Td>
                <Td colSpan={4}></Td>
              </Tr>
              <Tr className="nir-grid">
                <Td colSpan={4}></Td>
                <Td colSpan={3}></Td>
                <Td colSpan={3}></Td>
                <Td colSpan={4}></Td>
              </Tr>
              <Tr className="nir-grid">
                <Td colSpan={4}></Td>
                <Td colSpan={3}></Td>
                <Td colSpan={3}></Td>
                <Td colSpan={4}></Td>
              </Tr>
              {nir?.received_by_name && (
                <>
                  <Tr><Td colSpan={14} height="10px"></Td></Tr>
                  <Tr><Td colSpan={14} fontSize="9px" fontStyle="italic">Primit în gestiune de: {nir.received_by_name}</Td></Tr>
                </>
              )}
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
