import { Box, Link, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';

export default function Register() {
  return (
    <Box minH="100vh" bg="gray.50" py={8} px={4}>
      <RegisterForm />
      <Box textAlign="center" mt={4}>
        <Text>
          Ai deja cont?{' '}
          <Link as={RouterLink} to="/login" color="blue.500" fontWeight="semibold">
            Autentifică-te aici
          </Link>
        </Text>
      </Box>
    </Box>
  );
}
