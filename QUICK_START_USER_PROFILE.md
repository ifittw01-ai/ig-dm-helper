# 🚀 用户资料显示功能 - 快速开始

## ✨ 功能说明

在群发 DM 时，**自动显示每个目标用户的 Instagram 资料**，您可以决定是否发送！

---

## 📸 显示效果

```
[1/10] 目标用户: @instagram

╔══════════════════════════════════════════════════════════╗
║                    用户资料                              ║
╚══════════════════════════════════════════════════════════╝

👤 用户名: @instagram
📝 全名: Instagram
💬 简介: Discover what's next on Instagram 📷
👥 粉丝: 661.2M
➕ 关注: 76
📷 帖子: 7450
🔓 公开账号
✅ 已验证

────────────────────────────────────────────────────────────

是否发送消息给 @instagram? (y/n/s=跳过/q=停止): 
```

---

## 🚀 立即使用

### 方法 1: 演示脚本

```bash
node demo-smart-batch-dm.js
```

按照提示操作，在"发送选项"步骤选择 `y` 启用用户资料显示。

### 方法 2: 在代码中使用

```javascript
const InstagramAPI = require('./src/instagram-api');
const SmartBatchDM = require('./src/smart-batch-dm');

// 1. 登入
const igAPI = new InstagramAPI();
await igAPI.login('username', 'password');

// 2. 批量发送（显示资料）
const batchDM = new SmartBatchDM(igAPI);
await batchDM.sendBatch(
    ['user1', 'user2', 'user3'],
    'Hello!',
    {
        delay: 5000,
        showProfile: true // ← 显示用户资料
    }
);
```

### 方法 3: 查看演示

```bash
node demo-user-profile.js
```

查看如何显示用户资料（不会真正发送消息）。

---

## 🎮 操作选项

发送给每个用户前，您可以选择：

| 输入 | 效果 |
|------|------|
| `y` / 回车 | ✅ 发送消息 |
| `n` | ⏭️ 跳过该用户 |
| `s` | ⏭️ 跳过该用户 |
| `q` | 🛑 停止所有发送 |

---

## 💡 使用场景

### ✅ 什么时候使用？

- 🎯 **精准营销** - 确认粉丝数是否达标
- 🤝 **合作邀请** - 确认是正确的 KOL
- 🔍 **筛选用户** - 根据简介决定是否发送
- ⚠️ **避免错误** - 防止发送给错误的用户

### ⚡ 什么时候不用？

如果您已经筛选好用户列表，可以关闭此功能加快速度：

```javascript
await batchDM.sendBatch(users, message, {
    showProfile: false // 不显示，直接发送
});
```

---

## 📊 显示的信息

- 👤 用户名
- 📝 全名
- 💬 简介
- 👥 粉丝数（格式化显示，如 `661.2M`）
- ➕ 关注数
- 📷 帖子数
- 🔓/🔒 公开/私密账号
- ✅ 是否已验证

---

## 🎉 完整示例

```bash
# 1. 运行演示脚本
node demo-smart-batch-dm.js

# 2. 登入
用户名: my_account
密码: ********

# 3. 输入目标用户
用户 1: instagram
用户 2: cristiano
用户 3: (回车结束)

# 4. 输入消息
消息内容: Hello!

# 5. 启用用户资料显示
是否在发送前显示用户资料? (y/n): y

# 6. 确认发送
确认发送？(y/n): y

# 7. 开始发送 - 每个用户都会显示资料
[1/2] 目标用户: @instagram

(显示完整资料)

是否发送消息给 @instagram? (y/n/s/q): y
✅ 成功发送

[2/2] 目标用户: @cristiano

(显示完整资料)

是否发送消息给 @cristiano? (y/n/s/q): n
⏭️ 已跳过
```

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| **USER_PROFILE_FEATURE.md** | 完整功能说明 |
| **SMART_BATCH_DM_GUIDE.md** | 智能批量发送指南 |
| **SMART_BATCH_SUMMARY.md** | 功能总结 |

---

## 🎊 立即开始

```bash
node demo-smart-batch-dm.js
```

**享受更智能的群发体验！** 🚀

