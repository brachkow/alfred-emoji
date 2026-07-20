# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm build          # clean dist/, lint + typecheck + esbuild bundle + generate icons
pnpm install:local  # build, then update the running Alfred's copy in place (scripts/install.sh)
pnpm package        # build + zip dist/ → alfred-emoji.alfredworkflow
pnpm start          # package + open the .alfredworkflow (fresh import into Alfred)

pnpm test:unit             # vitest watch
pnpm test:unit --run       # single run (what CI does)
pnpm test:unit --run -t "normalizeQuery"   # single test by name
pnpm test:lint / write:lint
pnpm test:types            # tsc --noEmit (typecheck only — never compile with tsc)
```

Node/pnpm versions are pinned in `mise.toml` (`mise install`). pnpm 11 blocks postinstall
scripts by default; `esbuild` and `unrs-resolver` are allowed via `allowBuilds` in
`pnpm-workspace.yaml` — without it esbuild has no platform binary and the build fails.

## Architecture

An Alfred 5 workflow. Alfred runs a Script Filter that shells out to Node and reads JSON from stdout.

**Runtime flow:** Alfred keyword (`emoji` or `;`) → `"$node_path" emoji-search.js "$1"` → script prints an Alfred JSON `{items: [...]}` → user presses Enter → the selected item's `arg` (the emoji character) flows to a clipboard output node.

**Three pieces that must stay in sync:**

- `src/emoji-search.ts` — the whole search implementation. A `EmojiSearch` class plus top-level `await` main block at the bottom. It reads `process.argv[2]` and `console.log`s the result. No exports.
- `workflow/info.plist` — the Alfred workflow graph (two Script Filter inputs wired to one clipboard output). Copied verbatim into `dist/`. Node's location is not assumed: it's a user-configurable `node_path` variable (`userconfigurationconfig`), because Alfred's PATH doesn't include Homebrew.
- `scripts/generate-emoji-icons.js` — writes one `dist/icons/<hexcode>.svg` per emoji (a `<text>` element rendered with the system emoji font) plus `dist/icon-index.json`. `createAlfredItem` references `icons/${emoji.hexcode}.svg`, so the hexcode naming is the contract between these two files.

**Build** (`build.js`): esbuild bundles everything — including the emojibase JSON — into a single `dist/emoji-search.js`. Format must be **ESM** (`format: 'esm'`); the file has top-level await and `package.json` sets `"type": "module"`. A CJS build fails at runtime inside Alfred.

**Data:** `emojibase-data/en/data.json` merged with `en/shortcodes/github.json`, keyed by `hexcode`. Search is a weighted scoring pass over label / tags / shortcodes / emoticon (exact > startsWith > contains), sorted descending, capped at 50 results. Queries are normalized with lodash `deburr` + lowercase + trim so accented input matches. Empty query returns the first 20 emojis from groups 0–1.

## Gotchas

- **`src/emoji-search.test.ts` copy-pastes the `EmojiSearch` class instead of importing it** — because the source module executes on import (top-level await + `console.log`). The tests therefore validate a duplicate. Any change to scoring, normalization, or `createAlfredItem` in `src/emoji-search.ts` must be mirrored into the test file or the tests silently pass against stale logic. Refactoring the source to export the class and gate the main block would remove this trap.
- **Local install goes through `scripts/install.sh` (`pnpm install:local`), not a hardcoded path.** Alfred's workflows live under a user-configurable sync folder — read from the `syncfolder` key of `com.runningwithcrayons.Alfred-Preferences` (this repo's author syncs to `~/Documents`), falling back to `~/Library/Application Support/Alfred/…`. The script finds *this* workflow by bundle id (`com.brachkow.alfred-emoji`), not by folder name (Alfred assigns a random UUID dir), and `rsync`s `dist/` in while **excluding `prefs.plist`** — that file holds the user's configured `node_path` (often a mise path, not the `/opt/homebrew/bin/node` default), and clobbering it breaks the workflow. JS/data changes are live immediately; `info.plist` (keyword/graph) changes need an Alfred reload.
- `dist/` is gitignored. `build.js` wipes and recreates it on every build, so stale artifacts can't leak into a package/release/install.
- The two Script Filters differ on `withspace`: `emoji` requires a space before its argument, `;` does not (so `;smile` works). A `;`-with-space query therefore arrives with leading whitespace — `searchEmojis` checks emptiness *after* normalization to keep `; ` returning the popular list rather than matching everything on an empty regex.
- Pushing to `main` triggers `.github/workflows/build.yml`, which auto-bumps the patch version, tags, pushes to main, and publishes a GitHub release with the packaged workflow.
