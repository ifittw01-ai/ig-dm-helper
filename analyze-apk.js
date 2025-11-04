/**
 * APK 分析工具
 * 自动扫描反编译的代码，查找新的 API 端点和功能
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
    oldVersion: './decompiled/old',
    newVersion: './decompiled/new',
    outputFile: './APK_ANALYSIS_REPORT.md'
};

// 要搜索的关键字
const KEYWORDS = {
    apiEndpoints: [
        /\/api\/v1\/[a-z_\/]+/gi,
        /direct_v2\/[a-z_\/]+/gi,
        /friendships\/[a-z_\/]+/gi,
        /users\/[a-z_\/]+/gi,
        /media\/[a-z_\/]+/gi
    ],
    headers: [
        /"X-IG-App-ID":\s*"([^"]+)"/gi,
        /"User-Agent":\s*"([^"]+)"/gi,
        /"X-CSRFToken"/gi,
        /"Authorization"/gi
    ],
    methods: [
        /public\s+\w+\s+(\w+)\s*\(/g,
        /private\s+\w+\s+(\w+)\s*\(/g,
        /protected\s+\w+\s+(\w+)\s*\(/g
    ]
};

// 扫描目录
function scanDirectory(dir, pattern, results = new Set()) {
    if (!fs.existsSync(dir)) {
        console.log(`⚠️  目录不存在: ${dir}`);
        return results;
    }

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            scanDirectory(filePath, pattern, results);
        } else if (file.endsWith('.java')) {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                
                if (Array.isArray(pattern)) {
                    pattern.forEach(p => {
                        const matches = content.matchAll(p);
                        for (const match of matches) {
                            results.add(match[0]);
                        }
                    });
                } else {
                    const matches = content.matchAll(pattern);
                    for (const match of matches) {
                        results.add(match[0]);
                    }
                }
            } catch (error) {
                // 忽略无法读取的文件
            }
        }
    }

    return results;
}

// 比较两个版本
function compareVersions() {
    console.log('📊 开始分析 APK...\n');

    const results = {
        newEndpoints: new Set(),
        newHeaders: new Set(),
        oldEndpoints: new Set(),
        oldHeaders: new Set()
    };

    // 扫描新版本
    console.log('🔍 扫描新版本...');
    results.newEndpoints = scanDirectory(CONFIG.newVersion, KEYWORDS.apiEndpoints);
    results.newHeaders = scanDirectory(CONFIG.newVersion, KEYWORDS.headers);
    console.log(`   找到 ${results.newEndpoints.size} 个 API 端点`);
    console.log(`   找到 ${results.newHeaders.size} 个 HTTP Headers`);

    // 扫描旧版本
    console.log('\n🔍 扫描旧版本...');
    results.oldEndpoints = scanDirectory(CONFIG.oldVersion, KEYWORDS.apiEndpoints);
    results.oldHeaders = scanDirectory(CONFIG.oldVersion, KEYWORDS.headers);
    console.log(`   找到 ${results.oldEndpoints.size} 个 API 端点`);
    console.log(`   找到 ${results.oldHeaders.size} 个 HTTP Headers`);

    return results;
}

// 查找差异
function findDifferences(results) {
    const differences = {
        newAPIs: [...results.newEndpoints].filter(x => !results.oldEndpoints.has(x)),
        removedAPIs: [...results.oldEndpoints].filter(x => !results.newEndpoints.has(x)),
        newHeaders: [...results.newHeaders].filter(x => !results.oldHeaders.has(x)),
        removedHeaders: [...results.oldHeaders].filter(x => !results.newHeaders.has(x))
    };

    console.log('\n📈 分析差异...');
    console.log(`   新增 API: ${differences.newAPIs.length}`);
    console.log(`   移除 API: ${differences.removedAPIs.length}`);
    console.log(`   新增 Headers: ${differences.newHeaders.length}`);
    console.log(`   移除 Headers: ${differences.removedHeaders.length}`);

    return differences;
}

// 生成报告
function generateReport(results, differences) {
    const report = `# 📊 APK 分析报告

## 📅 分析日期
${new Date().toLocaleString('zh-TW')}

## 📦 版本信息
- **旧版本**: IGDM10211222SNweb(old).apk
- **新版本**: IGDM10301744SNweb.apk

---

## ✨ 新增 API 端点（${differences.newAPIs.length} 个）

${differences.newAPIs.length > 0 ? differences.newAPIs.map(api => `- \`${api}\``).join('\n') : '无新增'}

---

## ❌ 移除的 API 端点（${differences.removedAPIs.length} 个）

${differences.removedAPIs.length > 0 ? differences.removedAPIs.map(api => `- \`${api}\``).join('\n') : '无移除'}

---

## 🆕 新增 HTTP Headers（${differences.newHeaders.length} 个）

${differences.newHeaders.length > 0 ? differences.newHeaders.map(h => `- \`${h}\``).join('\n') : '无新增'}

---

## 📋 所有 API 端点（新版本，${results.newEndpoints.size} 个）

${[...results.newEndpoints].sort().map(api => `- \`${api}\``).join('\n')}

---

## 🔍 重点关注的新功能

### 基于新增 API 的功能推测：

${differences.newAPIs.length > 0 ? differences.newAPIs.map(api => {
    let feature = '未知功能';
    
    if (api.includes('direct')) feature = '私訊相關功能';
    else if (api.includes('friendship')) feature = '關注/粉絲功能';
    else if (api.includes('media')) feature = '媒體上傳/下載功能';
    else if (api.includes('story')) feature = 'Story 功能';
    else if (api.includes('reels')) feature = 'Reels 功能';
    else if (api.includes('shopping')) feature = '購物功能';
    else if (api.includes('live')) feature = '直播功能';
    else if (api.includes('comment')) feature = '評論功能';
    else if (api.includes('like')) feature = '點讚功能';
    
    return `### ${api}\n**推測功能**: ${feature}\n**優先級**: ${feature.includes('私訊') || feature.includes('關注') ? '高' : '中'}\n`;
}).join('\n') : '無明顯新功能'}

---

## 💡 建議的實現優先級

### 高優先級
${differences.newAPIs.filter(api => 
    api.includes('direct') || api.includes('friendship') || api.includes('user')
).map(api => `- \`${api}\``).join('\n') || '無'}

### 中優先級
${differences.newAPIs.filter(api => 
    api.includes('media') || api.includes('feed') || api.includes('inbox')
).map(api => `- \`${api}\``).join('\n') || '無'}

### 低優先級
${differences.newAPIs.filter(api => 
    api.includes('story') || api.includes('reels') || api.includes('shopping')
).map(api => `- \`${api}\``).join('\n') || '無'}

---

## 📝 下一步行動

1. **研究新增 API**
   - 查看反編譯代碼中的實現細節
   - 確認 API 參數和返回值

2. **測試 API**
   - 使用 Postman 或類似工具測試
   - 記錄請求和響應格式

3. **集成到項目**
   - 在 \`instagram-api.js\` 中實現
   - 添加錯誤處理和重試機制
   - 編寫單元測試

4. **更新文檔**
   - 更新 API 文檔
   - 添加使用示例

---

## 🔗 相關文件

- **反編譯代碼**: \`./decompiled/new/\`
- **差異比較**: 使用 Beyond Compare 或 WinMerge 比較
- **實現代碼**: \`./src/instagram-api.js\`

---

**生成時間**: ${new Date().toLocaleString('zh-TW')}
`;

    fs.writeFileSync(CONFIG.outputFile, report, 'utf-8');
    console.log(`\n✅ 報告已生成: ${CONFIG.outputFile}`);
}

// 主函数
async function main() {
    console.log('╔════════════════════════════════════╗');
    console.log('║   Instagram APK 分析工具          ║');
    console.log('╚════════════════════════════════════╝\n');

    // 检查目录
    if (!fs.existsSync(CONFIG.newVersion)) {
        console.error('❌ 错误：找不到反编译的新版本目录');
        console.error(`   请先运行 decompile-apk.bat 反编译 APK`);
        process.exit(1);
    }

    try {
        // 比较版本
        const results = compareVersions();
        
        // 查找差异
        const differences = findDifferences(results);
        
        // 生成报告
        generateReport(results, differences);
        
        console.log('\n╔════════════════════════════════════╗');
        console.log('║   分析完成！                      ║');
        console.log('╚════════════════════════════════════╝\n');
        
        console.log('📄 查看报告: APK_ANALYSIS_REPORT.md');
        console.log('📁 查看代码: decompiled/new/');
        console.log('\n💡 提示：使用代码编辑器打开 decompiled/new/ 目录');
        console.log('   可以搜索感兴趣的类和方法\n');
        
    } catch (error) {
        console.error('❌ 分析过程中出错:', error.message);
        process.exit(1);
    }
}

// 运行
if (require.main === module) {
    main();
}

module.exports = { scanDirectory, compareVersions, findDifferences, generateReport };

