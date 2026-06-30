import { Box, Container, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { SupplyService } from '../services/supply/SupplyService';
import SupplierList from '../components/supply/SupplierList';

export default function TestSuppliers() {
  const { user, isAuthenticated } = useAuth();
  const [testData, setTestData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const supplyService = new SupplyService();

  const testAPI = async () => {
    try {
      console.log('🧪 Testing suppliers API...');
      const response = await supplyService.getSuppliers(1, 10);
      console.log('✅ API Test successful:', response);
      setTestData(response);
      setError(null);
    } catch (err: any) {
      console.error('❌ API Test failed:', err);
      setError(err.message || 'Unknown error');
    }
  };

  useEffect(() => {
    console.log('🧪 TestSuppliers component mounted');
    console.log('🔐 Auth state:', { isAuthenticated, user: user?.email });
    if (isAuthenticated) {
      testAPI();
    }
  }, [isAuthenticated]);

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8}>
        <Heading size="lg">Test Furnizori - Gestiune Stocuri</Heading>
        
        {/* Debug Info */}
        <Box p={4} bg="blue.50" borderRadius="md" w="full">
          <Text fontSize="sm" mb={2}>🔍 Debug Information:</Text>
          <Text fontSize="xs">Authenticated: {isAuthenticated.toString()}</Text>
          <Text fontSize="xs">User: {user?.email || 'None'}</Text>
          <Text fontSize="xs">Token: {localStorage.getItem('jwt_token') ? 'Present' : 'Missing'}</Text>
          <Text fontSize="xs">Test Data: {testData ? `${testData.data?.length} suppliers` : 'None'}</Text>
          {error && <Text fontSize="xs" color="red.500">Error: {error}</Text>}
          <Button size="sm" mt={2} onClick={testAPI}>Test API</Button>
        </Box>
        
        <Box w="full">
          <SupplierList />
        </Box>
      </VStack>
    </Container>
  );
} 