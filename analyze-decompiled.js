/**
 * 分析反编译代码
 * 查找新的 API 端点和功能
 */

const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════╗');
console.log('║   分析反编译的 APK 代码                ║');
console.log('╚════════════════════════════════════════╝\n');

// 读取 InstagramApi.java
const apiFile = path.join(__dirname, 'decompiled', 'new', 'sources', 'com', 'example', 'igdmhelper', 'InstagramApi.java');

if (!fs.existsSync(apiFile)) {
    console.log('❌ 找不到 Instagram API 文件');
    console.log('   路径:', apiFile);
    process.exit(1);
}

console.log('✅ 找到 Instagram API 文件\n');
console.log('正在分析...\n');

const content = fs.readFileSync(apiFile, 'utf-8');

// 分析统计
const stats = {
    totalLines: content.split('\n').length,
    methods: [],
    urls: [],
    endpoints: []
};

// 查找方法
const methodRegex = /public\s+(?:final\s+)?(?:static\s+)?\w+(?:<[^>]+>)?\s+(\w+)\s*\(/g;
let match;
while ((match = methodRegex.exec(content)) !== null) {
    if (!match[1].startsWith('get') || match[1] === 'getClient') {
        stats.methods.push(match[1]);
    }
}

// 查找 URL 端点
const urlRegex = /"https:\/\/www\.instagram\.com\/([^"]+)"/g;
while ((match = urlRegex.exec(content)) !== null) {
    if (!stats.urls.includes(match[1])) {
        stats.urls.push(match[1]);
    }
}

// 查找 API 端点
const apiRegex = /"\/api\/v\d+\/([^"]+)"/g;
while ((match = apiRegex.exec(content)) !== null) {
    if (!stats.endpoints.includes(match[1])) {
        stats.endpoints.push(match[1]);
    }
}

// 输出结果
console.log('═'.repeat(50));
console.log('📊 分析结果\n');

console.log(`文件大小: ${stats.totalLines.toLocaleString()} 行\n`);

console.log(`找到 ${stats.methods.length} 个方法:`);
stats.methods.slice(0, 20).forEach(method => {
    console.log(`  - ${method}()`);
});
if (stats.methods.length > 20) {
    console.log(`  ... 还有 ${stats.methods.length - 20} 个\n`);
} else {
    console.log('');
}

console.log(`找到 ${stats.urls.length} 个 URL 端点:`);
stats.urls.forEach(url => {
    console.log(`  - https://www.instagram.com/${url}`);
});
console.log('');

console.log(`找到 ${stats.endpoints.length} 个 API 端点:`);
stats.endpoints.forEach(endpoint => {
    console.log(`  - /api/v1/${endpoint}`);
});

console.log('\n' + '═'.repeat(50));

// 查找特定功能关键字
console.log('\n🔍 查找特定功能...\n');

const keywords = {
    '消息/DM': ['direct', 'message', 'thread', 'inbox', 'dm'],
    '关注': ['follow', 'friendship'],
    '点赞/评论': ['like', 'comment', 'media'],
    '上传': ['upload', 'photo', 'video', 'image'],
    '用户': ['user', 'profile', 'username'],
    '故事': ['story', 'stories', 'reel']
};

for (const [category, words] of Object.entries(keywords)) {
    const found = words.filter(word => {
        const regex = new RegExp(word, 'i');
        return regex.test(content);
    });
    
    if (found.length > 0) {
        console.log(`✅ ${category}: 找到关键字 [${found.join(', ')}]`);
    } else {
        console.log(`❌ ${category}: 未找到相关功能`);
    }
}

console.log('\n' + '═'.repeat(50));
console.log('\n💡 建议:\n');
console.log('1. 查看完整代码:');
console.log(`   code ${apiFile}`);
console.log('');
console.log('2. 搜索特定功能:');
console.log('   Select-String -Path "decompiled\\new\\sources\\com\\example\\igdmhelper\\*.java" -Pattern "direct"');
console.log('');
console.log('3. 查看其他相关文件:');
fs.readdirSync(path.join(__dirname, 'decompiled', 'new', 'sources', 'com', 'example', 'igdmhelper'))
    .filter(f => f.endsWith('.java') && f !== 'R.java')
    .forEach(file => {
        console.log(`   - ${file}`);
    });

console.log('\n完成！\n');

