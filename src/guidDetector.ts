/**
 * GUID Detection and Validation
 *
 * Detects canonical GUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * All operations are stateless and deterministic.
 */

export interface GuidMatch {
  guid: string;        // Normalized canonical form (lowercase, dashed)
  startIndex: number;
  endIndex: number;
}

/**
 * Canonical GUID pattern (case-insensitive)
 * Format: 8-4-4-4-12 hex digits with hyphens
 */
const GUID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;

/**
 * Normalize GUID to canonical form
 * - Lowercase
 * - Trim whitespace
 * - Preserve dashes
 */
export function normalizeGuid(guid: string): string {
  return guid.trim().toLowerCase();
}

/**
 * Validate GUID format
 */
export function isValidGuid(guid: string): boolean {
  const normalized = normalizeGuid(guid);
  const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  return pattern.test(normalized);
}

/**
 * Find all GUIDs in text
 * Returns normalized GUIDs with their positions
 */
export function findGuids(text: string): GuidMatch[] {
  const matches: GuidMatch[] = [];
  const pattern = new RegExp(GUID_PATTERN);
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    matches.push({
      guid: normalizeGuid(match[0]),
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }

  return matches;
}

/**
 * Get GUID at specific position in text
 * Returns null if no GUID found at position
 */
export function getGuidAtPosition(text: string, position: number): string | null {
  const matches = findGuids(text);

  for (const match of matches) {
    if (position >= match.startIndex && position < match.endIndex) {
      return match.guid;
    }
  }

  return null;
}
