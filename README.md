# VaultImage MCP 🔒

**Local image tools for AI agents.** An [MCP](https://modelcontextprotocol.io) server that lets Claude, ChatGPT Apps, or any MCP host work with images **on the user's own machine** — images are never uploaded.

Part of the VaultPDF / VaultImage family of privacy-first agent tools. Built for the fast-growing, still-uncrowded MCP / agent-app ecosystem.

## Tools
| tool | what it does |
|---|---|
| `image_info` | dimensions, format, file size, and whether the image carries EXIF metadata |
| `image_resize` | resize by width and/or height (one value preserves aspect ratio) |
| `image_convert` | convert between formats (PNG/JPG/BMP/TIFF/GIF) via the output extension |
| `image_strip_metadata` | write a copy with EXIF/GPS/camera metadata removed (privacy) |

All operations run locally via [`jimp`](https://www.npmjs.com/package/jimp) (pure JavaScript, no native dependencies). Nothing leaves the machine.

## Run
```bash
# straight from GitHub, no install:
npx github:AlexeySamosadov/vaultimg-mcp
```

## Use in Claude Desktop
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "vaultimg": { "command": "npx", "args": ["github:AlexeySamosadov/vaultimg-mcp"] }
  }
}
```

## Why
Agents increasingly need to handle user images — resizing for upload, converting formats, and especially **stripping EXIF/GPS metadata before anything is shared**. Doing it locally keeps private photos private. No server, no account, no upload.

MIT licensed.
