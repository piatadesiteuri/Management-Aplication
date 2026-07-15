import { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  useColorModeValue,
  Icon,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  useToast,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { FiUser, FiMail, FiShield, FiEdit3, FiSave, FiX } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrator',
  DEPARTMENT_ADMIN: 'Administrator Departament',
  MANAGER: 'Manager',
  INSPECTOR: 'Inspector DSP',
  OPERATOR: 'Operator',
  BUDGET_OFFICER: 'Bugetar',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'purple',
  DEPARTMENT_ADMIN: 'orange',
  MANAGER: 'purple',
  INSPECTOR: 'blue',
  OPERATOR: 'green',
  BUDGET_OFFICER: 'teal',
};

export default function UserProfile() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (!user) return;
    setProfileData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
    });
  }, [user]);

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      await api.put('/auth/profile', {
        firstName: profileData.first_name,
        lastName: profileData.last_name,
        email: user?.email,
      });
      setIsEditing(false);
      updateUser({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
      });
      toast({
        title: 'Profil actualizat',
        description: 'Informațiile tale au fost salvate.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error?.response?.data?.message || 'Nu s-a putut actualiza profilul.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (!user) return;
    setProfileData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
    });
  };

  if (!user) {
    return (
      <Box p={8}>
        <Alert status="warning">
          <AlertIcon />
          <AlertTitle>Acces restricționat</AlertTitle>
          <AlertDescription>Trebuie să fii autentificat pentru a accesa profilul.</AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6} bg={bgColor} minH="100vh">
      <VStack spacing={6} align="stretch" maxW="4xl" mx="auto">
        <Box>
          <Heading size="lg" color={textColor}>
            Profil Utilizator
          </Heading>
          <Text color={mutedTextColor} mt={1}>
            Datele contului tău din sistem
          </Text>
        </Box>

        <Card bg={cardBg} shadow="sm" border="1px solid" borderColor={borderColor}>
          <CardHeader>
            <HStack justify="space-between" align="center">
              <HStack spacing={3}>
                <Icon as={FiUser} color="blue.500" boxSize={5} />
                <VStack align="start" spacing={0}>
                  <Heading size="md" color={textColor}>
                    {user.first_name || user.last_name
                      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                      : user.name || 'Utilizator'}
                  </Heading>
                  <Text color={mutedTextColor} fontSize="sm">
                    {user.email}
                  </Text>
                </VStack>
              </HStack>
              {!isEditing && (
                <Button
                  leftIcon={<FiEdit3 />}
                  colorScheme="blue"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Editează
                </Button>
              )}
            </HStack>
          </CardHeader>

          <CardBody>
            <VStack spacing={5} align="stretch">
              <Box>
                <Text fontSize="sm" fontWeight="medium" color={mutedTextColor} mb={2}>
                  Roluri
                </Text>
                <Wrap spacing={2}>
                  {user.roles.map((role) => (
                    <WrapItem key={role}>
                      <Badge colorScheme={ROLE_COLORS[role] || 'gray'} variant="subtle" px={3} py={1}>
                        {ROLE_LABELS[role] || role}
                      </Badge>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel color={textColor}>Prenume</FormLabel>
                  <Input
                    value={profileData.first_name}
                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                    isReadOnly={!isEditing}
                    bg={bgColor}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textColor}>Nume</FormLabel>
                  <Input
                    value={profileData.last_name}
                    onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                    isReadOnly={!isEditing}
                    bg={bgColor}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textColor}>
                    <HStack spacing={2}>
                      <Icon as={FiMail} />
                      <Text>Email</Text>
                    </HStack>
                  </FormLabel>
                  <Input value={profileData.email} isReadOnly bg={bgColor} />
                  <FormHelperText color={mutedTextColor}>
                    Email-ul contului nu poate fi modificat din profil
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel color={textColor}>
                    <HStack spacing={2}>
                      <Icon as={FiShield} />
                      <Text>Status cont</Text>
                    </HStack>
                  </FormLabel>
                  <Input
                    value={user.is_active === false ? 'Inactiv' : 'Activ'}
                    isReadOnly
                    bg={bgColor}
                  />
                </FormControl>
              </SimpleGrid>

              {isEditing && (
                <HStack spacing={3}>
                  <Button
                    leftIcon={<FiSave />}
                    colorScheme="blue"
                    onClick={handleProfileSave}
                    isLoading={loading}
                  >
                    Salvează
                  </Button>
                  <Button leftIcon={<FiX />} variant="outline" onClick={handleCancelEdit}>
                    Anulează
                  </Button>
                </HStack>
              )}
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}
