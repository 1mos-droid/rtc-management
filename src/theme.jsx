import React, { useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider, responsiveFontSizes, alpha } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ColorModeContext } from './context/ColorModeContext.jsx';

const getDesignTokens = (mode) => {
  const isLight = mode === 'light';
  
  // Professional Administrative Palette
  const primarySlate = isLight ? '#0F172A' : '#F8FAFC'; // Deep Navy / Off-white
  const secondarySteel = isLight ? '#64748B' : '#94A3B8'; // Cool Gray
  const accentGold = '#B59410'; // Refined Gold for highlights
  const backgroundGray = isLight ? '#F8FAFC' : '#020617';
  const surfacePaper = isLight ? '#FFFFFF' : '#0F172A';
  
  return {
    palette: {
      mode,
      primary: { 
        main: primarySlate,
        light: alpha(primarySlate, 0.7),
        dark: isLight ? '#000000' : '#FFFFFF',
        contrastText: isLight ? '#FFFFFF' : '#0F172A'
      },
      secondary: { 
        main: secondarySteel,
        light: alpha(secondarySteel, 0.7),
        dark: isLight ? '#475569' : '#CBD5E1'
      },
      accent: {
        main: accentGold,
      },
      background: {
        default: backgroundGray,
        paper: surfacePaper,
      },
      text: {
        primary: isLight ? '#0F172A' : '#F8FAFC',
        secondary: isLight ? '#64748B' : '#94A3B8',
      },
      divider: alpha(isLight ? '#0F172A' : '#F8FAFC', 0.08),
    },
    typography: {
      fontFamily: '"Inter", "system-ui", sans-serif',
      h1: { fontFamily: '"Instrument Serif", serif', fontWeight: 400, letterSpacing: '-0.02em' },
      h2: { fontFamily: '"Instrument Serif", serif', fontWeight: 400, letterSpacing: '-0.02em' },
      h3: { fontFamily: '"Instrument Serif", serif', fontWeight: 400, letterSpacing: '-0.01em' },
      h4: { fontWeight: 700, letterSpacing: '-0.01em' },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      subtitle1: { fontWeight: 500, color: secondarySteel },
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
            backgroundColor: primarySlate,
            '&:hover': {
              backgroundColor: isLight ? '#1E293B' : '#E2E8F0',
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
            border: `1px solid ${alpha(isLight ? '#0F172A' : '#F8FAFC', 0.08)}`,
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
                borderColor: alpha(isLight ? '#0F172A' : '#F8FAFC', 0.12),
              },
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: surfacePaper,
            color: primarySlate,
            boxShadow: 'none',
            borderBottom: `1px solid ${alpha(isLight ? '#0F172A' : '#F8FAFC', 0.08)}`,
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
