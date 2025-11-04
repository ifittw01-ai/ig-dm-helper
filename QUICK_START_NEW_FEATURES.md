# 🚀 快速開始 - 新功能使用指南

## 5分鐘快速上手新功能

---

## 📦 準備工作

### 1. 確認環境

```bash
# 檢查 Node.js 版本（需要 >= 16）
node -v

# 確認項目依賴已安裝
npm list axios
```

### 2. 測試連接

```bash
# 運行測試腳本
node test-new-features.js
```

**⚠️ 注意：** 首次運行前，請編輯 `test-new-features.js` 填入您的測試帳號資訊。

---

## ✨ 新功能快速示例

### 功能 1：查看任意用戶的詳細資料

```javascript
const InstagramAPI = require('./src/instagram-api');
const igAPI = new InstagramAPI();

// 登入
await igAPI.login('your_username', 'your_password');

// 查看用戶資料
const result = await igAPI.getUserInfo('target_user');

console.log('粉絲數:', result.userInfo.followerCount);
console.log('關注數:', result.userInfo.followingCount);
console.log('個人簡介:', result.userInfo.bio);
```

**用途：**
- 驗證目標用戶
- 分析用戶影響力
- 篩選高質量目標

---

### 功能 2：抓取關注列表

```javascript
// 抓取前 50 個關注
const result = await igAPI.fetchFollowing('target_user', {
    start: 1,
    end: 50
});

console.log('關注列表:', result.following);
console.log('總數:', result.count);
```

**用途：**
- 分析用戶關注偏好
- 找出共同關注
- 競爭對手分析

---

### 功能 3：智能關注

```javascript
// 單個關注
await igAPI.followUser('username');

// 批量關注
const usernames = ['user1', 'user2', 'user3'];
const result = await igAPI.batchFollow(usernames);

console.log('成功:', result.successCount);
console.log('失敗:', result.failedCount);
```

**用途：**
- 自動關注潛在客戶
- 營銷活動
- 快速擴展粉絲

**⚠️ 限制：**
- 每天不超過 50-100 個
- 操作間隔 3-5 秒

---

### 功能 4：清理不互粉用戶

```javascript
// 獲取我的關注
const following = await igAPI.fetchFollowing('my_username');

// 獲取我的粉絲
const followers = await igAPI.fetchFollowers('my_username');

// 找出不互粉的
const followersSet = new Set(followers.followers);
const notFollowingBack = following.following.filter(
    user => !followersSet.has(user)
);

// 批量取消關注
await igAPI.batchUnfollow(notFollowingBack);
```

**用途：**
- 關注列表管理
- 提高互粉率
- 清理無效關注

---

### 功能 5：查看和管理私訊

```javascript
// 獲取對話列表
const inbox = await igAPI.getInbox(20);

// 查看未讀對話
inbox.threads.forEach(thread => {
    if (thread.unreadCount > 0) {
        console.log('未讀消息來自:', thread.users[0].username);
        console.log('內容:', thread.lastMessage.text);
    }
});

// 查看完整對話
const thread = await igAPI.getThread('thread_id');
thread.messages.forEach(msg => {
    console.log(msg.text);
});
```

**用途：**
- 客戶服務
- 對話管理
- 未讀消息處理

---

## 🎯 實戰案例

### 案例 1：找出並關注潛在客戶

**目標：** 關注競爭對手的活躍粉絲

```javascript
const InstagramAPI = require('./src/instagram-api');
const igAPI = new InstagramAPI();

async function findAndFollowPotentialCustomers() {
    // 1. 登入
    await igAPI.login('my_username', 'my_password');
    
    // 2. 獲取競爭對手的粉絲（前 100 個）
    console.log('正在獲取競爭對手的粉絲...');
    const followers = await igAPI.fetchFollowers('competitor', {
        start: 1,
        end: 100
    });
    
    // 3. 篩選活躍用戶
    console.log('正在篩選活躍用戶...');
    const activeUsers = [];
    
    for (const username of followers.followers) {
        const userInfo = await igAPI.getUserInfo(username);
        
        // 標準：粉絲數 100-10000（避免機器人和大V）
        if (userInfo.userInfo.followerCount > 100 && 
            userInfo.userInfo.followerCount < 10000 &&
            !userInfo.userInfo.isPrivate) {
            activeUsers.push(username);
        }
        
        // 延遲 1 秒
        await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log(`找到 ${activeUsers.length} 個潛在客戶`);
    
    // 4. 批量關注
    console.log('開始批量關注...');
    const result = await igAPI.batchFollow(activeUsers, 
        (current, total, status) => {
            console.log(status);
        }
    );
    
    console.log('\n完成！');
    console.log(`成功關注: ${result.successCount}`);
    console.log(`失敗: ${result.failedCount}`);
}

findAndFollowPotentialCustomers();
```

**預期結果：**
- 找出 20-50 個符合條件的用戶
- 自動關注這些用戶
- 總耗時約 5-10 分鐘

---

### 案例 2：自動清理不活躍關注

**目標：** 取消關注 30 天未互動的用戶

```javascript
async function cleanInactiveFollowing() {
    // 1. 登入
    await igAPI.login('my_username', 'my_password');
    
    // 2. 獲取我的關注列表
    const following = await igAPI.fetchFollowing('my_username');
    
    // 3. 獲取我的粉絲列表
    const followers = await igAPI.fetchFollowers('my_username');
    
    const followersSet = new Set(followers.followers);
    
    // 4. 找出不互粉的用戶
    const notFollowingBack = following.following.filter(
        user => !followersSet.has(user)
    );
    
    console.log(`發現 ${notFollowingBack.length} 個不互粉的用戶`);
    
    // 5. 進一步篩選：只取消關注粉絲數很少的（可能是殭屍帳號）
    const toUnfollow = [];
    
    for (const username of notFollowingBack) {
        const userInfo = await igAPI.getUserInfo(username);
        
        // 粉絲數 < 50 的，可能是不活躍帳號
        if (userInfo.userInfo.followerCount < 50) {
            toUnfollow.push(username);
        }
        
        await new Promise(r => setTimeout(r, 1000));
        
        // 限制最多取消 50 個
        if (toUnfollow.length >= 50) break;
    }
    
    console.log(`準備取消關注 ${toUnfollow.length} 個不活躍帳號`);
    
    // 6. 批量取消關注
    const result = await igAPI.batchUnfollow(toUnfollow,
        (current, total, status) => {
            console.log(status);
        }
    );
    
    console.log('\n完成！');
    console.log(`成功取消: ${result.successCount}`);
    console.log(`失敗: ${result.failedCount}`);
}

cleanInactiveFollowing();
```

---

### 案例 3：批量回覆未讀消息

**目標：** 自動回覆所有未讀私訊

```javascript
async function replyUnreadMessages() {
    // 1. 登入
    await igAPI.login('my_username', 'my_password');
    
    // 2. 獲取對話列表
    const inbox = await igAPI.getInbox(50);
    
    // 3. 篩選未讀對話
    const unreadThreads = inbox.threads.filter(t => t.unreadCount > 0);
    
    console.log(`發現 ${unreadThreads.length} 個未讀對話`);
    
    // 4. 自動回覆
    for (const thread of unreadThreads) {
        const username = thread.users[0].username;
        const lastMessage = thread.lastMessage.text;
        
        console.log(`\n回覆 @${username}`);
        console.log(`對方說: ${lastMessage}`);
        
        // 發送自動回覆
        const result = await igAPI.sendDirectMessage(
            username,
            '您好！感謝您的訊息，我們已經收到。我們會在 24 小時內回覆您。'
        );
        
        if (result.success) {
            console.log('✅ 回覆成功');
        } else {
            console.log('❌ 回覆失敗:', result.error);
        }
        
        // 延遲 5 秒避免限制
        await new Promise(r => setTimeout(r, 5000));
    }
    
    console.log('\n所有未讀消息已回覆完成！');
}

replyUnreadMessages();
```

---

## 📝 完整工作流程示例

### 完整的營銷自動化流程

```javascript
const InstagramAPI = require('./src/instagram-api');

async function fullMarketingWorkflow() {
    const igAPI = new InstagramAPI();
    
    // ========================
    // 第一步：初始化和登入
    // ========================
    console.log('🔐 登入中...');
    await igAPI.login('my_username', 'my_password');
    console.log('✅ 登入成功\n');
    
    // ========================
    // 第二步：找出目標用戶
    // ========================
    console.log('🔍 尋找目標用戶...');
    
    // 從競爭對手的粉絲中找
    const competitors = ['competitor1', 'competitor2'];
    const potentialUsers = [];
    
    for (const competitor of competitors) {
        console.log(`分析 @${competitor} 的粉絲...`);
        
        const followers = await igAPI.fetchFollowers(competitor, {
            start: 1,
            end: 50
        });
        
        for (const username of followers.followers) {
            const userInfo = await igAPI.getUserInfo(username);
            
            // 篩選條件：
            // - 粉絲數 100-5000
            // - 公開帳號
            // - 未驗證（避免大V）
            if (userInfo.userInfo.followerCount >= 100 &&
                userInfo.userInfo.followerCount <= 5000 &&
                !userInfo.userInfo.isPrivate &&
                !userInfo.userInfo.isVerified) {
                potentialUsers.push(username);
            }
            
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    
    console.log(`✅ 找到 ${potentialUsers.length} 個潛在用戶\n`);
    
    // ========================
    // 第三步：批量關注
    // ========================
    console.log('👥 開始批量關注...');
    
    // 限制每次最多 30 個
    const usersToFollow = potentialUsers.slice(0, 30);
    
    const followResult = await igAPI.batchFollow(usersToFollow,
        (current, total, status) => {
            console.log(status);
        }
    );
    
    console.log(`✅ 關注完成: 成功 ${followResult.successCount}, 失敗 ${followResult.failedCount}\n`);
    
    // ========================
    // 第四步：發送歡迎私訊
    // ========================
    console.log('💬 發送歡迎訊息...');
    
    const welcomeMessage = `嗨！我剛關注了你，對你的內容很感興趣。
希望我們可以互相交流！😊`;
    
    let sentCount = 0;
    
    for (const username of usersToFollow.slice(0, 10)) { // 限制 10 個
        const result = await igAPI.sendDirectMessage(username, welcomeMessage);
        
        if (result.success) {
            console.log(`✅ 已發送給 @${username}`);
            sentCount++;
        }
        
        // 延遲 60 秒
        await new Promise(r => setTimeout(r, 60000));
    }
    
    console.log(`✅ 發送完成: ${sentCount} 條訊息\n`);
    
    // ========================
    // 第五步：總結報告
    // ========================
    console.log('═══════════════════════════════');
    console.log('📊 營銷活動總結');
    console.log('═══════════════════════════════');
    console.log(`🔍 分析了 ${competitors.length} 個競爭對手`);
    console.log(`👥 找到 ${potentialUsers.length} 個潛在用戶`);
    console.log(`✅ 成功關注 ${followResult.successCount} 個用戶`);
    console.log(`💬 發送了 ${sentCount} 條歡迎訊息`);
    console.log('═══════════════════════════════\n');
    
    console.log('🎉 營銷自動化流程完成！');
}

// 執行完整流程
fullMarketingWorkflow().catch(console.error);
```

---

## ⚙️ 進階配置

### 自定義延遲時間

```javascript
// 在 instagram-api.js 中修改
class InstagramAPI {
    async batchFollow(usernames, onProgress = null) {
        // 修改這裡的延遲時間
        const minDelay = 3000;  // 最小 3 秒
        const maxDelay = 5000;  // 最大 5 秒
        
        for (let i = 0; i < usernames.length; i++) {
            // ... 操作 ...
            
            if (i < usernames.length - 1) {
                const delay = minDelay + Math.random() * (maxDelay - minDelay);
                await this.sleep(delay);
            }
        }
    }
}
```

### 添加錯誤重試機制

```javascript
async function retryOperation(operation, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await operation();
            if (result.success) {
                return result;
            }
        } catch (error) {
            console.log(`重試 ${i + 1}/${maxRetries}...`);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
    
    return { success: false, error: '超過最大重試次數' };
}

// 使用
const result = await retryOperation(() => 
    igAPI.followUser('username')
);
```

---

## 🔍 調試技巧

### 開啟詳細日誌

在 `instagram-api.js` 中添加日誌：

```javascript
async followUser(username) {
    console.log(`[DEBUG] 準備關注 @${username}`);
    
    const userId = await this.getUserId(username);
    console.log(`[DEBUG] 獲取到用戶ID: ${userId}`);
    
    const response = await this.client.post(...);
    console.log(`[DEBUG] API 響應:`, response.data);
    
    // ...
}
```

### 錯誤處理

```javascript
try {
    const result = await igAPI.followUser('username');
    
    if (!result.success) {
        console.error('操作失敗:', result.error);
        
        // 根據錯誤類型處理
        if (result.error.includes('rate limit')) {
            console.log('觸發速率限制，等待 1 小時...');
            await new Promise(r => setTimeout(r, 3600000));
        }
    }
} catch (error) {
    console.error('未預期的錯誤:', error);
}
```

---

## 📞 獲取幫助

### 常見問題

**Q: 操作頻率應該是多少？**
A: 建議每次操作間隔 3-5 秒，每天不超過 50-100 次。

**Q: 如何避免被限制？**
A: 1) 控制頻率 2) 添加隨機延遲 3) 避免深夜操作 4) 使用多個帳號輪流

**Q: 新功能在 UI 中如何使用？**
A: UI 集成正在開發中，目前請使用代碼方式調用。

### 相關文檔

- [完整功能說明](NEW_FEATURES.md)
- [APK 分析指南](APK_ANALYSIS_GUIDE.md)
- [故障排除](TROUBLESHOOTING.md)

---

## 🎉 開始使用

現在您已經了解如何使用所有新功能，開始您的 Instagram 自動化之旅吧！

**記住：**
- ⚠️ 使用測試帳號進行測試
- ⚠️ 遵守 Instagram 使用限制
- ⚠️ 不要發送垃圾訊息
- ⚠️ 尊重他人隱私

**祝您使用愉快！** 🚀

