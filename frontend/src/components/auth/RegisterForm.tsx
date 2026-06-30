import { useMemo, useState } from 'react';
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
} from '@chakra-ui/react';
import AuthService, { RegisterData } from '../../services/AuthService';

type Errors = Partial<Record<keyof RegisterData, string>>;

const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

export default function RegisterForm() {
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const [data, setData] = useState<RegisterData>({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
    });
    const [errors, setErrors] = useState<Errors>({});

    const validate = useMemo(() => {
        const next: Errors = {};

        if (!data.first_name?.trim()) next.first_name = 'Prenumele este obligatoriu';
        if (!data.last_name?.trim()) next.last_name = 'Numele este obligatoriu';

        if (!data.email?.trim()) next.email = 'Email-ul este obligatoriu';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) next.email = 'Adresa de email nu este validă';

        if (!data.password) next.password = 'Parola este obligatorie';
        else if (!strongPasswordRegex.test(data.password)) {
            next.password = 'Parola trebuie să aibă minim 8 caractere și să conțină literă mare, literă mică, număr și caracter special';
        }

        return next;
    }, [data]);

    const onSubmit = async () => {
        try {
            const nextErrors = validate;
            setErrors(nextErrors);
            if (Object.keys(nextErrors).length > 0) return;

            setIsLoading(true);
            await AuthService.register(data);
            toast({
                title: 'Cont creat cu succes',
                description: 'Vă rugăm să verificați email-ul pentru a activa contul.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
        } catch (error: any) {
            toast({
                title: 'Eroare',
                description: error.response?.data?.message || 'A apărut o eroare la înregistrare',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg" boxShadow="lg">
            <Text fontSize="2xl" fontWeight="bold" mb={6} textAlign="center">
                Înregistrare
            </Text>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    onSubmit();
                }}
            >
                <VStack spacing={4}>
                    <FormControl isInvalid={!!errors.first_name}>
                        <FormLabel>Prenume</FormLabel>
                        <Input value={data.first_name || ''} onChange={(e) => setData(prev => ({ ...prev, first_name: e.target.value }))} />
                        <FormErrorMessage>{errors.first_name}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.last_name}>
                        <FormLabel>Nume</FormLabel>
                        <Input value={data.last_name || ''} onChange={(e) => setData(prev => ({ ...prev, last_name: e.target.value }))} />
                        <FormErrorMessage>{errors.last_name}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.email}>
                        <FormLabel>Email</FormLabel>
                        <Input type="email" value={data.email || ''} onChange={(e) => setData(prev => ({ ...prev, email: e.target.value }))} />
                        <FormErrorMessage>{errors.email}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.password}>
                        <FormLabel>Parolă</FormLabel>
                        <Input type="password" value={data.password || ''} onChange={(e) => setData(prev => ({ ...prev, password: e.target.value }))} />
                        <FormErrorMessage>{errors.password}</FormErrorMessage>
                    </FormControl>

                    <Button
                        type="submit"
                        colorScheme="blue"
                        size="lg"
                        width="full"
                        isLoading={isLoading}
                    >
                        Înregistrare
                    </Button>
                </VStack>
            </form>
        </Box>
    );
} 