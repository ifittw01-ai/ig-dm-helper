@echo off
chcp 65001 > nul
echo ========================================
echo   IG DM Helper - 專案移動工具
echo ========================================
echo.

REM 設定來源路徑（當前位置）
set SOURCE=%~dp0

echo 當前位置: %SOURCE%
echo.
echo 請輸入目標路徑（例如: D:\Projects\）
set /p TARGET="目標路徑: "

echo.
echo 確認移動：
echo   從: %SOURCE%
echo   到: %TARGET%ig-dm-helper\
echo.
set /p CONFIRM="確定要移動嗎? (Y/N): "

if /i "%CONFIRM%" NEQ "Y" (
    echo 已取消移動
    pause
    exit
)

echo.
echo 正在移動專案...

REM 創建目標目錄
if not exist "%TARGET%" mkdir "%TARGET%"

REM 複製整個資料夾
xcopy "%SOURCE%*" "%TARGET%ig-dm-helper\" /E /I /H /Y

echo.
echo ✅ 移動完成！
echo.
echo 新位置: %TARGET%ig-dm-helper\
echo.
echo 請執行以下步驟：
echo   1. cd %TARGET%ig-dm-helper
echo   2. npm install
echo   3. npm start
echo.

set /p DELETE="是否要刪除原始資料夾? (Y/N): "
if /i "%DELETE%"=="Y" (
    echo 刪除原始資料夾...
    rmdir /s /q "%SOURCE%"
    echo 已刪除原始資料夾
)

echo.
echo 完成！
pause

