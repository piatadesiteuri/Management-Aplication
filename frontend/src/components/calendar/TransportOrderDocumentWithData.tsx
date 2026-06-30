import React, { useState, useEffect } from 'react';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';
import { CalendarService } from '../../services/CalendarService';
import { useAuth } from '../../hooks/useAuth';
import TransportOrderDocument from './TransportOrderDocument';

interface TransportOrderDocumentWithDataProps {
  orderData: any;
  supplierData: any;
  eventId: number;
}

export default function TransportOrderDocumentWithData({
  orderData,
  supplierData,
  eventId
}: TransportOrderDocumentWithDataProps) {
  const { user } = useAuth();
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrderItems = async () => {
      try {
        console.log('📦 Loading order items from backend for event:', eventId);
        setLoading(true);
        setError(null);
        
        const calendarService = new CalendarService();
        const items = await calendarService.getEventTransportItems(eventId.toString());
        console.log('📦 Order items loaded from backend:', items);
        console.log('📦 First item details:', items[0]);
        if (items[0]) {
          console.log('📦 Item properties:', Object.keys(items[0]));
          console.log('📦 unitPrice:', items[0].unitPrice);
          console.log('📦 supplierPrice:', items[0].supplierPrice);
          console.log('📦 price:', items[0].price);
        }
        
        setOrderItems(items || []);
      } catch (error) {
        console.error('❌ Error loading order items:', error);
        setError('Eroare la încărcarea produselor');
        setOrderItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrderItems();
  }, [eventId]);

  if (loading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="xl" color="blue.500" mb={4} />
        <Text fontSize="lg" color="gray.600">
          Se încarcă produsele...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={8}>
        <Text fontSize="lg" color="red.500" fontWeight="semibold">
          {error}
        </Text>
      </Box>
    );
  }

  return (
        <TransportOrderDocument
          orderData={orderData}
          supplierData={supplierData}
          orderItems={orderItems}
          userRoles={user?.roles || []}
        />
  );
}
