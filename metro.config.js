const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force transpile private class fields regardless of what Expo Go requests
config.transformer = {
  ...config.transformer,
  unstable_transformProfile: 'default',
};

// Middleware to strip hermes-stable transform profile from bundle requests
// Expo Go sends this in the URL which overrides the config above
const originalMiddleware = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, metroServer) => {
    const wrapped = (req, res, next) => {
      if (req.url && req.url.includes('unstable_transformProfile=hermes-stable')) {
        req.url = req.url.replace(
          'unstable_transformProfile=hermes-stable',
          'unstable_transformProfile=default'
        );
      }
      if (originalMiddleware) {
        return originalMiddleware(middleware, metroServer)(req, res, next);
      }
      return middleware(req, res, next);
    };
    return wrapped;
  },
};

module.exports = config;
