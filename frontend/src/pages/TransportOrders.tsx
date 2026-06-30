import { Box, Container, Heading, HStack, Icon, Text } from '@chakra-ui/react';
import { FiTruck } from 'react-icons/fi';
import TransportOrdersManagement from '../components/supply/TransportOrdersManagement';

export default function TransportOrders() {
  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <HStack spacing={4} mb={4}>
          <Icon as={FiTruck} boxSize={8} color="blue.500" />
          <Heading size="lg">Gestionare Comenzi de Transport</Heading>
        </HStack>
        <Text color="gray.600" fontSize="lg">
          Gestionează comenzile de transport și aprovizionare, finalizează livrările și adaugă produsele în inventar.
        </Text>
      </Box>
      
      <TransportOrdersManagement />
    </Container>
  );
} 