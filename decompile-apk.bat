@echo off
REM ============================================
REM Instagram APK 反编译工具
REM ============================================

echo.
echo ========================================
echo  Instagram APK 反编译工具
echo ========================================
echo.

REM 设置颜色
color 0A

REM 检查 Java 是否安装
echo [1/5] 检查 Java 环境...
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Java！
    echo 请先安装 Java: https://www.java.com/
    pause
    exit /b 1
)
echo [✓] Java 已安装

REM 创建输出目录
echo.
echo [2/5] 创建输出目录...
if not exist "decompiled" mkdir decompiled
if not exist "decompiled\old" mkdir decompiled\old
if not exist "decompiled\new" mkdir decompiled\new
if not exist "tools" mkdir tools
echo [✓] 输出目录已创建

REM 检查 JADX 是否存在
echo.
echo [3/5] 检查反编译工具...
if not exist "tools\jadx\bin\jadx.bat" (
    echo [!] JADX 未找到，正在下载...
    echo.
    echo 请手动完成以下步骤：
    echo 1. 访问: https://github.com/skylot/jadx/releases/latest
    echo 2. 下载 jadx-x.x.x.zip
    echo 3. 解压到 tools\jadx\ 目录
    echo.
    echo 或者使用以下命令（需要安装 curl）：
    echo curl -L -o tools\jadx.zip https://github.com/skylot/jadx/releases/download/v1.4.7/jadx-1.4.7.zip
    echo tar -xf tools\jadx.zip -C tools\jadx
    echo.
    pause
    exit /b 1
)
echo [✓] JADX 已就绪

REM 反编译旧版本 APK
echo.
echo [4/5] 反编译旧版本 APK...
if exist "IGDM10211222SNweb(old).apk" (
    echo 正在反编译: IGDM10211222SNweb(old).apk
    tools\jadx\bin\jadx.bat -d decompiled\old "IGDM10211222SNweb(old).apk" --no-res --no-imports
    echo [✓] 旧版本反编译完成
) else (
    echo [!] 未找到旧版本 APK
)

REM 反编译新版本 APK
echo.
echo [5/5] 反编译新版本 APK...
if exist "IGDM10301744SNweb(new).apk" (
    echo 正在反编译: IGDM10301744SNweb(new).apk
    tools\jadx\bin\jadx.bat -d decompiled\new "IGDM10301744SNweb(new).apk" --no-res --no-imports
    echo [✓] 新版本反编译完成
) else (
    echo [错误] 未找到新版本 APK: IGDM10301744SNweb(new).apk
    pause
    exit /b 1
)

REM 完成
echo.
echo ========================================
echo  反编译完成！
echo ========================================
echo.
echo 输出位置:
echo   旧版本: decompiled\old\
echo   新版本: decompiled\new\
echo.
echo 下一步:
echo   1. 打开 decompiled\new\ 查看反编译的代码
echo   2. 运行 compare-apk-versions.bat 比较两个版本
echo   3. 运行 analyze-apk.js 分析新功能
echo.
pause

