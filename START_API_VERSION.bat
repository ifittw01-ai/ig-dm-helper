@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   IG DM Helper - API 版本
echo   完全繞過瀏覽器！
echo ========================================
echo.
echo 正在啟動...
echo.

cd /d "%~dp0"

:: 檢查 node_modules 是否存在
if not exist "node_modules" (
    echo [錯誤] 依賴未安裝！
    echo.
    echo 請先運行以下命令：
    echo   npm install
    echo.
    pause
    exit /b 1
)

:: 檢查 axios 是否安裝
if not exist "node_modules\axios" (
    echo [警告] axios 未安裝！
    echo 正在安裝 axios...
    call npm install axios --save
    if errorlevel 1 (
        echo [錯誤] axios 安裝失敗！
        pause
        exit /b 1
    )
    echo [成功] axios 安裝完成
    echo.
)

:: 啟動應用
echo [啟動] 正在啟動 API 版本...
echo.
call npx electron main-api.js

if errorlevel 1 (
    echo.
    echo [錯誤] 啟動失敗！
    echo.
    echo 可能的原因：
    echo   1. Node.js 未安裝
    echo   2. Electron 未安裝
    echo   3. 文件路徑錯誤
    echo.
    echo 請確保已運行：npm install
    echo.
    pause
)

exit /b 0

