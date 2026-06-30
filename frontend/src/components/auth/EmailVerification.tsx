import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    VStack,
    Text,
    useToast,
    PinInput,
    PinInputField,
    HStack,
} from '@chakra-ui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthService from '../../services/AuthService';

export default function EmailVerification() {
    const [isLoading, setIsLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const toast = useToast();
    const navigate = useNavigate();
    const [token, setToken] = useState('');

    useEffect(() => {
        const urlToken = searchParams.get('token');
        if (urlToken) {
            verifyEmail(urlToken);
        }
    }, [searchParams]);

    const verifyEmail = async (verificationToken: string) => {
        try {
            setIsLoading(true);
            await AuthService.verifyEmail(verificationToken);
            toast({
                title: 'Email verificat cu succes',
                description: 'Contul tău a fost activat. Te poți autentifica acum.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            navigate('/login');
        } catch (error: any) {
            toast({
                title: 'Eroare',
                description: error.response?.data?.message || 'A apărut o eroare la verificarea email-ului',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePinComplete = (value: string) => {
        verifyEmail(value);
    };

    return (
        <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg" boxShadow="lg">
            <VStack spacing={6}>
                <Text fontSize="2xl" fontWeight="bold" textAlign="center">
                    Verificare Email
                </Text>

                <Text textAlign="center">
                    Introduceți codul de verificare primit pe email
                </Text>

                <HStack>
                    <PinInput
                        otp
                        size="lg"
                        value={token}
                        onChange={setToken}
                        onComplete={handlePinComplete}
                    >
                        <PinInputField />
                        <PinInputField />
                        <PinInputField />
                        <PinInputField />
                        <PinInputField />
                        <PinInputField />
                    </PinInput>
                </HStack>

                <Button
                    colorScheme="blue"
                    size="lg"
                    width="full"
                    isLoading={isLoading}
                    onClick={() => token.length === 6 && verifyEmail(token)}
                >
                    Verifică
                </Button>

                <Text fontSize="sm" color="gray.500">
                    Nu ai primit codul? Verifică și în folderul Spam
                </Text>
            </VStack>
        </Box>
    );
} 