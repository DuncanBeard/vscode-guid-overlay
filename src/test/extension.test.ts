/**
 * Unit tests for GUID Visual Overlay extension
 *
 * Run with: npm test
 */

import * as assert from 'assert';
import { normalizeGuid, isValidGuid, findGuids, getGuidAtPosition } from '../guidDetector';
import { generateVisualIdentity, generateAvatarSvg } from '../visualIdentity';

describe('GUID Detector', () => {
  describe('normalizeGuid', () => {
    it('should lowercase GUIDs', () => {
      const result = normalizeGuid('550E8400-E29B-41D4-A716-446655440000');
      assert.strictEqual(result, '550e8400-e29b-41d4-a716-446655440000');
    });

    it('should trim whitespace', () => {
      const result = normalizeGuid('  550e8400-e29b-41d4-a716-446655440000  ');
      assert.strictEqual(result, '550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('isValidGuid', () => {
    it('should accept valid lowercase GUID', () => {
      assert.strictEqual(isValidGuid('550e8400-e29b-41d4-a716-446655440000'), true);
    });

    it('should accept valid uppercase GUID', () => {
      assert.strictEqual(isValidGuid('550E8400-E29B-41D4-A716-446655440000'), true);
    });

    it('should accept all-zero GUID', () => {
      assert.strictEqual(isValidGuid('00000000-0000-0000-0000-000000000000'), true);
    });

    it('should accept all-f GUID', () => {
      assert.strictEqual(isValidGuid('ffffffff-ffff-ffff-ffff-ffffffffffff'), true);
    });

    it('should reject GUID without dashes', () => {
      assert.strictEqual(isValidGuid('550e8400e29b41d4a716446655440000'), false);
    });

    it('should reject GUID with wrong segment lengths', () => {
      assert.strictEqual(isValidGuid('550e8400-e29b-41d4-a716-44665544000'), false);
    });

    it('should reject non-hex characters', () => {
      assert.strictEqual(isValidGuid('550g8400-e29b-41d4-a716-446655440000'), false);
    });

    it('should reject empty string', () => {
      assert.strictEqual(isValidGuid(''), false);
    });
  });

  describe('findGuids', () => {
    it('should find single GUID in text', () => {
      const text = 'User ID: 550e8400-e29b-41d4-a716-446655440000';
      const matches = findGuids(text);
      assert.strictEqual(matches.length, 1);
      assert.strictEqual(matches[0].guid, '550e8400-e29b-41d4-a716-446655440000');
    });

    it('should find multiple GUIDs in text', () => {
      const text = 'IDs: 550e8400-e29b-41d4-a716-446655440000 and 6ba7b810-9dad-11d1-80b4-00c04fd430c8';
      const matches = findGuids(text);
      assert.strictEqual(matches.length, 2);
    });

    it('should return correct positions', () => {
      const text = 'ID: 550e8400-e29b-41d4-a716-446655440000';
      const matches = findGuids(text);
      assert.strictEqual(matches[0].startIndex, 4);
      assert.strictEqual(matches[0].endIndex, 40);
    });

    it('should return empty array for text without GUIDs', () => {
      const text = 'No GUIDs here!';
      const matches = findGuids(text);
      assert.strictEqual(matches.length, 0);
    });

    it('should normalize found GUIDs to lowercase', () => {
      const text = 'ID: 550E8400-E29B-41D4-A716-446655440000';
      const matches = findGuids(text);
      assert.strictEqual(matches[0].guid, '550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('getGuidAtPosition', () => {
    const text = 'ID: 550e8400-e29b-41d4-a716-446655440000 end';

    it('should return GUID when position is at start of GUID', () => {
      const result = getGuidAtPosition(text, 4);
      assert.strictEqual(result, '550e8400-e29b-41d4-a716-446655440000');
    });

    it('should return GUID when position is in middle of GUID', () => {
      const result = getGuidAtPosition(text, 20);
      assert.strictEqual(result, '550e8400-e29b-41d4-a716-446655440000');
    });

    it('should return GUID when position is at end of GUID', () => {
      const result = getGuidAtPosition(text, 39);
      assert.strictEqual(result, '550e8400-e29b-41d4-a716-446655440000');
    });

    it('should return null when position is before GUID', () => {
      const result = getGuidAtPosition(text, 2);
      assert.strictEqual(result, null);
    });

    it('should return null when position is after GUID', () => {
      const result = getGuidAtPosition(text, 41);
      assert.strictEqual(result, null);
    });
  });
});

describe('Visual Identity', () => {
  const testGuid = '550e8400-e29b-41d4-a716-446655440000';

  describe('generateVisualIdentity', () => {
    it('should return avatarSvg property', () => {
      const identity = generateVisualIdentity(testGuid);
      assert.ok(identity.avatarSvg);
      assert.ok(identity.avatarSvg.startsWith('<svg'));
    });

    it('should generate deterministic output', () => {
      const identity1 = generateVisualIdentity(testGuid);
      const identity2 = generateVisualIdentity(testGuid);
      assert.strictEqual(identity1.avatarSvg, identity2.avatarSvg);
    });

    it('should generate different output for different GUIDs', () => {
      const identity1 = generateVisualIdentity('550e8400-e29b-41d4-a716-446655440000');
      const identity2 = generateVisualIdentity('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
      assert.notStrictEqual(identity1.avatarSvg, identity2.avatarSvg);
    });
  });

  describe('generateAvatarSvg', () => {
    it('should return valid SVG string', () => {
      const svg = generateAvatarSvg(testGuid, 'bottts');
      assert.ok(svg.startsWith('<svg'));
      assert.ok(svg.includes('</svg>'));
    });

    it('should generate deterministic SVG', () => {
      const svg1 = generateAvatarSvg(testGuid, 'bottts');
      const svg2 = generateAvatarSvg(testGuid, 'bottts');
      assert.strictEqual(svg1, svg2);
    });

    it('should generate different SVG for different styles', () => {
      const svg1 = generateAvatarSvg(testGuid, 'bottts');
      const svg2 = generateAvatarSvg(testGuid, 'avataaars');
      assert.notStrictEqual(svg1, svg2);
    });

    it('should fall back to bottts for unknown style', () => {
      const svgUnknown = generateAvatarSvg(testGuid, 'nonexistent-style');
      const svgBottts = generateAvatarSvg(testGuid, 'bottts');
      assert.strictEqual(svgUnknown, svgBottts);
    });
  });
});

describe('Performance', () => {
  const testGuid = '550e8400-e29b-41d4-a716-446655440000';
  const iterations = 100;

  describe('GUID Detection Performance', () => {
    it(`should detect GUID in < 1ms average (${iterations} iterations)`, () => {
      const text = 'User ID: 550e8400-e29b-41d4-a716-446655440000 is active';

      const start = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        getGuidAtPosition(text, 20);
      }
      const end = process.hrtime.bigint();

      const avgMs = Number(end - start) / iterations / 1_000_000;
      console.log(`      Average GUID detection time: ${avgMs.toFixed(4)}ms`);
      assert.ok(avgMs < 1, `Detection took ${avgMs}ms, expected < 1ms`);
    });
  });

  describe('Visual Identity Generation Performance', () => {
    it(`should generate identity in < 50ms average (${iterations} iterations)`, () => {
      const start = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        generateVisualIdentity(testGuid);
      }
      const end = process.hrtime.bigint();

      const avgMs = Number(end - start) / iterations / 1_000_000;
      console.log(`      Average identity generation time: ${avgMs.toFixed(4)}ms`);
      assert.ok(avgMs < 50, `Generation took ${avgMs}ms, expected < 50ms`);
    });
  });

  describe('Avatar SVG Generation Performance', () => {
    it(`should generate SVG in < 100ms average (${iterations} iterations)`, () => {
      const start = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        generateAvatarSvg(testGuid, 'bottts');
      }
      const end = process.hrtime.bigint();

      const avgMs = Number(end - start) / iterations / 1_000_000;
      console.log(`      Average SVG generation time: ${avgMs.toFixed(4)}ms`);
      assert.ok(avgMs < 100, `SVG generation took ${avgMs}ms, expected < 100ms`);
    });

    it('should measure end-to-end hover simulation time', () => {
      const text = 'User ID: 550e8400-e29b-41d4-a716-446655440000 is active';

      const start = process.hrtime.bigint();

      // Simulate hover workflow
      const guid = getGuidAtPosition(text, 20);
      if (guid) {
        const identity = generateVisualIdentity(guid);
        // Simulate base64 encoding for hover display
        const svgBase64 = Buffer.from(identity.avatarSvg).toString('base64');
      }

      const end = process.hrtime.bigint();
      const totalMs = Number(end - start) / 1_000_000;

      console.log(`      End-to-end hover time: ${totalMs.toFixed(4)}ms`);
      assert.ok(totalMs < 200, `Total hover time ${totalMs}ms, expected < 200ms`);
    });
  });
});
