module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { 
        jsxImportSource: "nativewind",
        // Add this line for better JSX handling
        jsxRuntime: 'automatic' 
      }],
      "nativewind/babel",
    ],
    plugins: [
      // Add this plugin for better compatibility
      'react-native-worklets/plugin',
    ],
  };
};