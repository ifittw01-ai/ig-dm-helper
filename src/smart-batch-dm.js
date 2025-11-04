/**
 * 智能批量发送 DM
 * 包含错误检测、暂停恢复、跳过失败用户等功能
 */

const readline = require('readline');

class SmartBatchDM {
    constructor(igAPI) {
        this.igAPI = igAPI;
        this.queue = []; // 待发送队列
        this.failed = []; // 失败列表
        this.skipped = []; // 跳过列表
        this.success = []; // 成功列表
        this.paused = false;
        this.stopped = false;
        this.currentIndex = 0;
        
        // 错误类型
        this.ERROR_TYPES = {
            ACCOUNT_RESTRICTED: 'account_restricted', // 账号被限制
            SPAM_DETECTED: 'spam_detected', // 检测到垃圾信息
            RATE_LIMIT: 'rate_limit', // 速率限制
            USER_NOT_FOUND: 'user_not_found', // 用户不存在
            USER_BLOCKED: 'user_blocked', // 用户屏蔽了我们
            CHALLENGE_REQUIRED: 'challenge_required', // 需要验证
            LOGIN_REQUIRED: 'login_required', // 需要重新登入
            NETWORK_ERROR: 'network_error', // 网络错误
            UNKNOWN: 'unknown' // 未知错误
        };
    }

    /**
     * 检测错误类型
     */
    detectErrorType(error) {
        const errorMsg = error.message || error.error || error.toString();
        const errorLower = errorMsg.toLowerCase();

        // 账号被限制
        if (errorLower.includes('action blocked') || 
            errorLower.includes('spam') ||
            errorLower.includes('suspicious activity')) {
            return this.ERROR_TYPES.ACCOUNT_RESTRICTED;
        }

        // 需要验证
        if (errorLower.includes('challenge') || 
            errorLower.includes('checkpoint') ||
            errorLower.includes('verify') ||
            errorLower.includes('verification')) {
            return this.ERROR_TYPES.CHALLENGE_REQUIRED;
        }

        // 需要登入
        if (errorLower.includes('login') || 
            errorLower.includes('unauthorized') ||
            errorLower.includes('401')) {
            return this.ERROR_TYPES.LOGIN_REQUIRED;
        }

        // 速率限制
        if (errorLower.includes('rate limit') || 
            errorLower.includes('too many') ||
            errorLower.includes('429')) {
            return this.ERROR_TYPES.RATE_LIMIT;
        }

        // 用户不存在
        if (errorLower.includes('not found') || 
            errorLower.includes('404') ||
            errorLower.includes('user does not exist')) {
            return this.ERROR_TYPES.USER_NOT_FOUND;
        }

        // 用户屏蔽或不接受消息
        if (errorLower.includes('blocked') || 
            errorLower.includes('cannot send') ||
            errorLower.includes('not accepting messages') ||
            errorLower.includes('message not sent') ||
            errorLower.includes('cannot message this user')) {
            return this.ERROR_TYPES.USER_BLOCKED;
        }

        // 网络错误
        if (errorLower.includes('network') || 
            errorLower.includes('timeout') ||
            errorLower.includes('econnrefused')) {
            return this.ERROR_TYPES.NETWORK_ERROR;
        }

        return this.ERROR_TYPES.UNKNOWN;
    }

    /**
     * 判断错误是否需要暂停
     */
    shouldPause(errorType) {
        return [
            this.ERROR_TYPES.ACCOUNT_RESTRICTED,
            this.ERROR_TYPES.CHALLENGE_REQUIRED,
            this.ERROR_TYPES.LOGIN_REQUIRED,
            this.ERROR_TYPES.SPAM_DETECTED
        ].includes(errorType);
    }

    /**
     * 判断错误是否应该跳过用户
     */
    shouldSkip(errorType) {
        return [
            this.ERROR_TYPES.USER_NOT_FOUND,
            this.ERROR_TYPES.USER_BLOCKED
        ].includes(errorType);
    }

    /**
     * 获取错误的友好提示
     */
    getErrorMessage(errorType) {
        const messages = {
            [this.ERROR_TYPES.ACCOUNT_RESTRICTED]: {
                title: '⚠️  账号被限制',
                message: '您的账号因异常活动被 Instagram 暂时限制。',
                action: '请在浏览器中登入并完成验证，然后输入 "继续" 恢复发送。'
            },
            [this.ERROR_TYPES.CHALLENGE_REQUIRED]: {
                title: '🔐 需要验证',
                message: 'Instagram 要求验证您的身份。',
                action: '请打开浏览器完成验证，然后输入 "继续" 恢复发送。'
            },
            [this.ERROR_TYPES.LOGIN_REQUIRED]: {
                title: '🔑 需要重新登入',
                message: '您的登入已过期。',
                action: '请重新登入后输入 "继续" 恢复发送。'
            },
            [this.ERROR_TYPES.SPAM_DETECTED]: {
                title: '🚫 检测到垃圾信息',
                message: '您的消息被标记为垃圾信息。',
                action: '请检查消息内容，修改后输入 "继续" 恢复发送。'
            },
            [this.ERROR_TYPES.RATE_LIMIT]: {
                title: '⏱️  请求过于频繁',
                message: '您发送消息太快了。',
                action: '程序将自动等待 30 秒后继续...'
            },
            [this.ERROR_TYPES.USER_NOT_FOUND]: {
                title: 'ℹ️  用户不存在',
                message: '目标用户不存在或已删除账号。',
                action: '已自动跳过该用户。'
            },
            [this.ERROR_TYPES.USER_BLOCKED]: {
                title: '🚫 用户不接受消息',
                message: '该用户已屏蔽您、不接受消息、或消息设置不开放。',
                action: '已自动跳过该用户。\n💡 提示：发送前请在浏览器中检查用户主页是否有【訊息】按钮。'
            },
            [this.ERROR_TYPES.NETWORK_ERROR]: {
                title: '🌐 网络错误',
                message: '网络连接出现问题。',
                action: '程序将自动重试...'
            }
        };

        return messages[errorType] || {
            title: '❌ 未知错误',
            message: '发生了未知错误。',
            action: '请检查日志并决定是否继续。'
        };
    }

    /**
     * 显示错误并等待用户操作
     */
    async handleError(username, error, errorType) {
        const errorInfo = this.getErrorMessage(errorType);

        console.log('\n' + '═'.repeat(60));
        console.log(errorInfo.title);
        console.log('═'.repeat(60));
        console.log(`\n目标用户: @${username}`);
        console.log(`错误信息: ${error.message || error.error || error}`);
        console.log(`\n${errorInfo.message}`);
        console.log(`\n${errorInfo.action}\n`);
        console.log('═'.repeat(60) + '\n');

        // 判断处理方式
        if (this.shouldPause(errorType)) {
            // 需要暂停并等待用户操作
            return await this.waitForUserAction();
        } else if (this.shouldSkip(errorType)) {
            // 自动跳过
            this.skipped.push({ username, reason: errorType });
            console.log(`✓ 已跳过用户 @${username}\n`);
            return 'skip';
        } else if (errorType === this.ERROR_TYPES.RATE_LIMIT) {
            // 速率限制，等待后继续
            console.log('等待 30 秒...\n');
            await new Promise(resolve => setTimeout(resolve, 30000));
            return 'retry';
        } else if (errorType === this.ERROR_TYPES.NETWORK_ERROR) {
            // 网络错误，短暂等待后重试
            console.log('等待 5 秒后重试...\n');
            await new Promise(resolve => setTimeout(resolve, 5000));
            return 'retry';
        } else {
            // 未知错误，询问用户
            return await this.waitForUserAction();
        }
    }

    /**
     * 等待用户操作
     */
    async waitForUserAction() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('请选择操作：');
        console.log('  1. 继续 (c/continue) - 验证完成，继续发送');
        console.log('  2. 跳过 (s/skip) - 跳过当前用户，继续下一个');
        console.log('  3. 重试 (r/retry) - 重试当前用户');
        console.log('  4. 停止 (q/quit) - 停止所有发送\n');

        return new Promise(resolve => {
            rl.question('输入选择: ', (answer) => {
                rl.close();
                const cmd = answer.toLowerCase().trim();

                if (cmd === 'c' || cmd === 'continue' || cmd === '继续' || cmd === '1') {
                    console.log('\n✓ 继续发送...\n');
                    resolve('continue');
                } else if (cmd === 's' || cmd === 'skip' || cmd === '跳过' || cmd === '2') {
                    console.log('\n✓ 跳过当前用户...\n');
                    resolve('skip');
                } else if (cmd === 'r' || cmd === 'retry' || cmd === '重试' || cmd === '3') {
                    console.log('\n✓ 重试当前用户...\n');
                    resolve('retry');
                } else if (cmd === 'q' || cmd === 'quit' || cmd === '停止' || cmd === '4') {
                    console.log('\n✓ 停止发送...\n');
                    resolve('quit');
                } else {
                    console.log('\n⚠️  无效输入，默认继续...\n');
                    resolve('continue');
                }
            });
        });
    }

    /**
     * 在浏览器中打开用户的 Instagram 页面
     */
    async openUserInBrowser(username) {
        try {
            const { exec } = require('child_process');
            const url = `https://www.instagram.com/${username}/`;
            
            console.log(`🌐 正在浏览器中打开: ${url}`);
            
            // 根据操作系统打开浏览器
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
                    console.log(`⚠️  打开浏览器失败: ${error.message}`);
                }
            });
            
            // 等待一下让浏览器打开
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return true;
        } catch (error) {
            console.log(`⚠️  打开浏览器失败: ${error.message}`);
            return false;
        }
    }
    
    /**
     * 显示用户信息（终端）
     */
    async showUserProfile(username) {
        try {
            console.log('正在获取用户信息...');
            const userInfoResult = await this.igAPI.getUserInfo(username);
            
            if (!userInfoResult.success) {
                console.log(`⚠️  无法获取用户信息: ${userInfoResult.error}\n`);
                return false;
            }
            
            const user = userInfoResult.userInfo;
            
            console.log('\n' + '╔' + '═'.repeat(58) + '╗');
            console.log('║' + ' '.repeat(20) + '用户资料' + ' '.repeat(20) + '║');
            console.log('╚' + '═'.repeat(58) + '╝\n');
            
            console.log(`👤 用户名: @${user.username}`);
            if (user.fullName) {
                console.log(`📝 全名: ${user.fullName}`);
            }
            if (user.bio) {
                const bioLines = user.bio.split('\n');
                console.log(`💬 简介: ${bioLines[0]}`);
                if (bioLines.length > 1) {
                    bioLines.slice(1).forEach(line => {
                        console.log(`       ${line}`);
                    });
                }
            }
            console.log(`👥 粉丝: ${this.formatNumber(user.followerCount)}`);
            console.log(`➕ 关注: ${this.formatNumber(user.followingCount)}`);
            console.log(`📷 帖子: ${this.formatNumber(user.postCount)}`);
            console.log(`${user.isPrivate ? '🔒' : '🔓'} ${user.isPrivate ? '私密账号' : '公开账号'}`);
            if (user.isVerified) {
                console.log(`✅ 已验证`);
            }
            
            console.log('\n' + '─'.repeat(60) + '\n');
            
            return true;
        } catch (error) {
            console.log(`⚠️  无法获取用户信息: ${error.message}\n`);
            return false;
        }
    }
    
    /**
     * 格式化数字（添加千位分隔符）
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    /**
     * 询问是否发送给该用户
     */
    async askToSend(username) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('📌 重要提示：');
        console.log('   请在浏览器中查看该用户的主页面');
        console.log('   检查是否有【訊息】或【Message】按钮');
        console.log('');
        console.log('   ✅ 有訊息按钮 → 输入 y 发送');
        console.log('   ❌ 没有訊息按钮 → 输入 n 跳过');
        console.log('');

        return new Promise(resolve => {
            rl.question(`该用户是否可以接收消息？(y=可以/n=不可以/s=跳过/q=停止): `, (answer) => {
                rl.close();
                const cmd = answer.toLowerCase().trim();

                if (cmd === 'y' || cmd === 'yes' || cmd === '是' || cmd === '') {
                    console.log('\n✅ 该用户可以接收消息，准备发送...\n');
                    resolve('send');
                } else if (cmd === 'n' || cmd === 'no' || cmd === '否') {
                    console.log('\n❌ 该用户不接受消息，自动跳过...\n');
                    resolve('skip');
                } else if (cmd === 's' || cmd === 'skip' || cmd === '跳过') {
                    console.log('\n⏭️  跳过该用户...\n');
                    resolve('skip');
                } else if (cmd === 'q' || cmd === 'quit' || cmd === '停止') {
                    console.log('\n🛑 停止发送...\n');
                    resolve('quit');
                } else {
                    console.log('\n✅ 准备发送...\n');
                    resolve('send');
                }
            });
        });
    }

    /**
     * 发送消息给单个用户（带重试）
     */
    async sendToUser(username, message, maxRetries = 3, showProfile = true) {
        // 显示用户资料
        if (showProfile) {
            // 在浏览器中打开用户页面
            await this.openUserInBrowser(username);
            
            // 同时在终端显示资料
            await this.showUserProfile(username);
            
            // 询问是否发送
            const action = await this.askToSend(username);
            
            if (action === 'skip') {
                this.skipped.push({ username, reason: 'user_manually_skipped' });
                return { success: false, skipped: true, reason: 'manually_skipped' };
            } else if (action === 'quit') {
                this.stopped = true;
                return { success: false, stopped: true };
            }
        }
        
        let retries = 0;

        while (retries < maxRetries) {
            try {
                const result = await this.igAPI.sendDirectMessage(username, message);

                if (result.success) {
                    return { success: true };
                } else {
                    throw new Error(result.error || '发送失败');
                }
            } catch (error) {
                const errorType = this.detectErrorType(error);
                
                // 处理错误
                const action = await this.handleError(username, error, errorType);

                if (action === 'continue') {
                    // 用户已验证，继续尝试
                    retries = 0; // 重置重试次数
                    continue;
                } else if (action === 'skip') {
                    // 跳过该用户
                    return { success: false, skipped: true, reason: errorType };
                } else if (action === 'retry') {
                    // 重试
                    retries++;
                    if (retries < maxRetries) {
                        console.log(`重试 ${retries}/${maxRetries}...\n`);
                        await new Promise(resolve => setTimeout(resolve, 3000));
                    }
                    continue;
                } else if (action === 'quit') {
                    // 停止所有
                    this.stopped = true;
                    return { success: false, stopped: true };
                }

                // 达到最大重试次数
                if (retries >= maxRetries) {
                    this.failed.push({ 
                        username, 
                        error: error.message,
                        errorType 
                    });
                    return { success: false, failed: true };
                }
            }
        }
    }

    /**
     * 批量发送消息
     */
    async sendBatch(usernames, message, options = {}) {
        const {
            delay = 5000, // 每条消息之间的延迟（毫秒）
            onProgress = null, // 进度回调
            showProfile = true // 是否显示用户资料
        } = options;

        this.queue = [...usernames];
        this.currentIndex = 0;
        this.stopped = false;

        console.log('╔════════════════════════════════════════╗');
        console.log('║   智能批量发送 DM                      ║');
        console.log('╚════════════════════════════════════════╝\n');
        console.log(`目标用户数: ${usernames.length}`);
        console.log(`消息内容: ${message}`);
        console.log(`发送间隔: ${delay / 1000} 秒\n`);
        console.log('开始发送...\n');
        console.log('═'.repeat(60) + '\n');

        for (let i = 0; i < usernames.length; i++) {
            if (this.stopped) {
                console.log('已停止发送。\n');
                break;
            }

            const username = usernames[i];
            this.currentIndex = i;

            console.log(`[${i + 1}/${usernames.length}] 目标用户: @${username}\n`);

            const result = await this.sendToUser(username, message, 3, showProfile);

            if (result.success) {
                this.success.push(username);
                console.log(`✅ 成功发送给 @${username}\n`);
            } else if (result.skipped) {
                console.log(`⏭️  已跳过 @${username}\n`);
            } else if (result.stopped) {
                console.log(`⏹️  已停止\n`);
                break;
            } else {
                console.log(`❌ 发送失败: @${username}\n`);
            }

            // 进度回调
            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: usernames.length,
                    success: this.success.length,
                    failed: this.failed.length,
                    skipped: this.skipped.length
                });
            }

            // 延迟（最后一个不需要）
            if (i < usernames.length - 1 && !this.stopped) {
                console.log(`等待 ${delay / 1000} 秒...\n`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        // 显示最终报告
        this.showReport();

        return {
            total: usernames.length,
            success: this.success,
            failed: this.failed,
            skipped: this.skipped
        };
    }

    /**
     * 显示最终报告
     */
    showReport() {
        console.log('\n' + '═'.repeat(60));
        console.log('📊 发送报告');
        console.log('═'.repeat(60) + '\n');

        console.log(`总计: ${this.queue.length} 个用户`);
        console.log(`✅ 成功: ${this.success.length} 个`);
        console.log(`❌ 失败: ${this.failed.length} 个`);
        console.log(`⏭️  跳过: ${this.skipped.length} 个\n`);

        if (this.success.length > 0) {
            console.log('成功发送的用户:');
            this.success.forEach(username => {
                console.log(`  ✅ @${username}`);
            });
            console.log('');
        }

        if (this.skipped.length > 0) {
            console.log('跳过的用户:');
            this.skipped.forEach(({ username, reason }) => {
                console.log(`  ⏭️  @${username} (${reason})`);
            });
            console.log('');
        }

        if (this.failed.length > 0) {
            console.log('失败的用户:');
            this.failed.forEach(({ username, error, errorType }) => {
                console.log(`  ❌ @${username} - ${error} (${errorType})`);
            });
            console.log('');
        }

        console.log('═'.repeat(60) + '\n');
    }

    /**
     * 保存报告到文件
     */
    saveReport(filename = 'batch-dm-report.json') {
        const fs = require('fs');
        const report = {
            timestamp: new Date().toISOString(),
            total: this.queue.length,
            success: this.success,
            failed: this.failed,
            skipped: this.skipped
        };

        fs.writeFileSync(filename, JSON.stringify(report, null, 2));
        console.log(`✓ 报告已保存到: ${filename}\n`);
    }
}

module.exports = SmartBatchDM;

