import { build } from 'esbuild';
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

try {
  // Ensure dist directory exists
  if (!existsSync('./dist')) {
    mkdirSync('./dist', { recursive: true });
  }

  // Build the main script
  await build({
    entryPoints: ['./src/emoji-search.ts'],
    bundle: true,
    outfile: './dist/emoji-search.js',
    platform: 'node',
    target: 'node22',
    format: 'cjs',
    external: [], // Bundle everything including JSON data
    minify: false, // Keep readable for debugging
    sourcemap: false,
    loader: {
      '.json': 'json', // Handle JSON files properly
    },
  });

  // Copy workflow files
  if (existsSync('./workflow')) {
    copyFileSync('./workflow/info.plist', './dist/info.plist');
    copyFileSync('./workflow/icon.png', './dist/icon.png');
  }

  // Generate emoji icons
  console.warn('Generating emoji icons...');
  execSync('node scripts/generate-emoji-icons.js', { stdio: 'inherit' });

  console.warn('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  throw new Error(`Build failed: ${error.message}`);
}
