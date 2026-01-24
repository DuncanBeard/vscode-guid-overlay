# GUID Visual Overlay

Hover over any GUID to see a unique, deterministic avatar.

![Demo](https://raw.githubusercontent.com/duncanbeard/vscode-guid-overlay/main/images/demo.gif)

## Features

- **Visual GUID identification** — Each GUID gets a unique avatar, making it easy to spot the same GUID across your codebase
- **30+ avatar styles** — Robots, pixel art, emoji, abstract shapes, and more
- **Insert GUID command** — Quickly insert a new GUID with `Ctrl+K, Ctrl+Alt+Shift+G`
- **Fully offline** — All avatars generated locally, no network required

## Usage

Simply hover over any GUID in your code:

```
550e8400-e29b-41d4-a716-446655440000
```

A popup will display a unique avatar for that GUID.

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `guidVisualOverlay.avatarStyle` | Avatar style | `bottts` |

**Available styles:** adventurer, avataaars, bigEars, bigSmile, bottts, croodles, dylan, funEmoji, glass, icons, identicon, initials, lorelei, micah, miniavs, notionists, openPeeps, personas, pixelArt, rings, shapes, thumbs, and more.

## Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| Insert GUID | `Ctrl+K, Ctrl+Alt+Shift+G` | Insert a new random GUID at cursor |

## Why?

GUIDs are hard to tell apart at a glance. This extension gives each one a memorable visual identity, so you can quickly recognize when two GUIDs match — or don't.

## Development

This extension is built with [Bun](https://bun.sh), a fast JavaScript runtime and bundler.

### Prerequisites

- [Bun](https://bun.sh) - Install via your package manager (see the [official installation docs](https://bun.sh/docs/installation))
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
