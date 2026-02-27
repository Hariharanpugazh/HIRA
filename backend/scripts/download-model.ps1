param(
    [string]$Destination = "models",
    [string]$ModelFile = "Qwen2.5-1.5B-Instruct-Q4_K_M.gguf"
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $Destination | Out-Null
$outputPath = Join-Path $Destination $ModelFile

if (Test-Path $outputPath) {
    Write-Host "Model already present: $outputPath"
    exit 0
}

$url = "https://huggingface.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/$ModelFile"
Write-Host "Downloading model to $outputPath"
& curl.exe -L -C - --retry 5 --retry-delay 5 --fail $url -o $outputPath
if (-not (Test-Path $outputPath)) {
    throw "Model download failed."
}
$size = (Get-Item $outputPath).Length
if ($size -lt 100MB) {
    throw "Model file is too small ($size bytes). Download likely incomplete."
}
Write-Host "Download complete."
