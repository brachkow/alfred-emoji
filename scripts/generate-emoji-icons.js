const fs = require('fs');
const path = require('path');

// Generate emoji icon assets
async function generateEmojiIcons() {
  try {
    console.log('🎨 Generating emoji icon assets...');
    
    // Load emoji data
    const emojiData = require('emojibase-data/en/data.json');
    const iconsDir = path.join(__dirname, '../dist/icons');
    
    // Create icons directory
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
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
        const filepath = path.join(iconsDir, filename);
        
        fs.writeFileSync(filepath, svgContent, 'utf8');
        generated++;
      }
    }
    
    console.log(`✅ Generated ${generated} emoji icons in ${iconsDir}`);
    
    // Create an index file for quick lookup
    const iconIndex = {};
    for (const emoji of emojiData) {
      if (emoji.emoji) {
        iconIndex[emoji.hexcode] = `icons/${emoji.hexcode}.svg`;
      }
    }
    
    fs.writeFileSync(
      path.join(__dirname, '../dist/icon-index.json'),
      JSON.stringify(iconIndex, null, 2),
      'utf8'
    );
    
    console.log('📋 Created icon index file');
    
  } catch (error) {
    console.error('❌ Failed to generate emoji icons:', error);
    process.exit(1);
  }
}

generateEmojiIcons();
