import { useState, useEffect } from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { SupplyService } from '../../services/supply/SupplyService';
import { useAuth } from '../../hooks/useAuth';
import NirDocument from '../supply/NirDocument';

const supplyService = new SupplyService();

interface NirDocumentWithDataProps {
  eventId: number;
  eventTitle?: string;
}

export default function NirDocumentWithData({ eventId, eventTitle }: NirDocumentWithDataProps) {
  const { user } = useAuth();
  const [data, setData] = useState<{ event: any; nir: any; items: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNir = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await supplyService.getTransportOrderNIR(eventId);
        setData(response);
      } catch (err) {
        console.error('❌ Error loading NIR:', err);
        setError('Eroare la încărcarea NIR-ului');
      } finally {
        setLoading(false);
      }
    };

    loadNir();
  }, [eventId]);

  if (loading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="xl" color="blue.500" mb={4} />
        <Text fontSize="lg" color="gray.600">
          Se încarcă NIR-ul...
        </Text>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box textAlign="center" py={8}>
        <Text fontSize="lg" color="red.500" fontWeight="semibold">
          {error || 'NIR indisponibil pentru acest eveniment'}
        </Text>
      </Box>
    );
  }

  const supplierName = data.items?.[0]?.supplier_name || 'Necunoscut';

  return (
    <NirDocument
      event={{ title: data.event?.title || eventTitle }}
      supplierName={supplierName}
      nir={data.nir}
      items={data.items || []}
      userRoles={user?.roles || []}
    />
  );
}
