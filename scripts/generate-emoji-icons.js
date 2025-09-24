import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Generate emoji icon assets
try {
  console.warn('🎨 Generating emoji icon assets...');

  // Load emoji data
  const emojiData = require('emojibase-data/en/data.json');
  const iconsDirectory = path.resolve('dist/icons');

  // Create icons directory
  if (!fs.existsSync(iconsDirectory)) {
    fs.mkdirSync(iconsDirectory, { recursive: true });
  }

  // Generate SVG files for each emoji
  let generated = 0;

  for (const emoji of emojiData) {
    if (emoji.emoji) {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <text x="32" y="48" font-size="48" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, system-ui">${emoji.emoji}</text>
</svg>`;

      const filename = `${emoji.hexcode}.svg`;
      const filepath = path.join(iconsDirectory, filename);

      fs.writeFileSync(filepath, svgContent, 'utf8');
      generated++;
    }
  }

  console.warn(`✅ Generated ${generated} emoji icons in ${iconsDirectory}`);

  // Create an index file for quick lookup
  const iconIndex = {};
  for (const emoji of emojiData) {
    if (emoji.emoji) {
      iconIndex[emoji.hexcode] = `icons/${emoji.hexcode}.svg`;
    }
  }

  fs.writeFileSync(
    path.resolve('dist/icon-index.json'),
    JSON.stringify(iconIndex, null, 2),
    'utf8',
  );

  console.warn('📋 Created icon index file');
} catch (error) {
  console.error('❌ Failed to generate emoji icons:', error);
  throw new Error(`Failed to generate emoji icons: ${error.message}`);
}
