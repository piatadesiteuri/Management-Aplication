import { Box, Flex, Text, Button, useColorMode, IconButton, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import { FiMoon, FiSun, FiUser, FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';

export const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logout } = useAuth();

  return (
    <Box
      bg="white"
      px="4"
      borderBottom="1px"
      borderBottomColor="gray.200"
      position="sticky"
      top="0"
      zIndex="sticky"
    >
      <Flex h="16" alignItems="center" justifyContent="space-between">
        <Text fontSize="lg" fontWeight="semibold">
          {/* Titlul paginii curente poate fi adăugat aici */}
        </Text>

        <Flex alignItems="center">
          <IconButton
            mr="4"
            aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
            icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
            onClick={toggleColorMode}
          />

          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<FiUser />}
              variant="ghost"
            >
              {user?.email}
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FiUser />}>Profil</MenuItem>
              <MenuItem icon={<FiLogOut />} onClick={logout}>
                Deconectare
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
    </Box>
  );
}; 