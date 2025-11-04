const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const { dialog } = require('@electron/remote');

// 狀態管理
let tasks = [];
let isRunning = false;
let currentTaskIndex = 0;

// DOM 元素
const elements = {
    // 初始化和登入
    initSection: document.getElementById('initSection'),
    initBtn: document.getElementById('initBtn'),
    loginBtn: document.getElementById('loginBtn'),
    usernameInput: document.getElementById('usernameInput'),
    passwordInput: document.getElementById('passwordInput'),
    mainSection: document.getElementById('mainSection'),
    
    // 訊息輸入
    messageInput: document.getElementById('messageInput'),
    charCount: document.getElementById('charCount'),
    
    // 按鈕
    importBtn: document.getElementById('importBtn'),
    startBtn: document.getElementById('startBtn'),
    exportFollowersBtn: document.getElementById('exportFollowersBtn'),
    saveCookiesBtn: document.getElementById('saveCookiesBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    resumeBtn: document.getElementById('resumeBtn'),
    stopBtn: document.getElementById('stopBtn'),
    
    // 狀態顯示
    statusBar: document.getElementById('statusBar'),
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText'),
    
    // 任務列表
    taskList: document.getElementById('taskList'),
    taskCount: document.getElementById('taskCount'),
    completedCount: document.getElementById('completedCount'),
    failedCount: document.getElementById('failedCount'),
    pendingCount: document.getElementById('pendingCount'),
    
    // 進度條
    progressSection: document.getElementById('progressSection'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    
    // 載入遮罩
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText'),
    
    // 匯出對話框
    exportModal: document.getElementById('exportModal'),
    exportUsername: document.getElementById('exportUsername'),
    exportStart: document.getElementById('exportStart'),
    exportEnd: document.getElementById('exportEnd'),
    exportProgress: document.getElementById('exportProgress'),
    exportStatus: document.getElementById('exportStatus'),
    exportCount: document.getElementById('exportCount'),
    exportTotal: document.getElementById('exportTotal'),
    confirmExportBtn: document.getElementById('confirmExportBtn'),
    cancelExportBtn: document.getElementById('cancelExportBtn')
};

// 初始化事件監聽
function initEventListeners() {
    // 初始化和登入按鈕
    elements.initBtn.addEventListener('click', initInstagram);
    elements.loginBtn.addEventListener('click', loginInstagram);
    
    // Enter 鍵登入
    elements.passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loginInstagram();
        }
    });
    
    // 訊息輸入
    elements.messageInput.addEventListener('input', updateCharCount);
    
    // 功能按鈕
    elements.importBtn.addEventListener('click', importAccounts);
    elements.startBtn.addEventListener('click', startBatchDM);
    elements.exportFollowersBtn.addEventListener('click', showExportModal);
    elements.saveCookiesBtn.addEventListener('click', saveCookies);
    
    // 控制按鈕
    elements.pauseBtn.addEventListener('click', pauseTasks);
    elements.resumeBtn.addEventListener('click', resumeTasks);
    elements.stopBtn.addEventListener('click', stopTasks);
    
    // 匯出對話框
    elements.confirmExportBtn.addEventListener('click', exportFollowers);
    elements.cancelExportBtn.addEventListener('click', closeExportModal);
}

// 登入 Instagram
async function loginInstagram() {
    const username = elements.usernameInput.value.trim();
    const password = elements.passwordInput.value.trim();
    
    if (!username || !password) {
        alert('請輸入帳號和密碼');
        return;
    }
    
    showLoading('正在登入 Instagram...');
    
    try {
        const result = await ipcRenderer.invoke('login-instagram', { username, password });
        
        if (result.success) {
            elements.initSection.style.display = 'none';
            elements.mainSection.style.display = 'block';
            updateStatus('✅ 已登入', `歡迎，${username}！`);
            hideLoading();
            
            // 清除密碼
            elements.passwordInput.value = '';
        } else {
            hideLoading();
            alert('登入失敗：' + result.error);
        }
    } catch (error) {
        hideLoading();
        alert('登入失敗：' + error.message);
    }
}

// 初始化 Instagram（使用已保存的登入狀態）
async function initInstagram() {
    showLoading('正在初始化 Instagram API...');
    
    try {
        const result = await ipcRenderer.invoke('init-instagram');
        
        if (result.success) {
            if (result.autoLogin) {
                // 自動登入成功
                elements.initSection.style.display = 'none';
                elements.mainSection.style.display = 'block';
                updateStatus('✅ 已連接', '已載入先前的登入狀態');
            } else if (result.requireLogin) {
                // 需要登入
                updateStatus('⚠️ 需要登入', '請輸入帳號密碼登入');
            }
            hideLoading();
        } else {
            hideLoading();
            alert('初始化失敗：' + result.error);
        }
    } catch (error) {
        hideLoading();
        alert('初始化失敗：' + error.message);
    }
}

// 匯入帳號
async function importAccounts() {
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'Text Files', extensions: ['txt'] }
            ],
            title: '選擇包含 IG 帳號的文字檔'
        });
        
        if (result.canceled || result.filePaths.length === 0) {
            return;
        }
        
        const filePath = result.filePaths[0];
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 解析帳號（每行一個）
        const usernames = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('#'));
        
        if (usernames.length === 0) {
            alert('檔案中沒有找到有效的帳號');
            return;
        }
        
        // 創建任務
        tasks = usernames.map(username => ({
            username: username.replace('@', ''),
            status: 'pending',
            error: null
        }));
        
        renderTasks();
        updateStatus('📋 已載入', `已載入 ${tasks.length} 個帳號`);
        
    } catch (error) {
        alert('匯入失敗：' + error.message);
    }
}

// 開始批量發送
// 在瀏覽器中打開 Instagram 用戶頁面
async function openInstagramProfile(username) {
    // 清理用戶名輸入
    let cleanUsername = username;
    
    // 移除 @ 符號
    cleanUsername = cleanUsername.replace(/^@+/, '');
    
    // 如果是完整的 Instagram URL，提取用戶名
    if (cleanUsername.includes('instagram.com/')) {
        const match = cleanUsername.match(/instagram\.com\/([^/?]+)/);
        if (match) {
            cleanUsername = match[1];
        }
    }
    
    // 移除前後斜杠
    cleanUsername = cleanUsername.replace(/^\/+|\/+$/g, '');
    
    const url = `https://www.instagram.com/${cleanUsername}/`;
    
    // 通過 IPC 調用主進程打開鏈接
    try {
        const result = await ipcRenderer.invoke('open-external-url', url);
        if (!result.success) {
            console.error('打開鏈接失敗:', result.error);
        }
    } catch (error) {
        console.error('打開鏈接時發生錯誤:', error);
    }
}

// 顯示重新登入對話框
async function showReloginDialog(username, errorMsg) {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            min-width: 450px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;
        
        dialog.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
                <h2 style="margin: 0 0 15px 0; color: #dc3545;">檢測到登入問題</h2>
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; text-align: left;">
                    <strong>錯誤：</strong>${errorMsg}
                </p>
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; text-align: left;">
                    <strong>當前用戶：</strong>@${username}
                </p>
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: left;">
                    <p style="margin: 0 0 10px 0; color: #856404; font-size: 14px; font-weight: 600;">
                        💡 自動處理流程：
                    </p>
                    <p style="margin: 0 0 5px 0; color: #856404; font-size: 13px;">
                        1. 🧹 自動清理舊的登入數據（類似 quick-fix.bat）
                    </p>
                    <p style="margin: 0 0 5px 0; color: #856404; font-size: 13px;">
                        2. 🔐 彈出登入框，輸入新的帳號密碼
                    </p>
                    <p style="margin: 0 0 5px 0; color: #856404; font-size: 13px;">
                        3. ⏭️ 登入成功後，跳過當前失敗的用戶
                    </p>
                    <p style="margin: 0; color: #856404; font-size: 13px;">
                        4. ▶️ 自動繼續處理下一個用戶
                    </p>
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="btn-relogin" style="
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                    ">🔄 重新登入並繼續</button>
                    <button id="btn-stop" style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                    ">🛑 停止群發</button>
                </div>
            </div>
        `;
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        `;
        
        document.body.appendChild(overlay);
        document.body.appendChild(dialog);
        
        dialog.querySelector('#btn-relogin').onclick = async () => {
            // 顯示清理進度
            const btnRelogin = dialog.querySelector('#btn-relogin');
            const btnStop = dialog.querySelector('#btn-stop');
            btnRelogin.disabled = true;
            btnStop.disabled = true;
            btnRelogin.innerHTML = '🧹 清理中...';
            
            try {
                // 1. 自動清理所有登入數據（類似 quick-fix.bat 的功能）
                console.log('開始清理登入數據...');
                const cleanResult = await ipcRenderer.invoke('clean-and-logout');
                
                if (cleanResult.success) {
                    console.log('✅ 清理成功:', cleanResult.message);
                    btnRelogin.innerHTML = '✅ 清理完成';
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    console.error('❌ 清理失敗:', cleanResult.error);
                    alert(`清理數據時發生錯誤：${cleanResult.error}\n\n將繼續登入流程...`);
                }
            } catch (error) {
                console.error('清理數據時發生錯誤:', error);
                alert(`清理數據時發生錯誤：${error.message}\n\n將繼續登入流程...`);
            }
            
            document.body.removeChild(dialog);
            document.body.removeChild(overlay);
            
            // 2. 等待用戶重新登入（會彈出新的對話框）
            const reloginSuccess = await waitForRelogin();
            
            if (reloginSuccess) {
                resolve('relogin');
            } else {
                resolve('stop');
            }
        };
        
        dialog.querySelector('#btn-stop').onclick = () => {
            document.body.removeChild(dialog);
            document.body.removeChild(overlay);
            resolve('stop');
        };
    });
}

// 等待用戶重新登入
async function waitForRelogin() {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            min-width: 400px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;
        
        dialog.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 15px;">🔐</div>
                <h2 style="margin: 0 0 15px 0; color: #0095f6;">請重新登入</h2>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 0 0 10px 0; color: #1565c0; font-size: 14px;">
                        請在主畫面中：
                    </p>
                    <p style="margin: 0 0 5px 0; color: #1565c0; font-size: 13px;">
                        1️⃣ 點擊【登入】按鈕
                    </p>
                    <p style="margin: 0 0 5px 0; color: #1565c0; font-size: 13px;">
                        2️⃣ 輸入帳號密碼
                    </p>
                    <p style="margin: 0; color: #1565c0; font-size: 13px;">
                        3️⃣ 登入成功後點擊【確認完成】
                    </p>
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="btn-confirm" style="
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                    ">✅ 確認完成</button>
                    <button id="btn-cancel" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                    ">❌ 取消</button>
                </div>
            </div>
        `;
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        `;
        
        document.body.appendChild(overlay);
        document.body.appendChild(dialog);
        
        dialog.querySelector('#btn-confirm').onclick = async () => {
            // 驗證是否已登入
            try {
                const loginStatus = await ipcRenderer.invoke('check-login-status');
                
                if (loginStatus.loggedIn) {
                    document.body.removeChild(dialog);
                    document.body.removeChild(overlay);
                    resolve(true);
                } else {
                    alert('❌ 尚未登入成功！\n\n請先完成登入後再點擊【確認完成】。');
                }
            } catch (error) {
                alert('檢查登入狀態時發生錯誤：' + error.message);
            }
        };
        
        dialog.querySelector('#btn-cancel').onclick = () => {
            document.body.removeChild(dialog);
            document.body.removeChild(overlay);
            resolve(false);
        };
    });
}

// 詢問用戶是否可以發送消息
function askUserToSend(username, index, total) {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            min-width: 400px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;
        
        dialog.innerHTML = `
            <div style="text-align: center;">
                <h3 style="margin: 0 0 15px 0; color: #333;">用戶 ${index}/${total}</h3>
                <h2 style="margin: 0 0 20px 0; color: #0095f6;">@${username}</h2>
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                    📌 請在瀏覽器中檢查該用戶頁面
                </p>
                <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">
                    查看是否有【訊息】或【Message】按鈕
                </p>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button id="btn-send" style="
                        background: #cccccc;
                        color: #666666;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 8px;
                        cursor: not-allowed;
                        font-size: 14px;
                        font-weight: 600;
                        opacity: 0.6;
                    " disabled>🔒 可以發送（已鎖定）</button>
                    <button id="btn-skip" style="
                        background: #ffc107;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                    ">⏭️ 跳過</button>
                    <button id="btn-stop" style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                    ">🛑 停止</button>
                </div>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
                    <button id="btn-record" style="
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                    ">📝 記錄下來</button>
                </div>
            </div>
        `;
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        `;
        
        document.body.appendChild(overlay);
        document.body.appendChild(dialog);
        
        // 🔒 發送按鈕已鎖定，不做任何事
        dialog.querySelector('#btn-send').onclick = () => {
            // 按鈕已禁用，不執行任何操作
        };
        
        dialog.querySelector('#btn-skip').onclick = () => {
            document.body.removeChild(dialog);
            document.body.removeChild(overlay);
            resolve('skip');
        };
        
        dialog.querySelector('#btn-stop').onclick = () => {
            document.body.removeChild(dialog);
            document.body.removeChild(overlay);
            resolve('stop');
        };
        
        // 記錄按鈕：保存用戶鏈接到文本文件
        dialog.querySelector('#btn-record').onclick = async () => {
            try {
                const recordBtn = dialog.querySelector('#btn-record');
                recordBtn.disabled = true;
                recordBtn.textContent = '⏳ 記錄中...';
                recordBtn.style.background = '#6c757d';
                recordBtn.style.cursor = 'not-allowed';
                
                // 清理用戶名
                let cleanUsername = username;
                // 移除 @ 符號
                cleanUsername = cleanUsername.replace(/^@+/, '');
                // 如果是完整的 Instagram URL，提取用戶名
                if (cleanUsername.includes('instagram.com/')) {
                    const match = cleanUsername.match(/instagram\.com\/([^/?]+)/);
                    if (match) {
                        cleanUsername = match[1];
                    }
                }
                // 移除前後斜杠
                cleanUsername = cleanUsername.replace(/^\/+|\/+$/g, '');
                
                const userLink = `https://www.instagram.com/${cleanUsername}/`;
                const result = await ipcRenderer.invoke('record-user-link', { username: cleanUsername, link: userLink });
                
                if (result.success) {
                    recordBtn.textContent = '✅ 已記錄';
                    recordBtn.style.background = '#28a745';
                    setTimeout(() => {
                        recordBtn.textContent = '📝 記錄下來';
                        recordBtn.style.background = '#28a745';
                        recordBtn.style.cursor = 'pointer';
                        recordBtn.disabled = false;
                    }, 1500);
                } else {
                    alert('記錄失敗：' + result.error);
                    recordBtn.textContent = '❌ 記錄失敗';
                    recordBtn.style.background = '#dc3545';
                    setTimeout(() => {
                        recordBtn.textContent = '📝 記錄下來';
                        recordBtn.style.background = '#28a745';
                        recordBtn.style.cursor = 'pointer';
                        recordBtn.disabled = false;
                    }, 1500);
                }
            } catch (error) {
                alert('記錄失敗：' + error.message);
                const recordBtn = dialog.querySelector('#btn-record');
                recordBtn.textContent = '📝 記錄下來';
                recordBtn.style.background = '#28a745';
                recordBtn.style.cursor = 'pointer';
                recordBtn.disabled = false;
            }
        };
    });
}

async function startBatchDM() {
    if (tasks.length === 0) {
        alert('請先匯入帳號清單');
        return;
    }
    
    const message = elements.messageInput.value.trim();
    if (!message) {
        alert('請輸入訊息文案');
        return;
    }
    
    // 檢查登入狀態
    try {
        const loginStatus = await ipcRenderer.invoke('check-login-status');
        if (!loginStatus.loggedIn) {
            console.log('⚠️ 未登入，自動清理並顯示登入對話框...');
            
            // 1. 自動清理數據
            try {
                updateStatus('🧹 清理中', '正在清理舊數據...');
                const cleanResult = await ipcRenderer.invoke('clean-and-logout');
                console.log('清理結果:', cleanResult);
            } catch (cleanError) {
                console.error('清理失敗:', cleanError);
            }
            
            // 2. 顯示登入對話框
            showLoginRequiredDialog(loginStatus.message || '未登入或 Session 已過期');
            return;
        }
    } catch (error) {
        console.error('檢查登入狀態時發生錯誤:', error);
        
        // 自動清理並顯示登入對話框
        try {
            updateStatus('🧹 清理中', '正在清理舊數據...');
            await ipcRenderer.invoke('clean-and-logout');
        } catch (cleanError) {
            console.error('清理失敗:', cleanError);
        }
        
        showLoginRequiredDialog(error.message || 'Session 已過期或需要驗證');
        return;
    }
    
    const confirmed = confirm(
        `確定要向 ${tasks.length} 個帳號發送訊息嗎？\n\n` +
        `流程：\n` +
        `1. 在瀏覽器中打開第一個用戶頁面\n` +
        `2. 你確認是否有【訊息】按鈕\n` +
        `3. 確認後發送訊息\n` +
        `4. 自動打開下一個用戶頁面\n\n` +
        `💡 提示：請在瀏覽器中保持同一個頁面，不要關閉\n\n` +
        `注意：頻繁操作可能導致帳號被限制。`
    );
    if (!confirmed) {
        return;
    }
    
    isRunning = true;
    currentTaskIndex = 0;
    
    // 更新UI
    elements.startBtn.disabled = true;
    elements.importBtn.disabled = true;
    elements.pauseBtn.disabled = false;
    elements.stopBtn.disabled = false;
    elements.progressSection.style.display = 'block';
    elements.statusBar.classList.add('running');
    
    updateStatus('🚀 執行中', '正在逐個處理用戶...');
    
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;
    
    try {
        // 逐個處理用戶
        for (let i = 0; i < tasks.length; i++) {
            if (!isRunning) {
                updateStatus('⏹️ 已停止', `處理了 ${i} 個用戶後停止`);
                break;
            }
            
            const task = tasks[i];
            const username = task.username;
            currentTaskIndex = i;
            
            // 更新進度
            const progress = Math.round(((i + 1) / tasks.length) * 100);
            elements.progressFill.style.width = progress + '%';
            elements.progressText.textContent = `${i + 1} / ${tasks.length}`;
            
            updateStatus('🌐 打開用戶頁面', `正在處理 @${username} (${i + 1}/${tasks.length})`);
            
            try {
                // 1. 在瀏覽器中打開用戶頁面
                await openInstagramProfile(username);
                
                // 等待頁面加載
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // 2. 詢問用戶是否可以發送
                const action = await askUserToSend(username, i + 1, tasks.length);
                
                if (action === 'stop') {
                    isRunning = false;
                    updateStatus('⏹️ 已停止', `處理了 ${i + 1} 個用戶後停止`);
                    break;
                }
                
                if (action === 'skip') {
                    skipCount++;
                    updateTaskStatus(i, 'skipped', '已跳過');
                    continue;
                }
                
                // 3. 發送訊息
                updateStatus('📤 發送中', `正在向 @${username} 發送訊息...`);
                
                const result = await ipcRenderer.invoke('send-single-dm', {
                    username: username,
                    message: message
                });
                
                if (result.success) {
                    successCount++;
                    updateTaskStatus(i, 'completed', '發送成功');
                } else {
                    failCount++;
                    updateTaskStatus(i, 'failed', result.error || '發送失敗');
                    
                    // 檢查是否是 Challenge Required 錯誤
                    if (result.error && isChallengeError(result.error)) {
                        console.log('⚠️ 檢測到 Challenge Required 錯誤');
                        
                        // 暫停群發
                        isRunning = false;
                        updateStatus('⚠️ 需要驗證', '帳號需要完成 Instagram 驗證');
                        
                        // 顯示 Challenge 對話框
                        showChallengeDialog(result.error);
                        break;
                    }
                    
                    // 如果是登入相關錯誤，暫停並提示重新登入
                    if (result.error && (result.error.includes('登入') || 
                        result.error.includes('Session'))) {
                        
                        const action = await showReloginDialog(username, result.error);
                        
                        if (action === 'relogin') {
                            // 用戶選擇重新登入，跳過當前用戶，繼續下一個
                            console.log('用戶已重新登入，繼續處理下一個用戶...');
                            continue;
                        } else {
                            // 用戶選擇停止
                            isRunning = false;
                            updateStatus('⏹️ 已停止', `因登入問題停止於第 ${i + 1} 個用戶`);
                            break;
                        }
                    }
                }
            } catch (error) {
                console.error(`處理用戶 @${username} 時發生錯誤:`, error);
                failCount++;
                updateTaskStatus(i, 'failed', error.message || '未知錯誤');
                
                // 檢查是否是 Challenge Required 錯誤
                if (isChallengeError(error.message)) {
                    console.log('⚠️ 檢測到 Challenge Required 錯誤');
                    
                    // 暫停群發
                    isRunning = false;
                    updateStatus('⚠️ 需要驗證', '帳號需要完成 Instagram 驗證');
                    
                    // 顯示 Challenge 對話框
                    showChallengeDialog(error.message);
                    break;
                }
                
                // 如果是嚴重錯誤，詢問是否繼續
                const shouldContinue = confirm(
                    `⚠️ 處理 @${username} 時發生錯誤\n\n` +
                    `錯誤：${error.message}\n\n` +
                    `是否繼續處理剩餘用戶？\n` +
                    `點擊【確定】繼續，【取消】停止`
                );
                
                if (!shouldContinue) {
                    isRunning = false;
                    break;
                }
            }
            
            // 等待一下再處理下一個
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (fatalError) {
        console.error('批量發送過程中發生嚴重錯誤:', fatalError);
        alert(
            `❌ 發生嚴重錯誤\n\n` +
            `錯誤：${fatalError.message}\n\n` +
            `批量發送已停止。\n` +
            `已完成：${successCount} 成功，${skipCount} 跳過，${failCount} 失敗`
        );
    }
    
    // 完成
    isRunning = false;
    resetButtons();
    elements.statusBar.classList.remove('running');
    
    updateStatus('✅ 完成', 
        `發送完成！成功: ${successCount}, 跳過: ${skipCount}, 失敗: ${failCount}`
    );
    
    alert(
        `批量發送完成！\n\n` +
        `✅ 成功：${successCount} 個\n` +
        `⏭️ 跳過：${skipCount} 個\n` +
        `❌ 失敗：${failCount} 個`
    );
}

// 暫停任務
async function pauseTasks() {
    await ipcRenderer.invoke('pause-tasks');
    elements.pauseBtn.disabled = true;
    elements.resumeBtn.disabled = false;
    updateStatus('⏸️ 已暫停', '任務已暫停');
}

// 繼續任務
async function resumeTasks() {
    await ipcRenderer.invoke('resume-tasks');
    elements.pauseBtn.disabled = false;
    elements.resumeBtn.disabled = true;
    updateStatus('🚀 執行中', '任務繼續執行中...');
}

// 停止任務
async function stopTasks() {
    const confirmed = confirm('確定要停止所有任務嗎？');
    if (!confirmed) return;
    
    await ipcRenderer.invoke('stop-tasks');
    resetButtons();
    updateStatus('⏹️ 已停止', '任務已手動停止');
    elements.statusBar.classList.remove('running');
}

// 顯示匯出對話框
function showExportModal() {
    elements.exportModal.style.display = 'flex';
    elements.exportUsername.value = '';
    elements.exportStart.value = '';
    elements.exportEnd.value = '';
    elements.exportProgress.style.display = 'none';
}

// 關閉匯出對話框
function closeExportModal() {
    elements.exportModal.style.display = 'none';
}

// 匯出粉絲
async function exportFollowers() {
    const username = elements.exportUsername.value.trim();
    const start = elements.exportStart.value.trim();
    const end = elements.exportEnd.value.trim();
    
    if (!username) {
        alert('請輸入 Instagram 帳號名稱');
        return;
    }
    
    // 驗證範圍
    if (start && end && parseInt(start) > parseInt(end)) {
        alert('開始位置不能大於結束位置！');
        return;
    }
    
    elements.confirmExportBtn.disabled = true;
    elements.cancelExportBtn.disabled = true;
    elements.exportProgress.style.display = 'block';
    
    // 顯示範圍信息
    let rangeText = '';
    if (start && end) {
        rangeText = `（第 ${start}-${end} 個）`;
    } else if (start) {
        rangeText = `（從第 ${start} 個開始）`;
    } else if (end) {
        rangeText = `（前 ${end} 個）`;
    }
    
    elements.exportStatus.textContent = `正在抓取粉絲列表${rangeText}...`;
    elements.exportCount.textContent = '0';
    elements.exportTotal.textContent = '0';
    
    try {
        const result = await ipcRenderer.invoke('fetch-followers', { 
            username,
            start: start || null,
            end: end || null
        });
        
        if (result.success && result.followers) {
            // 顯示完成信息
            let completeMsg = `✅ 抓取完成！`;
            if (result.range && (result.range.start > 1 || result.range.end)) {
                completeMsg += ` (${result.range.start}-${result.range.end})`;
            }
            elements.exportStatus.textContent = completeMsg;
            elements.exportCount.textContent = result.count;
            elements.exportTotal.textContent = result.totalScanned || result.count;
            
            // 選擇保存位置
            let filename = `${username}_粉絲_${getDateString()}`;
            if (start || end) {
                filename += `_${start || '1'}-${end || 'end'}`;
            }
            
            const saveResult = await dialog.showSaveDialog({
                defaultPath: `${filename}.txt`,
                filters: [
                    { name: 'Text Files', extensions: ['txt'] }
                ]
            });
            
            if (!saveResult.canceled) {
                // 將用戶名轉換為完整的 Instagram 鏈接
                const followerLinks = result.followers.map(username => `https://www.instagram.com/${username}/`);
                fs.writeFileSync(saveResult.filePath, followerLinks.join('\n'), 'utf8');
                
                let summaryMsg = `成功匯出 ${result.count} 個粉絲到：\n${saveResult.filePath}`;
                if (result.totalScanned && result.totalScanned > result.count) {
                    summaryMsg += `\n\n（共掃描 ${result.totalScanned} 個粉絲）`;
                }
                alert(summaryMsg);
            }
            
            closeExportModal();
        } else {
            alert('匯出失敗：' + (result.error || '未知錯誤'));
        }
        
    } catch (error) {
        alert('匯出失敗：' + error.message);
    } finally {
        elements.confirmExportBtn.disabled = false;
        elements.cancelExportBtn.disabled = false;
    }
}

// 保存 Cookies
async function saveCookies() {
    showLoading('正在保存登入狀態...');
    
    try {
        await ipcRenderer.invoke('save-session');
        hideLoading();
        alert('✅ 登入狀態已保存！\n下次啟動時將自動登入。');
    } catch (error) {
        hideLoading();
        alert('保存失敗：' + error.message);
    }
}

// 渲染任務列表
// 更新單個任務的狀態
function updateTaskStatus(index, status, error = null) {
    if (index < 0 || index >= tasks.length) {
        console.error(`無效的任務索引: ${index}`);
        return;
    }
    
    tasks[index].status = status;
    if (error) {
        tasks[index].error = error;
    }
    
    renderTasks();
}

function renderTasks() {
    if (tasks.length === 0) {
        elements.taskList.innerHTML = `
            <div class="empty-state">
                <p>📋 尚無任務</p>
                <p class="hint">點擊「匯入 IG 帳號」開始</p>
            </div>
        `;
        updateTaskStats();
        return;
    }
    
    const html = tasks.map((task, index) => {
        const iconClass = task.status;
        const iconEmoji = {
            'pending': '⏳',
            'progress': '🔄',
            'completed': '✅',
            'skipped': '⏭️',
            'failed': '❌'
        }[task.status] || '⚪';
        
        const statusText = {
            'pending': '等待中',
            'progress': '發送中...',
            'completed': '已完成',
            'skipped': '已跳過',
            'failed': '失敗'
        }[task.status] || '未知';
        
        return `
            <div class="task-item">
                <div class="task-icon ${iconClass}">${iconEmoji}</div>
                <div class="task-info">
                    <div class="task-username">@${task.username}</div>
                    <div class="task-status">${statusText}</div>
                    ${task.error ? `<div class="task-error">錯誤：${task.error}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    elements.taskList.innerHTML = html;
    updateTaskStats();
    updateProgress();
}

// 更新任務統計
function updateTaskStats() {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const skipped = tasks.filter(t => t.status === 'skipped').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    
    elements.taskCount.textContent = tasks.length;
    elements.completedCount.textContent = completed;
    elements.failedCount.textContent = failed + skipped; // 跳過的也算在失敗中
    elements.pendingCount.textContent = pending;
}

// 更新進度條
function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter(t => 
        t.status === 'completed' || 
        t.status === 'failed' || 
        t.status === 'skipped'
    ).length;
    const percentage = total > 0 ? (completed / total * 100) : 0;
    
    elements.progressFill.style.width = `${percentage}%`;
    elements.progressText.textContent = `${completed} / ${total}`;
}

// 更新狀態
function updateStatus(indicator, text) {
    elements.statusIndicator.textContent = indicator;
    elements.statusText.textContent = text;
}

// 更新字數統計
function updateCharCount() {
    const count = elements.messageInput.value.length;
    elements.charCount.textContent = count;
}

// 顯示載入遮罩
function showLoading(text = '處理中...') {
    elements.loadingText.textContent = text;
    elements.loadingOverlay.style.display = 'flex';
}

// 隱藏載入遮罩
function hideLoading() {
    elements.loadingOverlay.style.display = 'none';
}

// 重置按鈕狀態
function resetButtons() {
    elements.startBtn.disabled = false;
    elements.importBtn.disabled = false;
    elements.pauseBtn.disabled = true;
    elements.resumeBtn.disabled = true;
    elements.stopBtn.disabled = true;
}

// 獲取日期字符串
function getDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// IPC 事件監聽

// 任務開始
ipcRenderer.on('task-start', (event, data) => {
    const task = tasks[data.index];
    if (task) {
        task.status = 'progress';
        renderTasks();
        updateStatus('🔄 處理中', `正在發送給 @${data.username}...`);
    }
});

// 任務完成
ipcRenderer.on('task-complete', (event, data) => {
    const task = tasks[data.index];
    if (task) {
        task.status = data.success ? 'completed' : 'failed';
        task.error = data.error || null;
        renderTasks();
    }
});

// 任務延遲
ipcRenderer.on('task-delay', (event, data) => {
    updateStatus('⏰ 等待中', `等待 ${data.delay} 秒後繼續（避免被偵測）...`);
});

// 批次完成
ipcRenderer.on('batch-complete', () => {
    isRunning = false;
    resetButtons();
    elements.statusBar.classList.remove('running');
    
    const completed = tasks.filter(t => t.status === 'completed').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    
    updateStatus('✅ 完成', `任務完成！成功：${completed}，失敗：${failed}`);
    
    alert(`批量發送完成！\n\n✅ 成功：${completed}\n❌ 失敗：${failed}`);
});

// 粉絲抓取進度（實時更新）
ipcRenderer.on('followers-progress', (event, data) => {
    elements.exportCount.textContent = data.current;
    elements.exportTotal.textContent = data.total || data.current;
    elements.exportStatus.textContent = data.status;
});

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    initEventListeners();
    updateCharCount();
    
    // 启动时检查登入状态
    await checkLoginOnStartup();
});

// 启动时检查登入状态
async function checkLoginOnStartup() {
    try {
        // 等待一下让程序完全启动
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log('🔍 开始检查登入状态...');
        
        let loginStatus;
        try {
            loginStatus = await ipcRenderer.invoke('check-login-status');
        } catch (error) {
            console.error('调用 check-login-status 失败:', error);
            // 出错也显示登入提示
            showLoginRequiredDialog(error.message || 'Session 已過期或需要驗證');
            return;
        }
        
        console.log('登入状态:', loginStatus);
        
        if (!loginStatus.loggedIn) {
            console.log('⚠️ 未登入，显示登入对话框...');
            
            // 显示友好的登入提示
            showLoginRequiredDialog(loginStatus.message || 'Session 已過期或需要驗證');
        } else {
            console.log('✅ 已登入');
        }
    } catch (error) {
        console.error('检查登入状态时发生错误:', error);
        
        // 任何错误都显示登入提示，确保用户知道需要登入
        showLoginRequiredDialog(error.message || 'Session 已過期或需要驗證');
    }
}

// 检测是否是 Challenge Required 错误
function isChallengeError(errorMessage) {
    if (!errorMessage) return false;
    const msg = errorMessage.toLowerCase();
    return msg.includes('challenge') || 
           msg.includes('驗證') || 
           msg.includes('验证') ||
           msg.includes('帳號需要驗證') ||
           msg.includes('账号需要验证');
}

// 显示 Challenge Required 对话框
function showChallengeDialog(errorMessage) {
    // 如果对话框已经存在，不重复创建
    const existingDialog = document.getElementById('challenge-dialog');
    if (existingDialog) {
        console.log('Challenge 对话框已存在，不重复创建');
        return;
    }
    
    console.log('⚠️ 显示 Challenge Required 对话框...');
    
    const dialog = document.createElement('div');
    dialog.id = 'challenge-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 4px 30px rgba(0,0,0,0.4);
        z-index: 10001;
        min-width: 500px;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        animation: slideIn 0.3s ease-out;
    `;
    
    dialog.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 64px; margin-bottom: 15px;">⚠️</div>
            <h2 style="margin: 0 0 15px 0; color: #ff9800;">Instagram 需要驗證</h2>
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                ${errorMessage || '帳號需要完成安全驗證'}
            </p>
            
            <div style="background: #fff3cd; border-left: 4px solid #ff9800; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
                <p style="margin: 0 0 15px 0; color: #856404; font-size: 15px; font-weight: 600;">
                    🔒 為什麼會出現這個問題？
                </p>
                <ul style="margin: 0 0 15px 0; padding-left: 20px; color: #856404; font-size: 13px; line-height: 1.6;">
                    <li>Instagram 檢測到異常登入行為</li>
                    <li>需要完成身份驗證（例如：輸入驗證碼、確認登入位置）</li>
                    <li>這是 Instagram 的安全保護機制</li>
                </ul>
                
                <p style="margin: 15px 0 10px 0; color: #856404; font-size: 15px; font-weight: 600;">
                    ✅ 如何解決？
                </p>
                <ol style="margin: 0; padding-left: 20px; color: #856404; font-size: 13px; line-height: 1.8;">
                    <li><strong>在瀏覽器中打開 Instagram</strong><br>
                        訪問：<a href="https://www.instagram.com" target="_blank" style="color: #0095f6; text-decoration: none;">https://www.instagram.com</a>
                    </li>
                    <li><strong>使用該帳號登入</strong><br>
                        輸入您的用戶名和密碼
                    </li>
                    <li><strong>完成 Instagram 的驗證步驟</strong><br>
                        可能包括：輸入驗證碼、確認登入位置、回答安全問題等
                    </li>
                    <li><strong>驗證成功後，返回本程序</strong><br>
                        點擊下方【重新嘗試】按鈕
                    </li>
                </ol>
            </div>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: left;">
                <p style="margin: 0 0 10px 0; color: #1565c0; font-size: 14px; font-weight: 600;">
                    💡 溫馨提示
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #1565c0; font-size: 12px; line-height: 1.6;">
                    <li>建議使用同一台電腦的瀏覽器完成驗證</li>
                    <li>驗證過程可能需要 5-10 分鐘</li>
                    <li>完成驗證後，24 小時內通常不會再次出現</li>
                    <li>如果頻繁出現，建議降低群發頻率</li>
                </ul>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button id="btn-open-instagram" style="
                    background: #0095f6;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    flex: 1;
                ">🌐 打開 Instagram</button>
                <button id="btn-retry" style="
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    flex: 1;
                ">🔄 重新嘗試</button>
                <button id="btn-close-challenge" style="
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                ">❌ 關閉</button>
            </div>
        </div>
    `;
    
    const overlay = document.createElement('div');
    overlay.id = 'challenge-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.6);
        z-index: 10000;
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    
    console.log('✅ Challenge 对话框已显示！');
    
    // 打開 Instagram 按鈕
    dialog.querySelector('#btn-open-instagram').onclick = async () => {
        console.log('用戶點擊了【打開 Instagram】按鈕');
        try {
            await ipcRenderer.invoke('open-external-url', 'https://www.instagram.com');
        } catch (error) {
            console.error('打開 Instagram 失敗:', error);
        }
    };
    
    // 重新嘗試按鈕
    dialog.querySelector('#btn-retry').onclick = async () => {
        console.log('用戶點擊了【重新嘗試】按鈕');
        
        // 關閉對話框
        const existingDialog = document.getElementById('challenge-dialog');
        const existingOverlay = document.getElementById('challenge-overlay');
        if (existingDialog) document.body.removeChild(existingDialog);
        if (existingOverlay) document.body.removeChild(existingOverlay);
        
        // 清理並重新登入
        try {
            updateStatus('🧹 清理中', '正在清理舊數據...');
            await ipcRenderer.invoke('clean-and-logout');
            console.log('清理完成');
        } catch (error) {
            console.error('清理失敗:', error);
        }
        
        // 顯示登入對話框
        showLoginRequiredDialog('請重新登入以繼續');
    };
    
    // 關閉按鈕
    dialog.querySelector('#btn-close-challenge').onclick = () => {
        console.log('用戶點擊了【關閉】按鈕');
        const existingDialog = document.getElementById('challenge-dialog');
        const existingOverlay = document.getElementById('challenge-overlay');
        if (existingDialog) document.body.removeChild(existingDialog);
        if (existingOverlay) document.body.removeChild(existingOverlay);
    };
}

// 显示需要登入的提示对话框
function showLoginRequiredDialog(errorMessage) {
    // 先检查是否是 Challenge 错误
    if (isChallengeError(errorMessage)) {
        showChallengeDialog(errorMessage);
        return;
    }
    
    // 如果对话框已经存在，不重复创建
    const existingDialog = document.getElementById('login-required-dialog');
    if (existingDialog) {
        console.log('登入对话框已存在，不重复创建');
        return;
    }
    
    console.log('📢 创建登入对话框...');
    
    const dialog = document.createElement('div');
    dialog.id = 'login-required-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        min-width: 400px;
        max-width: 500px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    
    dialog.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">🔐</div>
            <h2 style="margin: 0 0 15px 0; color: #dc3545;">需要登入</h2>
            <p style="margin: 0 0 20px 0; color: #666; font-size: 15px;">
                ${errorMessage || 'Session 已過期或尚未登入'}
            </p>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
                <p style="margin: 0 0 15px 0; color: #1565c0; font-size: 15px; font-weight: 600; text-align: center;">
                    ⚡ 請在主畫面完成登入
                </p>
                <ol style="margin: 0; padding-left: 20px; color: #1565c0; font-size: 14px; line-height: 1.8;">
                    <li>點擊下方【📍 去主畫面登入】按鈕</li>
                    <li>在主畫面輸入您的 Instagram 帳號密碼</li>
                    <li>點擊主畫面的【登入】按鈕</li>
                    <li>登入成功後即可開始群發</li>
                </ol>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button id="btn-goto-login" style="
                    background: #0095f6;
                    color: white;
                    border: none;
                    padding: 14px 25px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: 600;
                    flex: 1;
                    box-shadow: 0 2px 8px rgba(0,149,246,0.3);
                ">📍 去主畫面登入</button>
                <button id="btn-cancel" style="
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 14px 25px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: 600;
                ">❌ 取消</button>
            </div>
        </div>
    `;
    
    const overlay = document.createElement('div');
    overlay.id = 'login-required-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    
    console.log('✅ 登入提示对话框已显示在窗口中！');
    
    // 获取按钮
    const gotoLoginBtn = dialog.querySelector('#btn-goto-login');
    const cancelBtn = dialog.querySelector('#btn-cancel');
    
    // 【去主畫面登入】按钮点击事件
    gotoLoginBtn.onclick = async () => {
        console.log('用户点击了【📍 去主畫面登入】按钮');
        
        // 1. 关闭对话框
        const existingDialog = document.getElementById('login-required-dialog');
        const existingOverlay = document.getElementById('login-required-overlay');
        if (existingDialog) document.body.removeChild(existingDialog);
        if (existingOverlay) document.body.removeChild(existingOverlay);
        console.log('提示对话框已关闭');
        
        // 2. 自动清理数据
        try {
            console.log('🧹 自动清理旧数据...');
            await ipcRenderer.invoke('clean-and-logout');
            console.log('✅ 清理完成');
        } catch (error) {
            console.error('清理失败:', error);
        }
        
        // 3. 滚动到登入区域
        const loginSection = document.querySelector('.login-section');
        if (loginSection) {
            loginSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            console.log('✅ 已滚动到登入区域');
        }
        
        // 4. 自动聚焦到用户名输入框
        setTimeout(() => {
            const usernameInput = document.getElementById('username');
            if (usernameInput) {
                usernameInput.focus();
                usernameInput.style.border = '2px solid #0095f6';
                usernameInput.style.boxShadow = '0 0 8px rgba(0,149,246,0.3)';
                console.log('✅ 已聚焦到用户名输入框');
                
                // 3 秒后恢复正常样式
                setTimeout(() => {
                    usernameInput.style.border = '';
                    usernameInput.style.boxShadow = '';
                }, 3000);
            }
        }, 600); // 等待滚动动画完成
    };
    
    // 【取消】按钮点击事件
    cancelBtn.onclick = () => {
        console.log('用户点击了【❌ 取消】按钮');
        const existingDialog = document.getElementById('login-required-dialog');
        const existingOverlay = document.getElementById('login-required-overlay');
        if (existingDialog) document.body.removeChild(existingDialog);
        if (existingOverlay) document.body.removeChild(existingOverlay);
        console.log('提示对话框已关闭');
    };
}

