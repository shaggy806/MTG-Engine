import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { createDefaultRegistry } from "engine";
import { RoomManager } from "./room-manager.js";
import { attachRoomServer } from "./ws-server.js";
import { evaluateDecklist, formatCheck, parseDecklistText } from "./import-deck.js";
import { loadOracleTagIndex } from "./oracle-tags.js";

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
        // Newline-delimited JSON, streamed: one `{type:"progress"}` line per
        // resolved card, then a single `{type:"result"}` line. A long
        // decklist spends a throttled Scryfall round-trip on every card the
        // engine doesn't implement, so the client needs to see it moving
        // rather than stare at a silent request for half a minute.
        let streaming = false;
        const write = (line: unknown): void => {
          res.write(`${JSON.stringify(line)}\n`);
        };
        try {
          const { text } = JSON.parse(body) as { text?: string };
          if (typeof text !== "string") throw new Error("missing 'text' field");
          const { entries, commanders } = parseDecklistText(text);

          res.writeHead(200, {
            "Content-Type": "application/x-ndjson",
            "Cache-Control": "no-cache, no-transform",
            // Asks an intermediate proxy not to buffer the body, which would
            // defeat the point of streaming it.
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": clientOrigin,
          });
          streaming = true;
          write({ type: "progress", done: 0, total: entries.length, name: null });

          const cards = await evaluateDecklist(
            entries,
            registry,
            (p) => write({ type: "progress", ...p }),
            { commanders, tags: loadOracleTagIndex() },
          );
          const format = formatCheck(entries, registry, commanders);
          write({ type: "result", cards, format });
          res.end();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (streaming) {
            // Headers are already out at 200 — the only way left to report
            // the failure is an error line the client watches for.
            write({ type: "error", error: message });
            res.end();
            return;
          }
          res.writeHead(400, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": clientOrigin,
          });
          res.end(JSON.stringify({ error: message }));
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
