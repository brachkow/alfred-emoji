import { defineConfig } from 'eslint-config-fans';

export default defineConfig({
  prettier: true,
  typescript: true,
  test: true,
  rules: {
    // Allow console.log in main function for Alfred output
    'no-console': ['error', { allow: ['warn', 'error', 'log'] }],
  },
});
