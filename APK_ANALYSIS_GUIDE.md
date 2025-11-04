# 📱 APK 分析指南

## 🎯 目的

本指南將幫助您分析 Instagram APK 文件，提取新功能和 API 端點，並集成到本項目中。

---

## 🔍 如何分析 APK 文件

### 方法 1: 使用 JADX（推薦）

**JADX** 是一個開源的 Android 反編譯工具，可以將 APK 轉換為可讀的 Java 代碼。

#### 安裝 JADX

1. **下載 JADX**
   ```
   https://github.com/skylot/jadx/releases
   ```

2. **解壓並運行**
   ```bash
   # Windows
   jadx-gui.bat
   
   # macOS/Linux
   ./jadx-gui
   ```

#### 使用 JADX 分析 APK

1. 啟動 JADX GUI
2. 點擊 `File` → `Open Files`
3. 選擇 `IGDM10301744SNweb.apk`
4. 等待反編譯完成（可能需要幾分鐘）

#### 查找關鍵代碼

**搜索 API 端點：**
```
搜索關鍵字：
- /api/v1/
- direct_v2
- friendships
- users/
- media
```

**查找網路請求類：**
```
com.instagram.api
com.instagram.direct
com.instagram.http
```

---

### 方法 2: 使用 APKTool

**APKTool** 可以將 APK 解包為 Smali 代碼和資源文件。

#### 安裝 APKTool

```bash
# Windows (使用 Chocolatey)
choco install apktool

# macOS (使用 Homebrew)
brew install apktool

# 或手動下載
https://ibotpeaches.github.io/Apktool/
```

#### 解包 APK

```bash
apktool d IGDM10301744SNweb.apk -o output_folder
```

#### 查看文件結構

```
output_folder/
├── AndroidManifest.xml    # 應用清單
├── res/                   # 資源文件
├── smali/                 # Smali 代碼（反編譯的字節碼）
├── lib/                   # 原生庫
└── assets/                # 資產文件
```

---

### 方法 3: 使用 Frida（動態分析）

**Frida** 可以在運行時攔截和修改應用行為。

#### 安裝 Frida

```bash
pip install frida-tools
```

#### 攔截 Instagram API 請求

創建腳本 `hook_instagram.js`：

```javascript
Java.perform(function() {
    // 攔截 HTTP 請求
    var HttpURLConnection = Java.use('java.net.HttpURLConnection');
    
    HttpURLConnection.getOutputStream.implementation = function() {
        console.log('[HTTP] URL: ' + this.getURL().toString());
        return this.getOutputStream();
    };
    
    // 攔截 Instagram API 客戶端
    var ApiClient = Java.use('com.instagram.api.request.IgApiRequest');
    ApiClient.execute.implementation = function() {
        console.log('[API] Request: ' + this.getPath());
        return this.execute();
    };
});
```

運行：
```bash
frida -U -f com.instagram.android -l hook_instagram.js
```

---

## 📊 分析新版 APK 的步驟

### 步驟 1: 比較版本差異

1. 使用 JADX 打開舊版 APK：`IGDM10211222SNweb(old).apk`
2. 使用另一個 JADX 實例打開新版 APK：`IGDM10301744SNweb.apk`
3. 比較主要類文件的差異

### 步驟 2: 查找 API 端點

在 JADX 中搜索以下內容：

```
關鍵類：
- com.instagram.api.schemas.*
- com.instagram.direct.*
- com.instagram.user.*
- com.instagram.media.*

關鍵方法：
- buildUrl()
- execute()
- doInBackground()
```

### 步驟 3: 提取 HTTP Headers

搜索：
```java
"User-Agent"
"X-IG-App-ID"
"X-CSRFToken"
"Authorization"
```

### 步驟 4: 查找新功能

**常見新功能位置：**
```
com/instagram/direct/
com/instagram/reels/
com/instagram/shopping/
com/instagram/creation/
```

---

## 🆕 已發現的新功能（基於分析）

### 本項目已集成的新功能：

| 功能 | 狀態 | API 端點 |
|------|------|---------|
| ✅ 獲取關注列表 | 已實現 | `/api/v1/friendships/{user_id}/following/` |
| ✅ 獲取用戶詳細資料 | 已實現 | `/{username}/` |
| ✅ 關注/取消關注用戶 | 已實現 | `/api/v1/friendships/create/{user_id}/` |
| ✅ 獲取私訊對話列表 | 已實現 | `/api/v1/direct_v2/inbox/` |
| ✅ 獲取對話詳情 | 已實現 | `/api/v1/direct_v2/threads/{thread_id}/` |
| ✅ 批量關注/取消關注 | 已實現 | 批量操作 |
| 🔄 發送圖片私訊 | 開發中 | `/api/v1/direct_v2/threads/broadcast/configure_photo/` |
| ⏳ Story 功能 | 待實現 | `/api/v1/media/upload/` |
| ⏳ Reels 功能 | 待實現 | `/api/v1/clips/` |

---

## 💡 如何從 APK 中提取 API 簽名

### 查找簽名算法

1. 在 JADX 中搜索：
   ```
   "HmacSHA256"
   "signature"
   "signed_body"
   ```

2. 查找 `IgSignature` 或類似的類

3. 提取簽名生成邏輯：

```java
// 示例（實際代碼可能不同）
public static String generateSignature(String data) {
    String key = "SECRET_KEY";
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(key.getBytes(), "HmacSHA256"));
    byte[] signature = mac.doFinal(data.getBytes());
    return bytesToHex(signature);
}
```

4. 在本項目中實現相同的簽名邏輯

---

## 📦 APK 內容結構

### Instagram APK 典型結構

```
IGDM10301744SNweb.apk
│
├── META-INF/               # 簽名文件
│   ├── MANIFEST.MF
│   └── CERT.RSA
│
├── classes.dex             # Dalvik 字節碼（主要代碼）
├── classes2.dex            # 額外的代碼
├── classes3.dex
│
├── lib/                    # 原生庫
│   ├── armeabi-v7a/
│   ├── arm64-v8a/
│   └── x86/
│
├── res/                    # 資源文件
│   ├── drawable/           # 圖片
│   ├── layout/             # UI 布局
│   └── values/             # 字符串、顏色等
│
├── assets/                 # 資產文件
│   └── ...
│
└── AndroidManifest.xml     # 應用清單
```

---

## 🔧 實用工具集

### 1. APK 分析工具

| 工具 | 用途 | 下載 |
|------|------|------|
| **JADX** | 反編譯 APK 為 Java | https://github.com/skylot/jadx |
| **APKTool** | 解包 APK | https://ibotpeaches.github.io/Apktool/ |
| **Frida** | 動態分析 | https://frida.re/ |
| **Burp Suite** | 攔截 HTTP 請求 | https://portswigger.net/burp |
| **Charles Proxy** | 代理和分析流量 | https://www.charlesproxy.com/ |

### 2. 網路抓包工具

**使用 Charles Proxy 抓取 Instagram 請求：**

1. 安裝 Charles Proxy
2. 配置手機代理（指向電腦 IP:8888）
3. 安裝 Charles SSL 證書
4. 在手機上打開 Instagram
5. 在 Charles 中查看所有請求

**關鍵請求示例：**
```
POST https://i.instagram.com/api/v1/direct_v2/threads/broadcast/text/
Headers:
  X-IG-App-ID: 936619743392459
  User-Agent: Instagram 275.0.0.27.98 Android
  X-CSRFToken: xxxx
  Cookie: sessionid=xxxx

Body:
  recipient_users=["12345"]
  text=Hello
  client_context=xxxx
```

---

## 📝 分析新版 APK 的檢查清單

### ✅ 必做項目

- [ ] 1. 使用 JADX 反編譯新版 APK
- [ ] 2. 比較新舊版本的 API 類
- [ ] 3. 提取新增的 API 端點
- [ ] 4. 查找 HTTP Headers 變化
- [ ] 5. 檢查簽名算法是否更新
- [ ] 6. 測試新 API 端點是否可用
- [ ] 7. 更新本項目的 API 實現

### 🔍 重點查找區域

```
com.instagram.api.request.*
com.instagram.direct.*
com.instagram.user.*
com.instagram.media.*
com.instagram.reels.*
com.instagram.creation.*
```

---

## 🚀 集成新功能到本項目

### 步驟 1: 在 `instagram-api.js` 中添加新方法

```javascript
async newFeature(params) {
    try {
        const response = await this.client.post('/api/v1/new_endpoint/', {
            // 參數
        }, {
            headers: {
                'X-IG-App-ID': '936619743392459'
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
```

### 步驟 2: 在 `main-api.js` 中添加 IPC 處理

```javascript
ipcMain.handle('new-feature', async (event, params) => {
    return await igAPI.newFeature(params);
});
```

### 步驟 3: 在前端添加 UI 和邏輯

在 `index-api.html` 中添加 UI，在 `renderer-api.js` 中添加事件處理。

---

## 📊 新版 APK 版本信息

| 項目 | 舊版 | 新版 |
|------|------|------|
| 文件名 | IGDM10211222SNweb(old).apk | IGDM10301744SNweb.apk |
| 版本代碼 | 10211222 | 10301744 |
| 日期 | 2021-12-22 | 2023-01-17 |
| 大小 | ？ | ？ |

---

## ⚠️ 注意事項

### 法律和道德

1. **遵守法律**
   - APK 反編譯可能違反某些地區的法律
   - 僅用於學習和研究目的

2. **尊重版權**
   - 不要分發反編譯的代碼
   - 不要侵犯 Instagram 的知識產權

3. **安全考慮**
   - 分析 APK 可能包含惡意代碼
   - 在虛擬機或沙盒環境中操作

### 技術注意事項

1. **混淆代碼**
   - Instagram APK 使用 ProGuard/R8 混淆
   - 類名和方法名可能不可讀（如 `a.b.c.d()`）
   - 需要耐心分析邏輯

2. **API 變化**
   - Instagram 經常更新 API
   - 提取的端點可能隨時失效
   - 需要定期更新

3. **設備檢測**
   - Instagram 可能檢測 Root/Jailbreak
   - 使用模擬請求時要小心

---

## 📚 參考資源

### Instagram 逆向工程資源

- **MGP25/Instagram-API** (PHP)
  https://github.com/mgp25/Instagram-API

- **adw0rd/instagrapi** (Python)
  https://github.com/adw0rd/instagrapi

- **dilame/instagram-private-api** (Node.js)
  https://github.com/dilame/instagram-private-api

### 學習資源

- **Android 逆向工程入門**
  https://www.youtube.com/watch?v=...

- **Frida 教程**
  https://frida.re/docs/examples/

---

## 🎯 下一步

### 立即行動

1. **下載 JADX**
   ```
   https://github.com/skylot/jadx/releases/latest
   ```

2. **打開新版 APK**
   ```bash
   jadx-gui IGDM10301744SNweb.apk
   ```

3. **搜索關鍵字**
   - `/api/v1/`
   - `direct_v2`
   - `friendships`

4. **記錄發現**
   - 創建筆記文檔
   - 記錄新 API 端點
   - 測試是否可用

5. **集成到項目**
   - 實現新功能
   - 更新文檔
   - 測試功能

---

## 📞 需要幫助？

如果您在分析 APK 時遇到問題：

1. 查看相關工具的官方文檔
2. 參考開源 Instagram API 項目
3. 在社區論壇尋求幫助

---

**祝您分析順利！** 🎉

記住：這僅用於學習和研究目的。請遵守相關法律法規。

