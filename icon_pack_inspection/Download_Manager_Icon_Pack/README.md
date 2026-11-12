# Download Manager Icon Pack

A coordinated icon set based on the approved blue/cyan lightning-vortex design.

## Contents
- `master-icon-1024.png` — high-resolution master PNG.
- `png/` — square PNG exports: 16, 24, 32, 48, 64, 128, 256, 512 and 1024 px.
- `windows-app.ico` — multi-resolution Windows icon.
- `electron/icon.png` — 1024px Electron-compatible PNG.
- `browser-extension/icons/` — Chromium/Edge extension icons (16, 32, 48, 128).
- `browser-extension/manifest-icons-snippet.json` — reference snippet to merge into the existing manifest.
- `linux/hicolor/` — Linux launcher icon sizes.
- `design-preview.png` — original design sheet.

## Notes
The icon uses a dark rounded-square tile to preserve contrast and consistency across desktop and extension surfaces. Very small sizes naturally show less detail.

Merge the extension snippet into the existing manifest; do not replace unrelated manifest settings. Verify the icon in the built application, taskbar, Start menu, installer, and extension toolbar. Windows may cache old icons; rebuild, refresh shortcuts, and restart Explorer if needed.
