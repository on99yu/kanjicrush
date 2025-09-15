// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  const { resolver } = config;

  // .wasm 파일을 assetExts에 추가
  resolver.assetExts = [...resolver.assetExts, 'wasm'];

  return config;
})();