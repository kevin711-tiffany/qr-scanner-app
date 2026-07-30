# Bridge v1 修改檔案

## APP

- `app/(tabs)/index.tsx`：首頁圖示容器改為 72 × 72，Icon 改為 44。
- `app/(tabs)/function-menu.tsx`：接收 PHP Bridge 訊息、開啟原生相機並把照片回傳 WebView。
- `components/native-camera-modal.tsx`：新增 Android／iOS 共用原生拍照畫面。
- `lib/native-bridge.ts`：新增 PHP ↔ React Native Bridge 協定及注入程式。
- `app.json`：更新相機權限用途說明；既有 iOS 權限保留。
- `BRIDGE_V1.md`：Bridge 使用說明。

## PHP

- `3mbmmv/photo.php`：拍照按鈕優先呼叫 `Bridge.camera()`；接收照片後沿用原本 `upload.php` 上傳。
- `3mbmmv/memu.php`：放入使用者提供的最新版功能選單。
- `3mbmmv/upload.php`：未修改。
