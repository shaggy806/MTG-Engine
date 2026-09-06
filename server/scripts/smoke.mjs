// Server playground: spins up a room server in-process, has two WebSocket
// clients create a room, claim both seats, and trade a few passes, printing
// each pushed `state` message. A manual eyeball check that the wire protocol
// round-trips end to end — same thing engine/scripts/play.mjs does for the
// engine itself.
//
//   npm run smoke -w server

import { WebSocketServer, WebSocket } from "ws";
import { RoomManager } from "../dist/room-manager.js";
import { attachRoomServer } from "../dist/ws-server.js";

const wss = new WebSocketServer({ port: 0 });
attachRoomServer(wss, new RoomManager());
await new Promise((resolve) => wss.once("listening", resolve));
const port = wss.address().port;
console.log(`smoke server listening on ws://localhost:${port}`);

function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    ws.once("open", () => resolve(ws));
    ws.once("error", reject);
  });
}

function next(ws) {
  return new Promise((resolve, reject) => {
    ws.once("message", (raw) => {
      try {
        resolve(JSON.parse(raw.toString()));
      } catch (err) {
        reject(err);
      }
    });
  });
}

function log(who, message) {
  console.log(`[${who}] <- ${message.type}`, JSON.stringify(message).slice(0, 160));
}

const alice = await connect();
const bob = await connect();

alice.send(JSON.stringify({ type: "create-room" }));
const created = await next(alice);
log("alice", created);
const roomId = created.roomId;

alice.send(
  JSON.stringify({ type: "claim-seat", roomId, seat: "alice", clientToken: "alice-token" }),
);
log("alice", await next(alice));

bob.send(JSON.stringify({ type: "join-room", roomId }));
log("bob", await next(bob));
bob.send(JSON.stringify({ type: "claim-seat", roomId, seat: "bob", clientToken: "bob-token" }));
log("alice", await next(alice)); // rebroadcast once bob's seat is claimed
const bobState = await next(bob);
log("bob", bobState);

const holder = bobState.view.priority.holder;
console.log(`\n${holder} holds priority; dispatching a pass-priority from that seat`);
const holderWs = holder === "alice" ? alice : bob;
const otherWs = holder === "alice" ? bob : alice;
holderWs.send(
  JSON.stringify({ type: "dispatch", roomId, action: { type: "pass-priority", player: holder } }),
);
const [a, b] = await Promise.all([next(holderWs), next(otherWs)]);
log(holder, a);
log(holder === "alice" ? "bob" : "alice", b);

alice.close();
bob.close();
wss.close();
console.log("\nsmoke run OK");
