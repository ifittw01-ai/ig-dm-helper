# Logo 設置指南

## 快速方法

### 選項 1: 使用線上轉換工具

1. 打開 logo.svg 文件
2. 訪問 https://cloudconvert.com/svg-to-png
3. 上傳 logo.svg
4. 設置尺寸為 512x512
5. 下載並重命名為 `logo.png`
6. 將 logo.png 放在 `assets/` 目錄中

### 選項 2: 使用 ImageMagick (命令行)

```bash
# 安裝 ImageMagick
# Windows: https://imagemagick.org/script/download.php
# macOS: brew install imagemagick
# Linux: sudo apt-get install imagemagick

# 轉換 SVG 到 PNG
convert logo.svg -resize 512x512 logo.png
```

### 選項 3: 使用 Inkscape

1. 下載並安裝 Inkscape: https://inkscape.org/
2. 打開 logo.svg
3. File → Export PNG Image
4. 設置寬度和高度為 512
5. 導出為 logo.png

### 選項 4: 使用自己的 Logo

如果您有自己的品牌 logo：

1. 準備一個正方形的 PNG 圖片（建議 512x512 像素）
2. 重命名為 `logo.png`
3. 放在 `assets/` 目錄中
4. 重新啟動應用即可看到新 logo

## 臨時解決方案

如果暫時不需要自定義 logo，您可以：

1. 下載任何 512x512 的圖片
2. 重命名為 `logo.png`
3. 放在 `assets/` 目錄中

應用會使用該圖片作為 logo。

## 注意事項

- 圖片格式必須是 PNG
- 建議尺寸：512x512 像素（正方形）
- 文件名必須完全匹配：`logo.png`（注意大小寫）
- 如果沒有 logo.png，應用可能會顯示錯誤或空白

## 示例

您可以從以下網站獲取免費圖示：
- https://www.flaticon.com/
- https://icons8.com/
- https://www.iconfinder.com/

搜索 "instagram" 或 "social media" 相關的圖示。

