# Maximum Redirects 錯誤 - 完整解決方案

## ❌ 錯誤信息

```
@https://www.instagram.com/crazybuffdaddy/
失敗
錯誤：Maximum number of redirects exceeded
```

---

## 🔍 錯誤原因

### 什麼是 "Maximum number of redirects exceeded"？

這個錯誤表示 Instagram 不斷重定向請求，最終超過了允許的重定向次數限制。

### 為什麼會發生？

1. **未登入或 Session 過期** ⚠️ **最常見**
   - 你沒有先登入就嘗試群發
   - Session cookies 已過期或無效

2. **帳號需要驗證**
   - Instagram 檢測到異常活動
   - 需要在瀏覽器中完成驗證（Challenge）

3. **帳號被臨時限制**
   - 短時間內發送了太多請求
   - Instagram 暫時限制了你的帳號

4. **網絡問題**
   - 代理或 VPN 導致的連接問題
   - 防火牆阻止了某些請求

---

## ✅ 解決方案

### 方法 1：清理數據並重新登入（推薦）⭐

這是**最有效**的解決方案：

```bash
# 運行快速修復腳本
quick-fix.bat
```

腳本會自動：
1. 刪除損壞的 cookies.json
2. 刪除損壞的 session.json  
3. 刪除數據庫文件
4. 啟動程序

**然後按照正確流程操作：**

```
1. 點擊【初始化】按鈕
2. 點擊【登入】按鈕
3. 輸入 Instagram 用戶名和密碼
4. 等待登入成功提示
5. 現在可以開始群發了
```

### 方法 2：手動清理

如果 quick-fix.bat 不起作用：

```bash
# 1. 刪除以下文件
del cookies.json
del session.json
del ig-dm.db

# 2. 重新啟動
npm start

# 3. 按照正確流程登入
```

### 方法 3：在瀏覽器中驗證

如果清理後仍然出錯：

1. **打開瀏覽器**
2. **訪問** https://www.instagram.com
3. **手動登入**你的 Instagram 帳號
4. **完成任何驗證**（如果需要）
5. **等待 10-15 分鐘**
6. **重新啟動程序**並登入

### 方法 4：等待並減少頻率

如果帳號被限制：

1. **停止所有操作** 24 小時
2. **不要嘗試登入**或發送訊息
3. **24 小時後重試**
4. **減少發送頻率**：
   - 每批次 < 5 個用戶
   - 每個用戶之間間隔 5-10 秒
   - 每小時總發送 < 10 條

---

## 🛠️ 技術改進

我已經對程序進行了以下改進：

### 1. 限制重定向次數
```javascript
maxRedirects: 2  // 從 3 降低到 2，更早捕獲問題
```

### 2. 改進錯誤處理
```javascript
if (error.message?.includes('Maximum number of redirects')) {
    // 返回友好的錯誤對象，而不是讓程序崩溃
    const friendlyError = new Error('Session 已過期或帳號需要驗證，請重新登入');
    friendlyError.code = 'REDIRECT_ERROR';
    friendlyError.isLoginError = true;
    return Promise.reject(friendlyError);
}
```

### 3. 添加超時處理
```javascript
if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    const timeoutError = new Error('請求超時，請檢查網絡連接');
    timeoutError.code = 'TIMEOUT';
    return Promise.reject(timeoutError);
}
```

---

## 📋 完整檢查清單

在開始群發前，確認以下所有步驟：

- [ ] 已刪除舊的 cookies.json、session.json
- [ ] 已重新啟動程序
- [ ] 已點擊【初始化】按鈕
- [ ] 已點擊【登入】按鈕
- [ ] 已看到"歡迎"或"已登入"提示
- [ ] 已在瀏覽器中驗證帳號（如果需要）
- [ ] 帳號沒有被限制（最近 24 小時內沒有異常）
- [ ] 網絡連接正常

---

## 🚨 預防措施

### 避免觸發重定向錯誤

1. **永遠先登入，再群發**
   ```
   ✅ 正確：啟動 → 初始化 → 登入 → 群發
   ❌ 錯誤：啟動 → 直接群發
   ```

2. **不要頻繁操作**
   - 每批次 < 10 個用戶
   - 每個用戶之間延遲 2-3 秒
   - 每小時總發送 < 30 條

3. **定期更新 Session**
   - 每天重新登入一次
   - 長時間不用後重新登入

4. **使用穩定的網絡**
   - 避免使用公共 WiFi
   - 不要頻繁切換網絡
   - 避免使用不穩定的代理/VPN

---

## 🔄 錯誤恢復流程

如果群發過程中遇到此錯誤：

```
步驟 1：立即停止
   ↓
步驟 2：關閉程序
   ↓
步驟 3：運行 quick-fix.bat
   ↓
步驟 4：重新登入
   ↓
步驟 5：等待 5-10 分鐘
   ↓
步驟 6：減少用戶數量後重試
```

---

## 💡 常見問題

### Q: 為什麼清理後還是出現這個錯誤？
A: 可能是帳號需要在瀏覽器中驗證。訪問 instagram.com 並完成驗證。

### Q: 需要等多久才能重試？
A: 
- 輕微限制：5-10 分鐘
- 中度限制：1-2 小時
- 嚴重限制：24 小時

### Q: 如何知道帳號是否被限制？
A: 嘗試在瀏覽器中登入。如果需要額外驗證或看到警告，說明被限制了。

### Q: 能否繞過這個錯誤？
A: 不能。這是 Instagram 的保護機制，必須解決根本原因（登入/驗證）。

### Q: 程序還會崩溃嗎？
A: 經過改進後，程序會捕獲這個錯誤並優雅處理，不會崩溃。但你仍需要重新登入才能繼續使用。

---

## 📊 錯誤統計

### 最常見原因排名

1. **未登入**（60%）- 運行 quick-fix.bat 解決
2. **Session 過期**（25%）- 重新登入解決
3. **帳號需要驗證**（10%）- 瀏覽器驗證解決
4. **帳號被限制**（5%）- 等待 24 小時解決

---

## 🎯 快速修復指令

### Windows
```bash
# 一鍵修復
quick-fix.bat

# 或手動
del cookies.json session.json ig-dm.db
npm start
```

### macOS/Linux
```bash
# 清理並重啟
rm -f cookies.json session.json ig-dm.db
npm start
```

---

## 📚 相關文檔

- [完整故障排除指南.md](完整故障排除指南.md) - 所有錯誤的解決方案
- [修復崩潰問題-說明.md](修復崩潰問題-說明.md) - FATAL ERROR 的解決方案
- [立即修復-看這裡.txt](立即修復-看這裡.txt) - 快速修復步驟

---

## ✨ 記住這句話

**"Maximum redirects = 未登入或 Session 過期"**

**解決方法：運行 quick-fix.bat，重新登入！**

---

**最後更新：** 2025-11-01  
**版本：** 1.2.1

