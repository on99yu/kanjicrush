// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// wasm + 폰트는 asset로 취급
config.resolver.assetExts = [
  ...new Set([...config.resolver.assetExts, "wasm", "ttf", "otf"]),
];

// 혹시라도 sourceExts에 들어가 있으면 제거
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => !["wasm", "ttf", "otf"].includes(ext)
);

// ✅ 이게 핵심: asset registry 경로를 명시
try {
  // RN 신버전(0.73+ 계열에서 주로 사용)
  config.transformer.assetRegistryPath = require.resolve(
    "@react-native/assets-registry/registry"
  );
} catch (e) {
  // RN 구버전 호환
  config.transformer.assetRegistryPath = require.resolve(
    "react-native/Libraries/Image/AssetRegistry"
  );
}

module.exports = config;