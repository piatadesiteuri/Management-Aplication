import {
  Modal,
  ModalOverlay,
  ModalContent,
  Box,
  Text,
  HStack,
  VStack,
  IconButton,
  Input,
  InputGroup,
  Button,
  Spinner,
  Center,
  Badge,
  Table,
  Tbody,
  Tr,
  Td,
  TableContainer
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { FiDownload, FiMinimize2, FiMaximize2, FiX, FiChevronLeft, FiChevronRight, FiZoomOut, FiZoomIn, FiRotateCw, FiFileText, FiFile, FiImage } from 'react-icons/fi';
import { Document, Page, pdfjs } from 'react-pdf';
import mammoth from 'mammoth';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
// Necesare pentru afișarea corectă a textLayer-ului (altfel highlight-ul nu se vede)
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// CSS pentru highlight override - stiluri mai puternice
const highlightStyles = `
  .react-pdf__Page__textContent mark,
  .react-pdf__Page__textContent .pdf-highlight {
    background-color: #ffff99 !important;
    color: #000 !important;
    padding: 0px 1px !important;
    border-radius: 2px !important;
    position: relative !important;
    z-index: 999 !important;
    display: inline !important;
    box-shadow: 0 0 0 1px rgba(255,255,0,0.3) !important;
  }
  .react-pdf__Page__textContent mark.active,
  .react-pdf__Page__textContent .pdf-highlight.active {
    background-color: #ff9999 !important;
    color: #000 !important;
    box-shadow: 0 0 0 2px rgba(255,0,0,0.5) !important;
    font-weight: bold !important;
  }
  
  /* Override react-pdf text styles */
  .react-pdf__Page__textContent span {
    position: relative !important;
  }
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = highlightStyles;
  document.head.appendChild(style);
}

// Funcții pentru detectarea tipului de fișier
const getFileType = (mimeType: string, fileName: string): 'pdf' | 'image' | 'word' | 'excel' | 'powerpoint' | 'text' | 'rtf' | 'unknown' => {
  // Verifică mai întâi extensia pentru cazurile când MIME type-ul nu este corect
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  // Detectare pe baza extensiei (prioritate mare)
  if (extension === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) return 'image';
  if (['doc', 'docx'].includes(extension || '')) return 'word';
  if (['xls', 'xlsx'].includes(extension || '')) return 'excel';
  if (['ppt', 'pptx'].includes(extension || '')) return 'powerpoint';
  if (extension === 'txt') return 'text';
  if (extension === 'rtf') return 'rtf';
  
  // Apoi verifică MIME type-ul
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      mimeType === 'application/msword') return 'word';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
      mimeType === 'application/vnd.ms-excel') return 'excel';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
      mimeType === 'application/vnd.ms-powerpoint') return 'powerpoint';
  if (mimeType === 'text/plain') return 'text';
  if (mimeType === 'application/rtf') return 'rtf';
  
  return 'unknown';
};

const getFileTypeIcon = (fileType: string) => {
  switch (fileType) {
    case 'pdf': return FiFileText;
    case 'image': return FiImage;
    case 'word': return FiFileText;
    case 'excel': return FiFileText;
    case 'powerpoint': return FiFileText;
    case 'text': return FiFileText;
    case 'rtf': return FiFileText;
    default: return FiFile;
  }
};

const getFileTypeColor = (fileType: string) => {
  switch (fileType) {
    case 'pdf': return 'red';
    case 'image': return 'green';
    case 'word': return 'blue';
    case 'excel': return 'green';
    case 'powerpoint': return 'orange';
    case 'text': return 'gray';
    case 'rtf': return 'purple';
    default: return 'gray';
  }
};

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: number;
  fileName: string;
  mimeType: string;
}

// Debounce hook simplu - nu mai e necesar, căutăm în timp real
// function useDebouncedValue<T>(value: T, delay: number): T {
//   const [debounced, setDebounced] = useState(value);
//   useEffect(() => {
//     const handler = setTimeout(() => setDebounced(value), delay);
//     return () => clearTimeout(handler);
//   }, [value, delay]);
//   return debounced;
// }

// Componente de afișare personalizate
const ExcelViewer = ({ documentId, fileName }: { documentId: number, fileName: string }) => {
  const [excelData, setExcelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExcelData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`/api/documents/${documentId}/view`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // Pentru Excel, afișăm informații despre fișier
        setExcelData({
          fileName,
          size: blob.size,
          type: blob.type,
          lastModified: new Date().toLocaleString()
        });
      } catch (err) {
        console.error('Error loading Excel file:', err);
        setError('Eroare la încărcarea fișierului Excel');
      } finally {
        setLoading(false);
      }
    };

    loadExcelData();
  }, [documentId, fileName]);

  if (loading) {
    return (
      <Center h="40vh">
        <VStack spacing={4}>
          <Spinner size="lg" color="green.400" />
          <Text color="gray.400">Se încarcă fișierul Excel...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="40vh">
        <VStack spacing={4}>
          <Text color="red.400" fontSize="lg" fontWeight="bold">Eroare la încărcarea Excel-ului</Text>
          <Text color="gray.400" textAlign="center" maxW="400px">
            {error}
          </Text>
        </VStack>
      </Center>
    );
  }

  return (
    <VStack spacing={6} p={6} w="full">
      <HStack spacing={4} align="center">
        <Box p={3} borderRadius="lg" bg="green.100" color="green.600">
          <FiFileText size={32} />
        </Box>
        <VStack align="start" spacing={1}>
          <Text fontSize="xl" fontWeight="bold" color="white">
            {fileName}
          </Text>
          <Badge colorScheme="green" size="lg">
            Fișier Excel
          </Badge>
        </VStack>
      </HStack>

      <Box w="full" bg="gray.700" borderRadius="lg" p={6}>
        <VStack spacing={4} align="start">
          <Text fontSize="lg" fontWeight="semibold" color="white">
            Informații despre fișier:
          </Text>
          
          <TableContainer w="full">
            <Table variant="simple" colorScheme="gray">
              <Tbody>
                <Tr>
                  <Td fontWeight="bold" color="gray.300">Nume fișier:</Td>
                  <Td color="white">{excelData?.fileName}</Td>
                </Tr>
                <Tr>
                  <Td fontWeight="bold" color="gray.300">Tip MIME:</Td>
                  <Td color="white">{excelData?.type}</Td>
                </Tr>
                <Tr>
                  <Td fontWeight="bold" color="gray.300">Dimensiune:</Td>
                  <Td color="white">{(excelData?.size / 1024).toFixed(2)} KB</Td>
                </Tr>
                <Tr>
                  <Td fontWeight="bold" color="gray.300">Ultima modificare:</Td>
                  <Td color="white">{excelData?.lastModified}</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>

          <Box w="full" mt={4}>
            <Text fontSize="md" color="gray.300" mb={3}>
              Pentru a vizualiza conținutul complet al fișierului Excel, folosește butonul de download.
            </Text>
            <Button
              colorScheme="green"
              leftIcon={<FiDownload />}
              onClick={() => window.open(`/api/documents/${documentId}/view`, '_blank')}
              size="lg"
            >
              Descarcă și deschide în Excel
            </Button>
          </Box>
        </VStack>
      </Box>
    </VStack>
  );
};

const ImageViewer = ({ documentId, fileName }: { documentId: number, fileName: string }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`/api/documents/${documentId}/view`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (err) {
        console.error('Error loading image:', err);
        setError('Eroare la încărcarea imaginii');
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [documentId]);

  if (loading) {
    return (
      <Center h="40vh">
        <VStack spacing={4}>
          <Spinner size="lg" color="green.400" />
          <Text color="gray.400">Se încarcă imaginea...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="40vh">
        <VStack spacing={4}>
          <Text color="red.400" fontSize="lg" fontWeight="bold">Eroare la încărcarea imaginii</Text>
          <Text color="gray.400" textAlign="center" maxW="400px">
            {error}
          </Text>
        </VStack>
      </Center>
    );
  }

  return (
    <VStack spacing={4} p={6} w="full">
      <HStack spacing={4} align="center">
        <Box p={3} borderRadius="lg" bg="green.100" color="green.600">
          <FiImage size={32} />
        </Box>
        <VStack align="start" spacing={1}>
          <Text fontSize="xl" fontWeight="bold" color="white">
            {fileName}
          </Text>
          <Badge colorScheme="green" size="lg">
            Imagine
          </Badge>
        </VStack>
      </HStack>

      <Box w="full" bg="gray.700" borderRadius="lg" p={4} textAlign="center">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={fileName}
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          />
        )}
      </Box>
    </VStack>
  );
};

export default function DocumentViewerModal({ isOpen, onClose, documentId, fileName, mimeType }: DocumentViewerModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(0.3);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  // const debouncedSearchTerm = useDebouncedValue(searchTerm, 150); // Nu mai e necesar - folosim searchTerm direct
  // const [matches, setMatches] = useState<{page: number, indices: number[]}[]>([]); // toate potrivirile - unused
  // const [currentMatch, setCurrentMatch] = useState<number>(0); // indexul potrivirii activ - unused
  const [allMatches, setAllMatches] = useState<{ page: number; itemIndex: number; index: number; str: string; }[]>([]); // toate highlight-urile
  const [activeMatch, setActiveMatch] = useState<number>(0); // indexul highlight-ului activ global
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [resolvedMimeType, setResolvedMimeType] = useState<string>(mimeType || 'application/octet-stream');

  // Detectează tipul de fișier
  const fileType = getFileType(resolvedMimeType, fileName);
  const FileTypeIcon = getFileTypeIcon(fileType);
  const fileTypeColor = getFileTypeColor(fileType);

  useEffect(() => {
    if (!isOpen || !documentId) {
      return;
    }

    setResolvedMimeType(mimeType || 'application/octet-stream');

    const extension = fileName.split('.').pop()?.toLowerCase();
    const hasReliableExtension = !!extension && ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'].includes(extension);
    const needsMimeProbe = !hasReliableExtension || !mimeType || mimeType === 'application/octet-stream';
    if (!needsMimeProbe) {
      return;
    }

    const probeMimeType = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`/api/documents/${documentId}/view`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (!response.ok) {
          return;
        }

        const serverContentType = response.headers.get('content-type') || '';
        if (serverContentType) {
          setResolvedMimeType(serverContentType.split(';')[0].trim());
        }
      } catch {
        // keep fallback mime type
      }
    };

    probeMimeType();
  }, [isOpen, documentId, fileName, mimeType]);


  useEffect(() => {
    if (isOpen && documentId) {
      // Setez URL-ul doar pentru PDF-uri
      if (fileType === 'pdf') {
        setPdfUrl(`/api/documents/${documentId}/view`);
      } else {
        setPdfUrl('');
      }
      setPageNumber(1);
      setScale(1);
      setSearchTerm('');
      // setMatches([]); // unused
      // setCurrentMatch(0); // unused
      setAllMatches([]);
      setActiveMatch(0);
      setError(null);
      setIsFullscreen(false);
    }
  }, [isOpen, documentId, fileName, mimeType, fileType]);

  // Funcție pentru a obține PDF-ul cu autentificare
  const getPdfWithAuth = async (url: string) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error fetching PDF with auth:', error);
      throw error;
    }
  };

  // Extrage textul pe item-uri (compatibil cu customTextRenderer)
  const [pageTextItems, setPageTextItems] = useState<string[][]>([]);
  const [authenticatedPdfUrl, setAuthenticatedPdfUrl] = useState<string>('');
  const shouldRenderTextLayer = fileType === 'pdf' && debouncedSearchTerm.length >= 2;
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 180);

    return () => clearTimeout(handler);
  }, [searchTerm]);
  
  useEffect(() => {
    // Execută doar pentru fișiere PDF
    if (!pdfUrl || fileType !== 'pdf') return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        // Obținem PDF-ul cu autentificare
        const authUrl = await getPdfWithAuth(pdfUrl);
        setAuthenticatedPdfUrl(authUrl);
        
        const pdf = await pdfjs.getDocument(authUrl).promise;
        const textsByItem: string[][] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const itemTexts = textContent.items.map((item: any) => String(item?.str || ''));
          textsByItem.push(itemTexts);
        }
        setPageTextItems(textsByItem);
      } catch (e) {
        console.error('Error loading PDF:', e);
        setPageTextItems([]);
        setError('Eroare la încărcarea PDF-ului. Verifică dacă fișierul există și este valid.');
      } finally {
        setLoading(false);
      }
    })();
  }, [pdfUrl, fileType]);

  // Componentă simplă pentru afișarea documentelor Word
  const WordViewer = ({ documentId }: { documentId: number }) => {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const loadWordDocument = async () => {
        try {
          setLoading(true);
          setError(null);

          // Obținem documentul Word
          const token = localStorage.getItem('jwt_token');
          const response = await fetch(`/api/documents/${documentId}/view`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const arrayBuffer = await response.arrayBuffer();
          
          // Convertim cu mammoth.js
          const result = await mammoth.convertToHtml({ arrayBuffer });
          
          // Adaugă pauze de pagină și spațiere pentru a simula Word
          let processedContent = result.value;
          
          // Adaugă pauze de pagină între secțiuni majore
          processedContent = processedContent
            .replace(/<h1[^>]*>/gi, '<div class="page-break"></div><h1>')
            .replace(/<h2[^>]*>/gi, '<div class="section-break"></div><h2>')
            .replace(/<table[^>]*>/gi, '<div class="section-break"></div><table>')
            .replace(/<\/table>/gi, '</table><div class="section-break"></div>');
          
          setContent(processedContent);
          setLoading(false);
          
          // Dă focus la Box pentru scroll
          setTimeout(() => {
            if (contentRef.current) {
              contentRef.current.focus();
            }
          }, 100);
        } catch (err) {
          console.error('Error loading Word document:', err);
          setError('Eroare la încărcarea documentului Word');
          setLoading(false);
        }
      };

      loadWordDocument();
    }, [documentId]);

    if (loading) {
      return (
        <Center h="400px">
          <VStack>
            <Spinner size="xl" color="blue.500" />
            <Text>Se încarcă documentul Word...</Text>
          </VStack>
        </Center>
      );
    }

    if (error) {
      return (
        <Center h="400px">
          <VStack>
            <Text color="red.500">{error}</Text>
            <Button onClick={() => window.location.reload()}>
              Reîncearcă
            </Button>
          </VStack>
        </Center>
      );
    }


    return (
      <Box
        ref={contentRef}
        w="100%"
        h="100%"
        minH="100%"
        overflow="auto"
        p={3}
        bg="white"
        color="black"
        tabIndex={0}
        _focus={{ outline: 'none' }}
        dangerouslySetInnerHTML={{ __html: content }}
        onWheel={(e) => {
          // Forțează scroll-ul manual
          if (contentRef.current) {
            const currentScrollTop = contentRef.current.scrollTop;
            const newScrollTop = currentScrollTop + e.deltaY;
            contentRef.current.scrollTop = newScrollTop;
          }
        }}
        sx={{
          // Forțează culorile pentru a fi vizibile pe fundal alb
          '& *': {
            color: '#000 !important',
            backgroundColor: 'transparent !important'
          },
          // DEBUG: Forțează scroll-ul să funcționeze
          overflow: 'auto !important',
          height: '100% !important',
          minHeight: '100% !important',
          '& table': {
            borderCollapse: 'collapse',
            width: '100%',
            margin: '30px 0',
            backgroundColor: 'white',
            fontSize: '12px',
            pageBreakInside: 'avoid',
            '& td, & th': {
              border: '1px solid #333',
              padding: '10px 8px',
              textAlign: 'left',
              color: '#000 !important',
              backgroundColor: 'white !important',
              verticalAlign: 'top',
              lineHeight: '1.5'
            },
            '& th': {
              backgroundColor: '#f5f5f5 !important',
              fontWeight: 'bold',
              color: '#000 !important',
              fontSize: '11px'
            },
            '& tr:nth-child(even)': {
              backgroundColor: '#fafafa !important'
            }
          },
          '& p': {
            margin: '15px 0',
            color: '#000 !important',
            fontSize: '12px',
            lineHeight: '1.6',
            pageBreakInside: 'avoid'
          },
          '& h1, & h2, & h3, & h4, & h5, & h6': {
            margin: '25px 0 15px 0',
            fontWeight: 'bold',
            color: '#000 !important',
            fontSize: '14px',
            pageBreakAfter: 'avoid'
          },
          '& div': {
            color: '#000 !important',
            fontSize: '12px',
            margin: '10px 0'
          },
          '& span': {
            color: '#000 !important',
            fontSize: '12px'
          },
          // Adaugă pauze de pagină și spațiere
          '& .page-break': {
            pageBreakBefore: 'always',
            margin: '50px 0',
            borderTop: '2px solid #ccc',
            paddingTop: '25px'
          },
          '& .section-break': {
            margin: '40px 0',
            borderTop: '1px solid #ddd',
            paddingTop: '20px'
          },
          // Simulează paginile Word
          '& > *': {
            marginBottom: '20px'
          }
        }}
      />
    );
  };

  // Căutare globală în aceleași text-items pe care le folosește renderer-ul.
  useEffect(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2 || pageTextItems.length === 0) {
      setAllMatches([]);
      setActiveMatch(0);
      return;
    }
    
    const regex = new RegExp(debouncedSearchTerm.replace(/[.*+?^${}()|[\\\]]/g, '\\$&'), 'gi');
    const found: { page: number; itemIndex: number; index: number; str: string; }[] = [];
    
    pageTextItems.forEach((items, pageIdx) => {
      items.forEach((itemText, itemIndex) => {
        let match;
        regex.lastIndex = 0;
        while ((match = regex.exec(itemText)) !== null) {
          found.push({ page: pageIdx + 1, itemIndex, index: match.index, str: match[0] });
          if (regex.lastIndex === match.index) break;
        }
      });
    });
    
    setAllMatches(found);
    
    if (found.length > 0) {
      const firstMatch = found[0];
      if (pageNumber !== firstMatch.page) {
        setPageNumber(firstMatch.page);
      }
      setActiveMatch(0);
    }
  }, [debouncedSearchTerm, pageTextItems]);

  // Navigare între rezultate globale
  const goToNextMatch = () => {
    if (allMatches.length === 0) return;
    const next = (activeMatch + 1) % allMatches.length;
    setActiveMatch(next);
    setPageNumber(allMatches[next].page);
  };
  const goToPrevMatch = () => {
    if (allMatches.length === 0) return;
    const prev = (activeMatch - 1 + allMatches.length) % allMatches.length;
    setActiveMatch(prev);
    setPageNumber(allMatches[prev].page);
  };

  // Când schimbi pagina manual, highlight-ul activ devine prima potrivire de pe acea pagină (sau 0 dacă nu există)
  const handlePageInputChange = (value: string) => {
    const pageNum = Math.max(1, Math.min(numPages, Number(value)));
    setPageNumber(pageNum);
    // Caută prima potrivire de pe această pagină
    const firstOnPage = allMatches.findIndex(m => m.page === pageNum);
    setActiveMatch(firstOnPage !== -1 ? firstOnPage : 0);
  };

  // Scroll la potrivirea activă după render-ul text layer.
  useEffect(() => {
    if (fileType !== 'pdf' || !debouncedSearchTerm || allMatches.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      const activeEl = document.querySelector('.react-pdf__Page__textContent mark.active');
      if (activeEl) {
        try {
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (_) {
          // no-op
        }
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [fileType, debouncedSearchTerm, allMatches, activeMatch, pageNumber, authenticatedPdfUrl]);

  // Highlight exact în text layer (fără overlay-uri aproximative).
  const pageItemMatchIndexes = allMatches.reduce<Record<number, number[]>>((acc, match, idx) => {
    if (match.page !== pageNumber) return acc;
    if (!acc[match.itemIndex]) acc[match.itemIndex] = [];
    acc[match.itemIndex].push(idx);
    return acc;
  }, {});
  const itemLocalCounter: Record<number, number> = {};

  const customTextRenderer = (props: any) => {
    const text: string = props.str || '';
    const itemIndex: number = Number(props.itemIndex ?? -1);
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2 || !text || itemIndex < 0) {
      return text;
    }

    const escaped = debouncedSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    const chunks: any[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    const indexesForItem = pageItemMatchIndexes[itemIndex] || [];
    itemLocalCounter[itemIndex] = itemLocalCounter[itemIndex] || 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        chunks.push(<span key={`text-${key++}`}>{text.slice(lastIndex, match.index)}</span>);
      }

      const localPos = itemLocalCounter[itemIndex];
      const globalMatchIndex = indexesForItem[localPos] ?? -1;
      const isActive = globalMatchIndex === activeMatch;

      chunks.push(
        <mark key={`mark-${key++}`} className={isActive ? 'pdf-highlight active' : 'pdf-highlight'}>
          {match[0]}
        </mark>
      );

      itemLocalCounter[itemIndex] = localPos + 1;
      lastIndex = regex.lastIndex;
      if (regex.lastIndex === match.index) regex.lastIndex += 1;
    }

    if (lastIndex < text.length) {
      chunks.push(<span key={`text-${key++}`}>{text.slice(lastIndex)}</span>);
    }

    return chunks.length > 0 ? <>{chunks}</> : text;
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.1));
  const handleResetZoom = () => setScale(1);
  const toggleFullscreen = () => setIsFullscreen(f => !f);

  // Nu mai manipulăm DOM direct


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={isFullscreen ? 'full' : '6xl'}
      motionPreset="slideInBottom"
      scrollBehavior="inside"
      isCentered
    >
      <ModalOverlay />
      <ModalContent
        borderRadius={isFullscreen ? 'none' : '2xl'}
        bg="gray.900"
        h={isFullscreen ? '100vh' : 'calc(95vh - 16px)'}
        maxH={isFullscreen ? '100vh' : 'calc(95vh - 16px)'}
        p={0}
        overflow="hidden"
        maxW="98vw"
        w="98vw"
        mt={4}
      >
        <Box p={6} bgGradient="linear(to-r, teal.600, blue.700)" display="flex" alignItems="center" justifyContent="space-between">
          <HStack spacing={3}>
            <Box p={2} borderRadius="lg" bg="whiteAlpha.200">
              <FileTypeIcon size={24} color="white" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text color="white" fontWeight="bold" fontSize="lg">{fileName}</Text>
              <Badge colorScheme={fileTypeColor} size="sm" textTransform="uppercase">
                {fileType === 'excel' ? 'Excel' : 
                 fileType === 'word' ? 'Word' : 
                 fileType === 'image' ? 'Imagine' : 
                 fileType === 'pdf' ? 'PDF' : 
                 fileType === 'powerpoint' ? 'PowerPoint' : 
                 fileType === 'text' ? 'Text' : 
                 fileType === 'rtf' ? 'RTF' : 'Document'}
              </Badge>
            </VStack>
          </HStack>
          <HStack spacing={2}>
            <IconButton aria-label="Download" icon={<FiDownload />} onClick={handleDownload} colorScheme="whiteAlpha" />
            <IconButton aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} icon={isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />} onClick={toggleFullscreen} colorScheme="whiteAlpha" />
            <IconButton aria-label="Close" icon={<FiX />} onClick={onClose} colorScheme="whiteAlpha" />
          </HStack>
        </Box>
        <Box 
          p={0} 
          bg="gray.900" 
          flex={1} 
          overflow="auto" 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          h="full"
        >
           {/* Controls - Only show for PDF files - COMPACT VERSION */}
           {fileType === 'pdf' && (
             <HStack w="full" spacing={3} py={2} px={4} bg="gray.800" borderRadius="md" justify="space-between">
               {/* Navigation - Compact */}
               <HStack spacing={2}>
                 <Button
                   leftIcon={<FiChevronLeft />}
                   onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                   isDisabled={pageNumber <= 1}
                   size="sm"
                   colorScheme="blue"
                   variant="solid"
                   bg="blue.600"
                   _hover={{ bg: "blue.700" }}
                   _disabled={{ bg: "gray.600", cursor: "not-allowed" }}
                   minW="80px"
                 >
                   Înapoi
                 </Button>
                 
                 <HStack spacing={1} align="center">
                   <Text fontSize="sm" color="white">Pagina</Text>
                   <Input 
                     size="sm" 
                     width="50px" 
                     textAlign="center" 
                     value={pageNumber} 
                     onChange={e => handlePageInputChange(e.target.value)} 
                     borderRadius="md"
                     bg="gray.700"
                     color="white"
                     border="1px solid"
                     borderColor="blue.500"
                     _focus={{ borderColor: "blue.300" }}
                     fontSize="sm"
                     fontWeight="bold"
                   />
                   <Text fontSize="sm" color="white">din {numPages}</Text>
                 </HStack>
                 
                 <Button
                   rightIcon={<FiChevronRight />}
                   onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                   isDisabled={pageNumber >= numPages}
                   size="sm"
                   colorScheme="blue"
                   variant="solid"
                   bg="blue.600"
                   _hover={{ bg: "blue.700" }}
                   _disabled={{ bg: "gray.600", cursor: "not-allowed" }}
                   minW="80px"
                 >
                   Înainte
                 </Button>
               </HStack>

               {/* Search - Compact */}
               <HStack spacing={2} bg="gray.700" p={1} borderRadius="md" border="1px solid" borderColor="gray.600">
                 <Text fontSize="xs" color="gray.300">Căutare:</Text>
                 <InputGroup size="xs" maxW="150px">
                   <Input
                     placeholder="Text..."
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     bg="gray.800"
                     color="white"
                     border="1px solid"
                     borderColor="gray.500"
                     _focus={{ borderColor: "blue.400" }}
                     pr="60px"
                     fontSize="xs"
                   />
                   {searchTerm && (
                     <HStack position="absolute" right="1px" top="1px" spacing={0}>
                       <IconButton
                         aria-label="Rezultatul anterior"
                         icon={<FiChevronLeft />}
                         onClick={goToPrevMatch}
                         isDisabled={allMatches.length === 0}
                         size="xs"
                         variant="ghost"
                         colorScheme="blue"
                         color="blue.300"
                         _hover={{ bg: "blue.700" }}
                         h="20px"
                         minW="20px"
                       />
                       <IconButton
                         aria-label="Rezultatul următor"
                         icon={<FiChevronRight />}
                         onClick={goToNextMatch}
                         isDisabled={allMatches.length === 0}
                         size="xs"
                         variant="ghost"
                         colorScheme="blue"
                         color="blue.300"
                         _hover={{ bg: "blue.700" }}
                         h="20px"
                         minW="20px"
                       />
                     </HStack>
                   )}
                 </InputGroup>
                 {allMatches.length > 0 && (
                   <Text color="blue.300" fontSize="xs" minW="60px">
                     {activeMatch + 1}/{allMatches.length}
                   </Text>
                 )}
               </HStack>

               {/* Zoom - Compact */}
               <HStack spacing={1} bg="gray.700" p={1} borderRadius="md" border="1px solid" borderColor="gray.600">
                 <Text fontSize="xs" color="gray.300">Zoom:</Text>
                 <IconButton 
                   aria-label="Micșorare" 
                   icon={<FiZoomOut />} 
                   size="xs" 
                   variant="ghost" 
                   onClick={handleZoomOut} 
                   isDisabled={scale <= 0.1}
                   colorScheme="gray"
                   color="gray.300"
                   _hover={{ bg: "gray.600", color: "white" }}
                 />
                 <Text fontSize="xs" minW="40px" textAlign="center" color="white" fontWeight="bold">
                   {Math.round(scale * 100)}%
                 </Text>
                 <IconButton 
                   aria-label="Mărire" 
                   icon={<FiZoomIn />} 
                   size="xs" 
                   variant="ghost" 
                   onClick={handleZoomIn} 
                   isDisabled={scale >= 3}
                   colorScheme="gray"
                   color="gray.300"
                   _hover={{ bg: "gray.600", color: "white" }}
                 />
                 <IconButton 
                   aria-label="Reset zoom" 
                   icon={<FiRotateCw />} 
                   size="xs" 
                   variant="ghost" 
                   onClick={handleResetZoom}
                   colorScheme="gray"
                   color="gray.300"
                   _hover={{ bg: "gray.600", color: "white" }}
                 />
               </HStack>
             </HStack>
           )}
           {/* Document Viewer - Conditional rendering based on file type */}
           <Box borderRadius="lg" boxShadow="lg" overflow="auto" bg="gray.800" p={0} w="full" maxW="98vw" flex={1} display="flex" justifyContent="center" alignItems="center" maxH={fileType === 'pdf' ? "calc(100vh - 120px)" : "calc(100vh - 180px)"}>
            {fileType === 'excel' ? (
              <ExcelViewer documentId={documentId} fileName={fileName} />
            ) : (fileType as string) === 'word' ? (
              // Afișare document Word cu docx-preview
              <WordViewer documentId={documentId!} />
            ) : fileType === 'image' ? (
              <ImageViewer documentId={documentId} fileName={fileName} />
            ) : fileType === 'pdf' ? (
              // PDF Viewer - original logic
              <>
                {loading ? (
                  <Center h="40vh">
                    <VStack spacing={4}>
                      <Spinner size="lg" color="teal.400" />
                      <Text color="gray.400">Se încarcă documentul...</Text>
                    </VStack>
                  </Center>
                ) : error ? (
                  <Center h="40vh">
                    <VStack spacing={4}>
                      <Text color="red.400" fontSize="lg" fontWeight="bold">Eroare la încărcarea PDF-ului</Text>
                      <Text color="gray.400" textAlign="center" maxW="400px">
                        {error}
                      </Text>
                      <Button 
                        colorScheme="blue" 
                        onClick={() => window.open(pdfUrl, '_blank')}
                        size="sm"
                      >
                        Deschide în tab nou
                      </Button>
                    </VStack>
                  </Center>
                 ) : authenticatedPdfUrl ? (
                   <Box 
                     w="full" 
                     h="full" 
                     overflow="auto"
                     display="flex"
                     justifyContent="center"
                     alignItems="flex-start"
                     p={0}
                     onWheel={(e) => {
                       // Scroll manual pentru PDF
                       const container = e.currentTarget;
                       const currentScrollTop = container.scrollTop;
                       const newScrollTop = currentScrollTop + e.deltaY;
                       container.scrollTop = newScrollTop;
                     }}
                   >
                     <Document
                       file={authenticatedPdfUrl}
                       onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                       onLoadError={(error) => {
                         console.error('PDF load error:', error);
                         setError('Documentul nu a putut fi încărcat. Verifică dacă fișierul există.');
                       }}
                       loading={<Center h="40vh"><Spinner size="lg" color="teal.400" /></Center>}
                       error={<Text color="red.400">Eroare la încărcarea PDF-ului</Text>}
                     >
                      <Page
                         pageNumber={pageNumber}
                         scale={scale}
                        renderTextLayer={shouldRenderTextLayer}
                        customTextRenderer={shouldRenderTextLayer ? customTextRenderer : undefined}
                         width={Math.min(window.innerWidth - 200, 800)}
                       />
                     </Document>
                   </Box>
                ) : (
                  <Center h="40vh">
                    <Text color="gray.400">Nu s-a putut încărca documentul</Text>
                  </Center>
                )}
              </>
            ) : (fileType as string) === 'word' ? (
              // Afișare document Word
              <WordViewer documentId={documentId!} />
            ) : (
              // Fallback pentru alte tipuri de fișiere
              <Center h="40vh">
                <VStack spacing={4}>
                  <Box p={4} borderRadius="lg" bg="gray.700">
                    <FileTypeIcon size={48} color="gray.400" />
                  </Box>
                  <Text color="gray.400" fontSize="lg" fontWeight="bold">
                    {fileName}
                  </Text>
                  <Text color="gray.500" textAlign="center" maxW="400px">
                    Acest tip de fișier nu poate fi previzualizat în browser.
                    Folosește butonul de download pentru a deschide fișierul.
                  </Text>
                  <Button
                    colorScheme={fileTypeColor}
                    leftIcon={<FiDownload />}
                    onClick={() => window.open(`/api/documents/${documentId}/view`, '_blank')}
                    size="lg"
                  >
                    Descarcă fișierul
                  </Button>
                </VStack>
              </Center>
            )}
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
}