import { Box, Flex } from '@chakra-ui/react';
import { ReactNode } from 'react';

interface NavIconBadgeProps {
  children: ReactNode;
  count?: string;
}

/** Small count badge positioned on the top-right of a nav icon. */
export function NavIconBadge({ children, count }: NavIconBadgeProps) {
  return (
    <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center" lineHeight={0}>
      {children}
      {count ? (
        <Flex
          position="absolute"
          top="-5px"
          right="-7px"
          minW="15px"
          h="15px"
          px="3px"
          bg="red.500"
          color="white"
          fontSize="9px"
          fontWeight="bold"
          borderRadius="full"
          align="center"
          justify="center"
          lineHeight="1"
          zIndex={1}
          pointerEvents="none"
        >
          {count}
        </Flex>
      ) : null}
    </Box>
  );
}
