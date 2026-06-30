import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import api from '../services/api';

type LinkedPatient = {
  id: number;
  first_name: string;
  last_name: string;
  identity_type: string;
  identity_number: string;
  insurance_status_current: string;
  relationship?: 'SELF' | 'CAREGIVER';
  relationship_label?: string | null;
  current_episode_status?: string | null;
  department_name?: string | null;
  ward?: string | null;
  room?: string | null;
  floor?: string | null;
  attending_doctor_name?: string | null;
  attending_doctor_phone?: string | null;
};

export default function PatientPortalPage() {
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');
  // IMPORTANT: nu apelăm hooks (useColorModeValue) în JSX; folosim variabile pre-calculate
  const mutedText = useColorModeValue('gray.600', 'gray.400');

  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const selectedPatient = useMemo(
    () => (selectedPatientId ? patients.find(p => p.id === selectedPatientId) || null : null),
    [patients, selectedPatientId]
  );

  const [dossier, setDossier] = useState<any | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  // Link forms (MVP demo)
  const [linkIdentityType, setLinkIdentityType] = useState<'CNP' | 'PASAPORT' | 'TEMPORAR'>('CNP');
  const [linkIdentityNumber, setLinkIdentityNumber] = useState('');
  const [caregiverCnp, setCaregiverCnp] = useState('');
  const [caregiverLabel, setCaregiverLabel] = useState('Aparținător');

  // Scheduling (self-service)
  const [resources, setResources] = useState<any[]>([]);
  const [serviceType, setServiceType] = useState<'AMBULATORIU' | 'LABORATOR' | 'IMAGISTICA'>('AMBULATORIU');
  const [resourceId, setResourceId] = useState<number | ''>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Messaging
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [threadDetails, setThreadDetails] = useState<any | null>(null);
  const [newSubject, setNewSubject] = useState('Întrebare');
  const [newMessage, setNewMessage] = useState('');
  const [reply, setReply] = useState('');

  const loadMyPatients = async () => {
    const res = await api.get('/portal/patients');
    const list = res.data?.patients || [];
    setPatients(list);
    if (!selectedPatientId && list.length > 0) setSelectedPatientId(list[0].id);
  };

  const loadResources = async () => {
    const res = await api.get('/portal/resources', { params: { isActive: 1 } });
    setResources(res.data?.resources || []);
  };

  const loadDossier = async (patientId: number) => {
    try {
      setLoadingDossier(true);
      const res = await api.get(`/portal/patients/${patientId}/dossier`);
      setDossier(res.data);
    } finally {
      setLoadingDossier(false);
    }
  };

  const loadThreads = async (patientId: number) => {
    const res = await api.get(`/portal/patients/${patientId}/messages`);
    setThreads(res.data?.threads || []);
  };

  const loadThread = async (threadId: number) => {
    const res = await api.get(`/portal/threads/${threadId}`);
    setThreadDetails(res.data);
  };

  useEffect(() => {
    void loadMyPatients();
    void loadResources();
  }, []);

  useEffect(() => {
    if (!selectedPatientId) return;
    void loadDossier(selectedPatientId);
    void loadThreads(selectedPatientId);
    setSelectedThreadId(null);
    setThreadDetails(null);
  }, [selectedPatientId]);

  useEffect(() => {
    if (!selectedThreadId) return;
    void loadThread(selectedThreadId);
  }, [selectedThreadId]);

  const doSelfLink = async () => {
    try {
      await api.post('/portal/self-link', { identityType: linkIdentityType, identityNumber: linkIdentityNumber });
      toast({ title: 'Succes', description: 'Contul a fost asociat cu pacientul.', status: 'success', duration: 2500, isClosable: true });
      setLinkIdentityNumber('');
      await loadMyPatients();
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut face asocierea.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const doCaregiverLink = async () => {
    try {
      await api.post('/portal/caregiver-link', { patientIdentityType: 'CNP', patientIdentityNumber: caregiverCnp, relationshipLabel: caregiverLabel });
      toast({ title: 'Succes', description: 'A fost adăugat acces de aparținător.', status: 'success', duration: 2500, isClosable: true });
      setCaregiverCnp('');
      await loadMyPatients();
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut adăuga accesul.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const createAppointment = async () => {
    if (!selectedPatientId) return;
    if (typeof resourceId !== 'number') {
      toast({ title: 'Eroare', description: 'Alege resursa.', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    try {
      await api.post(`/portal/patients/${selectedPatientId}/appointments`, {
        serviceType,
        resourceId,
        startTime,
        endTime,
      });
      toast({ title: 'Succes', description: 'Programarea a fost creată.', status: 'success', duration: 2500, isClosable: true });
      setStartTime(''); setEndTime('');
      await loadDossier(selectedPatientId);
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut crea programarea.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const sendNewThread = async () => {
    if (!selectedPatientId) return;
    if (!newSubject.trim() || !newMessage.trim()) return;
    try {
      const res = await api.post(`/portal/patients/${selectedPatientId}/messages`, {
        subject: newSubject,
        message: newMessage,
      });
      toast({ title: 'Trimis', description: 'Mesaj trimis către unitatea sanitară.', status: 'success', duration: 2500, isClosable: true });
      setNewMessage('');
      await loadThreads(selectedPatientId);
      setSelectedThreadId(res.data?.threadId || null);
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut trimite mesajul.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const replyToThread = async () => {
    if (!selectedThreadId || !reply.trim()) return;
    try {
      await api.post(`/portal/threads/${selectedThreadId}/messages`, { message: reply });
      setReply('');
      await loadThread(selectedThreadId);
      if (selectedPatientId) await loadThreads(selectedPatientId);
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut trimite răspunsul.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  return (
    <Container maxW="7xl" py={8}>
      <HStack justify="space-between" mb={6}>
        <Box>
          <Heading size="lg">Portal pacienți / aparținători</Heading>
          <Text color={mutedText}>
            Dosar pacient · Programări online · Comunicare · Documente medicale
          </Text>
        </Box>
        <Button variant="outline" onClick={loadMyPatients}>Reîmprospătează</Button>
      </HStack>

      {patients.length === 0 && (
        <Card bg={bg} border="1px solid" borderColor={border} borderRadius="xl" mb={6}>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <Text fontWeight="bold">Nu ai încă pacienți asociați</Text>
              <Text color={mutedText} fontSize="sm">
                MVP demo: poți asocia contul cu un pacient pe baza CNP-ului (în producție ar fi validare/consimțământ).
              </Text>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box>
                  <Text fontWeight="bold" mb={2}>Sunt pacient (self-link)</Text>
                  <FormControl>
                    <FormLabel>Tip</FormLabel>
                    <Select value={linkIdentityType} onChange={(e) => setLinkIdentityType(e.target.value as any)}>
                      <option value="CNP">CNP</option>
                      <option value="PASAPORT">Pașaport</option>
                      <option value="TEMPORAR">Temporar</option>
                    </Select>
                  </FormControl>
                  <FormControl mt={2}>
                    <FormLabel>Număr</FormLabel>
                    <Input value={linkIdentityNumber} onChange={(e) => setLinkIdentityNumber(e.target.value)} />
                  </FormControl>
                  <Button mt={3} colorScheme="blue" onClick={doSelfLink}>Asociază</Button>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>Sunt aparținător</Text>
                  <FormControl>
                    <FormLabel>CNP pacient</FormLabel>
                    <Input value={caregiverCnp} onChange={(e) => setCaregiverCnp(e.target.value)} />
                  </FormControl>
                  <FormControl mt={2}>
                    <FormLabel>Calitate</FormLabel>
                    <Input value={caregiverLabel} onChange={(e) => setCaregiverLabel(e.target.value)} />
                  </FormControl>
                  <Button mt={3} variant="outline" onClick={doCaregiverLink}>Adaugă acces</Button>
                </Box>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>
      )}

      {patients.length > 0 && (
        <Card bg={bg} border="1px solid" borderColor={border} borderRadius="xl" mb={6}>
          <CardBody>
            <HStack justify="space-between" flexWrap="wrap" gap={3}>
              <Box>
                <Text fontWeight="bold">Pacient</Text>
                <Select
                  mt={2}
                  value={selectedPatientId ?? ''}
                  onChange={(e) => setSelectedPatientId(e.target.value ? Number(e.target.value) : null)}
                  w={{ base: 'full', md: '520px' }}
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.last_name} {p.first_name} — {p.identity_type} {p.identity_number}
                    </option>
                  ))}
                </Select>
              </Box>
              <Box textAlign={{ base: 'left', md: 'right' }}>
                <Text fontSize="sm" color={mutedText}>Acces</Text>
                <HStack justify={{ base: 'flex-start', md: 'flex-end' }}>
                  <Badge>{selectedPatient?.relationship || 'SELF'}</Badge>
                  {selectedPatient?.relationship_label && <Badge variant="outline">{selectedPatient.relationship_label}</Badge>}
                  <Badge colorScheme={selectedPatient?.insurance_status_current === 'ASIGURAT' ? 'green' : 'gray'}>
                    {selectedPatient?.insurance_status_current || 'NECLAR'}
                  </Badge>
                </HStack>
              </Box>
            </HStack>
          </CardBody>
        </Card>
      )}

      {patients.length > 0 && (
        <Tabs variant="enclosed">
          <TabList>
            <Tab>Dosar</Tab>
            <Tab>Programări</Tab>
            <Tab>Comunicare</Tab>
            <Tab>Documente</Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0} pt={4}>
              <Card bg={bg} border="1px solid" borderColor={border} borderRadius="xl">
                <CardBody>
                  {loadingDossier ? (
                    <Text color={mutedText}>Se încarcă...</Text>
                  ) : (
                    <VStack align="stretch" spacing={5}>
                      <Box>
                        <Text fontWeight="bold">Date personale</Text>
                        <Text color={mutedText}>
                          {(dossier?.patient?.last_name || '-') + ' ' + (dossier?.patient?.first_name || '-')}
                          {' · '}
                          {(dossier?.patient?.identity_type || '-') + ' ' + (dossier?.patient?.identity_number || '-')}
                        </Text>
                      </Box>

                      <Divider />

                      <Box>
                        <Text fontWeight="bold">Informații utile pentru aparținători</Text>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mt={2}>
                          <Box>
                            <Text fontSize="sm" color={mutedText}>Secția / structura</Text>
                            <Text>{selectedPatient?.department_name || '-'}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color={mutedText}>Stare (episod curent)</Text>
                            <Text>{selectedPatient?.current_episode_status || '-'}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color={mutedText}>Etaj / salon</Text>
                            <Text>{[selectedPatient?.floor, selectedPatient?.room].filter(Boolean).join(' / ') || '-'}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color={mutedText}>Medic curant</Text>
                            <Text>{selectedPatient?.attending_doctor_name || '-'}</Text>
                            <Text fontSize="sm" color={mutedText}>{selectedPatient?.attending_doctor_phone || ''}</Text>
                          </Box>
                        </SimpleGrid>
                      </Box>

                      <Divider />

                      <Box>
                        <Text fontWeight="bold">Evenimente medicale (internări/vizite)</Text>
                        <TableContainer mt={2} maxH="260px" overflowY="auto" border="1px solid" borderColor={border} borderRadius="lg">
                          <Table size="sm">
                            <Thead position="sticky" top={0} bg={bg} zIndex={1}>
                              <Tr>
                                <Th>Tip</Th>
                                <Th>Stare</Th>
                                <Th>Structură</Th>
                                <Th>Perioadă</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {(dossier?.episodes || []).map((e: any) => (
                                <Tr key={e.id}>
                                  <Td><Badge>{e.type}</Badge></Td>
                                  <Td><Badge variant="outline">{e.status}</Badge></Td>
                                  <Td>{e.department_name || '-'}</Td>
                                  <Td>{(e.start_date ? new Date(e.start_date).toLocaleString('ro-RO') : '-') + ' → ' + (e.end_date ? new Date(e.end_date).toLocaleString('ro-RO') : '-')}</Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </VStack>
                  )}
                </CardBody>
              </Card>
            </TabPanel>

            <TabPanel px={0} pt={4}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                <Card bg={bg} border="1px solid" borderColor={border} borderRadius="xl">
                  <CardBody>
                    <Text fontWeight="bold">Programare online (self-service)</Text>
                    <Text fontSize="sm" color={mutedText}>
                      Rezervare interval într-o resursă medicală (medic/cabinet/echipament)
                    </Text>
                    <VStack align="stretch" spacing={3} mt={4}>
                      <FormControl>
                        <FormLabel>Tip serviciu</FormLabel>
                        <Select value={serviceType} onChange={(e) => setServiceType(e.target.value as any)}>
                          <option value="AMBULATORIU">Ambulatoriu</option>
                          <option value="LABORATOR">Laborator</option>
                          <option value="IMAGISTICA">Imagistică</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Resursă</FormLabel>
                        <Select value={resourceId} onChange={(e) => setResourceId(e.target.value ? Number(e.target.value) : '')} placeholder="Alege resursă">
                          {resources.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.name} ({r.type}) {r.department_name ? `— ${r.department_name}` : ''}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        <FormControl>
                          <FormLabel>Start</FormLabel>
                          <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                        </FormControl>
                        <FormControl>
                          <FormLabel>End</FormLabel>
                          <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                        </FormControl>
                      </SimpleGrid>
                      <Button colorScheme="blue" onClick={createAppointment}>Trimite programarea</Button>
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={bg} border="1px solid" borderColor={border} borderRadius="xl">
                  <CardBody>
                    <Text fontWeight="bold">Programări existente</Text>
                    <TableContainer mt={3} maxH="420px" overflowY="auto" border="1px solid" borderColor={border} borderRadius="lg">
                      <Table size="sm">
                        <Thead position="sticky" top={0} bg={bg} zIndex={1}>
                          <Tr>
                            <Th>Serviciu</Th>
                            <Th>Resursă</Th>
                            <Th>Interval</Th>
                            <Th>Status</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {(dossier?.appointments || []).map((a: any) => (
                            <Tr key={a.id}>
                              <Td><Badge>{a.service_type}</Badge></Td>
                              <Td>{a.resource_name} ({a.resource_type})</Td>
                              <Td>{new Date(a.start_time).toLocaleString('ro-RO')} → {new Date(a.end_time).toLocaleString('ro-RO')}</Td>
                              <Td><Badge variant="outline">{a.status}</Badge></Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>

            <TabPanel px={0} pt={4}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                <Card bg={bg} border="1px solid" borderColor={border} borderRadius="xl">
                  <CardBody>
                    <Text fontWeight="bold">Conversații</Text>
                    <Text fontSize="sm" color={mutedText}>
                      Comunicare bidirecțională cu personalul unității sanitare
                    </Text>
                    <VStack align="stretch" spacing={3} mt={4}>
                      <FormControl>
                        <FormLabel>Subiect</FormLabel>
                        <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Mesaj</FormLabel>
                        <Textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Scrie mesajul..." />
                      </FormControl>
                      <Button colorScheme="blue" onClick={sendNewThread}>Trimite mesaj</Button>

                      <Divider />

                      <Text fontWeight="bold">Istoric conversații</Text>
                      <Select placeholder="Alege conversație" value={selectedThreadId ?? ''} onChange={(e) => setSelectedThreadId(e.target.value ? Number(e.target.value) : null)}>
                        {threads.map(t => (
                          <option key={t.id} value={t.id}>
                            #{t.id} — {t.subject}
                          </option>
                        ))}
                      </Select>
                      {threads.length === 0 && <Text color={mutedText}>Nu există conversații.</Text>}
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={bg} border="1px solid" borderColor={border} borderRadius="xl">
                  <CardBody>
                    <Text fontWeight="bold">Mesaje</Text>
                    {!threadDetails ? (
                      <Text mt={2} color={mutedText}>Alege o conversație ca să vezi mesajele.</Text>
                    ) : (
                      <VStack align="stretch" spacing={3} mt={3}>
                        <Box border="1px solid" borderColor={border} borderRadius="lg" p={3} maxH="300px" overflowY="auto">
                          {(threadDetails.messages || []).map((m: any) => (
                            <Box key={m.id} mb={3}>
                              <HStack justify="space-between">
                                <Badge>{m.sender_type}</Badge>
                                <Text fontSize="xs" color={mutedText}>
                                  {new Date(m.created_at).toLocaleString('ro-RO')}
                                </Text>
                              </HStack>
                              <Text mt={1}>{m.message}</Text>
                            </Box>
                          ))}
                        </Box>
                        <FormControl>
                          <FormLabel>Răspuns</FormLabel>
                          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Scrie răspuns..." />
                        </FormControl>
                        <Button variant="outline" onClick={replyToThread}>Trimite</Button>
                      </VStack>
                    )}
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>

            <TabPanel px={0} pt={4}>
              <Card bg={bg} border="1px solid" borderColor={border} borderRadius="xl">
                <CardBody>
                  <Text fontWeight="bold">Arhivă electronică documente medicale</Text>
                  <Text fontSize="sm" color={mutedText}>
                    Documente medicale asociate pacientului (MVP: listare). 
                  </Text>

                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mt={4}>
                    <Box>
                      <Text fontWeight="bold" mb={2}>Documente medicale</Text>
                      <TableContainer maxH="320px" overflowY="auto" border="1px solid" borderColor={border} borderRadius="lg">
                        <Table size="sm">
                          <Thead position="sticky" top={0} bg={bg} zIndex={1}>
                            <Tr>
                              <Th>Categorie</Th>
                              <Th>Titlu</Th>
                              <Th>Creat</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {(dossier?.documents || []).map((d: any) => (
                              <Tr key={d.id}>
                                <Td><Badge>{d.category}</Badge></Td>
                                <Td>{d.title}</Td>
                                <Td>{new Date(d.created_at).toLocaleString('ro-RO')}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                      {(dossier?.documents || []).length === 0 && <Text mt={2} color={mutedText}>Nu există documente medicale.</Text>}
                    </Box>

                    <Box>
                      <Text fontWeight="bold" mb={2}>Acte identitate (scan)</Text>
                      <TableContainer maxH="320px" overflowY="auto" border="1px solid" borderColor={border} borderRadius="lg">
                        <Table size="sm">
                          <Thead position="sticky" top={0} bg={bg} zIndex={1}>
                            <Tr>
                              <Th>Tip</Th>
                              <Th>Fișier</Th>
                              <Th>Creat</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {(dossier?.identityDocuments || []).map((d: any) => (
                              <Tr key={d.id}>
                                <Td><Badge>{d.document_type}</Badge></Td>
                                <Td>{d.file_name}</Td>
                                <Td>{new Date(d.created_at).toLocaleString('ro-RO')}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                      {(dossier?.identityDocuments || []).length === 0 && <Text mt={2} color={mutedText}>Nu există acte încărcate.</Text>}
                    </Box>
                  </SimpleGrid>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Container>
  );
}


