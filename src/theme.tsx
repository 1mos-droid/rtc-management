"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider, responsiveFontSizes, alpha } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ColorModeContext } from './context/ColorModeContext';

// Cinematic Motion (Massive inertia, high tension)
const VANGUARD_MOTION = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';

const getDesignTokens = (mode) => {
  const isLight = mode === 'light';
  
  // OLED Vanguard Palette
  const primaryMain = isLight ? '#8B1E31' : '#EAB308'; // Crimson / Cyber Gold
  const bgMain = isLight ? '#F9F9FB' : '#050505'; // Off-white / OLED Black
  const bgPaper = isLight ? '#FFFFFF' : '#0F0F11'; // Pure White / Machined Carbon
  
  const textPrimary = isLight ? '#121212' : '#F8F9FA';
  const textSecondary = isLight ? '#666666' : '#88888E';
  
  // Ultra-fine hairlines
  const hairline = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const glassBorder = isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)';

  return {
    palette: {
      mode,
      primary: { 
        main: primaryMain,
        contrastText: isLight ? '#FFFFFF' : '#000000'
      },
      secondary: { 
        main: isLight ? '#B6924D' : '#8B1E31', 
        contrastText: '#FFFFFF'
      },
      background: {
        default: bgMain,
        paper: bgPaper,
      },
      text: {
        primary: textPrimary,
        secondary: textSecondary,
      },
      divider: hairline,
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      h1: { 
        fontFamily: '"Cinzel", serif', 
        fontWeight: 400, 
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontSize: '3.5rem',
        lineHeight: 1
      },
      h2: { 
        fontFamily: '"Cinzel", serif', 
        fontWeight: 400, 
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontSize: '2.5rem'
      },
      h3: { 
        fontWeight: 800, 
        letterSpacing: '-0.04em',
        fontSize: '1.85rem'
      },
      h4: { 
        fontWeight: 800, 
        letterSpacing: '-0.03em',
        fontSize: '1.5rem'
      },
      subtitle1: { 
        fontWeight: 700, 
        letterSpacing: '-0.01em',
        color: textSecondary 
      },
      body1: { 
        lineHeight: 1.8, 
        fontSize: '1rem',
        letterSpacing: '-0.01em'
      },
      button: { 
        fontWeight: 800, 
        textTransform: 'uppercase', 
        letterSpacing: '0.15em',
        fontSize: '0.75rem'
      },
      overline: { 
        fontWeight: 900, 
        letterSpacing: '0.2em', 
        textTransform: 'uppercase',
        fontSize: '0.6rem'
      },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: bgMain,
            backgroundImage: isLight 
              ? 'none' 
              : `radial-gradient(at 0% 0%, ${alpha('#8B1E31', 0.15)} 0px, transparent 50%), radial-gradient(at 100% 100%, ${alpha('#EAB308', 0.05)} 0px, transparent 50%)`,
            backgroundAttachment: 'fixed',
            color: textPrimary,
            transition: 'background-color 0.5s ease',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '12px', // Premium soft rounded edges
            padding: '14px 32px',
            transition: VANGUARD_MOTION,
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: isLight ? '0 10px 20px rgba(0,0,0,0.05)' : `0 10px 40px ${alpha(primaryMain, 0.2)}`,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.1), transparent)',
              transform: 'translateX(-100%)',
              transition: 'transform 0.6s ease',
            },
            '&:hover::after': {
              transform: 'translateX(100%)',
            }
          },
          containedPrimary: {
            backgroundColor: primaryMain,
            boxShadow: `0 4px 14px 0 ${alpha(primaryMain, 0.3)}`,
          },
          outlined: {
            borderWidth: '1px !important',
            borderColor: hairline,
            backgroundColor: alpha(bgPaper, 0.5),
            backdropFilter: 'blur(10px)',
            '&:hover': {
              borderColor: primaryMain,
              backgroundColor: alpha(primaryMain, 0.05),
            }
          }
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '24px', // Soft rounded premium corners
            backgroundColor: alpha(bgPaper, 0.6),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${glassBorder}`,
            boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.02)' : '0 20px 50px rgba(0,0,0,0.5)',
            transition: VANGUARD_MOTION,
            '&:hover': {
              borderColor: alpha(primaryMain, 0.3),
              transform: 'scale(1.01)',
              backgroundColor: alpha(bgPaper, 0.8),
            }
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: bgPaper,
            borderRadius: '24px', // Soft rounded premium corners
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: 'transparent',
            backdropFilter: 'none',
            borderBottom: 'none',
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: alpha(bgPaper, 0.8),
            backdropFilter: 'blur(30px)',
            borderRight: `1px solid ${glassBorder}`,
            boxShadow: 'none',
          }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${glassBorder}`,
            padding: '16px 24px',
          },
          head: {
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: '0.65rem',
            color: textSecondary,
            backgroundColor: alpha(bgMain, 0.5),
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px', // Soft rounded inputs
              backgroundColor: alpha(bgMain, 0.5),
              '& fieldset': {
                borderColor: glassBorder,
              },
              '&:hover fieldset': {
                borderColor: alpha(primaryMain, 0.5),
              },
              '&.Mui-focused fieldset': {
                borderColor: primaryMain,
              }
            }
          }
        }
      }
    },
  };
};

export default function ThemeConfig({ children }) {
  const [mode, setMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rtci_theme') || 'dark'; // Default to dark for Obsidian Vanguard
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.setAttribute('data-theme', mode);
    }
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          if (typeof window !== 'undefined') {
            localStorage.setItem('rtci_theme', newMode);
          }
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
