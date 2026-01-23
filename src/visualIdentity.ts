/**
 * Deterministic Visual Identity Generation
 *
 * All visual properties are derived ONLY from the GUID string.
 * No state, counters, randomness, or configuration allowed.
 *
 * Visual(GUID) = f(GUID)
 */

import { createAvatar, Style } from '@dicebear/core';
import * as collection from '@dicebear/collection';

export interface VisualIdentity {
  avatarSvg: string;  // DiceBear SVG for unique visual
}

// Map of style names to DiceBear style modules
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styleMap: Record<string, Style<any>> = {
  adventurer: collection.adventurer,
  adventurerNeutral: collection.adventurerNeutral,
  avataaars: collection.avataaars,
  avataaarsNeutral: collection.avataaarsNeutral,
  bigEars: collection.bigEars,
  bigEarsNeutral: collection.bigEarsNeutral,
  bigSmile: collection.bigSmile,
  bottts: collection.bottts,
  botttsNeutral: collection.botttsNeutral,
  croodles: collection.croodles,
  croodlesNeutral: collection.croodlesNeutral,
  dylan: collection.dylan,
  funEmoji: collection.funEmoji,
  glass: collection.glass,
  icons: collection.icons,
  identicon: collection.identicon,
  initials: collection.initials,
  lorelei: collection.lorelei,
  loreleiNeutral: collection.loreleiNeutral,
  micah: collection.micah,
  miniavs: collection.miniavs,
  notionists: collection.notionists,
  notionistsNeutral: collection.notionistsNeutral,
  openPeeps: collection.openPeeps,
  personas: collection.personas,
  pixelArt: collection.pixelArt,
  pixelArtNeutral: collection.pixelArtNeutral,
  rings: collection.rings,
  shapes: collection.shapes,
  thumbs: collection.thumbs,
};

/**
 * Generate avatar SVG using DiceBear
 */
export function generateAvatarSvg(guid: string, styleName: string): string {
  const style = styleMap[styleName] || collection.bottts;
  const avatar = createAvatar(style, {
    seed: guid,
    size: 120,
  });
  return avatar.toString();
}

/**
 * Generate complete visual identity for GUID
 * All properties are deterministically derived from the GUID string
 *
 * @param guid - Canonical GUID string (lowercase, dashed)
 * @param styleName - DiceBear style name from configuration
 * @returns Visual identity with avatar SVG
 */
export function generateVisualIdentity(guid: string, styleName: string = 'bottts'): VisualIdentity {
  return {
    avatarSvg: generateAvatarSvg(guid, styleName)
  };
}
