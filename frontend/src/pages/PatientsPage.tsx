import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Container,
  Card,
  CardBody,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Table,
  TableContainer,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  Wrap,
  WrapItem,
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
import DepartmentService, { type Department } from '../services/DepartmentService';
import { useAuth } from '../hooks/useAuth';

type Patient = {
  id: number;
  identity_type: 'CNP' | 'PASAPORT' | 'TEMPORAR';
  identity_number: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  gender: 'M' | 'F' | 'X' | 'UNKNOWN';
  insurance_status_current: 'ASIGURAT' | 'NEASIGURAT' | 'NECLAR';
  current_episode_status?: string | null;
  current_episode_type?: string | null;
  current_department_id?: number | null;
  current_department_name?: string | null;
  created_at: string;
};

type Episode = {
  id: number;
  patient_id: number;
  type: 'INTERNARE' | 'AMBULATORIU';
  status: 'PROGRAMAT' | 'INTERNAT' | 'EXTERNAT' | 'CANCELLED';
  department_id?: number | null;
  department_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
};

type InsuranceRow = {
  id: number;
  patient_id: number;
  status: 'ASIGURAT' | 'NEASIGURAT' | 'NECLAR';
  valid_from?: string | null;
  valid_to?: string | null;
  source?: string | null;
  created_at: string;
};

type Resource = {
  id: number;
  type: 'MEDIC' | 'EQUIPMENT' | 'CABINET';
  name: string;
  department_id?: number | null;
  department_name?: string | null;
};

type Appointment = {
  id: number;
  patient_id: number;
  episode_id?: number | null;
  service_type: 'AMBULATORIU' | 'LABORATOR' | 'IMAGISTICA';
  resource_id: number;
  start_time: string;
  end_time: string;
  status: 'SCHEDULED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  first_name: string;
  last_name: string;
  identity_type: string;
  identity_number: string;
  resource_name: string;
  resource_type: string;
  resource_department_name?: string | null;
};

type Observation = {
  id: number;
  patient_id: number;
  episode_id?: number | null;
  type: 'VITALS' | 'LAB_RESULT' | 'NOTE';
  value: string;
  recorded_at: string;
  recorded_by_email?: string | null;
  first_name: string;
  last_name: string;
};

type IdentityDocument = {
  id: number;
  patient_id: number;
  document_type: 'CI' | 'PASAPORT' | 'TEMPORAR' | 'ALTELE';
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
};

export default function PatientsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');

  const [departments, setDepartments] = useState<Department[]>([]);

  // Patients list
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const selectedPatient = useMemo(
    () => (selectedPatientId ? patients.find(p => p.id === selectedPatientId) || null : null),
    [patients, selectedPatientId]
  );

  // Patient details
  const [patientDetailsLoading, setPatientDetailsLoading] = useState(false);
  const [insuranceHistory, setInsuranceHistory] = useState<InsuranceRow[]>([]);
  const [patientEpisodes, setPatientEpisodes] = useState<Episode[]>([]);
  const [identityDocs, setIdentityDocs] = useState<IdentityDocument[]>([]);
  const [episodeTransfers, setEpisodeTransfers] = useState<any[]>([]);

  // Census
  const [censusStatus, setCensusStatus] = useState<'INTERNAT' | 'EXTERNAT' | 'PROGRAMAT' | ''>('');
  const [censusType, setCensusType] = useState<'INTERNARE' | 'AMBULATORIU' | ''>('');
  const [censusDepartmentId, setCensusDepartmentId] = useState<number | ''>('');
  const [censusEpisodes, setCensusEpisodes] = useState<any[]>([]);

  // Scheduling
  const [resources, setResources] = useState<Resource[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Monitoring
  const [observations, setObservations] = useState<Observation[]>([]);

  // Summary
  const [summary, setSummary] = useState<any | null>(null);

  // Modals
  const [isCreatePatientOpen, setIsCreatePatientOpen] = useState(false);
  const [newIdentityType, setNewIdentityType] = useState<'CNP' | 'PASAPORT' | 'TEMPORAR'>('CNP');
  const [newIdentityNumber, setNewIdentityNumber] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newGender, setNewGender] = useState<'M' | 'F' | 'X' | 'UNKNOWN'>('UNKNOWN');
  const [newAddress, setNewAddress] = useState('');
  const [newDocSeries, setNewDocSeries] = useState('');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  const [isInsuranceOpen, setIsInsuranceOpen] = useState(false);
  const [insStatus, setInsStatus] = useState<'ASIGURAT' | 'NEASIGURAT' | 'NECLAR'>('NECLAR');
  const [insValidFrom, setInsValidFrom] = useState('');
  const [insValidTo, setInsValidTo] = useState('');
  const [insSource, setInsSource] = useState('Declarativ (MVP)');

  const [isEpisodeOpen, setIsEpisodeOpen] = useState(false);
  const [editingEpisodeId, setEditingEpisodeId] = useState<number | null>(null);
  const [epType, setEpType] = useState<'INTERNARE' | 'AMBULATORIU'>('INTERNARE');
  const [epStatus, setEpStatus] = useState<'PROGRAMAT' | 'INTERNAT' | 'EXTERNAT' | 'CANCELLED'>('PROGRAMAT');
  const [epDepartmentId, setEpDepartmentId] = useState<number | ''>('');
  const [epStart, setEpStart] = useState('');
  const [epEnd, setEpEnd] = useState('');

  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [apptServiceType, setApptServiceType] = useState<'AMBULATORIU' | 'LABORATOR' | 'IMAGISTICA'>('AMBULATORIU');
  const [apptResourceId, setApptResourceId] = useState<number | ''>('');
  const [apptStart, setApptStart] = useState('');
  const [apptEnd, setApptEnd] = useState('');
  const [apptPatientSearch, setApptPatientSearch] = useState('');
  const [apptPatientResults, setApptPatientResults] = useState<Patient[]>([]);
  const [apptPatientId, setApptPatientId] = useState<number | null>(null);

  const [isObsOpen, setIsObsOpen] = useState(false);
  const [obsType, setObsType] = useState<'VITALS' | 'LAB_RESULT' | 'NOTE'>('NOTE');
  const [obsValue, setObsValue] = useState('');

  const [isResourceOpen, setIsResourceOpen] = useState(false);
  const [resType, setResType] = useState<'MEDIC' | 'EQUIPMENT' | 'CABINET'>('MEDIC');
  const [resName, setResName] = useState('');
  const [resDepartmentId, setResDepartmentId] = useState<number | ''>('');

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferEpisodeId, setTransferEpisodeId] = useState<number | null>(null);
  const [transferToDepartmentId, setTransferToDepartmentId] = useState<number | ''>('');
  const [transferReason, setTransferReason] = useState('Transfer intern');

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [statusEpisodeId, setStatusEpisodeId] = useState<number | null>(null);
  const [newEpisodeStatus, setNewEpisodeStatus] = useState<'PROGRAMAT' | 'INTERNAT' | 'EXTERNAT' | 'CANCELLED'>('INTERNAT');

  const [isIdentityUploadOpen, setIsIdentityUploadOpen] = useState(false);
  const [idDocType, setIdDocType] = useState<'CI' | 'PASAPORT' | 'TEMPORAR' | 'ALTELE'>('CI');
  const [idFile, setIdFile] = useState<File | null>(null);

  const loadDepartments = async () => {
    try {
      const deps = await DepartmentService.getDepartments();
      setDepartments(deps || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPatients = async () => {
    try {
      setPatientsLoading(true);
      const res = await api.get('/patients', { params: { search, page: 1, limit: 50 } });
      setPatients(res.data?.patients || []);
    } catch (e) {
      console.error(e);
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca pacienții.', status: 'error', duration: 4000, isClosable: true });
    } finally {
      setPatientsLoading(false);
    }
  };

  const loadPatientDetails = async (patientId: number) => {
    try {
      setPatientDetailsLoading(true);
      const res = await api.get(`/patients/${patientId}`);
      setInsuranceHistory(res.data?.insurance || []);
      setPatientEpisodes(res.data?.episodes || []);
      setIdentityDocs(res.data?.identityDocuments || []);
    } catch (e) {
      console.error(e);
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca detaliile pacientului.', status: 'error', duration: 4000, isClosable: true });
    } finally {
      setPatientDetailsLoading(false);
    }
  };

  const activeCareEpisode = useMemo(() => {
    return patientEpisodes.find(e => e.status === 'INTERNAT' || e.status === 'PROGRAMAT') || null;
  }, [patientEpisodes]);

  const toDateInput = (v?: string | null) => {
    if (!v) return '';
    return String(v).slice(0, 10);
  };

  const toDateTimeLocal = (v?: string | null) => {
    if (!v) return '';
    // acceptă atât "YYYY-MM-DD HH:mm:ss" cât și ISO
    const s = String(v).replace(' ', 'T');
    return s.slice(0, 16);
  };

  const openInsuranceModal = () => {
    const latest = insuranceHistory?.[0];
    if (latest) {
      setInsStatus(latest.status);
      setInsValidFrom(toDateInput(latest.valid_from as any));
      setInsValidTo(toDateInput(latest.valid_to as any));
      setInsSource(latest.source || 'Declarativ (MVP)');
    } else {
      setInsStatus((selectedPatient?.insurance_status_current as any) || 'NECLAR');
      setInsValidFrom('');
      setInsValidTo('');
      setInsSource('Declarativ (MVP)');
    }
    setIsInsuranceOpen(true);
  };

  const openCareEpisodeModal = () => {
    // Dacă există o internare/vizită activă, o edităm (nu “Episod nou” peste episod activ)
    if (activeCareEpisode) {
      setEditingEpisodeId(activeCareEpisode.id);
      setEpType(activeCareEpisode.type);
      setEpStatus(activeCareEpisode.status);
      setEpDepartmentId(activeCareEpisode.department_id ?? '');
      setEpStart(toDateTimeLocal(activeCareEpisode.start_date as any));
      setEpEnd(toDateTimeLocal(activeCareEpisode.end_date as any));
    } else {
      setEditingEpisodeId(null);
      setEpType('INTERNARE');
      setEpStatus('PROGRAMAT');
      setEpDepartmentId('');
      setEpStart('');
      setEpEnd('');
    }
    setIsEpisodeOpen(true);
  };

  const loadSummary = async () => {
    const res = await api.get('/patients/census/summary', { params: { type: 'INTERNARE' } });
    setSummary(res.data);
  };

  const loadCensus = async () => {
    const params: any = { page: 1, limit: 50 };
    if (censusStatus) params.status = censusStatus;
    if (censusType) params.type = censusType;
    if (typeof censusDepartmentId === 'number') params.departmentId = censusDepartmentId;
    const res = await api.get('/patients/census/episodes', { params });
    setCensusEpisodes(res.data?.episodes || []);
  };

  const loadResources = async () => {
    const res = await api.get('/patients/scheduling/resources');
    setResources(res.data || []);
  };

  const loadAppointments = async () => {
    const res = await api.get('/patients/scheduling/appointments', { params: { page: 1, limit: 50 } });
    setAppointments(res.data?.appointments || []);
  };

  const loadObservations = async () => {
    const params: any = { page: 1, limit: 50 };
    if (selectedPatientId) params.patientId = selectedPatientId;
    const res = await api.get('/patients/monitoring/observations', { params });
    setObservations(res.data?.observations || []);
  };

  useEffect(() => {
    void loadDepartments();
    void loadPatients();
    void loadResources();
    void loadAppointments();
    void loadSummary();
  }, []);

  useEffect(() => {
    void loadPatients();
  }, [search]);

  useEffect(() => {
    if (!selectedPatientId) return;
    void loadPatientDetails(selectedPatientId);
    void loadObservations();
  }, [selectedPatientId]);

  useEffect(() => {
    if (!isAppointmentOpen) return;
    // implicit: pacientul selectat din pagină, dar îl poți schimba din search
    setApptPatientId(selectedPatientId);
    setApptPatientSearch('');
    setApptPatientResults([]);
  }, [isAppointmentOpen, selectedPatientId]);

  useEffect(() => {
    if (!isAppointmentOpen) return;
    const term = apptPatientSearch.trim();
    if (term.length < 2) {
      setApptPatientResults([]);
      return;
    }

    const handle = window.setTimeout(async () => {
      try {
        const res = await api.get('/patients', { params: { search: term, page: 1, limit: 10 } });
        setApptPatientResults(res.data?.patients || []);
      } catch {
        setApptPatientResults([]);
      }
    }, 250);

    return () => window.clearTimeout(handle);
  }, [apptPatientSearch, isAppointmentOpen]);

  useEffect(() => {
    if (!isAppointmentOpen) return;
    // default: pacientul selectat din pagină
    setApptPatientId(selectedPatientId);
    setApptPatientSearch('');
    setApptPatientResults([]);
  }, [isAppointmentOpen, selectedPatientId]);

  useEffect(() => {
    if (!isAppointmentOpen) return;
    const term = apptPatientSearch.trim();
    if (term.length < 2) {
      setApptPatientResults([]);
      return;
    }

    const handle = window.setTimeout(async () => {
      try {
        const res = await api.get('/patients', { params: { search: term, page: 1, limit: 10 } });
        setApptPatientResults(res.data?.patients || []);
      } catch {
        setApptPatientResults([]);
      }
    }, 250);

    return () => window.clearTimeout(handle);
  }, [apptPatientSearch, isAppointmentOpen]);

  useEffect(() => {
    // Centralizatoare: implicit INTERNARE + tab-uri status
    void loadCensus();
  }, [censusStatus, censusType, censusDepartmentId]);

  const createPatient = async () => {
    try {
      const res = await api.post('/patients', {
        identityType: newIdentityType,
        identityNumber: newIdentityNumber,
        firstName: newFirstName,
        lastName: newLastName,
        dateOfBirth: newDob || null,
        gender: newGender,
        contactData: newAddress || newDocSeries || newDocNumber ? { addressText: newAddress || null, documentSeries: newDocSeries || null, documentNumber: newDocNumber || null } : null,
      });
      const id = res.data?.id;
      setIsCreatePatientOpen(false);
      setNewIdentityNumber(''); setNewFirstName(''); setNewLastName(''); setNewDob(''); setNewGender('UNKNOWN'); setNewAddress(''); setNewDocSeries(''); setNewDocNumber('');
      toast({ title: 'Succes', description: 'Pacient creat.', status: 'success', duration: 2500, isClosable: true });
      await loadPatients();
      if (id) setSelectedPatientId(id);
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut crea pacientul.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const lookupIdentity = async () => {
    if (!newIdentityType || !newIdentityNumber) return;
    try {
      setLookupLoading(true);
      const res = await api.get('/patients/identity/lookup', { params: { identityType: newIdentityType, identityNumber: newIdentityNumber } });
      if (res.data?.person) {
        const p = res.data.person;
        if (p.first_name) setNewFirstName(String(p.first_name));
        if (p.last_name) setNewLastName(String(p.last_name));
        if (p.date_of_birth) setNewDob(String(p.date_of_birth));
        if (p.gender) setNewGender(p.gender);
        if (p.address_json) {
          try {
            const addr = typeof p.address_json === 'string' ? JSON.parse(p.address_json) : p.address_json;
            const text = [addr.street, addr.number, addr.city].filter(Boolean).join(' ');
            setNewAddress(text);
          } catch {
            // ignore
          }
        }
        if (p.document_series) setNewDocSeries(String(p.document_series));
        if (p.document_number) setNewDocNumber(String(p.document_number));
        toast({ title: 'Găsit', description: `Date preluate (${res.data.source || 'MOCK'}).`, status: 'success', duration: 2500, isClosable: true });
      } else if (res.data?.derived) {
        if (res.data.derived.dateOfBirth) setNewDob(String(res.data.derived.dateOfBirth));
        if (res.data.derived.gender) setNewGender(res.data.derived.gender);
        toast({ title: 'Derivat din CNP', description: res.data.derived.isValid ? 'Am completat data nașterii și sexul.' : 'CNP invalid (checksum).', status: res.data.derived.isValid ? 'info' : 'warning', duration: 3500, isClosable: true });
      }
    } catch (e: any) {
      toast({ title: 'Nu am găsit', description: e?.response?.data?.message || 'Nu există date (mock).', status: 'warning', duration: 3500, isClosable: true });
    } finally {
      setLookupLoading(false);
    }
  };

  const addInsurance = async () => {
    if (!selectedPatientId) return;
    try {
      await api.post(`/patients/${selectedPatientId}/insurance`, {
        status: insStatus,
        validFrom: insValidFrom || null,
        validTo: insValidTo || null,
        source: insSource || null,
      });
      setIsInsuranceOpen(false);
      toast({ title: 'Succes', description: 'Calitate de asigurat actualizată.', status: 'success', duration: 2500, isClosable: true });
      await loadPatientDetails(selectedPatientId);
      await loadPatients();
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut salva statusul.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const addEpisode = async () => {
    if (!selectedPatientId) return;
    try {
      if (editingEpisodeId) {
        await api.put(`/patients/episodes/${editingEpisodeId}`, {
          status: epStatus,
          departmentId: typeof epDepartmentId === 'number' ? epDepartmentId : null,
          startDate: epStart || null,
          endDate: epEnd || null,
        });
      } else {
        await api.post(`/patients/${selectedPatientId}/episodes`, {
          type: epType,
          status: epStatus,
          departmentId: typeof epDepartmentId === 'number' ? epDepartmentId : null,
          startDate: epStart || null,
          endDate: epEnd || null,
        });
      }
      setIsEpisodeOpen(false);
      toast({ title: 'Succes', description: editingEpisodeId ? 'Internare/Vizită actualizată.' : 'Internare/Vizită creată.', status: 'success', duration: 2500, isClosable: true });
      await loadPatientDetails(selectedPatientId);
      await loadCensus();
      await loadSummary();
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut salva internarea/vizita.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const createResource = async () => {
    try {
      await api.post('/patients/scheduling/resources', {
        type: resType,
        name: resName,
        departmentId: typeof resDepartmentId === 'number' ? resDepartmentId : null,
        details: null,
      });
      setIsResourceOpen(false);
      setResName('');
      toast({ title: 'Succes', description: 'Resursă creată.', status: 'success', duration: 2500, isClosable: true });
      await loadResources();
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut crea resursa.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const openTransfer = async () => {
    const ep = patientEpisodes.find(e => e.status === 'INTERNAT' || e.status === 'PROGRAMAT') || patientEpisodes[0];
    if (!ep) {
      toast({ title: 'Eroare', description: 'Pacientul nu are episoade.', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    setTransferEpisodeId(ep.id);
    setTransferToDepartmentId('');
    setIsTransferOpen(true);
    try {
      const r = await api.get(`/patients/episodes/${ep.id}/transfers`);
      setEpisodeTransfers(r.data?.transfers || []);
    } catch {
      setEpisodeTransfers([]);
    }
  };

  const doTransfer = async () => {
    if (!transferEpisodeId) return;
    if (typeof transferToDepartmentId !== 'number') {
      toast({ title: 'Eroare', description: 'Alege structura către care transferi.', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    try {
      await api.post(`/patients/episodes/${transferEpisodeId}/transfer`, {
        toDepartmentId: transferToDepartmentId,
        reason: transferReason || null,
      });
      setIsTransferOpen(false);
      toast({ title: 'Succes', description: 'Transfer înregistrat.', status: 'success', duration: 2500, isClosable: true });
      if (selectedPatientId) await loadPatientDetails(selectedPatientId);
      await loadCensus();
      await loadSummary();
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut face transferul.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const openStatus = () => {
    const ep = patientEpisodes.find(e => e.status === 'INTERNAT' || e.status === 'PROGRAMAT') || patientEpisodes[0];
    if (!ep) {
      toast({ title: 'Eroare', description: 'Pacientul nu are episoade.', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    setStatusEpisodeId(ep.id);
    setNewEpisodeStatus(ep.status === 'PROGRAMAT' ? 'INTERNAT' : 'EXTERNAT');
    setIsStatusOpen(true);
  };

  const doStatus = async () => {
    if (!statusEpisodeId) return;
    try {
      await api.put(`/patients/episodes/${statusEpisodeId}`, {
        status: newEpisodeStatus,
        endDate: newEpisodeStatus === 'EXTERNAT' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null,
      });
      setIsStatusOpen(false);
      toast({ title: 'Succes', description: 'Status episod actualizat.', status: 'success', duration: 2500, isClosable: true });
      if (selectedPatientId) await loadPatientDetails(selectedPatientId);
      await loadCensus();
      await loadSummary();
      await loadPatients();
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut actualiza statusul.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const uploadIdentityDoc = async () => {
    if (!selectedPatientId || !idFile) return;
    try {
      const fd = new FormData();
      fd.append('documentType', idDocType);
      fd.append('file', idFile);
      await api.post(`/patients/${selectedPatientId}/identity-documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIsIdentityUploadOpen(false);
      setIdFile(null);
      toast({ title: 'Succes', description: 'Document încărcat.', status: 'success', duration: 2500, isClosable: true });
      await loadPatientDetails(selectedPatientId);
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut încărca documentul.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const createAppointment = async () => {
    const patientId = apptPatientId || selectedPatientId;
    if (!patientId) {
      toast({ title: 'Eroare', description: 'Selectează un pacient.', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    if (typeof apptResourceId !== 'number') {
      toast({ title: 'Eroare', description: 'Selectează resursa (medic/cabinet/echipament).', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    try {
      await api.post('/patients/scheduling/appointments', {
        patientId,
        episodeId: null,
        serviceType: apptServiceType,
        resourceId: apptResourceId,
        startTime: apptStart,
        endTime: apptEnd,
      });
      setIsAppointmentOpen(false);
      toast({ title: 'Succes', description: 'Programare creată.', status: 'success', duration: 2500, isClosable: true });
      await loadAppointments();
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut crea programarea.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const addObservation = async () => {
    if (!selectedPatientId) return;
    try {
      await api.post('/patients/monitoring/observations', {
        patientId: selectedPatientId,
        episodeId: null,
        type: obsType,
        value: obsValue,
      });
      setIsObsOpen(false);
      setObsValue('');
      toast({ title: 'Succes', description: 'Observație salvată.', status: 'success', duration: 2500, isClosable: true });
      await loadObservations();
    } catch (e: any) {
      toast({ title: 'Eroare', description: e?.response?.data?.message || 'Nu s-a putut salva observația.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const insuranceBadge = (s: string) => {
    const map: any = { ASIGURAT: 'green', NEASIGURAT: 'red', NECLAR: 'gray' };
    return <Badge colorScheme={map[s] || 'gray'}>{s}</Badge>;
  };

  return (
    <Container maxW="7xl" py={8}>
      <HStack justify="space-between" mb={6}>
        <Box>
          <Heading size="lg">Administrare pacienți (PAM)</Heading>
          <Text color={useColorModeValue('gray.600', 'gray.400')}>
            Identitate pacient · Episoade · Programări (resurse) · Observații (monitorizare)
          </Text>
        </Box>
        <HStack>
          <Button variant="outline" onClick={loadPatients} isLoading={patientsLoading}>Reîmprospătează</Button>
          <Button variant="outline" onClick={loadSummary}>Sumar</Button>
          <Button variant="outline" onClick={() => setIsResourceOpen(true)} isDisabled={!user?.roles?.includes('SUPER_ADMIN')}>
            Resursă nouă
          </Button>
          <Button colorScheme="blue" onClick={() => setIsCreatePatientOpen(true)}>Pacient nou</Button>
        </HStack>
      </HStack>

      {/* Summary */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Card bg={bg} border="1px solid" borderColor={border} borderRadius="xl">
          <CardBody>
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Pacienți internați</Text>
            <Text fontSize="2xl" fontWeight="bold">{summary?.totals?.INTERNAT ?? 0}</Text>
          </CardBody>
        </Card>
        <Card bg={bg} border="1px solid" borderColor={border} borderRadius="xl">
          <CardBody>
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Pacienți programați pentru internare</Text>
            <Text fontSize="2xl" fontWeight="bold">{summary?.totals?.PROGRAMAT ?? 0}</Text>
          </CardBody>
        </Card>
        <Card bg={bg} border="1px solid" borderColor={border} borderRadius="xl">
          <CardBody>
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Pacienți externați</Text>
            <Text fontSize="2xl" fontWeight="bold">{summary?.totals?.EXTERNAT ?? 0}</Text>
          </CardBody>
        </Card>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <Box bg={bg} border="1px solid" borderColor={border} borderRadius="xl" p={5}>
          <HStack justify="space-between" mb={3}>
            <Text fontWeight="bold">Pacienți</Text>
            <Input w={{ base: 'full', md: '340px' }} placeholder="Caută (nume / CNP / pasaport)..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </HStack>
          <TableContainer maxH="420px" overflowY="auto" borderRadius="lg" border="1px solid" borderColor={border}>
            <Table size="sm">
              <Thead position="sticky" top={0} bg={bg} zIndex={1}>
                <Tr>
                  <Th>Nume</Th>
                  <Th>Identitate</Th>
                  <Th>Asigurare</Th>
                  <Th>Unde este</Th>
                </Tr>
              </Thead>
              <Tbody>
                {patients.map(p => {
                  const isSelected = selectedPatientId === p.id;
                  return (
                    <Tr
                      key={p.id}
                      cursor="pointer"
                      bg={isSelected ? useColorModeValue('blue.50', 'blue.900') : undefined}
                      _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                      onClick={() => setSelectedPatientId(p.id)}
                    >
                      <Td><b>{p.last_name} {p.first_name}</b></Td>
                      <Td>{p.identity_type} {p.identity_number}</Td>
                      <Td>{insuranceBadge(p.insurance_status_current)}</Td>
                      <Td>{p.current_department_name ? `${p.current_department_name} (${p.current_episode_status})` : '-'}</Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
          {patients.length === 0 && <Text mt={3} color="gray.500">Nu există pacienți.</Text>}
        </Box>

        <Box bg={bg} border="1px solid" borderColor={border} borderRadius="xl" p={5}>
          {!selectedPatient ? (
            <Text color={useColorModeValue('gray.600', 'gray.400')}>Selectează un pacient ca să vezi detaliile.</Text>
          ) : (
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="bold">{selectedPatient.last_name} {selectedPatient.first_name}</Text>
                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                    {selectedPatient.identity_type} {selectedPatient.identity_number} · {insuranceBadge(selectedPatient.insurance_status_current)}
                  </Text>
                </Box>
                <Wrap
                  spacing={2}
                  justify="flex-end"
                  maxW={{ base: '240px', md: '520px', xl: '640px' }}
                >
                  <WrapItem>
                    <Button size="sm" variant="outline" onClick={openInsuranceModal}>Asigurare</Button>
                  </WrapItem>
                  <WrapItem>
                    <Button size="sm" colorScheme="blue" onClick={openCareEpisodeModal}>
                      {activeCareEpisode ? 'Internare/Vizită (curentă)' : 'Internare/Vizită'}
                    </Button>
                  </WrapItem>
                  <WrapItem>
                    <Button size="sm" variant="outline" onClick={() => setIsAppointmentOpen(true)}>Programare</Button>
                  </WrapItem>
                  <WrapItem>
                    <Button size="sm" variant="outline" onClick={() => setIsObsOpen(true)}>Notă clinică</Button>
                  </WrapItem>
                  <WrapItem>
                    <Button size="sm" variant="outline" onClick={openStatus}>Schimbă stare</Button>
                  </WrapItem>
                  <WrapItem>
                    <Button size="sm" variant="outline" onClick={openTransfer}>Transfer</Button>
                  </WrapItem>
                  <WrapItem>
                    <Button size="sm" variant="outline" onClick={() => setIsIdentityUploadOpen(true)}>Act identitate</Button>
                  </WrapItem>
                </Wrap>
              </HStack>

              <Divider />

              <Box>
                <Text fontWeight="bold" mb={2}>Istoric calitate asigurat</Text>
                {patientDetailsLoading ? (
                  <Text color="gray.500">Se încarcă...</Text>
                ) : (
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Status</Th>
                        <Th>Valabil</Th>
                        <Th>Sursă</Th>
                        <Th>Creat</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {insuranceHistory.map(r => (
                        <Tr key={r.id}>
                          <Td>{insuranceBadge(r.status)}</Td>
                          <Td>{(r.valid_from || '-') + ' → ' + (r.valid_to || '-')}</Td>
                          <Td>{r.source || '-'}</Td>
                          <Td>{new Date(r.created_at).toLocaleString('ro-RO')}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </Box>

              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="bold">Internări / Vizite</Text>
                  {activeCareEpisode && (
                    <Badge colorScheme={activeCareEpisode.status === 'INTERNAT' ? 'green' : 'blue'}>
                      {activeCareEpisode.status === 'INTERNAT' ? 'ÎNGRIJIRE ACTIVĂ (INTERNAT)' : 'ÎNGRIJIRE ACTIVĂ (PROGRAMAT)'}
                    </Badge>
                  )}
                </HStack>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Tip</Th>
                      <Th>Stare</Th>
                      <Th>Structură</Th>
                      <Th>Perioadă</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {patientEpisodes.map(e => (
                      <Tr key={e.id}>
                        <Td><Badge>{e.type}</Badge></Td>
                        <Td><Badge variant="outline">{e.status}</Badge></Td>
                        <Td>{e.department_name || '-'}</Td>
                        <Td>
                          {(e.start_date ? new Date(e.start_date).toLocaleString('ro-RO') : '-') + ' → ' + (e.end_date ? new Date(e.end_date).toLocaleString('ro-RO') : '-')}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              <Box>
                <Text fontWeight="bold" mb={2}>Documente identitate (scan)</Text>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Tip</Th>
                      <Th>Fișier</Th>
                      <Th>Creat</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {identityDocs.map(d => (
                      <Tr key={d.id}>
                        <Td><Badge>{d.document_type}</Badge></Td>
                        <Td>{d.file_name}</Td>
                        <Td>{new Date(d.created_at).toLocaleString('ro-RO')}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                {identityDocs.length === 0 && <Text mt={2} color="gray.500">Nicio scanare încărcată.</Text>}
              </Box>

              <Box>
                <Text fontWeight="bold" mb={2}>Observații recente</Text>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Tip</Th>
                      <Th>Valoare</Th>
                      <Th>Data</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {observations.slice(0, 8).map(o => (
                      <Tr key={o.id}>
                        <Td><Badge>{o.type}</Badge></Td>
                        <Td>{o.value}</Td>
                        <Td>{new Date(o.recorded_at).toLocaleString('ro-RO')}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </VStack>
          )}
        </Box>
      </SimpleGrid>

      <Box mt={6} bg={bg} border="1px solid" borderColor={border} borderRadius="xl" p={5}>
        <HStack justify="space-between" mb={3}>
          <Box>
            <Text fontWeight="bold">Centralizatoare pacienți (internări)</Text>
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
              Liste operaționale: internați / externați / programați pentru internare
            </Text>
          </Box>
          <HStack>
            <Select
              value={censusDepartmentId}
              onChange={(e) => setCensusDepartmentId(e.target.value ? Number(e.target.value) : '')}
              placeholder="Structură"
              w={{ base: '180px', md: '320px' }}
            >
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </HStack>
        </HStack>

        <Tabs
          variant="enclosed"
          onChange={(idx) => {
            // Fixăm "internări" ca tip implicit pentru centralizatoare
            setCensusType('INTERNARE');
            if (idx === 0) setCensusStatus('INTERNAT');
            if (idx === 1) setCensusStatus('EXTERNAT');
            if (idx === 2) setCensusStatus('PROGRAMAT');
          }}
        >
          <TabList>
            <Tab>Pacienți internați</Tab>
            <Tab>Pacienți externați</Tab>
            <Tab>Programați pentru internare</Tab>
          </TabList>
          <TabPanels>
            {[0, 1, 2].map((k) => (
              <TabPanel key={k} px={0} pt={4}>
                <TableContainer maxH="300px" overflowY="auto" borderRadius="lg" border="1px solid" borderColor={border}>
                  <Table size="sm">
                    <Thead position="sticky" top={0} bg={bg} zIndex={1}>
                      <Tr>
                        <Th>Pacient</Th>
                        <Th>Status</Th>
                        <Th>Structură</Th>
                        <Th>Start</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {censusEpisodes.map((e: any) => (
                        <Tr key={e.id}>
                          <Td><b>{e.last_name} {e.first_name}</b> ({e.identity_type} {e.identity_number})</Td>
                          <Td><Badge variant="outline">{e.status}</Badge></Td>
                          <Td>{e.department_name || '-'}</Td>
                          <Td>{e.start_date ? new Date(e.start_date).toLocaleString('ro-RO') : '-'}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
                {censusEpisodes.length === 0 && (
                  <Text mt={3} color="gray.500">
                    Nu există înregistrări pentru acest centralizator (filtrele curente).
                  </Text>
                )}
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </Box>

      <Box mt={6} bg={bg} border="1px solid" borderColor={border} borderRadius="xl" p={5}>
        <HStack justify="space-between" mb={3}>
          <Box>
            <Text fontWeight="bold">Programări medicale</Text>
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
              Rezervare interval pentru resurse (medic/cabinet/echipament)
            </Text>
          </Box>
          <HStack>
            <Button variant="outline" onClick={() => setIsAppointmentOpen(true)}>Programare nouă</Button>
            <Button variant="outline" onClick={loadAppointments}>Reîmprospătează</Button>
          </HStack>
        </HStack>
        {resources.length === 0 && (
          <Text mb={3} color="orange.300">
            Nu există resurse definite (medic/cabinet/echipament). Creează o resursă ca să poți face programări.
          </Text>
        )}
        <TableContainer maxH="280px" overflowY="auto" borderRadius="lg" border="1px solid" borderColor={border}>
          <Table size="sm">
            <Thead position="sticky" top={0} bg={bg} zIndex={1}>
              <Tr>
                <Th>Pacient</Th>
                <Th>Serviciu</Th>
                <Th>Resursă</Th>
                <Th>Interval</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {appointments.map(a => (
                <Tr key={a.id}>
                  <Td><b>{a.last_name} {a.first_name}</b></Td>
                  <Td><Badge>{a.service_type}</Badge></Td>
                  <Td>{a.resource_name} ({a.resource_type})</Td>
                  <Td>{new Date(a.start_time).toLocaleString('ro-RO')} → {new Date(a.end_time).toLocaleString('ro-RO')}</Td>
                  <Td><Badge variant="outline">{a.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
        {appointments.length === 0 && <Text mt={3} color="gray.500">Nu există programări.</Text>}
      </Box>

      {/* Modal: create patient */}
      <Modal isOpen={isCreatePatientOpen} onClose={() => setIsCreatePatientOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Pacient nou</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>Tip identificare</FormLabel>
                  <Select value={newIdentityType} onChange={(e) => setNewIdentityType(e.target.value as any)}>
                    <option value="CNP">CNP</option>
                    <option value="PASAPORT">Pașaport</option>
                    <option value="TEMPORAR">Temporar</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Număr</FormLabel>
                  <HStack>
                    <Input
                      value={newIdentityNumber}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (newIdentityType === 'CNP') {
                          const digits = raw.replace(/\D/g, '').slice(0, 13);
                          setNewIdentityNumber(digits);
                        } else {
                          setNewIdentityNumber(raw);
                        }
                      }}
                      inputMode={newIdentityType === 'CNP' ? 'numeric' : undefined}
                      placeholder={newIdentityType === 'CNP' ? '13 cifre' : 'Număr document'}
                      maxLength={newIdentityType === 'CNP' ? 13 : 32}
                      onBlur={() => {
                        if (newIdentityType === 'CNP' && newIdentityNumber.length === 13) lookupIdentity();
                      }}
                    />
                    <Button variant="outline" onClick={lookupIdentity} isLoading={lookupLoading}>
                      Caută
                    </Button>
                  </HStack>
                </FormControl>
              </SimpleGrid>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>Prenume</FormLabel>
                  <Input value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Nume</FormLabel>
                  <Input value={newLastName} onChange={(e) => setNewLastName(e.target.value)} />
                </FormControl>
              </SimpleGrid>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>Data nașterii</FormLabel>
                  <Input type="date" value={newDob} onChange={(e) => setNewDob(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Sex</FormLabel>
                  <Select value={newGender} onChange={(e) => setNewGender(e.target.value as any)}>
                    <option value="UNKNOWN">Necunoscut</option>
                    <option value="M">M</option>
                    <option value="F">F</option>
                    <option value="X">X</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>Adresă (text)</FormLabel>
                  <Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Stradă, nr., localitate" />
                </FormControl>
                <FormControl>
                  <FormLabel>Act identitate (serie / nr.)</FormLabel>
                  <HStack>
                    <Input value={newDocSeries} onChange={(e) => setNewDocSeries(e.target.value)} placeholder="Serie" />
                    <Input value={newDocNumber} onChange={(e) => setNewDocNumber(e.target.value)} placeholder="Număr" />
                  </HStack>
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsCreatePatientOpen(false)}>Anulează</Button>
            <Button colorScheme="blue" onClick={createPatient}>Creează</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: insurance */}
      <Modal isOpen={isInsuranceOpen} onClose={() => setIsInsuranceOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Calitate de asigurat</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select value={insStatus} onChange={(e) => setInsStatus(e.target.value as any)}>
                  <option value="ASIGURAT">Asigurat</option>
                  <option value="NEASIGURAT">Neasigurat</option>
                  <option value="NECLAR">Neclar</option>
                </Select>
              </FormControl>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>Valabil de la</FormLabel>
                  <Input type="date" value={insValidFrom} onChange={(e) => setInsValidFrom(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Valabil până la</FormLabel>
                  <Input type="date" value={insValidTo} onChange={(e) => setInsValidTo(e.target.value)} />
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>Sursă</FormLabel>
                <Input value={insSource} onChange={(e) => setInsSource(e.target.value)} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsInsuranceOpen(false)}>Anulează</Button>
            <Button colorScheme="blue" onClick={addInsurance}>Salvează</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: episode */}
      <Modal isOpen={isEpisodeOpen} onClose={() => setIsEpisodeOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Internare / Vizită (episod de îngrijire)</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              {activeCareEpisode && (
                <Box p={3} border="1px solid" borderColor={border} borderRadius="lg">
                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                    Există deja o internare/vizită activă. Aici actualizezi datele episodului curent (nu creezi o internare nouă).
                  </Text>
                </Box>
              )}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>Tip interacțiune</FormLabel>
                  <Select value={epType} onChange={(e) => setEpType(e.target.value as any)} isDisabled={!!editingEpisodeId}>
                    <option value="INTERNARE">Internare</option>
                    <option value="AMBULATORIU">Ambulatoriu</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Stare</FormLabel>
                  <Select value={epStatus} onChange={(e) => setEpStatus(e.target.value as any)}>
                    <option value="PROGRAMAT">Programat</option>
                    <option value="INTERNAT">Internat</option>
                    <option value="EXTERNAT">Externat</option>
                    <option value="CANCELLED">Anulat</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>Structură</FormLabel>
                <Select value={epDepartmentId} onChange={(e) => setEpDepartmentId(e.target.value ? Number(e.target.value) : '')} placeholder="Alege departament">
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </FormControl>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>Start</FormLabel>
                  <Input type="datetime-local" value={epStart} onChange={(e) => setEpStart(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>End</FormLabel>
                  <Input type="datetime-local" value={epEnd} onChange={(e) => setEpEnd(e.target.value)} />
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsEpisodeOpen(false)}>Anulează</Button>
            <Button colorScheme="blue" onClick={addEpisode}>{editingEpisodeId ? 'Salvează' : 'Creează'}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: appointment */}
      <Modal isOpen={isAppointmentOpen} onClose={() => setIsAppointmentOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Programare medicală</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                Pacient selectat: <b>{(() => {
                  const pid = apptPatientId || selectedPatientId || -1;
                  const p = patients.find(x => x.id === pid) || null;
                  return p ? `${p.last_name} ${p.first_name} (${p.identity_type} ${p.identity_number})` : '-';
                })()}</b>
              </Text>

              <FormControl>
                <FormLabel>Caută pacient (nume / CNP)</FormLabel>
                <Input
                  placeholder="Scrie minim 2 caractere..."
                  value={apptPatientSearch}
                  onChange={(e) => setApptPatientSearch(e.target.value)}
                />
                {apptPatientResults.length > 0 && (
                  <Select
                    mt={2}
                    placeholder="Alege pacientul din rezultate"
                    value={apptPatientId ?? ''}
                    onChange={(e) => setApptPatientId(e.target.value ? Number(e.target.value) : null)}
                  >
                    {apptPatientResults.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.last_name} {p.first_name} — {p.identity_type} {p.identity_number}
                      </option>
                    ))}
                  </Select>
                )}
                {apptPatientSearch.trim().length >= 2 && apptPatientResults.length === 0 && (
                  <Text mt={2} fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                    Niciun pacient găsit pentru „{apptPatientSearch.trim()}”.
                  </Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Tip serviciu</FormLabel>
                <Select value={apptServiceType} onChange={(e) => setApptServiceType(e.target.value as any)}>
                  <option value="AMBULATORIU">Ambulatoriu</option>
                  <option value="LABORATOR">Laborator</option>
                  <option value="IMAGISTICA">Imagistică</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Resursă (medic/cabinet/echipament)</FormLabel>
                <Select value={apptResourceId} onChange={(e) => setApptResourceId(e.target.value ? Number(e.target.value) : '')} placeholder="Alege resursă">
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
                  <Input type="datetime-local" value={apptStart} onChange={(e) => setApptStart(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>End</FormLabel>
                  <Input type="datetime-local" value={apptEnd} onChange={(e) => setApptEnd(e.target.value)} />
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsAppointmentOpen(false)}>Anulează</Button>
            <Button colorScheme="blue" onClick={createAppointment}>Creează</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: observation */}
      <Modal isOpen={isObsOpen} onClose={() => setIsObsOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Observație (monitorizare)</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <FormControl>
                <FormLabel>Tip</FormLabel>
                <Select value={obsType} onChange={(e) => setObsType(e.target.value as any)}>
                  <option value="VITALS">Semne vitale</option>
                  <option value="LAB_RESULT">Rezultat laborator</option>
                  <option value="NOTE">Notă</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Valoare</FormLabel>
                <Textarea value={obsValue} onChange={(e) => setObsValue(e.target.value)} placeholder="ex: TA 120/80, Puls 72 / Observație clinică..." />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsObsOpen(false)}>Anulează</Button>
            <Button colorScheme="blue" onClick={addObservation}>Salvează</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: create resource */}
      <Modal isOpen={isResourceOpen} onClose={() => setIsResourceOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Resursă medicală (Scheduling)</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <FormControl>
                <FormLabel>Tip</FormLabel>
                <Select value={resType} onChange={(e) => setResType(e.target.value as any)}>
                  <option value="MEDIC">Medic</option>
                  <option value="CABINET">Cabinet</option>
                  <option value="EQUIPMENT">Echipament</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Nume</FormLabel>
                <Input value={resName} onChange={(e) => setResName(e.target.value)} placeholder="ex: Dr. Ionescu / Cabinet 3 / RX-01" />
              </FormControl>
              <FormControl>
                <FormLabel>Structură</FormLabel>
                <Select value={resDepartmentId} onChange={(e) => setResDepartmentId(e.target.value ? Number(e.target.value) : '')} placeholder="Alege departament">
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </FormControl>
              {!user?.roles?.includes('SUPER_ADMIN') && (
                <Text fontSize="sm" color="orange.300">
                  Doar SUPER_ADMIN poate crea resurse (backend aplică restricția).
                </Text>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsResourceOpen(false)}>Anulează</Button>
            <Button colorScheme="blue" onClick={createResource} isDisabled={!user?.roles?.includes('SUPER_ADMIN')}>Creează</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: transfer */}
      <Modal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transfer pacient (episod)</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <FormControl>
                <FormLabel>Către structură</FormLabel>
                <Select value={transferToDepartmentId} onChange={(e) => setTransferToDepartmentId(e.target.value ? Number(e.target.value) : '')} placeholder="Alege departament">
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Motiv</FormLabel>
                <Input value={transferReason} onChange={(e) => setTransferReason(e.target.value)} />
              </FormControl>

              <Box>
                <Text fontWeight="bold" mb={2}>Istoric transferuri (episod)</Text>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>De la</Th>
                      <Th>Către</Th>
                      <Th>Data</Th>
                      <Th>Motiv</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {episodeTransfers.map((t: any) => (
                      <Tr key={t.id}>
                        <Td>{t.from_department_name || '-'}</Td>
                        <Td>{t.to_department_name || '-'}</Td>
                        <Td>{new Date(t.transferred_at).toLocaleString('ro-RO')}</Td>
                        <Td>{t.reason || '-'}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                {episodeTransfers.length === 0 && <Text mt={2} color="gray.500">Nu există transferuri.</Text>}
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsTransferOpen(false)}>Anulează</Button>
            <Button colorScheme="blue" onClick={doTransfer}>Transferă</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: status */}
      <Modal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Mută status (episod)</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <FormControl>
                <FormLabel>Status nou</FormLabel>
                <Select value={newEpisodeStatus} onChange={(e) => setNewEpisodeStatus(e.target.value as any)}>
                  <option value="PROGRAMAT">Programat</option>
                  <option value="INTERNAT">Internat</option>
                  <option value="EXTERNAT">Externat</option>
                  <option value="CANCELLED">Anulat</option>
                </Select>
              </FormControl>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                “Mutarea” înseamnă schimbare de stare a episodului (ex: PROGRAMAT → INTERNAT → EXTERNAT) fără ștergere.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsStatusOpen(false)}>Anulează</Button>
            <Button colorScheme="blue" onClick={doStatus}>Salvează</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: identity upload */}
      <Modal isOpen={isIdentityUploadOpen} onClose={() => setIsIdentityUploadOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Scan document identitate</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <FormControl>
                <FormLabel>Tip document</FormLabel>
                <Select value={idDocType} onChange={(e) => setIdDocType(e.target.value as any)}>
                  <option value="CI">CI</option>
                  <option value="PASAPORT">Pașaport</option>
                  <option value="TEMPORAR">Temporar</option>
                  <option value="ALTELE">Altele</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Fișier (PDF/JPG/PNG/GIF)</FormLabel>
                <Input type="file" accept=".pdf,image/*" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
              </FormControl>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                MVP: încărcare fișier (simulează scanarea). Fișierul se salvează în “Arhiva electronică” locală (uploads).
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsIdentityUploadOpen(false)}>Anulează</Button>
            <Button colorScheme="blue" onClick={uploadIdentityDoc} isDisabled={!idFile}>Încarcă</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}


