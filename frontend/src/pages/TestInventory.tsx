import { Box, Container, VStack, Heading } from '@chakra-ui/react';
import InventoryList from '../components/supply/InventoryList';

export default function TestInventory() {
  return (
    <Container maxW="full" py={8}>
      <VStack spacing={8}>
        <Heading size="lg">Test Inventar</Heading>
        <Box w="full">
          <InventoryList />
        </Box>
      </VStack>
    </Container>
  );
} 