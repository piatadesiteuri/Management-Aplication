import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Table,
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
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@chakra-ui/react';
import api from '../services/api';
import DepartmentService, { type Department } from '../services/DepartmentService';

type FlowType = 'WORKFLOW' | 'DOCUMENT' | 'INFORMATION';

type WorkflowDefinition = {
  id: number;
  code: string;
  name: string;
  flow_type: FlowType;
  process_key?: string | null;
  description?: string | null;
  is_active: 0 | 1;
  active_version_id?: number | null;
  active_version?: number | null;
};

type WorkflowVersion = {
  id: number;
  definition_id: number;
  version: number;
  is_active: 0 | 1;
  change_note?: string | null;
  created_at: string;
};

type WorkflowInstanceRow = {
  id: number;
  definition_id: number;
  version_id: number;
  status: 'ACTIVE' | 'WAITING_SIGNATURE' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  current_step_key: string | null;
  started_at: string;
  completed_at: string | null;
  definition_name: string;
  flow_type: FlowType;
  version: number;
  started_by_email?: string | null;
  started_by_first_name?: string | null;
  started_by_last_name?: string | null;
};

export default function WorkflowEnginePage() {
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');

  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>([]);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<number | ''>('');
  const selectedDefinition = useMemo(
    () => (typeof selectedDefinitionId === 'number' ? definitions.find(d => d.id === selectedDefinitionId) || null : null),
    [definitions, selectedDefinitionId]
  );

  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [instances, setInstances] = useState<WorkflowInstanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Create definition modal
  const [isCreateDefOpen, setIsCreateDefOpen] = useState(false);
  const [defCode, setDefCode] = useState('');
  const [defName, setDefName] = useState('');
  const [defType, setDefType] = useState<FlowType>('WORKFLOW');
  const [defProcessKey, setDefProcessKey] = useState('');
  const [defDescription, setDefDescription] = useState('');

  // Create version modal (template-first; JSON only for advanced)
  const [isCreateVerOpen, setIsCreateVerOpen] = useState(false);
  const [verChangeNote, setVerChangeNote] = useState('');
  const [verSchemaText, setVerSchemaText] = useState(() =>
    JSON.stringify(
      {
        name: 'Flux cerere (demo)',
        type: 'WORKFLOW',
        startStepKey: 'RECEIVED',
        steps: [
          { code: 'RECEIVED', label: 'Înregistrată', actor: 'INITIATOR', next: ['ASSIGNED'] },
          { code: 'ASSIGNED', label: 'Repartizată', actor: 'DEPARTAMENT', next: ['IN_PROGRESS'] },
          { code: 'IN_PROGRESS', label: 'În lucru', actor: 'DEPARTAMENT', next: ['FINALIZED'] },
          { code: 'FINALIZED', label: 'Finalizată', actor: 'SYSTEM', isEnd: true },
        ],
        rollback: { allowed: true, strategy: 'RETURN_TO_PREVIOUS' },
      },
      null,
      2
    )
  );
  const [showAdvancedJson, setShowAdvancedJson] = useState(false);

  // Start instance modal (NO JSON)
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [initiatorType, setInitiatorType] = useState<'PF' | 'PJ' | 'SALARIAT'>('SALARIAT');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [reasonText, setReasonText] = useState('Cerere concediu – demo');

  // Instance details modal (advance/rollback)
  const [isInstanceOpen, setIsInstanceOpen] = useState(false);
  const [instanceLoading, setInstanceLoading] = useState(false);
  const [instanceDetails, setInstanceDetails] = useState<any>(null);
  const [advanceComment, setAdvanceComment] = useState('');
  const [rollbackReason, setRollbackReason] = useState('');
  const [rollbackToHistoryId, setRollbackToHistoryId] = useState<number | ''>('');
  const [showAdvancedActions, setShowAdvancedActions] = useState(false);
  const [advanceToStep, setAdvanceToStep] = useState('');
  const [advanceAction, setAdvanceAction] = useState('');

  const normalizeFlowTypeLabel = (t: any) => {
    const v = String(t || '');
    if (v === 'WORK') return 'WORKFLOW';
    if (v === 'INFO') return 'INFORMATION';
    return v;
  };

  const flowTypeLabel = (t: any) => {
    const v = normalizeFlowTypeLabel(t);
    if (v === 'WORKFLOW') return 'Flux de lucru';
    if (v === 'DOCUMENT') return 'Flux de documente';
    if (v === 'INFORMATION') return 'Flux de informații';
    return v;
  };

  const parseSchema = (schema: any) => {
    if (!schema) return null;
    if (typeof schema === 'object') return schema;
    try { return JSON.parse(schema); } catch { return null; }
  };

  const currentStep = useMemo(() => {
    const inst = instanceDetails?.instance;
    if (!inst) return null;
    const schema = parseSchema(inst.schema_json);
    if (!schema) return null;
    const steps = Array.isArray(schema.steps) ? schema.steps : [];
    const key = inst.current_step_key;
    return steps.find((s: any) => s && (s.code === key || s.key === key)) || null;
  }, [instanceDetails]);

  const currentActions = useMemo(() => {
    const step = currentStep;
    if (!step) return [];
    if (Array.isArray(step.transitions) && step.transitions.length > 0) {
      return step.transitions
        .filter((t: any) => t && typeof t.action === 'string' && typeof t.to === 'string')
        .map((t: any) => ({ action: String(t.action).toUpperCase(), to: String(t.to) }));
    }
    if (Array.isArray(step.next) && step.next.length > 0) {
      return [{ action: 'CONTINUE', to: String(step.next[0]) }];
    }
    return [];
  }, [currentStep]);

  const actionButtonLabel = (action: string) => {
    const a = action.toUpperCase();
    if (a === 'SUBMIT') return 'Trimite';
    if (a === 'APPROVE') return 'Aprobă';
    if (a === 'REJECT') return 'Respinge';
    if (a === 'SIGNED') return 'Semnează';
    if (a === 'CONTINUE') return 'Continuă';
    return action;
  };

  const statusLabel = (s: string) => {
    const v = String(s || '').toUpperCase();
    if (v === 'ACTIVE') return 'Activ';
    if (v === 'WAITING_SIGNATURE') return 'Așteaptă semnarea';
    if (v === 'COMPLETED') return 'Finalizat';
    if (v === 'CANCELLED') return 'Anulat';
    if (v === 'FAILED') return 'Eșuat';
    return s;
  };

  const statusColor = (s: string) => {
    const v = String(s || '').toUpperCase();
    if (v === 'ACTIVE') return 'blue';
    if (v === 'WAITING_SIGNATURE') return 'orange';
    if (v === 'COMPLETED') return 'green';
    if (v === 'CANCELLED') return 'red';
    if (v === 'FAILED') return 'red';
    return 'gray';
  };

  const displayNote = (note: string | null | undefined) => {
    const n = (note || '').trim();
    if (!n) return '-';
    if (n === 'seed-defaults') return 'Exemple inițiale (create automat)';
    return n;
  };

  const stepDisplay = (stepKey: string | null | undefined, schema: any) => {
    if (!stepKey) return '-';
    const steps = Array.isArray(schema?.steps) ? schema.steps : [];
    const step = steps.find((s: any) => s && (s.code === stepKey || s.key === stepKey));
    return step?.label || step?.name ? `${stepKey} — ${step.label || step.name}` : stepKey;
  };

  const loadDefinitions = async () => {
    const res = await api.get('/workflow-engine/definitions');
    setDefinitions(res.data || []);
  };

  const loadVersions = async (definitionId: number) => {
    const res = await api.get(`/workflow-engine/definitions/${definitionId}/versions`);
    setVersions(res.data || []);
  };

  const loadInstances = async (definitionId?: number) => {
    const res = await api.get('/workflow-engine/instances', { params: definitionId ? { definitionId } : {} });
    setInstances(res.data || []);
  };

  const refreshAll = async () => {
    try {
      setLoading(true);
      await loadDefinitions();
      if (typeof selectedDefinitionId === 'number') {
        await loadVersions(selectedDefinitionId);
        await loadInstances(selectedDefinitionId);
      } else {
        await loadInstances();
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca datele motorului de flux.', status: 'error', duration: 4000, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const deps = await DepartmentService.getDepartments();
        setDepartments(deps || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    if (typeof selectedDefinitionId !== 'number') {
      setVersions([]);
      void loadInstances();
      return;
    }
    void loadVersions(selectedDefinitionId);
    void loadInstances(selectedDefinitionId);
  }, [selectedDefinitionId]);

  const seedDefaults = async () => {
    try {
      await api.post('/workflow-engine/admin/seed-defaults');
      toast({ title: 'Succes', description: 'Exemple create: Cerere concediu / Factură / Notificări (dacă lipseau).', status: 'success', duration: 2500, isClosable: true });
      await refreshAll();
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-au putut crea exemplele.', status: 'error', duration: 4000, isClosable: true });
    }
  };

  const createDefinition = async () => {
    try {
      await api.post('/workflow-engine/definitions', {
        code: defCode.trim(),
        name: defName.trim(),
        flow_type: defType,
        process_key: defProcessKey.trim() || null,
        description: defDescription.trim() || null,
      });
      setIsCreateDefOpen(false);
      setDefCode(''); setDefName(''); setDefProcessKey(''); setDefDescription('');
      toast({ title: 'Succes', description: 'Definiție creată.', status: 'success', duration: 2500, isClosable: true });
      await refreshAll();
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut crea definiția.', status: 'error', duration: 4000, isClosable: true });
    }
  };

  const createVersion = async () => {
    try {
      if (typeof selectedDefinitionId !== 'number') {
        toast({ title: 'Eroare', description: 'Selectează o definiție.', status: 'error', duration: 3000, isClosable: true });
        return;
      }
      const schema = JSON.parse(verSchemaText);
      await api.post(`/workflow-engine/definitions/${selectedDefinitionId}/versions`, {
        schema_json: schema,
        change_note: verChangeNote.trim() || null,
      });
      setIsCreateVerOpen(false);
      setVerChangeNote('');
      toast({ title: 'Succes', description: 'Versiune creată.', status: 'success', duration: 2500, isClosable: true });
      await loadVersions(selectedDefinitionId);
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Schema JSON invalidă / eroare creare versiune.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const activateVersion = async (versionId: number) => {
    try {
      if (typeof selectedDefinitionId !== 'number') return;
      await api.post(`/workflow-engine/definitions/${selectedDefinitionId}/versions/${versionId}/activate`);
      toast({ title: 'Succes', description: 'Versiune activată.', status: 'success', duration: 2500, isClosable: true });
      await refreshAll();
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut activa versiunea.', status: 'error', duration: 4000, isClosable: true });
    }
  };

  const startInstance = async () => {
    try {
      if (typeof selectedDefinitionId !== 'number') {
        toast({ title: 'Eroare', description: 'Selectează o definiție.', status: 'error', duration: 3000, isClosable: true });
        return;
      }
      const ctx: any = {
        initiatorType,
        priority,
        reason: reasonText,
      };
      if (typeof departmentId === 'number') ctx.departmentId = departmentId;
      await api.post('/workflow-engine/instances', { definitionId: selectedDefinitionId, context_json: ctx });
      setIsStartOpen(false);
      toast({ title: 'Succes', description: 'Instanță inițiată.', status: 'success', duration: 2500, isClosable: true });
      await loadInstances(selectedDefinitionId);
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut iniția instanța.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const openInstance = async (instanceId: number) => {
    try {
      setIsInstanceOpen(true);
      setInstanceLoading(true);
      const res = await api.get(`/workflow-engine/instances/${instanceId}`);
      setInstanceDetails(res.data);
      setAdvanceToStep('');
      setAdvanceAction('');
      setAdvanceComment('');
      setRollbackReason('');
      setRollbackToHistoryId('');
      setShowAdvancedActions(false);
    } catch (e) {
      console.error(e);
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca detaliile instanței.', status: 'error', duration: 4000, isClosable: true });
      setIsInstanceOpen(false);
    } finally {
      setInstanceLoading(false);
    }
  };

  const doAdvance = async () => {
    try {
      const instanceId = instanceDetails?.instance?.id;
      if (!instanceId) return;
      await api.post(`/workflow-engine/instances/${instanceId}/advance`, {
        to_step_key: advanceToStep.trim() || null,
        action: advanceAction.trim() || null,
        comment: advanceComment.trim() || null,
      });
      toast({ title: 'Succes', description: 'Instanță avansată.', status: 'success', duration: 2500, isClosable: true });
      await openInstance(instanceId);
      if (typeof selectedDefinitionId === 'number') await loadInstances(selectedDefinitionId);
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut avansa instanța.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const doRollback = async () => {
    try {
      const instanceId = instanceDetails?.instance?.id;
      if (!instanceId) return;
      if (!rollbackReason.trim()) {
        toast({ title: 'Eroare', description: 'Motivul revenirii este obligatoriu.', status: 'error', duration: 4000, isClosable: true });
        return;
      }
      await api.post(`/workflow-engine/instances/${instanceId}/rollback`, {
        to_history_id: typeof rollbackToHistoryId === 'number' ? rollbackToHistoryId : null,
        reason: rollbackReason.trim(),
      });
      toast({ title: 'Succes', description: 'Revenire controlată executată.', status: 'success', duration: 2500, isClosable: true });
      await openInstance(instanceId);
      if (typeof selectedDefinitionId === 'number') await loadInstances(selectedDefinitionId);
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut executa rollback.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  return (
    <Container maxW="7xl" py={8}>
      <HStack justify="space-between" mb={6}>
        <Box>
          <Heading size="lg">Motor de fluxuri</Heading>
          <Text color={useColorModeValue('gray.600', 'gray.400')}>
            Creezi un flux (ex: „Cerere concediu”), rulezi instanțe, aprobi/semnezi și poți face rollback controlat (cu motiv + istoric).
          </Text>
        </Box>
        <HStack>
          <Button variant="outline" onClick={seedDefaults}>Creează exemple (Concediu / Factură / Notificări)</Button>
          <Button variant="outline" onClick={refreshAll} isLoading={loading}>Reîmprospătează</Button>
          <Button colorScheme="blue" onClick={() => setIsCreateDefOpen(true)}>Flux nou</Button>
        </HStack>
      </HStack>

      <Box bg={bg} border="1px solid" borderColor={border} borderRadius="xl" p={5} mb={6}>
        <HStack justify="space-between" mb={4}>
          <HStack>
            <Text fontWeight="bold">Flux:</Text>
            <Select
              value={selectedDefinitionId}
              onChange={(e) => setSelectedDefinitionId(e.target.value ? Number(e.target.value) : '')}
              placeholder="Alege un flux (ex: Cerere concediu)"
              w="420px"
            >
              {definitions.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({flowTypeLabel(d.flow_type)}) {d.active_version ? `· v${d.active_version}` : ''}
                </option>
              ))}
            </Select>
          </HStack>
          <HStack>
            <Button
              variant="outline"
              isDisabled={!selectedDefinition}
              onClick={() => setIsCreateVerOpen(true)}
            >
              Versiune nouă (avansat)
            </Button>
            <Button
              colorScheme="blue"
              isDisabled={!selectedDefinition?.active_version_id}
              onClick={() => setIsStartOpen(true)}
            >
              Inițiază cerere
            </Button>
          </HStack>
        </HStack>

        {!selectedDefinition ? (
          <Text color={useColorModeValue('gray.600', 'gray.400')}>Alege o definiție ca să vezi versiuni și instanțe.</Text>
        ) : (
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontWeight="bold" mb={2}>Versiuni</Text>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>v</Th>
                    <Th>Stare</Th>
                    <Th>Observații</Th>
                    <Th>Acțiune</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {versions.map(v => (
                    <Tr key={v.id}>
                      <Td><Badge variant="outline">v{v.version}</Badge></Td>
                      <Td>{v.is_active ? <Badge colorScheme="green">Activă</Badge> : <Badge>Inactivă</Badge>}</Td>
                      <Td>{displayNote(v.change_note)}</Td>
                      <Td>
                        {v.is_active ? (
                          <Button size="sm" variant="outline" isDisabled>
                            Deja activă
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => activateVersion(v.id)}>
                            Activează
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              <Text mt={2} fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                Dacă o versiune este „Activă”, nu o mai poți activa încă o dată (de aceea butonul e dezactivat).
              </Text>
            </Box>

            <Divider />

            <Box>
              <Text fontWeight="bold" mb={2}>Instanțe (monitorizare)</Text>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>Status</Th>
                    <Th>Pas curent</Th>
                    <Th>Start</Th>
                    <Th>Inițiat de</Th>
                    <Th>Acțiuni</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {instances.map(i => (
                    <Tr key={i.id}>
                      <Td>#{i.id}</Td>
                      <Td><Badge colorScheme={statusColor(i.status)}>{statusLabel(i.status)}</Badge></Td>
                      <Td>{i.current_step_key || '-'}</Td>
                      <Td>{new Date(i.started_at).toLocaleString('ro-RO')}</Td>
                      <Td>{i.started_by_email || '-'}</Td>
                      <Td>
                        <Button size="sm" variant="outline" onClick={() => void openInstance(i.id)}>
                          Detalii
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </VStack>
        )}
      </Box>

      {/* Modal: create definition */}
      <Modal isOpen={isCreateDefOpen} onClose={() => setIsCreateDefOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Flux nou (ex: „Cerere concediu”)</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <FormControl>
                <FormLabel>Cod intern (unic)</FormLabel>
                <Input value={defCode} onChange={(e) => setDefCode(e.target.value)} placeholder="ex: WF-CONCEDIU" />
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                  Folosit intern pentru identificare; utilizatorii văd în principal „Nume”. (Exemple: WF-CONCEDIU, DOC-FACTURA)
                </Text>
              </FormControl>
              <FormControl>
                <FormLabel>Nume</FormLabel>
                <Input value={defName} onChange={(e) => setDefName(e.target.value)} placeholder="ex: Cerere concediu" />
              </FormControl>
              <HStack>
                <FormControl>
                  <FormLabel>Tip flux</FormLabel>
                  <Select value={defType} onChange={(e) => setDefType(e.target.value as FlowType)}>
                    <option value="WORKFLOW">Flux de lucru (workflow)</option>
                    <option value="DOCUMENT">Flux de documente</option>
                    <option value="INFORMATION">Flux de informații</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Proces (competență materială)</FormLabel>
                  <Input value={defProcessKey} onChange={(e) => setDefProcessKey(e.target.value)} placeholder="ex: CONCEDIU" />
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel>Descriere (opțional)</FormLabel>
                <Textarea value={defDescription} onChange={(e) => setDefDescription(e.target.value)} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} variant="ghost" onClick={() => setIsCreateDefOpen(false)}>Anulează</Button>
            <Button colorScheme="blue" onClick={createDefinition}>Creează</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: create version */}
      <Modal isOpen={isCreateVerOpen} onClose={() => setIsCreateVerOpen(false)} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Versiune nouă (avansat)</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <FormControl>
                <FormLabel>Notă modificare (opțional)</FormLabel>
                <Input value={verChangeNote} onChange={(e) => setVerChangeNote(e.target.value)} placeholder="ex: adăugat pas de semnare" />
              </FormControl>
              <Box border="1px solid" borderColor={border} borderRadius="md" p={3}>
                <Text fontWeight="bold" mb={2}>Pași (preview)</Text>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                  Pentru utilizatori non-tehnici recomandăm „Creează exemple” și apoi doar rulezi instanțe.
                </Text>
              </Box>
              <Button variant="outline" onClick={() => setShowAdvancedJson(v => !v)}>
                {showAdvancedJson ? 'Ascunde setări avansate' : 'Setări avansate (JSON)'}
              </Button>
              {showAdvancedJson && (
                <FormControl>
                  <FormLabel>Schema (JSON avansat)</FormLabel>
                  <Textarea value={verSchemaText} onChange={(e) => setVerSchemaText(e.target.value)} fontFamily="mono" minH="280px" />
                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                    Exemplu: pași cu <b>code</b>, <b>label</b>, <b>actor</b> și <b>transitions</b> (action→to).
                  </Text>
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} variant="ghost" onClick={() => setIsCreateVerOpen(false)}>Anulează</Button>
            <Button colorScheme="blue" onClick={createVersion}>Creează versiune</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: start instance */}
      <Modal isOpen={isStartOpen} onClose={() => setIsStartOpen(false)} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Inițiere cerere (instanță de flux)</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>Inițiator</FormLabel>
                  <Select value={initiatorType} onChange={(e) => setInitiatorType(e.target.value as any)}>
                    <option value="SALARIAT">Salariat</option>
                    <option value="PF">Persoană fizică</option>
                    <option value="PJ">Persoană juridică</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Structură (departament)</FormLabel>
                  <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')} placeholder="Alege departament">
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>Prioritate</FormLabel>
                <Select value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                  <option value="LOW">Scăzută</option>
                  <option value="MEDIUM">Medie</option>
                  <option value="HIGH">Ridicată</option>
                  <option value="CRITICAL">Critică</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Motiv / descriere</FormLabel>
                <Textarea value={reasonText} onChange={(e) => setReasonText(e.target.value)} />
              </FormControl>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                Sistemul atașează automat contextul instanței (fără să scrii JSON).
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} variant="ghost" onClick={() => setIsStartOpen(false)}>Anulează</Button>
            <Button colorScheme="blue" onClick={startInstance}>Inițiază</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: instance details */}
      <Modal isOpen={isInstanceOpen} onClose={() => setIsInstanceOpen(false)} size="5xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalii instanță (monitorizare + rollback)</ModalHeader>
          <ModalBody>
            {instanceLoading ? (
              <Text color="gray.500">Se încarcă...</Text>
            ) : !instanceDetails?.instance ? (
              <Text color="gray.500">Nu există date.</Text>
            ) : (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Heading size="sm">
                    #{instanceDetails.instance.id} · {instanceDetails.instance.definition_name} · v{instanceDetails.instance.version}
                  </Heading>
                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                    Status: <Badge colorScheme={statusColor(instanceDetails.instance.status)}>{statusLabel(instanceDetails.instance.status)}</Badge>
                    {' · '}
                    Pas curent: <Badge variant="outline">{stepDisplay(instanceDetails.instance.current_step_key, instanceDetails.instance.schema_json)}</Badge>
                  </Text>
                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                    Inițiat de: <b>{instanceDetails.instance.started_by_email || '-'}</b> · Start: <b>{new Date(instanceDetails.instance.started_at).toLocaleString('ro-RO')}</b>
                  </Text>
                </Box>

                <Divider />

                <HStack align="start" spacing={6}>
                  <Box flex="1">
                    <Text fontWeight="bold" mb={2}>Acțiuni (aprobare / semnare / continuare)</Text>
                    <VStack align="stretch" spacing={2}>
                      <Input placeholder="Observații (opțional)" value={advanceComment} onChange={(e) => setAdvanceComment(e.target.value)} />
                      <HStack wrap="wrap">
                        {currentActions.length === 0 ? (
                          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Nu există tranziții definite pentru pasul curent.</Text>
                        ) : (
                          currentActions.map((a: any) => (
                            <Button
                              key={`${a.action}-${a.to}`}
                              colorScheme={a.action === 'REJECT' ? 'red' : a.action === 'APPROVE' || a.action === 'SIGNED' ? 'green' : 'blue'}
                              variant={a.action === 'REJECT' ? 'outline' : 'solid'}
                              onClick={() => {
                                setAdvanceAction(a.action);
                                setAdvanceToStep(a.to);
                                void doAdvance();
                              }}
                            >
                              {actionButtonLabel(a.action)}
                            </Button>
                          ))
                        )}
                      </HStack>

                      <Button variant="outline" onClick={() => setShowAdvancedActions(v => !v)}>
                        {showAdvancedActions ? 'Ascunde setări avansate' : 'Setări avansate (pentru admin / IT)'}
                      </Button>
                      {showAdvancedActions && (
                        <>
                          <Input placeholder="Pas țintă (opțional) – ex: AVIZARE / SEMNARE" value={advanceToStep} onChange={(e) => setAdvanceToStep(e.target.value)} />
                          <Input placeholder="Acțiune (opțional) – ex: SUBMIT / APPROVE / REJECT / SIGNED" value={advanceAction} onChange={(e) => setAdvanceAction(e.target.value)} />
                          <Button variant="outline" onClick={doAdvance}>Execută (avansat)</Button>
                        </>
                      )}
                    </VStack>
                  </Box>

                  <Box flex="1">
                    <Text fontWeight="bold" mb={2}>Revenire controlată (rollback)</Text>
                    <VStack align="stretch" spacing={2}>
                      <Select
                        placeholder="Alege momentul la care revii (opțional)"
                        value={rollbackToHistoryId}
                        onChange={(e) => setRollbackToHistoryId(e.target.value ? Number(e.target.value) : '')}
                      >
                        {(instanceDetails.history || []).map((h: any) => (
                          <option key={h.id} value={h.id}>
                            #{h.id} · {h.action} · {h.to_step_key || '-'} · {new Date(h.performed_at).toLocaleString('ro-RO')}
                          </option>
                        ))}
                      </Select>
                      <Input placeholder="Motiv (obligatoriu) – ex: corecție decizie / document greșit" value={rollbackReason} onChange={(e) => setRollbackReason(e.target.value)} />
                      <Button variant="outline" onClick={doRollback}>Revino</Button>
                    </VStack>
                    <Text mt={2} fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                      Revenirea păstrează istoricul; nu șterge date. În audit rămâne cine a făcut revenirea și motivul.
                    </Text>
                  </Box>
                </HStack>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>Istoric (audit flux)</Text>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>ID</Th>
                        <Th>Acțiune</Th>
                        <Th>From</Th>
                        <Th>To</Th>
                        <Th>Utilizator</Th>
                        <Th>Motiv</Th>
                        <Th>Observații</Th>
                        <Th>Dată</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {(instanceDetails.history || []).map((h: any) => (
                        <Tr key={h.id}>
                          <Td>#{h.id}</Td>
                          <Td><Badge>{h.action}</Badge></Td>
                          <Td>{h.from_step_key || '-'}</Td>
                          <Td>{h.to_step_key || '-'}</Td>
                          <Td>{h.performed_by_email || '-'}</Td>
                          <Td>{h.reason || '-'}</Td>
                          <Td>{h.comment || '-'}</Td>
                          <Td>{new Date(h.performed_at).toLocaleString('ro-RO')}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setIsInstanceOpen(false)}>Închide</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}


