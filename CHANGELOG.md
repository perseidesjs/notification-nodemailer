# @perseidesjs/notification-nodemailer

## 3.1.1

### Patch Changes

- 150f64e: fix: properly handle base64-encoded attachment content for inline images

  - Add `isBase64String` detection to identify base64-encoded content
  - Set `encoding: 'base64'` for nodemailer when content is base64 to prevent double-encoding
  - Fixes inline CID images not displaying in email clients

## 3.1.0

### Minor Changes

- 19038de: Upgrade to Medusa 2.13.0

## 3.0.0

### Major Changes

- 0d2d355: v3

## 2.0.0

### Major Changes

- 29c0c9c: ### Breaking Change
  - Upgrade to medusa 2.10.3

## 1.1.0

### Minor Changes

- 1669799: Updated README.md
