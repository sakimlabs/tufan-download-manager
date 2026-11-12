#!/usr/bin/env python3
"""
Process the new Tufan Download Manager logo (3D tornado/lightning) into all required icon sizes.
- Removes white background (makes transparent)
- Generates app icons: 16, 20, 24, 32, 48, 64, 128, 256 px + .ico
- Generates extension icons: 16, 32, 48, 128 px
"""

import os
import sys
from PIL import Image

# Input: the logo image you sent
SOURCE_ICON = r"C:\Users\SAKIM-PC\AppData\Local\hermes\cache\documents\native-inputs\27e0d4c95dffb37a154b63ddca6d94753c6ac4ee0faee5387c2ba16d246246ef\dashboard_20261112_110510_932bdbd3_TDM_244d0b.png"

# Output directories
APP_ICONS_DIR = r"D:\Tufan Download Manager\crates\app\assets\icons\app"
EXT_ICONS_DIR = r"D:\Tufan Download Manager\extension\icons"

# Sizes for app icons
APP_SIZES = [16, 20, 24, 32, 48, 64, 128, 256]

# Sizes for extension icons
EXT_SIZES = [16, 32, 48, 128]

def remove_white_background(img: Image.Image) -> Image.Image:
    """Convert white background to transparent."""
    img = img.convert("RGBA")
    datas = img.getdata()
    
    newData = []
    for item in datas:
        # If pixel is mostly white (R, G, B all > 240), make it transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))  # Transparent
        else:
            newData.append(item)
    
    img.putdata(newData)
    return img

def resize_icon(img: Image.Image, size: int) -> Image.Image:
    """Resize icon to given size (high-quality Lanczos resampling)."""
    return img.resize((size, size), Image.Resampling.LANCZOS)

def create_ico(img: Image.Image, output_path: str):
    """Create .ico file with multiple sizes embedded."""
    ico_sizes = [16, 24, 32, 48, 64, 128, 256]
    images = []
    for size in ico_sizes:
        resized = resize_icon(img, size)
        images.append(resized)
    
    images[0].save(
        output_path,
        format='ICO',
        sizes=[(s, s) for s in ico_sizes],
        append_images=images[1:]
    )

def main():
    if not os.path.exists(SOURCE_ICON):
        print(f"ERROR: Source icon not found: {SOURCE_ICON}")
        sys.exit(1)
    
    # Load and process source icon
    print(f"Loading: {SOURCE_ICON}")
    source_img = Image.open(SOURCE_ICON)
    
    # Remove white background
    print("Removing white background...")
    source_img = remove_white_background(source_img)
    
    # Create output directories
    os.makedirs(APP_ICONS_DIR, exist_ok=True)
    os.makedirs(EXT_ICONS_DIR, exist_ok=True)
    
    # Generate app icons
    print(f"\n=== App Icons ({APP_ICONS_DIR}) ===")
    for size in APP_SIZES:
        resized = resize_icon(source_img, size)
        output_path = os.path.join(APP_ICONS_DIR, f"tdm-{size}.png")
        resized.save(output_path, "PNG")
        print(f"  ✓ {size}x{size} → tdm-{size}.png")
    
    # Generate .ico file
    ico_path = os.path.join(APP_ICONS_DIR, "tdm.ico")
    print(f"\n  Creating {ico_path}...")
    create_ico(source_img, ico_path)
    print(f"  ✓ tdm.ico (multi-size: 16-256px)")
    
    # Generate extension icons
    print(f"\n=== Extension Icons ({EXT_ICONS_DIR}) ===")
    for size in EXT_SIZES:
        resized = resize_icon(source_img, size)
        output_path = os.path.join(EXT_ICONS_DIR, f"tdm-icon-{size}.png")
        resized.save(output_path, "PNG")
        print(f"  ✓ {size}x{size} → tdm-icon-{size}.png")
    
    print("\n✅ All icons generated successfully!")
    print(f"\nApp icons: {len(APP_SIZES)} PNGs + 1 ICO")
    print(f"Extension icons: {len(EXT_SIZES)} PNGs")

if __name__ == "__main__":
    main()