import { Box, Container, Heading, useColorModeValue } from '@chakra-ui/react';
import Calendar from '../components/calendar/Calendar';

export default function CalendarPage() {
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  
  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="7xl">
        <Heading size="lg" mb={6}>
          Calendar Evenimente DSP Dolj
        </Heading>
        <Calendar />
      </Container>
    </Box>
  );
} 