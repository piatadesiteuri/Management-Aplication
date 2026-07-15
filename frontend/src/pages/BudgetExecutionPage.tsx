import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  VStack,
  Flex,
  HStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Textarea,
  useColorModeValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FiDownload, FiPlus, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { useDropzone } from 'react-dropzone';
import { pdfjs } from 'react-pdf';
import * as XLSX from 'xlsx-js-style';
import { BudgetService, type AnnualBudgetRow, type BudgetFundingSource, type BudgetIndicatorType, type BudgetRowKind, type ExecutionRow } from '../services/BudgetService';

const FUNDING_SOURCE_LABEL: Record<BudgetFundingSource, string> = {
  OWN_REVENUE: 'Venituri proprii',
  STATE_BUDGET: 'Buget de stat',
};

// react-pdf / pdf.js worker (Vite)
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfjs as any).GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
} catch {
  // ignore; pdf import will fall back to "copy/paste" guidance
}

function toMoney(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return n;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function parseExcelPaste(text: string) {
  // Accept TSV from Excel (tab separated), fallback to CSV commas
  const lines = text.split(/\r?\n/).map(l => l.trimEnd()).filter(Boolean);
  const rows = lines.map(l => (l.includes('\t') ? l.split('\t') : l.split(',')).map(c => c.trim()));
  return rows;
}

async function fileToText(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function uniqBy<T>(items: T[], getKey: (x: T) => string) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const k = getKey(it);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

async function parsePdfToIndicatorTsv(pdfData: ArrayBuffer): Promise<string> {
  // Best-effort extraction: grab text lines and try to detect "code + name"
  // Works reasonably well for "cont de execuție" PDFs where codes are like 10.01.01 etc.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadingTask = (pdfjs as any).getDocument({ data: pdfData });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = (await loadingTask.promise) as any;

  const lines: string[] = [];
  const maxPages = Math.min(10, Number(doc.numPages || 1));
  for (let p = 1; p <= maxPages; p++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = (await doc.getPage(p)) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content = (await page.getTextContent()) as any;

    // group by Y (line), sort by X
    const byY = new Map<number, Array<{ x: number; s: string }>>();
    for (const it of content.items || []) {
      const s = String(it.str || '').trim();
      if (!s) continue;
      const x = Number(it.transform?.[4] ?? 0);
      const y = Number(it.transform?.[5] ?? 0);
      const yKey = Math.round(y * 2) / 2; // 0.5 precision
      const arr = byY.get(yKey) ?? [];
      arr.push({ x, s });
      byY.set(yKey, arr);
    }

    const yKeys = Array.from(byY.keys()).sort((a, b) => b - a);
    for (const y of yKeys) {
      const arr = (byY.get(y) ?? []).sort((a, b) => a.x - b.x);
      const line = arr.map(i => i.s).join(' ').replace(/\s{2,}/g, ' ').trim();
      if (line) lines.push(line);
    }
  }

  const rows = uniqBy(
    lines
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => line.length >= 6)
      .map((line) => {
        // match execution-like codes: 10.01.01, 20.30.30.01 etc
        const m = line.match(/^(\d{1,3}(?:\.\d{1,3}){1,6})\s+(.+)$/);
        if (m) return { code: m[1], name: m[2] };
        // match short numeric codes: 0001, 1001 etc (annual tables sometimes)
        const m2 = line.match(/^(\d{3,4})\s+(.+)$/);
        if (m2) return { code: m2[1], name: m2[2] };
        return null;
      })
      .filter(Boolean) as Array<{ code: string; name: string }>,
    (r) => r.code
  ).filter(r => r.name && /[A-Za-zĂÂÎȘȚăâîșț]/.test(r.name));

  // TSV for our importer: Capitol, Subcapitol, Paragraf, Cod, Denumire, CA/CB
  const tsv = rows
    .map((r) => ['', '', '', r.code, r.name, ''].join('\t'))
    .join('\n');
  return tsv;
}

function normalizeRowKind(v: any): BudgetRowKind {
  const s = String(v || '').toUpperCase();
  if (s === 'GROUP' || s === 'TITLE') return s as BudgetRowKind;
  return 'LEAF';
}

function computeIndent(code: string) {
  const parts = String(code || '').split('.').filter(Boolean);
  // 0: title/group root (10, 20, 01), 1+: deeper
  return Math.max(0, parts.length - 1);
}

function computeAnnualIndent(code: string, capitol?: string, subcapitol?: string, paragraf?: string) {
  // For annual budget: indent based on which fields are filled
  // Level 0: only capitol (e.g., 0001)
  // Level 1: capitol + subcapitol (e.g., 0001 + 10)
  // Level 2: capitol + subcapitol + paragraf (e.g., 0001 + 10 + 01)
  // Level 3+: deeper nesting based on code structure
  
  if (paragraf) return 3;
  if (subcapitol) return 2;
  if (capitol) return 1;
  
  // Fallback: use code structure
  const parts = String(code || '').split('.').filter(Boolean);
  if (parts.length > 0) {
    // 4-digit codes (0001, 0002) = level 0
    if (/^\d{4}$/.test(code)) return 0;
    // Codes with dots = deeper levels
    return Math.max(0, parts.length - 1);
  }
  return 0;
}

type ExecRowWithMeta = ExecutionRow & {
  row_kind?: BudgetRowKind;
  calc_expression?: string | null;
  indent_level?: number;
  display_order?: number;
};

function computeExecutionDisplay(rows: ExecRowWithMeta[]) {
  const moneyKeys: Array<keyof ExecutionRow> = [
    'credits_initial',
    'credits_definitive',
    'commitments_budgetary',
    'commitments_legal',
    'payments_made',
    'commitments_legal_to_pay',
    'expenses_effective',
  ];

  const byCode = new Map<string, ExecRowWithMeta>();
  const norm = rows.map((r) => {
    const row_kind = normalizeRowKind((r as any).row_kind);
    const indent_level = Number.isFinite(Number((r as any).indent_level)) ? Number((r as any).indent_level) : computeIndent(r.indicator_code);
    const display_order = Number.isFinite(Number((r as any).display_order)) ? Number((r as any).display_order) : 0;
    const commitments_legal = toMoney((r as any).commitments_legal);
    const payments_made = toMoney((r as any).payments_made);
    const computed6 = commitments_legal - payments_made;
    const next: ExecRowWithMeta = {
      ...r,
      row_kind,
      indent_level,
      display_order,
      credits_initial: toMoney((r as any).credits_initial),
      credits_definitive: toMoney((r as any).credits_definitive),
      commitments_budgetary: toMoney((r as any).commitments_budgetary),
      commitments_legal,
      payments_made,
      commitments_legal_to_pay: computed6,
      expenses_effective: toMoney((r as any).expenses_effective),
    };
    byCode.set(String(r.indicator_code).trim(), next);
    return next;
  });

  const getSumForCodeOrPrefix = (token: string) => {
    const t = token.trim();
    if (!t) return null;
    const exact = byCode.get(t);
    if (exact) return exact;
    // fallback: sum all descendants by prefix
    const prefix = t.endsWith('.') ? t : t + '.';
    const candidates = norm.filter(r => String(r.indicator_code).startsWith(prefix) && normalizeRowKind(r.row_kind) !== 'TITLE');
    if (candidates.length === 0) return null;
    const agg: any = { indicator_code: t };
    for (const k of moneyKeys) agg[k] = 0;
    for (const c of candidates) {
      for (const k of moneyKeys) agg[k] += toMoney((c as any)[k]);
    }
    return agg as ExecRowWithMeta;
  };

  const evaluateExpression = (expr: string | null | undefined) => {
    const parts = String(expr || '')
      .split('+')
      .map(s => s.trim())
      .filter(Boolean);
    const agg: any = {};
    for (const k of moneyKeys) agg[k] = 0;
    for (const p of parts) {
      const r = getSumForCodeOrPrefix(p);
      if (!r) continue;
      for (const k of moneyKeys) agg[k] += toMoney((r as any)[k]);
    }
    return agg as ExecRowWithMeta;
  };

  // multi-pass calc (bottom-up)
  const ordered = [...norm].sort((a, b) => (b.display_order ?? 0) - (a.display_order ?? 0));
  for (let pass = 0; pass < 8; pass++) {
    for (const r of ordered) {
      const kind = normalizeRowKind(r.row_kind);
      if (kind === 'LEAF') continue;

      const code = String(r.indicator_code).trim();
      const expr = r.calc_expression ? String(r.calc_expression) : null;

      let computed: ExecRowWithMeta | null = null;
      if (expr) {
        computed = evaluateExpression(expr);
      } else if (code && code !== 'TOTAL') {
        // default grouping: prefix sum
        computed = getSumForCodeOrPrefix(code);
      }
      if (!computed) continue;

      for (const k of moneyKeys) {
        if (k === 'commitments_legal_to_pay') continue; // recalculated below
        (r as any)[k] = toMoney((computed as any)[k]);
      }
      (r as any).commitments_legal_to_pay = toMoney((r as any).commitments_legal) - toMoney((r as any).payments_made);
      byCode.set(code, r);
    }
  }

  return norm.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
}

export default function BudgetExecutionPage() {
  const toast = useToast();
  const muted = useColorModeValue('gray.600', 'gray.300');
  const panelBg = useColorModeValue('white', 'gray.800');
  const panelBorder = useColorModeValue('gray.200', 'gray.700');
  const tableHeadBg = useColorModeValue('gray.50', 'gray.900');
  const softBg = useColorModeValue('gray.50', 'whiteAlpha.100');

  const [loading, setLoading] = useState(true);
  const [annualType, setAnnualType] = useState<BudgetIndicatorType>('REVENUE');
  const [fundingSource, setFundingSource] = useState<BudgetFundingSource>('OWN_REVENUE');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [annualRows, setAnnualRows] = useState<AnnualBudgetRow[]>([]);
  const [annualDirty, setAnnualDirty] = useState(false);

  const [execDate, setExecDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [execCapitol, setExecCapitol] = useState('6610');
  const [execSubcapitol, setExecSubcapitol] = useState('');
  const [execRows, setExecRows] = useState<ExecutionRow[]>([]);
  const [execDirty, setExecDirty] = useState(false);
  const [query, setQuery] = useState('');

  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();
  const [importText, setImportText] = useState('');
  const [importType, setImportType] = useState<BudgetIndicatorType>('REVENUE');
  const [importing, setImporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement | null>(null);

  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const [addType, setAddType] = useState<BudgetIndicatorType>('REVENUE');
  const [addCap, setAddCap] = useState('');
  const [addSubcap, setAddSubcap] = useState('');
  const [addPar, setAddPar] = useState('');
  const [addCode, setAddCode] = useState('');
  const [addName, setAddName] = useState('');
  const [addCaCb, setAddCaCb] = useState('');
  const [adding, setAdding] = useState(false);

  const { isOpen: isCloneConfirmOpen, onOpen: onCloneConfirmOpen, onClose: onCloneConfirmClose } = useDisclosure();
  const [cloning, setCloning] = useState(false);

  // Inline "rând nou" (în tabel) - ca să poți scrie direct ce ai în anexă
  const [annualInlineOpen, setAnnualInlineOpen] = useState(false);
  const [annualInline, setAnnualInline] = useState({
    capitol: '',
    subcapitol: '',
    paragraf: '',
    indicator_code: '',
    name: '',
    ca_cb: '',
    amount: 0,
  });
  const [annualInlineSaving, setAnnualInlineSaving] = useState(false);

  // Execuția are rânduri predefinite; nu afișăm "Adaugă rând" aici.

  const filteredAnnual = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = annualRows;
    if (q) {
      rows = annualRows.filter(r => `${r.indicator_code} ${r.name} ${r.capitol ?? ''} ${r.subcapitol ?? ''} ${r.paragraf ?? ''}`.toLowerCase().includes(q));
    }
    // Sort: by capitol, subcapitol, paragraf, then by indicator_code
    return [...rows].sort((a, b) => {
      const capA = String(a.capitol ?? '').padStart(4, '0');
      const capB = String(b.capitol ?? '').padStart(4, '0');
      if (capA !== capB) return capA.localeCompare(capB);
      
      const subA = String(a.subcapitol ?? '').padStart(2, '0');
      const subB = String(b.subcapitol ?? '').padStart(2, '0');
      if (subA !== subB) return subA.localeCompare(subB);
      
      const parA = String(a.paragraf ?? '').padStart(2, '0');
      const parB = String(b.paragraf ?? '').padStart(2, '0');
      if (parA !== parB) return parA.localeCompare(parB);
      
      return String(a.indicator_code).localeCompare(String(b.indicator_code));
    });
  }, [annualRows, query]);

  // Group annual budget rows by main sections (by capitol or main indicator code)
  const groupedAnnual = useMemo(() => {
    if (filteredAnnual.length === 0) return [];

    const groups: Array<{ title: string; code: string; rows: typeof filteredAnnual }> = [];
    let currentGroup: typeof groups[0] | null = null;
    let currentRows: typeof filteredAnnual = [];

    for (const r of filteredAnnual) {
      const capitol = String(r.capitol ?? '').trim();
      const code = String(r.indicator_code).trim();
      const rowKind = r.row_kind || 'LEAF';
      
      // Detect main section headers:
      // 1. TITLE rows (main sections like "VENITURI PROPRII", "CHELTUIELI CURENTE")
      // 2. GROUP rows with 4-digit codes (0001, 0002, etc.) or that start major sections
      // 3. GROUP rows with capitol but no subcapitol/paragraf
      const isMainSection = (
        rowKind === 'TITLE' ||
        (rowKind === 'GROUP' && (
          /^\d{4}$/.test(code) ||
          (capitol && !r.subcapitol && !r.paragraf) ||
          (r.name && /^(VENITURI|CHELTUIELI|TITLUL|TOTAL|1\.|A\.|C\.|3\.)/i.test(r.name))
        ))
      );

      if (isMainSection) {
        // Save previous group if exists
        if (currentGroup) {
          currentGroup.rows = [...currentGroup.rows, ...currentRows];
          groups.push(currentGroup);
        }
        // Start new group
        currentGroup = {
          title: r.name || `Capitol ${capitol || code}`,
          code: capitol || code || String(groups.length + 1),
          rows: [r], // Include the header row itself
        };
        currentRows = [];
      } else {
        // Add row to current group or create a default group
        if (currentGroup) {
          currentRows.push(r);
        } else {
          // Rows before first section - create a default group
          currentGroup = {
            title: 'Alte',
            code: '',
            rows: [],
          };
          currentRows = [r];
        }
      }
    }

    // Add last group
    if (currentGroup) {
      currentGroup.rows = [...currentGroup.rows, ...currentRows];
      if (currentGroup.rows.length > 0) {
        // Check if group already exists (avoid duplicates)
        const existing = groups.find(g => g.code === currentGroup!.code && g.title === currentGroup!.title);
        if (!existing) {
          groups.push(currentGroup);
        } else {
          // Merge rows into existing group
          existing.rows = [...existing.rows, ...currentGroup.rows];
        }
      }
    }

    // If no groups were created, return all rows in a single group
    if (groups.length === 0) {
      return [{ title: 'Toate datele', code: '', rows: filteredAnnual }];
    }

    // Verify all rows are included
    const totalRowsInGroups = groups.reduce((sum, g) => sum + g.rows.length, 0);
    if (totalRowsInGroups !== filteredAnnual.length) {
      console.warn(`⚠️ Grouped rows (${totalRowsInGroups}) != total rows (${filteredAnnual.length})`);
      // Add missing rows to a catch-all group
      const includedIds = new Set(groups.flatMap(g => g.rows.map(r => r.indicator_id)));
      const missingRows = filteredAnnual.filter(r => !includedIds.has(r.indicator_id));
      if (missingRows.length > 0) {
        groups.push({
          title: 'Alte (rânduri neclasificate)',
          code: 'OTHER',
          rows: missingRows,
        });
      }
    }

    return groups;
  }, [filteredAnnual]);

  const displayExec = useMemo(() => computeExecutionDisplay(execRows as any), [execRows]);

  const filteredExec = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return displayExec;
    return displayExec.filter(r => `${r.indicator_code} ${r.name} ${r.capitol ?? ''} ${r.subcapitol ?? ''} ${r.paragraf ?? ''}`.toLowerCase().includes(q));
  }, [displayExec, query]);

  // Group execution rows by main sections (cod 10, 20, 30, etc.)
  const groupedExec = useMemo(() => {
    if (filteredExec.length === 0) return [];

    const groups: Array<{ title: string; code: string; rows: typeof filteredExec }> = [];
    let currentGroup: typeof groups[0] | null = null;
    let currentRows: typeof filteredExec = [];

    for (const r of filteredExec) {
      const code = String(r.indicator_code).trim();
      const kind = normalizeRowKind((r as any).row_kind);
      const indent = Number.isFinite(Number((r as any).indent_level)) ? Number((r as any).indent_level) : 0;

      // Detect main section headers:
      // 1. TITLE/GROUP with 2-digit codes (10, 20, 30, etc.)
      // 2. TITLE/GROUP with indent_level 0-1 that are not TOTAL or 01
      // 3. Rows that start with "TITLUL" in name (Romanian section headers)
      const isMainSection = (kind === 'TITLE' || kind === 'GROUP') && (
        /^\d{2}$/.test(code) || // 2-digit code (10, 20, 30, etc.)
        (indent <= 1 && code !== 'TOTAL' && code !== '01' && !code.includes('.')) || // Top-level sections without dots
        (r.name && /^TITLUL\s+[IVX]+/i.test(r.name)) // "TITLUL I", "TITLUL II", etc.
      );

      if (isMainSection) {
        // Save previous group if exists
        if (currentGroup) {
          currentGroup.rows = currentRows;
          groups.push(currentGroup);
        }
        // Start new group
        currentGroup = {
          title: r.name,
          code: code,
          rows: [r], // Include the header row itself
        };
        currentRows = [];
      } else {
        // Add row to current group or create a default group
        if (currentGroup) {
          currentRows.push(r);
        } else {
          // Rows before first section (e.g., TOTAL CHELTUIELI)
          if (groups.length === 0) {
            groups.push({ title: 'Total', code: '', rows: [] });
            currentGroup = groups[0];
            currentRows = [];
          }
          if (currentGroup) {
            currentRows.push(r);
          }
        }
      }
    }

    // Add last group
    if (currentGroup) {
      currentGroup.rows = [...currentGroup.rows, ...currentRows];
      if (currentGroup.rows.length > 0 && !groups.find(g => g.code === currentGroup!.code && g.title === currentGroup!.title)) {
        groups.push(currentGroup);
      }
    }

    // If no groups were created, return all rows in a single group
    if (groups.length === 0) {
      return [{ title: 'Toate datele', code: '', rows: filteredExec }];
    }

    return groups;
  }, [filteredExec]);

  const annualTotal = useMemo(() => filteredAnnual.reduce((s, r) => s + toMoney(r.amount), 0), [filteredAnnual]);
  const execPaymentsTotal = useMemo(() => filteredExec.reduce((s, r) => s + toMoney(r.payments_made), 0), [filteredExec]);
  const execEffectiveTotal = useMemo(() => filteredExec.reduce((s, r) => s + toMoney(r.expenses_effective), 0), [filteredExec]);

  const loadAnnual = async () => {
    const res = await BudgetService.getAnnual(year, annualType, fundingSource);
    setAnnualRows(res.data || []);
    setAnnualDirty(false);
  };

  const loadExecution = async () => {
    const res = await BudgetService.getExecution(execDate);
    setExecRows(res.data || []);
    setExecDirty(false);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      await Promise.all([loadAnnual(), loadExecution()]);
    } catch (e) {
      console.error(e);
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca datele', status: 'error', duration: 4000, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadAnnual();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, annualType, fundingSource]);

  // Bugetul de stat nu are secțiune de venituri proprii în formularul oficial —
  // dacă utilizatorul schimbă sursa pe "Buget de stat" forțăm tipul pe Cheltuieli.
  useEffect(() => {
    if (fundingSource === 'STATE_BUDGET' && annualType === 'REVENUE') {
      setAnnualType('EXPENSE');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fundingSource]);

  useEffect(() => {
    // Reset dirty state immediately when date changes (old data is no longer relevant)
    setExecDirty(false);
    // Clear rows immediately to avoid showing stale data
    setExecRows([]);
    // Load new data for the selected date (use execDate directly to avoid closure issues)
    (async () => {
      try {
        const res = await BudgetService.getExecution(execDate);
        setExecRows(res.data || []);
        setExecDirty(false);
      } catch (e) {
        console.error(e);
        toast({ title: 'Eroare', description: 'Nu s-au putut încărca datele pentru data selectată', status: 'error', duration: 4000, isClosable: true });
      }
    })();
  }, [execDate]);

  const handleSaveAnnual = async () => {
    try {
      const items = annualRows.map(r => ({ indicator_id: r.indicator_id, amount: toMoney(r.amount) }));
      await BudgetService.saveAnnual(year, items, fundingSource);
      toast({ title: 'Salvat', description: 'Bugetul anual a fost salvat', status: 'success', duration: 2500, isClosable: true });
      setAnnualDirty(false);
    } catch (e) {
      console.error(e);
      toast({ title: 'Eroare', description: 'Nu s-a putut salva bugetul anual', status: 'error', duration: 4000, isClosable: true });
    }
  };

  const handleSaveExecution = async () => {
    try {
      const items = (execRows as any[])
        .filter(r => normalizeRowKind(r.row_kind) === 'LEAF')
        .map(r => {
          const commitments_legal = toMoney(r.commitments_legal);
          const payments_made = toMoney(r.payments_made);
          return {
            indicator_id: r.indicator_id,
            credits_initial: toMoney(r.credits_initial),
            credits_definitive: toMoney(r.credits_definitive),
            commitments_budgetary: toMoney(r.commitments_budgetary),
            commitments_legal,
            payments_made,
            commitments_legal_to_pay: commitments_legal - payments_made, // 6 = 4 - 5
            expenses_effective: toMoney(r.expenses_effective),
          };
        });
      await BudgetService.saveExecution(execDate, items);
      toast({ title: 'Salvat', description: 'Execuția a fost salvată', status: 'success', duration: 2500, isClosable: true });
      setExecDirty(false);
    } catch (e) {
      console.error(e);
      toast({ title: 'Eroare', description: 'Nu s-a putut salva execuția', status: 'error', duration: 4000, isClosable: true });
    }
  };

  const handleClonePrev = async () => {
    try {
      setCloning(true);
      const res = await BudgetService.clonePrev(execDate);
      toast({ title: 'Preluat', description: `Am preluat din ${res.prevDate}`, status: 'success', duration: 3000, isClosable: true });
      await loadExecution();
      onCloneConfirmClose();
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Nu se poate', description: e?.response?.data?.message || 'Nu există zi precedentă', status: 'warning', duration: 4000, isClosable: true });
    } finally {
      setCloning(false);
    }
  };

  // Calculate previous date for display in confirmation modal
  const prevDate = useMemo(() => {
    const date = new Date(execDate);
    date.setDate(date.getDate() - 1);
    return date.toISOString().slice(0, 10);
  }, [execDate]);

  const handleExportAnnualXlsx = () => {
    const wb = XLSX.utils.book_new();
    const data: any[][] = [];
    const merges: any[] = [];
    let r = 0;
    const pushRow = (row: any[]) => { data.push(row); return r++; };
    const merge = (row: number, c1: number, c2: number) => merges.push({ s: { r: row, c: c1 }, e: { r: row, c: c2 } });

    const COLS = 6; // Capitol | Subcap. | Paragraf | Denumirea indicatorilor | CA/CB | Buget

    const rowUnit = pushRow(['UNITATEA', null, null, null, null, null]);
    merge(rowUnit, 0, 5);

    const rowTitle = pushRow([`BUGETUL PE ANUL ${year}`, null, null, null, null, null]);
    merge(rowTitle, 0, 5);

    const rowSection = pushRow([FUNDING_SOURCE_LABEL[fundingSource].toUpperCase(), null, null, null, null, null]);
    merge(rowSection, 0, 5);

    pushRow([null]);

    const headerRow = pushRow(['Capitol', 'Subcap.', 'Paragraf', 'Denumirea indicatorilor', 'CA/CB', 'Buget']);
    const codeRow = pushRow(['B', 'C', 'D', 'E', '', annualType === 'REVENUE' ? '3' : '4']);

    const itemsStart = r;
    filteredAnnual.forEach((row) => {
      pushRow([
        row.capitol ?? '',
        row.subcapitol ?? '',
        row.paragraf ?? '',
        row.name,
        row.ca_cb ?? '',
        Number(toMoney(row.amount).toFixed(2)),
      ]);
    });
    const itemsEnd = r - 1;

    pushRow([null]);
    const totalRow = pushRow(['', '', '', 'TOTAL', '', Number(annualTotal.toFixed(2))]);

    pushRow([null]);
    pushRow([null]);

    const rowSignTitle = pushRow(['Conducătorul instituției', null, null, 'Conducătorul compartimentului financiar-contabil', null, null]);
    merge(rowSignTitle, 0, 2);
    merge(rowSignTitle, 3, 5);

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!merges'] = merges;
    ws['!cols'] = [
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 58 }, { wch: 8 }, { wch: 16 },
    ];

    const thin = { style: 'thin', color: { rgb: '000000' } };
    const fullBorder = { top: thin, bottom: thin, left: thin, right: thin };

    const setStyle = (row: number, col: number, style: any) => {
      const addr = XLSX.utils.encode_cell({ r: row, c: col });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      ws[addr].s = { ...(ws[addr].s || {}), ...style };
    };

    const applyGridBorder = (rowStart: number, rowEnd: number, colStart: number, colEnd: number) => {
      for (let R = rowStart; R <= rowEnd; R++) {
        for (let C = colStart; C <= colEnd; C++) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[addr]) ws[addr] = { t: 's', v: '' };
          if (!ws[addr].s) ws[addr].s = {};
          ws[addr].s.alignment = { vertical: 'center', horizontal: C === 3 ? 'left' : 'center', wrapText: true };
          ws[addr].s.border = fullBorder;
        }
      }
    };

    applyGridBorder(headerRow, totalRow, 0, COLS - 1);

    setStyle(rowUnit, 0, { font: { bold: true, sz: 11 } });
    setStyle(rowTitle, 0, { font: { bold: true, sz: 13 }, alignment: { horizontal: 'center' } });
    setStyle(rowSection, 0, { font: { bold: true, sz: 12 }, alignment: { horizontal: 'center' } });
    for (let c = 0; c < COLS; c++) {
      setStyle(headerRow, c, { font: { bold: true, sz: 9 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } });
      setStyle(codeRow, c, { font: { bold: true, sz: 8, italic: true }, alignment: { horizontal: 'center', vertical: 'center' } });
    }

    filteredAnnual.forEach((row, i) => {
      const R = itemsStart + i;
      const kind = normalizeRowKind((row as any).row_kind);
      setStyle(R, 5, { alignment: { horizontal: 'right' } });
      if (kind !== 'LEAF') {
        for (let c = 0; c < COLS; c++) setStyle(R, c, { font: { bold: true } });
      }
    });
    void itemsEnd;

    setStyle(totalRow, 3, { font: { bold: true }, alignment: { horizontal: 'right' } });
    setStyle(totalRow, 5, { font: { bold: true }, alignment: { horizontal: 'right' } });

    setStyle(rowSignTitle, 0, { font: { bold: true, sz: 10 }, alignment: { horizontal: 'center', wrapText: true } });
    setStyle(rowSignTitle, 3, { font: { bold: true, sz: 10 }, alignment: { horizontal: 'center', wrapText: true } });

    XLSX.utils.book_append_sheet(wb, ws, 'Buget');
    const sourceTag = fundingSource === 'OWN_REVENUE' ? 'venituri-proprii' : 'buget-stat';
    XLSX.writeFile(wb, `Buget_${sourceTag}_${annualType.toLowerCase()}_${year}.xlsx`);
  };

  const handleExportExecutionXlsx = () => {
    const rows = displayExec; // export întregul formular, nu doar filtrul curent
    const wb = XLSX.utils.book_new();
    const data: any[][] = [];
    const merges: any[] = [];
    let r = 0;
    const pushRow = (row: any[]) => { data.push(row); return r++; };
    const merge = (row: number, c1: number, c2: number) => merges.push({ s: { r: row, c: c1 }, e: { r: row, c: c2 } });

    const COLS = 9; // A | B | 1 | 2 | 3 | 4 | 5 | 6=4-5 | 7

    const rowAnexa = pushRow([null, null, null, null, null, null, null, null, 'Anexa 7']);
    merge(rowAnexa, 0, 7);

    const rowTitle = pushRow(['CONTUL DE EXECUȚIE AL INSTITUȚIILOR PUBLICE - Cheltuieli', null, null, null, null, null, null, null, null]);
    merge(rowTitle, 0, 8);

    const rowDate = pushRow([`la data de ${new Date(execDate).toLocaleDateString('ro-RO')}`, null, null, null, null, null, null, null, '-lei-']);
    merge(rowDate, 0, 7);

    const rowCod = pushRow([`Cod 21     Capitol ${execCapitol || '.'.repeat(20)}     Subcapitol ${execSubcapitol || '.'.repeat(20)}`, null, null, null, null, null, null, null, null]);
    merge(rowCod, 0, 8);

    pushRow([null]);

    const headerRow1 = pushRow(['DENUMIREA INDICATORILOR*)', 'Cod\nindicator', 'Credite bugetare', null, 'Angajamente\nbugetare', 'Angajamente\nlegale', 'Plăți\nefectuate', 'Angajamente\nlegale de platit', 'Cheltuieli\nefective']);
    merge(headerRow1, 2, 3);
    const headerRow2 = pushRow([null, null, 'inițiale', 'trimestriale/\ndefinitive', null, null, null, null, null]);
    merge(headerRow2, 0, 0);
    merge(headerRow2, 1, 1);
    merge(headerRow2, 4, 4);
    merge(headerRow2, 5, 5);
    merge(headerRow2, 6, 6);
    merge(headerRow2, 7, 7);
    merge(headerRow2, 8, 8);
    const headerRow3 = pushRow(['A', 'B', '1', '2', '3', '4', '5', '6=4-5', '7']);

    const itemsStart = r;
    rows.forEach((row: any) => {
      const kind = normalizeRowKind(row.row_kind);
      const isLeaf = kind === 'LEAF';
      const commitmentsLegal = toMoney(row.commitments_legal);
      const payments = toMoney(row.payments_made);
      const col6 = commitmentsLegal - payments;
      const val = (n: any, showZero: boolean) => (!showZero && toMoney(n) === 0 ? null : Number(toMoney(n).toFixed(2)));
      const code = kind === 'TITLE' && String(row.indicator_code).trim() === 'TOTAL' ? '' : row.indicator_code;
      pushRow([
        row.name,
        code,
        val(row.credits_initial, isLeaf),
        val(row.credits_definitive, isLeaf),
        val(row.commitments_budgetary, isLeaf),
        val(commitmentsLegal, isLeaf),
        val(payments, isLeaf),
        val(col6, false),
        val(row.expenses_effective, isLeaf),
      ]);
    });
    const itemsEnd = r - 1;

    pushRow([null]);
    pushRow([null]);

    const rowSignTitle = pushRow(['Conducătorul instituției', null, null, null, null, 'Conducătorul compartimentului financiar-contabil', null, null, null]);
    merge(rowSignTitle, 0, 3);
    merge(rowSignTitle, 5, 8);

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!merges'] = merges;
    ws['!cols'] = [
      { wch: 46 }, { wch: 10 }, { wch: 11 }, { wch: 13 }, { wch: 11 },
      { wch: 11 }, { wch: 11 }, { wch: 13 }, { wch: 11 },
    ];

    const thin = { style: 'thin', color: { rgb: '000000' } };
    const fullBorder = { top: thin, bottom: thin, left: thin, right: thin };

    const setStyle = (row: number, col: number, style: any) => {
      const addr = XLSX.utils.encode_cell({ r: row, c: col });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      ws[addr].s = { ...(ws[addr].s || {}), ...style };
    };

    const applyGridBorder = (rowStart: number, rowEnd: number, colStart: number, colEnd: number) => {
      for (let R = rowStart; R <= rowEnd; R++) {
        for (let C = colStart; C <= colEnd; C++) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[addr]) ws[addr] = { t: 's', v: '' };
          if (!ws[addr].s) ws[addr].s = {};
          ws[addr].s.alignment = { vertical: 'center', horizontal: C === 0 ? 'left' : 'center', wrapText: true };
          ws[addr].s.border = fullBorder;
        }
      }
    };

    applyGridBorder(headerRow1, itemsEnd, 0, COLS - 1);

    setStyle(rowAnexa, 8, { font: { bold: true, sz: 10 } });
    setStyle(rowTitle, 0, { font: { bold: true, sz: 12 }, alignment: { horizontal: 'center' } });
    setStyle(rowDate, 0, { font: { sz: 9 }, alignment: { horizontal: 'left' } });
    setStyle(rowDate, 8, { font: { sz: 9 }, alignment: { horizontal: 'right' } });
    setStyle(rowCod, 0, { font: { sz: 9 } });

    for (let c = 0; c < COLS; c++) {
      setStyle(headerRow1, c, { font: { bold: true, sz: 8 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } });
      setStyle(headerRow2, c, { font: { bold: true, sz: 8 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } });
      setStyle(headerRow3, c, { font: { bold: true, sz: 8 }, alignment: { horizontal: 'center', vertical: 'center' } });
    }

    rows.forEach((row: any, i: number) => {
      const R = itemsStart + i;
      const kind = normalizeRowKind(row.row_kind);
      const indent = Number.isFinite(Number(row.indent_level)) ? Number(row.indent_level) : 0;
      setStyle(R, 0, { alignment: { horizontal: 'left', indent }, font: kind !== 'LEAF' ? { bold: true } : undefined });
      for (let c = 1; c <= 8; c++) setStyle(R, c, { alignment: { horizontal: c === 1 ? 'center' : 'right' }, font: kind !== 'LEAF' ? { bold: true } : undefined });
    });

    setStyle(rowSignTitle, 0, { font: { bold: true, sz: 10 }, alignment: { horizontal: 'center', wrapText: true } });
    setStyle(rowSignTitle, 5, { font: { bold: true, sz: 10 }, alignment: { horizontal: 'center', wrapText: true } });

    XLSX.utils.book_append_sheet(wb, ws, 'Executie');
    XLSX.writeFile(wb, `Cont-executie_${execDate}.xlsx`);
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      const rows = parseExcelPaste(importText);
      // Expected columns: Capitol, Subcapitol, Paragraf, Cod, Denumire, CA/CB (optional)
      const mapped = rows.map((r) => ({
        capitol: r[0] || '',
        subcapitol: r[1] || '',
        paragraf: r[2] || '',
        indicator_code: r[3] || '',
        name: r[4] || '',
        ca_cb: r[5] || '',
      }));
      const result = await BudgetService.importIndicators(importType, mapped);
      toast({ title: 'Import ok', description: `Am importat ${result.upserted || 0} rânduri`, status: 'success', duration: 3000, isClosable: true });
      onImportClose();
      setImportText('');
      await loadAnnual();
      await loadExecution();
    } catch (e) {
      console.error(e);
      toast({ title: 'Eroare', description: 'Importul nu a reușit', status: 'error', duration: 4000, isClosable: true });
    } finally {
      setImporting(false);
    }
  };

  const handlePickFile = () => importFileRef.current?.click();

  const handleImportFile = async (file: File) => {
    try {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (!['csv', 'tsv', 'txt', 'xlsx', 'pdf'].includes(ext)) {
        toast({ title: 'Fișier neacceptat', description: 'Accept: .pdf, .xlsx, .csv, .tsv, .txt', status: 'warning', duration: 3500, isClosable: true });
        return;
      }

      if (ext === 'pdf') {
        toast({ title: 'Import PDF', description: 'Citesc PDF-ul… (best-effort)', status: 'info', duration: 2500, isClosable: true });
        const buf = await fileToArrayBuffer(file);
        const tsv = await parsePdfToIndicatorTsv(buf);
        if (!tsv.trim()) {
          toast({
            title: 'Nu am putut extrage automat din PDF',
            description: 'Te rog: deschide PDF → selectează tabelul → Copy → Paste aici (sau copiază întâi în Excel).',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          return;
        }
        setImportText(tsv);
        return;
      }

      if (ext === 'xlsx') {
        toast({ title: 'Import Excel', description: 'Citesc fișierul .xlsx…', status: 'info', duration: 2500, isClosable: true });
        const buf = await fileToArrayBuffer(file);
        // Use the lightweight browser parser from `xlsx`
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const XLSX: any = await import('xlsx');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wb = XLSX.read(buf, { type: 'array' });
        const sheetName = wb.SheetNames?.[0];
        const ws = wb.Sheets?.[sheetName];
        if (!ws) {
          toast({ title: 'Excel invalid', description: 'Nu am găsit niciun sheet', status: 'error', duration: 4000, isClosable: true });
          return;
        }
        const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
        const tsv = (aoa || [])
          .filter(r => Array.isArray(r) && r.some(c => String(c ?? '').trim() !== ''))
          .map(r => r.map(c => String(c ?? '').trim()).join('\t'))
          .join('\n');
        setImportText(tsv);
        return;
      }

      // csv/tsv/txt
      const text = await fileToText(file);
      setImportText(text);
    } catch (e) {
      console.error(e);
      toast({ title: 'Eroare', description: 'Nu am putut citi fișierul', status: 'error', duration: 4000, isClosable: true });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    accept: {
      'text/plain': ['.txt', '.tsv', '.csv'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    onDrop: async (files) => {
      const f = files?.[0];
      if (f) await handleImportFile(f);
    },
  });

  const handleAddIndicator = async () => {
    const indicator_code = addCode.trim();
    const name = addName.trim();
    if (!indicator_code || !name) {
      toast({ title: 'Lipsește cod sau denumire', description: 'Completează cel puțin Cod și Denumire', status: 'warning', duration: 3500, isClosable: true });
      return;
    }
    try {
      setAdding(true);
      await BudgetService.importIndicators(addType, [{
        capitol: addCap.trim(),
        subcapitol: addSubcap.trim(),
        paragraf: addPar.trim(),
        indicator_code,
        name,
        ca_cb: addCaCb.trim(),
      }]);
      toast({ title: 'Indicator adăugat', status: 'success', duration: 2500, isClosable: true });
      onAddClose();
      setAddCap(''); setAddSubcap(''); setAddPar(''); setAddCode(''); setAddName(''); setAddCaCb('');
      await loadAnnual();
      await loadExecution();
    } catch (e) {
      console.error(e);
      toast({ title: 'Eroare', description: 'Nu am putut adăuga indicatorul', status: 'error', duration: 4000, isClosable: true });
    } finally {
      setAdding(false);
    }
  };

  const createIndicatorIfNeeded = async (type: BudgetIndicatorType, payload: any) => {
    // Create/Upsert indicator then fetch its indicator_id via getAnnual/getExecution joins
    const code = String(payload.indicator_code || '').trim();
    const name = String(payload.name || '').trim();
    if (!code || !name) return null;
    await BudgetService.importIndicators(type, [payload]);
    return code;
  };

  const addAnnualInline = async () => {
    const code = annualInline.indicator_code.trim();
    const name = annualInline.name.trim();
    if (!code || !name) {
      toast({ title: 'Completează Cod și Denumire', status: 'warning', duration: 3500, isClosable: true });
      return;
    }
    try {
      setAnnualInlineSaving(true);
      const createdCode = await createIndicatorIfNeeded(annualType, {
        capitol: annualInline.capitol.trim(),
        subcapitol: annualInline.subcapitol.trim(),
        paragraf: annualInline.paragraf.trim(),
        indicator_code: code,
        name,
        ca_cb: annualInline.ca_cb.trim(),
      });
      const annualRes = await BudgetService.getAnnual(year, annualType, fundingSource);
      setAnnualRows(annualRes.data || []);
      const created = (annualRes.data || []).find(r => String(r.indicator_code).trim() === String(createdCode).trim());
      const amount = toMoney(annualInline.amount);
      if (created && amount !== 0) {
        await BudgetService.saveAnnual(year, [{ indicator_id: created.indicator_id, amount }], fundingSource);
        const reloaded = await BudgetService.getAnnual(year, annualType, fundingSource);
        setAnnualRows(reloaded.data || []);
      }
      toast({ title: 'Rând adăugat', description: 'Indicatorul a fost adăugat. Poți edita valorile direct în tabel.', status: 'success', duration: 3000, isClosable: true });
      setAnnualInlineOpen(false);
      setAnnualInline({ capitol: '', subcapitol: '', paragraf: '', indicator_code: '', name: '', ca_cb: '', amount: 0 });
    } catch (e) {
      console.error(e);
      toast({ title: 'Eroare', description: 'Nu am putut adăuga rândul', status: 'error', duration: 4000, isClosable: true });
    } finally {
      setAnnualInlineSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Container maxW="full" px={{ base: 4, lg: 6, xl: 10 }} py={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg">Buget & Execuție</Heading>
          <Text color={muted} mt={1}>
            Completezi bugetul anual și contul de execuție (cheltuieli). Datele pot fi preluate din ziua precedentă.
          </Text>
        </Box>

        <Card bg={panelBg} border="1px solid" borderColor={panelBorder}>
          <CardBody>
            <Flex gap={4} wrap="wrap" align="center" justify="space-between">
              <InputGroup maxW="360px">
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray" />
                </InputLeftElement>
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Caută după cod / denumire…" />
              </InputGroup>
              <HStack>
                <Button leftIcon={<FiPlus />} variant="outline" onClick={() => { setImportType(annualType); onImportOpen(); }}>
                  Import (lipire din Excel)
                </Button>
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="blue"
                  variant="ghost"
                  onClick={() => { setAddType(annualType); onAddOpen(); }}
                >
                  Adaugă indicator
                </Button>
                <Button leftIcon={<FiRefreshCw />} variant="outline" onClick={loadAll}>
                  Reîncarcă
                </Button>
              </HStack>
            </Flex>
          </CardBody>
        </Card>

        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Buget anual</Tab>
            <Tab>Cont de execuție (cheltuieli)</Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              <Card bg={panelBg} border="1px solid" borderColor={panelBorder}>
                <CardHeader>
                  <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
                    <Box>
                      <Heading size="md">Buget anual</Heading>
                      <Text fontSize="sm" color={muted}>
                        Model după “Venituri / Cheltuieli – Buget alocat” (capitol/subcap/paragraf/CA‑CB).
                      </Text>
                    </Box>
                    <HStack>
                      <Select
                        value={fundingSource}
                        onChange={(e) => setFundingSource(e.target.value as BudgetFundingSource)}
                        w="200px"
                      >
                        <option value="OWN_REVENUE">Sursă: Venituri proprii</option>
                        <option value="STATE_BUDGET">Sursă: Buget de stat</option>
                      </Select>
                      <Select value={annualType} onChange={(e) => setAnnualType(e.target.value as BudgetIndicatorType)} w="220px">
                        <option value="REVENUE" disabled={fundingSource === 'STATE_BUDGET'}>Venituri</option>
                        <option value="EXPENSE">Cheltuieli (alocat)</option>
                      </Select>
                      <Select value={String(year)} onChange={(e) => setYear(Number(e.target.value))} w="140px">
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                          <option key={y} value={String(y)}>{y}</option>
                        ))}
                      </Select>
                      <Button leftIcon={<FiDownload />} variant="outline" onClick={handleExportAnnualXlsx}>
                        Export Excel
                      </Button>
                      <Button colorScheme="blue" onClick={handleSaveAnnual} isDisabled={!annualDirty}>
                        Salvează
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setAnnualInlineOpen(v => !v)}
                      >
                        {annualInlineOpen ? 'Închide rând nou' : '+ Adaugă rând'}
                      </Button>
                    </HStack>
                  </Flex>
                </CardHeader>
                <CardBody>
                  <HStack mb={4} spacing={3}>
                    <Badge colorScheme="teal">{FUNDING_SOURCE_LABEL[fundingSource]}</Badge>
                    <Badge colorScheme="purple">{annualType === 'REVENUE' ? 'VENITURI' : 'CHELTUIELI'}</Badge>
                    <Text color={muted} fontSize="sm">
                      Total (filtrat): <strong>{formatMoney(annualTotal)}</strong> lei
                    </Text>
                    {annualDirty && <Badge colorScheme="yellow">modificat</Badge>}
                  </HStack>

                  {/* Inline add row form */}
                  {annualInlineOpen && (
                    <Box mb={4} p={4} border="1px solid" borderColor={panelBorder} borderRadius="md" bg={softBg}>
                      <HStack spacing={2} align="flex-end" wrap="wrap">
                        <Box>
                          <Text fontSize="xs" color={muted} mb={1}>Cap</Text>
                          <Input size="sm" w="80px" value={annualInline.capitol} onChange={(e) => setAnnualInline(s => ({ ...s, capitol: e.target.value }))} />
                        </Box>
                        <Box>
                          <Text fontSize="xs" color={muted} mb={1}>Subcap</Text>
                          <Input size="sm" w="90px" value={annualInline.subcapitol} onChange={(e) => setAnnualInline(s => ({ ...s, subcapitol: e.target.value }))} />
                        </Box>
                        <Box>
                          <Text fontSize="xs" color={muted} mb={1}>Paragraf</Text>
                          <Input size="sm" w="90px" value={annualInline.paragraf} onChange={(e) => setAnnualInline(s => ({ ...s, paragraf: e.target.value }))} />
                        </Box>
                        <Box>
                          <Text fontSize="xs" color={muted} mb={1}>Cod</Text>
                          <Input size="sm" w="140px" value={annualInline.indicator_code} onChange={(e) => setAnnualInline(s => ({ ...s, indicator_code: e.target.value }))} placeholder="ex: 10.01.01" />
                        </Box>
                        <Box flex="1" minW="260px">
                          <Text fontSize="xs" color={muted} mb={1}>Denumire</Text>
                          <Input size="sm" value={annualInline.name} onChange={(e) => setAnnualInline(s => ({ ...s, name: e.target.value }))} placeholder="ex: Cheltuieli curente" />
                        </Box>
                        <Box>
                          <Text fontSize="xs" color={muted} mb={1}>CA/CB</Text>
                          <Input size="sm" w="90px" value={annualInline.ca_cb} onChange={(e) => setAnnualInline(s => ({ ...s, ca_cb: e.target.value }))} />
                        </Box>
                        <Box>
                          <Text fontSize="xs" color={muted} mb={1}>Buget</Text>
                          <Input size="sm" w="140px" type="number" value={String(toMoney(annualInline.amount))} onChange={(e) => setAnnualInline(s => ({ ...s, amount: toMoney(e.target.value) }))} />
                        </Box>
                        <HStack>
                          <Button size="sm" colorScheme="blue" onClick={addAnnualInline} isLoading={annualInlineSaving}>
                            Adaugă
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setAnnualInlineOpen(false); }}>
                            Renunță
                          </Button>
                        </HStack>
                      </HStack>
                    </Box>
                  )}

                  <Box border="1px solid" borderColor={panelBorder} borderRadius="md" overflowX="hidden" overflowY="auto">
                    {groupedAnnual.length > 0 ? (
                      <Accordion allowMultiple defaultIndex={[0]} reduceMotion>
                        {groupedAnnual.map((group, groupIdx) => (
                          <AccordionItem key={groupIdx} border="none" borderBottom="1px solid" borderColor={panelBorder}>
                            <AccordionButton
                              px={4}
                              py={3}
                              bg={tableHeadBg}
                              _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                              _expanded={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                            >
                              <Box flex="1" textAlign="left">
                                <HStack>
                                  {group.code && (
                                    <Badge colorScheme="purple" fontFamily="mono" fontSize="sm">
                                      {group.code}
                                    </Badge>
                                  )}
                                  <Text fontWeight="bold" fontSize="sm">
                                    {group.title}
                                  </Text>
                                  <Text fontSize="xs" color={muted}>
                                    ({group.rows.length} rânduri)
                                  </Text>
                                </HStack>
                              </Box>
                              <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel px={0} pb={0}>
                              <Table size="sm" variant="simple">
                                <Thead bg={tableHeadBg}>
                                  <Tr>
                                    <Th textAlign="center" fontWeight="bold">B</Th>
                                    <Th textAlign="center" fontWeight="bold">C</Th>
                                    <Th textAlign="center" fontWeight="bold">D</Th>
                                    <Th textAlign="center">Cod</Th>
                                    <Th textAlign="center" fontWeight="bold">E</Th>
                                    <Th textAlign="center" fontWeight="bold">3</Th>
                                    <Th isNumeric>Buget</Th>
                                  </Tr>
                                  <Tr>
                                    <Th>Capitol</Th>
                                    <Th>Subcap.</Th>
                                    <Th>Paragraf</Th>
                                    <Th>indicator</Th>
                                    <Th>Denumirea indicatorilor</Th>
                                    <Th>CA/CB</Th>
                                    <Th isNumeric></Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {group.rows.map((r) => {
                                    const indent = computeAnnualIndent(r.indicator_code, r.capitol, r.subcapitol, r.paragraf);
                                    const namePl = 2 + indent * 16; // 16px per indent level
                                    const isGroup = !r.capitol && !r.subcapitol && !r.paragraf && r.indicator_code;
                                    
                                    return (
                                      <Tr key={r.indicator_id} bg={isGroup ? softBg : undefined}>
                                        <Td><Text fontFamily="mono" fontSize="sm">{r.capitol ?? '—'}</Text></Td>
                                        <Td><Text fontFamily="mono" fontSize="sm">{r.subcapitol ?? '—'}</Text></Td>
                                        <Td><Text fontFamily="mono" fontSize="sm">{r.paragraf ?? '—'}</Text></Td>
                                        <Td><Text fontFamily="mono" fontSize="sm">{r.indicator_code}</Text></Td>
                                        <Td maxW="520px">
                                          <Box pl={`${namePl}px`}>
                                            <Text 
                                              noOfLines={2}
                                              fontWeight={isGroup ? 'bold' : 'normal'}
                                              fontSize={isGroup ? 'sm' : 'sm'}
                                            >
                                              {r.name}
                                            </Text>
                                          </Box>
                                        </Td>
                                        <Td><Text fontFamily="mono" fontSize="sm">{r.ca_cb ?? '—'}</Text></Td>
                                        <Td isNumeric>
                                          <Input
                                            size="sm"
                                            type="number"
                                            value={String(toMoney(r.amount))}
                                            onChange={(e) => {
                                              const next = toMoney(e.target.value);
                                              setAnnualRows(prev => prev.map(x => x.indicator_id === r.indicator_id ? { ...x, amount: next } : x));
                                              setAnnualDirty(true);
                                            }}
                                            textAlign="right"
                                          />
                                        </Td>
                                      </Tr>
                                    );
                                  })}
                                </Tbody>
                              </Table>
                            </AccordionPanel>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <Table size="sm" variant="simple">
                        <Thead bg={tableHeadBg}>
                          <Tr>
                            <Th textAlign="center" fontWeight="bold">B</Th>
                            <Th textAlign="center" fontWeight="bold">C</Th>
                            <Th textAlign="center" fontWeight="bold">D</Th>
                            <Th textAlign="center">Cod</Th>
                            <Th textAlign="center" fontWeight="bold">E</Th>
                            <Th textAlign="center" fontWeight="bold">3</Th>
                            <Th isNumeric>Buget</Th>
                          </Tr>
                          <Tr>
                            <Th>Capitol</Th>
                            <Th>Subcap.</Th>
                            <Th>Paragraf</Th>
                            <Th>indicator</Th>
                            <Th>Denumirea indicatorilor</Th>
                            <Th>CA/CB</Th>
                            <Th isNumeric></Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {annualInlineOpen && (
                            <Tr bg={softBg}>
                              <Td colSpan={7}>
                                <HStack spacing={2} align="flex-end" wrap="wrap">
                                  <Box>
                                    <Text fontSize="xs" color={muted}>Cap</Text>
                                    <Input size="sm" w="80px" value={annualInline.capitol} onChange={(e) => setAnnualInline(s => ({ ...s, capitol: e.target.value }))} />
                                  </Box>
                                  <Box>
                                    <Text fontSize="xs" color={muted}>Subcap</Text>
                                    <Input size="sm" w="90px" value={annualInline.subcapitol} onChange={(e) => setAnnualInline(s => ({ ...s, subcapitol: e.target.value }))} />
                                  </Box>
                                  <Box>
                                    <Text fontSize="xs" color={muted}>Paragraf</Text>
                                    <Input size="sm" w="90px" value={annualInline.paragraf} onChange={(e) => setAnnualInline(s => ({ ...s, paragraf: e.target.value }))} />
                                  </Box>
                                  <Box>
                                    <Text fontSize="xs" color={muted}>Cod</Text>
                                    <Input size="sm" w="140px" value={annualInline.indicator_code} onChange={(e) => setAnnualInline(s => ({ ...s, indicator_code: e.target.value }))} placeholder="ex: 10.01.01" />
                                  </Box>
                                  <Box flex="1" minW="260px">
                                    <Text fontSize="xs" color={muted}>Denumire</Text>
                                    <Input size="sm" value={annualInline.name} onChange={(e) => setAnnualInline(s => ({ ...s, name: e.target.value }))} placeholder="ex: Cheltuieli curente" />
                                  </Box>
                                  <Box>
                                    <Text fontSize="xs" color={muted}>CA/CB</Text>
                                    <Input size="sm" w="90px" value={annualInline.ca_cb} onChange={(e) => setAnnualInline(s => ({ ...s, ca_cb: e.target.value }))} />
                                  </Box>
                                  <Box>
                                    <Text fontSize="xs" color={muted}>Buget</Text>
                                    <Input size="sm" w="140px" type="number" value={String(toMoney(annualInline.amount))} onChange={(e) => setAnnualInline(s => ({ ...s, amount: toMoney(e.target.value) }))} />
                                  </Box>
                                  <HStack>
                                    <Button size="sm" colorScheme="blue" onClick={addAnnualInline} isLoading={annualInlineSaving}>
                                      Adaugă
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => { setAnnualInlineOpen(false); }}>
                                      Renunță
                                    </Button>
                                  </HStack>
                                </HStack>
                              </Td>
                            </Tr>
                          )}
                          <Tr>
                            <Td colSpan={7} textAlign="center" py={8}>
                              <Text color={muted}>Nu există date de afișat</Text>
                            </Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    )}
                  </Box>
                </CardBody>
              </Card>
            </TabPanel>

            <TabPanel px={0}>
              <Card bg={panelBg} border="1px solid" borderColor={panelBorder}>
                {/* Sticky action bar so Save is always accessible */}
                <CardHeader
                  position="sticky"
                  top={{ base: 0, md: 0 }}
                  zIndex={2}
                  bg={panelBg}
                  borderBottom="1px solid"
                  borderColor={panelBorder}
                >
                  <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
                    <Box>
                      <Heading size="md">Cont de execuție – Cheltuieli</Heading>
                      <Text fontSize="sm" color={muted}>
                        Completezi zilnic. Dacă nu există date, poți prelua automat din ziua precedentă.
                      </Text>
                    </Box>
                    <HStack wrap="wrap">
                      <Input
                        placeholder="Capitol"
                        value={execCapitol}
                        onChange={(e) => setExecCapitol(e.target.value)}
                        w="100px"
                        title="Capitol (ex. 6610) — apare în antetul formularului exportat"
                      />
                      <Input
                        placeholder="Subcapitol"
                        value={execSubcapitol}
                        onChange={(e) => setExecSubcapitol(e.target.value)}
                        w="110px"
                        title="Subcapitol — apare în antetul formularului exportat"
                      />
                      <Input type="date" value={execDate} onChange={(e) => setExecDate(e.target.value)} w="190px" />
                      <Button variant="outline" onClick={onCloneConfirmOpen}>
                        Preia ziua precedentă
                      </Button>
                      <Button leftIcon={<FiDownload />} variant="outline" onClick={handleExportExecutionXlsx}>
                        Export Excel
                      </Button>
                      <Button colorScheme="blue" onClick={handleSaveExecution} isDisabled={!execDirty}>
                        Salvează
                      </Button>
                    </HStack>
                  </Flex>
                </CardHeader>
                <CardBody>
                  <HStack mb={4} spacing={3}>
                    <Text color={muted} fontSize="sm">
                      Plăți (filtrat): <strong>{formatMoney(execPaymentsTotal)}</strong> lei · Cheltuieli efective (filtrat): <strong>{formatMoney(execEffectiveTotal)}</strong> lei
                    </Text>
                    <Text color={muted} fontSize="sm">
                      Completezi <strong>1–5</strong> și <strong>7</strong> (doar pe rândurile de tip detaliu). Coloana <strong>6</strong> se calculează automat: <strong>6 = 4 − 5</strong>.
                    </Text>
                    {execDirty && <Badge colorScheme="yellow">modificat</Badge>}
                  </HStack>

                  <Box border="1px solid" borderColor={panelBorder} borderRadius="md" overflowX="hidden" overflowY="auto">
                    {groupedExec.length > 0 ? (
                      <Accordion allowMultiple defaultIndex={[0]} reduceMotion>
                        {groupedExec.map((group, groupIdx) => (
                          <AccordionItem key={groupIdx} border="none" borderBottom="1px solid" borderColor={panelBorder}>
                            <AccordionButton
                              px={4}
                              py={3}
                              bg={tableHeadBg}
                              _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                              _expanded={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                            >
                              <Box flex="1" textAlign="left">
                                <HStack>
                                  {group.code && (
                                    <Badge colorScheme="blue" fontFamily="mono" fontSize="sm">
                                      {group.code}
                                    </Badge>
                                  )}
                                  <Text fontWeight="bold" fontSize="sm">
                                    {group.title}
                                  </Text>
                                  <Text fontSize="xs" color={muted}>
                                    ({group.rows.length} rânduri)
                                  </Text>
                                </HStack>
                              </Box>
                              <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel px={0} pb={0}>
                              <Table
                                size="sm"
                                variant="simple"
                                sx={{
                                  tableLayout: 'fixed',
                                  width: '100%',
                                  '& th': {
                                    wordBreak: 'keep-all',
                                    overflowWrap: 'normal',
                                    whiteSpace: 'normal',
                                    lineHeight: '1.15',
                                    letterSpacing: '0.02em',
                                    py: 2,
                                  },
                                  '& td': {
                                    py: 2,
                                  },
                                }}
                              >
                                <colgroup>
                                  <col style={{ width: '36%' }} />
                                  <col style={{ width: '10%' }} />
                                  <col style={{ width: '7%' }} />
                                  <col style={{ width: '9%' }} />
                                  <col style={{ width: '7%' }} />
                                  <col style={{ width: '7%' }} />
                                  <col style={{ width: '7%' }} />
                                  <col style={{ width: '9%' }} />
                                  <col style={{ width: '8%' }} />
                                </colgroup>
                                <Thead bg={tableHeadBg}>
                                  <Tr>
                                    <Th rowSpan={2}>Denumirea indicatorilor*)</Th>
                                    <Th rowSpan={2}>Cod indicator</Th>
                                    <Th colSpan={2} textAlign="center" whiteSpace="nowrap">Credite bugetare</Th>
                                    <Th rowSpan={2} textAlign="center">Angaj. bugetare</Th>
                                    <Th rowSpan={2} textAlign="center">Angaj. legale</Th>
                                    <Th rowSpan={2} textAlign="center">Plăți</Th>
                                    <Th rowSpan={2} textAlign="center">Angaj. legale de plată</Th>
                                    <Th rowSpan={2} textAlign="center">Cheltuieli efective</Th>
                                  </Tr>
                                  <Tr>
                                    <Th textAlign="center">Inițiale</Th>
                                    <Th textAlign="center">Trimestriale/definitive</Th>
                                  </Tr>
                                  <Tr>
                                    <Th textAlign="center" fontWeight="bold">A</Th>
                                    <Th textAlign="center" fontWeight="bold">B</Th>
                                    <Th textAlign="center" fontWeight="bold">1</Th>
                                    <Th textAlign="center" fontWeight="bold">2</Th>
                                    <Th textAlign="center" fontWeight="bold">3</Th>
                                    <Th textAlign="center" fontWeight="bold">4</Th>
                                    <Th textAlign="center" fontWeight="bold">5</Th>
                                    <Th textAlign="center" fontWeight="bold">6=4-5</Th>
                                    <Th textAlign="center" fontWeight="bold">7</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {group.rows.map((r) => {
                          const kind = normalizeRowKind((r as any).row_kind);
                          const isLeaf = kind === 'LEAF';
                          const indent = Number.isFinite(Number((r as any).indent_level)) ? Number((r as any).indent_level) : 0;
                          const namePl = 2 + indent * 6;

                          return (
                            <Tr key={r.indicator_id} bg={kind === 'TITLE' ? softBg : undefined}>
                              <Td maxW="520px">
                                <HStack spacing={2} align="center">
                                  <Box flex="1" pl={`${namePl}px`}>
                                    <Text
                                      noOfLines={2}
                                      fontWeight={kind === 'LEAF' ? 'normal' : 'bold'}
                                    >
                                      {r.name}
                                    </Text>
                                    {r.calc_expression && kind !== 'LEAF' && (
                                      <Text fontSize="xs" color={muted} noOfLines={1}>
                                        ({r.calc_expression})
                                      </Text>
                                    )}
                                  </Box>
                                </HStack>
                              </Td>
                              <Td>
                                <Text fontFamily="mono">
                                  {kind === 'TITLE' && String(r.indicator_code).trim() === 'TOTAL' ? '' : r.indicator_code}
                                </Text>
                              </Td>

                              {(
                                [
                                  ['credits_initial', r.credits_initial, true],
                                  ['credits_definitive', r.credits_definitive, true],
                                  ['commitments_budgetary', r.commitments_budgetary, true],
                                  ['commitments_legal', r.commitments_legal, true],
                                  ['payments_made', r.payments_made, true],
                                  ['commitments_legal_to_pay', r.commitments_legal_to_pay, false], // computed
                                  ['expenses_effective', r.expenses_effective, true],
                                ] as Array<[keyof ExecutionRow, number, boolean]>
                              ).map(([k, v, editable]) => {
                                const isComputedCol = k === 'commitments_legal_to_pay';
                                const canEdit = isLeaf && editable && !isComputedCol;
                                const num = toMoney(v);
                                const showZero = isLeaf && !isComputedCol; // inputs already show 0; for computed/subtotals hide zeros
                                const displayText = !showZero && num === 0 ? '' : formatMoney(num);
                                return (
                                  <Td key={String(k)} isNumeric>
                                    {canEdit ? (
                                      <Input
                                        key={`${r.indicator_id}-${execDate}-${String(k)}`}
                                        size="sm"
                                        type="number"
                                        defaultValue={toMoney(v) === 0 ? '' : String(toMoney(v))}
                                        placeholder="0"
                                        onFocus={(e) => {
                                          // if the value is 0, clear it so user can type immediately
                                          if (e.currentTarget.value === '0' || e.currentTarget.value === '0.00' || e.currentTarget.value === '0,00') {
                                            e.currentTarget.value = '';
                                          }
                                          // select all for quick overwrite
                                          e.currentTarget.select();
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                                        }}
                                        onBlur={(e) => {
                                          const next = toMoney(e.currentTarget.value);
                                          const prevVal = toMoney(v);
                                          if (next === prevVal) return;
                                          setExecRows(prev => prev.map(x => x.indicator_id === r.indicator_id ? { ...x, [k]: next } : x));
                                          setExecDirty(true);
                                        }}
                                        textAlign="right"
                                      />
                                    ) : (
                                      <Text
                                        fontFamily="mono"
                                        textAlign="right"
                                        whiteSpace="nowrap"
                                        color={isLeaf && isComputedCol ? muted : undefined}
                                      >
                                        {displayText}
                                      </Text>
                                    )}
                                  </Td>
                                );
                              })}
                            </Tr>
                          );
                        })}
                                </Tbody>
                              </Table>
                            </AccordionPanel>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <Table
                        size="sm"
                        variant="simple"
                        sx={{
                          tableLayout: 'fixed',
                          width: '100%',
                          '& th': {
                            wordBreak: 'keep-all',
                            overflowWrap: 'normal',
                            whiteSpace: 'normal',
                            lineHeight: '1.15',
                            letterSpacing: '0.02em',
                            py: 2,
                          },
                          '& td': {
                            py: 2,
                          },
                        }}
                      >
                        <colgroup>
                          <col style={{ width: '36%' }} />
                          <col style={{ width: '10%' }} />
                          <col style={{ width: '7%' }} />
                          <col style={{ width: '9%' }} />
                          <col style={{ width: '7%' }} />
                          <col style={{ width: '7%' }} />
                          <col style={{ width: '7%' }} />
                          <col style={{ width: '9%' }} />
                          <col style={{ width: '8%' }} />
                        </colgroup>
                        <Thead bg={tableHeadBg}>
                          <Tr>
                            <Th rowSpan={2}>Denumirea indicatorilor*)</Th>
                            <Th rowSpan={2}>Cod indicator</Th>
                            <Th colSpan={2} textAlign="center" whiteSpace="nowrap">Credite bugetare</Th>
                            <Th rowSpan={2} textAlign="center">Angaj. bugetare</Th>
                            <Th rowSpan={2} textAlign="center">Angaj. legale</Th>
                            <Th rowSpan={2} textAlign="center">Plăți</Th>
                            <Th rowSpan={2} textAlign="center">Angaj. legale de plată</Th>
                            <Th rowSpan={2} textAlign="center">Cheltuieli efective</Th>
                          </Tr>
                          <Tr>
                            <Th textAlign="center">Inițiale</Th>
                            <Th textAlign="center">Trimestriale/definitive</Th>
                          </Tr>
                          <Tr>
                            <Th textAlign="center" fontWeight="bold">A</Th>
                            <Th textAlign="center" fontWeight="bold">B</Th>
                            <Th textAlign="center" fontWeight="bold">1</Th>
                            <Th textAlign="center" fontWeight="bold">2</Th>
                            <Th textAlign="center" fontWeight="bold">3</Th>
                            <Th textAlign="center" fontWeight="bold">4</Th>
                            <Th textAlign="center" fontWeight="bold">5</Th>
                            <Th textAlign="center" fontWeight="bold">6=4-5</Th>
                            <Th textAlign="center" fontWeight="bold">7</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          <Tr>
                            <Td colSpan={9} textAlign="center" py={8}>
                              <Text color={muted}>Nu există date de afișat</Text>
                            </Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    )}
                  </Box>

                  {/* Sticky bottom save bar (appears only when modified) */}
                  {execDirty && (
                    <Box
                      position="sticky"
                      bottom="0"
                      mt={4}
                      p={3}
                      border="1px solid"
                      borderColor={panelBorder}
                      borderRadius="md"
                      bg={panelBg}
                      zIndex={2}
                    >
                      <Flex align="center" justify="space-between" gap={3} wrap="wrap">
                        <Text fontSize="sm" color={muted}>
                          Ai modificări nesalvate pentru data <strong>{execDate}</strong>.
                        </Text>
                        <HStack>
                          <Button variant="outline" onClick={loadExecution}>
                            Renunță (reîncarcă)
                          </Button>
                          <Button colorScheme="blue" onClick={handleSaveExecution}>
                            Salvează modificările
                          </Button>
                        </HStack>
                      </Flex>
                    </Box>
                  )}
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Import modal */}
      <Modal isOpen={isImportOpen} onClose={onImportClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Import indicatori (Excel / PDF)</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="info" borderRadius="md" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle>Format recomandat</AlertTitle>
                <AlertDescription>
                  Copiezi din Excel un tabel cu coloane: <strong>Capitol</strong>, <strong>Subcapitol</strong>, <strong>Paragraf</strong>, <strong>Cod</strong>, <strong>Denumire</strong>, <strong>CA/CB</strong> (opțional).
                </AlertDescription>
              </Box>
            </Alert>

            <HStack mb={3}>
              <Text color={muted} fontSize="sm">Import pentru:</Text>
              <Select value={importType} onChange={(e) => setImportType(e.target.value as BudgetIndicatorType)} w="220px">
                <option value="REVENUE">Venituri</option>
                <option value="EXPENSE">Cheltuieli</option>
              </Select>
              <Input
                ref={importFileRef}
                type="file"
                accept=".pdf,.xlsx,.csv,.tsv,.txt"
                display="none"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) await handleImportFile(f);
                  e.target.value = '';
                }}
              />
              <Button variant="outline" onClick={handlePickFile}>
                Alege fișier
              </Button>
            </HStack>

            <Box
              {...getRootProps()}
              border="1px dashed"
              borderColor={panelBorder}
              borderRadius="md"
              p={3}
              mb={3}
              bg={isDragActive ? useColorModeValue('blue.50', 'whiteAlpha.100') : 'transparent'}
            >
              <input {...getInputProps()} />
              <Text fontSize="sm" color={muted}>
                Poți da <strong>drag &amp; drop</strong> aici pentru: <strong>.pdf</strong> / <strong>.xlsx</strong> / <strong>.csv</strong>.
                Dacă PDF-ul nu se extrage perfect, varianta sigură rămâne: Copy din PDF → Paste în Excel → Copy → Paste aici.
              </Text>
            </Box>

            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Lipește aici din Excel…"
              minH="240px"
            />
            <Text mt={2} fontSize="sm" color={muted}>
              Rânduri detectate: <strong>{parseExcelPaste(importText).length}</strong>
            </Text>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button variant="outline" onClick={onImportClose}>Anulează</Button>
              <Button colorScheme="blue" onClick={handleImport} isLoading={importing} isDisabled={!importText.trim()}>
                Importă
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add indicator modal */}
      <Modal isOpen={isAddOpen} onClose={onAddClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Adaugă indicator</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <HStack mb={4}>
              <Text color={muted} fontSize="sm">Tip:</Text>
              <Select value={addType} onChange={(e) => setAddType(e.target.value as BudgetIndicatorType)} w="220px">
                <option value="REVENUE">Venituri</option>
                <option value="EXPENSE">Cheltuieli</option>
              </Select>
            </HStack>

            <HStack spacing={3} mb={3}>
              <FormControl>
                <FormLabel fontSize="sm" color={muted}>Capitol</FormLabel>
                <Input value={addCap} onChange={(e) => setAddCap(e.target.value)} placeholder="ex: 20" />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" color={muted}>Subcapitol</FormLabel>
                <Input value={addSubcap} onChange={(e) => setAddSubcap(e.target.value)} placeholder="ex: 01" />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" color={muted}>Paragraf</FormLabel>
                <Input value={addPar} onChange={(e) => setAddPar(e.target.value)} placeholder="ex: 30" />
              </FormControl>
            </HStack>

            <FormControl mb={3} isRequired>
              <FormLabel>Cod</FormLabel>
              <Input value={addCode} onChange={(e) => setAddCode(e.target.value)} placeholder="ex: 20.01.02" />
            </FormControl>
            <FormControl mb={3} isRequired>
              <FormLabel>Denumire</FormLabel>
              <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="ex: Materiale pentru curățenie" />
            </FormControl>
            <FormControl mb={2}>
              <FormLabel>CA/CB (opțional)</FormLabel>
              <Input value={addCaCb} onChange={(e) => setAddCaCb(e.target.value)} placeholder="ex: CA" />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button variant="outline" onClick={onAddClose}>Anulează</Button>
              <Button colorScheme="blue" onClick={handleAddIndicator} isLoading={adding}>
                Adaugă
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirm clone previous day modal */}
      <Modal isOpen={isCloneConfirmOpen} onClose={onCloneConfirmClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmă preluarea zilei precedente</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="warning" borderRadius="md" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle>Atenție!</AlertTitle>
                <AlertDescription>
                  Ești sigur că vrei să preiei datele din ziua precedentă?
                </AlertDescription>
              </Box>
            </Alert>
            <VStack spacing={3} align="stretch">
              <Box>
                <Text fontSize="sm" color={muted} mb={1}>Data curentă:</Text>
                <Text fontWeight="bold">{new Date(execDate).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color={muted} mb={1}>Data de preluat:</Text>
                <Text fontWeight="bold">{new Date(prevDate).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
              </Box>
              <Text fontSize="sm" color={muted}>
                Toate datele din ziua precedentă vor înlocui datele curente pentru data selectată. 
                {execDirty && (
                  <Text as="span" fontWeight="bold" color="orange.400">
                    {' '}Ai modificări nesalvate care vor fi pierdute!
                  </Text>
                )}
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button variant="outline" onClick={onCloneConfirmClose} isDisabled={cloning}>
                Anulează
              </Button>
              <Button colorScheme="blue" onClick={handleClonePrev} isLoading={cloning}>
                Da, preia datele
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}


