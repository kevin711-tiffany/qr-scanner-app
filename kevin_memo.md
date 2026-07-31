從github，壓縮最新的ZIP檔，指令順序

# 1. 型別檢查
pnpm check

# 2. 建立 Android Bundle（確認沒有打包錯誤）
pnpm exec expo export --platform android --clear
# 2-1.手機EXPO測試
npx expo start --tunnel --clear

# 3. 確認有哪些檔案被修改
git status

# 4. （建議）刪除舊 ZIP，避免重複打包
rm -f qr-scanner-app-main*.zip

# 5. 建立目前 Codespaces 最新工作版本 ZIP
zip -r "qr-scanner-app-main_$(date +%Y%m%d_%H%M).zip" . \
-x "node_modules/*" \
-x ".git/*" \
-x ".expo/*" \
-x "dist/*" \
-x "android/app/build/*" \
-x "ios/build/*" \
-x "*.apk" \
-x "*.aab" \
-x "qr-scanner-app-main*.zip"

# ===== 到這裡 =====
# 若需要 ChatGPT 協助修改，請先上傳此 ZIP，再進行 Git Commit。
# 若不需要修改，可直接進行下面步驟。

# 6. 功能測試完成後，再確認一次狀態
git status

# 7. 提交 GitHub
git add .
git commit -m "QR CODE加密"弓
git push

# 8. 建立 Preview APK
pnpm apk