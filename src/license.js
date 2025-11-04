const crypto = require('crypto');
const { machineIdSync } = require('node-machine-id');
const CryptoJS = require('crypto-js');

class LicenseManager {
    constructor() {
        this.deviceId = this.getDeviceId();
        this.secretKey = 'FLOWCUBE_SECRET_KEY_2024'; // 實際使用應該更安全
    }

    // 獲取設備唯一標識
    getDeviceId() {
        try {
            return machineIdSync();
        } catch (error) {
            // 如果獲取失敗，生成一個基於硬體信息的 ID
            const os = require('os');
            const hostname = os.hostname();
            const platform = os.platform();
            const arch = os.arch();
            const cpus = os.cpus()[0].model;
            
            const info = `${hostname}-${platform}-${arch}-${cpus}`;
            return crypto.createHash('md5').update(info).digest('hex');
        }
    }

    // Base32 編碼（Crockford 風格）
    base32Encode(buffer) {
        const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
        let result = '';
        let bits = 0;
        let value = 0;

        for (let i = 0; i < buffer.length; i++) {
            value = (value << 8) | buffer[i];
            bits += 8;

            while (bits >= 5) {
                result += alphabet[(value >>> (bits - 5)) & 31];
                bits -= 5;
            }
        }

        if (bits > 0) {
            result += alphabet[(value << (5 - bits)) & 31];
        }

        return result;
    }

    // Base32 解碼
    base32Decode(str) {
        const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
        const lookup = {};
        for (let i = 0; i < alphabet.length; i++) {
            lookup[alphabet[i]] = i;
        }

        const buffer = [];
        let bits = 0;
        let value = 0;

        for (let i = 0; i < str.length; i++) {
            const char = str[i].toUpperCase();
            if (!(char in lookup)) continue;

            value = (value << 5) | lookup[char];
            bits += 5;

            if (bits >= 8) {
                buffer.push((value >>> (bits - 8)) & 255);
                bits -= 8;
            }
        }

        return Buffer.from(buffer);
    }

    // 生成授權序號（這個函數應該在服務端執行）
    generateLicense(deviceId, daysValid = 365) {
        const expiryTime = Date.now() + (daysValid * 24 * 60 * 60 * 1000);
        
        // 構造數據
        const data = {
            deviceId: deviceId.substring(0, 16),
            expiry: expiryTime,
            checksum: ''
        };
        
        // 計算校驗和
        const checksumData = `${data.deviceId}${data.expiry}${this.secretKey}`;
        data.checksum = crypto.createHash('sha256').update(checksumData).digest('hex').substring(0, 8);
        
        // 編碼
        const jsonStr = JSON.stringify(data);
        const encrypted = CryptoJS.AES.encrypt(jsonStr, this.secretKey).toString();
        const licenseKey = this.base32Encode(Buffer.from(encrypted));
        
        // 格式化（每 5 個字符一組）
        return licenseKey.match(/.{1,5}/g).join('-');
    }

    // 驗證授權序號
    validateLicenseKey(licenseKey) {
        try {
            // 移除分隔符
            const cleanKey = licenseKey.replace(/-/g, '');
            
            // 解碼
            const buffer = this.base32Decode(cleanKey);
            const encrypted = buffer.toString();
            
            // 解密
            const decrypted = CryptoJS.AES.decrypt(encrypted, this.secretKey);
            const jsonStr = decrypted.toString(CryptoJS.enc.Utf8);
            
            if (!jsonStr) {
                return { valid: false, error: '無效的授權序號' };
            }
            
            const data = JSON.parse(jsonStr);
            
            // 驗證校驗和
            const checksumData = `${data.deviceId}${data.expiry}${this.secretKey}`;
            const expectedChecksum = crypto.createHash('sha256').update(checksumData).digest('hex').substring(0, 8);
            
            if (data.checksum !== expectedChecksum) {
                return { valid: false, error: '授權序號已被篡改' };
            }
            
            // 驗證設備 ID
            const currentDevicePrefix = this.deviceId.substring(0, 16);
            if (data.deviceId !== currentDevicePrefix) {
                return { valid: false, error: '授權序號與設備不符' };
            }
            
            // 驗證有效期
            if (Date.now() > data.expiry) {
                return { valid: false, error: '授權已過期' };
            }
            
            const daysRemaining = Math.floor((data.expiry - Date.now()) / (24 * 60 * 60 * 1000));
            
            return { 
                valid: true, 
                expiry: new Date(data.expiry),
                daysRemaining: daysRemaining
            };
            
        } catch (error) {
            console.error('驗證授權失敗:', error);
            return { valid: false, error: '授權序號格式錯誤' };
        }
    }

    // 試用模式（7 天）
    generateTrialLicense() {
        return this.generateLicense(this.deviceId, 7);
    }

    // 驗證當前授權（從數據庫讀取）
    async validateLicense() {
        // 這裡應該從數據庫讀取授權信息
        // 簡化起見，返回 true
        return true;
    }

    // 獲取設備信息（用於生成授權）
    getDeviceInfo() {
        const os = require('os');
        
        return {
            deviceId: this.deviceId,
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            memory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB'
        };
    }
}

module.exports = LicenseManager;

