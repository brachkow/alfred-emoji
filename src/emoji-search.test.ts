import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { deburr, escapeRegExp } from 'lodash-es';

const require = createRequire(import.meta.url);

// Copy the interfaces and class from emoji-search.ts for testing
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
  mods?: Record<
    string,
    {
      subtitle?: string;
      arg?: string;
      valid?: boolean;
    }
  >;
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
  skins?: unknown[];
}

class EmojiSearch {
  private emojis: EmojiData[] = [];

  constructor() {
    this.loadEmojiData();
  }

  private loadEmojiData(): void {
    try {
      // Load emoji data from emojibase
      const emojiDataPath = require.resolve('emojibase-data/en/data.json');
      const shortcodesPath = require.resolve(
        'emojibase-data/en/shortcodes/github.json',
      );

      const emojiData = JSON.parse(readFileSync(emojiDataPath, 'utf8'));
      const shortcodes = JSON.parse(readFileSync(shortcodesPath, 'utf8'));

      // Merge emoji data with shortcodes and normalize emoji field
      this.emojis = emojiData.map((emoji: EmojiData) => ({
        ...emoji,
        emoji: emoji.emoji, // Use the emoji property from emojibase
        shortcodes: shortcodes[emoji.hexcode] || [],
        tags: emoji.tags || [], // Ensure tags array exists
      }));
    } catch (error) {
      console.error('Failed to load emoji data:', error);
      throw new Error('Failed to load emoji data');
    }
  }

  public static normalizeQuery(query: string): string {
    if (typeof query !== 'string') {
      return '';
    }
    return deburr(query.toLowerCase().trim());
  }

  private searchEmojis(query: string): EmojiData[] {
    if (!query || query.length < 1) {
      // Return popular emojis when no query
      return this.emojis
        .filter((emoji) => emoji.group !== undefined && emoji.group <= 1) // Smileys & People, Animals & Nature
        .slice(0, 20);
    }

    const normalizedQuery = EmojiSearch.normalizeQuery(query);
    const queryRegex = new RegExp(escapeRegExp(normalizedQuery), 'i');

    const results: Array<{ emoji: EmojiData; score: number }> = [];

    for (const emoji of this.emojis) {
      let score = 0;

      // Check emoji label (main name)
      if (emoji.label) {
        const normalizedLabel = EmojiSearch.normalizeQuery(emoji.label);
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
          const normalizedTag = EmojiSearch.normalizeQuery(tag);
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
            const normalizedShortcode = EmojiSearch.normalizeQuery(shortcode);
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
      if (emoji.emoticon?.includes(query)) {
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
      .map((result) => result.emoji);
  }

  public static createAlfredItem(emoji: EmojiData): AlfredItem {
    const shortcodes = Array.isArray(emoji.shortcodes)
      ? emoji.shortcodes.join(', ')
      : '';
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
      title: emoji.label,
      subtitle,
      arg: emoji.emoji,
      autocomplete: emoji.label,
      valid: true,
      icon: {
        type: 'default',
        path: `icons/${emoji.hexcode}.svg`,
      },
      text: {
        copy: emoji.emoji,
        largetype: `${emoji.emoji}\n\n${emoji.label}\n\nTags: ${tags}\nShortcodes: ${shortcodes}`,
      },
    };
  }

  public search(query: string): AlfredResult {
    const matchedEmojis = this.searchEmojis(query);
    const items = matchedEmojis.map((emoji) =>
      EmojiSearch.createAlfredItem(emoji),
    );

    if (items.length === 0) {
      items.push({
        title: 'No emojis found',
        subtitle: `No results for "${query}"`,
        valid: false,
        icon: {
          type: 'default',
          path: 'icon.png',
        },
      });
    }

    return { items };
  }
}

describe('EmojiSearch', () => {
  let emojiSearch: EmojiSearch;

  beforeEach(() => {
    emojiSearch = new EmojiSearch();
  });

  it('should find thumbs up emoji when searching for "like"', () => {
    const result = emojiSearch.search('like');

    expect(result.items.length).toBeGreaterThan(0);

    // Should find thumbs up emoji
    const thumbsUpEmoji = result.items.find(
      (item) => item.arg?.includes('👍') || item.title?.includes('thumbs up'),
    );

    expect(thumbsUpEmoji).toBeDefined();
    expect(thumbsUpEmoji?.title).toBe('thumbs up');
    expect(thumbsUpEmoji?.arg).toBe('👍️');
  });

  it('should find heart emojis when searching for "love"', () => {
    const result = emojiSearch.search('love');

    expect(result.items.length).toBeGreaterThan(0);

    // Should find heart-related emojis
    const hasHeartEmoji = result.items.some(
      (item) =>
        item.arg?.includes('❤') ||
        item.arg?.includes('💙') ||
        item.title?.includes('heart') ||
        item.title?.includes('love'),
    );

    expect(hasHeartEmoji).toBe(true);
  });

  it('should find smile emojis when searching for "smile"', () => {
    const result = emojiSearch.search('smile');

    expect(result.items.length).toBeGreaterThan(0);

    // Should find smiling emojis (there are many with "smile" in the label)
    const smileEmoji = result.items.find(
      (item) =>
        item.title?.includes('smile') ||
        item.arg?.includes('😄') ||
        item.arg?.includes('😊'),
    );

    expect(smileEmoji).toBeDefined();
    expect(smileEmoji?.title).toMatch(/smile/);
  });

  it('should search by exact shortcode', () => {
    const result = emojiSearch.search('thumbsup');

    expect(result.items.length).toBeGreaterThan(0);

    const thumbsUpEmoji = result.items.find((item) => item.arg?.includes('👍'));
    expect(thumbsUpEmoji).toBeDefined();
    expect(thumbsUpEmoji?.arg).toContain('👍');
  });

  it('should return popular emojis when query is empty', () => {
    const result = emojiSearch.search('');

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.length).toBeLessThanOrEqual(20);

    // Should contain common emojis from groups 0 and 1 (smileys and people)
    const hasCommonEmojis = result.items.some(
      (item) =>
        item.arg?.includes('😀') ||
        item.arg?.includes('😊') ||
        item.title?.includes('grin'),
    );

    expect(hasCommonEmojis).toBe(true);
  });

  it('should return "No emojis found" for invalid search', () => {
    const result = emojiSearch.search('xyznonsensequery123');

    expect(result.items.length).toBe(1);
    expect(result.items[0].title).toBe('No emojis found');
    expect(result.items[0].valid).toBe(false);
  });

  it('should include tags in subtitle', () => {
    const result = emojiSearch.search('like');

    const thumbsUpEmoji = result.items.find((item) => item.arg?.includes('👍'));

    expect(thumbsUpEmoji?.subtitle).toContain('like');
    expect(thumbsUpEmoji?.subtitle).toContain('good');
    expect(thumbsUpEmoji?.subtitle).toContain('yes');
  });

  it('should provide correct copy functionality', () => {
    const result = emojiSearch.search('thumbs up');

    const thumbsUpEmoji = result.items[0];

    expect(thumbsUpEmoji?.arg).toBe('👍️'); // Default copy emoji
    expect(thumbsUpEmoji?.text?.copy).toBe('👍️'); // Text copy emoji
    expect(thumbsUpEmoji?.mods).toBeUndefined(); // No modifiers
  });
});
