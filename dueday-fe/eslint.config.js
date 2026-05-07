// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const reactHooks = require("eslint-plugin-react-hooks");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/*", "node_modules/*", ".agents/*", "scripts/*"],
  },
  // React Compiler ruleset from eslint-plugin-react-hooks v7+.
  // Plugin is already registered by eslint-config-expo. Demote the new
  // compiler rules to "warn" so violations surface in CI without blocking;
  // existing rules-of-hooks / exhaustive-deps stay at expo's defaults.
  {
    rules: Object.fromEntries(
      Object.keys(reactHooks.configs.flat["recommended-latest"].rules).map(
        (name) => [name, "warn"],
      ),
    ),
  },
  // Type-aware rules — applied only to source TS/TSX
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "@typescript-eslint/no-deprecated": "warn",
    },
  },
]);
