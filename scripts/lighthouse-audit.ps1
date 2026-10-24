# Lighthouse Audit Script for Task 16b
# Runs Lighthouse mobile audits on key pages

param(
    [string]$BaseUrl = "http://localhost:3000",
    [switch]$OnlyPerformance = $false
)

$ErrorActionPreference = "Stop"

# Check if lighthouse CLI is installed
if (-not (Get-Command lighthouse -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Lighthouse CLI not found. Install it with:" -ForegroundColor Red
    Write-Host "   npm install -g lighthouse" -ForegroundColor Yellow
    exit 1
}

# Create output directory
$OutputDir = "lighthouse-reports"
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Pages to audit
$Pages = @(
    @{ Name = "Home"; Path = "/" }
    @{ Name = "Browse"; Path = "/browse" }
    @{ Name = "Browse-Lost"; Path = "/browse?type=lost" }
    @{ Name = "Item-Detail"; Path = "/items/20000000-0000-0000-0000-000000000001" }  # Replace with real item ID
)

Write-Host "🚀 Starting Lighthouse audits..." -ForegroundColor Cyan
Write-Host "   Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host "   Timestamp: $Timestamp" -ForegroundColor Gray
Write-Host ""

$Results = @()

foreach ($Page in $Pages) {
    $Url = "$BaseUrl$($Page.Path)"
    $OutputFile = "$OutputDir/$($Page.Name)_$Timestamp"
    
    Write-Host "📊 Auditing: $($Page.Name)" -ForegroundColor Yellow
    Write-Host "   URL: $Url" -ForegroundColor Gray
    
    # Build lighthouse command
    $LighthouseArgs = @(
        $Url
        "--output=html,json"
        "--output-path=$OutputFile"
        "--preset=desktop"  # or "mobile" for mobile audit
        "--chrome-flags=--headless"
        "--quiet"
    )
    
    if ($OnlyPerformance) {
        $LighthouseArgs += "--only-categories=performance"
    }
    
    try {
        & lighthouse $LighthouseArgs
        
        # Parse JSON results
        $JsonPath = "$OutputFile.report.json"
        if (Test-Path $JsonPath) {
            $Report = Get-Content $JsonPath | ConvertFrom-Json
            $Scores = $Report.categories
            
            $Result = @{
                Page = $Page.Name
                Performance = [math]::Round($Scores.performance.score * 100)
                Accessibility = if ($Scores.accessibility) { [math]::Round($Scores.accessibility.score * 100) } else { "N/A" }
                BestPractices = if ($Scores.'best-practices') { [math]::Round($Scores.'best-practices'.score * 100) } else { "N/A" }
                SEO = if ($Scores.seo) { [math]::Round($Scores.seo.score * 100) } else { "N/A" }
                LCP = [math]::Round($Report.audits.'largest-contentful-paint'.numericValue / 1000, 2)
                CLS = [math]::Round($Report.audits.'cumulative-layout-shift'.numericValue, 3)
                TBT = [math]::Round($Report.audits.'total-blocking-time'.numericValue)
            }
            
            $Results += $Result
            
            Write-Host "   ✅ Performance: $($Result.Performance)" -ForegroundColor Green
            Write-Host "   📈 LCP: $($Result.LCP)s | CLS: $($Result.CLS) | TBT: $($Result.TBT)ms" -ForegroundColor Gray
        }
        
        Write-Host "   HTML report: $OutputFile.report.html" -ForegroundColor Gray
        Write-Host ""
        
    } catch {
        Write-Host "   ❌ Failed to audit $($Page.Name): $_" -ForegroundColor Red
        Write-Host ""
    }
}

# Print summary table
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host ""
$Results | Format-Table -AutoSize

# Check if target (≥90) is met
$Failed = $Results | Where-Object { $_.Performance -lt 90 }
if ($Failed.Count -gt 0) {
    Write-Host "⚠️  Performance target not met on $($Failed.Count) page(s):" -ForegroundColor Yellow
    $Failed | ForEach-Object { Write-Host "   - $($_.Page): $($_.Performance)" -ForegroundColor Yellow }
} else {
    Write-Host "✅ All pages meet performance target (≥90)!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📁 Reports saved to: $OutputDir" -ForegroundColor Cyan
