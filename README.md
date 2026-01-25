# GUID Visual Overlay

Hover over any GUID to see a unique, deterministic avatar.

![Demo](https://raw.githubusercontent.com/duncanbeard/vscode-guid-overlay/main/images/demo.gif)

## Features

- **Visual GUID identification** — Each GUID gets a unique avatar, making it easy to spot the same GUID across your codebase
- **30+ avatar styles** — Robots, pixel art, emoji, abstract shapes, and more
- **Azure AD lookup** — Optionally identify users, groups, service principals, and apps by GUID
- **Insert GUID command** — Quickly insert a new GUID with `Ctrl+K, Ctrl+Alt+Shift+G`
- **Fully offline** — All avatars generated locally, no network required (AAD lookup is optional)

## Usage

Simply hover over any GUID in your code:

```
550e8400-e29b-41d4-a716-446655440000
```

A popup will display a unique avatar for that GUID.

### Azure AD Lookup (Optional)

If you work with Azure/Entra ID, you can enable AAD lookup to identify GUIDs as users, groups, service principals, or app registrations.

**Requirements:** Azure CLI (`az`) installed and authenticated (`az login`)

**Modes:**
- `disabled` (default) — Avatar only, no AAD functionality
- `enabled` — Shows a "Look up in Azure AD" button; results appear in a notification
- `auto` — Waits for AAD lookup before showing hover (respects timeout setting)

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `guidVisualOverlay.avatarStyle` | Avatar style | `bottts` |
| `guidVisualOverlay.aadLookupMode` | AAD lookup mode: `disabled`, `enabled`, or `auto` | `disabled` |
| `guidVisualOverlay.aadLookupTimeout` | Timeout (ms) for AAD lookup in `auto` mode | `5000` |

**Available styles:** adventurer, avataaars, bigEars, bigSmile, bottts, croodles, dylan, funEmoji, glass, icons, identicon, initials, lorelei, micah, miniavs, notionists, openPeeps, personas, pixelArt, rings, shapes, thumbs, and more.

## Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| Insert GUID | `Ctrl+K, Ctrl+Alt+Shift+G` | Insert a new random GUID at cursor |
| GUID: Look up in Azure AD | — | Look up the GUID at cursor in Azure AD |
| GUID: Clear Azure AD Cache | — | Clear the AAD lookup cache |

## Why?

GUIDs are hard to tell apart at a glance. This extension gives each one a memorable visual identity, so you can quickly recognize when two GUIDs match — or don't.

The optional AAD lookup goes further — if you're working with Azure resources, you can instantly see what a GUID represents (user, group, service principal, or app).

## Development

This extension is built with [Bun](https://bun.sh), a fast JavaScript runtime and bundler.

### Prerequisites

- [Bun](https://bun.sh) - Install with `curl -fsSL https://bun.sh/install | bash`
- VS Code

### Building

```bash
# Install dependencies
bun install

# Development build
bun run build

# Production build (minified)
bun run build.ts --minify

# Watch mode
bun --watch build.ts
```

### Publishing

```bash
bun run vscode:prepublish
```

## License

MIT
