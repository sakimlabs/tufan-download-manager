#!/usr/bin/env python3
"""
Tufan Download Manager - Complete Rebranding Script
Renames binary files (icons, logos, browser extensions, etc.)
"""

import os
import shutil

BASE_DIR = r"D:\Tufan Download Manager"

# Rename mapping for binary files
rename_map = {
    # App icons
    "crates/app/assets/icons/tango/README.txt": "crates/app/assets/icons/tango/README.txt",
    "crates/app/assets/icons/app.ico": "crates/app/assets/icons/tufan.ico",
    "crates/app/assets/icons/app.png": "crates/app/assets/icons/tufan.png",
    
    # Browser extension icons
    "tools/extension/icons/icon-16.png": "tools/extension/icons/tufan-16.png",
    "tools/extension/icons/icon-48.png": "tools/extension/icons/tufan-48.png",
    "tools/extension/icons/icon-128.png": "tools/extension/icons/tufan-128.png",
    
    # Logo files
    "docs/images/logo.png": "docs/images/tufan-logo.png",
    "docs/images/logo.svg": "docs/images/tufan-logo.svg",
    "website/assets/logo-256.webp": "website/assets/tufan-logo-256.webp",
    
    # Test fixtures (binary files)
    "crates/tools/tests/fixtures/MisterDownloadManager-9.9.9-x64.zip": "crates/tools/tests/fixtures/TufanDownloadManager-9.9.9-x64.zip",
    "crates/tools/tests/fixtures/mdm-SHA256SUMS.txt.sig": "crates/tools/tests/fixtures/tdm-SHA256SUMS.txt.sig",
    "crates/tools/tests/fixtures/gallery-dl-SHA256SUMS.sig": "crates/tools/tests/fixtures/gallery-dl-SHA256SUMS.sig",
    "crates/tools/tests/fixtures/SHA2-256SUMS.sig": "crates/tools/tests/fixtures/SHA2-256SUMS.sig",
    
    # Torrent test files
    "tools/lab/Open Movie Night.torrent": "tools/lab/Tufan Movie Night.torrent",
}

def main():
    renamed_count = 0
    for old_path, new_path in rename_map.items():
        old_full = os.path.join(BASE_DIR, old_path)
        new_full = os.path.join(BASE_DIR, new_path)
        
        if os.path.exists(old_full):
            try:
                # Create directory if needed
                os.makedirs(os.path.dirname(new_full), exist_ok=True)
                shutil.move(old_full, new_full)
                print(f"Renamed: {old_path} -> {new_path}")
                renamed_count += 1
            except Exception as e:
                print(f"Error renaming {old_path}: {e}")
        else:
            print(f"Not found: {old_path}")
    
    print(f"\n=== Binary File Renaming Complete ===")
    print(f"Files renamed: {renamed_count}")

if __name__ == "__main__":
    main()