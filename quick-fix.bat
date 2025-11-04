@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   快速修復程序崩潰問題
echo ========================================
echo.

echo [步驟 1/3] 清理殘留數據...
echo.

if exist cookies.json (
    del /F /Q cookies.json
    echo ✓ 已刪除 cookies.json
) else (
    echo   cookies.json 不存在
)

if exist session.json (
    del /F /Q session.json
    echo ✓ 已刪除 session.json
) else (
    echo   session.json 不存在
)

if exist ig-dm.db (
    del /F /Q ig-dm.db
    echo ✓ 已刪除 ig-dm.db
) else (
    echo   ig-dm.db 不存在
)

echo.
echo [步驟 2/3] 準備啟動程序...
timeout /t 2 /nobreak >nul

echo.
echo [步驟 3/3] 啟動程序...
echo.
echo ========================================
echo   重要提示：
echo   1. 先點擊【初始化】按鈕
echo   2. 再點擊【登入】按鈕
echo   3. 登入成功後才能群發
echo ========================================
echo.

npm start

