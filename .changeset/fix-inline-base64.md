---
"@perseidesjs/notification-nodemailer": patch
---

fix: properly handle base64-encoded attachment content for inline images

- Add `isBase64String` detection to identify base64-encoded content
- Set `encoding: 'base64'` for nodemailer when content is base64 to prevent double-encoding
- Fixes inline CID images not displaying in email clients
