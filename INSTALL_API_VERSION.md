# 🚀 快速安裝 API 版本

## 📋 步驟

### 1. 安裝依賴

```bash
npm install
```

這會安裝：
- `axios` - HTTP 請求庫（替代 Puppeteer）
- 其他現有依賴保持不變

### 2. 修改啟動文件

**方法 A: 修改 package.json（推薦）**

打開 `package.json`，修改 `"main"` 欄位：

```json
{
  "main": "main-api.js",
  ...
}
```

**方法 B: 添加新的啟動腳本**

在 `package.json` 的 `"scripts"` 部分添加：

```json
{
  "scripts": {
    "start": "electron .",
    "start:api": "electron main-api.js",
    "start:browser": "electron main.js",
    ...
  }
}
```

然後使用：
```bash
# API 版本
npm run start:api

# 瀏覽器版本
npm run start:browser
```

### 3. 更新 index.html（可選）

如果要默認使用 API 版本的 UI，將 `package.json` 中的主 HTML 文件改為 `index-api.html`。

或在 `main-api.js` 中確認加載的是 `index-api.html`。

### 4. 啟動應用

```bash
npm start
```

或

```bash
npm run start:api
```

---

## 🔄 切換版本

### 切換到 API 版本

```bash
# 1. 確保已安裝 axios
npm install axios

# 2. 使用 API 版本啟動
npm run start:api
```

### 切換回瀏覽器版本

```bash
# 1. 確保已安裝 puppeteer
npm install puppeteer

# 2. 使用瀏覽器版本啟動
npm run start:browser
```

---

## 📁 文件對應關係

| 文件 | 瀏覽器版本 | API 版本 |
|------|-----------|---------|
| 主程式 | `main.js` | `main-api.js` |
| HTML | `index.html` | `index-api.html` |
| 前端 JS | `renderer.js` | `renderer-api.js` |
| Instagram | Puppeteer | `src/instagram-api.js` |

---

## ✅ 驗證安裝

啟動後，您應該看到：

1. **登入頁面** - 有帳號密碼輸入框
2. **無瀏覽器窗口** - 不會彈出 Chrome
3. **快速啟動** - 2-3 秒內完成初始化

---

## ⚠️ 注意事項

1. **兩個版本可以共存**
   - 舊文件不會被覆蓋
   - 可以隨時切換

2. **數據庫共用**
   - Session 數據可能不兼容
   - 建議重新登入

3. **依賴清理**
   - 如果只用 API 版本，可以卸載 Puppeteer：
     ```bash
     npm uninstall puppeteer
     ```

---

## 🐛 故障排除

### 問題：npm install 失敗

```bash
# 清除 cache 重試
npm cache clean --force
npm install
```

### 問題：axios 未安裝

```bash
npm install axios --save
```

### 問題：啟動錯誤

檢查 `package.json` 的 `"main"` 欄位是否正確指向 `main-api.js`

---

## 📚 下一步

閱讀完整使用指南：`API_VERSION_GUIDE.md`

