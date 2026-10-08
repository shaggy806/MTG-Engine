# Moving the live site to AWS Lightsail and deckblitz.net

**Status:** in progress. Steps 1–5 of the cutover are done (2026-10-08): the instance serves
deckblitz.net, `DEPLOYMENT.md` is rewritten for it, and the repo (`deploy.sh`, the deploy skill)
targets it. Left: step 6's redirects and `ws.tobyens.com` re-route, then step 7's retirement of
the home box. The site moves off the home box `mtgserver` onto an AWS Lightsail instance, and
from `mtg.tobyens.com` to **deckblitz.net** (bought 2026-10-08); this record keeps the reasons.

## What moves, and what doesn't

The production server keeps no data. It runs without `--capture`, rooms live only in memory, and
players' decks and settings are stored in their own browsers. Nothing is copied off the home box:
the new box gets a fresh build of the same commit.

The app's whole production configuration is two values:

- `VITE_SERVER_URL`, built into the client by `deploy.sh`.
- `CLIENT_ORIGIN`, set in the systemd override, which sets `/import-deck`'s CORS header.

The rest is setup on the box (systemd unit, Caddyfile, cloudflared config, sudoers rule), all
written down in `DEPLOYMENT.md`.

## Shape

```
Browser --HTTPS--> Cloudflare edge --tunnel--> cloudflared (on Lightsail)
                                                    |
                                    +---------------+---------------+
                                    |                               |
                              deckblitz.net                  ws.deckblitz.net
                              -> Caddy :8080                 -> Node :4000
                              (static client/dist)           (server, WS + /import-deck)

www.deckblitz.net   -> 301 to deckblitz.net   (Cloudflare redirect rule)
mtg.tobyens.com/*   -> 301 to deckblitz.net   (Cloudflare redirect rule)
ws.tobyens.com      -> the new tunnel, for a few weeks after the switch
```

### Keep Cloudflare and the tunnel

The tunnel was first chosen because the home IP is dynamic. A Lightsail static IP removes that
reason, but the tunnel stays:

- **The rate limiter depends on it.** `clientIp()` in `server/src/ws-server.ts` trusts
  `CF-Connecting-IP` without checking where the request came from. Behind the tunnel only
  Cloudflare can reach :4000, so that's safe. With :4000 or :443 open to the internet, anyone
  could fake the header and get around the per-IP limit. Dropping Cloudflare would need a code
  change (trust the header only from a known proxy) plus a reverse-proxy setup.
- **The status endpoint's reasoning holds unchanged** (`server/src/status.ts`: :4010 is bound to
  loopback and left out of the ingress list).
- **No open ports but SSH**, limited to the home IP in the Lightsail firewall. TLS stays at
  Cloudflare's edge, so Caddy still serves plain HTTP on :8080 with no certificate.

### Bare domain for the client, `ws.` for the socket

Because the domain belongs to the site, the client moves to the bare domain rather than an
`mtg.` subdomain. The game socket keeps its own hostname: the `ws` library ignores the URL path,
so there's no `/ws` route to split on without proxy rewrites, and the client builds the
`/import-deck` URL from `VITE_SERVER_URL` (`client/src/deck-builder/importDeck.ts`).

- `VITE_SERVER_URL=wss://ws.deckblitz.net`
- `CLIENT_ORIGIN=https://deckblitz.net`

## The instance

- **Plan: 2 GB of memory, 2 vCPUs** (about $12/month at the last known prices; check current
  ones). Ubuntu 24.04 LTS, a static IP, and 2 GB of swap.
- **Memory:** the full build (card codegen, a large `tsc`, the Vite bundle) probably peaks above
  1 GB, so the 512 MB and 1 GB plans would likely run out building on the box. Building in CI and
  shipping `dist/` would let a 1 GB plan do. That's a possible later change, not part of the move.
- **CPU is burstable**, and that matters here. Lightsail instances run at full speed until a
  credit balance runs out, then get throttled. Each bot decision has a fixed thinking budget
  (`BOT_DECISION_BUDGET_MS`, 300 ms, `server/src/room.ts`), so on a throttled CPU the bots play
  worse, not just slower. For the first couple of weeks, watch the instance's "CPU burst
  capacity" graph, and move up a plan if it keeps hitting zero.
- **OS:** an LTS release avoids `DEPLOYMENT.md`'s "codename gotcha" (vendor apt repos missing the
  bleeding-edge `resolute`), so Caddy's and cloudflared's normal apt repos should work.
- **Node 22**, to match CI. The home box shows v24 on its status page.
- **Login user:** Lightsail's default is `ubuntu`. Either use it, changing the systemd `User=`
  and the sudoers line to match, or create `shaggy5405` again so those stay as they are.
- **AWS chores in place of home-box ones:** a billing alert, automatic daily snapshots, and a
  manual snapshot before a risky deploy. These replace the router's DHCP reservation, the BIOS
  power-loss setting and the Wi-Fi upload limit (~25 KB/s, the site's bottleneck).

## Players' saved data

Browser storage is tied to the site's address, so on deckblitz.net every player starts with no
saved decks (`client/src/deck-builder/decks.ts`) and default pass and motion settings
(`passSettings.ts`, `motionPrefs.ts`). Three options, cheapest first:

1. **Accept it** and tell the players. Fine if they're mostly the user and friends.
2. **Ask players to copy their decklists out** on the old site before the switch.
3. **A one-time handoff:** before redirecting, the old site reads its saved data and sends the
   player to `deckblitz.net/#import=…`, and the new client loads it once. About half a day of
   client work, and the redirect in the cutover would then have to wait for it. Only worth it if
   real players have built many decks.

**Decided (2026-10-08): accept it.** Too few players have used the site in earnest for their
saved decks to be worth carrying over, so the switch doesn't wait on any client work.

## Cutover (no downtime)

1. **Domain:** add deckblitz.net to Cloudflare and point the registrar's nameservers at it.
2. **Lightsail:** create the instance, attach the static IP, allow only SSH (port 22) from the
   home IP in the firewall, and turn on the billing alert and automatic snapshots.
3. **Provision**, following `DEPLOYMENT.md`:
   - Node 22, Caddy, cloudflared, and the clone at `/opt/mtg-engine`.
   - The `mtg-server` unit, with `CLIENT_ORIGIN=https://deckblitz.net` in the override.
   - The `/etc/sudoers.d/mtg-deploy` line, for whichever user runs the service.
   - The Caddyfile as it stands (`:8080`, the cache headers, `try_files`).
4. **A new tunnel** on the new box (e.g. `mtg-aws`), with its own `config.yml` ingress for
   `deckblitz.net` and `ws.deckblitz.net`, and `cloudflared tunnel route dns` for both. The old
   tunnel keeps serving tobyens.com from home in the meantime.
5. **Test on deckblitz.net** while the old site still runs: a full game against bots, a deck
   import, `check-live.mjs wss://ws.deckblitz.net https://deckblitz.net/`, `/status` over SSH,
   and the CPU burst graph.
6. **Switch:** add the `mtg.tobyens.com/*` → `https://deckblitz.net/$1` redirect rule (301), and
   re-route `ws.tobyens.com` to the new tunnel (add it to the new ingress list, then edit its
   record in the tobyens.com DNS tab to a proxied CNAME to `<tunnel id>.cfargotunnel.com` —
   `route dns` can't, as the new box's cert is for the deckblitz.net zone) so a tab left open on the old site
   keeps working until it's reloaded. Its deck import will fail CORS, which only allows the new
   origin, and a reload fixes it. Add the `www.deckblitz.net` redirect too.
7. **After a week or two:** stop and disable the services on the home box, delete the old
   tunnel (`cloudflared tunnel delete mtg`), and remove `ws.tobyens.com` from the ingress list and
   DNS. Repoint the UptimeRobot monitor at `https://ws.deckblitz.net` at the switch.

## How deploying changes

| | Now (home box) | Lightsail |
|---|---|---|
| Where you can deploy from | Only the home network (`shaggy5405@192.168.0.137`) | Anywhere: SSH to the static IP with your key |
| Deploy script | `deploy.sh`: pull, install, build, restart | The same script. Only the default `VITE_SERVER_URL` changes |
| Build time | Several minutes on a 2014 i3 | Likely similar or faster while CPU credits last |
| Rolling back | Check out an old commit and rebuild | The same, or restore a pre-deploy snapshot |
| If the site is down | Box off, or off the Wi-Fi: someone walks over | Check or reboot the instance from the Lightsail console. A 530 from Cloudflare still means the tunnel is down |
| Checking after a deploy | `check-live.mjs` against tobyens.com | The same script with the new defaults |
| A restart ends games in progress | Yes | Yes: the deploy skill still checks who's playing first |

The deploy is still run from the user's PC over SSH. A manually-triggered GitHub Actions job could
deploy instead, with the SSH key kept as a repo secret, so a deploy could start from anywhere,
cloud sessions included. That can come later, after the move.

## Repo changes, in one commit at the switch

- `deploy.sh`: the default `VITE_SERVER_URL` (`wss://ws.deckblitz.net`), and the header comment
  naming `mtgserver`.
- `.claude/skills/deploy/check-live.mjs`: default URLs `wss://ws.deckblitz.net` and
  `https://deckblitz.net/`.
- `.claude/skills/deploy/SKILL.md`: the SSH target, the description line, and the "timed out"
  troubleshooting (a home-network ping becomes a Lightsail console check).
- `DEPLOYMENT.md`: rewritten for Lightsail. Replace "The box" with the instance, static IP,
  firewall, snapshots and billing alert. Update the topology, hostnames, tunnel ID, sudoers user
  and disaster-recovery notes. Drop the router, BIOS, Wi-Fi and codename sections.
- `.claude/skills/bug-report/SKILL.md` ("the live site (tobyens.com)"), the comment in
  `server/src/status.ts`, and the Scryfall user-agent in `server/scripts/gen-oracle-tags.mjs`.
- The `DEPLOYMENT.md` line in the root `CLAUDE.md`.
- `BACKLOG.md`: delete this plan's line, and set this file's status to shipped.

## Cost

About $12/month for the instance, deckblitz.net's yearly renewal, and a dollar or two a month for
snapshots. The plan's included data transfer is far more than the site uses.
