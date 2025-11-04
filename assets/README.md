# Assets 資源文件說明

請將以下圖示文件放置在此目錄：

- `logo.png` - 應用程式 Logo（建議尺寸：512x512 px）
- `icon.png` - Linux 應用程式圖示（512x512 px）
- `icon.ico` - Windows 應用程式圖示
- `icon.icns` - macOS 應用程式圖示

## 如何創建圖示

### 從 PNG 創建

1. **Windows (.ico)**
   ```bash
   # 使用線上工具：https://convertio.co/png-ico/
   # 或使用 ImageMagick
   convert logo.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
   ```

2. **macOS (.icns)**
   ```bash
   # 使用線上工具：https://cloudconvert.com/png-to-icns
   # 或使用命令行
   mkdir icon.iconset
   sips -z 16 16     logo.png --out icon.iconset/icon_16x16.png
   sips -z 32 32     logo.png --out icon.iconset/icon_16x16@2x.png
   sips -z 32 32     logo.png --out icon.iconset/icon_32x32.png
   sips -z 64 64     logo.png --out icon.iconset/icon_32x32@2x.png
   sips -z 128 128   logo.png --out icon.iconset/icon_128x128.png
   sips -z 256 256   logo.png --out icon.iconset/icon_128x128@2x.png
   sips -z 256 256   logo.png --out icon.iconset/icon_256x256.png
   sips -z 512 512   logo.png --out icon.iconset/icon_256x256@2x.png
   sips -z 512 512   logo.png --out icon.iconset/icon_512x512.png
   iconutil -c icns icon.iconset
   ```

## 佔位符

如果暫時沒有圖示，應用程式會使用系統默認圖示。

