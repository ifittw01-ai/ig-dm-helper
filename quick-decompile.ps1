# Quick APK Decompile Script (Non-interactive)

$ErrorActionPreference = "Stop"

Write-Host "======================================"
Write-Host "  APK Quick Decompile Tool"
Write-Host "======================================`n"

# Configuration
$NEW_APK = "IGDM10301744SNweb(new).apk"
$JADX_VERSION = "1.4.7"
$JADX_URL = "https://github.com/skylot/jadx/releases/download/v$JADX_VERSION/jadx-$JADX_VERSION.zip"
$TOOLS_DIR = "tools"
$JADX_DIR = "$TOOLS_DIR\jadx"
$OUTPUT_DIR = "decompiled"

# Step 1: Check APK exists
Write-Host "Step 1: Checking APK file..." -ForegroundColor Cyan
if (!(Test-Path $NEW_APK)) {
    Write-Host "ERROR: APK file not found: $NEW_APK" -ForegroundColor Red
    exit 1
}
Write-Host "OK: APK file found`n" -ForegroundColor Green

# Step 2: Setup JADX
Write-Host "Step 2: Checking JADX..." -ForegroundColor Cyan
if (!(Test-Path "$JADX_DIR\bin\jadx.bat")) {
    Write-Host "Installing JADX $JADX_VERSION..." -ForegroundColor Yellow
    
    # Create tools directory
    New-Item -ItemType Directory -Force -Path $TOOLS_DIR | Out-Null
    
    # Download JADX
    $jadxZip = "$TOOLS_DIR\jadx.zip"
    Write-Host "Downloading from: $JADX_URL"
    try {
        Invoke-WebRequest -Uri $JADX_URL -OutFile $jadxZip -UseBasicParsing
        Write-Host "Download complete" -ForegroundColor Green
        
        # Extract
        Write-Host "Extracting JADX..."
        Expand-Archive -Path $jadxZip -DestinationPath $JADX_DIR -Force
        Remove-Item $jadxZip
        Write-Host "JADX installed successfully`n" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Failed to download JADX: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "OK: JADX already installed`n" -ForegroundColor Green
}

# Step 3: Decompile
Write-Host "Step 3: Decompiling APK..." -ForegroundColor Cyan
Write-Host "This may take 5-10 minutes...`n" -ForegroundColor Yellow

$newOutput = "$OUTPUT_DIR\new"
New-Item -ItemType Directory -Force -Path $newOutput | Out-Null

Write-Host "Decompiling: $NEW_APK" -ForegroundColor Yellow
Write-Host "Output to: $newOutput`n"

$jadxExe = "$JADX_DIR\bin\jadx.bat"
$jadxArgs = @(
    "-d", $newOutput,
    "--no-res",
    "--show-bad-code",
    $NEW_APK
)

try {
    & $jadxExe $jadxArgs
    Write-Host "`nDecompile completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Decompile failed: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Summary
Write-Host "`n======================================"
Write-Host "  Decompile Complete!"
Write-Host "======================================`n"

Write-Host "Output location:" -ForegroundColor Cyan
Write-Host "  $newOutput\sources\`n"

Write-Host "Next steps:" -ForegroundColor Green
Write-Host "  1. Run: node analyze-apk.js"
Write-Host "  2. Browse: $newOutput\sources\`n"

Write-Host "Done!" -ForegroundColor Green

