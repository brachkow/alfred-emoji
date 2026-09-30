# Alfred Emoji Search Workflow

An Alfred workflow for searching and copying emojis. It has non-strict search based on data from [emojibase](https://emojibase.dev/emojis), so you can find `thumbs up` emoji via `like` or `+1` etc.

## Usage

Type `emoji` or `;` (mnemonics is simple ; = 😉) followed by your search term:

```
emoji smile          → 😄 😊 😃 😀
; heart              → ❤️ 💙 💚 💛
emoji :thumbs_up:    → 👍
; love               → 😍 💕 💖 💗
```

Press **Enter** to copy the selected emoji (😄) to your clipboard!

## Installation

1. Download `alfred-emoji.alfredworkflow` from the latest [GitHub release](https://github.com/brachkow/alfred-emoji/releases/latest)
2. Double-click to install in Alfred
3. **Configure Node.js Path**: 
   - Open Alfred Preferences → Workflows → Emoji Search
   - Click the `[𝒙]` button to configure variables
   - Set your Node.js path (default: `/opt/homebrew/bin/node`)
   - To find your path, run `which node` in Terminal
4. Start searching with the `emoji` keyword or `;`

