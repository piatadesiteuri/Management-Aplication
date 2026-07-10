import { useEffect, useState } from 'react';
import { Box, Button, Heading, HStack, Table, Thead, Tbody, Tr, Th, Td, Card, CardBody, useDisclosure, TableContainer } from '@chakra-ui/react';
import { useSearchParams } from 'react-router-dom';
import CreatePatientModal from '../components/patients/CreatePatientModal';
import api from '../services/api';

export default function PatientsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    loadPatients();
    
    // Verificăm o singură dată la încărcare, fără să îl punem în array-ul de dependențe
    if (searchParams.get('action') === 'add') {
      onOpen();
      // Curățăm URL-ul ca să nu rămână action=add
      setSearchParams({}); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const loadPatients = async () => {
    try {
      const response = await api.get('/patients');
      const data = response.data.patients || response.data.data || (Array.isArray(response.data) ? response.data : []);
      setPatients(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Box w="full">
      <HStack justify="space-between" mb={6}>
        <Heading size="lg" color="white">Registru Pacienți</Heading>
        <Button colorScheme="blue" onClick={onOpen}>+ Adaugă Pacient</Button>
      </HStack>

      <Card bg="gray.800" borderColor="gray.700" borderWidth="1px" color="white">
        <CardBody>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th color="gray.400">Nume Complet</Th>
                  <Th color="gray.400">Tip Act</Th>
                  <Th color="gray.400">CNP / Document</Th>
                  <Th color="gray.400">Sex</Th>
                </Tr>
              </Thead>
              <Tbody>
                {patients.map((p) => (
                  <Tr key={p.id}>
                    <Td fontWeight="bold">{p.last_name} {p.first_name}</Td>
                    <Td>{p.identity_type}</Td>
                    <Td>{p.identity_number}</Td>
                    <Td>{p.gender}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>

      <CreatePatientModal 
        isOpen={isOpen} 
        onClose={onClose} 
        onSuccess={loadPatients} 
      />
    </Box>
  );
}