#!/usr/bin/env bash
set -euo pipefail

# Install the freshly-built workflow into the locally-running Alfred, in place,
# without disturbing the user's saved configuration (node_path lives in
# prefs.plist, which Alfred owns — we must never overwrite it).

BUNDLE_ID="com.brachkow.alfred-emoji"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"

pnpm --dir "$ROOT" build

# Resolve Alfred's workflows directory. Alfred stores an optional custom sync
# folder in its preferences (this repo's author syncs to ~/Documents); fall
# back to the default location when none is set.
sync_folder="$(defaults read com.runningwithcrayons.Alfred-Preferences syncfolder 2>/dev/null || true)"
if [ -n "$sync_folder" ]; then
  prefs="${sync_folder/#\~/$HOME}/Alfred.alfredpreferences"
else
  prefs="$HOME/Library/Application Support/Alfred/Alfred.alfredpreferences"
fi
workflows="$prefs/workflows"

# Locate the installed copy by bundle id, not by folder name (Alfred assigns a
# random UUID directory per workflow).
target=""
if [ -d "$workflows" ]; then
  for plist in "$workflows"/*/info.plist; do
    [ -f "$plist" ] || continue
    if [ "$(/usr/libexec/PlistBuddy -c 'Print :bundleid' "$plist" 2>/dev/null || true)" = "$BUNDLE_ID" ]; then
      target="$(dirname "$plist")"
      break
    fi
  done
fi

if [ -z "$target" ]; then
  # Not installed yet — hand the packaged workflow to Alfred for a first import.
  echo "Not installed yet; opening the packaged workflow for a fresh import…"
  pnpm --dir "$ROOT" package
  open "$ROOT/alfred-emoji.alfredworkflow"
  exit 0
fi

# In-place update: mirror dist/ into the workflow, dropping stale artifacts
# (e.g. the old emoji-search.cjs) but keeping Alfred's own state files.
rsync -a --delete \
  --exclude 'prefs.plist' \
  --exclude '.DS_Store' \
  "$DIST"/ "$target"/

echo "Updated: $target"
echo "JS/data changes are live immediately. info.plist (keyword/graph) changes"
echo "need Alfred to reload — restart Alfred or toggle the workflow off/on."
