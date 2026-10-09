#!/usr/bin/env bash
# Pulls the latest main, rebuilds everything, and restarts the room server.
# Run this on the production box (the Lightsail instance, see DEPLOYMENT.md) after pushing changes.
set -euo pipefail

cd "$(dirname "$0")"

VITE_SERVER_URL="${VITE_SERVER_URL:-wss://ws.deckblitz.net}"

git pull --ff-only
# `npm ci`, not `npm install`: exactly what the lockfile says, and the
# lockfile left alone. Node 22's npm 10 rewrote it on every install (dropping
# the `libc` fields npm 11 records), and a dirty lockfile would make the
# next `git pull --ff-only` refuse once it changed upstream.
npm ci
VITE_SERVER_URL="$VITE_SERVER_URL" npm run build
sudo systemctl daemon-reload
sudo systemctl restart mtg-server

echo "Deployed. Server status:"
sudo systemctl status mtg-server --no-pager
