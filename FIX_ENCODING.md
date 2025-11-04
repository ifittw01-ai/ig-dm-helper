# 🔧 修复 Windows 终端中文乱码问题

## ❌ 问题描述

在 Windows PowerShell 或 CMD 中运行脚本时，中文字符显示为乱码：

```
?豢?摨恍???
?? ???活?賊?憭??航??嚗?
```

这是因为 Windows 终端默认使用的编码不是 UTF-8。

---

## ✅ 解决方案

### 方案 1：使用修复后的脚本（推荐）✨

脚本已经自动修复了编码问题！直接运行即可：

```bash
# 这些脚本已经内置编码修复
node demo-smart-batch-dm.js
node demo-browser-profile.js
node test-smart-batch.js
```

**无需任何额外操作！** 🎉

---

### 方案 2：手动设置终端编码

如果仍然有乱码，可以在运行前执行：

#### PowerShell
```powershell
chcp 65001
node demo-smart-batch-dm.js
```

#### CMD
```cmd
chcp 65001
node demo-smart-batch-dm.js
```

---

### 方案 3：使用批处理文件

我已经创建了 `fix-encoding.bat`，可以这样使用：

```cmd
fix-encoding demo-smart-batch-dm.js
```

---

### 方案 4：永久设置 PowerShell 编码

在 PowerShell 配置文件中添加：

1. 打开配置文件：
```powershell
notepad $PROFILE
```

2. 添加以下内容：
```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001
```

3. 保存并重启 PowerShell

---

## 🔍 如何验证编码已修复

运行脚本后，您应该看到：

```
╔════════════════════════════════════════╗
║   智能批量发送 DM 演示                 ║
╚════════════════════════════════════════╝

📝 步骤 1: 登入 Instagram

请输入您的 Instagram 用户名: 
```

而不是：

```
?豢?摨恍???
?? ???活?賊?
```

---

## 💡 为什么会有乱码？

| 问题 | 原因 |
|------|------|
| Windows 默认编码 | 使用 GBK (代码页 936) |
| Node.js 输出 | 使用 UTF-8 |
| 结果 | 编码不匹配导致乱码 |

**解决方法：** 将终端切换到 UTF-8 (代码页 65001)

---

## 🎯 推荐使用方式

### ✅ 最简单（已修复）

```bash
node demo-smart-batch-dm.js
```

脚本会自动设置正确的编码！

### ✅ 使用批处理文件

```cmd
fix-encoding demo-smart-batch-dm.js
```

### ✅ 永久修复

在 PowerShell 配置文件中设置编码（见方案 4）

---

## 🔧 技术细节

### 脚本中的修复代码

```javascript
// 在脚本开头添加
if (process.platform === 'win32') {
    require('child_process').execSync('chcp 65001', { stdio: 'ignore' });
}
```

这段代码会：
1. 检测是否为 Windows 系统
2. 自动执行 `chcp 65001` 切换编码
3. 静默执行，不显示额外输出

### fix-encoding.bat 内容

```batch
@echo off
chcp 65001 > nul
node %*
```

---

## 📚 其他终端选项

如果您不想使用 PowerShell，可以尝试：

### 1. Windows Terminal（推荐）

- 现代化的终端
- 默认支持 UTF-8
- 更好的中文显示

下载：[Windows Terminal](https://aka.ms/terminal)

### 2. Git Bash

- 原生支持 UTF-8
- 更好的兼容性

### 3. VS Code 集成终端

- 默认支持 UTF-8
- 无需额外设置

---

## ✅ 已修复的脚本

以下脚本已经内置编码修复：

| 脚本 | 状态 |
|------|------|
| `demo-smart-batch-dm.js` | ✅ 已修复 |
| `demo-browser-profile.js` | ✅ 已修复 |
| `test-smart-batch.js` | ✅ 已修复 |
| 其他演示脚本 | ⚠️  需要时手动设置 |

---

## 🎉 总结

### 最简单的方法

**直接运行，无需任何额外操作：**

```bash
node demo-smart-batch-dm.js
```

脚本会自动修复编码问题！

### 如果仍有问题

1. 尝试手动执行 `chcp 65001`
2. 使用 `fix-encoding.bat`
3. 切换到 Windows Terminal
4. 在 VS Code 中运行

---

**🎊 编码问题已修复，现在可以正常显示中文了！**

