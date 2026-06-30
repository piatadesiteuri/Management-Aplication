import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Icon,
  useColorModeValue,
  Badge,
  SimpleGrid,
} from '@chakra-ui/react';
import { FiTruck, FiUsers, FiPackage, FiCalendar } from 'react-icons/fi';
import { EventCategoryType } from '../../types/calendar';

interface EventTypeSelectorProps {
  selectedCategory: EventCategoryType | null;
  onCategorySelect: (category: EventCategoryType) => void;
}

export default function EventTypeSelector({
  selectedCategory,
  onCategorySelect,
}: EventTypeSelectorProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const selectedBorder = useColorModeValue('blue.300', 'blue.600');

  const eventCategories = [
    {
      type: 'TRANSPORT' as EventCategoryType,
      title: 'Transport & Aprovizionare',
      description: 'Evenimente pentru livrări, comenzi și aprovizionare cu produse',
      icon: FiTruck,
      color: 'green',
      features: [
        'Comandă produse de la furnizori',
        'Programare livrări',
        'Tracking status transport',
        'Actualizare automată stoc',
        'Reminders pentru întârzieri'
      ]
    },
    {
      type: 'OPERATIONAL' as EventCategoryType,
      title: 'Evenimente Operaționale',
      description: 'Evenimente normale cu personal, vehicule și activități DSP',
      icon: FiUsers,
      color: 'blue',
      features: [
        'Asignare personal',
        'Rezervare vehicule',
        'Inspecții și controale',
        'Ședințe și training-uri',
        'Activități administrative'
      ]
    }
  ];

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Box textAlign="center" mb={4}>
          <Heading size="lg" mb={2}>
            <Icon as={FiCalendar} mr={3} color="teal.500" />
            Selectează Tipul de Eveniment
          </Heading>
          <Text color="gray.500" fontSize="md">
            Alege categoria potrivită pentru a personaliza formularul
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {eventCategories.map((category) => (
            <Card
              key={category.type}
              variant="outline"
              cursor="pointer"
              borderWidth="2px"
              borderColor={
                selectedCategory === category.type 
                  ? selectedBorder 
                  : borderColor
              }
              bg={
                selectedCategory === category.type 
                  ? selectedBg 
                  : bgColor
              }
              _hover={{
                borderColor: selectedBorder,
                bg: selectedBg,
                transform: 'translateY(-2px)',
                shadow: 'lg'
              }}
              transition="all 0.3s ease"
              onClick={() => onCategorySelect(category.type)}
            >
              <CardHeader pb={3}>
                <VStack spacing={3} align="center">
                  <Box
                    p={4}
                    borderRadius="full"
                    bg={`${category.color}.100`}
                    color={`${category.color}.600`}
                  >
                    <Icon as={category.icon} boxSize={8} />
                  </Box>
                  <VStack spacing={1} textAlign="center">
                    <Heading size="md">{category.title}</Heading>
                    <Text fontSize="sm" color="gray.500">
                      {category.description}
                    </Text>
                  </VStack>
                  {selectedCategory === category.type && (
                    <Badge colorScheme={category.color} size="lg" px={3} py={1}>
                      Selectat
                    </Badge>
                  )}
                </VStack>
              </CardHeader>

              <CardBody pt={0}>
                <VStack spacing={2} align="stretch">
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                    Funcționalități:
                  </Text>
                  {category.features.map((feature, index) => (
                    <HStack key={index} spacing={2}>
                      <Icon 
                        as={FiPackage} 
                        boxSize={3} 
                        color={`${category.color}.500`} 
                      />
                      <Text fontSize="xs" color="gray.600">
                        {feature}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  );
} 