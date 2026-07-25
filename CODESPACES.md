# 在 GitHub Codespaces 執行 Expo Go

1. 建立本機環境檔：

   ```bash
   cp .env.example .env
   ```

2. 安裝相依套件：

   ```bash
   pnpm install
   ```

3. 啟動 Expo Go tunnel：

   ```bash
   pnpm dev:mobile
   ```

4. 用 Expo Go 掃描終端機的新 QR Code。

若要同時測試本機 API，另開一個終端機執行：

```bash
pnpm dev:server
```

Codespace 停止後，Tunnel 也會停止；重新開啟 Codespace 後必須再次執行 `pnpm dev:mobile` 並掃描新的 QR Code。
