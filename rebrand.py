#!/usr/bin/env python3
"""
Tufan Download Manager - Renaming Script
Rebrands Tufan Download Manager to Tufan Download Manager
Credits to Md. Sakim
"""

import os
import re

BASE_DIR = r"D:\Tufan Download Manager"

# Replacements for text content
replacements = {
    # Names and Credits
    "Md. Sakim": "Md. Sakim",
    "sakimlabs": "sakimlabs",  # Only in docs/readme, not in Cargo.toml git URLs
    "Tufan Download Manager": "Tufan Download Manager",
    "tufan-download-manager": "tufan-download-manager",
    "TDM": "TDM",
    "tdm-": "tdm-",  # Module prefixes
}

# Files to skip (binary or critical configs)
skip_dirs = {".git", "target", "node_modules"}
skip_extensions = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".exe", ".dll", ".lib", ".obj", ".pdb"}
skip_files = {"Cargo.lock"}

def should_skip(path):
    parts = path.split(os.sep)
    if any(part in skip_dirs for part in parts):
        return True
    if any(path.endswith(ext) for ext in skip_extensions):
        return True
    if os.path.basename(path) in skip_files:
        return True
    return False

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        for old, new in replacements.items():
            # Special handling for Cargo.toml git URLs - don't change sakimlabs there
            if "Cargo.toml" in filepath and "git = " in content:
                if old == "sakimlabs":
                    continue
            content = content.replace(old, new)
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated: {filepath}")
            return 1
        return 0
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return 0

def main():
    updated_count = 0
    for root, dirs, files in os.walk(BASE_DIR):
        # Skip hidden and build directories
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        
        for file in files:
            filepath = os.path.join(root, file)
            if not should_skip(filepath):
                updated_count += process_file(filepath)
    
    print(f"\n=== Renaming Complete ===")
    print(f"Files updated: {updated_count}")
    print(f"Branding changed to: Tufan Download Manager")
    print(f"Credit updated to: Md. Sakim (https://github.com/sakimlabs)")

if __name__ == "__main__":
    main()
