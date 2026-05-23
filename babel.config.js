module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './src',
          },
        },
      ],
      // NOTA: en SDK 54 el plugin de react-native-reanimated/worklets ya viene
      // incluido en babel-preset-expo, no hay que añadirlo manualmente.
    ],
  };
};
