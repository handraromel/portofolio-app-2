import react from "eslint-plugin-react";
import typescript from "@typescript-eslint/eslint-plugin";
import unusedImports from "eslint-plugin-unused-imports";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";
import js from "@eslint/js";

// Get the recommended configs
const typescriptConfig = typescript.configs.recommended;
const reactConfig = react.configs.recommended;

export default [
  js.configs.recommended,
  {
    ignores: [
      // Build & cache
      "**/dist/**",
      "**/build/**",
      "**/out/**",
      "**/.cache/**",
      "**/.vite/**",

      // Environment files
      "**/.env*",
      "!.env.example",

      // Test coverage
      "**/coverage/**",
      "**/.nyc_output/**",

      // IDE specific
      "**/.idea/**",
      ".vscode/*",
      "!.vscode/settings.json",
      "!.vscode/tasks.json",
      "!.vscode/launch.json",
      "!.vscode/extensions.json",

      // Node modules
      "**/node_modules/**",
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 12,
        sourceType: "module",
        projectService: true,
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      react,
      "@typescript-eslint": typescript,
      "unused-imports": unusedImports,
    },
    rules: {
      ...typescriptConfig.rules,
      ...reactConfig.rules,
      "no-console": ["error", { allow: ["error", "warn"] }],
      "react/react-in-jsx-scope": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
      "@typescript-eslint/no-explicit-any": "error",
    },
    settings: {
      "import/resolver": {
        typescript: {},
      },
      react: {
        version: "detect",
      },
    },
  },
];
