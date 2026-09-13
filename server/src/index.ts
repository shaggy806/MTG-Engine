import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { createDefaultRegistry } from "engine";
import { RoomManager } from "./room-manager.js";
import { attachRoomServer } from "./ws-server.js";
import { evaluateDecklist, formatCheck, parseDecklistText } from "./import-deck.js";

const port = Number(process.env.PORT ?? 4000);
// "*" is fine for local/LAN dev; set CLIENT_ORIGIN to the real site once
// this is reachable from the open internet so a stranger's page can't drive
// this endpoint against a browser that happens to have it open.
const clientOrigin = process.env.CLIENT_ORIGIN ?? "*";
const manager = new RoomManager();
const registry = createDefaultRegistry();

const IDLE_ROOM_MS = 2 * 60 * 60 * 1000;
const REAP_INTERVAL_MS = 15 * 60 * 1000;
setInterval(() => {
  const reaped = manager.reapIdle(IDLE_ROOM_MS);
  if (reaped > 0) console.log(`reaped ${reaped} idle room(s)`);
}, REAP_INTERVAL_MS);

const httpServer = createServer((req, res) => {
  if (req.method === "POST" && req.url === "/import-deck") {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk;
    });
    req.on("end", () => {
      void (async () => {
        try {
          const { text } = JSON.parse(body) as { text?: string };
          if (typeof text !== "string") throw new Error("missing 'text' field");
          const entries = parseDecklistText(text);
          const cards = await evaluateDecklist(entries, registry);
          const format = formatCheck(entries, registry);
          res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": clientOrigin,
          });
          res.end(JSON.stringify({ cards, format }));
        } catch (err) {
          res.writeHead(400, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": clientOrigin,
          });
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
        }
      })();
    });
    return;
  }
  if (req.method === "OPTIONS" && req.url === "/import-deck") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": clientOrigin,
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: httpServer });
attachRoomServer(wss, manager);

httpServer.listen(port, () => {
  console.log(`MTG-Engine room server listening on ws://localhost:${port}`);
});
