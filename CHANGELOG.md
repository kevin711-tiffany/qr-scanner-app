# Changelog

## 1.0.24

- 功能選單按鈕外框由紅色改為藍色。
- 新增隱藏式功能選單分頁，保留固定版頭與底部分頁。
- 功能選單依正式欄位規格傳送 `code`、`remark1`、`remark2`、`remark3`、`usetype=E`；`sendUrl` 僅作為 POST 目的網址。
- `sendUrl`、`remark1`、`remark2` 改為唯讀密碼顯示。
- App 版本更新為 1.0.24，Android `versionCode` 與 iOS `buildNumber` 更新為 24。
- 改用靜態 `app.json`，避免 EAS 解析 TypeScript App Config 的 CommonJS 錯誤。
- 新增 EAS preview APK、Google Play AAB、iOS production 建置設定。
- 新增 GitHub Actions：CI、APK 建置、Google Play／App Store 建置與選擇性自動提交。
- 新增版本號同步腳本與正式發版文件。
- 設定頁最下方新增可點擊的「關於本程式」，顯示版本、Build 編號、發布日期與更新內容。
- 新增 `VERSION.md` 與共用版本資訊設定。
