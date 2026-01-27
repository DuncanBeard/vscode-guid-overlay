# GUID Visual Overlay - Copilot Instructions

## Project Overview

VS Code extension that displays deterministic visual avatars when hovering over GUIDs. Uses DiceBear for avatar generation with 30+ configurable styles. Optionally integrates with Azure AD via the `az` CLI to identify users, groups, service principals, and apps.

## Architecture

```
extension.ts          → Entry point, registers commands and hover provider
hoverProvider.ts      → VS Code HoverProvider, reads config, renders avatar SVG, AAD button/info
guidDetector.ts       → Regex-based GUID detection with position lookup
visualIdentity.ts     → DiceBear avatar generation + SHA-256 hash utilities
aadLookup.ts          → Azure AD lookup via az CLI with LRU cache
```

### Core Principle: Determinism

All visual output is derived **exclusively** from the GUID string: `Visual(GUID) = f(GUID)`. Never introduce randomness, counters, or state that would make the same GUID produce different visuals.

### VS Code Hover Limitations

The VS Code HoverProvider API has important limitations:
- **Hovers cannot be updated after display** — Once `provideHover()` returns, the content is fixed
- **`editor.action.showHover` doesn't refresh open hovers** — It only triggers a new hover if none is open
- **Command links work** — Use `command:` URIs in markdown to trigger actions from hover buttons

**Design implications:**
- For async operations (like AAD lookup), either wait before returning the hover (`auto` mode) or use a button that shows results in a notification (`enabled` mode)
- Never show "Loading..." text that can't be updated — it confuses users
- Cache results so subsequent hovers are instant

## Development Workflow

```bash
bun install          # Install dependencies
bun run build        # Build with esbuild
bun --watch build.ts # Watch mode for development
bun test             # Run tests
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
const aadMode = config.get<string>('aadLookupMode', 'disabled');
```

### Hover Content
Use `vscode.MarkdownString` with `supportHtml = true` for SVG embedding:
```typescript
const svgBase64 = Buffer.from(svg).toString('base64');
markdown.appendMarkdown(`<img src="data:image/svg+xml;base64,${svgBase64}" />`);
```

### Command Links in Hovers
To add clickable buttons in hovers:
```typescript
const commandUri = `command:guid-visual-overlay.lookupAad?${encodeURIComponent(JSON.stringify(guid))}`;
markdown.appendMarkdown(`[🔍 Look up in Azure AD](${commandUri})`);
```

### AAD Lookup Pattern
The AAD lookup uses an LRU cache with TTL:
```typescript
// Check cache first (synchronous)
const cached = getCachedAadObject(guid);
if (cached !== undefined) {
  // Use cached result
} else {
  // Trigger lookup (async)
  await lookupGuidInAad(guid);
}
```

## File Conventions

- **Commands**: Prefix with `guid-visual-overlay.` (e.g., `guid-visual-overlay.insertGuid`)
- **Settings**: Prefix with `guidVisualOverlay.` (camelCase, e.g., `guidVisualOverlay.avatarStyle`)
- **GUID format**: Always normalize to lowercase dashed form: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

## Testing

- `test-guids.txt` - Sample GUIDs for manual hover testing
- `test-determinism.js` - Verifies hash determinism
- `bun test` - Run unit tests

## Packaging & Publishing

The core extension functions **entirely offline** - no network calls for avatar generation.

```bash
bun run vscode:prepublish   # Production build (minified)
vsce package                 # Creates guid-visual-overlay-x.x.x.vsix
vsce publish                 # Publish to VS Code Marketplace
```

### Offline Requirements
- All avatar generation happens locally via `@dicebear/core` + `@dicebear/collection`
- No API calls, CDN resources, or external URLs for core functionality
- AAD lookup is optional and requires Azure CLI

### Bundle Size Considerations
- `@dicebear/collection` includes all 30+ styles (~2MB)
- If bundle size becomes an issue, import individual styles: `@dicebear/bottts`, `@dicebear/avataaars`, etc.

## Azure AD Integration

### How It Works
- Uses Azure CLI (`az`) to query AAD — no SDK dependencies
- Runs 4 lookups in parallel: `az ad user show`, `az ad group show`, `az ad sp show`, `az ad app show`
- LRU cache with 5-minute TTL avoids repeated CLI calls
- All CLI calls use `windowsHide: true` (no console flash on Windows)

### AAD Lookup Modes
| Mode | Behavior | Use Case |
|------|----------|----------|
| `disabled` | No AAD functionality | Default, offline-only |
| `enabled` | Button in hover → notification popup | User controls when to look up |
| `auto` | Waits for lookup before showing hover | User accepts delay for inline results |

### Error Handling Philosophy
All AAD errors are handled silently — the avatar always displays:
- CLI not installed → avatar only
- Not authenticated → avatar only
- GUID not in AAD → avatar only (or "Not found" in notification)
- Timeout → avatar only

Never block the core functionality (avatar display) due to AAD issues.

### Adding New AAD Object Types
1. Add type to `AadObjectType` union in `aadLookup.ts`
2. Add icon to `AAD_TYPE_ICONS` map
3. Add interface for raw CLI response
4. Add CLI command to parallel lookup in `lookupGuidInAad()`
5. Add result mapping logic

## Dependencies

- `@dicebear/core` + `@dicebear/collection` - Offline avatar generation (no network calls)
- Node's built-in `crypto` module for SHA-256 hashing and `randomUUID()`
- Node's built-in `child_process` for Azure CLI execution
