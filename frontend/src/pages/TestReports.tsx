import { Box, Container, VStack, Heading } from '@chakra-ui/react';
import ReportsManagement from '../components/reports/ReportsManagement';

export default function TestReports() {
  return (
    <Container maxW="full" py={8}>
      <VStack spacing={8}>
        <Heading size="lg">Test Sistem Rapoarte</Heading>
        <Box w="full">
          <ReportsManagement />
        </Box>
      </VStack>
    </Container>
  );
} 