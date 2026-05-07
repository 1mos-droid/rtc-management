import React, { useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider, responsiveFontSizes, alpha } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ColorModeContext } from './context/ColorModeContext.jsx';

const getDesignTokens = (mode) => {
  const isLight = mode === 'light';
  
  // Bespoke RTCI "The Living Vine" Professional Palette
  // Deepening the colors for a more prestigious, grounded feel
  const primaryForest = isLight ? '#1B3C33' : '#2D5A27'; // Deep, rich green
  const secondaryCopper = isLight ? '#8B5E3C' : '#D4A373'; // Sophisticated earth tone
  const backgroundParchment = isLight ? '#F9F7F2' : '#0F110F'; // Soft, professional off-white / charcoal-green
  const surfacePaper = isLight ? '#FFFFFF' : '#161A16';
  const textCharcoal = isLight ? '#1A1A1A' : '#F5F5F5';
  
  return {
    palette: {
      mode,
      primary: { main: primaryForest, light: alpha(primaryForest, 0.7), dark: isLight ? '#0D261F' : '#3E7036' },
      secondary: { main: secondaryCopper, light: alpha(secondaryCopper, 0.7), dark: isLight ? '#63442D' : '#E6BE8A' },
      background: {
        default: backgroundParchment,
        paper: surfacePaper,
      },
      text: {
        primary: textCharcoal,
        secondary: alpha(textCharcoal, 0.7),
      },
      divider: alpha(primaryForest, 0.12),
      action: {
        hover: alpha(primaryForest, 0.05),
      }
    },
    typography: {
      fontFamily: '"Nunito", "Inter", sans-serif',
      h1: { fontFamily: '"DM Serif Display", serif', fontWeight: 400, color: primaryForest, letterSpacing: '-0.02em' },
      h2: { fontFamily: '"DM Serif Display", serif', fontWeight: 400, color: primaryForest, letterSpacing: '-0.02em' },
      h3: { fontFamily: '"DM Serif Display", serif', fontWeight: 400, color: primaryForest, letterSpacing: '-0.015em' },
      h4: { fontFamily: '"DM Serif Display", serif', fontWeight: 400, color: primaryForest, letterSpacing: '-0.01em' },
      h5: { fontFamily: '"DM Serif Display", serif', fontWeight: 400, color: primaryForest },
      h6: { fontFamily: '"DM Serif Display", serif', fontWeight: 400, color: primaryForest },
      subtitle1: { fontFamily: '"Lora", serif', fontStyle: 'italic', color: secondaryCopper, letterSpacing: '0.01em' },
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
              ? `radial-gradient(circle at 10% 20%, rgba(27, 60, 51, 0.03) 0%, transparent 40%),
                 radial-gradient(circle at 90% 80%, rgba(139, 94, 60, 0.03) 0%, transparent 40%)`
              : `radial-gradient(circle at 10% 20%, rgba(45, 90, 39, 0.05) 0%, transparent 40%),
                 radial-gradient(circle at 90% 80%, rgba(212, 163, 115, 0.05) 0%, transparent 40%)`,
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
              boxShadow: `0 12px 24px -6px ${alpha(primaryForest, 0.2)}`,
              transform: 'translateY(-2px)',
            },
          },
          containedPrimary: {
            backgroundColor: primaryForest,
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: isLight ? alpha(primaryForest, 0.9) : alpha(primaryForest, 1.0),
            }
          },
          outlinedPrimary: {
            borderColor: alpha(primaryForest, 0.25),
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
              borderColor: primaryForest,
              backgroundColor: alpha(primaryForest, 0.04),
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
              ? '0 10px 40px -10px rgba(27, 60, 51, 0.08)'
              : '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
            border: `1px solid ${alpha(primaryForest, isLight ? 0.05 : 0.12)}`,
            backgroundImage: 'none',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              boxShadow: isLight 
                ? '0 20px 60px -15px rgba(27, 60, 51, 0.12)'
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
              ? '0 10px 30px -10px rgba(27, 60, 51, 0.05)'
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
                borderColor: alpha(primaryForest, 0.15),
              },
              '&:hover fieldset': {
                borderColor: alpha(primaryForest, 0.4),
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
            borderBottom: `1px solid ${alpha(primaryForest, 0.1)}`,
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
              borderBottom: `2px solid ${alpha(primaryForest, 0.1)}`,
            },
            '& .MuiTableCell-body': {
              padding: '24px',
              borderBottom: `1px solid ${alpha(primaryForest, 0.04)}`,
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
