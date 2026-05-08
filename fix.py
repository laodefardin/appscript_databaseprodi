import re

with open('d:/Project/PROJECT WEB/database/app_js.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the replace function
content = re.sub(r"replace\('/'/g, .*?\)", r"replace(/'/g, \\"\\\\\\'\\")", content)

# Fix the onclick handlers that were broken
content = content.replace("onclick=\"dosenSimpanProfil('" + myId + "')\"", "onclick=\"dosenSimpanProfil('\\'" + myId + "\\')\"")
content = content.replace("onclick=\"operatorUbahPassword('" + myId + "')\"", "onclick=\"operatorUbahPassword('\\'" + myId + "\\')\"")
content = content.replace("onclick=\"openPasswordModal('" + u.id + "','" + u.username + "')\"", "onclick=\"openPasswordModal('\\'" + u.id + "\\',\\'" + u.username + "\\')\"")
content = content.replace("onclick=\"confirmToggle('" + u.id + "','" + u.username + "')\"", "onclick=\"confirmToggle('\\'" + u.id + "\\',\\'" + u.username + "\\')\"")
content = content.replace("onclick=\"confirmHapusUser('" + u.id + "','" + u.username + "')\"", "onclick=\"confirmHapusUser('\\'" + u.id + "\\',\\'" + u.username + "\\')\"")

with open('d:/Project/PROJECT WEB/database/app_js.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')