import React, { useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider, responsiveFontSizes, alpha } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ColorModeContext } from './context/ColorModeContext.jsx';

const getDesignTokens = (mode) => {
  const isLight = mode === 'light';
  
  // RTCI Professional Palette (Burgundy and Gold)
  const primaryBurgundy = isLight ? '#8A0332' : '#A71C4B'; // Deep, regal burgundy
  const secondaryGold = isLight ? '#BF953F' : '#D4AF37'; // Sophisticated gold
  const backgroundParchment = isLight ? '#FAFAFA' : '#0F0B0D'; // Clean warm off-white / dark background
  const surfacePaper = isLight ? '#FFFFFF' : '#1A1416';
  const textCharcoal = isLight ? '#1A1A1A' : '#F5F5F5';
  
  return {
    palette: {
      mode,
      primary: { main: primaryBurgundy, light: alpha(primaryBurgundy, 0.7), dark: isLight ? '#5C0221' : '#D12860' },
      secondary: { main: secondaryGold, light: alpha(secondaryGold, 0.7), dark: isLight ? '#99742E' : '#E6C868' },
      background: {
        default: backgroundParchment,
        paper: surfacePaper,
      },
      text: {
        primary: textCharcoal,
        secondary: alpha(textCharcoal, 0.7),
      },
      divider: alpha(primaryBurgundy, 0.12),
      action: {
        hover: alpha(primaryBurgundy, 0.05),
      }
    },
    typography: {
      fontFamily: '"Nunito", "Inter", sans-serif',
      h1: { fontFamily: '"DM Serif Display", serif', fontWeight: 400, color: primaryBurgundy, letterSpacing: '-0.02em' },
      h2: { fontFamily: '"DM Serif Display", serif', fontWeight: 400, color: primaryBurgundy, letterSpacing: '-0.02em' },
      h3: { fontFamily: '"DM Serif Display", serif', fontWeight: 400, color: primaryBurgundy, letterSpacing: '-0.015em' },
      h4: { fontFamily: '"DM Serif Display", serif', fontWeight: 400, color: primaryBurgundy, letterSpacing: '-0.01em' },
      h5: { fontFamily: '"DM Serif Display", serif', fontWeight: 400, color: primaryBurgundy },
      h6: { fontFamily: '"DM Serif Display", serif', fontWeight: 400, color: primaryBurgundy },
      subtitle1: { fontFamily: '"Lora", serif', fontStyle: 'italic', color: secondaryGold, letterSpacing: '0.01em' },
      body1: { lineHeight: 1.8, fontSize: '1.05rem', color: textCharcoal },
      body2: { lineHeight: 1.6, fontSize: '0.9rem' },
      button: { fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.75rem' },
    },
    shape: {
      borderRadius: 16, 
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: backgroundParchment,
            color: textCharcoal,
            backgroundImage: isLight 
              ? `radial-gradient(circle at 10% 20%, rgba(138, 3, 50, 0.03) 0%, transparent 40%),
                 radial-gradient(circle at 90% 80%, rgba(191, 149, 63, 0.03) 0%, transparent 40%)`
              : `radial-gradient(circle at 10% 20%, rgba(167, 28, 75, 0.05) 0%, transparent 40%),
                 radial-gradient(circle at 90% 80%, rgba(212, 175, 55, 0.05) 0%, transparent 40%)`,
            backgroundAttachment: 'fixed',
            transition: 'background-color 0.4s ease, color 0.4s ease',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 100,
            padding: '14px 36px',
            boxShadow: 'none',
            transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
            '&:hover': {
              boxShadow: `0 12px 24px -6px ${alpha(primaryBurgundy, 0.2)}`,
              transform: 'translateY(-2px)',
            },
          },
          containedPrimary: {
            backgroundColor: primaryBurgundy,
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: isLight ? alpha(primaryBurgundy, 0.9) : alpha(primaryBurgundy, 1.0),
            }
          },
          outlinedPrimary: {
            borderColor: alpha(primaryBurgundy, 0.25),
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
              borderColor: primaryBurgundy,
              backgroundColor: alpha(primaryBurgundy, 0.04),
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 24,
            backgroundColor: surfacePaper,
            boxShadow: isLight 
              ? '0 10px 40px -10px rgba(138, 3, 50, 0.08)'
              : '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
            border: `1px solid ${alpha(primaryBurgundy, isLight ? 0.05 : 0.12)}`,
            borderTop: isLight ? `2px solid ${secondaryGold}` : undefined,
            backgroundImage: 'none',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              boxShadow: isLight 
                ? '0 20px 60px -15px rgba(138, 3, 50, 0.12)'
                : '0 20px 60px -15px rgba(0, 0, 0, 0.7)',
              transform: 'translateY(-4px)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: surfacePaper,
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          },
          elevation1: {
            boxShadow: isLight 
              ? '0 10px 30px -10px rgba(138, 3, 50, 0.05)'
              : '0 10px 30px -10px rgba(0, 0, 0, 0.4)',
          }
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 20,
              backgroundColor: isLight ? alpha(backgroundParchment, 0.6) : alpha('#000', 0.2),
              '& fieldset': {
                borderColor: alpha(primaryBurgundy, 0.15),
              },
              '&:hover fieldset': {
                borderColor: alpha(primaryBurgundy, 0.4),
              },
              '&.Mui-focused fieldset': {
                borderWidth: 2,
              }
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: alpha(backgroundParchment, 0.8),
            backdropFilter: 'blur(30px)',
            color: textCharcoal,
            boxShadow: 'none',
            borderBottom: `1px solid ${alpha(primaryBurgundy, 0.1)}`,
          },
        },
      },
      MuiTable: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 900,
              letterSpacing: 2,
              fontSize: '0.7rem',
              color: alpha(textCharcoal, 0.5),
              borderBottom: `2px solid ${alpha(primaryBurgundy, 0.1)}`,
            },
            '& .MuiTableCell-body': {
              padding: '24px',
              borderBottom: `1px solid ${alpha(primaryBurgundy, 0.04)}`,
            }
          }
        }
      }
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
