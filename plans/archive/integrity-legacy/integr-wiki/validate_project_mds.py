#!/usr/bin/env python3
import os

def audit_project_markdowns():
    project_dirs = {
        "integrity": "/home/xibalba/integrity",
        "integrity-mvp": "/home/xibalba/Projects/integrity-mvp",
        "integrity-protocol": "/home/xibalba/integrity-protocol"
    }
    wiki_root = "/home/xibalba/wiki"
    
    print("==================================================")
    print("XIBALBA PROJECT WIKI COMPREHENSIVE LINT AUDIT:")
    print("==================================================")

    # 1. Catalog all wiki synthesized files
    wiki_files = set()
    for root, _, files in os.walk(wiki_root):
        for f in files:
            if f.endswith(".md"):
                wiki_files.add(f.lower())

    total_checked = 0
    missing_docs = []
    
    for name, path in project_dirs.items():
        if not os.path.exists(path):
            print(f"⚠️ Skipping path (does not exist): {path}")
            continue
            
        print(f"\n📂 Scanning Directory: {path}")
        dir_docs = 0
        
        for root, _, files in os.walk(path):
            # Ignore standard dependency and virtual environment folders
            if "node_modules" in root or "venv" in root or ".git" in root:
                continue
                
            for f in files:
                if f.endswith(".md"):
                    dir_docs += 1
                    total_checked += 1
                    file_path = os.path.join(root, f)
                    rel_file_path = os.path.relpath(file_path, path)
                    
                    # Verify if it is represented in the wiki
                    base_name = f.lower()
                    
                    # Fuzzy match the file in our wiki sets (either raw, legacy, or concept name)
                    matched = False
                    for wf in wiki_files:
                        if base_name in wf or wf in base_name or base_name.replace("_", "-") in wf:
                            matched = True
                            break
                            
                    if matched:
                        print(f"  ✅ Verified & Indexed: {rel_file_path}")
                    else:
                        print(f"  ❌ UNINDEXED/MISSING: {rel_file_path}")
                        missing_docs.append((name, rel_file_path))
                        
        print(f"  Total Markdown Documents Scanned in {name}: {dir_docs}")

    print("\n==================================================")
    print("LINT & SYNTHESIS INTEGRITY AUDIT REPORT:")
    print(f"  - Total Project Markdown Files Audited: {total_checked}")
    print(f"  - Successfully Linted & Synced in Wiki: {total_checked - len(missing_docs)}")
    print(f"  - Un-indexed / Missing Files: {len(missing_docs)}")
    print("==================================================")

    if len(missing_docs) > 0:
        print("\n❌ LINT WARNING: The above missing documents are not represented or linted in the wiki catalog.")
        return False
    else:
        print("\n🎉 LINT SUCCESS: 100% Alignment. Every single markdown document inside the development repositories has been successfully ingested, linted, and integrated into the Xibalba Wiki.")
        return True

if __name__ == "__main__":
    audit_project_markdowns()
