param(
    [string]$TermsPath,
    [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$utf8 = New-Object System.Text.UTF8Encoding($false)

if (-not $TermsPath) { $TermsPath = Join-Path $here 'terms-to-know.md' }
if (-not [IO.Path]::IsPathRooted($TermsPath)) {
    $TermsPath = [IO.Path]::GetFullPath((Join-Path (Get-Location).Path $TermsPath))
}
if (-not (Test-Path -LiteralPath $TermsPath)) { throw "Couldn't find Markdown source: $TermsPath" }

$templatePath = Join-Path $here 'app-template.html'
$stylePath = Join-Path $here 'app.css'
$fontStylePath = Join-Path $here 'font-faces.css'
$scriptPath = Join-Path $here 'app.js'
$studyScriptPath = Join-Path $here 'app-study.js'
foreach ($path in @($templatePath, $stylePath, $fontStylePath, $scriptPath, $studyScriptPath)) {
    if (-not (Test-Path -LiteralPath $path)) { throw "Couldn't find app source file: $path" }
}

$markdown = [IO.File]::ReadAllText($TermsPath, $utf8)
$data = ConvertTo-Json -InputObject $markdown -Compress
$data = $data -replace '(?i)</script', '<\/script'
$style = [IO.File]::ReadAllText($stylePath, $utf8)
$fontStyle = [IO.File]::ReadAllText($fontStylePath, $utf8)
$fontUrls = [regex]::Matches($fontStyle, 'url\("fonts/([^"]+)"\)')
foreach ($fontUrl in $fontUrls) {
    $fontPath = Join-Path (Join-Path $here 'fonts') $fontUrl.Groups[1].Value
    if (-not (Test-Path -LiteralPath $fontPath)) { throw "Couldn't find bundled font subset: $fontPath" }
    $fontData = [Convert]::ToBase64String([IO.File]::ReadAllBytes($fontPath))
    $embeddedUrl = "url('data:font/woff2;base64,$fontData')"
    $fontStyle = $fontStyle.Replace($fontUrl.Value, $embeddedUrl)
}
$script = ([IO.File]::ReadAllText($scriptPath, $utf8) + "`r`n" +
    [IO.File]::ReadAllText($studyScriptPath, $utf8)) -replace '(?i)</script', '<\/script'
$html = [IO.File]::ReadAllText($templatePath, $utf8).
    Replace('{{SOURCE_DATA}}', $data).
    Replace('{{APP_CSS}}', $style).
    Replace('{{LOCAL_FONTS}}', $fontStyle).
    Replace('{{APP_JS}}', $script)

$output = if ($OutputPath) {
    if ([IO.Path]::IsPathRooted($OutputPath)) { [IO.Path]::GetFullPath($OutputPath) }
    else { [IO.Path]::GetFullPath((Join-Path (Get-Location).Path $OutputPath)) }
} else {
    Join-Path $here 'app.html'
}
[IO.File]::WriteAllText($output, $html, $utf8)
Write-Host "Created standalone Japanese study app: $output"
