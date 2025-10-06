// File: constants/theme.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { AppColors, LightTheme, DarkTheme, ColorScheme } from './colors';

type ThemeMode = 'light' | 'dark' | 'system';

interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

interface Typography {
  heading1: { fontSize: number; fontWeight: '400' | '500' | '600' | '700' | '800'; lineHeight: number };
  heading2: { fontSize: number; fontWeight: '400' | '500' | '600' | '700' | '800'; lineHeight: number };
  heading3: { fontSize: number; fontWeight: '400' | '500' | '600' | '700' | '800'; lineHeight: number };
  bodyLarge: { fontSize: number; fontWeight: '400' | '500' | '600'; lineHeight: number };
  body: { fontSize: number; fontWeight: '400' | '500' | '600'; lineHeight: number };
  bodySmall: { fontSize: number; fontWeight: '400' | '500' | '600'; lineHeight: number };
  caption: { fontSize: number; fontWeight: '400' | '500' | '600'; lineHeight: number };
  button: { fontSize: number; fontWeight: '500' | '600' | '700'; lineHeight: number };
}

interface ThemeContextType {
  theme: ColorScheme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  spacing: Spacing;
  typography: Typography;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

// Define consistent spacing scale
const spacing: Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Define consistent typography scale
const typography: Typography = {
  heading1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
  heading2: { fontSize: 24, fontWeight: '600', lineHeight: 32 },
  heading3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  bodyLarge: { fontSize: 18, fontWeight: '400', lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Determine current theme based on mode and system preference
  const isDark = themeMode === 'dark' || 
    (themeMode === 'system' && systemColorScheme === 'dark');
  
  const theme = isDark ? DarkTheme : LightTheme;

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await SecureStore.getItemAsync('themeMode');
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.log('Failed to load theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await SecureStore.setItemAsync('themeMode', mode);
    } catch (error) {
      console.log('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
    spacing,
    typography,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook for getting current colors (backwards compatibility)
export function useColors(): ColorScheme {
  const { theme } = useTheme();
  return theme;
}

// Hook for getting spacing
export function useSpacing(): Spacing {
  const { spacing } = useTheme();
  return spacing;
}

// Hook for getting typography
export function useTypography(): Typography {
  const { typography } = useTheme();
  return typography;
}