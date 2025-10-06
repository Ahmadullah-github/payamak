/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx", 
    "./app/**/*.{js,jsx,ts,tsx}", 
    "./components/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{js,jsx,ts,tsx}",
    "./store/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // WhatsApp color scheme
        primary: '#075E54',
        primaryLight: '#128C7E',
        accent: '#25D366',
        accentLight: '#DCF8C6',
        chatBg: '#E5DDD5',
        inputBg: '#F7F8FA',
        messageReceived: '#FFFFFF',
        messageSent: '#DCF8C6',
        divider: '#E9EDEF',
        textMuted: '#8696A0',
        unreadBadge: '#25D366',
        online: '#25D366',
        offline: '#8696A0',
        
        // Extended color palette
        blue: '#3B82F6',
        blueLight: '#93C5FD',
        green: '#10B981',
        greenLight: '#6EE7B7',
        red: '#EF4444',
        redLight: '#FCA5A5',
        yellow: '#F59E0B',
        purple: '#8B5CF6',
        gray: '#6B7280',
        grayLight: '#E5E7EB',
        grayDark: '#374151',
      },
      fontFamily: {
        'sans': ['Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}