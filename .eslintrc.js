module.exports = {
  env: {
    browser: true,
    es6: true,
    jest: true,
  },
  extends: [
    'airbnb',
    'plugin:react-hooks/recommended',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    // webpack DefinePlugin variables
    __DEV__: 'readonly',
    JOB_TYPE: 'readonly',
    ANALYZER_SERVER: 'readonly',
    PARAVIEW_SERVER: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
      tsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    /**
     * General Rules
     */
    'comma-dangle': ['error', 'always-multiline'],
    'function-paren-newline': ['error', 'multiline-arguments'],
    'import/extensions': ['error', 'never'],
    'lines-between-class-members': ['error', 'always', {
      exceptAfterSingleLine: true,
    }],
    'max-classes-per-file': ['error', 20],
    'max-len': ['warn', 128, 2, {
      // Ignore long import lines
      ignorePattern: '^import\\s.+\\sfrom\\s.+;$',
      ignoreUrls: true,
    }],
    'no-unused-expressions': ['error', {
      allowShortCircuit: true,
      allowTernary: true,
    }],
    'object-curly-newline': ['error', {
      consistent: true,
      multiline: true,
    }],
    'object-curly-spacing': ['error', 'always'],
    'operator-linebreak': ['error', 'after'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],

    'react/jsx-closing-bracket-location': ['error', {
      nonEmpty: 'after-props',
      selfClosing: 'tag-aligned',
    }],
    'react/jsx-filename-extension': [1, {
      extensions: ['.tsx', '.jsx'],
    }],
    'react/jsx-sort-props': ['error', {
      ignoreCase: true,
      callbacksLast: false,
      shorthandFirst: false,
      shorthandLast: false,
      noSortAlphabetically: false,
      reservedFirst: false,
    }],
    'react/jsx-wrap-multilines': ['error', {
      arrow: 'parens-new-line',
      assignment: 'ignore',
      condition: 'ignore',
      declaration: 'ignore',
      logical: 'ignore',
      prop: 'ignore',
      return: 'parens-new-line',
    }],
    'react/state-in-constructor': ['error', 'never'],
    'react/static-property-placement': ['error', 'static public field'],

      'react/function-component-definition': [2, {"namedComponents": "arrow-function"}],

    /**
     * Disabled Rules
     */
    'no-await-in-loop': 'off',
    'no-param-reassign': 'off',

    // The following two rules cause false positives in a TS constructor where
    // all its parameters are used to define the data membbers.
    'no-empty-function': 'off',
    'no-useless-constructor': 'off',
    // The following two rules are to make debugging easier.
    // they should be removed in a future.
    'no-alert': 'off',
    'no-console': 'off',
    // Use the typescript-specific version below instead.
    'no-unused-vars': 'off',
    'one-var': 'off',
    'one-var-declaration-per-line': 'off',
    'react/jsx-fragments': 'off',
    'react/jsx-one-expression-per-line': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/destructuring-assignment': 'off',
    // prop-types check reports many false positives.
    // We use typescript for prop typechecking, so disable it.
      'react/prop-types': 'off',

      'no-use-before-define': 'off',
      "@typescript-eslint/no-use-before-define": ["error"]
  },

  // https://github.com/typescript-eslint/typescript-eslint/issues/46
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', {
          args: 'none',
          ignoreRestSiblings: true,
        }],
      },
    },
  ],
};
