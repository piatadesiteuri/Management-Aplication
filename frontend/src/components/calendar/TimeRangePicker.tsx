import { useState, useEffect } from 'react';
import {
  FormControl,
  FormLabel,
  HStack,
  Text,
  Icon,
  Alert,
  AlertIcon,
  Box,
  useColorModeValue,
  VStack,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  SimpleGrid,
  Badge,
  useDisclosure,
  ScaleFade,
  SlideFade,
  useToast,
  Input,
  Divider,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { FiClock, FiArrowRight, FiCheck, FiX, FiPlay, FiPause } from 'react-icons/fi';

// Animații moderne
const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(56, 178, 172, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(56, 178, 172, 0); }
  100% { box-shadow: 0 0 0 0 rgba(56, 178, 172, 0); }
`;



interface TimeRangePickerProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  size?: string;
}

interface TimeOption {
  value: string;
  label: string;
  isPopular?: boolean;
}

export default function TimeRangePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  size = "lg"
}: TimeRangePickerProps) {
  const [warning, setWarning] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [selectedTimeType, setSelectedTimeType] = useState<'start' | 'end'>('start');
  const [manualTime, setManualTime] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const primaryColor = useColorModeValue('teal.500', 'teal.300');
  const secondaryColor = useColorModeValue('blue.500', 'blue.300');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.300');

  // Calculează durata și validează orele
  useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}:00`);
      const end = new Date(`2000-01-01T${endTime}:00`);
      
      if (end <= start) {
        setWarning('Ora de sfârșit trebuie să fie după ora de început');
        setDuration('');
      } else {
        const diffMs = end.getTime() - start.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffHours === 0 && diffMinutes < 15) {
          setWarning('Evenimentul trebuie să dureze cel puțin 15 minute');
        } else if (diffHours > 8) {
          setWarning('Evenimentul pare să dureze foarte mult (peste 8 ore)');
        } else {
          setWarning('');
        }
        
        if (diffHours > 0) {
          setDuration(`${diffHours}h ${diffMinutes}min`);
        } else {
          setDuration(`${diffMinutes}min`);
        }
      }
    } else {
      setWarning('');
      setDuration('');
    }
  }, [startTime, endTime]);

  const handleStartTimeChange = (time: string) => {
    onStartTimeChange(time);
    
    // Auto-ajustează ora de sfârșit dacă este necesar
    if (endTime && time) {
      const start = new Date(`2000-01-01T${time}:00`);
      const end = new Date(`2000-01-01T${endTime}:00`);
      
      if (end <= start) {
        // Adaugă automat 1 oră la ora de început
        const newEnd = new Date(start.getTime() + 60 * 60 * 1000);
        const newEndTime = newEnd.toTimeString().slice(0, 5);
        onEndTimeChange(newEndTime);
      }
    }
  };

  const handleEndTimeChange = (time: string) => {
    onEndTimeChange(time);
  };

  const getTimeOptions = (): TimeOption[] => {
    const options: TimeOption[] = [];
    for (let hour = 7; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const isPopular = (hour === 9 && minute === 0) || 
                         (hour === 14 && minute === 0) || 
                         (hour === 16 && minute === 0);
        
        options.push({
          value: timeStr,
          label: timeStr,
          isPopular
        });
      }
    }
    return options;
  };

  const suggestEndTime = () => {
    if (startTime) {
      const start = new Date(`2000-01-01T${startTime}:00`);
      const suggestedEnd = new Date(start.getTime() + 60 * 60 * 1000); // +1 oră
      return suggestedEnd.toTimeString().slice(0, 5);
    }
    return '';
  };

  const openTimeSelector = (type: 'start' | 'end') => {
    setSelectedTimeType(type);
    setManualTime('');
    onOpen();
  };

  const selectTime = (time: string) => {
    if (selectedTimeType === 'start') {
      handleStartTimeChange(time);
    } else {
      handleEndTimeChange(time);
    }
    onClose();
    
    toast({
      title: `Ora ${selectedTimeType === 'start' ? 'de început' : 'de sfârșit'} setată`,
      description: time,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleManualTimeSubmit = () => {
    // Validare format ora (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(manualTime)) {
      toast({
        title: 'Format invalid',
        description: 'Introduceți ora în format HH:MM (ex: 09:30)',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const [hours, minutes] = manualTime.split(':').map(Number);
    if (hours < 7 || hours > 20) {
      toast({
        title: 'Oră în afara programului',
        description: 'Ora trebuie să fie între 07:00 și 20:00',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    selectTime(manualTime);
  };

  const formatTimeDisplay = (time: string) => {
    if (!time) return 'Selectează ora';
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const timeOptions = getTimeOptions();

  return (
    <FormControl>
      <FormLabel>
        <HStack>
          <Box
            p={2}
            borderRadius="lg"
            bg={`linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`}
            color="white"
            animation={`${pulseGlow} 2s infinite`}
          >
            <Icon as={FiClock} boxSize={5} />
          </Box>
          <Text fontWeight="bold" fontSize="lg">Program Eveniment</Text>
        </HStack>
      </FormLabel>
      
      <VStack spacing={6} align="stretch">
        {/* Selector de ore modern */}
        <HStack spacing={4} align="stretch">
          {/* Ora de început */}
          <Box flex={1}>
            <Text fontSize="sm" fontWeight="semibold" mb={2} color={mutedTextColor}>
              Ora Început
            </Text>
            <Button
              w="full"
              h="60px"
              variant="outline"
              borderWidth="2px"
              borderRadius="xl"
              borderColor={startTime ? primaryColor : borderColor}
              bg={startTime ? `${primaryColor}10` : cardBg}
              _hover={{
                borderColor: primaryColor,
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}
              transition="all 0.3s"
              onClick={() => openTimeSelector('start')}
              position="relative"
              overflow="hidden"
            >
              <HStack spacing={3}>
                <Icon as={FiPlay} color={primaryColor} boxSize={5} />
                <Text fontSize="lg" fontWeight="bold" color={startTime ? primaryColor : 'gray.600'}>
                  {formatTimeDisplay(startTime)}
                </Text>
              </HStack>
              {startTime && (
                <Box
                  position="absolute"
                  top={2}
                  right={2}
                  w="8px"
                  h="8px"
                  borderRadius="full"
                  bg={primaryColor}
                  animation={`${pulseGlow} 2s infinite`}
                />
              )}
            </Button>
          </Box>
          
          {/* Săgeată animată */}
          <Box display="flex" alignItems="center" px={2}>
            <Box
              p={3}
              borderRadius="full"
              bg={`linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`}
              color="white"
              animation={`${pulseGlow} 2s infinite`}
            >
              <Icon as={FiArrowRight} boxSize={5} />
            </Box>
          </Box>
          
          {/* Ora de sfârșit */}
          <Box flex={1}>
            <Text fontSize="sm" fontWeight="semibold" mb={2} color={mutedTextColor}>
              Ora Sfârșit
            </Text>
            <Button
              w="full"
              h="60px"
              variant="outline"
              borderWidth="2px"
              borderRadius="xl"
              borderColor={endTime ? secondaryColor : borderColor}
              bg={endTime ? `${secondaryColor}10` : cardBg}
              _hover={{
                borderColor: secondaryColor,
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}
              transition="all 0.3s"
              onClick={() => openTimeSelector('end')}
              position="relative"
              overflow="hidden"
            >
              <HStack spacing={3}>
                <Icon as={FiPause} color={secondaryColor} boxSize={5} />
                <Text fontSize="lg" fontWeight="bold" color={endTime ? secondaryColor : mutedTextColor}>
                  {formatTimeDisplay(endTime)}
                </Text>
              </HStack>
              {endTime && (
                <Box
                  position="absolute"
                  top={2}
                  right={2}
                  w="8px"
                  h="8px"
                  borderRadius="full"
                  bg={secondaryColor}
                  animation={`${pulseGlow} 2s infinite`}
                />
              )}
            </Button>
          </Box>
        </HStack>
        
        {/* Durată și status */}
        {duration && (
          <ScaleFade in={true}>
            <Box
              p={4}
              borderRadius="2xl"
              bg={`linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`}
              border="2px solid"
              borderColor={warning ? 'orange.200' : 'green.200'}
              textAlign="center"
            >
              <HStack justify="center" spacing={3}>
                <Box
                  p={2}
                  borderRadius="full"
                  bg={warning ? 'orange.500' : 'green.500'}
                  color="white"
                >
                  <Icon as={warning ? FiX : FiCheck} boxSize={4} />
                </Box>
                <VStack spacing={0} align="start">
                  <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">
                    Durată Eveniment
                  </Text>
                  <Text fontSize="xl" fontWeight="bold" color={warning ? 'orange.600' : 'green.600'}>
                    {duration}
                  </Text>
                  {startTime && endTime && (
                    <Text fontSize="sm" color={mutedTextColor}>
                      {startTime} - {endTime}
                    </Text>
                  )}
                </VStack>
              </HStack>
            </Box>
          </ScaleFade>
        )}
        
        {/* Avertismente */}
        {warning && (
          <SlideFade in={true}>
            <Alert 
              status="warning" 
              borderRadius="xl"
              border="2px solid"
              borderColor="orange.200"
              bg="orange.50"
            >
              <AlertIcon />
              <Text fontSize="sm" fontWeight="medium">{warning}</Text>
            </Alert>
          </SlideFade>
        )}
        
        {/* Sugestie */}
        {startTime && !endTime && (
          <Box
            p={3}
            borderRadius="xl"
            bg={`linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)`}
            border="1px solid"
            borderColor={`${primaryColor}30`}
          >
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              💡 Sugestie: Ora de sfârșit {suggestEndTime()}
            </Text>
          </Box>
        )}
      </VStack>

      {/* Modal pentru selecția orei */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.300" />
        <ModalContent borderRadius="2xl" overflow="hidden" maxH="80vh">
          <ModalHeader 
            bg={`linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`}
            color="white"
            textAlign="center"
            py={4}
          >
            <HStack justify="center" spacing={3}>
              <Icon as={FiClock} boxSize={5} />
              <Text fontSize="lg" fontWeight="bold">
                Selectează {selectedTimeType === 'start' ? 'ora de început' : 'ora de sfârșit'}
              </Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          
          <ModalBody py={4} maxH="60vh" overflowY="auto">
            <VStack spacing={4} align="stretch">
              {/* Input manual pentru ora */}
              <Box
                p={4}
                borderRadius="xl"
                bg={useColorModeValue('gray.50', 'gray.700')}
                border="2px solid"
                borderColor={borderColor}
              >
                <Text fontSize="sm" fontWeight="semibold" mb={3} color="gray.600">
                  📝 Introducere manuală
                </Text>
                <HStack spacing={3}>
                  <Input
                    placeholder="HH:MM (ex: 09:30)"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    borderRadius="lg"
                    borderWidth="2px"
                    _focus={{
                      borderColor: primaryColor,
                      boxShadow: `0 0 0 1px ${primaryColor}`,
                    }}
                  />
                  <Button
                    onClick={handleManualTimeSubmit}
                    colorScheme="teal"
                    borderRadius="lg"
                    px={4}
                    isDisabled={!manualTime.trim()}
                    _hover={{
                      transform: 'scale(1.05)',
                    }}
                    transition="all 0.2s"
                  >
                    Setează
                  </Button>
                </HStack>
                <Text fontSize="xs" color="gray.500" mt={2}>
                  Format: HH:MM (07:00 - 20:00)
                </Text>
              </Box>

              <Divider />

              {/* Grid cu ore predefinite */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={3} color="gray.600">
                  ⚡ Ore rapide
                </Text>
                <SimpleGrid columns={3} spacing={2}>
                  {timeOptions.map((option) => (
                    <Button
                      key={option.value}
                      h="40px"
                      variant="outline"
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={option.isPopular ? primaryColor : borderColor}
                      bg={option.isPopular ? `${primaryColor}10` : cardBg}
                      _hover={{
                        borderColor: primaryColor,
                        transform: 'scale(1.05)',
                        boxShadow: 'md',
                      }}
                      transition="all 0.2s"
                      onClick={() => selectTime(option.value)}
                      position="relative"
                      fontSize="sm"
                    >
                      <HStack spacing={1}>
                        <Text fontWeight="medium">
                          {option.label}
                        </Text>
                        {option.isPopular && (
                          <Text color={primaryColor} fontSize="xs">★</Text>
                        )}
                      </HStack>
                    </Button>
                  ))}
                </SimpleGrid>
              </Box>
            </VStack>
          </ModalBody>
          
          <ModalFooter borderTopWidth="1px" borderColor={borderColor} py={3}>
            <Button variant="ghost" onClick={onClose} size="sm">
              Închide
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </FormControl>
  );
} 