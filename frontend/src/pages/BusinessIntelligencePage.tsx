import React from 'react';
import { Box } from '@chakra-ui/react';
import ExecutiveDashboard from '../components/dashboard/ExecutiveDashboard';
import { useAuth } from '../hooks/useAuth';

export default function BusinessIntelligencePage() {
  const { user } = useAuth();

  return (
    <Box>
      <ExecutiveDashboard user={user} />
    </Box>
  );
} 