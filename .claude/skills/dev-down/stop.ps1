# Stops this project's dev processes: whatever listens on its ports, and any
# node process running one of its scripts (a server, Vite, a fuzzer, a bench,
# a replay left behind in a Claude scratchpad). Prints what it stops.
#   powershell -NoProfile -ExecutionPolicy Bypass -File stop.ps1 [-DryRun]
param([switch]$DryRun)

$repo = (Resolve-Path "$PSScriptRoot\..\..\..").Path
# 4000 game server / dev-rooms, 4010 status endpoint, 4099 dev-rooms command
# port, 5173 Vite dev, 4173 Vite preview.
$ports = 4000, 4010, 4099, 5173, 4173
# Scripts this repo (and work in it) runs, for processes started with a
# relative path that doesn't name the repo.
$scripts = 'dev-rooms\.mjs|dist[\\/]index\.js|random-demo\.mjs|random-game-worker|tune-bot|bot-behaviour|harvest|check-scenarios|fit-scenarios|vitest|playwright|[\\/]scratchpad[\\/]|\bab\.mjs|replay\.mjs|probe[-\w]*\.mjs|diff2?\.mjs'

$targets = @{}
foreach ($c in Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue) {
  if ($ports -contains $c.LocalPort) { $targets[[int]$c.OwningProcess] = "listening on $($c.LocalPort)" }
}
foreach ($p in Get-CimInstance Win32_Process -Filter "Name='node.exe'") {
  $cmd = $p.CommandLine
  if ($null -eq $cmd) { continue }
  # Never Claude Code itself, or anything it runs (MCP servers).
  if ($cmd -match '@anthropic-ai|claude-code|claude-in-chrome') { continue }
  if ($cmd -like "*$repo*" -or $cmd -match $scripts) {
    if (-not $targets.ContainsKey([int]$p.ProcessId)) { $targets[[int]$p.ProcessId] = 'repo process' }
  }
}

if ($targets.Count -eq 0) { Write-Output 'Nothing running.'; exit 0 }
foreach ($id in $targets.Keys) {
  $p = Get-CimInstance Win32_Process -Filter "ProcessId=$id" -ErrorAction SilentlyContinue
  if ($null -eq $p) { continue }
  $line = if ($p.CommandLine) { $p.CommandLine } else { $p.Name }
  if ($line.Length -gt 140) { $line = $line.Substring(0, 140) + '...' }
  $verb = if ($DryRun) { 'would stop' } else { 'stopped' }
  if (-not $DryRun) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue }
  Write-Output ("{0} {1} ({2}): {3}" -f $verb, $id, $targets[$id], $line)
}
if (-not $DryRun) {
  Start-Sleep -Milliseconds 500
  $still = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort }
  if ($still) { Write-Output ("still listening: " + (($still | ForEach-Object { $_.LocalPort }) -join ', ')) }
  else { Write-Output 'Ports 4000, 4010, 4099, 5173 and 4173 are free.' }
}
