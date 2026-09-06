import { WebSocketServer } from "ws";
import { RoomManager } from "./room-manager.js";
import { attachRoomServer } from "./ws-server.js";

const port = Number(process.env.PORT ?? 4000);
const manager = new RoomManager();
const wss = new WebSocketServer({ port });
attachRoomServer(wss, manager);

console.log(`MTG-Engine room server listening on ws://localhost:${port}`);
