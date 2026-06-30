import { Box, Container, VStack, Heading } from '@chakra-ui/react';
import UserManagement from '../components/admin/UserManagement';

export default function TestUsers() {
  return (
    <Container maxW="full" py={8}>
      <VStack spacing={8}>
        <Heading size="lg">Test Utilizatori</Heading>
        <Box w="full">
          <UserManagement />
        </Box>
      </VStack>
    </Container>
  );
} 