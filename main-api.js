/**
 * Instagram DM Helper - API 版本
 * 使用直接 HTTP 請求，完全繞過瀏覽器
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const InstagramAPI = require('./src/instagram-api');
const Database = require('./src/database');
const LicenseManager = require('./src/license');

// 初始化 @electron/remote 模組
const remoteMain = require('@electron/remote/main');
remoteMain.initialize();

// 修復 GPU 錯誤
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');

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

    remoteMain.enable(mainWindow.webContents);
    mainWindow.loadFile('index.html');
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
            return await promptForLicense();
        } else if (response === 1) {
            return true;
        } else {
            app.quit();
            return false;
        }
    }
    
    return true;
}

async function promptForLicense() {
    return true;
}

// 初始化 Instagram API
async function initInstagram() {
    try {
        igAPI = new InstagramAPI();
        
        // 嘗試載入已保存的 session
        const savedSession = await db.getSession();
        if (savedSession) {
            const result = await igAPI.loadSession(savedSession);
            if (result.success) {
                console.log('✅ 自動登入成功:', result.username);
                return { success: true, message: '已自動登入', username: result.username };
            }
        }
        
        return { success: true, message: '請使用帳號密碼登入' };
    } catch (error) {
        console.error('初始化 Instagram API 失敗:', error);
        return { success: false, error: error.message };
    }
}

// 登入 Instagram
async function loginInstagram(username, password) {
    try {
        const result = await igAPI.login(username, password);
        
        if (result.success) {
            // 保存 session
            const sessionData = igAPI.getSessionData();
            await db.saveSession(sessionData);
            
            return { success: true, username };
        } else {
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.error('登入失敗:', error);
        return { success: false, error: error.message };
    }
}

// 發送私訊
async function sendDirectMessage(username, message) {
    try {
        const result = await igAPI.sendDirectMessage(username, message);
        
        // 保存到數據庫
        await db.addTask({
            username: username,
            message: message,
            status: result.success ? 'completed' : 'failed',
            error: result.error || null
        });
        
        return result;
    } catch (error) {
        console.error(`發送訊息給 @${username} 失敗:`, error);
        return { success: false, username, error: error.message };
    }
}

// 抓取粉絲列表
async function fetchFollowers(username, maxFollowers = 1000) {
    try {
        const result = await igAPI.getFollowers(username, maxFollowers);
        
        if (result.success) {
            // 發送進度更新
            mainWindow.webContents.send('followers-progress', {
                current: result.followers.length,
                status: `已抓取 ${result.followers.length} 個粉絲`
            });
        }
        
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

// 隨機延遲（30-60秒）
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

// 發送私訊
ipcMain.handle('send-dm', async (event, { username, message }) => {
    return await sendDirectMessage(username, message);
});

// 抓取粉絲
ipcMain.handle('fetch-followers', async (event, { username, maxFollowers }) => {
    return await fetchFollowers(username, maxFollowers || 1000);
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

// 檢查登入狀態
ipcMain.handle('check-login-status', async () => {
    if (!igAPI) {
        return { loggedIn: false };
    }
    
    try {
        const user = await igAPI.getCurrentUser();
        return { loggedIn: true, username: user.username };
    } catch (error) {
        return { loggedIn: false };
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
    if (db) {
        await db.close();
    }
});

