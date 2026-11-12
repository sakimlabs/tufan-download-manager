# Hermes Agent Prompt — Integrate the Download Manager Icon Pack

I have supplied `Download_Manager_Icon_Pack.zip` for my existing Download Manager alternative project. Inspect the repository first and identify all three platform targets (desktop app, browser extension, and the third platform already present). Detect the frameworks from the project files; do not assume them.

## Goal
Integrate this icon set consistently across all three platforms, including the Windows executable, taskbar, installer/shortcut, and browser extension toolbar. Preserve existing functionality, branding, app IDs, bundle IDs, manifest settings, and build configuration.

## Asset map
- `master-icon-1024.png`: high-resolution master.
- `windows-app.ico`: multi-resolution Windows icon.
- `electron/icon.png`: Electron-compatible PNG.
- `browser-extension/icons/icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`: extension icons.
- `browser-extension/manifest-icons-snippet.json`: reference only; merge with the current manifest.
- `png/`: general PNG sizes.
- `linux/hicolor/`: Linux launcher sizes.

## Required workflow
1. Inspect the repository, package files, build scripts, installer config, extension manifest(s), and all current icon references.
2. Identify the three platforms and list the exact files that control each platform's icon.
3. Back up files before editing. Do not overwrite unrelated configuration or assets.
4. Copy the best matching supplied assets into the project's established asset locations.
5. Windows: configure the executable, installer, shortcut, and taskbar to use `windows-app.ico` or the framework's required equivalent. Check runtime window icon configuration too.
6. Browser extension: use all four extension PNG sizes. Merge icon paths into the existing manifest while preserving permissions, action settings, service worker/background config, name, version, and every unrelated field.
7. Third platform: use the correct native icon format and sizes required by the detected framework. Generate additional native formats from the 1024px master only if needed.
8. Update every relevant reference in runtime code, packaging/build configuration, installer metadata, and platform resources. Do not change product name, app ID, bundle ID, or package identifiers.
9. Ensure square aspect ratio and avoid CSS scaling, stretching, or upscaling tiny assets.
10. Build all three platform targets using existing scripts. Run available lint/type checks and inspect build logs for missing icon warnings.
11. If a platform cannot be built on this machine, state exactly what was checked and what remains unverified. Never claim a successful build without evidence.
12. Report detected platforms/frameworks, files changed, icon configuration per platform, commands and test results, and any manual steps.

Do not create another ZIP unless I explicitly ask. Do not change application logic or unrelated UI. Ask before destructive or ambiguous changes. Finish with the exact commands I should run to rebuild/package the application.
