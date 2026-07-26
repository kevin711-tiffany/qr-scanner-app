# Version 1.0.24 正式發版架構

## 首次設定（只需一次）

1. 在 Expo 建立 Access Token。
2. GitHub Repository → Settings → Secrets and variables → Actions，新增 `EXPO_TOKEN`。
3. 確認 EAS Android Keystore 已建立。
4. Google Play：先在 Play Console 建立 App，完成首次手動上傳，並在 EAS Credentials 設定 Google Service Account Key。
5. Apple：加入 Apple Developer Program，在 EAS Credentials 設定 Distribution Certificate、Provisioning Profile 與 App Store Connect API Key。

敏感金鑰不可提交到 Git。此專案的 `.gitignore` 已排除常見憑證格式。

## GitHub Actions

### CI

每次 push 或 pull request 到 `main`，自動執行 TypeScript、Lint、Vitest。

### Build Android APK

GitHub → Actions → **Build Android APK** → Run workflow。

也會在推送 `v*` Tag 時觸發。工作流程會在 EAS 產生 preview APK；完成後於 Expo Build 頁下載。

### Store Build and Submit

GitHub → Actions → **Store Build and Submit**：

- `platform=android`：產生 Google Play AAB。
- `platform=ios`：產生 iOS production build。
- `platform=all`：兩個平台同時建置。
- `submit=false`：只建置，不送商店。
- `submit=true`：建置後自動送至 Google Play Internal Track／Apple TestFlight。

正式送審仍建議在 Play Console 與 App Store Connect 最後確認後手動執行。

## 本機常用指令

```bash
pnpm verify
pnpm apk
pnpm play
pnpm ios
```

版本更新：

```bash
pnpm release:patch
```

它會同步更新 `package.json`、`app.json`、Android `versionCode` 與 iOS `buildNumber`。

## 發版範例

```bash
pnpm release:patch
git add .
git commit -m "Release 1.0.25"
git tag v1.0.25
git push origin main --tags
```
