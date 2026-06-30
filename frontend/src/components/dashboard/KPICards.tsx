import {
  SimpleGrid,
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Icon,
  useColorModeValue,
  Text,
  HStack,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiFileText,
  FiTruck,
  FiCalendar,
  FiPackage,
  FiAlertCircle,
} from 'react-icons/fi';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  change?: number;
  changeLabel?: string;
  description?: string;
  isLoading?: boolean;
}

const KPICard = ({
  title,
  value,
  icon,
  change,
  changeLabel,
  description,
  isLoading,
}: KPICardProps) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const iconBg = useColorModeValue('brand.50', 'brand.900');
  const iconColor = useColorModeValue('brand.500', 'brand.200');

  return (
    <Box
      p={6}
      bg={bgColor}
      borderRadius="xl"
      border="1px solid"
      borderColor={borderColor}
      shadow="xl"
      transition="all 0.3s"
      _hover={{
        transform: 'translateY(-2px)',
        shadow: '2xl',
      }}
    >
      <HStack spacing={4} mb={4}>
        <Box
          p={3}
          bg={iconBg}
          borderRadius="lg"
          color={iconColor}
        >
          <Icon as={icon} boxSize={6} />
        </Box>
        {description && (
          <Tooltip label={description} placement="top">
            <Box as="span" color={textColor} cursor="help">
              <Icon as={FiAlertCircle} />
            </Box>
          </Tooltip>
        )}
      </HStack>

      <Stat>
        <StatLabel fontSize="sm" color={textColor}>
          {title}
        </StatLabel>
        <StatNumber fontSize="2xl" fontWeight="bold" my={2}>
          {value}
        </StatNumber>
        {change !== undefined && (
          <StatHelpText mb={0}>
            <StatArrow type={change >= 0 ? 'increase' : 'decrease'} />
            {Math.abs(change)}% {changeLabel}
          </StatHelpText>
        )}
      </Stat>
    </Box>
  );
};

interface KPICardsProps {
  role?: 'ADMIN' | 'MANAGER' | 'TECHNICIAN' | 'DRIVER';
}

export default function KPICards({ role = 'ADMIN' }: KPICardsProps) {
  // KPI-uri pentru diferite roluri
  const kpisByRole = {
    ADMIN: [
      {
        title: 'Utilizatori Activi',
        value: '345',
        icon: FiUsers,
        change: 23.36,
        changeLabel: 'față de luna trecută',
        description: 'Numărul total de utilizatori activi în sistem',
      },
      {
        title: 'Documente Procesate',
        value: '2,345',
        icon: FiFileText,
        change: 12.5,
        changeLabel: 'față de luna trecută',
        description: 'Numărul total de documente procesate în ultima lună',
      },
      {
        title: 'Vehicule Active',
        value: '12',
        icon: FiTruck,
        change: -5,
        changeLabel: 'față de luna trecută',
        description: 'Numărul de vehicule active în flotă',
      },
      {
        title: 'Evenimente Programate',
        value: '42',
        icon: FiCalendar,
        change: 15,
        changeLabel: 'față de luna trecută',
        description: 'Numărul total de evenimente programate pentru luna curentă',
      },
      {
        title: 'Stoc Materiale',
        value: '1,234',
        icon: FiPackage,
        change: 8,
        changeLabel: 'față de luna trecută',
        description: 'Numărul total de materiale în stoc',
      },
      {
        title: 'Alerte Active',
        value: '5',
        icon: FiAlertCircle,
        change: -20,
        changeLabel: 'față de luna trecută',
        description: 'Numărul de alerte active care necesită atenție',
      },
    ],
    MANAGER: [
      {
        title: 'Echipă Activă',
        value: '15',
        icon: FiUsers,
        change: 5,
        changeLabel: 'față de luna trecută',
        description: 'Membrii activi ai echipei',
      },
      {
        title: 'Sarcini în Desfășurare',
        value: '28',
        icon: FiFileText,
        change: 12.5,
        changeLabel: 'față de luna trecută',
        description: 'Sarcini curente ale echipei',
      },
      {
        title: 'Eficiență Echipă',
        value: '94%',
        icon: FiTruck,
        change: 3,
        changeLabel: 'față de luna trecută',
        description: 'Rata de finalizare a sarcinilor la timp',
      },
      {
        title: 'Programări Săptămâna Aceasta',
        value: '12',
        icon: FiCalendar,
        description: 'Evenimente programate pentru săptămâna curentă',
      },
    ],
    TECHNICIAN: [
      {
        title: 'Sarcini Asignate',
        value: '8',
        icon: FiFileText,
        description: 'Sarcini asignate pentru astăzi',
      },
      {
        title: 'Inspecții Planificate',
        value: '5',
        icon: FiTruck,
        description: 'Inspecții planificate pentru săptămâna curentă',
      },
      {
        title: 'Documente de Procesat',
        value: '15',
        icon: FiFileText,
        description: 'Documente care necesită procesare',
      },
    ],
    DRIVER: [
      {
        title: 'Curse Programate',
        value: '3',
        icon: FiTruck,
        description: 'Curse programate pentru astăzi',
      },
      {
        title: 'Kilometri Parcurși',
        value: '234',
        icon: FiTruck,
        change: 15,
        changeLabel: 'față de ieri',
        description: 'Kilometri parcurși în ultima zi',
      },
      {
        title: 'Următoarea Destinație',
        value: 'Spital Județean',
        icon: FiCalendar,
        description: 'Următoarea destinație programată',
      },
    ],
  };

  const selectedKPIs = kpisByRole[role] || kpisByRole.ADMIN;

  return (
    <SimpleGrid
      columns={{ base: 1, md: 2, lg: 3 }}
      spacing={{ base: 5, lg: 8 }}
    >
      {selectedKPIs.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </SimpleGrid>
  );
} 