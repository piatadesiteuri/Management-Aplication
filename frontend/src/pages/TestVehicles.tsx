import { 
  Box, 
  Container, 
  Heading, 
  VStack,
  useColorModeValue,
  Icon,
  Text
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { FiTruck } from 'react-icons/fi';
import VehicleList from '../components/vehicles/VehicleList';

// Animații
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export default function TestVehicles() {
  const bg = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedText = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box bg={bg} minH="100vh" py={8}>
      <Container maxW="7xl">
        <VStack spacing={8} align="stretch">
          {/* Enhanced Header */}
          <Box
            animation={`${fadeInUp} 0.6s ease-out`}
            textAlign="center"
            py={8}
          >
            <VStack spacing={4}>
              <Box
                p={4}
                borderRadius="full"
                bgGradient="linear(to-r, blue.400, purple.500)"
                color="white"
                animation={`${pulse} 2s infinite`}
              >
                <Icon as={FiTruck} boxSize={8} />
              </Box>
              <Heading
                size="2xl"
                bgGradient="linear(to-r, blue.600, purple.600)"
                bgClip="text"
                fontWeight="bold"
              >
                Parc Auto
              </Heading>
              <Text fontSize="lg" color={mutedText} maxW="600px">
                Gestionează flota de vehicule cu eficiență maximă și monitorizare în timp real
              </Text>
            </VStack>
          </Box>
          
          {/* VehicleList Component */}
          <Box
            animation={`${fadeInUp} 0.8s ease-out`}
          >
            <VehicleList />
          </Box>
        </VStack>
      </Container>
    </Box>
  );
} 