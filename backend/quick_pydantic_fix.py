# === quick_pydantic_fix.py ===
# Gyors Pydantic V2 javítás a schema_extra → json_schema_extra-ra

import os
import re
from pathlib import Path

def fix_pydantic_models():
    """Gyors javítás a schema_extra problémákra"""
    
    # Backend könyvtár keresése
    backend_path = Path(".")
    if not (backend_path / "app").exists():
        backend_path = Path("backend")
    
    python_files = list(backend_path.rglob("*.py"))
    fixes_made = 0
    
    print("🔍 Searching for Pydantic V2 issues...")
    
    for file_path in python_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # 1. schema_extra → json_schema_extra cseréje
            if 'schema_extra' in content and 'json_schema_extra' not in content:
                content = re.sub(
                    r'(\s+)schema_extra(\s*=\s*{)',
                    r'\1json_schema_extra\2',
                    content
                )
                
                # ConfigDict import hozzáadása ha szükséges
                if 'json_schema_extra' in content and 'ConfigDict' not in content:
                    if 'from pydantic import' in content and 'BaseModel' in content:
                        content = re.sub(
                            r'from pydantic import ([^\\n]+)',
                            r'from pydantic import \1, ConfigDict',
                            content
                        )
            
            # 2. orm_mode → from_attributes
            if 'from_attributes=True' in content:
                content = re.sub(
                    r'orm_mode\s*=\s*True',
                    'from_attributes=True',
                    content
                )
            
            # 3. Config class → model_config ahol lehetséges
            config_pattern = r'class Config:\s*\n\s*orm_mode\s*=\s*True'
            if re.search(config_pattern, content):
                content = re.sub(
                    config_pattern,
                    'model_config = ConfigDict(from_attributes=True)',
                    content,
                    flags=re.MULTILINE
                )
            
            # Ha változtak dolgok, mentés
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"✅ Fixed: {file_path.relative_to(backend_path)}")
                fixes_made += 1
                
        except Exception as e:
            print(f"⚠️  Error processing {file_path}: {e}")
    
    print(f"\\n🎯 Pydantic V2 fixes completed! Files updated: {fixes_made}")
    if fixes_made > 0:
        print("🔄 Restart your server to see the changes")
    else:
        print("✅ No Pydantic V2 issues found!")

if __name__ == "__main__":
    fix_pydantic_models()