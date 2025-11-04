# 🔧 故障排除指南

## 常见问題與解決方案

---

## ❌ 問題 1: sqlite3 崩潰錯誤

### 錯誤信息

```
node::OnFatalError
napi_fatal_error
napi_register_module_v1
```

### 原因

`sqlite3` 是原生 C++ 模塊，需要針對 Electron 的 Node.js 版本重新編譯。

### 解決方案

```bash
# 方法 1：使用 electron-rebuild（推薦）
npm install --save-dev electron-rebuild
npx electron-rebuild -f -w sqlite3

# 方法 2：使用 @electron/rebuild
npm install --save-dev @electron/rebuild
npx electron-rebuild

# 方法 3：完整重建
npm install --build-from-source sqlite3
```

### 預防措施

在 `package.json` 中添加重建腳本：

```json
{
  "scripts": {
    "postinstall": "electron-rebuild -f -w sqlite3"
  }
}
```

---

## ❌ 問題 2: 登入失敗 - 帳號或密碼錯誤

### 可能原因

1. 帳號密碼輸入錯誤
2. 帳號開啟了雙重驗證（2FA）
3. Instagram 偵測到異常登入
4. 網路連接問題

### 解決方案

**檢查帳號密碼：**
- 確認帳號名稱正確（不含 `@`）
- 確認密碼正確（注意大小寫）

**關閉雙重驗證：**
1. 登入 Instagram 網頁版
2. 設定 → 安全性 → 雙重驗證
3. 暫時關閉雙重驗證

**更換網路環境：**
- 使用其他網路（如手機熱點）
- 使用 VPN
- 等待一段時間後再試

---

## ❌ 問題 3: 登入失敗 - Challenge Required

### 錯誤信息

```
challenge_required
checkpoint_required
```

### 原因

Instagram 偵測到異常登入行為，要求額外驗證。

### 解決方案

**方法 1：手動驗證**
1. 在手機/瀏覽器登入該帳號
2. 完成 Instagram 要求的驗證
3. 等待 24 小時後再使用工具

**方法 2：使用經常登入的 IP**
- 在常用設備和網路上操作
- 避免頻繁更換 IP 地址

**方法 3：降低使用頻率**
- 每天登入次數不超過 3-5 次
- 使用「初始化」功能而非重複登入

---

## ❌ 問題 4: 發送私訊失敗

### 可能原因

1. 目標用戶不存在
2. 目標用戶封鎖了您
3. 發送過於頻繁被限制
4. Session 過期

### 解決方案

**確認用戶名：**
```
✅ 正確：username
❌ 錯誤：@username
```

**檢查限制：**
- Instagram 限制：每小時約 30-50 條訊息
- 建議：每條訊息間隔 30-60 秒

**重新登入：**
```bash
# 停止應用，重新啟動
npm start
# 重新登入
```

---

## ❌ 問題 5: 抓取粉絲失敗

### 可能原因

1. 目標帳號設為私密帳號
2. 沒有關注該私密帳號
3. Instagram API 限制

### 解決方案

**公開帳號：**
- 只能抓取公開帳號的粉絲
- 如果是私密帳號，需先關注並獲得批准

**降低頻率：**
- 避免短時間內抓取多個帳號
- 每次抓取間隔 5-10 分鐘

---

## ❌ 問題 6: 應用無法啟動

### 錯誤信息

```
Error: Cannot find module '...'
```

### 解決方案

**重新安裝依賴：**
```bash
# 刪除 node_modules
rm -rf node_modules package-lock.json

# 重新安裝
npm install

# 重建原生模塊
npx electron-rebuild
```

---

## ❌ 問題 7: 網路錯誤 - ECONNREFUSED

### 錯誤信息

```
Error: connect ECONNREFUSED
```

### 原因

無法連接到 Instagram API。

### 解決方案

**檢查網路：**
- 確認網路連接正常
- 嘗試訪問 `https://www.instagram.com`

**檢查代理：**
- 如果使用代理，確認代理設定正確
- 嘗試關閉代理

**防火牆：**
- 檢查防火牆是否阻擋了應用
- 允許 Electron 應用訪問網路

---

## ❌ 問題 8: 數據庫錯誤

### 錯誤信息

```
SQLITE_ERROR: database is locked
```

### 解決方案

**關閉其他實例：**
- 確保只運行一個應用實例
- 關閉所有 Electron 進程

**刪除數據庫鎖：**
```bash
# 找到數據庫文件
# Windows: %APPDATA%/ig-dm-helper/igdm.db
# macOS: ~/Library/Application Support/ig-dm-helper/igdm.db

# 刪除鎖文件（如果存在）
# igdm.db-shm
# igdm.db-wal
```

---

## ❌ 問題 9: Session 過期

### 症狀

- 突然無法發送訊息
- 提示「未登入」
- API 返回 401 錯誤

### 解決方案

**重新登入：**
1. 重啟應用
2. 輸入帳號密碼重新登入
3. 點擊「保存登入狀態」

**延長 Session：**
- 每天至少使用一次
- 使用「保存登入狀態」功能
- 避免長時間不使用

---

## ❌ 問題 10: Rate Limit - 速率限制

### 錯誤信息

```
Error: Please wait a few minutes before you try again.
```

### 原因

Instagram 限制了您的請求頻率。

### 解決方案

**立即措施：**
- 停止所有操作
- 等待 10-30 分鐘

**預防措施：**
- 增加延遲時間（60-120 秒）
- 減少每日發送數量（<50 條）
- 避免在短時間內操作多個帳號

---

## 🛠️ 調試技巧

### 開啟開發者工具

編輯 `main.js`：

```javascript
// 找到這一行並取消註釋
mainWindow.webContents.openDevTools();
```

### 查看詳細日誌

在控制台（Console）查看：
- API 請求和響應
- 錯誤堆棧
- Cookie 和 Session 狀態

### 測試 API 連接

```javascript
// 在開發者工具的 Console 中執行
fetch('https://www.instagram.com/')
  .then(r => console.log('連接成功', r.status))
  .catch(e => console.error('連接失敗', e));
```

---

## 📞 獲取幫助

如果以上方法都無法解決問題：

### 1. 收集信息

- 完整的錯誤信息
- 操作步驟
- 系統信息（Windows/macOS/Linux）
- Node.js 版本：`node -v`
- Electron 版本：查看 `package.json`

### 2. 聯繫支持

- **LINE**: @flowcube
- **GitHub Issues**: 提交詳細問題報告
- **郵件**: 附上錯誤截圖和日誌

---

## 🔍 系統檢查清單

啟動前檢查：

```bash
# 1. Node.js 版本（需要 >= 16）
node -v

# 2. 依賴是否安裝
npm list

# 3. sqlite3 是否正確編譯
npm list sqlite3

# 4. Electron 是否可用
npx electron --version

# 5. 網路連接
ping instagram.com
```

---

## 🎯 最佳實踐

### 避免問題的建議

1. **定期重新編譯原生模塊**
   ```bash
   npx electron-rebuild
   ```

2. **保持依賴更新**
   ```bash
   npm update
   ```

3. **使用穩定的網路環境**
   - 避免使用公共 WiFi
   - 使用固定 IP

4. **控制使用頻率**
   - 每天發送 < 50 條
   - 每條間隔 > 30 秒
   - 避免 24/7 運行

5. **定期保存 Session**
   - 登入後立即保存
   - 每週重新登入一次

6. **使用測試帳號**
   - 先用小號測試
   - 確認穩定後再用主帳號

---

## 📊 錯誤代碼參考

| 錯誤代碼 | 含義 | 解決方法 |
|---------|------|---------|
| `401` | 未授權 | 重新登入 |
| `403` | 禁止訪問 | 等待或更換 IP |
| `429` | 請求過多 | 降低頻率 |
| `500` | 伺服器錯誤 | 等待 Instagram 修復 |
| `ECONNREFUSED` | 連接被拒 | 檢查網路/防火牆 |
| `ETIMEDOUT` | 連接超時 | 檢查網路 |

---

**需要更多幫助？查看 [HTTP_API_VERSION.md](HTTP_API_VERSION.md) 或 [QUICKSTART_HTTP.md](QUICKSTART_HTTP.md)**

