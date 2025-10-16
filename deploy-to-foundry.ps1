# Deploy D&D Combat AI Module to Local Foundry VTT
# This script copies the module files to your local Foundry VTT installation

param(
    [string]$FoundryDataPath = "$env:LOCALAPPDATA\FoundryVTT\Data\modules\dnd-combat-ai"
)

Write-Host "=== D&D Combat AI Module Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Get the script's directory (the module source directory)
$SourcePath = $PSScriptRoot

# Fallback to current directory if PSScriptRoot is not set
if (-not $SourcePath) {
    $SourcePath = (Get-Location).Path
}

# Check if source path exists
if (-not (Test-Path $SourcePath)) {
    Write-Host "ERROR: Source path not found: $SourcePath" -ForegroundColor Red
    exit 1
}

Write-Host "Source: $SourcePath" -ForegroundColor Yellow
Write-Host "Target: $FoundryDataPath" -ForegroundColor Yellow
Write-Host ""

# Create target directory if it doesn't exist
if (-not (Test-Path $FoundryDataPath)) {
    Write-Host "Creating module directory..." -ForegroundColor Green
    New-Item -ItemType Directory -Path $FoundryDataPath -Force | Out-Null
}

# Define files and folders to copy
$itemsToCopy = @(
    "module.json",
    "scripts",
    "styles",
    "templates",
    "lang",
    "examples",
    "README.md",
    "CHANGELOG.md",
    "LICENSE"
)

# Copy each item
foreach ($item in $itemsToCopy) {
    $itemSourcePath = Join-Path $SourcePath $item
    
    if (Test-Path $itemSourcePath) {
        $destPath = Join-Path $FoundryDataPath $item
        
        if (Test-Path $itemSourcePath -PathType Container) {
            # It's a directory
            Write-Host "Copying folder: $item..." -ForegroundColor Cyan
            
            # Remove existing directory if it exists
            if (Test-Path $destPath) {
                Remove-Item -Path $destPath -Recurse -Force
            }
            
            # Copy directory
            Copy-Item -Path $itemSourcePath -Destination $destPath -Recurse -Force
        }
        else {
            # It's a file
            Write-Host "Copying file: $item..." -ForegroundColor Cyan
            
            # Ensure parent directory exists
            $destDir = Split-Path -Parent $destPath
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            
            Copy-Item -Path $itemSourcePath -Destination $destPath -Force
        }
    }
    else {
        Write-Host "WARNING: Item not found, skipping: $item" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Module deployed to: $FoundryDataPath" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start or restart Foundry VTT" -ForegroundColor White
Write-Host "2. Go to 'Manage Modules' in your world" -ForegroundColor White
Write-Host "3. Enable 'D&D Combat AI' module" -ForegroundColor White
Write-Host "4. Configure LLM settings in the module settings" -ForegroundColor White
Write-Host ""
