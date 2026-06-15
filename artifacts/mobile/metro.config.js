const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo so Metro sees changes in shared libs and the
// pnpm virtual store. Required for expo prebuild / native builds where
// Metro is invoked from outside the Expo CLI dev server.
config.watchFolders = [monorepoRoot];

// Tell Metro where to look for node_modules. In a pnpm monorepo the
// packages are hoisted to the workspace root, not the artifact directory.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

config.resolver.blockList = [/\.cache\/openid-client\/.*/];

module.exports = config;
