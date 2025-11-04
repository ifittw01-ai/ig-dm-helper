# Instagram APK 反编译自动化脚本
# PowerShell 版本 - 更稳定易用

param(
    [switch]$SkipInstall = $false
)

$ErrorActionPreference = "Stop"

# 配置
$JADX_VERSION = "1.4.7"
$JADX_URL = "https://github.com/skylot/jadx/releases/download/v$JADX_VERSION/jadx-$JADX_VERSION.zip"
$JADX_DIR = "tools\jadx"
$OLD_APK = "IGDM10211222SNweb(old).apk"
$NEW_APK = "IGDM10301744SNweb(new).apk"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Instagram APK 反编译工具 (PowerShell 版本)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 函数：检查文件是否存在
function Test-FileExists {
    param($FilePath)
    return Test-Path $FilePath
}

# 步骤 1：检查 APK 文件
Write-Host "[1/5] 检查 APK 文件..." -ForegroundColor Yellow
if (!(Test-FileExists $NEW_APK)) {
    Write-Host "ERROR: 找不到 APK 文件: $NEW_APK" -ForegroundColor Red
    Write-Host "请确保文件在当前目录中" -ForegroundColor Red
    exit 1
}
Write-Host "OK: 找到 APK 文件" -ForegroundColor Green
Write-Host ""

# 步骤 2：创建输出目录
Write-Host "[2/5] 创建输出目录..." -ForegroundColor Yellow
$dirs = @("decompiled", "decompiled\old", "decompiled\new", "tools")
foreach ($dir in $dirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}
Write-Host "OK: 目录已就绪" -ForegroundColor Green
Write-Host ""

# 步骤 3：安装 JADX
if (!$SkipInstall) {
    Write-Host "[3/5] 检查并安装 JADX..." -ForegroundColor Yellow
    
    if (!(Test-FileExists "$JADX_DIR\bin\jadx.bat")) {
        Write-Host "JADX 未安装，开始下载..." -ForegroundColor Yellow
        Write-Host "下载地址: $JADX_URL" -ForegroundColor Gray
        
        try {
            # 下载 JADX
            $zipPath = "tools\jadx.zip"
            Write-Host "正在下载 JADX v$JADX_VERSION (约 20MB)..." -ForegroundColor Yellow
            
            # 使用 WebClient 下载并显示进度
            $webClient = New-Object System.Net.WebClient
            $webClient.DownloadFile($JADX_URL, $zipPath)
            
            Write-Host "OK: 下载完成" -ForegroundColor Green
            
            # 解压
            Write-Host "正在解压..." -ForegroundColor Yellow
            Expand-Archive -Path $zipPath -DestinationPath $JADX_DIR -Force
            
            # 清理
            Remove-Item $zipPath -Force
            
            Write-Host "OK: JADX 安装完成" -ForegroundColor Green
        }
        catch {
            Write-Host "ERROR: JADX 下载失败: $_" -ForegroundColor Red
            Write-Host ""
            Write-Host "请手动安装 JADX:" -ForegroundColor Yellow
            Write-Host "1. 访问: https://github.com/skylot/jadx/releases/latest" -ForegroundColor Yellow
            Write-Host "2. 下载 jadx-x.x.x.zip" -ForegroundColor Yellow
            Write-Host "3. 解压到: tools\jadx\" -ForegroundColor Yellow
            exit 1
        }
    }
    else {
        Write-Host "OK: JADX 已安装" -ForegroundColor Green
    }
    Write-Host ""
}

# 步骤 4：反编译旧版本
Write-Host "[4/5] 反编译旧版本 APK..." -ForegroundColor Yellow
if (Test-FileExists $OLD_APK) {
    Write-Host "正在处理: $OLD_APK" -ForegroundColor Gray
    
    $jadxCmd = "$JADX_DIR\bin\jadx.bat"
    $arguments = @(
        "-d", "decompiled\old",
        $OLD_APK,
        "--no-res",
        "--no-imports",
        "--threads-count", "4"
    )
    
    try {
        & $jadxCmd $arguments 2>&1 | Out-Null
        Write-Host "OK: 旧版本反编译完成" -ForegroundColor Green
    }
    catch {
        Write-Host "WARNING: 旧版本反编译失败，继续..." -ForegroundColor Yellow
    }
}
else {
    Write-Host "SKIP: 未找到旧版本 APK" -ForegroundColor Yellow
}
Write-Host ""

# 步骤 5：反编译新版本
Write-Host "[5/5] 反编译新版本 APK..." -ForegroundColor Yellow
Write-Host "正在处理: $NEW_APK (这可能需要 5-10 分钟)" -ForegroundColor Gray

$jadxCmd = "$JADX_DIR\bin\jadx.bat"
$arguments = @(
    "-d", "decompiled\new",
    $NEW_APK,
    "--no-res",
    "--no-imports",
    "--threads-count", "4"
)

try {
    Write-Host "请耐心等待..." -ForegroundColor Yellow
    & $jadxCmd $arguments
    Write-Host ""
    Write-Host "OK: 新版本反编译完成!" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: 反编译失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  反编译完成!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "输出位置:" -ForegroundColor Cyan
Write-Host "  旧版本: decompiled\old\" -ForegroundColor Gray
Write-Host "  新版本: decompiled\new\" -ForegroundColor Gray
Write-Host ""
Write-Host "下一步:" -ForegroundColor Cyan
Write-Host "  1. 运行: node analyze-apk.js (分析代码)" -ForegroundColor Yellow
Write-Host "  2. 查看: APK_ANALYSIS_REPORT.md (查看报告)" -ForegroundColor Yellow
Write-Host "  3. 浏览: decompiled\new\sources\ (查看代码)" -ForegroundColor Yellow
Write-Host ""
Write-Host "按任意键继续..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

