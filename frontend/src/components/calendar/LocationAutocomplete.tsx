import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  Box,
  List,
  ListItem,
  Text,
  Icon,
  HStack,
  VStack,
  Button,
  useColorModeValue,
  Spinner,
  InputGroup,
  InputRightElement,
  IconButton,
  Portal,
  useToast,
  Card,
  CardBody,
  Badge,
  ScaleFade,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { FiMapPin, FiExternalLink, FiX, FiSearch, FiNavigation } from 'react-icons/fi';
import { debounce } from 'lodash';

// Animații moderne
const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(56, 178, 172, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(56, 178, 172, 0); }
  100% { box-shadow: 0 0 0 0 rgba(56, 178, 172, 0); }
`;

const slideInUp = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

interface LocationSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export default function LocationAutocomplete({ value, onChange, onBlur }: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedCoordinates, setSelectedCoordinates] = useState<{lat: string, lon: string} | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  const primaryColor = useColorModeValue('teal.500', 'teal.300');
  const secondaryColor = useColorModeValue('blue.500', 'blue.300');
  const textColor = useColorModeValue('gray.800', 'white');
  const placeholderColor = useColorModeValue('gray.500', 'gray.400');

  const fetchSuggestions = useCallback(
    debounce(async (input: string) => {
      if (!input || input.length < 2) return; // Redus la 2 caractere

      try {
        setLoading(true);
        
        // Căutare mai flexibilă - fără a forța "Romania" la sfârșit
        const searchQuery = input.trim();
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=8&accept-language=ro&countrycodes=ro`,
          {
            headers: {
              'Accept-Language': 'ro',
              'User-Agent': 'DSPD-Application/1.0'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        
        // Filtrare și sortare pentru rezultate mai relevante
        const filteredData = data
          .filter((item: any) => {
            const displayName = item.display_name.toLowerCase();
            const searchTerms = searchQuery.toLowerCase().split(' ');
            
            // Verifică dacă toate cuvintele din căutare sunt prezente în rezultat
            return searchTerms.every(term => displayName.includes(term));
          })
          .slice(0, 6); // Limitează la 6 rezultate
        
        setSuggestions(filteredData);
        setIsOpen(filteredData.length > 0);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        toast({
          title: 'Eroare la încărcarea locațiilor',
          description: 'Nu s-au putut încărca sugestiile. Încercați din nou.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    }, 200), // Redus debounce la 200ms pentru răspuns mai rapid
    [toast]
  );

  useEffect(() => {
    if (value && value.length >= 2) {
      fetchSuggestions(value);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [value, fetchSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('📍 LocationAutocomplete handleInputChange:', newValue);
    onChange(newValue);
    setSelectedLocation('');
    setSelectedCoordinates(null); // Reset coordinates when manual input
    
    // Afișează sugestiile imediat dacă există deja
    if (newValue.length >= 2 && suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleFocus = () => {
    // Afișează sugestiile existente când se focus-ează input-ul
    if (value.length >= 2 && suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    console.log('📍 LocationAutocomplete handleSuggestionClick:', suggestion.display_name);
    onChange(suggestion.display_name);
    setSelectedLocation(suggestion.display_name);
    setSelectedCoordinates({ lat: suggestion.lat, lon: suggestion.lon });
    setIsOpen(false);
    
    toast({
      title: 'Locație selectată! 📍',
      description: suggestion.display_name,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleClear = () => {
    onChange('');
    setSelectedLocation('');
    setSelectedCoordinates(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
    onBlur?.();
  };

  const openInMaps = () => {
    if (selectedCoordinates) {
      // Folosim coordonatele exacte pentru poziționare precisă
      const lat = selectedCoordinates.lat;
      const lon = selectedCoordinates.lon;
      window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=16`, '_blank');
    } else if (value) {
      // Fallback la căutare text dacă nu avem coordonate
      const encodedLocation = encodeURIComponent(value);
      window.open(`https://www.openstreetmap.org/search?query=${encodedLocation}`, '_blank');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        listRef.current &&
        !listRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <FormControl position="relative">
      <FormLabel>
        <HStack spacing={3}>
          <Box
            p={2}
            borderRadius="lg"
            bg={`linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`}
            color="white"
            animation={`${pulseGlow} 2s infinite`}
          >
            <Icon as={FiMapPin} boxSize={5} />
          </Box>
          <Text fontWeight="bold" fontSize="lg" color={textColor}>
            Locație Eveniment
          </Text>
        </HStack>
      </FormLabel>
      
      <Box position="relative">
        <InputGroup>
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Introduceți adresa completă..."
            pr="4.5rem"
            size="lg"
            borderRadius="xl"
            borderWidth="2px"
            borderColor={value ? primaryColor : borderColor}
            bg={bgColor}
            color={textColor}
            _placeholder={{ color: placeholderColor }}
            _focus={{
              borderColor: primaryColor,
              boxShadow: `0 0 0 1px ${primaryColor}`,
            }}
            _hover={{
              borderColor: secondaryColor,
            }}
            transition="all 0.3s"
          />
          <InputRightElement width="4.5rem" h="full">
            {loading ? (
              <Spinner size="sm" color={primaryColor} />
            ) : value ? (
              <IconButton
                aria-label="Șterge locația"
                icon={<FiX />}
                size="sm"
                variant="ghost"
                onClick={handleClear}
                color={textColor}
                _hover={{
                  bg: hoverBgColor,
                  transform: 'scale(1.1)',
                }}
                transition="all 0.2s"
              />
            ) : (
              <Icon as={FiSearch} color={placeholderColor} />
            )}
          </InputRightElement>
        </InputGroup>

        {isOpen && suggestions.length > 0 && (
          <Portal>
            <Box
              ref={listRef}
              position="fixed"
              width={inputRef.current?.offsetWidth || "100%"}
              left={inputRef.current?.getBoundingClientRect().left || 0}
              top={(inputRef.current?.getBoundingClientRect().bottom || 0) + 8}
              zIndex={9999}
              bg={bgColor}
              borderWidth="2px"
              borderColor={primaryColor}
              borderRadius="xl"
              boxShadow="0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)"
              maxH="300px"
              overflowY="auto"
              animation={`${slideInUp} 0.3s ease-out`}
              _before={{
                content: '""',
                position: 'absolute',
                top: '-8px',
                left: '20px',
                width: '0',
                height: '0',
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: `8px solid ${bgColor}`,
                zIndex: 1,
              }}
              _after={{
                content: '""',
                position: 'absolute',
                top: '-10px',
                left: '20px',
                width: '0',
                height: '0',
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderBottom: `10px solid ${primaryColor}`,
                zIndex: 0,
              }}
            >
              <List spacing={0}>
                {suggestions.map((suggestion, index) => (
                  <ListItem
                    key={suggestion.place_id}
                    px={4}
                    py={3}
                    cursor="pointer"
                    _hover={{ 
                      bg: hoverBgColor,
                      transform: 'translateX(4px)',
                    }}
                    transition="all 0.2s"
                    borderBottomWidth={index < suggestions.length - 1 ? "1px" : "0"}
                    borderBottomColor={borderColor}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <HStack spacing={3}>
                      <Box
                        p={1}
                        borderRadius="full"
                        bg={`${primaryColor}20`}
                        color={primaryColor}
                      >
                        <Icon as={FiMapPin} boxSize={3} />
                      </Box>
                      <VStack align="start" spacing={0} flex={1}>
                        <Text 
                          fontSize="sm" 
                          fontWeight="medium"
                          color={textColor}
                          noOfLines={2}
                        >
                          {suggestion.display_name}
                        </Text>
                        <Badge 
                          size="sm" 
                          colorScheme="teal" 
                          variant="subtle"
                          mt={1}
                        >
                          {suggestion.type}
                        </Badge>
                      </VStack>
                    </HStack>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Portal>
        )}
      </Box>

      {selectedLocation && (
        <ScaleFade in={true}>
          <Card 
            mt={4} 
            borderRadius="xl"
            border="2px solid"
            borderColor={`${primaryColor}30`}
            bg={`${primaryColor}10`}
            overflow="hidden"
          >
            <CardBody p={4}>
              <HStack justify="space-between" align="start">
                <VStack align="start" spacing={2} flex={1}>
                  <HStack spacing={2}>
                    <Box
                      p={1}
                      borderRadius="full"
                      bg={primaryColor}
                      color="white"
                    >
                      <Icon as={FiMapPin} boxSize={3} />
                    </Box>
                    <Text fontSize="sm" fontWeight="bold" color={textColor}>
                      Locație selectată
                    </Text>
                  </HStack>
                  <Text 
                    fontSize="sm" 
                    color={textColor}
                    bg={bgColor}
                    p={3}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={borderColor}
                    w="full"
                  >
                    {selectedLocation}
                  </Text>
                </VStack>
                <Button
                  size="sm"
                  variant="solid"
                  colorScheme="teal"
                  onClick={openInMaps}
                  leftIcon={<FiNavigation />}
                  borderRadius="lg"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                  }}
                  transition="all 0.2s"
                >
                  Vezi pe hartă
                </Button>
              </HStack>
            </CardBody>
          </Card>
        </ScaleFade>
      )}
    </FormControl>
  );
} 