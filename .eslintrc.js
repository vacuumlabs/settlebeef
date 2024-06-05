module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    ecmaVersion: 2020,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "react-hooks", "react"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier",
    "next",
  ],
  rules: {
    // ESLint
    semi: "off",
    indent: "off",
    "comma-dangle": ["error", "only-multiline"],
    "no-console": ["warn", { allow: ["info", "warn", "error"] }],

    // TypeScript
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-base-to-string": "off",
    "@typescript-eslint/no-duplicate-enum-values": "off",
    "@typescript-eslint/no-unsafe-enum-comparison": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/restrict-template-expressions": [
      "error",
      {
        allowAny: false,
        allowBoolean: false,
        allowNullish: true,
        allowNumber: true,
      },
    ],
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksVoidReturn: {
          attributes: false,
          properties: false,
        },
      },
    ],
    "@typescript-eslint/no-unused-vars": [
      "error",
      // Leave vars as 'all' to force everything to be handled when pattern matching
      // Variables can be ignored by prefixing with an '_'
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_", vars: "all" },
    ],
    "import/order": [
      "error",
      {
        "newlines-between": "never",
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
        pathGroups: [
          {
            pattern: "react",
            group: "external",
            position: "before",
          },
          {
            pattern: "@/**",
            group: "internal",
          },
          {
            pattern: "@{public,types}/**",
            group: "internal",
            position: "after",
          },
        ],
        pathGroupsExcludedImportTypes: ["react"],
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],
    // React no longer needs to be imported in each component
    // https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html
    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off",
  },
  overrides: [
    {
      // Disable some type checks for pure js script files
      files: ["*.js"],
      rules: {
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
      },
    },
    {
      files: ["**/*.{ts,tsx}"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
  ],
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      },
    },
    react: { version: "detect" },
  },
};
