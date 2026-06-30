import { Box, SimpleGrid, Text, Card, CardBody, Stat, StatLabel, StatNumber, StatHelpText } from '@chakra-ui/react';

export default function AdminDashboard() {
    return (
        <Box maxW="7xl" mx="auto" px={{ base: '4', md: '8', lg: '12' }} py={{ base: '6', md: '8', lg: '12' }}>
            <Text fontSize="2xl" fontWeight="bold" mb={6}>
                Panou de Administrare
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: '5', lg: '8' }}>
                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Utilizatori Activi</StatLabel>
                            <StatNumber>45</StatNumber>
                            <StatHelpText>Din 50 total</StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Manageri</StatLabel>
                            <StatNumber>8</StatNumber>
                            <StatHelpText>3 online</StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Operatori</StatLabel>
                            <StatNumber>32</StatNumber>
                            <StatHelpText>15 online</StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>
            </SimpleGrid>
        </Box>
    );
} 