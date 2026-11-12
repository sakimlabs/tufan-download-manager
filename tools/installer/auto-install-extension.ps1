# Auto-install Tufan Download Manager extension in browsers
# Chrome, Edge, Brave: ExtensionInstallForcelist policy
# Firefox: extensions.json policy

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$extensionPath = Join-Path $root "extension"
$chromiumPath = Join-Path $root "target\extension\chromium"
$firefoxProfile = Join-Path $env:APPDATA "Mozilla\Firefox"

Write-Host "=== Installing Tufan Download Manager Extension ==="

# Get extension ID from manifest.json
$manifestPath = Join-Path $extensionPath "manifest.json"
if (Test-Path $manifestPath) {
    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    $extensionId = $manifest.key
    if (-not $extensionId) {
        # Generate ID from manifest (Chrome uses hash of key or path for unpacked)
        # For unpacked extensions, we'll use a fixed ID
        $extensionId = "tdm-unpacked-extension"
    }
    Write-Host "Extension ID: $extensionId"
} else {
    Write-Error "manifest.json not found"
}

# Chrome/Edge/Brave: Registry policy for ExtensionInstallForcelist
Write-Host "`n=== Chrome/Edge/Brave: Setting up ExtensionInstallForcelist ==="

$chromeRegPath = "HKLM:\SOFTWARE\Policies\Google\Chrome\Extensions"
$edgeRegPath = "HKLM:\SOFTWARE\Policies\Microsoft\Edge\Extensions"
$braveRegPath = "HKLM:\SOFTWARE\Policies\BraveSoftware\Brave\Extensions"

function New-ExtensionPolicy($regPath, $extensionId, $extensionPath) {
    if (-not (Test-Path $regPath)) {
        New-Item -Path $regPath -Force | Out-Null
    }
    
    # Create update URL policy
    $updateUrl = "file://$extensionPath"
    Set-ItemProperty -Path "$regPath\$extensionId" -Name "update_url" -Value $updateUrl -Force
    
    Write-Host "  ✓ Configured: $regPath\$extensionId"
}

# Try to set policy for each browser
try {
    New-ExtensionPolicy $chromeRegPath $extensionId $extensionPath
} catch {
    Write-Warning "Could not set Chrome policy: $_"
}

try {
    New-ExtensionPolicy $edgeRegPath $extensionId $extensionPath
} catch {
    Write-Warning "Could not set Edge policy: $_"
}

try {
    New-ExtensionPolicy $braveRegPath $extensionId $extensionPath
} catch {
    Write-Warning "Could not set Brave policy: $_"
}

# Firefox: extensions.json in profile
Write-Host "`n=== Firefox: Setting up extensions.json ==="

if (Test-Path $firefoxProfile) {
    # Find default profile
    $profilesIni = Join-Path $firefoxProfile "profiles.ini"
    if (Test-Path $profilesIni) {
        $profilesContent = Get-Content $profilesIni -Raw
        $defaultProfile = $profilesContent | Select-String "Default=1" -Context 10
        if ($defaultProfile) {
            $profilePath = $defaultProfile.Context.PostContext | Where-Object { $_ -match "Path=" } | ForEach-Object { $_.Substring(5) }
            if ($profilePath) {
                $firefoxProfilePath = Join-Path $firefoxProfile $profilePath
                $extensionsJson = Join-Path $firefoxProfilePath "extensions.json"
                
                $extensionData = @{
                    "addons" = @(
                        @{
                            "path" = $extensionPath
                            "type" = "unpacked-addon"
                        }
                    )
                }
                
                $extensionData | ConvertTo-Json -Depth 10 | Set-Content $extensionsJson -Encoding UTF8
                Write-Host "  ✓ Configured Firefox profile: $firefoxProfilePath"
            }
        }
    }
} else {
    Write-Warning "Firefox profile not found"
}

Write-Host "`n=== Auto-installation Complete ==="
Write-Host "Note: Browser policies require administrator privileges."
Write-Host "Restart browsers to apply changes."
