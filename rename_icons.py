#!/usr/bin/env python3
import os
import shutil

BASE_DIR = r"D:\Tufan Download Manager"

# Corrected mapping for app icons
icons_dir = os.path.join(BASE_DIR, "crates", "app", "assets", "icons", "app")
extension_icons_dir = os.path.join(BASE_DIR, "extension", "icons")

def rename_files_in_dir(directory, old_prefix, new_prefix):
    if not os.path.exists(directory):
        print(f"Directory not found: {directory}")
        return
    
    for filename in os.listdir(directory):
        if filename.startswith(old_prefix):
            old_path = os.path.join(directory, filename)
            new_filename = filename.replace(old_prefix, new_prefix)
            new_path = os.path.join(directory, new_filename)
            try:
                shutil.move(old_path, new_path)
                print(f"Renamed: {filename} -> {new_filename}")
            except Exception as e:
                print(f"Error: {e}")

def main():
    print("Renaming App Icons...")
    rename_files_in_dir(icons_dir, "mdm", "tdm")
    
    print("\nRenaming Extension Icons...")
    # Extensions icons are usually named icon-16.png etc.
    # Let's check the actual names first
    if os.path.exists(extension_icons_dir):
        rename_files_in_dir(extension_icons_dir, "icon", "tdm-icon")

if __name__ == "__main__":
    main()