---
name: dev-down
description: Stop this project's dev processes and free its ports (4000, 4010, 4099, 5173, 4173) — the server and client started by dev-up, dev-rooms, Vite, and leftovers from earlier work (fuzzer runs, bot benches, replays, vitest/Playwright). Use when the user asks to stop the servers, clear or free the ports, kill leftover processes, clean up before starting again, or when a port is already in use.
---

# Stop dev processes

Stops whatever this project has running and confirms the ports are free.

## 1. Stop your own background tasks first

If this session started a server, Vite, a bench or a replay with
`run_in_background`, stop each of those tasks with **TaskStop** before
anything else, so the session stops tracking them. A task's `npx`/npm wrapper
can exit while its `node` child keeps the port (Vite does exactly this), which
is why step 2 still runs.

## 2. Run the stop script

One call:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File "$(git rev-parse --show-toplevel)/.claude/skills/dev-down/stop.ps1"
```

It stops every process listening on 4000 (game server or dev-rooms), 4010
(status endpoint), 4099 (dev-rooms commands), 5173 (Vite) and 4173 (Vite
preview), and every `node` process whose command line names this repo or one
of its scripts (dev-rooms, `dist/index.js`, the fuzzer, `tune-bot`,
`bot-behaviour`, harvest, the scenario scripts, vitest, Playwright, anything in
a Claude scratchpad). Never Claude Code itself or its MCP servers. It prints
each process it stopped and whether the ports are free.

Add `-DryRun` to list what it would stop without stopping anything — do that
first if the user asked only what's running.

## 3. Report

One or two lines: what was stopped (by what it was: "dev-rooms, Vite, a bench
worker"), and that the ports are free. If a port is still in use, name it
and the process holding it (`Get-NetTCPConnection -LocalPort N -State Listen`
→ `Get-Process -Id <OwningProcess>`) rather than guessing — it may be
something outside this project, which this skill must not kill.
