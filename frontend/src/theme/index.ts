import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const colors = {
  brand: {
    primary: {
      50: '#E3F2FD',
      100: '#BBDEFB',
      200: '#90CAF9',
      300: '#64B5F6',
      400: '#42A5F5',
      500: '#2196F3',
      600: '#1E88E5',
      700: '#1976D2',
      800: '#1565C0',
      900: '#0D47A1',
    },
    secondary: {
      50: '#ECEFF1',
      100: '#CFD8DC',
      200: '#B0BEC5',
      300: '#90A4AE',
      400: '#78909C',
      500: '#607D8B',
      600: '#546E7A',
      700: '#455A64',
      800: '#37474F',
      900: '#263238',
    }
  }
}

const semanticTokens = {
  colors: {
    'chakra-body-bg': { _dark: 'brand.secondary.900' },
    'chakra-body-text': { _dark: 'gray.100' },
    'card-bg': { _dark: 'brand.secondary.800' },
    'navbar-bg': { _dark: 'brand.secondary.800' },
  }
}

const components = {
  Button: {
    defaultProps: {
      colorScheme: 'brand.primary',
    },
  },
  Card: {
    baseStyle: {
      container: {
        backgroundColor: 'card-bg',
        borderRadius: 'lg',
      }
    }
  }
}

export const theme = extendTheme({ 
  config,
  colors,
  semanticTokens,
  components,
  styles: {
    global: {
      body: {
        bg: 'chakra-body-bg',
        color: 'chakra-body-text',
      }
    }
  }
}) 