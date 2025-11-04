/**
 * 批量打开 Instagram 用户链接
 * 一个一个在浏览器中打开 IG 用户主页
 */

// 修复 Windows 终端中文显示问题
if (process.platform === 'win32') {
    require('child_process').execSync('chcp 65001', { stdio: 'ignore' });
}

const { exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

/**
 * 在浏览器中打开 URL
 */
function openInBrowser(url) {
    return new Promise((resolve, reject) => {
        const platform = process.platform;
        let command;
        
        if (platform === 'win32') {
            command = `start ${url}`;
        } else if (platform === 'darwin') {
            command = `open ${url}`;
        } else {
            command = `xdg-open ${url}`;
        }
        
        exec(command, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

/**
 * 从 URL 或用户名提取用户名
 */
function extractUsername(input) {
    input = input.trim();
    
    // 如果是完整 URL
    if (input.startsWith('http')) {
        const match = input.match(/instagram\.com\/([^\/\?]+)/);
        if (match) {
            return match[1];
        }
    }
    
    // 移除 @ 符号
    return input.replace('@', '');
}

/**
 * 构建 Instagram URL
 */
function buildInstagramUrl(username) {
    return `https://www.instagram.com/${username}/`;
}

async function main() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   批量打开 Instagram 用户链接          ║');
    console.log('╚════════════════════════════════════════╝\n');

    console.log('📝 请输入 Instagram 用户链接或用户名');
    console.log('   每行一个，输入空行结束\n');
    console.log('支持的格式：');
    console.log('  - https://www.instagram.com/username/');
    console.log('  - instagram.com/username');
    console.log('  - username');
    console.log('  - @username\n');
    console.log('示例：');
    console.log('  https://www.instagram.com/shirley.soares.524/');
    console.log('  bbo_musae.duck');
    console.log('  @instagram\n');
    console.log('─'.repeat(60) + '\n');

    const links = [];
    let index = 1;

    while (true) {
        const input = await question(`用户 ${index}: `);
        
        if (!input.trim()) {
            break;
        }
        
        const username = extractUsername(input);
        if (username) {
            links.push(username);
            index++;
        }
    }

    if (links.length === 0) {
        console.log('\n⚠️  没有输入任何链接。\n');
        rl.close();
        return;
    }

    console.log(`\n✓ 已添加 ${links.length} 个用户\n`);
    console.log('─'.repeat(60) + '\n');

    // 询问延迟时间
    const delayInput = await question('每个链接之间的延迟（秒，默认 2）: ');
    const delay = parseInt(delayInput) || 2;
    
    console.log(`\n✓ 延迟设置为 ${delay} 秒\n`);
    console.log('─'.repeat(60) + '\n');

    // 确认
    console.log('📋 准备打开以下链接：\n');
    links.forEach((username, i) => {
        console.log(`  ${i + 1}. https://www.instagram.com/${username}/`);
    });
    console.log('');

    const confirm = await question('确认开始？(y/n): ');
    
    if (confirm.toLowerCase() !== 'y' && confirm !== '是') {
        console.log('\n✓ 已取消\n');
        rl.close();
        return;
    }

    console.log('\n');
    rl.close();

    // 开始打开链接
    console.log('🌐 开始在浏览器中打开链接...\n');
    console.log('═'.repeat(60) + '\n');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < links.length; i++) {
        const username = links[i];
        const url = buildInstagramUrl(username);

        console.log(`[${i + 1}/${links.length}] 打开: @${username}`);
        console.log(`           ${url}`);

        try {
            await openInBrowser(url);
            successCount++;
            console.log(`           ✅ 已在浏览器中打开\n`);
            
            // 等待延迟（最后一个不需要）
            if (i < links.length - 1) {
                console.log(`           ⏱️  等待 ${delay} 秒...\n`);
                await new Promise(resolve => setTimeout(resolve, delay * 1000));
            }
        } catch (error) {
            failCount++;
            console.log(`           ❌ 打开失败: ${error.message}\n`);
        }
    }

    // 显示结果
    console.log('═'.repeat(60) + '\n');
    console.log('📊 完成报告\n');
    console.log(`总计: ${links.length} 个链接`);
    console.log(`✅ 成功: ${successCount} 个`);
    console.log(`❌ 失败: ${failCount} 个\n`);
    console.log('═'.repeat(60) + '\n');
    console.log('🎉 完成！\n');
}

// 运行
main().catch(error => {
    console.error('\n❌ 错误:', error.message);
    rl.close();
    process.exit(1);
});

