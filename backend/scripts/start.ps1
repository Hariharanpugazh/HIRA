$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}

& ".\scripts\download-model.ps1"

docker compose up -d --build
Write-Host "API: http://localhost:8000/docs"
Write-Host "LLM: http://localhost:8080/v1/models"
