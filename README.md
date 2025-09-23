# Alfred Emoji Search Workflow

An Alfred workflow for searching and copying emojis using real emoji names and shortcodes from the emojibase library.

## Features

- 🔍 Search emojis by real names (from emojibase)
- 🏷️ Search by GitHub-style shortcodes (e.g., `:smile:`)
- 📋 Multiple copy options:
  - **Enter**: Copy emoji to clipboard
  - **Cmd+Enter**: Copy emoji name to clipboard
  - **Alt+Enter**: Copy shortcode to clipboard
- ⚡ Fast TypeScript implementation with esbuild
- 🎯 Smart scoring system for relevant results

## Installation

1. Download `alfred-emoji.alfredworkflow`
2. Double-click to install in Alfred
3. **Configure Node.js Path**: 
   - Open Alfred Preferences → Workflows → Emoji Search
   - Click the `[𝒙]` button to configure variables
   - Set your Node.js path (default: `/opt/homebrew/bin/node`)
   - To find your path, run `which node` in Terminal
4. Start searching with the `emoji` keyword

### Common Node.js Paths:
- **Homebrew (Apple Silicon)**: `/opt/homebrew/bin/node`
- **Homebrew (Intel)**: `/usr/local/bin/node`
- **System**: `/usr/bin/node`
- **nvm**: `~/.nvm/versions/node/v20.x.x/bin/node`
- **mise**: `~/.local/share/mise/installs/node/22.x.x/bin/node`

## Usage

Type `emoji` followed by your search term:

```
emoji smile          → 😄 😊 😃 😀
emoji heart          → ❤️ 💙 💚 💛
emoji :thumbs_up:    → 👍
emoji love           → 😍 💕 💖 💗
```

### Keyboard Shortcuts

- **Enter**: Copy emoji (😄) to clipboard
- **Cmd+Enter**: Copy emoji name ("grinning face with smiling eyes") to clipboard  
- **Alt+Enter**: Copy shortcode (":smile:") to clipboard

## Development

### Requirements

- Node.js 16+
- pnpm

### Setup

```bash
pnpm install
```

### Build

```bash
pnpm build          # Build the workflow
pnpm package        # Create installable .alfredworkflow file
```

### Development

```bash
pnpm dev            # Build and copy to Alfred workflow directory
```