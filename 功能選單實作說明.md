# 功能選單（usetype=E）實作說明

## 已完成

- 在掃描、單獨掃描、查詢、設定四個功能頁共用的 `AppHeader` 右上角加入功能選單按鈕。
- 可視按鈕為 40 × 40 px，觸控範圍為 48 × 48 px。
- 點擊時即時從 AsyncStorage 讀取最新基本設定。
- 使用 HTTP POST 與 `application/x-www-form-urlencoded` 傳值。
- POST body 固定為：`code`、`remark1`、`remark2`、`remark3`、`usetype=E`。
- `sendUrl` 僅作為 POST 目的網址，不放入 POST body。
- 以全螢幕 WebView 顯示伺服器回應，支援載入、錯誤及關閉操作。
- 防止重複點擊送出。

## 主要異動檔案

- `components/function-menu-button.tsx`（新增）
- `components/app-header.tsx`
- `app/(tabs)/scan.tsx`
- `app/(tabs)/single-scan.tsx`
- `app/(tabs)/settings.tsx`

## Expo 測試

```bash
pnpm install
npx expo start
```

使用 Expo Go 開啟後，先在設定頁確認 `sendUrl` 與基本資料已儲存，再點擊四個功能頁右上角的九宮格按鈕。
