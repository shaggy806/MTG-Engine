---
name: deploy
description: Deploy what's pushed to origin/main to the live site (deckblitz.net, the AWS Lightsail instance) — pull, rebuild and restart over SSH, then check the site from outside. Use when the user asks to deploy, ship to production, update the live site / server / deckblitz.net, or put a fix live.
---

# Deploy to the live site

The live site runs on an AWS Lightsail instance (`ubuntu@52.25.80.98`, the `deckblitz` host in
this PC's `~/.ssh/config`, reached with this PC's key). `DEPLOYMENT.md` is the runbook; this does
its "Updating the deployed code" from here. Deploying restarts the room server, which **ends
every game in progress**, so it only happens when the user asked for it this time.

## 1. Something to deploy

```bash
cd "$(git rev-parse --show-toplevel)" && git fetch -q origin && git status -sb | head -1 && git log --oneline -1 origin/main
```

`deploy.sh` pulls `origin/main`, so the work must be **pushed** (and verified — the `ship`
skill). Unpushed commits on `main`: ship them first, or tell the user they won't go out.

## 2. Reach the box, and see who's playing

```bash
ssh -o BatchMode=yes -o ConnectTimeout=8 deckblitz 'sudo -n true 2>/dev/null && echo "sudo: ok" || echo "sudo: NEEDS PASSWORD"; curl -s localhost:4010/status | sed -n 2,12p; cd /opt/mtg-engine && git status --short | head -5; git log --oneline -1'
```

- **Timed out**: `curl -s -o /dev/null -w "%{http_code}\n" https://deckblitz.net/` (530 =
  Cloudflare can't reach the tunnel). If the SSH firewall rule is limited to the home IP, the
  home IP may have changed. Otherwise the instance is stopped or hung: tell the user to check
  it in the Lightsail console (or reboot it there), and stop.
- **A human seat** in a `playing` room: say who and ask before restarting — bot-only rooms can
  go. Read the room table's SEATS column, not the `seats` line: that counts only humans online,
  and a name with a `*` is a player disconnected mid-game (a dropped connection, a reload) whose
  game a restart would end all the same. Any name but `bot` or `open` is a human.
- **`sudo: NEEDS PASSWORD`**: Lightsail's `ubuntu` user has passwordless sudo out of the box,
  so something on the box changed it. `deploy.sh` needs sudo for `systemctl`, and you may not
  type a password. Give the user the command to run themselves (`ssh -t deckblitz 'cd
  /opt/mtg-engine && ./deploy.sh'`), then go to step 4.
- **Uncommitted changes** in `/opt/mtg-engine`: `git pull --ff-only` would refuse or carry
  them along. Show them to the user; don't discard them.

## 3. Deploy

```bash
ssh -o BatchMode=yes deckblitz 'cd /opt/mtg-engine && ./deploy.sh' > "$TEMP/mtg-deploy.log" 2>&1; r=$?; tail -25 "$TEMP/mtg-deploy.log"; exit $r
```

Run it in the background (`run_in_background: true`, `timeout: 1800000`): the full build
(card generation, engine, server, client) takes several minutes. A failure leaves the old
server running only if the build failed before the restart — read the log's tail and say which.

## 4. Check it from outside

```bash
ssh -o BatchMode=yes deckblitz 'systemctl is-active mtg-server; cd /opt/mtg-engine && git log --oneline -1; curl -s localhost:4010/status | sed -n 2,5p'
node "$(git rev-parse --show-toplevel)/.claude/skills/deploy/check-live.mjs"
```

- The box's `git log` matches `origin/main`, the service is `active`, `/status` shows a fresh
  uptime.
- `check-live.mjs` (exit 0): the page answers 200, and `wss://ws.deckblitz.net` opens through
  the tunnel with **compression on** (board frames are ~500 KB of JSON late in a game; without
  it a slow connection makes the bots crawl).
- Anything UI-visible in the deploy: open https://deckblitz.net/ in the browser pane and look.
  A tab left open across the deploy offers a reload — that's expected.

## 5. Report

Two or three lines: the commit now live, how long the build took, what the checks showed, and
whether any game was ended by the restart.
