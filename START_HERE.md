# 🚀 从这里开始 - 完整使用指南

## ⚠️ 遇到问题？

### 问题 1：中文显示乱码

**看到这样的内容：**
```
?豢?摨恍???
?? ???活?賊?憭??航??嚗?
```

**✅ 解决方案：**

#### 方法 1：使用批处理文件（最简单）

```cmd
run.bat
```

双击 `run.bat` 文件，会自动设置编码并启动程序。

#### 方法 2：使用 PowerShell 脚本

```powershell
.\run.ps1
```

#### 方法 3：测试编码

```bash
node test-encoding.js
```

如果看到清晰的中文，说明编码正常。

---

### 问题 2：API 错误

**看到这样的错误：**
```
Maximum number of redirects exceeded
连接 Instagram 服务器时发生错误
```

**✅ 解决方案：**

#### 步骤 1：先登入

```bash
node demo-login.js
```

输入您的 Instagram 用户名和密码。

#### 步骤 2：在浏览器中验证

1. 打开浏览器访问 https://www.instagram.com
2. 登入您的账号
3. 完成任何验证要求
4. 确保能正常使用 Instagram

#### 步骤 3：重新尝试

```bash
run.bat
```

或

```bash
node demo-smart-batch-dm.js
```

---

## 🎯 推荐使用流程

### 第一次使用

```bash
# 1. 测试编码是否正常
node test-encoding.js

# 2. 登入 Instagram
node demo-login.js

# 3. 测试功能
node demo-browser-profile.js

# 4. 开始群发
run.bat
```

### 日常使用

```bash
# 直接运行（已登入的情况）
run.bat
```

或

```bash
node demo-smart-batch-dm.js
```

---

## 📋 快速命令参考

| 命令 | 说明 | 何时使用 |
|------|------|---------|
| `run.bat` | 启动群发（自动修复编码）| ⭐ 最常用 |
| `node test-encoding.js` | 测试编码 | 第一次使用 |
| `node demo-login.js` | 登入 Instagram | 每天第一次使用 |
| `node demo-browser-profile.js` | 测试浏览器打开 | 测试功能 |
| `node demo-smart-batch-dm.js` | 智能群发 | 已登入后 |

---

## 🔧 故障排除

### 编码问题

| 症状 | 解决方案 |
|------|---------|
| 中文乱码 | 使用 `run.bat` |
| 仍然乱码 | 运行 `chcp 65001` 后再试 |
| PowerShell 乱码 | 使用 `.\run.ps1` |

### API 问题

| 症状 | 解决方案 |
|------|---------|
| Maximum redirects | 在浏览器登入并验证 |
| 401 Unauthorized | 运行 `node demo-login.js` |
| 429 Too Many Requests | 等待 30 分钟 |
| Network error | 检查网络连接 |

---

## 📸 正确的显示效果

**运行 `run.bat` 或 `node test-encoding.js` 后，您应该看到：**

```
╔════════════════════════════════════════╗
║   智能批量发送 DM 演示                 ║
╚════════════════════════════════════════╝

📝 步骤 1: 登入 Instagram

请输入您的 Instagram 用户名: 
```

**而不是：**

```
?豢?摨恍???
?? ???活?賊?
```

---

## 🎯 完整使用示例

### 示例 1：测试编码

```cmd
C:\Projects\ig-dm-helper> node test-encoding.js

╔════════════════════════════════════════╗
║   终端编码测试                         ║
╚════════════════════════════════════════╝

🔍 测试中文字符显示...

✅ 成功
❌ 失败
⚠️  警告

💡 如果上面的内容显示正常，您可以安全地使用所有功能。

🎉 测试完成！
```

### 示例 2：登入

```cmd
C:\Projects\ig-dm-helper> node demo-login.js

╔════════════════════════════════════════╗
║   Instagram 登入演示                   ║
╚════════════════════════════════════════╝

请输入用户名: my_account
请输入密码: ********

🔐 正在登入...

✅ 登入成功！
✓ Session 已保存到: instagram-session.json
```

### 示例 3：群发

```cmd
C:\Projects\ig-dm-helper> run.bat

╔════════════════════════════════════════╗
║   智能批量发送 DM 演示                 ║
╚════════════════════════════════════════╝

📝 步骤 1: 登入 Instagram

(按照提示操作...)

[1/10] 目标用户: @instagram

🌐 正在浏览器中打开: https://www.instagram.com/instagram/

(浏览器自动打开用户页面)

╔══════════════════════════════════════════════════════════╗
║                    用户资料                              ║
╚══════════════════════════════════════════════════════════╝

👤 用户名: @instagram
👥 粉丝: 661.2M
...

是否发送消息给 @instagram? (y/n/s/q): 
```

---

## 💡 重要提示

### ✅ 使用前必读

1. **编码问题**
   - 使用 `run.bat` 可以避免大部分编码问题
   - 第一次使用先运行 `node test-encoding.js` 测试

2. **登入问题**
   - 每天第一次使用前运行 `node demo-login.js`
   - 如果遇到 API 错误，先在浏览器中登入验证

3. **速率限制**
   - 每条消息间隔 5-10 秒
   - 每天发送量不要超过 50-100 条
   - 遇到限制立即停止，等待 30 分钟

### ⚠️ 风险提示

- 使用自动化工具可能违反 Instagram 服务条款
- 可能导致账号被限制或封禁
- 建议先用测试账号验证
- 风险自负

---

## 📚 详细文档

| 文档 | 说明 |
|------|------|
| **START_HERE.md** | 本文档 - 快速开始 |
| **FIX_ENCODING.md** | 编码问题完整指南 |
| **API_ERROR_GUIDE.md** | API 错误解决指南 |
| **BROWSER_PROFILE_GUIDE.md** | 浏览器功能说明 |
| **SMART_BATCH_DM_GUIDE.md** | 智能群发完整指南 |
| **LOGIN_GUIDE.md** | 登入功能说明 |

---

## 🎊 快速开始

### 最简单的方式

```cmd
1. 双击 run.bat
2. 按照提示操作
3. 开始使用
```

### 如果遇到问题

```cmd
1. 运行 node test-encoding.js（测试编码）
2. 运行 node demo-login.js（登入）
3. 再次尝试 run.bat
```

### 查看帮助

```cmd
查看文档文件夹中的 .md 文件
特别是：
- FIX_ENCODING.md（编码问题）
- API_ERROR_GUIDE.md（API 错误）
```

---

**🚀 从 run.bat 开始，享受智能群发体验！**

有问题？查看对应的文档文件或测试脚本！

