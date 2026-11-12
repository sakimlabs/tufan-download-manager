#!/usr/bin/env python3
import os

BASE_DIR = r"D:\Tufan Download Manager"

def update_references():
    for root, dirs, files in os.walk(BASE_DIR):
        dirs[:] = [d for d in dirs if d not in {".git", "target", "node_modules"}]
        
        for file in files:
            if file.endswith((".rs", ".toml", ".json", ".ps1", ".sh", ".mjs", ".js", ".css", ".html", ".tsv")):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    if "mdm-" in content or "misterdownloadmanager" in content or "icon-" in content:
                        original = content
                        content = content.replace("mdm-", "tdm-")
                        content = content.replace("misterdownloadmanager", "tufan-download-manager")
                        content = content.replace("MisterDownloadManager", "TufanDownloadManager")
                        content = content.replace("icon-16.png", "tdm-icon-16.png")
                        content = content.replace("icon-32.png", "tdm-icon-32.png")
                        content = content.replace("icon-48.png", "tdm-icon-48.png")
                        content = content.replace("icon-128.png", "tdm-icon-128.png")
                        content = content.replace("mdm-16.png", "tdm-16.png")
                        content = content.replace("mdm-32.png", "tdm-32.png")
                        content = content.replace("mdm-48.png", "tdm-48.png")
                        content = content.replace("mdm-128.png", "tdm-128.png")
                        content = content.replace("mdm.ico", "tdm.ico")
                        
                        if content != original:
                            with open(filepath, 'w', encoding='utf-8') as f:
                                f.write(content)
                            print(f"Updated references in: {filepath}")
                
                except Exception as e:
                    pass

update_references()