@echo off
REM ============================================
REM 自动下载和安装 JADX 工具
REM ============================================

echo.
echo ========================================
echo  JADX 自动安装工具
echo ========================================
echo.

REM 创建工具目录
if not exist "tools" mkdir tools

REM 检查是否已安装
if exist "tools\jadx\bin\jadx.bat" (
    echo [!] JADX 已经安装
    echo 位置: tools\jadx\
    echo.
    choice /C YN /M "是否重新安装"
    if errorlevel 2 exit /b 0
)

echo [1/3] 下载 JADX...
echo.
echo 方法 1: 使用 PowerShell 下载（推荐）
echo 方法 2: 手动下载
echo.
choice /C 12 /M "请选择下载方式"

if errorlevel 2 goto manual
if errorlevel 1 goto automatic

:automatic
echo.
echo 正在下载 JADX v1.4.7...
powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/skylot/jadx/releases/download/v1.4.7/jadx-1.4.7.zip' -OutFile 'tools\jadx.zip'}"

if %errorlevel% neq 0 (
    echo [错误] 下载失败！
    goto manual
)

echo [✓] 下载完成
echo.
echo [2/3] 解压文件...

REM 解压
powershell -Command "& {Expand-Archive -Path 'tools\jadx.zip' -DestinationPath 'tools\jadx' -Force}"

if %errorlevel% neq 0 (
    echo [错误] 解压失败！
    pause
    exit /b 1
)

echo [✓] 解压完成
echo.
echo [3/3] 清理临时文件...
del tools\jadx.zip

echo.
echo ========================================
echo  JADX 安装成功！
echo ========================================
echo.
echo 安装位置: tools\jadx\
echo.
echo 现在可以运行 decompile-apk.bat 来反编译 APK
echo.
pause
exit /b 0

:manual
echo.
echo ========================================
echo  手动安装步骤
echo ========================================
echo.
echo 1. 访问: https://github.com/skylot/jadx/releases/latest
echo 2. 下载最新的 jadx-x.x.x.zip 文件
echo 3. 将下载的文件重命名为 jadx.zip
echo 4. 将 jadx.zip 放到 tools\ 目录
echo 5. 解压到 tools\jadx\ 目录
echo 6. 重新运行此脚本或运行 decompile-apk.bat
echo.
echo 目录结构应该是:
echo   tools\jadx\bin\jadx.bat
echo   tools\jadx\lib\...
echo.
pause

