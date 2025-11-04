# IG DM Helper - Instagram 私訊助手 & 抓粉工具

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

基於 Electron + Puppeteer 的 Instagram 自動化營銷工具，支援批量私訊和粉絲匯出功能。

---

## 🚨 程序出错？立即修复！

### 程序崩溃或 Maximum Redirects 错误？

```cmd
quick-fix.bat
```

**⚠️ 重要**：必须先【初始化】和【登入】，才能使用群发功能！

### 📄 故障排除文档

**常见错误：**
- **[Maximum-Redirects-快速解決.txt](Maximum-Redirects-快速解決.txt)** - 🔴 重定向错误快速修复
- **[Maximum-Redirects-錯誤-解決方案.md](Maximum-Redirects-錯誤-解決方案.md)** - 📘 重定向错误详细说明
- **[立即修复-看这里.txt](立即修复-看这里.txt)** - 🔥 崩溃问题快速修复

**详细指南：**
- **[完整故障排除指南.md](完整故障排除指南.md)** - 📋 所有错误的排查步骤
- **[修復崩潰問題-說明.md](修復崩潰問題-說明.md)** - 💡 技术详解

---

## 🚀 快速開始

### ⭐ 最簡單的方式（Windows）

```cmd
run.bat
```

雙擊 `run.bat` 即可開始使用！自動修復編碼問題。

### 📖 詳細指南

- **[START_HERE.md](START_HERE.md)** - 完整使用指南（推薦閱讀）
- **[FIX_ENCODING.md](FIX_ENCODING.md)** - 中文亂碼解決方案
- **[API_ERROR_GUIDE.md](API_ERROR_GUIDE.md)** - API 錯誤排查

### 🆕 批量打開 IG 鏈接

```cmd
open-links.bat
```

一個一個在瀏覽器中打開 Instagram 用戶主頁！
- **[BATCH_OPEN_LINKS.md](BATCH_OPEN_LINKS.md)** - 📱 批量打開功能說明
- **[批量打開IG鏈接-指南.txt](批量打開IG鏈接-指南.txt)** - 📄 快速參考

---

## 📦 核心功能

### 1. 智能批量私訊 (Smart Batch Direct Message) 🆕
- ✅ **🔄 逐個處理模式** - 打開一個 → 確認 → 發送 → 下一個
- ✅ **🌐 自動打開用戶頁面** - 每次發送前在瀏覽器中打開該用戶的 IG 主頁
- ✅ **💬 互動式確認** - 漂亮的對話框讓你選擇：發送 / 跳過 / 停止
- ✅ **🧹 自動清理數據** - 發送失敗時自動清理舊數據，類似 quick-fix.bat（NEW!）
- ✅ **🔄 一鍵換帳號** - 失敗時點一個按鈕即可換帳號繼續，無需重啟程序（NEW!）
- ✅ **⚡ 超快恢復** - 從失敗到繼續 < 1 分鐘，效率提升 80-90%（NEW!）
- ✅ **顯示用戶資料** - 發送前查看粉絲數、簡介等信息
- ✅ **智能錯誤檢測** - 自動識別登入、Session、驗證等錯誤
- ✅ **自動暫停與恢復** - 賬號問題時暫停，重新登入後繼續
- ✅ **自動跳過** - 自動跳過不存在或屏蔽的用戶
- ✅ **智能重試** - 網絡錯誤自動重試
- ✅ **詳細報告** - 生成完整的成功/失敗/跳過記錄
- ✅ 智能延遲避免被偵測

**📖 詳細說明：** 
- [自動清理並換帳號-使用說明.md](自動清理並換帳號-使用說明.md) - 自動清理換帳號功能（NEW!）
- [逐個發送-使用說明.md](逐個發送-使用說明.md) - 基本功能說明
- [换账号继续功能-说明.md](换账号继续功能-说明.md) - 換帳號繼續功能

### 2. 粉絲匯出 (Followers Export)
- ✅ 自動抓取指定帳號的粉絲列表
- ✅ 滾動加載獲取完整列表
- ✅ 匯出為 TXT 文本文件
- ✅ 實時顯示抓取進度

### 3. 帳號管理
- ✅ 從 TXT 文件匯入帳號清單
- ✅ 任務狀態追蹤（等待/進行中/完成/失敗）
- ✅ 詳細的錯誤信息記錄
- ✅ 歷史記錄存儲

### 4. 登入狀態管理
- ✅ Cookie 持久化保存
- ✅ 自動登入（下次啟動）
- ✅ 登入狀態檢測

## 🚀 安裝與使用

### 系統需求

- **Node.js**: >= 16.0.0
- **npm**: >= 7.0.0
- **Chrome/Chromium**: Puppeteer 會自動下載

### 安裝步驟

1. **克隆或解壓專案**
   ```bash
   cd ig-dm-helper
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **啟動應用**
   ```bash
   npm start
   ```

### 首次使用

1. **初始化 Instagram**
   - 點擊「初始化 Instagram 瀏覽器」按鈕
   - 會打開一個 Chrome 瀏覽器窗口
   - 在瀏覽器中登入您的 Instagram 帳號
   - 登入完成後回到應用程式

2. **保存登入狀態**
   - 登入成功後，點擊「保存登入狀態」
   - 下次啟動將自動登入

## 📝 使用說明

### 🆕 智能批量發送私訊（推薦）

使用新的智能批量發送功能，支持用戶資料顯示和智能錯誤處理：

```bash
node demo-smart-batch-dm.js
```

**功能特點：**
- ✅ **🌐 自動在瀏覽器打開用戶的 Instagram 頁面**
- ✅ 發送前顯示用戶資料（粉絲數、簡介等）
- ✅ 可以選擇是否發送給每個用戶
- ✅ 自動處理錯誤（暫停、跳過、重試）
- ✅ 生成詳細報告

**快速測試：**
```bash
# 測試瀏覽器打開功能
node demo-browser-profile.js

# 完整群發流程
node demo-smart-batch-dm.js
```

**完整文檔：**
- [BROWSER_PROFILE_GUIDE.md](BROWSER_PROFILE_GUIDE.md) - 🌐 瀏覽器打開功能
- [USER_PROFILE_FEATURE.md](USER_PROFILE_FEATURE.md) - 用戶資料顯示功能
- [SMART_BATCH_DM_GUIDE.md](SMART_BATCH_DM_GUIDE.md) - 智能批量發送指南
- [QUICK_START_USER_PROFILE.md](QUICK_START_USER_PROFILE.md) - 快速開始

---

### 批量發送私訊（傳統方式）

1. **準備帳號清單**
   - 創建一個 `.txt` 文件
   - 每行一個 Instagram 帳號名稱
   - 範例：
     ```
     username1
     username2
     username3
     ```

2. **匯入帳號**
   - 點擊「匯入 IG 帳號」按鈕
   - 選擇準備好的 TXT 文件

3. **編輯訊息**
   - 在訊息框中輸入要發送的文案
   - 支援多行文字和 Emoji

4. **開始群發**
   - 點擊「開始群發」按鈕
   - 確認後開始自動發送
   - 可隨時暫停、繼續或停止

### 匯出粉絲

1. **點擊「匯出粉絲」**
2. **輸入要匯出的帳號名稱**
3. **等待抓取完成**（可能需要幾分鐘）
4. **選擇保存位置**

## ⚙️ 打包發布

### 打包為獨立應用

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux

# 所有平台
npm run build
```

打包後的文件在 `dist` 目錄中。

### 打包配置

編輯 `package.json` 中的 `build` 部分可自定義：
- 應用名稱
- 圖示
- 安裝程式設置
- 等等

## 🛠️ 技術架構

### 技術棧

- **Electron** - 跨平台桌面應用框架
- **Puppeteer** - 瀏覽器自動化
- **SQLite3** - 本地數據庫
- **Node.js** - 後端運行環境
- **HTML/CSS/JavaScript** - 前端界面

### 項目結構

```
ig-dm-helper/
├── main.js              # Electron 主進程
├── index.html           # 前端界面 HTML
├── styles.css           # 前端樣式
├── renderer.js          # 前端邏輯
├── package.json         # 項目配置
├── src/
│   ├── database.js      # 數據庫模塊
│   └── license.js       # 授權管理模塊
├── assets/
│   └── logo.png         # 應用程式圖示
└── README.md            # 說明文檔
```

## ⚠️ 重要提示

### 法律與風險警告

1. **服務條款**
   - 本工具可能違反 Instagram 服務條款
   - 使用自動化工具可能導致帳號被限制或封禁
   - 請謹慎使用，風險自負

2. **使用建議**
   - 不要過於頻繁地發送訊息
   - 每天發送數量控制在合理範圍
   - 建議使用小號測試
   - 避免發送垃圾或騷擾內容

3. **偵測風險**
   - Instagram 有反自動化機制
   - 過度使用可能被偵測
   - 隨機延遲有助於降低風險
   - 建議人工操作結合使用

### 免責聲明

本工具僅供學習和研究使用。作者不對因使用本工具造成的任何後果負責，包括但不限於：
- 帳號被封禁
- 數據丟失
- 法律糾紛
- 其他損失

使用者需自行承擔所有風險和責任。

## 🔧 常見問題

### Q: Windows 終端顯示中文亂碼？
A: 運行 `node test-encoding.js` 測試編碼。所有演示腳本已自動修復編碼問題。
   詳細說明：[FIX_ENCODING.md](FIX_ENCODING.md)

```bash
# 測試編碼
node test-encoding.js

# 直接運行（已自動修復）
node demo-smart-batch-dm.js
```

### Q: 為什麼打開後沒有自動登入？
A: 首次使用需要手動登入，然後點擊「保存登入狀態」。

### Q: 發送失敗怎麼辦？
A: 檢查是否已登入、帳號是否存在、網路是否正常。查看錯誤信息進行排查。

### Q: 可以同時開多個視窗嗎？
A: 不建議，可能導致衝突或被偵測。

### Q: 支援發送圖片嗎？
A: 目前版本僅支援文字訊息。

### Q: 會被 Instagram 偵測嗎？
A: 有可能。建議控制發送頻率，使用隨機延遲，不要過度使用。

## 📄 授權

MIT License - 詳見 LICENSE 文件

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📮 聯繫方式

- **品牌**: FlowCube（流量魔方）
- **LINE**: @flowcube
- **網站**: https://line.me/R/ti/p/@flowcube

## 📝 更新日誌

### v1.0.0 (2024-10-31)
- ✨ 初始版本發布
- ✅ 批量私訊功能
- ✅ 粉絲匯出功能
- ✅ 登入狀態管理
- ✅ 任務控制（暫停/繼續/停止）
- ✅ SQLite 數據庫支持

---

**⭐ 如果這個工具對您有幫助，請給個 Star！**

