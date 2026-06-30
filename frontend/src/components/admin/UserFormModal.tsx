import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  InputGroup,
  InputRightElement,
  VStack,
  SimpleGrid,
  useToast,
  FormErrorMessage,
  Switch,
  Box,
  Divider,
  Text,
  HStack,
  Icon,
  IconButton,
} from '@chakra-ui/react';
import { FiUser, FiMail, FiPhone, FiShield, FiUsers, FiEye, FiEyeOff } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import api from '../../services/api';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles?: string[];
  departments?: string[];
  isActive: boolean;
  lastLogin?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
  onSuccess: () => void;
}

type RoleOption = { id: number; name: string; description?: string | null };
type DepartmentOption = { id: number; name: string; description?: string | null };

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrator',
  SUPER_ADMIN: 'Super administrator',
  DEPARTMENT_ADMIN: 'Administrator departament',
  MANAGER: 'Manager',
  INSPECTOR: 'Inspector',
  OPERATOR: 'Operator',
  VIEWER: 'Vizualizare',
  GUEST: 'Invitat',
  WAREHOUSE_KEEPER: 'Gestionar',
  BUDGET_OFFICER: 'Bugetar',
};

const initialFormData = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  role: '',
  departmentId: '' as string,
  isActive: true,
  password: '',
  confirmPassword: '',
};

export default function UserFormModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: UserFormModalProps) {
  const [formData, setFormData] = useState(() =>
    user
      ? {
          ...initialFormData,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone || '',
          role: (user.roles && user.roles.length ? user.roles[0] : '') as string,
          departmentId: '' as string,
          isActive: !!user.isActive,
          password: '',
          confirmPassword: '',
        }
      : initialFormData
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const toast = useToast();

  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    setFormData(
      user
        ? {
            ...initialFormData,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone || '',
            role: user.roles?.[0] || '',
            departmentId: '',
            isActive: !!user.isActive,
            password: '',
            confirmPassword: '',
          }
        : initialFormData
    );
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) return;

    const loadOptions = async () => {
      try {
        const [rolesRes, deptsRes] = await Promise.all([
          api.get('/auth/roles'),
          api.get('/departments'),
        ]);
        setRoleOptions((rolesRes.data || []) as RoleOption[]);
        setDepartmentOptions((deptsRes.data || []) as DepartmentOption[]);
      } catch (e) {
        console.error('Error loading user form options:', e);
      }
    };

    void loadOptions();
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email-ul este obligatoriu';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email-ul nu este valid';
    }

    if (!formData.firstName) {
      newErrors.firstName = 'Prenumele este obligatoriu';
    }

    if (!formData.lastName) {
      newErrors.lastName = 'Numele este obligatoriu';
    }

    if (!formData.role) {
      newErrors.role = 'Rolul este obligatoriu';
    }

    if (!formData.departmentId) {
      newErrors.departmentId = 'Departamentul este obligatoriu';
    }

    if (formData.phone && !/^\+40\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Numărul de telefon trebuie să fie în formatul +40XXXXXXXXX';
    }

    if (!user) { // Doar pentru utilizatori noi
      if (!formData.password) {
        newErrors.password = 'Parola este obligatorie';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Parola trebuie să aibă cel puțin 6 caractere';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Parolele nu se potrivesc';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: 'Eroare de validare',
        description: 'Vă rugăm să completați toate câmpurile obligatorii corect.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);

      if (user) {
        // Pentru moment, modalul e folosit doar pentru creare.
        // Editarea se face în altă secțiune (UserManagement -> Editează).
        throw new Error('Editarea utilizatorului nu este suportată în acest modal.');
      }

      const departmentIdNumber = Number(formData.departmentId);
      if (!Number.isFinite(departmentIdNumber)) {
        throw new Error('departmentId invalid');
      }

      await api.post(
        '/auth/users',
        {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || null,
          role: formData.role,
          departmentIds: [departmentIdNumber],
          isActive: formData.isActive,
          isEmailVerified: true
        }
      );

      toast({
        title: 'Succes',
        description: 'Utilizatorul a fost adăugat cu succes',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onSuccess();
      onClose();
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: 'Eroare',
        description: (error as any)?.response?.data?.message || 'Nu s-a putut salva utilizatorul. Vă rugăm să încercați din nou.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    field: keyof typeof formData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      motionPreset="slideInBottom"
      scrollBehavior="inside"
    >
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent borderRadius="xl">
        <ModalHeader>
          <HStack>
            <Icon as={FiUser} color="brand.500" />
            <Text>{user ? 'Editare Utilizator' : 'Adăugare Utilizator Nou'}</Text>
          </HStack>
        </ModalHeader>

        <ModalBody>
          <VStack spacing={6}>
            {/* Informații Personale */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                <HStack>
                  <Icon as={FiUser} color="blue.500" />
                  <Text>Informații Personale</Text>
                </HStack>
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isInvalid={!!errors.firstName}>
                  <FormLabel>Prenume</FormLabel>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder="ex: Ion"
                  />
                  <FormErrorMessage>{errors.firstName}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.lastName}>
                  <FormLabel>Nume</FormLabel>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="ex: Popescu"
                  />
                  <FormErrorMessage>{errors.lastName}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.email}>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="ex: ion.popescu@dsp-dolj.ro"
                  />
                  <FormErrorMessage>{errors.email}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.phone}>
                  <FormLabel>Telefon</FormLabel>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="ex: +40721234567"
                  />
                  <FormErrorMessage>{errors.phone}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Informații Profesionale */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                <HStack>
                  <Icon as={FiUsers} color="green.500" />
                  <Text>Informații Profesionale</Text>
                </HStack>
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isInvalid={!!errors.role}>
                  <FormLabel>Rol</FormLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                  >
                    <option value="">Selectează rolul</option>
                    {roleOptions.map((r) => (
                      <option key={r.id} value={r.name}>
                        {roleLabels[r.name] || r.name}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.role}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.departmentId}>
                  <FormLabel>Departament</FormLabel>
                  <Select
                    value={formData.departmentId}
                    onChange={(e) => handleChange('departmentId', e.target.value)}
                    placeholder="Selectează departamentul"
                  >
                    <option value="">Selectează departamentul</option>
                    {departmentOptions.map((d) => (
                      <option key={d.id} value={String(d.id)}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.departmentId}</FormErrorMessage>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Status Activ</FormLabel>
                  <Switch
                    isChecked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                    colorScheme="green"
                  />
                </FormControl>
              </SimpleGrid>
            </Box>

            {!user && (
              <>
                <Divider />

                {/* Parolă (doar pentru utilizatori noi) */}
                <Box w="full">
                  <Text fontSize="lg" fontWeight="medium" mb={4}>
                    <HStack>
                      <Icon as={FiShield} color="red.500" />
                      <Text>Securitate</Text>
                    </HStack>
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isInvalid={!!errors.password}>
                      <FormLabel>Parolă</FormLabel>
                      <InputGroup>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => handleChange('password', e.target.value)}
                          placeholder="Minim 6 caractere"
                        />
                        <InputRightElement>
                          <IconButton
                            aria-label={showPassword ? 'Ascunde parola' : 'Arată parola'}
                            icon={showPassword ? <FiEyeOff /> : <FiEye />}
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPassword((prev) => !prev)}
                          />
                        </InputRightElement>
                      </InputGroup>
                      <FormErrorMessage>{errors.password}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.confirmPassword}>
                      <FormLabel>Confirmă Parola</FormLabel>
                      <InputGroup>
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => handleChange('confirmPassword', e.target.value)}
                          placeholder="Repetă parola"
                        />
                        <InputRightElement>
                          <IconButton
                            aria-label={showConfirmPassword ? 'Ascunde confirmarea parolei' : 'Arată confirmarea parolei'}
                            icon={showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                          />
                        </InputRightElement>
                      </InputGroup>
                      <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                    </FormControl>
                  </SimpleGrid>
                </Box>
              </>
            )}

            {user && (
              <Box w="full" p={4} bg="blue.50" _dark={{ bg: 'blue.900' }} borderRadius="lg">
                <Text fontSize="sm" color="blue.700" _dark={{ color: 'blue.300' }}>
                  <strong>Notă:</strong> Pentru a schimba parola utilizatorului, 
                  va fi trimis un email de resetare la adresa specificată.
                </Text>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose}>
            Anulează
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleSubmit}
            isLoading={loading}
            loadingText="Se salvează..."
          >
            {user ? 'Salvează Modificările' : 'Adaugă Utilizator'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 