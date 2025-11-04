@echo off
REM ============================================
REM 一键反编译和分析 Instagram APK
REM ============================================

title Instagram APK 反编译工具
color 0B

echo.
echo  ╔════════════════════════════════════════════╗
echo  ║   Instagram APK 反编译和分析工具           ║
echo  ║   版本: 2.0                                ║
echo  ╚════════════════════════════════════════════╝
echo.

REM 检查 APK 文件
if not exist "IGDM10301744SNweb(new).apk" (
    echo [错误] 找不到 APK 文件: IGDM10301744SNweb(new).apk
    echo.
    echo 请确保 APK 文件在当前目录中
    pause
    exit /b 1
)

echo [✓] 找到 APK 文件: IGDM10301744SNweb(new).apk
echo.

REM 步骤选择
echo 请选择操作：
echo.
echo  1. 完整流程（安装 + 反编译 + 分析）
echo  2. 仅反编译 APK
echo  3. 仅分析已反编译的代码
echo  4. 查看反编译指南
echo  5. 退出
echo.

choice /C 12345 /N /M "请输入选项 (1-5): "

if errorlevel 5 exit /b 0
if errorlevel 4 goto guide
if errorlevel 3 goto analyze
if errorlevel 2 goto decompile
if errorlevel 1 goto full

:full
echo.
echo ════════════════════════════════════════════
echo  执行完整流程
echo ════════════════════════════════════════════
echo.

REM 检查 JADX
echo [1/3] 检查 JADX...
if not exist "tools\jadx\bin\jadx.bat" (
    echo [!] JADX 未安装，开始安装...
    call setup-jadx.bat
    if errorlevel 1 (
        echo [错误] JADX 安装失败
        pause
        exit /b 1
    )
) else (
    echo [✓] JADX 已安装
)

echo.
echo [2/3] 反编译 APK...
call decompile-apk.bat
if errorlevel 1 (
    echo [错误] 反编译失败
    pause
    exit /b 1
)

echo.
echo [3/3] 分析代码...
node analyze-apk.js
if errorlevel 1 (
    echo [错误] 分析失败
    pause
    exit /b 1
)

goto done

:decompile
echo.
echo ════════════════════════════════════════════
echo  反编译 APK
echo ════════════════════════════════════════════
echo.

call decompile-apk.bat
goto done

:analyze
echo.
echo ════════════════════════════════════════════
echo  分析代码
echo ════════════════════════════════════════════
echo.

if not exist "decompiled\new" (
    echo [错误] 未找到反编译的代码
    echo 请先运行反编译流程
    pause
    exit /b 1
)

node analyze-apk.js
goto done

:guide
echo.
echo ════════════════════════════════════════════
echo  打开反编译指南
echo ════════════════════════════════════════════
echo.

if exist "DECOMPILE_GUIDE.md" (
    start DECOMPILE_GUIDE.md
    echo [✓] 已打开指南文档
) else (
    echo [错误] 找不到指南文档
)

pause
exit /b 0

:done
echo.
echo ════════════════════════════════════════════
echo  完成！
echo ════════════════════════════════════════════
echo.
echo 📁 输出位置：
echo    - 反编译代码: decompiled\new\
echo    - 分析报告: APK_ANALYSIS_REPORT.md
echo.
echo 📝 下一步操作：
echo    1. 查看分析报告: APK_ANALYSIS_REPORT.md
echo    2. 浏览反编译代码: decompiled\new\sources\
echo    3. 实现新功能到项目中
echo.
echo 💡 提示：
echo    使用 VS Code 打开 decompiled\new\ 目录
echo    可以方便地搜索和浏览代码
echo.

REM 询问是否打开结果
choice /C YN /M "是否打开分析报告"
if errorlevel 2 goto end
if errorlevel 1 (
    if exist "APK_ANALYSIS_REPORT.md" (
        start APK_ANALYSIS_REPORT.md
    )
)

:end
echo.
pause

