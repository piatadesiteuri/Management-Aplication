import {
  Box,
  useColorModeValue,
  Text,
  Select,
  HStack,
  Card,
  CardBody,
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useState } from 'react';

// Date simulate pentru grafic
const data = [
  { name: 'Ian', inspectii: 40, deplasari: 24, sedinte: 15 },
  { name: 'Feb', inspectii: 30, deplasari: 28, sedinte: 18 },
  { name: 'Mar', inspectii: 45, deplasari: 32, sedinte: 22 },
  { name: 'Apr', inspectii: 50, deplasari: 35, sedinte: 20 },
  { name: 'Mai', inspectii: 55, deplasari: 30, sedinte: 25 },
  { name: 'Iun', inspectii: 48, deplasari: 38, sedinte: 28 },
];

const timeRanges = [
  { value: '6m', label: 'Ultimele 6 luni' },
  { value: '1y', label: 'Ultimul an' },
  { value: '2y', label: 'Ultimii 2 ani' },
];

export default function StatisticsChart() {
  const [timeRange, setTimeRange] = useState('6m');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const bgColor = useColorModeValue('white', 'gray.800');

  return (
    <Card
      bg={bgColor}
      shadow="xl"
      borderRadius="xl"
      border="1px solid"
      borderColor={borderColor}
      overflow="hidden"
    >
      <CardBody>
        <HStack justify="space-between" mb={6}>
          <Text fontSize="lg" fontWeight="medium" color={textColor}>
            Statistici Activități
          </Text>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            width="200px"
            size="sm"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </Select>
        </HStack>

        <Box height="400px">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
              <XAxis
                dataKey="name"
                stroke={textColor}
                tick={{ fill: textColor }}
              />
              <YAxis stroke={textColor} tick={{ fill: textColor }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: bgColor,
                  border: `1px solid ${borderColor}`,
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="inspectii"
                stroke="#3182CE"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="deplasari"
                stroke="#38A169"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="sedinte"
                stroke="#DD6B20"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardBody>
    </Card>
  );
} 