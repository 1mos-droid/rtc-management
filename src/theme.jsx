import React, { useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider, responsiveFontSizes, alpha } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ColorModeContext } from './context/ColorModeContext.jsx';

const getDesignTokens = (mode) => {
  const isLight = mode === 'light';
  
  // RTCI Brand Palette
  const rtciRed = '#8A0332'; // Deep Red from logo
  const rtciGold = '#B59410'; // Refined Gold from logo
  const offWhite = '#F8FAFC';
  const deepSlate = '#0F172A';
  
  const backgroundGray = isLight ? '#F8FAFC' : '#020617';
  const surfacePaper = isLight ? '#FFFFFF' : '#0F172A';
  
  return {
    palette: {
      mode,
      primary: { 
        main: rtciRed,
        light: alpha(rtciRed, 0.7),
        dark: '#5a0221',
        contrastText: '#FFFFFF'
      },
      secondary: { 
        main: rtciGold,
        light: alpha(rtciGold, 0.7),
        dark: '#8a710c',
        contrastText: '#FFFFFF'
      },
      accent: {
        main: rtciGold,
      },
      background: {
        default: backgroundGray,
        paper: surfacePaper,
      },
      text: {
        primary: isLight ? deepSlate : offWhite,
        secondary: isLight ? '#64748B' : '#94A3B8',
      },
      divider: alpha(isLight ? deepSlate : offWhite, 0.08),
    },
    typography: {
      fontFamily: '"Inter", "system-ui", sans-serif',
      h1: { fontFamily: '"Instrument Serif", serif', fontWeight: 400, letterSpacing: '-0.02em' },
      h2: { fontFamily: '"Instrument Serif", serif', fontWeight: 400, letterSpacing: '-0.02em' },
      h3: { fontFamily: '"Instrument Serif", serif', fontWeight: 400, letterSpacing: '-0.01em' },
      h4: { fontWeight: 700, letterSpacing: '-0.01em' },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      subtitle1: { fontWeight: 500, color: isLight ? '#64748B' : '#94A3B8' },
      body1: { lineHeight: 1.6, fontSize: '0.95rem' },
      body2: { lineHeight: 1.5, fontSize: '0.85rem' },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
      overline: { fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' },
    },
    shape: {
      borderRadius: 12, 
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: backgroundGray,
            color: isLight ? '#0F172A' : '#F8FAFC',
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '10px 24px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
              transform: 'translateY(-1px)',
            },
          },
          containedPrimary: {
            backgroundColor: rtciRed,
            '&:hover': {
              backgroundColor: '#5a0221',
            }
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: isLight 
              ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
              : '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
            border: `1px solid ${alpha(isLight ? deepSlate : offWhite, 0.08)}`,
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              '& fieldset': {
                borderColor: alpha(isLight ? deepSlate : offWhite, 0.12),
              },
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: surfacePaper,
            color: rtciRed,
            boxShadow: 'none',
            borderBottom: `1px solid ${alpha(isLight ? deepSlate : offWhite, 0.08)}`,
          },
        },
      },
    },
  };
};

export default function ThemeConfig({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('rtci_theme') || 'light');

  useEffect(() => {
    document.body.setAttribute('data-theme', mode);
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('rtci_theme', newMode);
          return newMode;
        });
      },
      mode,
    }),
    [mode]
  );

  const theme = useMemo(() => {
    let theme = createTheme(getDesignTokens(mode));
    return responsiveFontSizes(theme);
  }, [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
