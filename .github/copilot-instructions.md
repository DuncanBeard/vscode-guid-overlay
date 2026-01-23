# GUID Visual Overlay - Copilot Instructions

## Project Overview

VS Code extension that displays deterministic visual avatars when hovering over GUIDs. Uses DiceBear for avatar generation with 30+ configurable styles.

## Architecture

```
extension.ts          → Entry point, registers commands and hover provider
hoverProvider.ts      → VS Code HoverProvider, reads config, renders avatar SVG
guidDetector.ts       → Regex-based GUID detection with position lookup
visualIdentity.ts     → DiceBear avatar generation + SHA-256 hash utilities
```

### Core Principle: Determinism

All visual output is derived **exclusively** from the GUID string: `Visual(GUID) = f(GUID)`. Never introduce randomness, counters, or state that would make the same GUID produce different visuals.

## Development Workflow

```bash
npm run compile      # Build TypeScript → out/
npm run watch        # Watch mode for development
F5                   # Launch Extension Development Host in VS Code
```

## Key Patterns

### Adding a New DiceBear Style
1. Add to `styleMap` in `src/visualIdentity.ts`
2. Add to `enum` array in `package.json` under `guidVisualOverlay.avatarStyle`
3. Add description to `enumDescriptions` array in same location

### Configuration Access
```typescript
const config = vscode.workspace.getConfiguration('guidVisualOverlay');
const styleName = config.get<string>('avatarStyle', 'bottts');
```

### Hover Content
Use `vscode.MarkdownString` with `supportHtml = true` for SVG embedding:
```typescript
const svgBase64 = Buffer.from(svg).toString('base64');
markdown.appendMarkdown(`<img src="data:image/svg+xml;base64,${svgBase64}" />`);
```

## File Conventions

- **Commands**: Prefix with `guid-visual-overlay.` (e.g., `guid-visual-overlay.insertGuid`)
- **Settings**: Prefix with `guidVisualOverlay.` (camelCase, e.g., `guidVisualOverlay.avatarStyle`)
- **GUID format**: Always normalize to lowercase dashed form: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

## Testing

- `sandbox/dicebear-preview.html` - Browser preview of all avatar styles
- `test-guids.txt` - Sample GUIDs for manual hover testing
- `test-determinism.js` - Verifies hash determinism

## Packaging & Publishing

The extension must function **entirely offline** - no network calls allowed.

```bash
npm install -g @vscode/vsce    # Install VS Code Extension CLI
vsce package                    # Creates guid-visual-overlay-x.x.x.vsix
vsce publish                    # Publish to VS Code Marketplace
```

**Goal:** Publish to the [VS Code Marketplace](https://marketplace.visualstudio.com/) for public availability.

### Offline Requirements
- All avatar generation happens locally via `@dicebear/core` + `@dicebear/collection`
- No API calls, CDN resources, or external URLs in production code
- The `sandbox/dicebear-preview.html` uses the DiceBear API for convenience but is **not** included in the extension bundle

### Bundle Size Considerations
- `@dicebear/collection` includes all 30+ styles (~2MB)
- If bundle size becomes an issue, import individual styles: `@dicebear/bottts`, `@dicebear/avataaars`, etc.

## Dependencies

- `@dicebear/core` + `@dicebear/collection` - Offline avatar generation (no network calls)
- Node's built-in `crypto` module for SHA-256 hashing and `randomUUID()`
