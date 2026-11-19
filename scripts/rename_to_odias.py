import os, re

dirs_to_process = [
    'frontend/src/website',
    'website/src',
]

def replace_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    # Replacements
    content = content.replace('KALINGA ERP', 'Odias ERP')
    content = content.replace('Kalinga ERP', 'Odias ERP')
    content = content.replace('kalinga erp', 'odias erp')
    content = content.replace('kalingaerp.com', 'odiaserp.com')
    content = content.replace('kalinga-erp', 'odias-erp')
    content = content.replace('Kalinga Infotech', 'Odias Infotech')
    content = content.replace('KALINGA ENTERPRISE', 'ODIAS ENTERPRISE')
    content = content.replace('KALINGA', 'ODIAS')
    content = content.replace('Kalinga', 'Odias')
    content = content.replace('kalinga', 'odias')
    content = content.replace('kaligaa', 'odias')
    content = content.replace('Kaligaa', 'Odias')

    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {file_path}")

for d in dirs_to_process:
    if not os.path.exists(d):
        continue
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith(('.jsx', '.js', '.tsx', '.ts', '.html', '.css', '.md')):
                replace_in_file(os.path.join(root, file))

print("Replacement complete.")
