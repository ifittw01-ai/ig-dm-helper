const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('./src/database');
const LicenseManager = require('./src/license');
const InstagramAPI = require('./src/instagram-api');

// 初始化 @electron/remote 模組
const remoteMain = require('@electron/remote/main');
remoteMain.initialize();

// 修復 GPU 錯誤 - 禁用硬件加速
app.disableHardwareAcceleration();

// 添加更全面的 GPU 相關命令行開關以提高穩定性
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('use-angle', 'default');

let mainWindow;
let igAPI;
let db;
let licenseManager;
let isRunning = false;
let isPaused = false;

// 創建主窗口
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        icon: path.join(__dirname, 'assets/icon.png')
    });

    // 啟用 @electron/remote 模組
    remoteMain.enable(mainWindow.webContents);

    mainWindow.loadFile('index.html');
    
    // 開發模式下打開開發者工具
    // mainWindow.webContents.openDevTools();
}

// 初始化數據庫
async function initDatabase() {
    db = new Database();
    await db.init();
}

// 初始化授權系統
async function initLicense() {
    licenseManager = new LicenseManager();
    const isValid = await licenseManager.validateLicense();
    
    if (!isValid) {
        const { response } = await dialog.showMessageBox(mainWindow, {
            type: 'warning',
            buttons: ['輸入序號', '試用模式', '退出'],
            title: '授權驗證',
            message: '尚未授權或授權已過期',
            detail: '請輸入有效的授權序號，或選擇試用模式（限制功能）'
        });
        
        if (response === 0) {
            // 輸入序號
            return await promptForLicense();
        } else if (response === 1) {
            // 試用模式
            return true;
        } else {
            // 退出
            app.quit();
            return false;
        }
    }
    
    return true;
}

// 提示輸入序號
async function promptForLicense() {
    // 這裡應該打開一個輸入對話框，簡化起見用 dialog
    return true;
}

// 初始化 Instagram API
async function initInstagram() {
    try {
        // 創建 Instagram API 實例
        igAPI = new InstagramAPI();
        
        // 初始化 API（獲取基本 Cookie）
        const result = await igAPI.initialize();
        
        if (!result.success) {
            return { success: false, error: result.error };
        }

        // 嘗試載入已保存的 Session
        const savedCookies = await db.getCookies();
        if (savedCookies && savedCookies.length > 0) {
            // 將數組格式的 cookies 轉換為對象
            const cookiesObj = {};
            savedCookies.forEach(cookie => {
                cookiesObj[cookie.name] = cookie.value;
            });
            
            // 構建完整的 session 數據（包含用戶信息）
            const sessionData = {
                cookies: cookiesObj
                // userId 和 username 將在第一次 API 調用時自動填充
            };
            
            igAPI.loadSession(sessionData);
            
            // 檢查 Session 是否有效
            const isValid = await igAPI.checkLoginStatus();
            if (isValid) {
                return { 
                    success: true, 
                    message: '已載入先前的登入狀態',
                    autoLogin: true 
                };
            }
        }
        
        return { 
            success: true, 
            message: 'Instagram API 初始化成功，請登入',
            requireLogin: true
        };
    } catch (error) {
        console.error('初始化 Instagram 失敗:', error);
        return { success: false, error: error.message };
    }
}

// 登入 Instagram
async function loginInstagram(username, password) {
    try {
        if (!igAPI) {
            await initInstagram();
        }

        const result = await igAPI.login(username, password);
        
        if (result.success) {
            // 保存 Session
            await saveSession();
        }
        
        return result;
    } catch (error) {
        console.error('登入失敗:', error);
        return { success: false, error: error.message };
    }
}

// 保存 Session
async function saveSession() {
    if (igAPI) {
        const sessionData = igAPI.getSessionData();
        // 將 cookies 對象轉換為數組格式以存入數據庫
        const cookiesArray = Object.entries(sessionData.cookies).map(([name, value]) => ({
            name,
            value,
            domain: '.instagram.com'
        }));
        await db.saveCookies(cookiesArray);
    }
}

// 發送私訊
async function sendDirectMessage(username, message) {
    try {
        if (!igAPI) {
            throw new Error('Instagram API 未初始化');
        }

        const result = await igAPI.sendDirectMessage(username, message);
        
        // 保存 Session（更新 Cookie）
        await saveSession();
        
        return result;
    } catch (error) {
        console.error(`發送訊息給 @${username} 失敗:`, error);
        return { success: false, username, error: error.message };
    }
}

// 抓取粉絲列表
async function fetchFollowers(username, options = {}) {
    try {
        if (!igAPI) {
            throw new Error('Instagram API 未初始化');
        }

        // 設置進度回調
        options.onProgress = (count, total, status) => {
            // 實時更新進度
            mainWindow.webContents.send('followers-progress', {
                current: count,
                total: total,
                status: status
            });
        };

        // 傳入選項抓取
        const result = await igAPI.fetchFollowers(username, options);
        
        return result;
    } catch (error) {
        console.error('抓取粉絲失敗:', error);
        return { success: false, error: error.message };
    }
}

// 輔助函數：延遲
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 隨機延遲（30-60秒，避免被偵測）
function randomDelay() {
    return 30000 + Math.random() * 30000;
}

// IPC 處理程序

// 初始化 Instagram
ipcMain.handle('init-instagram', async () => {
    return await initInstagram();
});

// 登入 Instagram
ipcMain.handle('login-instagram', async (event, { username, password }) => {
    return await loginInstagram(username, password);
});

// 別名：initialize（用於對話框登入）
ipcMain.handle('initialize', async () => {
    return await initInstagram();
});

// 別名：login（用於對話框登入）
ipcMain.handle('login', async (event, { username, password }) => {
    return await loginInstagram(username, password);
});

// 發送私訊
ipcMain.handle('send-dm', async (event, { username, message }) => {
    return await sendDirectMessage(username, message);
});

// 檢查登入狀態
ipcMain.handle('check-login-status', async (event) => {
    try {
        if (!igAPI) {
            return { loggedIn: false, message: '尚未初始化' };
        }
        
        const isLoggedIn = await igAPI.checkLoginStatus();
        return { 
            loggedIn: isLoggedIn,
            message: isLoggedIn ? '已登入' : '未登入或 Session 已過期'
        };
    } catch (error) {
        console.error('檢查登入狀態失敗:', error);
        return { loggedIn: false, message: error.message };
    }
});

// 清理所有登入數據並強制登出
ipcMain.handle('clean-and-logout', async (event) => {
    try {
        console.log('🧹 開始清理登入數據...');
        
        // 1. 清理 InstagramAPI（直接設為 null，之後重新創建）
        if (igAPI) {
            try {
                igAPI = null;
                console.log('✓ Instagram API 已清空');
            } catch (error) {
                console.error('清空 API 失敗:', error.message);
            }
        }
        
        // 2. 刪除本地數據文件
        const filesToDelete = [
            'cookies.json',
            'session.json',
            'ig-dm.db'
        ];
        
        let deletedCount = 0;
        for (const file of filesToDelete) {
            const filePath = path.join(__dirname, file);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`✓ 已刪除 ${file}`);
                    deletedCount++;
                } else {
                    console.log(`  ${file} 不存在`);
                }
            } catch (error) {
                console.error(`刪除 ${file} 失敗:`, error.message);
            }
        }
        
        // 3. 重新初始化數據庫
        if (db) {
            try {
                await db.close();
                console.log('✓ 已關閉數據庫連接');
            } catch (error) {
                console.error('關閉數據庫失敗:', error.message);
            }
        }
        
        // 4. 重新創建數據庫實例
        db = new Database();
        await db.init();  // 使用正確的方法名 init()
        console.log('✓ 數據庫已重新初始化');
        
        // 5. 重新初始化 Instagram API
        igAPI = new InstagramAPI();
        await igAPI.initialize();
        console.log('✓ Instagram API 已重新初始化');
        
        console.log(`🎉 清理完成！共刪除 ${deletedCount} 個文件`);
        
        return { 
            success: true, 
            message: `清理完成，共刪除 ${deletedCount} 個文件`,
            deletedCount: deletedCount
        };
    } catch (error) {
        console.error('❌ 清理數據失敗:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
});

// 發送單個私訊（用於逐個處理）
ipcMain.handle('send-single-dm', async (event, { username, message }) => {
    try {
        // 檢查登入狀態
        if (!igAPI) {
            return {
                success: false,
                error: '尚未初始化 Instagram API'
            };
        }
        
        const isLoggedIn = await igAPI.checkLoginStatus();
        if (!isLoggedIn) {
            return {
                success: false,
                error: '未登入或 Session 已過期，請重新登入'
            };
        }
        
        console.log(`正在向 @${username} 發送訊息...`);
        const result = await sendDirectMessage(username, message);
        return result;
    } catch (error) {
        console.error(`發送給 @${username} 失敗:`, error);
        return {
            success: false,
            error: error.message || '發送失敗'
        };
    }
});

// 在瀏覽器中打開外部鏈接（✅ 改進：重複使用同一個窗口）
let instagramWindow = null; // 存儲 Instagram 瀏覽器窗口引用

ipcMain.handle('open-external-url', async (event, url) => {
    try {
        // 如果已經有打開的 Instagram 窗口，重複使用
        if (instagramWindow && !instagramWindow.isDestroyed()) {
            console.log('重複使用現有瀏覽器窗口');
            instagramWindow.loadURL(url);
            instagramWindow.focus(); // 聚焦到該窗口
        } else {
            // 第一次打開或窗口已關閉，創建新窗口
            console.log('創建新的瀏覽器窗口');
            instagramWindow = new BrowserWindow({
                width: 1200,
                height: 900,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                },
                title: 'Instagram - 用戶檢查'
            });
            
            instagramWindow.loadURL(url);
            
            // 窗口關閉時清空引用
            instagramWindow.on('closed', () => {
                instagramWindow = null;
            });
        }
        
        return { success: true };
    } catch (error) {
        console.error('打開鏈接失敗:', error);
        return { success: false, error: error.message };
    }
});

// 抓取粉絲
ipcMain.handle('fetch-followers', async (event, { username, start, end }) => {
    const options = {};
    if (start) options.start = parseInt(start);
    if (end) options.end = parseInt(end);
    return await fetchFollowers(username, options);
});

// 批量發送任務
ipcMain.handle('start-batch-dm', async (event, { tasks, message }) => {
    isRunning = true;
    isPaused = false;
    
    for (let i = 0; i < tasks.length; i++) {
        if (!isRunning) break;
        
        // 暫停檢查
        while (isPaused) {
            await sleep(1000);
        }
        
        const task = tasks[i];
        
        // 通知前端開始處理
        mainWindow.webContents.send('task-start', { index: i, username: task.username });
        
        // 發送訊息
        const result = await sendDirectMessage(task.username, message);
        
        // 保存到數據庫
        await db.addTask({
            username: task.username,
            message: message,
            status: result.success ? 'completed' : 'failed',
            error: result.error || null
        });
        
        // 通知前端結果
        mainWindow.webContents.send('task-complete', { 
            index: i, 
            username: task.username,
            success: result.success,
            error: result.error
        });
        
        // 如果不是最後一個，隨機延遲
        if (i < tasks.length - 1 && result.success) {
            const delay = randomDelay();
            mainWindow.webContents.send('task-delay', { delay: Math.round(delay / 1000) });
            await sleep(delay);
        }
    }
    
    isRunning = false;
    mainWindow.webContents.send('batch-complete');
    
    return { success: true };
});

// 暫停
ipcMain.handle('pause-tasks', async () => {
    isPaused = true;
    return { success: true };
});

// 繼續
ipcMain.handle('resume-tasks', async () => {
    isPaused = false;
    return { success: true };
});

// 停止
ipcMain.handle('stop-tasks', async () => {
    isRunning = false;
    isPaused = false;
    return { success: true };
});

// 獲取歷史記錄
ipcMain.handle('get-history', async () => {
    return await db.getHistory();
});

// 清除歷史記錄
ipcMain.handle('clear-history', async () => {
    return await db.clearHistory();
});

// 保存 Session
ipcMain.handle('save-session', async () => {
    await saveSession();
    return { success: true };
});

// 記錄用戶鏈接到文本文件
ipcMain.handle('record-user-link', async (event, { username, link }) => {
    try {
        const recordFilePath = path.join(__dirname, 'recorded-users.txt');
        const recordLine = `${link}\n`;
        
        // 追加到文件
        fs.appendFileSync(recordFilePath, recordLine, 'utf8');
        
        console.log(`✅ 已記錄用戶: @${username} -> ${link}`);
        
        return { 
            success: true, 
            message: '已記錄到 recorded-users.txt',
            filePath: recordFilePath
        };
    } catch (error) {
        console.error('記錄用戶鏈接失敗:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
});

// 應用生命週期
app.whenReady().then(async () => {
    await initDatabase();
    const licenseValid = await initLicense();
    
    if (licenseValid) {
        createWindow();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// 退出前清理
app.on('before-quit', async () => {
    if (igAPI) {
        await saveSession();
    }
    if (db) {
        await db.close();
    }
});
