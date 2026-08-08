# 連續掃描 AES QR Code 修改說明

修改基礎：qr-scanner-app-main_20260806_2356.zip

## 規則

- 舊條碼：`^[A-Z][0-9]{8}$`，共 9 碼，維持明文直接使用。
- 新條碼第一種：AES 解密後須符合 `^[A-Z][0-9]{9}$`，共 10 碼。
- 新條碼第二種：AES 解密後須符合 `^[A-Z]{2}[0-9]{8}$`，共 10 碼。
- 新 10 碼明文不接受，必須是 `QR1.IV.密文.TAG` AES-256-GCM 格式。
- 其他格式顯示：`您讀取的 QR CODE 內容，不是我們要的格式哦。`
- 傳送至後端的 `scannedData` 保持為實際條碼值，不傳 AES 密文。

## 修改檔案

- `app/(tabs)/scan.tsx`

## 使用既有解密工具

- `lib/qr-setting-crypto.ts`
- AES-256-GCM
- AAD：`HEJIE-QR-V1`
- 金鑰：沿用目前專案既有 SHA-256 後的 32-byte AES 金鑰
