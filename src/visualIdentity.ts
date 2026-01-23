/**
 * Deterministic Visual Identity Generation
 *
 * All visual properties are derived ONLY from the GUID string.
 * No state, counters, randomness, or configuration allowed.
 *
 * Visual(GUID) = f(GUID)
 */

import * as crypto from 'crypto';

export interface VisualIdentity {
  label: string;      // Short identifier (e.g., "GUID·9QK2")
  color: string;      // RGB color (e.g., "#ff5733")
  symbol: string;     // Visual symbol (e.g., "◆")
  rawHash: string;    // Full SHA-256 hash for debugging
}

/**
 * Fixed symbol set for deterministic selection
 */
const SYMBOLS = ["■", "◆", "●", "▲", "⬢"];

/**
 * Base36 alphabet for label encoding
 */
const BASE36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Compute SHA-256 hash of GUID
 * Input: canonical GUID string
 * Output: 256-bit hash as hex string
 */
function hashGuid(guid: string): string {
  return crypto.createHash('sha256').update(guid).digest('hex');
}

/**
 * Extract bits from hash as integer
 * @param hash - Hex hash string
 * @param startBit - Starting bit position (0-indexed)
 * @param bitCount - Number of bits to extract
 */
function extractBits(hash: string, startBit: number, bitCount: number): number {
  // Convert hash to binary string
  let binary = '';
  for (let i = 0; i < hash.length; i++) {
    binary += parseInt(hash[i], 16).toString(2).padStart(4, '0');
  }

  // Extract bits
  const bits = binary.slice(startBit, startBit + bitCount);
  return parseInt(bits, 2);
}

/**
 * Encode number to base36
 */
function encodeBase36(num: number, length: number): string {
  let result = '';
  let n = num;

  while (n > 0 || result.length < length) {
    result = BASE36[n % 36] + result;
    n = Math.floor(n / 36);
    if (result.length >= length) break;
  }

  return result.slice(0, length);
}

/**
 * Generate deterministic label from hash
 * Uses 40 bits from hash, encodes to base36
 * Format: GUID·XXXX (4 characters)
 */
function generateLabel(hash: string): string {
  const bits = extractBits(hash, 0, 40);
  const encoded = encodeBase36(bits, 4);
  return `GUID·${encoded}`;
}

/**
 * Generate deterministic color from hash
 * Uses HSL color space for perceptual uniformity
 * - Hue: derived from hash (0-360)
 * - Saturation: fixed at 65%
 * - Lightness: fixed at 55%
 */
function generateColor(hash: string): string {
  const hueBits = extractBits(hash, 40, 16);
  const hue = hueBits % 360;

  // Fixed saturation and lightness for consistent appearance
  const saturation = 65;
  const lightness = 55;

  // Convert HSL to RGB
  const rgb = hslToRgb(hue, saturation, lightness);
  return `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  let r: number, g: number, b: number;

  if (sNorm === 0) {
    r = g = b = lNorm;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;

    r = hue2rgb(p, q, hNorm + 1 / 3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Generate deterministic symbol from hash
 * Selects from fixed symbol set
 */
function generateSymbol(hash: string): string {
  const bits = extractBits(hash, 56, 8);
  const index = bits % SYMBOLS.length;
  return SYMBOLS[index];
}

/**
 * Generate complete visual identity for GUID
 * All properties are deterministically derived from the GUID string
 *
 * @param guid - Canonical GUID string (lowercase, dashed)
 * @returns Visual identity with label, color, and symbol
 */
export function generateVisualIdentity(guid: string): VisualIdentity {
  const hash = hashGuid(guid);

  return {
    label: generateLabel(hash),
    color: generateColor(hash),
    symbol: generateSymbol(hash),
    rawHash: hash
  };
}
