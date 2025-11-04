/**
 * 快速测试新功能
 * 这个脚本会测试所有新增的 API 功能
 */

const InstagramAPI = require('./src/instagram-api');
const readline = require('readline');

// 创建命令行界面
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 问题函数
function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

// 主菜单
async function showMenu() {
    console.clear();
    console.log('╔════════════════════════════════════════╗');
    console.log('║   Instagram 新功能快速测试             ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    console.log('请选择要测试的功能：\n');
    
    console.log('  1. 🔐 登入测试');
    console.log('  2. 🔍 获取用户详细资料');
    console.log('  3. 👥 获取粉丝列表（范围抓取）');
    console.log('  4. 👤 获取关注列表（范围抓取）');
    console.log('  5. ➕ 关注用户');
    console.log('  6. ➖ 取消关注用户');
    console.log('  7. 📦 批量关注用户');
    console.log('  8. 📦 批量取消关注用户');
    console.log('  9. 💬 查看私讯对话列表');
    console.log(' 10. 💬 查看对话详情');
    console.log(' 11. 📤 发送私讯');
    console.log('  0. ❌ 退出\n');
    
    const choice = await question('请输入选项 (0-11): ');
    return choice.trim();
}

// 测试用例
const igAPI = new InstagramAPI();
let isLoggedIn = false;

// 1. 登入测试
async function testLogin() {
    console.log('\n📝 登入测试');
    console.log('─────────────────────────────────────\n');
    
    const username = await question('Instagram 帐号: ');
    const password = await question('密码: ');
    
    console.log('\n正在登入...');
    const result = await igAPI.login(username, password);
    
    if (result.success) {
        console.log('\n✅ 登入成功！');
        console.log(`   用户: ${result.username}`);
        console.log(`   用户ID: ${result.userId}`);
        isLoggedIn = true;
    } else {
        console.log('\n❌ 登入失败:', result.error);
    }
    
    await question('\n按 Enter 继续...');
}

// 2. 获取用户资料
async function testGetUserInfo() {
    console.log('\n📝 获取用户详细资料');
    console.log('─────────────────────────────────────\n');
    
    const username = await question('要查询的用户名: ');
    
    console.log('\n正在获取资料...');
    const result = await igAPI.getUserInfo(username);
    
    if (result.success) {
        console.log('\n✅ 成功获取用户资料：');
        console.log(`   用户名: @${result.userInfo.username}`);
        console.log(`   全名: ${result.userInfo.fullName}`);
        console.log(`   简介: ${result.userInfo.bio}`);
        console.log(`   粉丝数: ${result.userInfo.followerCount.toLocaleString()}`);
        console.log(`   关注数: ${result.userInfo.followingCount.toLocaleString()}`);
        console.log(`   贴文数: ${result.userInfo.postCount.toLocaleString()}`);
        console.log(`   私密帐号: ${result.userInfo.isPrivate ? '是' : '否'}`);
        console.log(`   已验证: ${result.userInfo.isVerified ? '是' : '否'}`);
    } else {
        console.log('\n❌ 获取失败:', result.error);
    }
    
    await question('\n按 Enter 继续...');
}

// 3. 获取粉丝列表
async function testGetFollowers() {
    console.log('\n📝 获取粉丝列表（范围抓取）');
    console.log('─────────────────────────────────────\n');
    
    const username = await question('要查询的用户名: ');
    const start = parseInt(await question('从第几个开始 (默认 1): ') || '1');
    const end = parseInt(await question('到第几个结束 (0 = 全部): ') || '10');
    
    console.log('\n正在抓取粉丝...');
    
    const result = await igAPI.fetchFollowers(username, {
        start: start,
        end: end,
        onProgress: (current, total, status) => {
            process.stdout.write(`\r${status}`);
        }
    });
    
    if (result.success) {
        console.log('\n\n✅ 成功获取粉丝列表：');
        console.log(`   总共扫描: ${result.totalScanned} 个`);
        console.log(`   符合条件: ${result.count} 个`);
        console.log(`   范围: 第 ${result.range.start} - ${result.range.end} 个`);
        console.log(`\n   前 10 个粉丝: ${result.followers.slice(0, 10).join(', ')}`);
    } else {
        console.log('\n\n❌ 获取失败:', result.error);
    }
    
    await question('\n按 Enter 继续...');
}

// 4. 获取关注列表
async function testGetFollowing() {
    console.log('\n📝 获取关注列表（范围抓取）');
    console.log('─────────────────────────────────────\n');
    
    const username = await question('要查询的用户名: ');
    const start = parseInt(await question('从第几个开始 (默认 1): ') || '1');
    const end = parseInt(await question('到第几个结束 (0 = 全部): ') || '10');
    
    console.log('\n正在抓取关注列表...');
    
    const result = await igAPI.fetchFollowing(username, {
        start: start,
        end: end,
        onProgress: (current, total, status) => {
            process.stdout.write(`\r${status}`);
        }
    });
    
    if (result.success) {
        console.log('\n\n✅ 成功获取关注列表：');
        console.log(`   总共扫描: ${result.totalScanned} 个`);
        console.log(`   符合条件: ${result.count} 个`);
        console.log(`   范围: 第 ${result.range.start} - ${result.range.end} 个`);
        console.log(`\n   前 10 个关注: ${result.following.slice(0, 10).join(', ')}`);
    } else {
        console.log('\n\n❌ 获取失败:', result.error);
    }
    
    await question('\n按 Enter 继续...');
}

// 5. 关注用户
async function testFollow() {
    console.log('\n📝 关注用户');
    console.log('─────────────────────────────────────\n');
    console.log('⚠️  警告: 请谨慎使用，避免触发限制！\n');
    
    const username = await question('要关注的用户名: ');
    const confirm = await question(`确定要关注 @${username} 吗? (y/n): `);
    
    if (confirm.toLowerCase() !== 'y') {
        console.log('\n已取消');
        await question('\n按 Enter 继续...');
        return;
    }
    
    console.log('\n正在关注...');
    const result = await igAPI.followUser(username);
    
    if (result.success) {
        console.log(`\n✅ 成功关注 @${result.username}`);
    } else {
        console.log('\n❌ 关注失败:', result.error);
    }
    
    await question('\n按 Enter 继续...');
}

// 6. 取消关注用户
async function testUnfollow() {
    console.log('\n📝 取消关注用户');
    console.log('─────────────────────────────────────\n');
    
    const username = await question('要取消关注的用户名: ');
    const confirm = await question(`确定要取消关注 @${username} 吗? (y/n): `);
    
    if (confirm.toLowerCase() !== 'y') {
        console.log('\n已取消');
        await question('\n按 Enter 继续...');
        return;
    }
    
    console.log('\n正在取消关注...');
    const result = await igAPI.unfollowUser(username);
    
    if (result.success) {
        console.log(`\n✅ 成功取消关注 @${result.username}`);
    } else {
        console.log('\n❌ 取消关注失败:', result.error);
    }
    
    await question('\n按 Enter 继续...');
}

// 9. 查看对话列表
async function testGetInbox() {
    console.log('\n📝 查看私讯对话列表');
    console.log('─────────────────────────────────────\n');
    
    const limit = parseInt(await question('获取多少个对话 (默认 10): ') || '10');
    
    console.log('\n正在获取对话列表...');
    const result = await igAPI.getInbox(limit);
    
    if (result.success) {
        console.log(`\n✅ 成功获取 ${result.count} 个对话：\n`);
        
        result.threads.forEach((thread, index) => {
            const usernames = thread.users.map(u => `@${u.username}`).join(', ');
            const lastMsg = thread.lastMessage ? thread.lastMessage.text.substring(0, 30) : '无消息';
            const unread = thread.unreadCount > 0 ? ` (${thread.unreadCount} 未读)` : '';
            
            console.log(`   ${index + 1}. ${usernames}${unread}`);
            console.log(`      最后消息: ${lastMsg}...`);
        });
    } else {
        console.log('\n❌ 获取失败:', result.error);
    }
    
    await question('\n按 Enter 继续...');
}

// 11. 发送私讯
async function testSendDM() {
    console.log('\n📝 发送私讯');
    console.log('─────────────────────────────────────\n');
    console.log('⚠️  警告: 请谨慎使用，避免发送垃圾讯息！\n');
    
    const username = await question('要发送给谁: ');
    const message = await question('讯息内容: ');
    
    const confirm = await question(`\n确定要发送给 @${username} 吗? (y/n): `);
    
    if (confirm.toLowerCase() !== 'y') {
        console.log('\n已取消');
        await question('\n按 Enter 继续...');
        return;
    }
    
    console.log('\n正在发送...');
    const result = await igAPI.sendDirectMessage(username, message);
    
    if (result.success) {
        console.log(`\n✅ 成功发送私讯给 @${result.username}`);
    } else {
        console.log('\n❌ 发送失败:', result.error);
    }
    
    await question('\n按 Enter 继续...');
}

// 主程序
async function main() {
    console.log('欢迎使用 Instagram 新功能测试工具！\n');
    
    while (true) {
        const choice = await showMenu();
        
        if (choice === '0') {
            console.log('\n再见！👋\n');
            rl.close();
            process.exit(0);
        }
        
        // 检查是否需要登入
        if (choice !== '1' && choice !== '2' && !isLoggedIn) {
            console.log('\n⚠️  请先登入！\n');
            await question('按 Enter 继续...');
            continue;
        }
        
        try {
            switch (choice) {
                case '1':
                    await testLogin();
                    break;
                case '2':
                    await testGetUserInfo();
                    break;
                case '3':
                    await testGetFollowers();
                    break;
                case '4':
                    await testGetFollowing();
                    break;
                case '5':
                    await testFollow();
                    break;
                case '6':
                    await testUnfollow();
                    break;
                case '7':
                    console.log('\n⚠️  批量关注功能风险较高，已禁用测试');
                    console.log('   如需使用，请参考 test-new-features.js');
                    await question('\n按 Enter 继续...');
                    break;
                case '8':
                    console.log('\n⚠️  批量取消关注功能风险较高，已禁用测试');
                    console.log('   如需使用，请参考 test-new-features.js');
                    await question('\n按 Enter 继续...');
                    break;
                case '9':
                    await testGetInbox();
                    break;
                case '10':
                    console.log('\n⚠️  此功能需要 thread ID');
                    console.log('   请先使用选项 9 查看对话列表');
                    await question('\n按 Enter 继续...');
                    break;
                case '11':
                    await testSendDM();
                    break;
                default:
                    console.log('\n无效的选项！');
                    await question('\n按 Enter 继续...');
            }
        } catch (error) {
            console.log('\n❌ 错误:', error.message);
            await question('\n按 Enter 继续...');
        }
    }
}

// 运行
main().catch(error => {
    console.error('程序错误:', error);
    rl.close();
    process.exit(1);
});

