// expo-sqlite ships a WASM build for web (wa-sqlite over OPFS). Metro needs to be
// told to treat .wasm as an asset, and the dev server needs cross-origin isolation
// headers for OPFS/SharedArrayBuffer to work in the browser.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

// PowerSync's recommended Metro config: prevents inline-requires from breaking
// its internal module initialization order. See @powersync/react-native README.
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: {
      blockList: {
        [require.resolve('@powersync/react-native')]: true,
      },
    },
  },
});

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
