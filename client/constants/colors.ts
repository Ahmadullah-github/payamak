// Enhanced WhatsApp-like color scheme with theme support

interface ColorScheme {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  
  // Background colors
  background: string;
  surface: string;
  chatBackground: string;
  inputBackground: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textWhite: string;
  textMuted: string;
  textInverse: string;
  
  // Message colors
  messageReceived: string;
  messageSent: string;
  messageTimestamp: string;
  
  // UI elements
  divider: string;
  border: string;
  shadow: string;
  overlay: string;
  
  // Status colors
  onlineStatus: string;
  offlineStatus: string;
  unreadBadge: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Navigation colors
  tabActive: string;
  tabInactive: string;
  tabBar: string;
  headerBackground: string;
  headerText: string;
  
  // Interactive states
  ripple: string;
  pressed: string;
  focused: string;
  disabled: string;
}

// Light theme (WhatsApp-like)
const lightTheme: ColorScheme = {
  // Primary colors
  primary: '#075E54',
  primaryLight: '#128C7E',
  primaryDark: '#054940',
  accent: '#25D366',
  accentLight: '#DCF8C6',
  
  // Background colors
  background: '#FFFFFF',
  surface: '#F8F9FA',
  chatBackground: '#E5DDD5',
  inputBackground: '#F7F8FA',
  
  // Text colors
  textPrimary: '#000000',
  textSecondary: '#667781',
  textWhite: '#FFFFFF',
  textMuted: '#8696A0',
  textInverse: '#FFFFFF',
  
  // Message colors
  messageReceived: '#FFFFFF',
  messageSent: '#DCF8C6',
  messageTimestamp: '#8696A0',
  
  // UI elements
  divider: '#E9EDEF',
  border: '#E9EDEF',
  shadow: 'rgba(0,0,0,0.1)',
  overlay: 'rgba(0,0,0,0.5)',
  
  // Status colors
  onlineStatus: '#25D366',
  offlineStatus: '#8696A0',
  unreadBadge: '#25D366',
  success: '#25D366',
  warning: '#FF9500',
  error: '#FF4444',
  info: '#007AFF',
  
  // Navigation colors
  tabActive: '#FFFFFF',
  tabInactive: 'rgba(255,255,255,0.7)',
  tabBar: '#075E54',
  headerBackground: '#075E54',
  headerText: '#FFFFFF',
  
  // Interactive states
  ripple: 'rgba(0,0,0,0.1)',
  pressed: 'rgba(0,0,0,0.05)',
  focused: 'rgba(7,94,84,0.1)',
  disabled: 'rgba(0,0,0,0.3)',
};

// Dark theme
const darkTheme: ColorScheme = {
  // Primary colors
  primary: '#128C7E',
  primaryLight: '#25D366',
  primaryDark: '#075E54',
  accent: '#25D366',
  accentLight: '#1F4F3A',
  
  // Background colors
  background: '#0B141A',
  surface: '#1F2C34',
  chatBackground: '#0B141A',
  inputBackground: '#2A3942',
  
  // Text colors
  textPrimary: '#E9EDEF',
  textSecondary: '#8696A0',
  textWhite: '#FFFFFF',
  textMuted: '#667781',
  textInverse: '#000000',
  
  // Message colors
  messageReceived: '#1F2C34',
  messageSent: '#005C4B',
  messageTimestamp: '#667781',
  
  // UI elements
  divider: '#2A3942',
  border: '#2A3942',
  shadow: 'rgba(0,0,0,0.5)',
  overlay: 'rgba(0,0,0,0.7)',
  
  // Status colors
  onlineStatus: '#25D366',
  offlineStatus: '#667781',
  unreadBadge: '#25D366',
  success: '#25D366',
  warning: '#FF9500',
  error: '#FF4444',
  info: '#3B82F6',
  
  // Navigation colors
  tabActive: '#25D366',
  tabInactive: 'rgba(233,237,239,0.7)',
  tabBar: '#1F2C34',
  headerBackground: '#1F2C34',
  headerText: '#E9EDEF',
  
  // Interactive states
  ripple: 'rgba(255,255,255,0.1)',
  pressed: 'rgba(255,255,255,0.05)',
  focused: 'rgba(37,211,102,0.2)',
  disabled: 'rgba(255,255,255,0.3)',
};

// Export current theme (can be switched based on user preference)
export const AppColors = lightTheme;
export const LightTheme = lightTheme;
export const DarkTheme = darkTheme;
export type { ColorScheme };