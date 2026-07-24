const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Root of the monorepo
const workspaceRoot = path.resolve(__dirname, '../..');

// Expo Router needs this to find the app/ directory in monorepos
process.env.EXPO_ROUTER_APP_ROOT = './app';

const config = getDefaultConfig(__dirname);

// Explicit project root so Expo Router finds the app/ directory
config.projectRoot = __dirname;

// 1. Watch the monorepo root + libs for changes
config.watchFolders = [
    workspaceRoot,
];

// 2. Tell Metro where to find node_modules (hoisted to root)
config.resolver.nodeModulesPaths = [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Ensure .tflite files are treated as assets
config.resolver.assetExts.push('tflite');

// 4. Single React copy ensured via root package.json "overrides"
// No extraNodeModules needed — React 19.1.0 is the only version in the monorepo

// 5. Workaround: Windows + Android emulator chunked encoding bug
// Strip multipart/mixed Accept header so Metro sends plain Content-Length responses
// instead of chunked multipart (which OkHttp misparses on Windows)
config.server = {
    ...config.server,
    enhanceMiddleware: (middleware) => {
        return (req, res, next) => {
            if (req.headers.accept) {
                req.headers.accept = req.headers.accept.replace(/multipart\/mixed\s*,?\s*/g, '') || '*/*';
            }
            return middleware(req, res, next);
        };
    },
};

module.exports = config;
