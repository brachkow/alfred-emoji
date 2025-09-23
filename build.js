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
    console.log('Generating emoji icons...');
    const { execSync } = require('child_process');
    execSync('node scripts/generate-emoji-icons.js', { stdio: 'inherit' });

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
};

buildScript();