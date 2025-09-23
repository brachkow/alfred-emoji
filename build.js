const { build } = require('esbuild');
const { copyFileSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');

const buildScript = async () => {
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
      target: 'node16',
      format: 'cjs',
      external: [],
      minify: true,
      sourcemap: false,
    });

    // Copy workflow files
    if (existsSync('./workflow')) {
      copyFileSync('./workflow/info.plist', './dist/info.plist');
      copyFileSync('./workflow/icon.png', './dist/icon.png');
    }

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
};

buildScript();