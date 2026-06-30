import { useState } from 'react';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    VStack,
    Text,
    useToast,
    FormErrorMessage,
    Link,
    useColorModeValue,
    InputGroup,
    InputLeftElement,
} from '@chakra-ui/react';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import AuthService from '../../services/AuthService';
import { useNavigate } from 'react-router-dom';

interface LoginData {
    email: string;
    password: string;
}

export default function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const toast = useToast();
    const navigate = useNavigate();

    // Theme colors
    const bgColor = useColorModeValue('gray.900', 'gray.900');
    const cardBg = useColorModeValue('gray.800', 'gray.800');
    const textColor = useColorModeValue('white', 'white');
    const mutedTextColor = useColorModeValue('gray.400', 'gray.400');
    const borderColor = useColorModeValue('gray.700', 'gray.700');
    const primaryColor = 'blue.400';

    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {};
        
        if (!email) {
            newErrors.email = 'Email-ul este obligatoriu';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email-ul nu este valid';
        }
        
        if (!password) {
            newErrors.password = 'Parola este obligatorie';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            setIsLoading(true);
            const response = await AuthService.login(email, password);
            toast({
                title: 'Autentificare reușită',
                description: `Bine ai venit, ${response.user.firstName}!`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            navigate('/dashboard');
        } catch (error: any) {
            toast({
                title: 'Eroare',
                description: error.response?.data?.message || 'A apărut o eroare la autentificare',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box 
            maxW="md" 
            mx="auto" 
            mt={8} 
            p={8} 
            bg={cardBg}
            borderWidth={1} 
            borderColor={borderColor}
            borderRadius="xl" 
            boxShadow="2xl"
        >
            <Text fontSize="2xl" fontWeight="bold" mb={6} textAlign="center" color={textColor}>
                Autentificare
            </Text>
            <form onSubmit={onSubmit}>
                <VStack spacing={6}>
                    <FormControl isInvalid={!!errors.email}>
                        <FormLabel color={textColor}>Email</FormLabel>
                        <InputGroup>
                            <InputLeftElement pointerEvents="none">
                                <FaEnvelope color={mutedTextColor} />
                            </InputLeftElement>
                            <Input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                bg={bgColor}
                                borderColor={borderColor}
                                color={textColor}
                                _focus={{
                                    borderColor: primaryColor,
                                    boxShadow: `0 0 0 1px ${primaryColor}`
                                }}
                                _placeholder={{ color: mutedTextColor }}
                            />
                        </InputGroup>
                        <FormErrorMessage>{errors.email}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.password}>
                        <FormLabel color={textColor}>Parolă</FormLabel>
                        <InputGroup>
                            <InputLeftElement pointerEvents="none">
                                <FaLock color={mutedTextColor} />
                            </InputLeftElement>
                            <Input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                bg={bgColor}
                                borderColor={borderColor}
                                color={textColor}
                                _focus={{
                                    borderColor: primaryColor,
                                    boxShadow: `0 0 0 1px ${primaryColor}`
                                }}
                                _placeholder={{ color: mutedTextColor }}
                            />
                        </InputGroup>
                        <FormErrorMessage>{errors.password}</FormErrorMessage>
                    </FormControl>

                    <Button
                        type="submit"
                        bgGradient="linear(to-r, blue.500, blue.600)"
                        color="white"
                        size="lg"
                        width="full"
                        isLoading={isLoading}
                        _hover={{ 
                            bgGradient: 'linear(to-r, blue.600, blue.700)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}
                        _active={{
                            transform: 'translateY(0)',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                        }}
                        transition="all 0.3s ease"
                    >
                        Autentificare
                    </Button>

                    <Text mt={4} color={mutedTextColor}>
                        Nu ai cont?{' '}
                        <Link color={primaryColor} onClick={() => navigate('/register')}>
                            Înregistrează-te
                        </Link>
                    </Text>
                </VStack>
            </form>
        </Box>
    );
} 