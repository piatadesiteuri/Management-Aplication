import React, { useState } from 'react';
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
  Divider,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
} from '@chakra-ui/react';
import {
  FiUser,
  FiMail,
  FiShield,
  FiCalendar,
  FiFileText,
  FiCheckCircle,
  FiEdit3,
  FiSave,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserProfile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormData>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');

  const getRoleDisplayName = (roles: string[]) => {
    if (roles.includes('BUDGET_OFFICER')) return 'Bugetar';
    if (roles.includes('INSPECTOR')) return 'Inspector DSP';
    if (roles.includes('OPERATOR')) return 'Operator';
    if (roles.includes('MANAGER')) return 'Manager';
    if (roles.includes('DEPARTMENT_ADMIN')) return 'Administrator Departament';
    return 'Utilizator';
  };

  const getRoleColor = (roles: string[]) => {
    if (roles.includes('BUDGET_OFFICER')) return 'teal';
    if (roles.includes('INSPECTOR')) return 'blue';
    if (roles.includes('OPERATOR')) return 'green';
    if (roles.includes('MANAGER')) return 'purple';
    if (roles.includes('DEPARTMENT_ADMIN')) return 'orange';
    return 'gray';
  };

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      // Simulez salvarea
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEditing(false);
      toast({
        title: 'Profil actualizat!',
        description: 'Informațiile tale au fost salvate cu succes.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Eroare!',
        description: 'Nu s-a putut actualiza profilul.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Eroare!',
        description: 'Parolele nu se potrivesc.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      // Simulez schimbarea parolei
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast({
        title: 'Parolă schimbată!',
        description: 'Parola ta a fost actualizată cu succes.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Eroare!',
        description: 'Nu s-a putut schimba parola.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box p={8}>
        <Alert status="warning">
          <AlertIcon />
          <AlertTitle>Acces restricționat!</AlertTitle>
          <AlertDescription>
            Trebuie să fii autentificat pentru a accesa profilul.
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6} bg={bgColor} minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={2}>
              <Heading size="lg" color={textColor}>
                Profil Utilizator
              </Heading>
              <Text color={mutedTextColor}>
                Gestionează informațiile tale personale și setările contului
              </Text>
            </VStack>
          </HStack>
        </Box>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Profile Information */}
          <Card bg={cardBg} shadow="sm">
            <CardHeader>
              <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                  <Icon as={FiUser} color="teal.500" boxSize={5} />
                  <VStack align="start" spacing={1}>
                    <Heading size="md" color={textColor}>
                      Informații Personale
                    </Heading>
                    <Text color={mutedTextColor} fontSize="sm">
                      Datele tale de contact și rol
                    </Text>
                  </VStack>
                </HStack>
                {!isEditing && (
                  <Button
                    leftIcon={<FiEdit3 />}
                    colorScheme="teal"
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
              <VStack spacing={4} align="stretch">
                {/* Role Badge */}
                <HStack spacing={3}>
                  <Text color={mutedTextColor} fontSize="sm" fontWeight="medium">
                    Rol:
                  </Text>
                  <Badge colorScheme={getRoleColor(user.roles)} variant="subtle" px={3} py={1}>
                    {getRoleDisplayName(user.roles)}
                  </Badge>
                </HStack>

                {/* Profile Form */}
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel color={textColor}>Prenume</FormLabel>
                    <Input
                      value={profileData.first_name}
                      onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                      isDisabled={!isEditing}
                      bg={bgColor}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel color={textColor}>Nume</FormLabel>
                    <Input
                      value={profileData.last_name}
                      onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                      isDisabled={!isEditing}
                      bg={bgColor}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel color={textColor}>Email</FormLabel>
                    <Input
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      isDisabled={!isEditing}
                      bg={bgColor}
                    />
                    <FormHelperText color={mutedTextColor}>
                      Email-ul nu poate fi modificat
                    </FormHelperText>
                  </FormControl>

                  {isEditing && (
                    <HStack spacing={3}>
                      <Button
                        leftIcon={<FiSave />}
                        colorScheme="teal"
                        onClick={handleProfileSave}
                        isLoading={loading}
                      >
                        Salvează
                      </Button>
                      <Button
                        leftIcon={<FiX />}
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setProfileData({
                            first_name: user.first_name || '',
                            last_name: user.last_name || '',
                            email: user.email || '',
                          });
                        }}
                      >
                        Anulează
                      </Button>
                    </HStack>
                  )}
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Password Change */}
          <Card bg={cardBg} shadow="sm">
            <CardHeader>
              <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                  <Icon as={FiShield} color="blue.500" boxSize={5} />
                  <VStack align="start" spacing={1}>
                    <Heading size="md" color={textColor}>
                      Schimbă Parola
                    </Heading>
                    <Text color={mutedTextColor} fontSize="sm">
                      Actualizează parola contului
                    </Text>
                  </VStack>
                </HStack>
                {!isChangingPassword && (
                  <Button
                    leftIcon={<FiEdit3 />}
                    colorScheme="blue"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChangingPassword(true)}
                  >
                    Schimbă
                  </Button>
                )}
              </HStack>
            </CardHeader>
            <CardBody>
              {!isChangingPassword ? (
                <VStack spacing={3} align="stretch">
                  <HStack spacing={3}>
                    <Icon as={FiShield} color="green.500" />
                    <Text color={textColor}>Parola actuală este activă</Text>
                  </HStack>
                  <Text color={mutedTextColor} fontSize="sm">
                    Ultima modificare: Acum 30 de zile
                  </Text>
                </VStack>
              ) : (
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel color={textColor}>Parola Actuală</FormLabel>
                    <Input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      bg={bgColor}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel color={textColor}>Parola Nouă</FormLabel>
                    <Input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      bg={bgColor}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel color={textColor}>Confirmă Parola Nouă</FormLabel>
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      bg={bgColor}
                    />
                  </FormControl>

                  <HStack spacing={3}>
                    <Button
                      leftIcon={<FiSave />}
                      colorScheme="blue"
                      onClick={handlePasswordChange}
                      isLoading={loading}
                    >
                      Schimbă Parola
                    </Button>
                    <Button
                      leftIcon={<FiX />}
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        });
                      }}
                    >
                      Anulează
                    </Button>
                  </HStack>
                </VStack>
              )}
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Activity Statistics */}
        <Card bg={cardBg} shadow="sm">
          <CardHeader>
            <HStack spacing={3}>
              <Icon as={FiCalendar} color="purple.500" boxSize={5} />
              <VStack align="start" spacing={1}>
                <Heading size="md" color={textColor}>
                  Statistici Activitate
                </Heading>
                <Text color={mutedTextColor} fontSize="sm">
                  Prezentare generală a activității tale
                </Text>
              </VStack>
            </HStack>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <Stat>
                <StatLabel color={mutedTextColor}>
                  <HStack spacing={2}>
                    <Icon as={FiCalendar} />
                    <Text>Evenimente Create</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color={textColor}>24</StatNumber>
                <StatHelpText>
                  <Icon as={FiCheckCircle} color="green.500" />
                  Această lună
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel color={mutedTextColor}>
                  <HStack spacing={2}>
                    <Icon as={FiFileText} />
                    <Text>Documente Încărcate</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color={textColor}>156</StatNumber>
                <StatHelpText>
                  <Icon as={FiCheckCircle} color="green.500" />
                  Total
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel color={mutedTextColor}>
                  <HStack spacing={2}>
                    <Icon as={FiCheckCircle} />
                    <Text>Evenimente Finalizate</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color={textColor}>18</StatNumber>
                <StatHelpText>
                  <Icon as={FiCheckCircle} color="green.500" />
                  Această lună
                </StatHelpText>
              </Stat>
            </SimpleGrid>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
} 