param(
    [int]$NumJobs = 120,
    [int]$CandidatesPerJob = 8,
    [int]$Epochs = 4
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Invoke-Step {
    param(
        [string]$Exe,
        [string[]]$ArgList
    )
    & $Exe @ArgList
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $Exe $($ArgList -join ' ')"
    }
}

if (-not (Test-Path ".\.venv\Scripts\python.exe")) {
    python -m venv .venv
}

$python = ".\.venv\Scripts\python.exe"

Invoke-Step -Exe $python -ArgList @("-m", "pip", "install", "--upgrade", "pip")
Invoke-Step -Exe $python -ArgList @("-m", "pip", "install", "-r", "requirements.txt")
Invoke-Step -Exe $python -ArgList @("-m", "pip", "install", "-r", "requirements-ml.txt")
Invoke-Step -Exe $python -ArgList @("-m", "pip", "install", "pytest", "pytest-cov", "aiosqlite")

@'
import ast
from pathlib import Path
for folder in ("app", "tests", "ml_pipeline", "scripts"):
    root = Path(folder)
    if not root.exists():
        continue
    for path in root.rglob("*.py"):
        ast.parse(path.read_text(encoding="utf-8", errors="ignore"), filename=str(path))
print("SYNTAX_OK")
'@ | & $python -
if ($LASTEXITCODE -ne 0) {
    throw "Syntax check failed with exit code $LASTEXITCODE."
}

Invoke-Step -Exe $python -ArgList @("-m", "compileall", "app", "tests", "ml_pipeline")
Invoke-Step -Exe $python -ArgList @("-m", "pytest", "-q", "--disable-warnings", "--cov=app", "--cov-report=term-missing")

Invoke-Step -Exe $python -ArgList @(
    "ml_pipeline\scripts\run_day2_pipeline.py",
    "--num-jobs", "$NumJobs",
    "--candidates-per-job", "$CandidatesPerJob",
    "--epochs", "$Epochs"
)

Write-Host "DEEP_AUDIT_COMPLETE"
