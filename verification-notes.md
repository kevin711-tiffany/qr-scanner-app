# 截圖驗證發現的問題（2026-07-17）

## 發現的問題

1. **Tab 有 4 個分頁**：底部 tab 出現「掃描、查詢、設定、scan」四個分頁。舊的 index.tsx（掃描）和新的 scan.tsx 同時存在，需整併：
   - `app/(tabs)/index.tsx` 是舊的掃描畫面（使用 use-scan-settings）
   - `app/(tabs)/scan.tsx` 是新的掃描畫面（使用 use-basic-settings + usetype=B）
   - 解法：將 scan.tsx 內容移到 index.tsx，刪除 scan.tsx，_layout.tsx 只保留 index/query/settings 三個分頁

2. **首頁 (/) 在 web 上報錯**：`Failed to execute 'request' on 'WakeLock'`，來自舊 index.tsx 的 expo-keep-awake（useKeepAwake）在 web 預覽的無頭瀏覽器不可見時報錯。整併後如保留 useKeepAwake，需限制 Platform.OS !== 'web' 才呼叫。

3. **設定與查詢頁面正常**：基本資料設定（代碼/傳送網址/備註一二三/字數計數）與資料查詢（起始/結束日期）畫面渲染正常，但設定頁截圖中「儲存設定」按鈕在畫面下方未入鏡（需捲動），屬正常。

## 已完成的需求變更
- settings.tsx：存檔流程 = 先 saveSettings() 本地儲存 → 再傳送含 usetype=A 的參數到指定網址 → 顯示網頁回應
- scan.tsx：usetype=B；query.tsx：usetype=C

## 待辦
- [x] 整併 index.tsx / scan.tsx 為單一掃描分頁（scan.tsx 已 mv 為 index.tsx，舊檔已移除，WakeLock 錯誤隨舊檔移除而消失）
- [x] 重新截圖驗證：三個分頁（掃描/查詢/設定）皆正常渲染；web 上掃描頁顯示「相機權限被拒絕」屬 web 預覽環境正常現象，實機（Expo Go / APK）會跳出相機授權
- [ ] 儲存 checkpoint 並交付
