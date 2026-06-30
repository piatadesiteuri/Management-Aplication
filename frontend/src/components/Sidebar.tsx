import { Box, VStack, Icon, Text, Link } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiHome, FiUsers, FiFileText, FiSettings } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';

interface NavItemProps {
  icon: typeof FiHome;
  children: string;
  to: string;
}

const NavItem = ({ icon, children, to }: NavItemProps) => (
  <Link
    as={RouterLink}
    to={to}
    style={{ textDecoration: 'none' }}
    _focus={{ boxShadow: 'none' }}
  >
    <Box
      display="flex"
      alignItems="center"
      p="4"
      mx="4"
      borderRadius="lg"
      role="group"
      cursor="pointer"
      _hover={{
        bg: 'cyan.400',
        color: 'white',
      }}
    >
      <Icon
        mr="4"
        fontSize="16"
        as={icon}
      />
      <Text>{children}</Text>
    </Box>
  </Link>
);

export const Sidebar = () => {
  const { user } = useAuth();
  
  return (
    <Box
      bg="white"
      w="60"
      h="full"
      borderRight="1px"
      borderRightColor="gray.200"
      pos="fixed"
      boxShadow="sm"
    >
      <VStack spacing="8" align="stretch" py="8">
        <Box>
          <Text fontSize="2xl" fontWeight="bold" textAlign="center" mb="8">
            DSP Dolj
          </Text>
          <NavItem icon={FiHome} to="/admin/dashboard">
            Dashboard
          </NavItem>
          <NavItem icon={FiUsers} to="/admin/users">
            Utilizatori
          </NavItem>
          <NavItem icon={FiFileText} to="/admin/documents">
            Documente
          </NavItem>
          <NavItem icon={FiSettings} to="/admin/settings">
            Setări
          </NavItem>
        </Box>
      </VStack>
    </Box>
  );
}; 