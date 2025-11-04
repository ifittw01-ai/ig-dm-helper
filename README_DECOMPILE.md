# 🔧 反编译新版 APK - 快速指南

## 🎯 目标

反编译 `IGDM10301744SNweb.apk`（新版本），分析新功能，并集成到项目中。

---

## 🚀 一键开始

```bash
# 双击运行
START_DECOMPILE.bat
```

选择 "1" 执行完整流程（自动安装工具 + 反编译 + 分析）

---

## 📋 详细步骤

### 方法 1：自动化流程（推荐）⭐

```bash
# 步骤 1：一键运行
START_DECOMPILE.bat

# 步骤 2：查看分析报告
# 自动生成：APK_ANALYSIS_REPORT.md

# 步骤 3：浏览反编译代码
# 目录：decompiled\new\sources\
```

### 方法 2：手动逐步执行

```bash
# 步骤 1：安装 JADX 工具
setup-jadx.bat

# 步骤 2：反编译 APK
decompile-apk.bat

# 步骤 3：分析代码
node analyze-apk.js

# 步骤 4：查看报告
# 打开 APK_ANALYSIS_REPORT.md
```

---

## 📂 输出文件

| 文件/目录 | 说明 |
|-----------|------|
| `decompiled\new\` | 新版本反编译的 Java 代码 |
| `decompiled\old\` | 旧版本反编译的代码（用于对比）|
| `APK_ANALYSIS_REPORT.md` | 自动生成的分析报告 |
| `tools\jadx\` | JADX 反编译工具 |

---

## 🔍 如何查找新功能

### 1. 查看自动分析报告

```bash
# 打开报告
APK_ANALYSIS_REPORT.md
```

报告包含：
- ✅ 新增的 API 端点
- ✅ 移除的 API 端点  
- ✅ 功能推测
- ✅ 实现优先级建议

### 2. 手动搜索代码

使用 VS Code 打开 `decompiled\new\` 目录：

**搜索关键目录：**
```
com/instagram/api/          ← API 接口定义
com/instagram/direct/       ← 私讯功能
com/instagram/user/         ← 用户功能
com/instagram/media/        ← 媒体上传
```

**搜索关键字：**
```
/api/v1/                    ← API 端点
direct_v2/                  ← 私讯 API
friendships/                ← 关注功能
X-IG-App-ID                 ← HTTP Headers
```

### 3. 对比新旧版本

使用 VS Code 对比功能：
1. 右键 `decompiled\old\` → "选择以进行比较"
2. 右键 `decompiled\new\` → "与已选项目比较"

---

## 💡 实用技巧

### 技巧 1：快速找到 API 端点

在 VS Code 中使用正则搜索：

```regex
/api/v1/[a-z_/]+
```

### 技巧 2：查找具体功能

```
关注功能：     friendships/create
取消关注：     friendships/destroy
获取粉絲：     friendships/\d+/followers
获取关注：     friendships/\d+/following
发送私讯：     direct_v2/threads/broadcast
```

### 技巧 3：查找 HTTP Headers

搜索以下字符串：
```
"X-IG-App-ID"
"User-Agent"
"X-CSRFToken"
"Authorization"
```

---

## 📊 分析报告示例

自动生成的报告格式：

```markdown
# APK 分析报告

## 新增 API 端点（3 个）
- `/api/v1/direct_v2/threads/broadcast/configure_photo/`
- `/api/v1/clips/create/`
- `/api/v1/users/search/`

## 功能推测

### `/api/v1/direct_v2/threads/broadcast/configure_photo/`
**功能**: 发送图片私讯
**优先级**: 高
**建议**: 在 instagram-api.js 中实现
```

---

## 🔧 实现到项目中

### 步骤 1：找到新 API

从分析报告中选择要实现的功能

### 步骤 2：研究实现细节

在反编译代码中搜索该 API：

```javascript
// 在 VS Code 中全局搜索
/api/v1/direct_v2/threads/broadcast/configure_photo/
```

找出：
- API 参数
- HTTP 方法
- Headers
- 响应格式

### 步骤 3：在项目中实现

编辑 `src/instagram-api.js`：

```javascript
async sendPhotoMessage(username, photoPath, caption = '') {
    try {
        // 实现逻辑
        const userId = await this.getUserId(username);
        const threadId = await this.getThreadId(userId);
        
        // 调用 API
        const response = await this.client.post(
            '/api/v1/direct_v2/threads/broadcast/configure_photo/',
            {
                // 参数
            }
        );
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
```

### 步骤 4：测试功能

创建测试文件：

```javascript
// test-photo-message.js
const InstagramAPI = require('./src/instagram-api');
const igAPI = new InstagramAPI();

async function test() {
    await igAPI.login('test_user', 'password');
    const result = await igAPI.sendPhotoMessage('target', 'test.jpg');
    console.log(result);
}

test();
```

---

## ⚠️ 常见问题

### Q: JADX 下载失败？

**A:** 手动下载：
1. 访问 https://github.com/skylot/jadx/releases/latest
2. 下载 `jadx-x.x.x.zip`
3. 解压到 `tools\jadx\` 目录

### Q: 反编译很慢？

**A:** 正常情况，Instagram APK 较大，需要 5-10 分钟

### Q: 代码看不懂？

**A:** Instagram 使用了代码混淆：
- 查找字符串常量（API 端点）
- 跟踪方法调用链
- 使用动态分析工具（Frida）

### Q: 如何确认 API 可用？

**A:** 使用 Postman 测试：
```bash
POST https://i.instagram.com/api/v1/...
Headers:
  X-IG-App-ID: 936619743392459
  X-CSRFToken: YOUR_TOKEN
  Cookie: sessionid=YOUR_SESSION
```

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| `DECOMPILE_GUIDE.md` | 完整的反编译指南 |
| `APK_ANALYSIS_GUIDE.md` | APK 分析详细教程 |
| `NEW_FEATURES.md` | 已实现的新功能文档 |

---

## 🎓 进阶技巧

### 1. 使用 Frida 动态分析

```javascript
// hook-instagram.js
Java.perform(function() {
    var ApiClient = Java.use('com.instagram.api.ApiClient');
    
    ApiClient.executeRequest.implementation = function(request) {
        console.log('[API]', request.getUrl());
        return this.executeRequest(request);
    };
});
```

### 2. 使用网络抓包

工具：Charles Proxy、mitmproxy

步骤：
1. 手机设置代理
2. 安装 SSL 证书
3. 打开 Instagram
4. 查看请求详情

### 3. 对比多个版本

保存多个版本的反编译结果：

```
decompiled/
├── v10211222/
├── v10301744/
└── v10401855/
```

---

## 🎉 快速总结

```bash
# 1. 一键开始
START_DECOMPILE.bat

# 2. 选择选项 "1"（完整流程）

# 3. 等待完成（5-10 分钟）

# 4. 查看报告
APK_ANALYSIS_REPORT.md

# 5. 实现新功能
编辑 src/instagram-api.js
```

**现在就开始吧！** 🚀

---

**需要帮助？**
- 查看 `DECOMPILE_GUIDE.md` 获取详细指南
- 查看 `APK_ANALYSIS_GUIDE.md` 了解分析技巧

