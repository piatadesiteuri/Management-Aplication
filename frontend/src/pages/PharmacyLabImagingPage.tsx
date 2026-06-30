import { Box, Container, Heading, Text, VStack, Card, CardBody, SimpleGrid, Badge, useColorModeValue, Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
import { useMemo } from 'react';

export default function PharmacyLabImagingPage() {
  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');
  const mutedText = useColorModeValue('gray.600', 'gray.400');

  const modules = useMemo(() => [
    {
      id: 'pharmacy',
      title: 'Management farmacie',
      description: 'Gestionarea stocurilor de medicamente, prescripții electronice, dispensare, urmărire consumuri, interacțiuni medicamentoase',
      features: [
        'Stocuri și inventar medicamente',
        'Prescripții electronice și dispensare',
        'Monitorizare consumuri pe pacient',
        'Verificare interacțiuni medicamentoase',
        'Raportare reacții adverse',
      ],
      color: 'blue',
    },
    {
      id: 'laboratory',
      title: 'Management laborator',
      description: 'Gestionarea analizelor de laborator, rezultate, integrare cu LIS, raportare rezultate către modulele clinice',
      features: [
        'Gestionare comenzi analize',
        'Rezultate laborator (biochimie, microbiologie, bacteriologie, genetică)',
        'Integrare LIS (Laboratory Information System)',
        'Raportare automată către modulele clinice',
        'Explorări funcționale respiratorii, bronologie',
      ],
      color: 'green',
    },
    {
      id: 'imaging',
      title: 'Imagistică medicală',
      description: 'Gestionarea investigațiilor imagistice, rezultate radiologice, integrare cu RIS/PACS, vizualizare imagini',
      features: [
        'Gestionare comenzi imagistică',
        'Rezultate radiologice și imagistică',
        'Integrare RIS/PACS (Radiology Information System / Picture Archiving and Communication System)',
        'Vizualizare imagini medicale',
        'Raportare către modulele clinice',
      ],
      color: 'purple',
    },
  ], []);

  return (
    <Container maxW="7xl" py={8}>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="lg" mb={2}>Aplicația de management farmacie, laborator și imagistică medicală</Heading>
          <Text color={mutedText}>
            Gestionarea integrată a farmaciei, laboratorului și serviciilor de imagistică medicală
          </Text>
        </Box>

        <Tabs colorScheme="blue" variant="enclosed">
          <TabList>
            {modules.map((module) => (
              <Tab key={module.id}>{module.title}</Tab>
            ))}
          </TabList>

          <TabPanels>
            {modules.map((module) => (
              <TabPanel key={module.id} px={0}>
                <Card bg={bg} border="1px solid" borderColor={border} borderRadius="xl">
                  <CardBody>
                    <VStack align="stretch" spacing={4}>
                      <Box>
                        <Badge colorScheme={module.color} mb={2}>{module.title}</Badge>
                        <Text fontSize="sm" color={mutedText} mt={2}>{module.description}</Text>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" mb={2}>Funcționalități:</Text>
                        <VStack align="stretch" spacing={2}>
                          {module.features.map((feature, idx) => (
                            <Text key={idx} fontSize="sm" color={mutedText}>
                              • {feature}
                            </Text>
                          ))}
                        </VStack>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>

        <Card bg={bg} border="1px solid" borderColor={border} borderRadius="xl">
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <Heading size="md">Integrare și interoperabilitate</Heading>
              <Text color={mutedText} fontSize="sm">
                • Integrare cu modulele clinice pentru prescripții și comenzi<br />
                • Interoperabilitate cu sisteme externe (LIS, RIS, PACS)<br />
                • Raportare automată către modulele de management al pacienților<br />
                • Gestionarea fluxurilor de date între farmacie, laborator și imagistică<br />
                • Standarde HL7/FHIR pentru schimb de date medicale
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={bg} border="1px solid" borderColor={border} borderRadius="xl">
          <CardBody>
            <Text fontSize="sm" color={mutedText} fontStyle="italic">
              Modul în dezvoltare. Implementarea completă va include integrare cu sisteme externe (LIS, RIS, PACS), gestionare stocuri, prescripții electronice și raportare automată.
            </Text>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}

