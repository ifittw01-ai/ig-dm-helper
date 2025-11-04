# 🚀 快速啟動指南

## 1. 安裝依賴

```bash
cd ig-dm-helper
npm install
```

**注意**: 首次安裝可能需要較長時間（Puppeteer 會下載 Chromium，約 300MB）

## 2. 啟動應用

```bash
npm start
```

## 3. 首次配置

### 步驟 1: 初始化 Instagram
1. 點擊「初始化 Instagram 瀏覽器」
2. 等待 Chrome 瀏覽器打開
3. 在瀏覽器中登入您的 Instagram 帳號
4. 登入完成後，回到應用程式

### 步驟 2: 保存登入狀態
1. 確認已成功登入 Instagram
2. 點擊「保存登入狀態」按鈕
3. 下次啟動將自動登入

## 4. 批量發送私訊

### 準備帳號清單文件

創建一個 `accounts.txt` 文件，每行一個帳號：

```
username1
username2
username3
```

### 開始發送

1. 點擊「匯入 IG 帳號」，選擇準備好的 TXT 文件
2. 在訊息框中輸入要發送的文案
3. 點擊「開始群發」
4. 確認後開始自動發送

**控制選項：**
- ⏸️ **暫停**: 暫時停止發送
- ▶️ **繼續**: 繼續發送
- ⏹️ **停止**: 完全停止任務

## 5. 匯出粉絲

1. 點擊「匯出粉絲」
2. 輸入要匯出的 Instagram 帳號名稱
3. 等待抓取完成（通常需要 2-5 分鐘）
4. 選擇保存位置

## 6. 打包為獨立應用（可選）

如果要分發給其他用戶：

```bash
# Windows 版本
npm run build:win

# macOS 版本
npm run build:mac

# Linux 版本
npm run build:linux
```

打包後的應用在 `dist` 目錄中。

## ⚠️ 注意事項

1. **延遲時間**: 系統會在每次發送後隨機延遲 30-60 秒，避免被 Instagram 偵測
2. **發送數量**: 建議每天不要超過 50-100 條訊息
3. **帳號安全**: 建議使用小號測試，避免主帳號被封
4. **網路連接**: 確保網路穩定，避免中斷
5. **瀏覽器視窗**: 發送過程中不要關閉 Chrome 瀏覽器視窗

## 🐛 常見問題

### Q: npm install 失敗？
A: 嘗試使用管理員權限運行，或設置 npm 鏡像：
```bash
npm config set registry https://registry.npmmirror.com
npm install
```

### Q: 找不到 Chrome？
A: Puppeteer 會自動下載，如果失敗，手動安裝 Chrome 瀏覽器即可。

### Q: 發送失敗？
A: 
- 檢查是否已登入 Instagram
- 確認帳號名稱正確（不需要 @ 符號）
- 查看錯誤信息提示
- 確認網路連接正常

### Q: 帳號被限制怎麼辦？
A:
- 停止使用工具 24-48 小時
- 手動使用 Instagram 一段時間
- 下次使用時減少發送數量
- 增加延遲時間

## 📞 技術支援

如遇問題，請聯繫：
- LINE: @flowcube
- 或查看完整文檔: README.md

---

**開始使用前，請確保已閱讀並理解 README 中的風險警告！**

