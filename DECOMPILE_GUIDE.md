# 🔧 APK 反编译完整指南

## 🎯 目标

反编译新版本 Instagram APK（`IGDM10301744SNweb.apk`），并与旧版本对比，找出新功能。

---

## 🚀 快速开始（3 步骤）

### 步骤 1：安装 JADX

```bash
# 运行自动安装脚本
setup-jadx.bat
```

或手动安装：
1. 访问 https://github.com/skylot/jadx/releases/latest
2. 下载 `jadx-x.x.x.zip`
3. 解压到 `tools\jadx\` 目录

### 步骤 2：反编译 APK

```bash
# 运行反编译脚本
decompile-apk.bat
```

这会自动：
- 反编译旧版本到 `decompiled\old\`
- 反编译新版本到 `decompiled\new\`

### 步骤 3：分析差异

```bash
# 运行分析脚本
node analyze-apk.js
```

查看生成的报告：`APK_ANALYSIS_REPORT.md`

---

## 📂 文件结构

反编译后的目录结构：

```
ig-dm-helper/
├── IGDM10211222SNweb(old).apk     # 旧版本 APK
├── IGDM10301744SNweb.apk          # 新版本 APK
├── tools/
│   └── jadx/                       # JADX 反编译工具
│       ├── bin/
│       │   └── jadx.bat
│       └── lib/
├── decompiled/
│   ├── old/                        # 旧版本反编译代码
│   │   ├── sources/
│   │   │   └── com/
│   │   │       └── instagram/
│   │   │           ├── api/        # ⭐ API 相关代码
│   │   │           ├── direct/     # ⭐ 私讯功能
│   │   │           ├── user/       # ⭐ 用户功能
│   │   │           └── ...
│   │   └── resources/
│   └── new/                        # 新版本反编译代码
│       └── sources/
│           └── com/
│               └── instagram/
│                   ├── api/        # ⭐ 查找 API 端点
│                   ├── direct/     # ⭐ 私讯新功能
│                   ├── user/       # ⭐ 用户新功能
│                   └── ...
└── APK_ANALYSIS_REPORT.md          # 自动生成的分析报告
```

---

## 🔍 如何查找新功能

### 方法 1：使用自动分析工具

```bash
node analyze-apk.js
```

查看 `APK_ANALYSIS_REPORT.md` 获取：
- 新增的 API 端点
- 移除的 API 端点
- 新增的 HTTP Headers
- 功能推测和实现优先级

### 方法 2：手动搜索关键代码

使用 VSCode 或其他编辑器打开 `decompiled\new\` 目录：

**搜索 API 端点：**
```
正则表达式搜索：
/api/v1/
direct_v2/
friendships/
users/\d+/
media/upload/
```

**搜索关键类：**
```
类名搜索：
ApiRequest
DirectMessage
UserInfo
MediaUpload
FollowManager
```

**搜索 HTTP Headers：**
```
文本搜索：
X-IG-App-ID
User-Agent
X-CSRFToken
Authorization
Cookie
```

### 方法 3：对比工具

使用文件对比工具比较新旧版本：

**推荐工具：**
- Beyond Compare（付费）
- WinMerge（免费）
- Visual Studio Code（内置对比功能）

**使用方法：**
```bash
# 在 VSCode 中
# 右键 decompiled\old\ → 选择"选择以进行比较"
# 右键 decompiled\new\ → 选择"与已选项目比较"
```

---

## 🎯 重点查找区域

### 1. API 客户端类

**位置：** `decompiled\new\sources\com\instagram\api\`

**关键文件：**
```
ApiClient.java
ApiRequest.java
ApiResponse.java
HttpClient.java
```

**查找内容：**
- API 基础 URL
- 请求构建方法
- 签名算法
- 认证方式

### 2. 私讯功能

**位置：** `decompiled\new\sources\com\instagram\direct\`

**关键文件：**
```
DirectMessage.java
DirectThread.java
DirectInbox.java
MessageSender.java
```

**查找内容：**
- 发送消息的方法
- 获取对话列表
- 消息类型（文本、图片、视频）
- 消息加密方式

### 3. 用户功能

**位置：** `decompiled\new\sources\com\instagram\user\`

**关键文件：**
```
UserInfo.java
UserProfile.java
FollowManager.java
FriendshipStatus.java
```

**查找内容：**
- 获取用户信息的方法
- 关注/取消关注的实现
- 获取粉丝列表
- 获取关注列表

### 4. 媒体上传

**位置：** `decompiled\new\sources\com\instagram\media\`

**关键文件：**
```
MediaUpload.java
PhotoUpload.java
VideoUpload.java
```

**查找内容：**
- 图片上传流程
- 视频上传流程
- 文件格式要求
- 上传 API 端点

---

## 💡 分析技巧

### 技巧 1：查找 API 端点

在反编译的代码中搜索：

```java
// 搜索字符串常量
public static final String API_ENDPOINT = "/api/v1/direct_v2/threads/broadcast/text/";

// 搜索 URL 构建
String url = this.baseUrl + "/api/v1/users/" + userId + "/info/";

// 搜索 HTTP 方法
httpPost(url, params);
httpGet(url);
```

### 技巧 2：查找请求参数

```java
// 搜索参数构建
JSONObject params = new JSONObject();
params.put("recipient_users", "[123456]");
params.put("text", message);
params.put("client_context", generateUUID());

// 搜索 Form 数据
FormBody.Builder builder = new FormBody.Builder();
builder.add("text", message);
builder.add("thread_ids", threadId);
```

### 技巧 3：查找签名算法

```java
// 搜索签名相关
public String generateSignature(String data) {
    // HMAC-SHA256 或其他签名算法
}

// 搜索加密
private String encrypt(String data, String key) {
    // 加密实现
}
```

### 技巧 4：查找 Headers

```java
// 搜索 HTTP Headers
headers.put("X-IG-App-ID", "936619743392459");
headers.put("User-Agent", userAgent);
headers.put("X-CSRFToken", csrfToken);
```

---

## 📊 分析报告示例

运行 `analyze-apk.js` 后会生成类似的报告：

```markdown
# APK 分析报告

## 新增 API 端点（5 个）
- `/api/v1/direct_v2/threads/broadcast/configure_photo/`
- `/api/v1/direct_v2/threads/broadcast/configure_video/`
- `/api/v1/clips/create/`
- `/api/v1/friendships/set_reminder/`
- `/api/v1/users/search/`

## 功能推测

### `/api/v1/direct_v2/threads/broadcast/configure_photo/`
**推测功能**: 发送图片私讯
**优先级**: 高
**建议实现**: 在 instagram-api.js 中添加 sendPhotoMessage 方法
```

---

## 🔧 常见问题

### Q1: JADX 反编译很慢怎么办？

**A:** 使用以下参数加速：

```bash
jadx.bat -d output input.apk --no-res --no-imports --threads-count 4
```

- `--no-res`: 跳过资源文件
- `--no-imports`: 不生成导入语句
- `--threads-count 4`: 使用 4 个线程

### Q2: 反编译后代码无法阅读？

**A:** Instagram APK 使用了代码混淆（ProGuard/R8）

**解决方法：**
1. 查找字符串常量（API 端点通常不会被混淆）
2. 跟踪方法调用链
3. 使用动态分析（Frida）

### Q3: 如何确认找到的 API 是否可用？

**A:** 使用 Postman 或 curl 测试：

```bash
curl -X POST "https://i.instagram.com/api/v1/direct_v2/threads/broadcast/text/" \
  -H "X-IG-App-ID: 936619743392459" \
  -H "X-CSRFToken: YOUR_CSRF_TOKEN" \
  -H "Cookie: sessionid=YOUR_SESSION" \
  -d "text=Hello&recipient_users=[\"123456\"]"
```

### Q4: 代码中的类名都是 a.b.c，怎么理解？

**A:** 这是混淆后的代码，需要：

1. **查找字符串线索**
   ```java
   // 如果看到这样的字符串，说明这是 API 相关类
   public static final String f12345a = "/api/v1/users/";
   ```

2. **跟踪调用链**
   - 从已知的入口点（如 Activity）往下跟踪
   - 找到网络请求相关的类

3. **使用注释**
   - JADX 有时会在注释中保留原始信息

---

## 🎓 进阶技巧

### 1. 使用 Frida 动态分析

Frida 可以在运行时拦截方法调用：

```javascript
// hook-instagram.js
Java.perform(function() {
    var ApiClient = Java.use('com.instagram.api.ApiClient');
    
    ApiClient.executeRequest.implementation = function(request) {
        console.log('[API] URL:', request.getUrl());
        console.log('[API] Method:', request.getMethod());
        console.log('[API] Body:', request.getBody());
        
        return this.executeRequest(request);
    };
});
```

运行：
```bash
frida -U -f com.instagram.android -l hook-instagram.js
```

### 2. 使用网络抓包

**工具：** Charles Proxy、Burp Suite、mitmproxy

**步骤：**
1. 在手机上设置代理
2. 安装 SSL 证书
3. 打开 Instagram 操作
4. 查看抓包结果

**优势：**
- 看到真实的请求和响应
- 不需要反编译
- 更直观

### 3. 比较多个版本

保留多个版本的反编译代码：

```
decompiled/
├── v10211222/
├── v10301744/
└── v10401855/
```

对比找出变化趋势。

---

## 📝 实现新功能的流程

### 1. 发现新 API

运行分析工具找到新 API：
```bash
node analyze-apk.js
```

### 2. 研究实现细节

在反编译代码中查找该 API 的使用：

```bash
# 在 VSCode 中全局搜索
/api/v1/direct_v2/threads/broadcast/configure_photo/
```

### 3. 提取关键信息

记录：
- API URL
- HTTP 方法（GET/POST）
- 必需参数
- 可选参数
- Headers
- 响应格式

### 4. 在项目中实现

在 `instagram-api.js` 中添加：

```javascript
async sendPhotoMessage(username, photoPath, caption = '') {
    try {
        // 1. 上传图片
        const uploadResult = await this.uploadPhoto(photoPath);
        
        // 2. 获取 thread ID
        const threadId = await this.getThreadId(userId);
        
        // 3. 发送消息
        const response = await this.client.post(
            '/api/v1/direct_v2/threads/broadcast/configure_photo/',
            {
                upload_id: uploadResult.upload_id,
                recipient_users: JSON.stringify([userId]),
                thread_ids: JSON.stringify([threadId]),
                caption: caption
            }
        );
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
```

### 5. 测试功能

创建测试文件：

```javascript
// test-photo-message.js
const InstagramAPI = require('./src/instagram-api');
const igAPI = new InstagramAPI();

async function test() {
    await igAPI.login('username', 'password');
    const result = await igAPI.sendPhotoMessage('target', 'test.jpg');
    console.log(result);
}

test();
```

---

## 📞 获取帮助

如果遇到问题：

1. **查看日志** - 运行脚本时的输出
2. **检查文件** - 确认 APK 和工具都存在
3. **搜索错误** - Google 或 Stack Overflow
4. **查看文档** - JADX GitHub Issues

---

## 🎉 总结

反编译 APK 的完整流程：

1. ✅ 安装 JADX (`setup-jadx.bat`)
2. ✅ 反编译 APK (`decompile-apk.bat`)
3. ✅ 分析代码 (`analyze-apk.js`)
4. ✅ 查找新功能（手动搜索）
5. ✅ 实现到项目中
6. ✅ 测试功能

**现在就开始吧！** 🚀

```bash
# 一键开始
setup-jadx.bat && decompile-apk.bat && node analyze-apk.js
```

