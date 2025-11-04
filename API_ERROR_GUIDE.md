# 🔧 API 错误解决指南

## ❌ 常见错误

### 1. Maximum number of redirects exceeded

**错误信息：**
```
连接 Instagram 服务器时发生错误
Maximum number of redirects exceeded
```

**原因：**
- Instagram 检测到异常请求
- 需要验证身份（Challenge）
- Session 已过期
- IP 被限制

**解决方案：**

#### 方案 1：使用浏览器重新登入

```bash
# 1. 先登入测试
node demo-login.js
```

按照提示登入后，Session 会被保存。

#### 方案 2：等待一段时间

Instagram 可能暂时限制了您的 IP：
- 等待 30-60 分钟
- 更换网络（如切换到手机热点）
- 使用代理

#### 方案 3：验证账号

1. 打开浏览器访问 https://www.instagram.com
2. 登入您的账号
3. 完成任何验证要求（Challenge）
4. 重新运行脚本

---

### 2. 401 Unauthorized

**原因：**
- 未登入
- Session 过期

**解决方案：**
```bash
node demo-login.js
```

重新登入即可。

---

### 3. 429 Too Many Requests

**原因：**
- 请求太频繁
- 触发速率限制

**解决方案：**
- 等待 30 分钟
- 增加请求间隔
- 减少请求数量

---

## 🚀 推荐使用方式

### 安全使用流程

```bash
# 1. 先测试编码
node test-encoding.js

# 2. 登入账号
node demo-login.js

# 3. 测试获取用户信息
node test-with-login.js

# 4. 开始群发
node demo-smart-batch-dm.js
```

---

## 💡 避免错误的建议

1. **合理的请求间隔**
   - 每条消息间隔 5-10 秒
   - 每天发送量控制在 50-100 条

2. **使用登入功能**
   - 先登入再使用其他功能
   - 定期检查登入状态

3. **避免频繁请求**
   - 不要短时间内大量请求
   - 使用延迟和限流

4. **测试账号**
   - 先用测试账号验证
   - 确认无误后再用主账号

---

## 🔍 诊断步骤

### 步骤 1：检查编码

```bash
node test-encoding.js
```

确保中文正常显示。

### 步骤 2：测试登入

```bash
node demo-login.js
```

如果登入成功，说明网络和账号正常。

### 步骤 3：测试获取信息

```bash
node test-with-login.js
```

测试是否能正常获取用户信息。

### 步骤 4：开始使用

如果上述测试都通过，可以开始使用群发功能。

---

## 📞 常见问题

### Q: 为什么会出现 "Maximum number of redirects" 错误？

A: 这通常是因为：
1. Instagram 需要您完成验证（Challenge）
2. 您的 Session 已过期
3. IP 被临时限制

**解决方法：**
- 在浏览器中登入 Instagram
- 完成任何验证要求
- 等待一段时间后重试

### Q: 如何避免被 Instagram 限制？

A: 
1. 使用合理的请求间隔（5-10 秒）
2. 每天发送量不要太大（50-100 条）
3. 不要使用多个账号同时发送
4. 模拟正常用户行为

### Q: Session 多久会过期？

A: 
- 通常 24-48 小时
- 建议每天重新登入一次
- 使用前先测试 Session 是否有效

---

## 🎯 最佳实践

### 1. 登入流程

```bash
# 每天第一次使用前
node demo-login.js
```

### 2. 发送流程

```bash
# 使用智能批量发送
node demo-smart-batch-dm.js

# 设置合理的间隔
# 在脚本中设置 delay: 5000-10000
```

### 3. 错误处理

- 遇到错误立即停止
- 检查错误类型
- 根据提示处理
- 等待后重试

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| **LOGIN_GUIDE.md** | 登入功能完整说明 |
| **SMART_BATCH_DM_GUIDE.md** | 智能批量发送指南 |
| **FIX_ENCODING.md** | 编码问题修复 |

---

**🎊 遇到错误不要慌，按照指南一步步解决！**

