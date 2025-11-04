# 🔐 登入功能使用指南

## ✅ 登入功能已完整实现！

您的项目已经包含完整的 Instagram 登入功能。

---

## 🚀 快速开始

### 方法 1：运行演示脚本（推荐）⭐

```bash
node demo-login.js
```

这会：
1. ✅ 引导您登入
2. ✅ 自动测试查询 `@chenyucheng315`
3. ✅ 展示所有可用功能

### 方法 2：在代码中使用

```javascript
const InstagramAPI = require('./src/instagram-api');
const igAPI = new InstagramAPI();

// 登入
const loginResult = await igAPI.login('your_username', 'your_password');

if (loginResult.success) {
    console.log('✅ 登入成功！');
    console.log('用户ID:', loginResult.userId);
    
    // 现在可以使用所有功能
    const result = await igAPI.getUserInfo('chenyucheng315');
    console.log(result);
}
```

### 方法 3：使用交互式测试工具

```bash
node quick-test.js
```

选择 **选项 1** 登入，然后就可以使用所有功能了！

---

## 📋 登入功能详解

### 登入方法

```javascript
async login(username, password)
```

**参数：**
- `username` - Instagram 用户名
- `password` - 密码

**返回：**
```javascript
{
    success: true,
    userId: "123456789",
    username: "your_username"
}
```

### 使用示例

#### 示例 1：基本登入

```javascript
const InstagramAPI = require('./src/instagram-api');
const igAPI = new InstagramAPI();

async function main() {
    // 登入
    const result = await igAPI.login('test_user', 'password123');
    
    if (result.success) {
        console.log('登入成功！');
    } else {
        console.log('登入失败:', result.error);
    }
}

main();
```

#### 示例 2：登入后查询用户

```javascript
const igAPI = new InstagramAPI();

// 登入
await igAPI.login('your_username', 'your_password');

// 查询任何用户（包括之前失败的）
const user = await igAPI.getUserInfo('chenyucheng315');

if (user.success) {
    console.log('用户名:', user.userInfo.username);
    console.log('粉丝数:', user.userInfo.followerCount);
}
```

#### 示例 3：登入后使用所有功能

```javascript
const igAPI = new InstagramAPI();

// 1. 登入
await igAPI.login('your_username', 'your_password');

// 2. 获取用户资料
const userInfo = await igAPI.getUserInfo('target_user');

// 3. 获取粉丝列表
const followers = await igAPI.fetchFollowers('target_user', {
    start: 1,
    end: 50
});

// 4. 获取关注列表
const following = await igAPI.fetchFollowing('your_username', {
    start: 1,
    end: 50
});

// 5. 查看私讯
const inbox = await igAPI.getInbox(10);

// 6. 发送私讯
const dm = await igAPI.sendDirectMessage('friend', 'Hello!');

// 7. 关注用户
const follow = await igAPI.followUser('someone');

// 8. 取消关注
const unfollow = await igAPI.unfollowUser('someone');
```

---

## 🔑 Session 管理

### 自动保存 Session

登入成功后，Session 会自动保存到数据库中。

```javascript
// 第一次登入
await igAPI.login('username', 'password');
// Session 已保存

// 下次使用时，可以尝试加载 Session
const savedSession = await db.getSession();
if (savedSession) {
    igAPI.loadSession(savedSession);
}
```

### 检查登入状态

```javascript
const isLoggedIn = await igAPI.checkLoginStatus();

if (isLoggedIn) {
    console.log('已登入');
} else {
    console.log('未登入，需要重新登入');
}
```

---

## ⚠️ 注意事项

### 1. 账号安全

- ⚠️ **建议使用测试小号**
- ⚠️ **不要在主账号上测试**
- ⚠️ **密码会加密传输但仍需谨慎**

### 2. 双重验证（2FA）

如果账号开启了双重验证：

**解决方案：**
1. 临时关闭双重验证
2. 或者使用应用专用密码（如果 Instagram 支持）

### 3. 登入失败的常见原因

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| 账号或密码错误 | 输入错误 | 检查拼写 |
| Challenge Required | 需要验证 | 在浏览器登入一次 |
| 2FA 错误 | 开启了双重验证 | 关闭 2FA |
| 账号被锁定 | 异常登入 | 等待或联系 Instagram |

### 4. 使用限制

登入后的请求限制会提高，但仍需注意：

| 操作 | 每小时限制 | 每天限制 |
|------|-----------|---------|
| 查询用户 | 100-200 | 500-1000 |
| 发送私讯 | 30-50 | 100-200 |
| 关注用户 | 40-60 | 200-300 |

---

## 💡 最佳实践

### 1. 添加错误处理

```javascript
const result = await igAPI.login(username, password);

if (!result.success) {
    if (result.error.includes('密码')) {
        console.log('密码错误，请重试');
    } else if (result.error.includes('验证')) {
        console.log('请在浏览器中完成验证');
    } else {
        console.log('登入失败:', result.error);
    }
    return;
}
```

### 2. 使用 Session 缓存

```javascript
// 尝试加载已保存的 Session
let loggedIn = false;

const savedSession = await db.getSession();
if (savedSession) {
    igAPI.loadSession(savedSession);
    loggedIn = await igAPI.checkLoginStatus();
}

// 如果 Session 无效，重新登入
if (!loggedIn) {
    const result = await igAPI.login(username, password);
    if (result.success) {
        await db.saveSession(igAPI.getSessionData());
    }
}
```

### 3. 添加重试机制

```javascript
async function loginWithRetry(username, password, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        const result = await igAPI.login(username, password);
        
        if (result.success) {
            return result;
        }
        
        console.log(`登入失败，重试 ${i + 1}/${maxRetries}...`);
        await new Promise(r => setTimeout(r, 5000)); // 等待 5 秒
    }
    
    throw new Error('登入失败，已达到最大重试次数');
}
```

---

## 🎯 解决您的问题

### 问题：查询 `@chenyucheng315` 失败

**原因：** 需要登入

**解决方案：**

```javascript
const InstagramAPI = require('./src/instagram-api');
const igAPI = new InstagramAPI();

// 1. 登入
await igAPI.login('your_test_account', 'your_password');

// 2. 现在可以成功查询了
const result = await igAPI.getUserInfo('https://www.instagram.com/chenyucheng315/');

if (result.success) {
    console.log('✅ 成功！');
    console.log('用户名:', result.userInfo.username);
    console.log('粉丝数:', result.userInfo.followerCount);
} else {
    console.log('❌ 失败:', result.error);
}
```

---

## 🧪 测试登入功能

### 运行完整演示

```bash
node demo-login.js
```

这会：
1. 要求您输入账号密码
2. 执行登入
3. 自动测试 `@chenyucheng315`
4. 测试其他功能
5. 显示完整结果

### 测试特定功能

```bash
# 交互式测试工具（推荐）
node quick-test.js

# 带登入的用户查询
node test-with-login.js

# 测试所有新功能
node test-new-features.js
```

---

## 📚 相关文档

- [NEW_FEATURES.md](NEW_FEATURES.md) - 所有功能说明
- [QUICK_START_NEW_FEATURES.md](QUICK_START_NEW_FEATURES.md) - 快速开始
- [BUG_FIX_SUMMARY.md](BUG_FIX_SUMMARY.md) - Bug 修复总结

---

## 🎉 总结

### ✅ 登入功能完全可用

- 完整的登入实现
- Session 自动管理
- 所有功能在登入后可用

### 🚀 立即开始

```bash
# 运行演示
node demo-login.js

# 或使用交互式工具
node quick-test.js
```

### 💪 登入后可以：

- ✅ 查询任何用户资料（包括 `@chenyucheng315`）
- ✅ 获取粉丝/关注列表
- ✅ 发送私讯
- ✅ 关注/取消关注
- ✅ 查看对话列表
- ✅ 使用所有高级功能

---

**现在就试试吧！** 🚀

```bash
node demo-login.js
```

