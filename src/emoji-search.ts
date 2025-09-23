#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join } from 'path';
import { deburr, escapeRegExp } from 'lodash-es';

// Alfred result item interface
interface AlfredItem {
  uid?: string;
  title: string;
  subtitle?: string;
  arg?: string;
  autocomplete?: string;
  icon?: {
    type?: string;
    path?: string;
  };
  valid?: boolean;
  match?: string;
  mods?: {
    [key: string]: {
      subtitle?: string;
      arg?: string;
      valid?: boolean;
    };
  };
  text?: {
    copy?: string;
    largetype?: string;
  };
}

interface AlfredResult {
  items: AlfredItem[];
}

interface EmojiData {
  emoji: string;
  label: string;
  group?: number;
  order?: number;
  shortcodes: string[];
  emoticon?: string;
  hexcode: string;
  text?: string;
  type?: number;
  version?: number;
  tags?: string[];
  subgroup?: number;
  skins?: any[];
}

class EmojiSearch {
  private emojis: EmojiData[] = [];

  constructor() {
    this.loadEmojiData();
  }

  private loadEmojiData(): void {
    try {
      // Import emoji data directly (will be bundled by esbuild)
      const emojiData = require('emojibase-data/en/data.json');
      const shortcodes = require('emojibase-data/en/shortcodes/github.json');
      
      // Merge emoji data with shortcodes and normalize emoji field
      this.emojis = emojiData.map((emoji: any) => ({
        ...emoji,
        emoji: emoji.emoji || emoji.unicode, // Handle both formats
        shortcodes: shortcodes[emoji.hexcode] || [],
        tags: emoji.tags || [] // Ensure tags array exists
      }));
    } catch (error) {
      console.error('Failed to load emoji data:', error);
      process.exit(1);
    }
  }

  private normalizeQuery(query: string): string {
    if (typeof query !== 'string') {
      return '';
    }
    return deburr(query.toLowerCase().trim());
  }

  private searchEmojis(query: string): EmojiData[] {
    if (!query || query.length < 1) {
      // Return popular emojis when no query
      return this.emojis
        .filter(emoji => emoji.group !== undefined && emoji.group <= 1) // Smileys & People, Animals & Nature
        .slice(0, 20);
    }

    const normalizedQuery = this.normalizeQuery(query);
    const queryRegex = new RegExp(escapeRegExp(normalizedQuery), 'i');
    
    const results: Array<{ emoji: EmojiData; score: number }> = [];

    for (const emoji of this.emojis) {
      let score = 0;
      
      // Check emoji label (main name)
      if (emoji.label) {
        const normalizedLabel = this.normalizeQuery(emoji.label);
        if (normalizedLabel === normalizedQuery) {
          score += 100; // Exact match
        } else if (normalizedLabel.startsWith(normalizedQuery)) {
          score += 80; // Starts with query
        } else if (queryRegex.test(normalizedLabel)) {
          score += 50; // Contains query
        }
      }

       // Check tags (emojibase includes rich tag data)
       if (emoji.tags) {
         for (const tag of emoji.tags) {
           const normalizedTag = this.normalizeQuery(tag);
           if (normalizedTag === normalizedQuery) {
             score += 90; // High score for exact tag match
           } else if (normalizedTag.startsWith(normalizedQuery)) {
             score += 70; // Good score for tag starts with query
           } else if (queryRegex.test(normalizedTag)) {
             score += 40; // Medium score for tag contains query
           }
         }
       }

      // Check shortcodes
      if (emoji.shortcodes) {
        for (const shortcode of emoji.shortcodes) {
          if (typeof shortcode === 'string') {
            const normalizedShortcode = this.normalizeQuery(shortcode);
            if (normalizedShortcode === normalizedQuery) {
              score += 95;
            } else if (normalizedShortcode.startsWith(normalizedQuery)) {
              score += 75;
            } else if (queryRegex.test(normalizedShortcode)) {
              score += 45;
            }
          }
        }
      }

      // Check emoticon
      if (emoji.emoticon && emoji.emoticon.includes(query)) {
        score += 60;
      }

      if (score > 0) {
        results.push({ emoji, score });
      }
    }

    // Sort by score (descending) and return emojis
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 50) // Limit results
      .map(result => result.emoji);
  }

  private createAlfredItem(emoji: EmojiData): AlfredItem {
    const shortcodes = Array.isArray(emoji.shortcodes) ? emoji.shortcodes.join(', ') : '';
    const tags = Array.isArray(emoji.tags) ? emoji.tags.join(', ') : '';
    
    let subtitle = emoji.label;
    if (tags) {
      subtitle += ` (${tags})`;
    }
    if (shortcodes) {
      subtitle += ` :${shortcodes}:`;
    }

    return {
      uid: emoji.hexcode,
      title: `${emoji.emoji} ${emoji.label}`,
      subtitle,
      arg: emoji.emoji,
      autocomplete: emoji.label,
      valid: true,
      text: {
        copy: emoji.emoji,
        largetype: `${emoji.emoji}\n\n${emoji.label}\n\nTags: ${tags}\nShortcodes: ${shortcodes}`
      },
      mods: {
        cmd: {
          subtitle: `Copy "${emoji.label}" to clipboard`,
          arg: emoji.label,
          valid: true
        },
        alt: {
          subtitle: `Copy ":${emoji.shortcodes?.[0] || emoji.label.replace(/\s+/g, '_')}:" to clipboard`,
          arg: `:${emoji.shortcodes?.[0] || emoji.label.replace(/\s+/g, '_')}:`,
          valid: true
        }
      }
    };
  }

  public search(query: string): AlfredResult {
    const matchedEmojis = this.searchEmojis(query);
    const items = matchedEmojis.map(emoji => this.createAlfredItem(emoji));
    
    if (items.length === 0) {
      items.push({
        title: 'No emojis found',
        subtitle: `No results for "${query}"`,
        valid: false,
        icon: {
          type: 'default',
          path: 'icon.png'
        }
      });
    }

    return { items };
  }
}

// Main execution
function main(): void {
  const query = process.argv[2] || '';
  const emojiSearch = new EmojiSearch();
  const result = emojiSearch.search(query);
  
  console.log(JSON.stringify(result, null, 2));
}

// Run main if this is the entry point
main();
