import { Box, Container, VStack, Heading } from '@chakra-ui/react';
import ProductList from '../components/supply/ProductList';

export default function TestProducts() {
  return (
    <Container maxW="full" py={8}>
      <VStack spacing={8}>
        <Heading size="lg">Test Produse</Heading>
        <Box w="full">
          <ProductList />
        </Box>
      </VStack>
    </Container>
  );
} 