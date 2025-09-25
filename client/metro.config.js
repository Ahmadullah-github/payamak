const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname, {
  // Enable CSS support
  isCSSEnabled: true
});

// Add this line to ensure proper module resolution
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-css-interop': require.resolve('react-native-css-interop'),
};

module.exports = withNativeWind(config, { 
  input: './global.css',
  // Add this projectRoot option
  projectRoot: __dirname
});