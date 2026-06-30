import { Box } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Navbar from './layout/Navbar';

export default function Layout() {
    return (
        <Box minH="100vh">
            <Navbar />
            <Box pt="60px" px={4}>
                <Outlet />
            </Box>
        </Box>
    );
} 