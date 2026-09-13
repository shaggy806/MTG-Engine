#!/usr/bin/env bash
# Pulls the latest main, rebuilds everything, and restarts the room server.
# Run this on the production box (mtgserver) after pushing changes.
set -euo pipefail

cd "$(dirname "$0")"

VITE_SERVER_URL="${VITE_SERVER_URL:-wss://ws.tobyens.com}"

git pull --ff-only
npm install
VITE_SERVER_URL="$VITE_SERVER_URL" npm run build
sudo systemctl restart mtg-server

echo "Deployed. Server status:"
sudo systemctl status mtg-server --no-pager
