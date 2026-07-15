import { useState, useEffect } from 'react';
import {
  FormControl,
  FormLabel,
  HStack,
  Text,
  Alert,
  AlertIcon,
  Box,
  useColorModeValue,
  Input,
} from '@chakra-ui/react';

interface TimeRangePickerProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  size?: string;
}

export default function TimeRangePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  size = 'sm',
}: TimeRangePickerProps) {
  const [warning, setWarning] = useState<string>('');
  const [duration, setDuration] = useState<string>('');

  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const inputSize = size === 'lg' ? 'md' : 'sm';

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

    if (endTime && time) {
      const start = new Date(`2000-01-01T${time}:00`);
      const end = new Date(`2000-01-01T${endTime}:00`);

      if (end <= start) {
        const newEnd = new Date(start.getTime() + 60 * 60 * 1000);
        onEndTimeChange(newEnd.toTimeString().slice(0, 5));
      }
    }
  };

  return (
    <Box>
      <HStack spacing={3} align="flex-end">
        <FormControl flex={1}>
          <FormLabel fontSize="sm" mb={1} color={mutedTextColor}>
            Ora început
          </FormLabel>
          <Input
            type="time"
            size={inputSize}
            value={startTime}
            onChange={(e) => handleStartTimeChange(e.target.value)}
            min="07:00"
            max="20:00"
          />
        </FormControl>
        <Text color={mutedTextColor} pb={2} fontSize="sm">
          —
        </Text>
        <FormControl flex={1}>
          <FormLabel fontSize="sm" mb={1} color={mutedTextColor}>
            Ora sfârșit
          </FormLabel>
          <Input
            type="time"
            size={inputSize}
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            min="07:00"
            max="20:00"
          />
        </FormControl>
      </HStack>

      {duration && !warning && (
        <Text fontSize="sm" color={mutedTextColor} mt={2}>
          Durată: {duration} ({startTime} – {endTime})
        </Text>
      )}

      {warning && (
        <Alert status="warning" size="sm" mt={2} borderRadius="md">
          <AlertIcon />
          {warning}
        </Alert>
      )}
    </Box>
  );
}
