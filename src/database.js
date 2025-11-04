const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

class Database {
    constructor() {
        const userDataPath = app.getPath('userData');
        this.dbPath = path.join(userDataPath, 'igdm.db');
        this.db = null;
    }

    // 初始化數據庫
    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('數據庫連接失敗:', err);
                    reject(err);
                } else {
                    console.log('數據庫連接成功');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    // 創建表
    async createTables() {
        const tables = [
            // 任務記錄表
            `CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT NOT NULL,
                error TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME
            )`,
            
            // Cookie 存儲表
            `CREATE TABLE IF NOT EXISTS cookies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // 授權記錄表
            `CREATE TABLE IF NOT EXISTS licenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                license_key TEXT NOT NULL UNIQUE,
                device_id TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active INTEGER DEFAULT 1
            )`,
            
            // 帳號列表表
            `CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                notes TEXT,
                tags TEXT,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const sql of tables) {
            await this.run(sql);
        }
    }

    // 執行 SQL
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    // 查詢單條
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // 查詢多條
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // 添加任務
    async addTask(task) {
        const sql = `INSERT INTO tasks (username, message, status, error, completed_at) 
                     VALUES (?, ?, ?, ?, datetime('now'))`;
        return await this.run(sql, [
            task.username,
            task.message,
            task.status,
            task.error || null
        ]);
    }

    // 獲取歷史記錄
    async getHistory(limit = 100) {
        const sql = `SELECT * FROM tasks ORDER BY created_at DESC LIMIT ?`;
        return await this.all(sql, [limit]);
    }

    // 清除歷史記錄
    async clearHistory() {
        const sql = `DELETE FROM tasks`;
        return await this.run(sql);
    }

    // 保存 Cookies (兼容舊版)
    async saveCookies(cookies) {
        // 先刪除舊的
        await this.run(`DELETE FROM cookies`);
        
        // 插入新的
        const sql = `INSERT INTO cookies (data) VALUES (?)`;
        return await this.run(sql, [JSON.stringify(cookies)]);
    }

    // 獲取 Cookies (兼容舊版)
    async getCookies() {
        const sql = `SELECT data FROM cookies ORDER BY updated_at DESC LIMIT 1`;
        const row = await this.get(sql);
        
        if (row && row.data) {
            return JSON.parse(row.data);
        }
        
        return null;
    }

    // 保存 Session (新版 API)
    async saveSession(sessionData) {
        // 先刪除舊的
        await this.run(`DELETE FROM cookies`);
        
        // 插入新的 session 資料
        const sql = `INSERT INTO cookies (data) VALUES (?)`;
        return await this.run(sql, [JSON.stringify(sessionData)]);
    }

    // 獲取 Session (新版 API)
    async getSession() {
        const sql = `SELECT data FROM cookies ORDER BY updated_at DESC LIMIT 1`;
        const row = await this.get(sql);
        
        if (row && row.data) {
            try {
                return JSON.parse(row.data);
            } catch (error) {
                console.error('解析 session 失敗:', error);
                return null;
            }
        }
        
        return null;
    }

    // 保存授權
    async saveLicense(licenseKey, deviceId, expiresAt) {
        const sql = `INSERT OR REPLACE INTO licenses (license_key, device_id, expires_at) 
                     VALUES (?, ?, ?)`;
        return await this.run(sql, [licenseKey, deviceId, expiresAt]);
    }

    // 獲取授權
    async getLicense() {
        const sql = `SELECT * FROM licenses WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1`;
        return await this.get(sql);
    }

    // 添加帳號
    async addAccount(username, notes = '', tags = '') {
        const sql = `INSERT OR IGNORE INTO accounts (username, notes, tags) VALUES (?, ?, ?)`;
        return await this.run(sql, [username, notes, tags]);
    }

    // 批量添加帳號
    async addAccounts(usernames) {
        for (const username of usernames) {
            await this.addAccount(username);
        }
    }

    // 獲取所有帳號
    async getAccounts() {
        const sql = `SELECT * FROM accounts ORDER BY added_at DESC`;
        return await this.all(sql);
    }

    // 刪除帳號
    async deleteAccount(username) {
        const sql = `DELETE FROM accounts WHERE username = ?`;
        return await this.run(sql, [username]);
    }

    // 關閉數據庫
    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = Database;

