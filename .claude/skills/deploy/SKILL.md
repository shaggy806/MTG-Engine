---
name: deploy
description: Deploy what's pushed to origin/main to the live site (mtg.tobyens.com, the home box "mtgserver") — pull, rebuild and restart over SSH, then check the site from outside. Use when the user asks to deploy, ship to production, update the live site / server / tobyens.com, or put a fix live.
---

# Deploy to the live site

The live site runs on the home box `mtgserver` (`shaggy5405@192.168.0.137`, reached over SSH
with this PC's key). `DEPLOYMENT.md` is the runbook; this does its "Updating the deployed code"
from here. Deploying restarts the room server, which **ends every game in progress**, so it
only happens when the user asked for it this time.

## 1. Something to deploy

```bash
cd "$(git rev-parse --show-toplevel)" && git fetch -q origin && git status -sb | head -1 && git log --oneline -1 origin/main
```

`deploy.sh` pulls `origin/main`, so the work must be **pushed** (and verified — the `ship`
skill). Unpushed commits on `main`: ship them first, or tell the user they won't go out.

## 2. Reach the box, and see who's playing

```bash
ssh -o BatchMode=yes -o ConnectTimeout=8 shaggy5405@192.168.0.137 'sudo -n true 2>/dev/null && echo "sudo: ok" || echo "sudo: NEEDS PASSWORD"; curl -s localhost:4010/status | sed -n 2,12p; cd /opt/mtg-engine && git status --short | head -5; git log --oneline -1'
```

- **Timed out**: `ping -n 3 192.168.0.137` and
  `curl -s -o /dev/null -w "%{http_code}\n" https://mtg.tobyens.com/` (530 = Cloudflare can't
  reach the box). The box is off or off the Wi-Fi: tell the user to check it, and stop.
- **Humans online** in a `playing` room (the `seats` line): say who and ask before restarting
  — bot-only rooms can go.
- **`sudo: NEEDS PASSWORD`**: `deploy.sh` needs sudo for `systemctl`, and you may not type a
  password. Give the user the command to run themselves (`ssh -t shaggy5405@192.168.0.137
  'cd /opt/mtg-engine && ./deploy.sh'`), then go to step 4.
- **Uncommitted changes** in `/opt/mtg-engine`: `git pull --ff-only` would refuse or carry
  them along. Show them to the user; don't discard them.

## 3. Deploy

```bash
ssh -o BatchMode=yes shaggy5405@192.168.0.137 'cd /opt/mtg-engine && ./deploy.sh' > "$TEMP/mtg-deploy.log" 2>&1; r=$?; tail -25 "$TEMP/mtg-deploy.log"; exit $r
```

Run it in the background (`run_in_background: true`, `timeout: 1800000`): the full build
(card generation, engine, server, client) takes several minutes on the box's 2014 i3. A
failure leaves the old server running only if the build failed before the restart — read the
log's tail and say which.

## 4. Check it from outside

```bash
ssh -o BatchMode=yes shaggy5405@192.168.0.137 'systemctl is-active mtg-server; cd /opt/mtg-engine && git log --oneline -1; curl -s localhost:4010/status | sed -n 2,5p'
node "$(git rev-parse --show-toplevel)/.claude/skills/deploy/check-live.mjs"
```

- The box's `git log` matches `origin/main`, the service is `active`, `/status` shows a fresh
  uptime.
- `check-live.mjs` (exit 0): the page answers 200, and `wss://ws.tobyens.com` opens through
  the tunnel with **compression on** (board frames are ~500 KB of JSON late in a game and the
  box's Wi-Fi uploads ~25 KB/s — `DEPLOYMENT.md`, "The box"; without it the bots crawl).
- Anything UI-visible in the deploy: open https://mtg.tobyens.com/ in the browser pane and
  look. A tab left open across the deploy offers a reload — that's expected.

## 5. Report

Two or three lines: the commit now live, how long the build took, what the checks showed, and
whether any game was ended by the restart.
