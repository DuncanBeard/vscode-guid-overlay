# GUID Visual Overlay

Hover over any GUID to see a unique, deterministic avatar.

![Demo](https://raw.githubusercontent.com/duncanbeard/vscode-guid-overlay/main/images/demo.gif)

## Features

- **Visual GUID identification** — Each GUID gets a unique avatar, making it easy to spot the same GUID across your codebase
- **18 avatar styles** — Robots, characters, portraits, and more
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

## Available Styles

| Style | Preview |
|-------|---------|
| `adventurer` | ![adventurer](https://api.dicebear.com/9.x/adventurer/svg?seed=deadbeef-dead-beef-dead-beefdeadbeef&size=64) |
| `adventurerNeutral` | ![adventurerNeutral](https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=deadbeef-dead-beef-dead-beefdeadbeef&size=64) |
| `avataaars` | ![avataaars](https://api.dicebear.com/9.x/avataaars/svg?seed=deadbeef-dead-beef-dead-beefdeadbeef&size=64) |
| `avataaarsNeutral` | ![avataaarsNeutral](https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=deadbeef-dead-beef-dead-beefdeadbeef&size=64) |
| `bigEars` | ![bigEars](https://api.dicebear.com/9.x/big-ears/svg?seed=deadbeef-dead-beef-dead-beefdeadbeef&size=64) |
| `bigEarsNeutral` | ![bigEarsNeutral](https://api.dicebear.com/9.x/big-ears-neutral/svg?seed=deadbeef-dead-beef-dead-beefdeadbeef&size=64) |
| `bigSmile` | ![bigSmile](https://api.dicebear.com/9.x/big-smile/svg?seed=deadbeef-dead-beef-dead-beefdeadbeef&size=64) |
| `bottts` | ![bottts](https://api.dicebear.com/9.x/bottts/svg?seed=deadbeef-dead-beef-dead-beefdeadbeef&size=64) |
| `croodles` | ![croodles](https://api.dicebear.com/9.x/croodles/svg?seed=deadbeef-dead-beef-dead-beefdeadbeef&size=64) |
| `croodlesNeutral` | ![croodlesNeutral](https://api.dicebear.com/9.x/croodles-neutral/svg?seed=deadbeef-dead-beef-dead-beefdeadbeef&size=64) |
| `dylan` | ![dylan](https://api.dicebear.com/9.x/dylan/svg?seed=deadbeef-dead-beef-dead-beefdeadbeef&size=64) |
| `lorelei` | ![lorelei](https://api.dicebear.com/9.x/lorelei/svg?seed=deadbeef-dead-beef-dead-beefdeadbeef&size=64) |
| `loreleiNeutral` | ![loreleiNeutral](https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=deadbeef-dead-beef-dead-beefdeadbeef&size=64) |
| `micah` | ![micah](https://api.dicebear.com/9.x/micah/svg?seed=deadbeef-dead-beef-dead-beefdeadbeef&size=64) |
| `notionists` | ![notionists](https://api.dicebear.com/9.x/notionists/svg?seed=deadbeef-dead-beef-dead-beefdeadbeef&size=64) |
| `notionistsNeutral` | ![notionistsNeutral](https://api.dicebear.com/9.x/notionists-neutral/svg?seed=deadbeef-dead-beef-dead-beefdeadbeef&size=64) |
| `openPeeps` | ![openPeeps](https://api.dicebear.com/9.x/open-peeps/svg?seed=deadbeef-dead-beef-dead-beefdeadbeef&size=64) |
| `personas` | ![personas](https://api.dicebear.com/9.x/personas/svg?seed=deadbeef-dead-beef-dead-beefdeadbeef&size=64) |

## Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| Insert GUID | `Ctrl+K, Ctrl+Alt+Shift+G` | Insert a new random GUID at cursor |

## Why?

GUIDs are hard to tell apart at a glance. This extension gives each one a memorable visual identity, so you can quickly recognize when two GUIDs match — or don't.

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
