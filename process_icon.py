#!/usr/bin/env python3
"""
Tufan Download Manager - Icon Processor
Processes the new Tufan icon into all required sizes and formats
"""

import os
import shutil
from PIL import Image

BASE_DIR = r"D:\Tufan Download Manager"
SOURCE_ICON = r"C:\Users\SAKIM-PC\AppData\Local\hermes\cache\documents\native-inputs\dbbaa58fb077c18acada031fd2355e0be96a9474b02e62ba7069f1b63353bc25\dashboard_20261111_204601_8eb0177c_image_41889e.png"

# Required sizes for different contexts
SIZES = [16, 20, 24, 32, 48, 64, 128, 256]

# Destination directories
APP_ICONS_DIR = os.path.join(BASE_DIR, "crates", "app", "assets", "icons", "app")
EXTENSION_ICONS_DIR = os.path.join(BASE_DIR, "extension", "icons")

def process_icon():
    print("=== Processing Tufan Icon ===")
    
    # Open the source icon
    source_img = Image.open(SOURCE_ICON)
    print(f"Source icon size: {source_img.size}")
    print(f"Source icon mode: {source_img.mode}")
    
    # Ensure RGBA mode
    if source_img.mode != 'RGBA':
        source_img = source_img.convert('RGBA')
    
    # Create directories if they don't exist
    os.makedirs(APP_ICONS_DIR, exist_ok=True)
    os.makedirs(EXTENSION_ICONS_DIR, exist_ok=True)
    
    # Generate PNG icons for app
    print("\nGenerating app icons...")
    for size in SIZES:
        resized = source_img.resize((size, size), Image.Resampling.LANCZOS)
        output_path = os.path.join(APP_ICONS_DIR, f"tdm-{size}.png")
        resized.save(output_path, "PNG")
        print(f"  ✓ tdm-{size}.png ({size}x{size})")
    
    # Generate PNG icons for extension
    print("\nGenerating extension icons...")
    for size in [16, 32, 48, 128]:
        resized = source_img.resize((size, size), Image.Resampling.LANCZOS)
        output_path = os.path.join(EXTENSION_ICONS_DIR, f"tdm-icon-{size}.png")
        resized.save(output_path, "PNG")
        print(f"  ✓ tdm-icon-{size}.png ({size}x{size})")
    
    # Generate .ico file for Windows
    print("\nGenerating .ico file...")
    ico_path = os.path.join(APP_ICONS_DIR, "tdm.ico")
    # Create a multi-size .ico
    ico_images = []
    for size in [16, 32, 48, 64, 128, 256]:
        resized = source_img.resize((size, size), Image.Resampling.LANCZOS)
        ico_images.append(resized)
    ico_images[0].save(ico_path, format='ICO', sizes=[(img.width, img.height) for img in ico_images])
    print(f"  ✓ tdm.ico (multi-size)")
    
    print("\n=== Icon Processing Complete ===")
    print(f"App icons: {APP_ICONS_DIR}")
    print(f"Extension icons: {EXTENSION_ICONS_DIR}")

if __name__ == "__main__":
    process_icon()