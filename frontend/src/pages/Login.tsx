import {
  Box,
  Button,
  Input,
  Stack,
  Text,
  Flex,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  FormControl,
  FormErrorMessage,
  useToast,
} from '@chakra-ui/react';
import { useState } from 'react';
import { FaFacebookF, FaGoogle, FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { keyframes } from '@emotion/react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const MotionFlex = motion(Flex);
const MotionBox = motion(Box);

// Keyframes pentru animația de plutire
const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const floatAnimation = `${float} 6s ease-in-out infinite`;

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Culori temă
  const bgColor = useColorModeValue('gray.900', 'gray.900');
  const cardBg = useColorModeValue('gray.800', 'gray.800');
  const textColor = useColorModeValue('white', 'white');
  const mutedTextColor = useColorModeValue('gray.400', 'gray.400');
  const borderColor = useColorModeValue('gray.700', 'gray.700');
  const primaryColor = 'blue.400';

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; name?: string } = {};

    if (!email) {
      newErrors.email = 'Email-ul este obligatoriu';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email-ul nu este valid';
    }

    if (!password) {
      newErrors.password = 'Parola este obligatorie';
    } else if (password.length < 6) {
      newErrors.password = 'Parola trebuie să aibă cel puțin 6 caractere';
    }

    if (isSignUp && !name) {
      newErrors.name = 'Numele este obligatoriu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    console.log('🔑 Login form submitted:', { email, password: password ? '***' : 'empty' });

    try {
      const user = await login(email, password);
      console.log('✅ Login successful, user:', user);
      console.log('🔍 User roles:', user?.roles);

      toast({
        title: 'Autentificare reușită',
        description: `Bine ai venit, ${user?.first_name || user?.name || 'Utilizator'}!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Redirecționare bazată pe rol
      if (user && user.roles && user.roles.some(role => ['ADMIN', 'SUPER_ADMIN'].includes(role))) {
        console.log('🚀 Redirecting to admin dashboard');
        navigate('/admin/dashboard');
      } else {
        console.log('🚀 Redirecting to user dashboard');
        navigate('/user/dashboard');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      toast({
        title: 'Eroare la autentificare',
        description: error.response?.data?.message || 'A apărut o eroare la autentificare',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      minH="100vh"
      w="100%"
      bg={bgColor}
      py={8}
      px={4}
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      overflowX="hidden"
      overflowY="auto"
    >
      {/* Forme geometrice decorative - fundal, ancorate de tot ecranul (corect) */}
      <MotionBox
        position="absolute"
        bottom="-5%"
        left="-5%"
        w="400px"
        h="400px"
        bgGradient="linear(to-br, blue.600, blue.800)"
        borderRadius="63% 37% 54% 46% / 55% 48% 52% 45%"
        zIndex={0}
        animation={floatAnimation}
        opacity={0.1}
        pointerEvents="none"
      />

      <MotionBox
        position="absolute"
        top="-5%"
        right="-5%"
        w="300px"
        h="300px"
        bgGradient="linear(to-bl, blue.500, blue.700)"
        borderRadius="42% 58% 40% 60% / 55% 45% 55% 45%"
        zIndex={0}
        animation={floatAnimation}
        opacity={0.1}
        pointerEvents="none"
      />

      <MotionBox
        position="absolute"
        top="20%"
        left="15%"
        w="100px"
        h="100px"
        bgGradient="linear(to-r, blue.400, blue.600)"
        borderRadius="63% 37% 54% 46% / 55% 48% 52% 45%"
        opacity={0.05}
        animation={floatAnimation}
        pointerEvents="none"
      />

      <MotionBox
        position="absolute"
        bottom="20%"
        right="15%"
        w="150px"
        h="150px"
        bgGradient="linear(to-l, blue.400, blue.600)"
        borderRadius="42% 58% 40% 60% / 55% 45% 55% 45%"
        opacity={0.05}
        animation={floatAnimation}
        pointerEvents="none"
      />

      {/* CARDUL — centrat de flexbox-ul de mai sus (align/justify center).
          NU mai are position="absolute": e "relative" doar ca să servească
          drept punct de referință pentru panoul albastru și formular. */}
      <Box
        position="relative"
        zIndex={1}
        w={{ base: '100%', sm: '480px', md: '800px' }}
        maxW="95vw"
        minH={{ base: '620px', md: '550px' }}
        bg={cardBg}
        borderRadius="2xl"
        overflow="hidden"
        boxShadow="2xl"
        border="1px solid"
        borderColor={borderColor}
      >
        {/* Panoul albastru — vizibil doar pe desktop, culisează stânga/dreapta
            relativ la card (nu la ecran) */}
        <MotionFlex
          display={{ base: 'none', md: 'flex' }}
          position="absolute"
          top={0}
          left={0}
          w="50%"
          h="100%"
          bgGradient="linear(to-br, blue.600, blue.800)"
          direction="column"
          justify="center"
          align="center"
          p={10}
          color="white"
          textAlign="center"
          zIndex={2}
          initial={false}
          animate={{ x: isSignUp ? '100%' : '0%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            maxW="320px"
          >
            <Text
              fontSize="3xl"
              fontWeight="bold"
              mb={4}
              textShadow="0 2px 4px rgba(0,0,0,0.3)"
            >
              {isSignUp ? 'Bine ai revenit!' : 'Bine ai venit!'}
            </Text>
            <Text
              fontSize="md"
              mb={8}
              opacity={0.9}
              letterSpacing="wide"
            >
              {isSignUp
                ? 'Pentru a rămâne conectat cu noi, te rugăm să te autentifici cu informațiile tale personale'
                : 'Introdu detaliile tale personale și începe călătoria cu noi'}
            </Text>
            <Button
              size="lg"
              variant="outline"
              color="white"
              borderColor="white"
              borderWidth={2}
              rounded="full"
              px={12}
              py={6}
              _hover={{
                bg: 'whiteAlpha.200',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
              transition="all 0.3s ease"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Înregistrare' : 'Autentificare'}
            </Button>
          </MotionBox>
        </MotionFlex>

        {/* Comutator pentru mobil — panoul albastru absolut e ascuns pe ecrane
            mici (ca să nu se suprapună cu formularul), deci avem nevoie de
            un buton simplu pentru a schimba între login/signup */}
        <Flex display={{ base: 'flex', md: 'none' }} justify="center" pt={8}>
          <Button
            variant="link"
            color={primaryColor}
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Ai deja cont? Autentifică-te' : 'Nu ai cont? Înregistrează-te'}
          </Button>
        </Flex>

        {/* Formularul — pe desktop culisează stânga/dreapta relativ la card;
            pe mobil stă static, sub comutator */}
        <Flex
          position={{ base: 'static', md: 'absolute' }}
          top={0}
          left={{ base: '0', md: isSignUp ? '0%' : '50%' }}
          w={{ base: '100%', md: '50%' }}
          h="100%"
          direction="column"
          justify="center"
          align="center"
          p={{ base: 6, md: 12 }}
          zIndex={1}
          transition="left 0.6s cubic-bezier(0.645, 0.045, 0.355, 1)"
        >
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            w="100%"
            maxW="360px"
          >
            <Text
              fontSize="3xl"
              fontWeight="bold"
              color={primaryColor}
              textAlign="center"
              mb={8}
              letterSpacing="tight"
            >
              {isSignUp ? 'Creează Cont' : 'Autentificare'}
            </Text>

            <Stack direction="row" spacing={4} justify="center" mb={8}>
              <Button
                rounded="full"
                w="50px"
                h="50px"
                variant="outline"
                borderColor={borderColor}
                color={mutedTextColor}
                bg={cardBg}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  borderColor: primaryColor,
                  color: primaryColor,
                }}
                transition="all 0.3s ease"
              >
                <FaFacebookF />
              </Button>
              <Button
                rounded="full"
                w="50px"
                h="50px"
                variant="outline"
                borderColor={borderColor}
                color={mutedTextColor}
                bg={cardBg}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  borderColor: primaryColor,
                  color: primaryColor,
                }}
                transition="all 0.3s ease"
              >
                <FaGoogle />
              </Button>
            </Stack>

            <Text
              color={mutedTextColor}
              textAlign="center"
              mb={8}
              letterSpacing="wide"
            >
              sau folosește email-ul pentru {isSignUp ? 'înregistrare' : 'autentificare'}
            </Text>

            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <AnimatePresence>
                  {isSignUp && (
                    <MotionBox
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      overflow="hidden"
                    >
                      <FormControl isInvalid={!!errors.name}>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <FaUser color={mutedTextColor} />
                          </InputLeftElement>
                          <Input
                            placeholder="Nume complet"
                            size="lg"
                            bg={bgColor}
                            borderColor={borderColor}
                            color={textColor}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            _focus={{
                              borderColor: primaryColor,
                              boxShadow: `0 0 0 1px ${primaryColor}`,
                            }}
                            _placeholder={{ color: mutedTextColor }}
                            transition="all 0.3s ease"
                          />
                        </InputGroup>
                        <FormErrorMessage>{errors.name}</FormErrorMessage>
                      </FormControl>
                    </MotionBox>
                  )}
                </AnimatePresence>

                <FormControl isInvalid={!!errors.email}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FaEnvelope color={mutedTextColor} />
                    </InputLeftElement>
                    <Input
                      placeholder="Email"
                      size="lg"
                      bg={bgColor}
                      borderColor={borderColor}
                      color={textColor}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      _focus={{
                        borderColor: primaryColor,
                        boxShadow: `0 0 0 1px ${primaryColor}`,
                      }}
                      _placeholder={{ color: mutedTextColor }}
                      transition="all 0.3s ease"
                    />
                  </InputGroup>
                  <FormErrorMessage>{errors.email}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.password}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FaLock color={mutedTextColor} />
                    </InputLeftElement>
                    <Input
                      placeholder="Parolă"
                      type="password"
                      size="lg"
                      bg={bgColor}
                      borderColor={borderColor}
                      color={textColor}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      _focus={{
                        borderColor: primaryColor,
                        boxShadow: `0 0 0 1px ${primaryColor}`,
                      }}
                      _placeholder={{ color: mutedTextColor }}
                      transition="all 0.3s ease"
                    />
                  </InputGroup>
                  <FormErrorMessage>{errors.password}</FormErrorMessage>
                </FormControl>

                <Button
                  type="submit"
                  size="lg"
                  bgGradient="linear(to-r, blue.500, blue.600)"
                  color="white"
                  rounded="full"
                  _hover={{
                    bgGradient: 'linear(to-r, blue.600, blue.700)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  }}
                  mt={6}
                  transition="all 0.3s ease"
                >
                  {isSignUp ? 'Înregistrare' : 'Autentificare'}
                </Button>
              </Stack>
            </form>
          </MotionBox>
        </Flex>
      </Box>
    </Box>
  );
}