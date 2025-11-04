/**
 * 前端邏輯 - API 版本
 */

const { ipcRenderer } = require('electron');
const { dialog } = require('@electron/remote');
const fs = require('fs');
const path = require('path');

let accounts = [];
let currentTaskIndex = 0;
let isRunning = false;
let isPaused = false;

// DOM 元素
const loginSection = document.getElementById('loginSection');
const mainSection = document.getElementById('mainSection');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const btnLogin = document.getElementById('btnLogin');
const btnCheckStatus = document.getElementById('btnCheckStatus');
const loginStatus = document.getElementById('loginStatus');
const currentUsername = document.getElementById('currentUsername');
const btnLogout = document.getElementById('btnLogout');

const btnImportAccounts = document.getElementById('btnImportAccounts');
const accountCount = document.getElementById('accountCount');
const messageInput = document.getElementById('messageInput');
const btnStartBatch = document.getElementById('btnStartBatch');
const btnPauseBatch = document.getElementById('btnPauseBatch');
const btnResumeBatch = document.getElementById('btnResumeBatch');
const btnStopBatch = document.getElementById('btnStopBatch');
const progressInfo = document.getElementById('progressInfo');
const taskListContainer = document.getElementById('taskListContainer');

const followersUsername = document.getElementById('followersUsername');
const maxFollowers = document.getElementById('maxFollowers');
const btnFetchFollowers = document.getElementById('btnFetchFollowers');
const followersProgress = document.getElementById('followersProgress');

const btnLoadHistory = document.getElementById('btnLoadHistory');
const btnClearHistory = document.getElementById('btnClearHistory');
const historyContainer = document.getElementById('historyContainer');

// 顯示訊息
function showMessage(element, message, type = 'info') {
    element.textContent = message;
    element.className = `status-message ${type}`;
    element.style.display = 'block';
}

// 初始化
async function init() {
    showMessage(loginStatus, '正在初始化...', 'info');
    
    try {
        const result = await ipcRenderer.invoke('init-instagram');
        
        if (result.success) {
            if (result.username) {
                // 已自動登入
                showMessage(loginStatus, `✅ ${result.message}`, 'success');
                showMainSection(result.username);
            } else {
                showMessage(loginStatus, result.message, 'info');
            }
        } else {
            showMessage(loginStatus, `❌ 初始化失敗: ${result.error}`, 'error');
        }
    } catch (error) {
        showMessage(loginStatus, `❌ 初始化失敗: ${error.message}`, 'error');
    }
}

// 登入
btnLogin.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username || !password) {
        showMessage(loginStatus, '⚠️ 請輸入帳號和密碼', 'warning');
        return;
    }
    
    btnLogin.disabled = true;
    showMessage(loginStatus, '正在登入...', 'info');
    
    try {
        const result = await ipcRenderer.invoke('login-instagram', { username, password });
        
        if (result.success) {
            showMessage(loginStatus, `✅ 登入成功！`, 'success');
            showMainSection(result.username);
            passwordInput.value = ''; // 清除密碼
        } else {
            showMessage(loginStatus, `❌ 登入失敗: ${result.error}`, 'error');
            btnLogin.disabled = false;
        }
    } catch (error) {
        showMessage(loginStatus, `❌ 登入失敗: ${error.message}`, 'error');
        btnLogin.disabled = false;
    }
});

// 檢查登入狀態
btnCheckStatus.addEventListener('click', async () => {
    try {
        const result = await ipcRenderer.invoke('check-login-status');
        
        if (result.loggedIn) {
            showMessage(loginStatus, `✅ 已登入: ${result.username}`, 'success');
            showMainSection(result.username);
        } else {
            showMessage(loginStatus, '❌ 未登入，請輸入帳號密碼', 'warning');
        }
    } catch (error) {
        showMessage(loginStatus, `❌ 檢查失敗: ${error.message}`, 'error');
    }
});

// 顯示主功能區
function showMainSection(username) {
    currentUsername.textContent = username;
    loginSection.style.display = 'none';
    mainSection.style.display = 'block';
}

// 登出
btnLogout.addEventListener('click', () => {
    mainSection.style.display = 'none';
    loginSection.style.display = 'block';
    usernameInput.value = '';
    passwordInput.value = '';
    btnLogin.disabled = false;
    showMessage(loginStatus, '請重新登入', 'info');
});

// 匯入帳號
btnImportAccounts.addEventListener('click', async () => {
    try {
        const result = await dialog.showOpenDialog({
            title: '選擇帳號清單文件',
            filters: [
                { name: '文本文件', extensions: ['txt'] }
            ],
            properties: ['openFile']
        });
        
        if (result.canceled || !result.filePaths.length) {
            return;
        }
        
        const filePath = result.filePaths[0];
        const content = fs.readFileSync(filePath, 'utf-8');
        
        accounts = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));
        
        accountCount.textContent = `已匯入 ${accounts.length} 個帳號`;
        renderTaskList();
        
    } catch (error) {
        alert(`匯入失敗: ${error.message}`);
    }
});

// 渲染任務列表
function renderTaskList() {
    taskListContainer.innerHTML = accounts.map((username, index) => `
        <div class="task-item" data-index="${index}">
            <span class="task-number">${index + 1}</span>
            <span class="task-username">@${username}</span>
            <span class="task-status">等待中</span>
        </div>
    `).join('');
}

// 開始群發
btnStartBatch.addEventListener('click', async () => {
    if (accounts.length === 0) {
        alert('請先匯入帳號清單');
        return;
    }
    
    const message = messageInput.value.trim();
    if (!message) {
        alert('請輸入要發送的訊息');
        return;
    }
    
    const confirmed = confirm(`確定要向 ${accounts.length} 個帳號發送訊息嗎？`);
    if (!confirmed) return;
    
    isRunning = true;
    isPaused = false;
    currentTaskIndex = 0;
    
    btnStartBatch.disabled = true;
    btnPauseBatch.disabled = false;
    btnStopBatch.disabled = false;
    btnImportAccounts.disabled = true;
    
    const tasks = accounts.map(username => ({ username }));
    
    try {
        await ipcRenderer.invoke('start-batch-dm', { tasks, message });
    } catch (error) {
        alert(`群發失敗: ${error.message}`);
        resetButtons();
    }
});

// 暫停
btnPauseBatch.addEventListener('click', async () => {
    await ipcRenderer.invoke('pause-tasks');
    isPaused = true;
    btnPauseBatch.disabled = true;
    btnResumeBatch.disabled = false;
    progressInfo.textContent = '⏸️ 已暫停';
});

// 繼續
btnResumeBatch.addEventListener('click', async () => {
    await ipcRenderer.invoke('resume-tasks');
    isPaused = false;
    btnPauseBatch.disabled = false;
    btnResumeBatch.disabled = true;
    progressInfo.textContent = '▶️ 繼續執行中...';
});

// 停止
btnStopBatch.addEventListener('click', async () => {
    const confirmed = confirm('確定要停止所有任務嗎？');
    if (!confirmed) return;
    
    await ipcRenderer.invoke('stop-tasks');
    resetButtons();
    progressInfo.textContent = '⏹️ 已停止';
});

// 重置按鈕
function resetButtons() {
    isRunning = false;
    isPaused = false;
    btnStartBatch.disabled = false;
    btnPauseBatch.disabled = true;
    btnResumeBatch.disabled = true;
    btnStopBatch.disabled = true;
    btnImportAccounts.disabled = false;
}

// 監聽任務開始
ipcRenderer.on('task-start', (event, data) => {
    const taskItem = document.querySelector(`[data-index="${data.index}"]`);
    if (taskItem) {
        const statusEl = taskItem.querySelector('.task-status');
        statusEl.textContent = '發送中...';
        statusEl.className = 'task-status task-running';
        taskItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    progressInfo.textContent = `📤 正在發送給 @${data.username} (${data.index + 1}/${accounts.length})`;
});

// 監聽任務完成
ipcRenderer.on('task-complete', (event, data) => {
    const taskItem = document.querySelector(`[data-index="${data.index}"]`);
    if (taskItem) {
        const statusEl = taskItem.querySelector('.task-status');
        if (data.success) {
            statusEl.textContent = '✅ 成功';
            statusEl.className = 'task-status task-success';
        } else {
            statusEl.textContent = `❌ 失敗: ${data.error}`;
            statusEl.className = 'task-status task-failed';
        }
    }
});

// 監聽延遲
ipcRenderer.on('task-delay', (event, data) => {
    progressInfo.textContent = `⏳ 延遲 ${data.delay} 秒...`;
});

// 監聽批次完成
ipcRenderer.on('batch-complete', () => {
    progressInfo.textContent = '🎉 全部任務完成！';
    resetButtons();
});

// 匯出粉絲
btnFetchFollowers.addEventListener('click', async () => {
    const username = followersUsername.value.trim();
    if (!username) {
        alert('請輸入 Instagram 帳號名稱');
        return;
    }
    
    const max = parseInt(maxFollowers.value) || 1000;
    
    btnFetchFollowers.disabled = true;
    followersProgress.textContent = '正在抓取粉絲...';
    
    try {
        const result = await ipcRenderer.invoke('fetch-followers', { username, maxFollowers: max });
        
        if (result.success) {
            // 保存到文件
            const savePath = await dialog.showSaveDialog({
                title: '保存粉絲列表',
                defaultPath: `${username}_followers.txt`,
                filters: [
                    { name: '文本文件', extensions: ['txt'] }
                ]
            });
            
            if (!savePath.canceled) {
                fs.writeFileSync(savePath.filePath, result.followers.join('\n'));
                followersProgress.textContent = `✅ 成功匯出 ${result.followers.length} 個粉絲`;
            }
        } else {
            followersProgress.textContent = `❌ 抓取失敗: ${result.error}`;
        }
    } catch (error) {
        followersProgress.textContent = `❌ 抓取失敗: ${error.message}`;
    } finally {
        btnFetchFollowers.disabled = false;
    }
});

// 監聽粉絲抓取進度
ipcRenderer.on('followers-progress', (event, data) => {
    followersProgress.textContent = data.status;
});

// 載入歷史記錄
btnLoadHistory.addEventListener('click', async () => {
    try {
        const history = await ipcRenderer.invoke('get-history');
        
        if (history.length === 0) {
            historyContainer.innerHTML = '<p class="empty-message">沒有歷史記錄</p>';
            return;
        }
        
        historyContainer.innerHTML = history.map(task => `
            <div class="history-item ${task.status}">
                <div class="history-username">@${task.username}</div>
                <div class="history-message">${task.message}</div>
                <div class="history-status">${task.status === 'completed' ? '✅ 成功' : '❌ 失敗'}</div>
                <div class="history-time">${new Date(task.created_at).toLocaleString()}</div>
                ${task.error ? `<div class="history-error">${task.error}</div>` : ''}
            </div>
        `).join('');
    } catch (error) {
        alert(`載入歷史記錄失敗: ${error.message}`);
    }
});

// 清除歷史記錄
btnClearHistory.addEventListener('click', async () => {
    const confirmed = confirm('確定要清除所有歷史記錄嗎？');
    if (!confirmed) return;
    
    try {
        await ipcRenderer.invoke('clear-history');
        historyContainer.innerHTML = '<p class="empty-message">沒有歷史記錄</p>';
        alert('✅ 歷史記錄已清除');
    } catch (error) {
        alert(`清除失敗: ${error.message}`);
    }
});

// 初始化應用
init();

