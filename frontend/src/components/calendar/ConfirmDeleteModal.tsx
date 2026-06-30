import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  VStack,
  HStack,
  Box,
  Icon,
  useColorModeValue,
  Flex,
  Heading,
  Badge,
} from '@chakra-ui/react'
import { FiTrash2, FiAlertTriangle, FiX } from 'react-icons/fi'
import type { CalendarEvent, EventType } from '../../types/calendar'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  event: CalendarEvent | null
  isLoading?: boolean
}

const eventTypeNames: Partial<Record<EventType, string>> = {
  INSPECTION: 'Inspecție',
  TRAVEL: 'Deplasare', 
  MEETING: 'Ședință',
  OTHER: 'Altele',
  TRANSPORT_DELIVERY: 'Transport Livrare',
  TRANSPORT_PICKUP: 'Transport Ridicare',
  SUPPLY_ORDER: 'Comandă Aprovizionare',
  EPIDEMIOLOGICAL_CONTROL: 'Control Epidemiologic',
  MAINTENANCE: 'Întreținere',
  TRAINING: 'Instruire',
  HEALTH_EMERGENCY: 'Urgență Medicală',
  REPORTING: 'Raportare',
  ADMINISTRATIVE: 'Administrativ',
  PUBLIC_HEALTH_ACTION: 'Acțiune Sănătate Publică',
  STOCK_RECEPTION: 'Recepție Stoc',
  STOCK_DISTRIBUTION: 'Distribuție Stoc',
  STOCK_MOVEMENT: 'Mișcare Stoc',
  INVENTORY_AUDIT: 'Audit Inventar'
}

const eventTypeColors: Partial<Record<EventType, string>> = {
  INSPECTION: 'blue',
  TRAVEL: 'green',
  MEETING: 'orange',
  OTHER: 'gray',
  TRANSPORT_DELIVERY: 'purple',
  TRANSPORT_PICKUP: 'purple',
  SUPPLY_ORDER: 'teal',
  EPIDEMIOLOGICAL_CONTROL: 'red',
  MAINTENANCE: 'yellow',
  TRAINING: 'cyan',
  HEALTH_EMERGENCY: 'red',
  REPORTING: 'blue',
  ADMINISTRATIVE: 'gray',
  PUBLIC_HEALTH_ACTION: 'green',
  STOCK_RECEPTION: 'teal',
  STOCK_DISTRIBUTION: 'purple',
  STOCK_MOVEMENT: 'orange',
  INVENTORY_AUDIT: 'pink'
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  event,
  isLoading = false
}: ConfirmDeleteModalProps) {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const overlayBg = useColorModeValue('blackAlpha.600', 'blackAlpha.800')
  
  if (!event) return null

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      isCentered
      motionPreset="slideInBottom"
      size="md"
    >
      <ModalOverlay 
        bg={overlayBg}
        backdropFilter="blur(10px)"
      />
      <ModalContent
        bg={bgColor}
        borderRadius="2xl"
        border="1px solid"
        borderColor={borderColor}
        shadow="2xl"
        mx={4}
        overflow="hidden"
      >
        {/* Header cu gradient și icon */}
        <Box
          bgGradient="linear(135deg, red.500, red.600)"
          color="white"
          p={6}
          position="relative"
        >
          <Flex align="center" justify="space-between">
            <HStack spacing={3}>
              <Box
                bg="whiteAlpha.200"
                borderRadius="full"
                p={3}
                backdropFilter="blur(10px)"
              >
                <Icon as={FiAlertTriangle} boxSize={6} />
              </Box>
              <VStack align="start" spacing={1}>
                <Heading size="md" fontWeight="bold">
                  Confirmare Ștergere
                </Heading>
                <Text fontSize="sm" opacity={0.9}>
                  Această acțiune nu poate fi anulată
                </Text>
              </VStack>
            </HStack>
            <Button
              variant="ghost"
              color="white"
              size="sm"
              borderRadius="full"
              _hover={{ bg: 'whiteAlpha.200' }}
              onClick={onClose}
            >
              <Icon as={FiX} boxSize={5} />
            </Button>
          </Flex>
        </Box>

        <ModalBody p={6}>
          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="medium" textAlign="center">
              Sigur dorești să ștergi acest eveniment?
            </Text>
            
            {/* Event Preview Card */}
            <Box
              bg={useColorModeValue('gray.50', 'gray.700')}
              borderRadius="xl"
              p={4}
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={3} align="start">
                <HStack spacing={3} w="full">
                  <Badge
                    colorScheme={eventTypeColors[event.type] || 'gray'}
                    variant="subtle"
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="xs"
                    fontWeight="medium"
                  >
                    {eventTypeNames[event.type] || event.type}
                  </Badge>
                  <Text fontSize="sm" color="gray.500">
                    {new Date(event.start).toLocaleDateString('ro-RO')}
                  </Text>
                </HStack>
                
                <Text fontSize="lg" fontWeight="semibold">
                  {event.title}
                </Text>
                
                {event.description && (
                  <Text fontSize="sm" color="gray.600" noOfLines={2}>
                    {event.description}
                  </Text>
                )}
                
                <HStack spacing={4} fontSize="sm" color="gray.500">
                  <Text>
                    {new Date(event.start).toLocaleTimeString('ro-RO', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                  <Text>-</Text>
                  <Text>
                    {new Date(event.end).toLocaleTimeString('ro-RO', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            <Box
              bg={useColorModeValue('orange.50', 'orange.900')}
              borderRadius="lg"
              p={3}
              border="1px solid"
              borderColor={useColorModeValue('orange.200', 'orange.700')}
            >
              <HStack spacing={2}>
                <Icon 
                  as={FiAlertTriangle} 
                  color={useColorModeValue('orange.600', 'orange.300')}
                  boxSize={4}
                />
                <Text 
                  fontSize="sm" 
                  color={useColorModeValue('orange.800', 'orange.200')}
                  fontWeight="medium"
                >
                  Atenție: Această acțiune va șterge permanent evenimentul!
                </Text>
              </HStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter bg={useColorModeValue('gray.50', 'gray.700')} p={6}>
          <HStack spacing={3} w="full" justify="end">
            <Button
              variant="ghost"
              onClick={onClose}
              size="lg"
              borderRadius="xl"
              px={6}
              _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
            >
              Anulează
            </Button>
            <Button
              colorScheme="red"
              onClick={onConfirm}
              isLoading={isLoading}
              loadingText="Se șterge..."
              size="lg"
              borderRadius="xl"
              px={6}
              leftIcon={<Icon as={FiTrash2} />}
              bgGradient="linear(135deg, red.500, red.600)"
              _hover={{ 
                bgGradient: "linear(135deg, red.600, red.700)",
                transform: "translateY(-1px)",
                shadow: "lg"
              }}
              _active={{
                transform: "translateY(0)",
                shadow: "md"
              }}
              transition="all 0.2s"
            >
              Șterge Eveniment
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
} 