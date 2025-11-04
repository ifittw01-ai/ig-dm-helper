const axios = require('axios');
const crypto = require('crypto');

class InstagramAPI {
    constructor() {
        this.baseURL = 'https://www.instagram.com';
        this.session = null;
        this.cookies = {};
        this.csrfToken = null;
        this.userId = null;
        this.username = null;
        
        // 創建 axios 實例
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            maxRedirects: 2,  // 限制重定向次數，防止無限循環
            validateStatus: function (status) {
                // 接受 2xx 和部分 3xx 狀態碼
                return (status >= 200 && status < 300) || status === 302;
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': 'https://www.instagram.com/',
                'Origin': 'https://www.instagram.com'
            }
        });

        // 攔截請求，自動添加 Cookie 和 CSRF Token
        this.client.interceptors.request.use(config => {
            if (this.csrfToken) {
                config.headers['X-CSRFToken'] = this.csrfToken;
            }
            if (Object.keys(this.cookies).length > 0) {
                config.headers['Cookie'] = this.buildCookieString();
            }
            return config;
        });

        // 攔截響應，自動保存 Cookie
        this.client.interceptors.response.use(response => {
            this.saveCookiesFromResponse(response);
            return response;
        }, error => {
            if (error.response) {
                this.saveCookiesFromResponse(error.response);
                
                // 記錄詳細錯誤信息
                console.error('Instagram API Error:', {
                    url: error.config?.url,
                    method: error.config?.method,
                    status: error.response?.status,
                    statusText: error.response?.statusText
                });
                
                // 檢查是否需要驗證（Challenge Required）
                if (error.response?.status === 401 || 
                    error.response?.data?.message === 'challenge_required' ||
                    error.response?.headers?.location?.includes('challenge')) {
                    console.error('⚠️ 帳號需要驗證！請在瀏覽器登入完成驗證。');
                }
            }
            
            // 檢查是否是重定向錯誤 - 轉換為友好的錯誤對象
            if (error.message?.includes('Maximum number of redirects') || 
                error.message?.includes('maximum redirect')) {
                console.error('⚠️ 重定向次數過多！可能原因：');
                console.error('   1. 帳號需要驗證（Challenge）');
                console.error('   2. Session 已過期');
                console.error('   3. 帳號被臨時限制');
                console.error('   👉 建議：在瀏覽器登入 Instagram 完成驗證後再試');
                
                // 返回一個友好的錯誤對象，防止崩溃
                const friendlyError = new Error('Session 已過期或帳號需要驗證，請重新登入');
                friendlyError.code = 'REDIRECT_ERROR';
                friendlyError.isLoginError = true;
                return Promise.reject(friendlyError);
            }
            
            // 網絡超時錯誤
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                const timeoutError = new Error('請求超時，請檢查網絡連接');
                timeoutError.code = 'TIMEOUT';
                return Promise.reject(timeoutError);
            }
            
            return Promise.reject(error);
        });
    }

    /**
     * 從響應中保存 Cookie
     */
    saveCookiesFromResponse(response) {
        const setCookies = response.headers['set-cookie'];
        if (setCookies) {
            setCookies.forEach(cookie => {
                const parts = cookie.split(';')[0].split('=');
                const name = parts[0];
                const value = parts.slice(1).join('=');
                this.cookies[name] = value;
                
                // 保存 CSRF Token
                if (name === 'csrftoken') {
                    this.csrfToken = value;
                }
            });
        }
    }

    /**
     * 構建 Cookie 字串
     */
    buildCookieString() {
        return Object.entries(this.cookies)
            .map(([name, value]) => `${name}=${value}`)
            .join('; ');
    }

    /**
     * 初始化 - 獲取基本的 Cookie 和 CSRF Token
     */
    async initialize() {
        try {
            const response = await this.client.get('/');
            
            // 從 HTML 中提取 CSRF Token（如果沒有從 Cookie 中獲取到）
            if (!this.csrfToken && response.data) {
                const csrfMatch = response.data.match(/"csrf_token":"([^"]+)"/);
                if (csrfMatch) {
                    this.csrfToken = csrfMatch[1];
                    this.cookies['csrftoken'] = this.csrfToken;
                }
            }

            return {
                success: true,
                message: 'Instagram API 初始化成功'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 登入 Instagram
     */
    async login(username, password) {
        try {
            // 先初始化獲取 CSRF Token
            await this.initialize();

            // 生成加密時間戳
            const timestamp = Math.floor(Date.now() / 1000);
            const enc_password = `#PWD_INSTAGRAM_BROWSER:0:${timestamp}:${password}`;

            // 發送登入請求
            const response = await this.client.post('/api/v1/web/accounts/login/ajax/', {
                username: username,
                enc_password: enc_password,
                queryParams: {},
                optIntoOneTap: false
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-IG-App-ID': '936619743392459'
                }
            });

            if (response.data.authenticated) {
                this.username = username;
                this.userId = response.data.userId;
                
                return {
                    success: true,
                    userId: this.userId,
                    username: this.username
                };
            } else {
                return {
                    success: false,
                    error: '登入失敗：帳號或密碼錯誤'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: `登入失敗：${error.message}`
            };
        }
    }

    /**
     * 載入已保存的 Session
     */
    loadSession(sessionData) {
        if (sessionData && typeof sessionData === 'object') {
            // 恢复 cookies
            if (sessionData.cookies) {
                this.cookies = { ...sessionData.cookies };
                this.csrfToken = this.cookies['csrftoken'] || null;
            }
            // 恢复用户信息
            if (sessionData.userId) {
                this.userId = sessionData.userId;
            }
            if (sessionData.username) {
                this.username = sessionData.username;
            }
            return true;
        }
        return false;
    }

    /**
     * 獲取當前 Session 數據
     */
    getSessionData() {
        return {
            cookies: this.cookies,
            csrfToken: this.csrfToken,
            userId: this.userId,
            username: this.username
        };
    }

    /**
     * 檢查登入狀態
     */
    async checkLoginStatus() {
        try {
            // 方法 1: 嘗試訪問主頁面獲取用戶信息
            const response = await this.client.get('/');
            
            if (response.data) {
                // 從 HTML 中提取用戶信息
                const userMatch = response.data.match(/"username":"([^"]+)"/);
                const idMatch = response.data.match(/"id":"([^"]+)"/);
                
                if (userMatch && idMatch) {
                    if (!this.username) this.username = userMatch[1];
                    if (!this.userId) this.userId = idMatch[1];
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('檢查登入狀態失敗:', error.message);
            return false;
        }
    }

    /**
     * 獲取用戶 ID（透過用戶名）
     */
    async getUserId(username) {
        try {
            // 清理输入：移除 @、URL、空格等
            username = username
                .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '') // 移除完整 URL
                .replace(/\/$/, '') // 移除结尾斜杠
                .replace('@', '') // 移除 @
                .trim(); // 移除空格
            
            // 如果清理后为空，返回 null
            if (!username) {
                console.error('无效的用户名');
                return null;
            }
            
            // 方法 1: 尝试使用 API
            try {
                const apiResponse = await this.client.get(`/api/v1/users/web_profile_info/`, {
                    params: {
                        username: username
                    },
                    headers: {
                        'X-IG-App-ID': '936619743392459',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (apiResponse.data?.data?.user?.id) {
                    return apiResponse.data.data.user.id.toString();
                }
            } catch (apiError) {
                console.log('API 获取用户 ID 失败，尝试备用方法...');
            }
            
            // 方法 2: 解析 HTML
            const response = await this.client.get(`/${username}/`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.data) {
                // 嘗試從 HTML 中提取用戶 ID
                const match = response.data.match(/"user_id":"(\d+)"/);
                if (match) {
                    return match[1];
                }
                
                // 备用: 查找 profilePage_<user_id>
                const profileMatch = response.data.match(/profilePage_(\d+)/);
                if (profileMatch) {
                    return profileMatch[1];
                }
                
                // 備用方案：從 JSON 數據中查找
                const jsonMatch = response.data.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
                if (jsonMatch) {
                    try {
                        const jsonData = JSON.parse(jsonMatch[1]);
                        if (jsonData.mainEntityofPage && jsonData.mainEntityofPage['@id']) {
                            const idMatch = jsonData.mainEntityofPage['@id'].match(/\/(\d+)\//);
                            if (idMatch) return idMatch[1];
                        }
                    } catch (e) {}
                }
            }
            
            return null;
        } catch (error) {
            console.error(`獲取用戶 ID 失敗 (@${username}):`, error.message);
            return null;
        }
    }

    /**
     * 獲取私訊 Thread ID
     */
    async getThreadId(userId) {
        try {
            // 先嘗試從現有對話中查找
            const response = await this.client.get('/api/v1/direct_v2/inbox/', {
                headers: {
                    'X-IG-App-ID': '936619743392459'
                }
            });

            if (response.data && response.data.inbox && response.data.inbox.threads) {
                const thread = response.data.inbox.threads.find(t => 
                    t.users.some(u => u.pk === userId)
                );
                if (thread) {
                    return thread.thread_id;
                }
            }

            // 如果沒有現有對話，創建新對話
            const createResponse = await this.client.post('/api/v1/direct_v2/create_group_thread/', {
                recipient_users: JSON.stringify([userId])
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-IG-App-ID': '936619743392459'
                }
            });

            if (createResponse.data && createResponse.data.thread_id) {
                return createResponse.data.thread_id;
            }

            return null;
        } catch (error) {
            console.error(`獲取 Thread ID 失敗: ${error.message}`);
            return null;
        }
    }

    /**
     * 發送私訊
     */
    async sendDirectMessage(username, message) {
        try {
            // 1. 獲取目標用戶的 ID
            const userId = await this.getUserId(username);
            if (!userId) {
                return {
                    success: false,
                    username,
                    error: '找不到該用戶'
                };
            }

            // 2. 獲取或創建對話 Thread
            const threadId = await this.getThreadId(userId);
            if (!threadId) {
                return {
                    success: false,
                    username,
                    error: '無法創建對話'
                };
            }

            // 3. 發送訊息
            const clientContext = crypto.randomBytes(16).toString('hex');
            const response = await this.client.post(`/api/v1/direct_v2/threads/broadcast/text/`, {
                recipient_users: JSON.stringify([userId]),
                thread_ids: JSON.stringify([threadId]),
                client_context: clientContext,
                text: message
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-IG-App-ID': '936619743392459'
                }
            });

            if (response.data && response.data.status === 'ok') {
                return {
                    success: true,
                    username,
                    threadId
                };
            } else {
                return {
                    success: false,
                    username,
                    error: '發送失敗'
                };
            }
        } catch (error) {
            return {
                success: false,
                username,
                error: error.message
            };
        }
    }

    /**
     * 獲取粉絲列表
     * @param {string} username - 目標用戶名
     * @param {object} options - 選項
     * @param {number} options.start - 開始位置（從第幾個開始，默認 1）
     * @param {number} options.end - 結束位置（到第幾個結束，0 = 不限制）
     * @param {number} options.maxCount - 最多抓取數量（0 = 不限制，會被 start/end 覆蓋）
     * @param {function} options.onProgress - 進度回調函數 (current, total, status)
     */
    async fetchFollowers(username, options = {}) {
        try {
            // 解析選項
            const {
                start = 1,           // 從第 1 個開始
                end = 0,             // 0 = 抓到最後
                maxCount = 0,        // 兼容舊版本
                onProgress = null
            } = options;

            // 計算實際需要抓取的數量
            let targetCount = 0;
            if (end > 0) {
                targetCount = end; // 抓到第 end 個
            } else if (maxCount > 0) {
                targetCount = maxCount; // 使用 maxCount
            } else {
                targetCount = 0; // 不限制
            }

            // 1. 獲取用戶 ID
            const userId = await this.getUserId(username);
            if (!userId) {
                return {
                    success: false,
                    error: '找不到該用戶'
                };
            }

            const allFollowers = [];  // 所有抓取的粉絲
            const followers = [];     // 過濾後的粉絲（start-end 範圍）
            let nextMaxId = null;
            let hasMore = true;
            let totalFetched = 0;

            // 2. 分頁獲取粉絲
            while (hasMore && (targetCount === 0 || totalFetched < targetCount)) {
                const params = {
                    count: 50
                };
                if (nextMaxId) {
                    params.max_id = nextMaxId;
                }

                const response = await this.client.get(`/api/v1/friendships/${userId}/followers/`, {
                    params,
                    headers: {
                        'X-IG-App-ID': '936619743392459'
                    }
                });

                if (response.data && response.data.users) {
                    // 將新獲取的粉絲加入總列表
                    response.data.users.forEach(user => {
                        totalFetched++;
                        allFollowers.push({
                            username: user.username,
                            userId: user.pk,
                            fullName: user.full_name
                        });

                        // 檢查是否在指定範圍內
                        if (totalFetched >= start && (end === 0 || totalFetched <= end)) {
                            followers.push({
                                username: user.username,
                                userId: user.pk,
                                fullName: user.full_name
                            });
                        }
                    });

                    nextMaxId = response.data.next_max_id;
                    hasMore = !!nextMaxId && (targetCount === 0 || totalFetched < targetCount);
                    
                    // 調用進度回調 - 實時顯示
                    if (onProgress) {
                        let status;
                        if (start > 1 || end > 0) {
                            // 顯示範圍抓取進度
                            const rangeText = end > 0 
                                ? `第 ${start}-${end} 個` 
                                : `從第 ${start} 個開始`;
                            status = `正在抓取 ${rangeText}... 已掃描 ${totalFetched} 個，符合條件 ${followers.length} 個`;
                        } else if (targetCount > 0) {
                            status = `正在抓取粉絲... ${totalFetched}/${targetCount} 個`;
                        } else {
                            status = `正在抓取粉絲... 已獲取 ${totalFetched} 個`;
                        }
                        onProgress(followers.length, totalFetched, status);
                    }
                } else {
                    hasMore = false;
                }

                // 延遲避免被限制
                if (hasMore) {
                    await this.sleep(1000);
                }
            }

            return {
                success: true,
                followers: followers.map(f => f.username),
                count: followers.length,
                totalScanned: totalFetched,
                range: {
                    start: start,
                    end: end > 0 ? end : totalFetched
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 獲取關注列表（Following）
     * @param {string} username - 目標用戶名
     * @param {object} options - 選項
     * @param {number} options.start - 開始位置
     * @param {number} options.end - 結束位置（0 = 不限制）
     * @param {number} options.maxCount - 最多抓取數量
     * @param {function} options.onProgress - 進度回調函數
     */
    async fetchFollowing(username, options = {}) {
        try {
            const {
                start = 1,
                end = 0,
                maxCount = 0,
                onProgress = null
            } = options;

            let targetCount = 0;
            if (end > 0) {
                targetCount = end;
            } else if (maxCount > 0) {
                targetCount = maxCount;
            } else {
                targetCount = 0;
            }

            // 1. 獲取用戶 ID
            const userId = await this.getUserId(username);
            if (!userId) {
                return {
                    success: false,
                    error: '找不到該用戶'
                };
            }

            const allFollowing = [];
            const following = [];
            let nextMaxId = null;
            let hasMore = true;
            let totalFetched = 0;

            // 2. 分頁獲取關注列表
            while (hasMore && (targetCount === 0 || totalFetched < targetCount)) {
                const params = {
                    count: 50
                };
                if (nextMaxId) {
                    params.max_id = nextMaxId;
                }

                const response = await this.client.get(`/api/v1/friendships/${userId}/following/`, {
                    params,
                    headers: {
                        'X-IG-App-ID': '936619743392459'
                    }
                });

                if (response.data && response.data.users) {
                    response.data.users.forEach(user => {
                        totalFetched++;
                        allFollowing.push({
                            username: user.username,
                            userId: user.pk,
                            fullName: user.full_name
                        });

                        if (totalFetched >= start && (end === 0 || totalFetched <= end)) {
                            following.push({
                                username: user.username,
                                userId: user.pk,
                                fullName: user.full_name
                            });
                        }
                    });

                    nextMaxId = response.data.next_max_id;
                    hasMore = !!nextMaxId && (targetCount === 0 || totalFetched < targetCount);
                    
                    if (onProgress) {
                        let status;
                        if (start > 1 || end > 0) {
                            const rangeText = end > 0 
                                ? `第 ${start}-${end} 個` 
                                : `從第 ${start} 個開始`;
                            status = `正在抓取 ${rangeText}... 已掃描 ${totalFetched} 個，符合條件 ${following.length} 個`;
                        } else if (targetCount > 0) {
                            status = `正在抓取關注列表... ${totalFetched}/${targetCount} 個`;
                        } else {
                            status = `正在抓取關注列表... 已獲取 ${totalFetched} 個`;
                        }
                        onProgress(following.length, totalFetched, status);
                    }
                } else {
                    hasMore = false;
                }

                if (hasMore) {
                    await this.sleep(1000);
                }
            }

            return {
                success: true,
                following: following.map(f => f.username),
                count: following.length,
                totalScanned: totalFetched,
                range: {
                    start: start,
                    end: end > 0 ? end : totalFetched
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 獲取用戶詳細資料
     * @param {string} username - 用戶名
     */
    async getUserInfo(username) {
        try {
            // 清理输入：移除 @、URL、空格等（与 getUserId 一致）
            username = username
                .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '') // 移除完整 URL
                .replace(/\/$/, '') // 移除结尾斜杠
                .replace('@', '') // 移除 @
                .trim(); // 移除空格
            
            // 如果清理后为空，返回错误
            if (!username) {
                return {
                    success: false,
                    error: '无效的用户名'
                };
            }
            
            // 方法 1：尝试使用 API 端点
            try {
                const apiResponse = await this.client.get(`/api/v1/users/web_profile_info/`, {
                    params: {
                        username: username
                    },
                    headers: {
                        'X-IG-App-ID': '936619743392459',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (apiResponse.data && apiResponse.data.data && apiResponse.data.data.user) {
                    const user = apiResponse.data.data.user;
                    return {
                        success: true,
                        userInfo: {
                            username: user.username,
                            fullName: user.full_name || '',
                            bio: user.biography || '',
                            followerCount: user.edge_followed_by?.count || 0,
                            followingCount: user.edge_follow?.count || 0,
                            postCount: user.edge_owner_to_timeline_media?.count || 0,
                            isPrivate: user.is_private || false,
                            isVerified: user.is_verified || false,
                            profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url || ''
                        }
                    };
                }
            } catch (apiError) {
                console.log('API 方法失败，尝试备用方法...');
            }
            
            // 方法 2：备用方法 - 解析 HTML
            const response = await this.client.get(`/${username}/`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml'
                }
            });

            if (response.data) {
                // 尝试多种方式提取数据
                
                // 尝试 1：JSON-LD
                const ldJsonMatch = response.data.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
                if (ldJsonMatch) {
                    try {
                        const jsonData = JSON.parse(ldJsonMatch[1]);
                        return {
                            success: true,
                            userInfo: {
                                username: username,
                                fullName: jsonData.name || '',
                                bio: jsonData.description || '',
                                followerCount: 0,
                                followingCount: 0,
                                postCount: 0,
                                isPrivate: false,
                                isVerified: false,
                                profilePicUrl: jsonData.image || ''
                            }
                        };
                    } catch (e) {}
                }
                
                // 尝试 2：查找 window._sharedData
                const sharedDataMatch = response.data.match(/window\._sharedData\s*=\s*({.*?});<\/script>/s);
                if (sharedDataMatch) {
                    try {
                        const sharedData = JSON.parse(sharedDataMatch[1]);
                        const userInfo = sharedData.entry_data?.ProfilePage?.[0]?.graphql?.user;
                        
                        if (userInfo) {
                            return {
                                success: true,
                                userInfo: {
                                    username: userInfo.username,
                                    fullName: userInfo.full_name || '',
                                    bio: userInfo.biography || '',
                                    followerCount: userInfo.edge_followed_by?.count || 0,
                                    followingCount: userInfo.edge_follow?.count || 0,
                                    postCount: userInfo.edge_owner_to_timeline_media?.count || 0,
                                    isPrivate: userInfo.is_private || false,
                                    isVerified: userInfo.is_verified || false,
                                    profilePicUrl: userInfo.profile_pic_url_hd || ''
                                }
                            };
                        }
                    } catch (e) {}
                }
            }
            
            return {
                success: false,
                error: '無法解析用戶資訊（可能需要登入）'
            };
        } catch (error) {
            // 更详细的错误处理
            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: `用戶 @${username} 不存在或帳號已刪除`
                };
            } else if (error.response?.status === 429) {
                return {
                    success: false,
                    error: '請求過於頻繁，請稍後再試'
                };
            } else {
                console.error(`獲取用戶資訊失敗 (@${username}):`, error.message);
                return {
                    success: false,
                    error: error.message
                };
            }
        }
    }

    /**
     * 關注用戶
     * @param {string} username - 要關注的用戶名
     */
    async followUser(username) {
        try {
            const userId = await this.getUserId(username);
            if (!userId) {
                return {
                    success: false,
                    error: '找不到該用戶'
                };
            }

            const response = await this.client.post(`/api/v1/friendships/create/${userId}/`, {}, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-IG-App-ID': '936619743392459'
                }
            });

            if (response.data && response.data.status === 'ok') {
                return {
                    success: true,
                    username
                };
            } else {
                return {
                    success: false,
                    username,
                    error: '關注失敗'
                };
            }
        } catch (error) {
            return {
                success: false,
                username,
                error: error.message
            };
        }
    }

    /**
     * 取消關注用戶
     * @param {string} username - 要取消關注的用戶名
     */
    async unfollowUser(username) {
        try {
            const userId = await this.getUserId(username);
            if (!userId) {
                return {
                    success: false,
                    error: '找不到該用戶'
                };
            }

            const response = await this.client.post(`/api/v1/friendships/destroy/${userId}/`, {}, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-IG-App-ID': '936619743392459'
                }
            });

            if (response.data && response.data.status === 'ok') {
                return {
                    success: true,
                    username
                };
            } else {
                return {
                    success: false,
                    username,
                    error: '取消關注失敗'
                };
            }
        } catch (error) {
            return {
                success: false,
                username,
                error: error.message
            };
        }
    }

    /**
     * 獲取私訊對話列表
     * @param {number} limit - 獲取數量限制
     */
    async getInbox(limit = 20) {
        try {
            const response = await this.client.get('/api/v1/direct_v2/inbox/', {
                params: {
                    limit: limit
                },
                headers: {
                    'X-IG-App-ID': '936619743392459'
                }
            });

            if (response.data && response.data.inbox && response.data.inbox.threads) {
                const threads = response.data.inbox.threads.map(thread => ({
                    threadId: thread.thread_id,
                    threadTitle: thread.thread_title,
                    users: thread.users.map(u => ({
                        username: u.username,
                        userId: u.pk,
                        fullName: u.full_name
                    })),
                    lastMessage: thread.last_permanent_item ? {
                        text: thread.last_permanent_item.text || '',
                        timestamp: thread.last_permanent_item.timestamp,
                        userId: thread.last_permanent_item.user_id
                    } : null,
                    unreadCount: thread.read_state || 0
                }));

                return {
                    success: true,
                    threads: threads,
                    count: threads.length
                };
            }

            return {
                success: false,
                error: '無法獲取對話列表'
            };
        } catch (error) {
            console.error('獲取對話列表失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 獲取對話詳細信息
     * @param {string} threadId - 對話 ID
     * @param {number} limit - 消息數量限制
     */
    async getThread(threadId, limit = 20) {
        try {
            const response = await this.client.get(`/api/v1/direct_v2/threads/${threadId}/`, {
                params: {
                    limit: limit
                },
                headers: {
                    'X-IG-App-ID': '936619743392459'
                }
            });

            if (response.data && response.data.thread) {
                const thread = response.data.thread;
                const messages = thread.items.map(item => ({
                    itemId: item.item_id,
                    userId: item.user_id,
                    timestamp: item.timestamp,
                    text: item.text || '',
                    type: item.item_type
                }));

                return {
                    success: true,
                    threadId: threadId,
                    messages: messages,
                    users: thread.users.map(u => ({
                        username: u.username,
                        userId: u.pk
                    }))
                };
            }

            return {
                success: false,
                error: '無法獲取對話詳情'
            };
        } catch (error) {
            console.error('獲取對話詳情失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 發送圖片私訊
     * @param {string} username - 目標用戶名
     * @param {string} imagePath - 圖片路徑
     * @param {string} caption - 圖片說明（可選）
     */
    async sendImageMessage(username, imagePath, caption = '') {
        try {
            // 1. 獲取目標用戶的 ID
            const userId = await this.getUserId(username);
            if (!userId) {
                return {
                    success: false,
                    username,
                    error: '找不到該用戶'
                };
            }

            // 2. 獲取或創建對話 Thread
            const threadId = await this.getThreadId(userId);
            if (!threadId) {
                return {
                    success: false,
                    username,
                    error: '無法創建對話'
                };
            }

            // 注意：發送圖片需要上傳到 Instagram 服務器
            // 這需要額外的上傳 API 實現
            // 目前僅返回提示信息
            return {
                success: false,
                username,
                error: '圖片上傳功能正在開發中'
            };
        } catch (error) {
            return {
                success: false,
                username,
                error: error.message
            };
        }
    }

    /**
     * 批量關注用戶
     * @param {Array<string>} usernames - 用戶名列表
     * @param {function} onProgress - 進度回調
     */
    async batchFollow(usernames, onProgress = null) {
        const results = [];
        
        for (let i = 0; i < usernames.length; i++) {
            const username = usernames[i];
            
            if (onProgress) {
                onProgress(i + 1, usernames.length, `正在關注 @${username}...`);
            }

            const result = await this.followUser(username);
            results.push(result);

            // 延遲避免被限制（關注操作需要更長的延遲）
            if (i < usernames.length - 1) {
                await this.sleep(3000 + Math.random() * 2000); // 3-5 秒
            }
        }

        return {
            success: true,
            results: results,
            successCount: results.filter(r => r.success).length,
            failedCount: results.filter(r => !r.success).length
        };
    }

    /**
     * 批量取消關注用戶
     * @param {Array<string>} usernames - 用戶名列表
     * @param {function} onProgress - 進度回調
     */
    async batchUnfollow(usernames, onProgress = null) {
        const results = [];
        
        for (let i = 0; i < usernames.length; i++) {
            const username = usernames[i];
            
            if (onProgress) {
                onProgress(i + 1, usernames.length, `正在取消關注 @${username}...`);
            }

            const result = await this.unfollowUser(username);
            results.push(result);

            // 延遲避免被限制
            if (i < usernames.length - 1) {
                await this.sleep(3000 + Math.random() * 2000); // 3-5 秒
            }
        }

        return {
            success: true,
            results: results,
            successCount: results.filter(r => r.success).length,
            failedCount: results.filter(r => !r.success).length
        };
    }

    /**
     * 延遲函數
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = InstagramAPI;
