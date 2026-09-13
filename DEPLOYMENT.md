# Deployment

MTG-Engine runs in production self-hosted on an old PC at home ("mtgserver"), reachable at
**tobyens.com**, with no ports forwarded on the home router — a Cloudflare Tunnel carries all
traffic in over an outbound-only connection instead. This file is the from-scratch runbook: what
was set up, why, and what to do if the box needs rebuilding.

## Topology

```
Browser --HTTPS--> Cloudflare edge --tunnel--> cloudflared (on mtgserver)
                                                    |
                                    +---------------+---------------+
                                    |                               |
                          mtg.tobyens.com                  ws.tobyens.com
                          -> Caddy :8080                   -> Node :4000
                          (static client/dist)             (server, WS + /import-deck)
```

Two subdomains, not one, because the `ws` library's WebSocket server doesn't route on URL path —
it treats every path the same. Splitting by *hostname* instead lets `ws.tobyens.com` forward
straight to the Node process with zero proxy logic, while `mtg.tobyens.com` serves the built
static client. This matches the client's own dev-time convention: `VITE_SERVER_URL` is "one
origin, everything for the game goes there" (`client/src/net/useNetworkGame.ts`,
`client/src/App.tsx`), so no client code changes were needed beyond setting that one build-time
env var to `wss://ws.tobyens.com`.

Cloudflare terminates TLS at its edge; the hop from Cloudflare to the box travels through the
tunnel (already encrypted), so nothing on the box itself needs its own certificate — Caddy runs
plain HTTP internally on `:8080`.

## Why no port-forwarding

The home connection turned out to have a real public IP (no CGNAT — checked by comparing the
router's WAN IP against `whatismyipaddress.com`; they matched). Port-forwarding would have
worked, but Cloudflare Tunnel was used anyway because the connection type is dynamic ("Dynamic
IP" on the router status page), so a Dynamic DNS updater would otherwise be a second thing to
keep alive. The tunnel makes an outbound-only connection from the box to Cloudflare, so it
survives an IP change silently, needs no forwarded ports, and no firewall holes on the box at all.

## The box

- Hostname `mtgserver`, Ubuntu Server (minimized install — deliberately, since this box only
  runs Node + Caddy + cloudflared and a smaller install means less to patch on a
  publicly-reachable machine). No desktop environment; administered entirely over SSH.
- Login user: `shaggy5405`. The Node server, Caddy, and cloudflared all run as this user (not a
  dedicated service account) — a simplification acceptable for a single-purpose hobby box.
- **Static local IP**: a DHCP reservation on the router (TP-Link Archer A6, admin at
  `192.168.0.1`), not a static netplan config on the box — reserved by MAC address so it survives
  OS reinstalls. Currently reserved: `d0:53:49:fc:7e:7e` (the `wlp3s0` Wi-Fi adapter) →
  `192.168.0.137`. (Ethernet was recommended over Wi-Fi for reliability but wasn't available at
  setup time — if the box moves to a wired connection later, add a *second* reservation for the
  `enp2s0` MAC address rather than editing this one, unless Wi-Fi is being retired entirely.)
  Router path: Advanced → Network → DHCP Server → Address Reservation.
- Node.js installed via the NodeSource setup script (`setup_22.x`), not Ubuntu's own repo (which
  lags far behind).
- Repo cloned to `/opt/mtg-engine` from the public GitHub repo
  (`https://github.com/shaggy806/MTG-Engine.git`), owned by `shaggy5405`.

## The game server (systemd)

`/etc/systemd/system/mtg-server.service`:

```ini
[Unit]
Description=MTG Engine room server
After=network.target

[Service]
WorkingDirectory=/opt/mtg-engine/server
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=2
Environment=PORT=4000
User=shaggy5405

[Install]
WantedBy=multi-user.target
```

Plus a drop-in override (`sudo systemctl edit mtg-server`, stored at
`/etc/systemd/system/mtg-server.service.d/override.conf`) that locks down `/import-deck`'s CORS
header to the real client origin instead of the `server/src/index.ts` default of `*`:

```ini
[Service]
Environment=CLIENT_ORIGIN=https://mtg.tobyens.com
```

`enabled` so it starts on boot; `Restart=on-failure` so a crash comes back on its own.
Server-side hardening for being open to the internet (rate-limiting connections per IP, reaping
idle rooms) is in the code itself, not config — see `server/src/ws-server.ts` and
`server/src/room-manager.ts`.

## The static client (Caddy)

Caddy installed via its own apt repo (using `codename=any-version` rather than the box's actual
Ubuntu codename — see "codename gotcha" below). `/etc/caddy/Caddyfile`:

```
:8080 {
    root * /opt/mtg-engine/client/dist
    file_server
    try_files {path} /index.html
}
```

No TLS block — Cloudflare already terminated HTTPS before this ever sees the request. The client
build that populates `client/dist/` must be built with `VITE_SERVER_URL=wss://ws.tobyens.com`
(see `deploy.sh` below) — a build without that env var falls back to a LAN-only
`ws://<hostname>:4000` default meant for local dev.

## Cloudflare Tunnel

- Domain `tobyens.com` registered and its nameservers pointed at Cloudflare.
- `cloudflared` installed by downloading the `.deb` directly from GitHub releases rather than
  Cloudflare's own apt repo — see "codename gotcha" below.
- Authenticated once via `cloudflared tunnel login` (opens a URL, approved in a browser already
  logged into the Cloudflare account, authorizing `tobyens.com`). Writes
  `~/.cloudflared/cert.pem`.
- One tunnel, named `mtg`, id `c9d667c6-768a-4936-88ea-01c346f3ad42`, created with
  `cloudflared tunnel create mtg`. Its credentials file lives at
  `/home/shaggy5405/.cloudflared/c9d667c6-768a-4936-88ea-01c346f3ad42.json` — **not** checked
  into git, and required for the tunnel to run (see recovery notes below).
- Config at `/etc/cloudflared/config.yml`:

  ```yaml
  tunnel: c9d667c6-768a-4936-88ea-01c346f3ad42
  credentials-file: /home/shaggy5405/.cloudflared/c9d667c6-768a-4936-88ea-01c346f3ad42.json

  ingress:
    - hostname: mtg.tobyens.com
      service: http://localhost:8080
    - hostname: ws.tobyens.com
      service: http://localhost:4000
    - service: http_status:404
  ```

- DNS records created via `cloudflared tunnel route dns mtg mtg.tobyens.com` and
  `cloudflared tunnel route dns mtg ws.tobyens.com` (CNAMEs to the tunnel, managed by Cloudflare
  automatically).
- Running as a systemd service via `sudo cloudflared service install` (reads the config above by
  default). `enabled`, so it starts on boot alongside `mtg-server` and Caddy.

### Codename gotcha

The box's Ubuntu release was new enough (`lsb_release -cs` → `resolute`) that both Cloudflare's
`cloudflared` apt repo and — potentially — other vendor repos hadn't published packages for that
codename yet, giving a `404 Not Found` on `apt update`. Fixes used:
- `cloudflared`: skip the apt repo, download the `.deb` directly —
  `https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb`
  (a static binary, doesn't care about the codename at all).
- Caddy: pin the apt source to `codename=any-version` instead of the real codename.

If a future OS upgrade hits the same wall with some other package, prefer whichever of these two
patterns fits (direct `.deb` download for a static-binary tool, or a generic/pinned codename for
an apt repo) over fighting the repo config.

## Updating the deployed code

```
cd /opt/mtg-engine
./deploy.sh
```

`deploy.sh` (repo root): `git pull --ff-only` → `npm install` → rebuild engine/server/client with
`VITE_SERVER_URL=wss://ws.tobyens.com` baked into the client → `sudo systemctl restart
mtg-server`. Caddy and cloudflared don't need restarting for an ordinary code change — only
`mtg-server` actually changes. **A `sudo reboot` does *not* deploy new code** — it just restarts
whatever's already built on disk; always run `./deploy.sh` instead.

## Operational odds and ends

- **BIOS power-loss recovery**: set to "restore last state" / "power on" in the box's BIOS/UEFI
  setup, so a power outage doesn't leave the server down until someone physically walks over and
  presses the button.
- **Uptime monitoring**: a free UptimeRobot HTTP(S) monitor against `https://ws.tobyens.com`
  (5-minute interval, email/push alerts) — set up outside the repo, at uptimerobot.com.
- **Idle-room reaping**: rooms with no connected seats are deleted after 2 hours
  (`IDLE_ROOM_MS` in `server/src/index.ts`), swept every 15 minutes — no manual cleanup needed.
- **Rate limiting**: per-IP (via Cloudflare's `CF-Connecting-IP` header, since the tunnel means
  the socket's own remote address is always Cloudflare's edge, not the real visitor), 40
  messages per 5-second window — see `server/src/ws-server.ts`.

## Local development is unaffected

None of the above changes the local dev workflow. `npm run dev -w server` still binds to plain
`ws://localhost:4000`; `npm run dev -w client` still defaults to `ws://<hostname>:4000` unless
`VITE_SERVER_URL` is set; `CLIENT_ORIGIN` defaults to `*` when unset; the rate limiter's
threshold is generous enough that normal testing (including `npm run play:random`, the fuzzer)
never trips it. The production-specific values are only ever applied via the systemd override on
the box itself and the `VITE_SERVER_URL` passed into `deploy.sh`'s build step.

## Rebuilding from scratch (disaster recovery)

If the box's disk dies, everything in this file except two things can be reconstructed by
following it top to bottom on a fresh install:

1. **The Cloudflare Tunnel credentials** (`~/.cloudflared/cert.pem` and the tunnel's `.json`
   credentials file) live only on the box, are not in git, and can't be recovered — re-run
   `cloudflared tunnel login` and `cloudflared tunnel create` to mint a new tunnel, then
   `cloudflared tunnel route dns` again for both subdomains (this silently replaces the old
   CNAME records) and delete the old tunnel (`cloudflared tunnel delete mtg`, using the old ID)
   once the new one is confirmed working.
2. **The router's DHCP reservation** is configuration on the router, not the box — re-add it for
   whatever MAC address the rebuilt box's active network interface reports.

Everything else — the systemd unit files, the Caddyfile, the cloudflared `config.yml`, the code
itself — is either in this document or in the git history.
