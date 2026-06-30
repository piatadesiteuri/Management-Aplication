import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Select,
  Input,
  FormControl,
  FormLabel,
  Textarea,
  Switch,
  Badge,
  useColorModeValue,
  SimpleGrid,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiPlus, FiTag, FiAlertTriangle, FiMapPin, FiUsers, FiFileText } from 'react-icons/fi';
import { DSPMetadata } from '../../types/calendar';

interface DSPMetadataFormProps {
  metadata?: DSPMetadata;
  eventType?: string;
  onMetadataChange: (metadata: DSPMetadata) => void;
}

const inspectionTypeNames = {
  FOOD_SAFETY: 'Siguranța Alimentelor',
  WATER_QUALITY: 'Calitatea Apei',
  ENVIRONMENTAL: 'Mediu',
  OCCUPATIONAL_HEALTH: 'Sănătate Ocupațională',
  COMMUNICABLE_DISEASES: 'Boli Transmisibile'
};

const riskLevelNames = {
  LOW: 'Scăzut',
  MEDIUM: 'Mediu',
  HIGH: 'Ridicat',
  CRITICAL: 'Critic'
};

const riskLevelColors = {
  LOW: 'green',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red'
};

const complianceStatusNames = {
  COMPLIANT: 'Conform',
  NON_COMPLIANT: 'Neconform',
  PARTIALLY_COMPLIANT: 'Parțial Conform',
  PENDING: 'În Evaluare'
};

const complianceStatusColors = {
  COMPLIANT: 'green',
  NON_COMPLIANT: 'red',
  PARTIALLY_COMPLIANT: 'orange',
  PENDING: 'blue'
};

// Tag-uri predefinite pentru DSP
const predefinedTags = [
  { name: 'Urgent', color: 'red' },
  { name: 'Inspecție de Rutină', color: 'blue' },
  { name: 'Control Tematic', color: 'purple' },
  { name: 'Sesizare', color: 'orange' },
  { name: 'Urmare Neconformitate', color: 'yellow' },
  { name: 'Control Inopinat', color: 'green' },
  { name: 'Monitorizare', color: 'teal' },
  { name: 'Investigație', color: 'pink' },
  { name: 'Raportare Națională', color: 'cyan' },
  { name: 'Raportare UE', color: 'gray' }
];

export default function DSPMetadataForm({
  metadata,
  eventType,
  onMetadataChange
}: DSPMetadataFormProps) {
  const [formData, setFormData] = useState<DSPMetadata>({
    inspectionType: metadata?.inspectionType,
    riskLevel: metadata?.riskLevel || 'MEDIUM',
    affectedPopulation: metadata?.affectedPopulation,
    legalBasis: metadata?.legalBasis || '',
    followUpRequired: metadata?.followUpRequired || false,
    reportingDeadline: metadata?.reportingDeadline || '',
    responsibleAuthority: metadata?.responsibleAuthority || '',
    externalParticipants: metadata?.externalParticipants || [],
    complianceStatus: metadata?.complianceStatus || 'PENDING',
    sanctionsApplied: metadata?.sanctionsApplied || false,
    followUpDate: metadata?.followUpDate || ''
  });

  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newParticipant, setNewParticipant] = useState('');

  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const toast = useToast();

  useEffect(() => {
    onMetadataChange(formData);
  }, [formData, onMetadataChange]);

  const handleInputChange = (field: keyof DSPMetadata, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addParticipant = () => {
    if (newParticipant.trim()) {
      const updatedParticipants = [...(formData.externalParticipants || []), newParticipant.trim()];
      handleInputChange('externalParticipants', updatedParticipants);
      setNewParticipant('');
    }
  };

  const removeParticipant = (index: number) => {
    const updatedParticipants = formData.externalParticipants?.filter((_, i) => i !== index) || [];
    handleInputChange('externalParticipants', updatedParticipants);
  };

  const addCustomTag = () => {
    if (newTag.trim() && !customTags.includes(newTag.trim())) {
      setCustomTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeCustomTag = (tagToRemove: string) => {
    setCustomTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const addPredefinedTag = (tag: { name: string; color: string }) => {
    if (!customTags.includes(tag.name)) {
      setCustomTags(prev => [...prev, tag.name]);
    }
  };

  // Afișează câmpuri specifice în funcție de tipul evenimentului
  const shouldShowInspectionFields = eventType === 'INSPECTION' || eventType === 'EPIDEMIOLOGICAL_CONTROL';
  const shouldShowComplianceFields = eventType === 'INSPECTION';
  const shouldShowEmergencyFields = eventType === 'HEALTH_EMERGENCY';

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Box>
        <HStack spacing={2} mb={4}>
          <FiTag />
          <Text fontSize="lg" fontWeight="bold">
            Metadate DSP și Clasificare
          </Text>
        </HStack>
        <Text fontSize="sm" color="gray.600">
          Completați informațiile specifice pentru DSP și adăugați tag-uri pentru clasificare.
        </Text>
      </Box>

      <Divider />

      {/* Câmpuri specifice inspecțiilor */}
      {shouldShowInspectionFields && (
        <Box bg={bgColor} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor}>
          <Text fontSize="md" fontWeight="semibold" mb={4} color="blue.600">
            Informații Inspecție
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Tip Inspecție</FormLabel>
              <Select
                value={formData.inspectionType || ''}
                onChange={(e) => handleInputChange('inspectionType', e.target.value || undefined)}
                placeholder="Selectați tipul inspecției"
              >
                {Object.entries(inspectionTypeNames).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Nivel de Risc</FormLabel>
              <Select
                value={formData.riskLevel}
                onChange={(e) => handleInputChange('riskLevel', e.target.value as any)}
              >
                {Object.entries(riskLevelNames).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </Select>
            </FormControl>
          </SimpleGrid>
        </Box>
      )}

      {/* Câmpuri pentru urgențe sanitare */}
      {shouldShowEmergencyFields && (
        <Box bg={bgColor} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor}>
          <Text fontSize="md" fontWeight="semibold" mb={4} color="red.600">
            Informații Urgență Sanitară
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Populație Afectată (estimare)</FormLabel>
              <NumberInput
                value={formData.affectedPopulation || ''}
                onChange={(_, value) => handleInputChange('affectedPopulation', value || undefined)}
                min={0}
              >
                <NumberInputField placeholder="Numărul de persoane afectate" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>Nivel de Risc</FormLabel>
              <Select
                value={formData.riskLevel}
                onChange={(e) => handleInputChange('riskLevel', e.target.value as any)}
              >
                {Object.entries(riskLevelNames).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </Select>
            </FormControl>
          </SimpleGrid>
        </Box>
      )}

      {/* Informații legale și administrative */}
      <Box bg={bgColor} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor}>
        <Text fontSize="md" fontWeight="semibold" mb={4} color="purple.600">
          Informații Legale și Administrative
        </Text>
        <VStack spacing={4}>
          <FormControl>
            <FormLabel>Baza Legală</FormLabel>
            <Textarea
              value={formData.legalBasis}
              onChange={(e) => handleInputChange('legalBasis', e.target.value)}
              placeholder="Specificați baza legală pentru această acțiune (ex: Legea 95/2006, OMS 119/2014, etc.)"
              rows={3}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Autoritate Responsabilă</FormLabel>
            <Input
              value={formData.responsibleAuthority}
              onChange={(e) => handleInputChange('responsibleAuthority', e.target.value)}
              placeholder="Ex: DSP Dolj, ANSVSA, ANPM, etc."
            />
          </FormControl>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
            <FormControl>
              <FormLabel>Termen de Raportare</FormLabel>
              <Input
                type="date"
                value={formData.reportingDeadline}
                onChange={(e) => handleInputChange('reportingDeadline', e.target.value)}
              />
            </FormControl>

            {shouldShowComplianceFields && (
              <FormControl>
                <FormLabel>Status Conformitate</FormLabel>
                <Select
                  value={formData.complianceStatus}
                  onChange={(e) => handleInputChange('complianceStatus', e.target.value as any)}
                >
                  {Object.entries(complianceStatusNames).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </Select>
              </FormControl>
            )}
          </SimpleGrid>
        </VStack>
      </Box>

      {/* Participanți externi */}
      <Box bg={bgColor} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor}>
        <Text fontSize="md" fontWeight="semibold" mb={4} color="teal.600">
          Participanți Externi
        </Text>
        <VStack spacing={3}>
          <HStack w="full">
            <Input
              value={newParticipant}
              onChange={(e) => setNewParticipant(e.target.value)}
              placeholder="Adăugați participant extern (instituție, expert, etc.)"
              onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
            />
            <IconButton
              icon={<FiPlus />}
              onClick={addParticipant}
              colorScheme="teal"
              aria-label="Adaugă participant"
            />
          </HStack>
          {formData.externalParticipants && formData.externalParticipants.length > 0 && (
            <Wrap w="full">
              {formData.externalParticipants.map((participant, index) => (
                <WrapItem key={index}>
                  <Tag size="md" variant="solid" colorScheme="teal">
                    <TagLabel>{participant}</TagLabel>
                    <TagCloseButton onClick={() => removeParticipant(index)} />
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          )}
        </VStack>
      </Box>

      {/* Follow-up și sancțiuni */}
      <Box bg={bgColor} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor}>
        <Text fontSize="md" fontWeight="semibold" mb={4} color="orange.600">
          Follow-up și Măsuri
        </Text>
        <VStack spacing={4}>
          <HStack w="full" justify="space-between">
            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>Necesită Follow-up</FormLabel>
              <Switch
                isChecked={formData.followUpRequired}
                onChange={(e) => handleInputChange('followUpRequired', e.target.checked)}
                colorScheme="orange"
              />
            </FormControl>

            {shouldShowComplianceFields && (
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Sancțiuni Aplicate</FormLabel>
                <Switch
                  isChecked={formData.sanctionsApplied}
                  onChange={(e) => handleInputChange('sanctionsApplied', e.target.checked)}
                  colorScheme="red"
                />
              </FormControl>
            )}
          </HStack>

          {formData.followUpRequired && (
            <FormControl>
              <FormLabel>Data Follow-up</FormLabel>
              <Input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => handleInputChange('followUpDate', e.target.value)}
              />
            </FormControl>
          )}
        </VStack>
      </Box>

      {/* Tag-uri și clasificare */}
      <Box bg={bgColor} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor}>
        <Text fontSize="md" fontWeight="semibold" mb={4} color="gray.600">
          Tag-uri și Clasificare
        </Text>
        
        {/* Tag-uri predefinite */}
        <VStack spacing={4}>
          <Box w="full">
            <Text fontSize="sm" mb={2} color="gray.600">Tag-uri Predefinite DSP:</Text>
            <Wrap>
              {predefinedTags.map((tag) => (
                <WrapItem key={tag.name}>
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme={tag.color}
                    onClick={() => addPredefinedTag(tag)}
                    isDisabled={customTags.includes(tag.name)}
                  >
                    {tag.name}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>
          </Box>

          {/* Tag-uri personalizate */}
          <Box w="full">
            <Text fontSize="sm" mb={2} color="gray.600">Adaugă Tag Personalizat:</Text>
            <HStack>
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Nume tag personalizat"
                size="sm"
                onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
              />
              <IconButton
                icon={<FiPlus />}
                onClick={addCustomTag}
                size="sm"
                colorScheme="blue"
                aria-label="Adaugă tag"
              />
            </HStack>
          </Box>

          {/* Tag-uri selectate */}
          {customTags.length > 0 && (
            <Box w="full">
              <Text fontSize="sm" mb={2} color="gray.600">Tag-uri Selectate:</Text>
              <Wrap>
                {customTags.map((tag) => (
                  <WrapItem key={tag}>
                    <Tag size="md" variant="solid" colorScheme="blue">
                      <TagLabel>{tag}</TagLabel>
                      <TagCloseButton onClick={() => removeCustomTag(tag)} />
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>
          )}
        </VStack>
      </Box>

      {/* Indicatori vizuali pentru status */}
      <Box>
        <Text fontSize="sm" mb={2} color="gray.600">Status Curent:</Text>
        <HStack spacing={4}>
          <Badge colorScheme={riskLevelColors[formData.riskLevel || 'MEDIUM']} size="lg">
            Risc: {riskLevelNames[formData.riskLevel || 'MEDIUM']}
          </Badge>
          
          {formData.complianceStatus && (
            <Badge colorScheme={complianceStatusColors[formData.complianceStatus]} size="lg">
              {complianceStatusNames[formData.complianceStatus]}
            </Badge>
          )}
          
          {formData.followUpRequired && (
            <Badge colorScheme="orange" size="lg">
              Follow-up Necesar
            </Badge>
          )}
          
          {formData.sanctionsApplied && (
            <Badge colorScheme="red" size="lg">
              Sancțiuni Aplicate
            </Badge>
          )}
        </HStack>
      </Box>
    </VStack>
  );
} 