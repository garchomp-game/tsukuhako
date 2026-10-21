param([Parameter(Mandatory=$true)][string]$Installer)
$ErrorActionPreference = 'Stop'
if ($env:GITHUB_ACTIONS -ne 'true' -or -not $env:RUNNER_TEMP) { throw 'Use only on the isolated GitHub Actions runner' }
$Installer = (Resolve-Path $Installer).Path
$root = Join-Path $env:RUNNER_TEMP ('tsukuhako-ci-' + [guid]::NewGuid().ToString('N'))
$installDir = Join-Path $root '導入 日本語 空白'
$profile = Join-Path $root '読書 データ'
$out = Join-Path $env:GITHUB_WORKSPACE 'dist/windows-smoke'
New-Item -ItemType Directory -Path $root,$out -Force | Out-Null
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
$manifest = Get-Content ($Installer + '.manifest.json') -Raw | ConvertFrom-Json
$sig = Get-AuthenticodeSignature $Installer
$result = [ordered]@{
  category='CI'; status='FAIL'; productVersion=$manifest.productVersion; sourceCommit=$manifest.sourceCommit
  file=(Split-Path $Installer -Leaf); sha256=(Get-FileHash $Installer -Algorithm SHA256).Hash.ToLower(); signing=$sig.Status.ToString()
  environment=@{ os=(Get-CimInstance Win32_OperatingSystem).Caption; build=[Environment]::OSVersion.Version.ToString(); user=$identity.Name; administratorToken=$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator); sessionId=(Get-Process -Id $PID).SessionId }
  install=@{status='NOT_RUN'}; launch=@{status='NOT_RUN'}; uninstall=@{status='NOT_RUN'}; retention=@{status='NOT_RUN'}
  notRun=@('Windows 11 standard user / SmartScreen warnings','default install path and Start menu click','WSL / Docker / VS Code / F2 or S2 runtime','real WSL, projects and DB retention')
}
$uninstaller=$null
function Run-Bounded([string]$File,[string]$Arguments,[int]$Seconds) {
  $p=Start-Process -FilePath $File -ArgumentList $Arguments -PassThru
  if (-not $p.WaitForExit($Seconds*1000)) { & taskkill.exe /PID $p.Id /T /F | Out-Null; throw "Timed out after $Seconds seconds" }
  $p.Refresh()
  if ($p.ExitCode -ne 0) { throw "Process exit code: $($p.ExitCode)" }
  return @{pid=$p.Id; exitCode=$p.ExitCode; timeoutSeconds=$Seconds}
}
try {
  if ($result.sha256 -ne $manifest.sha256) { throw 'Installer hash differs from manifest' }
  # Refuse to replace any existing Tsukuhako install, even on a test machine.
  $old=@(Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue | Where-Object DisplayName -eq 'ツクハコ')
  if ($old.Count) { throw 'Existing per-user installation; do not touch it' }
  $result.install=@{status='RUNNING'; method='same exe /S /currentuser /D=isolated Unicode directory'}
  $proof=Run-Bounded $Installer "/S /currentuser /D=$installDir" 120
  $exe=Join-Path $installDir 'tsukuhako.exe'
  if (-not (Test-Path $exe)) { throw 'Installed executable missing' }
  $installed=Get-Content (Join-Path $installDir 'resources/app/build-info.json') -Raw | ConvertFrom-Json
  if ($installed.sourceCommit -ne $manifest.sourceCommit -or $installed.productVersion -ne $manifest.productVersion) { throw 'Installed product does not match artifact' }
  $keys=@(Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -eq 'ツクハコ' -and $_.UninstallString.Contains($installDir) })
  if ($keys.Count -ne 1) { throw 'Expected one matching current-user uninstall registration' }
  $entry=$keys[0]
  if ($entry.UninstallString -notmatch '^"([^"]+)"') { throw 'Unexpected uninstall registration' }
  $uninstaller=$Matches[1]
  if (-not $uninstaller.StartsWith($installDir+'\') -or -not (Test-Path $uninstaller)) { throw 'Uninstaller outside owned install directory' }
  $result.install=@{status='PASS'; process=$proof; path='<RUNNER_TEMP>/isolated/導入 日本語 空白'; sourceCommit=$installed.sourceCommit; registry='HKCU'; displayVersion=$entry.DisplayVersion; executableSha256=(Get-FileHash $exe).Hash.ToLower()}
  & node tools/windows-installed-smoke.mjs $exe $profile $out
  $rendererExit=$LASTEXITCODE
  if (Test-Path (Join-Path $out 'renderer.json')) { $result.launch=Get-Content (Join-Path $out 'renderer.json') -Raw | ConvertFrom-Json }
  $reading=Join-Path $profile 'reading.json'
  $before=if(Test-Path $reading){(Get-FileHash $reading).Hash.ToLower()}else{$null}
  # Normal silent uninstaller, without --delete-app-data or KEEP_APP_DATA overrides.
  $result.uninstall=@{status='RUNNING'}
  $proof=Run-Bounded $uninstaller '/S /currentuser' 120
  $until=(Get-Date).AddSeconds(30)
  while ((Test-Path $exe) -and (Get-Date) -lt $until) { Start-Sleep -Milliseconds 200 }
  if (Test-Path $exe) { throw 'Application still installed' }
  $remaining=@(Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -eq 'ツクハコ' -and $_.UninstallString.Contains($installDir) })
  if ($remaining.Count -or (Test-Path (Join-Path $installDir 'resources/app/main.mjs'))) { throw 'Application resources/registration remain' }
  $result.uninstall=@{status='PASS'; process=$proof; applicationRemoved=$true; registrationRemoved=$true}
  if($before) {
    $after=if(Test-Path $reading){(Get-FileHash $reading).Hash.ToLower()}else{$null}
    $result.retention=@{status=if($before -eq $after){'PASS'}else{'FAIL'}; scope='actual app-created reading.json in isolated --user-data-dir; not WSL or DB data, not default APPDATA'; beforeSha256=$before; afterSha256=$after}
    if ($before -ne $after) { throw 'Reading data changed or removed' }
  }
  if ($rendererExit -ne 0 -or $result.launch.status -ne 'PASS' -or $result.retention.status -ne 'PASS') { throw 'Renderer or retention smoke failed; inspect partial results' }
  $manifest | Add-Member -Force -NotePropertyName runtimeVerification -NotePropertyValue @{
    category='CI'; status='PASS'; report='windows-smoke-evidence / installer-smoke.json'
    summary='Windows Server 2022 CIの管理者権限を持つrunnerで、同じexeのユーザー単位導入、導入先からの起動・教材表示、削除、隔離した実読書データのSHA保持を確認。Win11通常ユーザー・WSL/DBの保持は未確認。'
  }
  $manifest | ConvertTo-Json -Depth 12 | Set-Content -Encoding utf8 ($Installer + '.manifest.json')
  $result.status='PASS'
} catch {
  foreach($phase in @('install','uninstall')) { if($result[$phase].status -eq 'RUNNING') { $result[$phase].status='FAIL' } }
  $result.error=$_.Exception.Message.Replace($root,'<ISOLATED_RUN>')
  Write-Warning $result.error
} finally {
  # Only processes executing from the new install directory are owned by this test.
  Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -and $_.ExecutablePath.StartsWith($installDir+'\') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  if ($uninstaller -and (Test-Path $uninstaller)) { try { $null=Run-Bounded $uninstaller '/S /currentuser' 60 } catch { $result.cleanupError=$_.Exception.Message } }
  # Retain data and logs until the disposable runner is destroyed; no broad deletion.
  $result | ConvertTo-Json -Depth 12 | Set-Content -Encoding utf8 (Join-Path $out 'installer-smoke.json')
}
if ($result.status -ne 'PASS') { exit 1 }
