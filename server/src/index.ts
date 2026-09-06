import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { createDefaultRegistry } from "engine";
import { RoomManager } from "./room-manager.js";
import { attachRoomServer } from "./ws-server.js";
import { evaluateDecklist, parseDecklistText } from "./import-deck.js";

const port = Number(process.env.PORT ?? 4000);
const manager = new RoomManager();
const registry = createDefaultRegistry();

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
          const cards = await evaluateDecklist(parseDecklistText(text), registry);
          res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          });
          res.end(JSON.stringify({ cards }));
        } catch (err) {
          res.writeHead(400, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          });
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
        }
      })();
    });
    return;
  }
  if (req.method === "OPTIONS" && req.url === "/import-deck") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
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
