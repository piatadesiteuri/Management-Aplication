import { Box, Container, VStack, Heading } from '@chakra-ui/react';
import SystemSettings from '../components/admin/SystemSettings';

export default function TestSettings() {
  return (
    <Container maxW="full" py={8}>
      <VStack spacing={8}>
        <Heading size="lg">Test Setări Sistem</Heading>
        <Box w="full">
          <SystemSettings />
        </Box>
      </VStack>
    </Container>
  );
} 