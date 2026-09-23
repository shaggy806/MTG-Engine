// A room server preloaded with known board states, for checking client
// changes in a browser without playing a game up to the position under test.
//
//   npm run build -w engine && npm run dev-rooms -w server
//   npm run dev -w client        # then open http://localhost:5173/?room=FOURP
//
// Serves every scenario in scripts/dev-scenarios.mjs as a room on
// ws://localhost:4000 (or $PORT), in place of the real server, and takes
// commands on a loopback-only HTTP port, 4099 (or $CONTROL_PORT):
//
//   curl -s localhost:4099 -d '{"op":"list"}'
//   curl -s localhost:4099 -d '{"op":"state","room":"FOURP"}'
//   curl -s localhost:4099 -d '{"op":"reset","room":"FOURP"}'
//   curl -s localhost:4099 -d '{"op":"spawn","room":"FOURP","player":"alice","cards":["Serra Angel"]}'
//   curl -s localhost:4099 -d '{"op":"move","room":"FOURP","names":["Serra Angel"],"to":"graveyard"}'
//   curl -s localhost:4099 -d '{"op":"life","room":"FOURP","player":"dave","value":5}'
//   curl -s localhost:4099 -d '{"op":"eval","room":"FOURP","js":"return game.state.turn"}'
//
// Every command that changes a room pushes the result to its browsers at
// once. Changes go straight into the game the way `Game.debugSpawn` does, so
// anything they trigger (a creature leaving under Vela, say) waits for the
// next priority window like any other trigger. `reset` is the clean way
// back: it rebuilds the room from its scenario and drops every connection,
// and each tab reconnects and reclaims its seat by itself.
//
// Rooms pace their bots the way the real server does (realtime, one move per
// frame shown), so animations and the ack gate behave as they do in play.

import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { COMMANDER_RULES, Game, HeuristicBotController, createDefaultRegistry } from "engine";
import { Room } from "../dist/room.js";
import { RoomManager } from "../dist/room-manager.js";
import { attachRoomServer } from "../dist/ws-server.js";
import SCENARIOS, { COMMANDERS } from "./dev-scenarios.mjs";

const PORT = Number(process.env.PORT ?? 4000);
const CONTROL_PORT = Number(process.env.CONTROL_PORT ?? 4099);
const registry = createDefaultRegistry();
const BASICS = ["Plains", "Island", "Swamp", "Mountain", "Forest"];
const basics = (n) => Array.from({ length: n }, (_, i) => BASICS[i % BASICS.length]);

/**
 * A bot that does only what its scenario says, so the decision under test
 * comes up on cue: it passes every priority window except for scripted casts
 * on its own precombat main, attacks only if told whom, and blocks only the
 * named attacker with the named creatures. Anything else it's asked (a
 * discard, a sacrifice) goes to v1's answer.
 */
class ScriptedBot extends HeuristicBotController {
  constructor(player, script = {}) {
    super(player, registry);
    this.script = script;
    this.casts = [...(script.casts ?? [])];
  }

  act(view) {
    const s = view.state;
    if (s.awaiting) return super.act(view);
    const active = s.turnOrder[s.turn.activePlayerIndex];
    const onOwnMain = active === this.playerId && s.turn.step === "precombat-main";
    if (onOwnMain && s.zones.shared.stack.length === 0 && this.casts.length > 0) {
      const { name, target } = this.casts[0];
      const cast = view
        .legalActions()
        .find((a) => a.kind === "cast-spell" && s.objects[a.card]?.cardName === name);
      if (cast) {
        this.casts.shift();
        const options = cast.targetOptions?.[0] ?? [];
        const chosen = options.find((o) => o.kind === "player" && o.player === target) ?? options[0];
        return { type: "cast-spell", player: this.playerId, card: cast.card, targets: chosen ? [chosen] : [] };
      }
    }
    return { type: "pass-priority", player: this.playerId };
  }

  declareAttackers(view) {
    const at = this.script.attack;
    const offer = at ? view.legalActions().find((a) => a.kind === "declare-attackers") : null;
    if (!offer) return [];
    return offer.eligible
      .filter((id) => (offer.defendersFor[id] ?? []).includes(at))
      .map((attacker) => ({ attacker, defender: at }));
  }

  declareBlockers(view) {
    const rule = this.script.block;
    if (!rule) return [];
    const s = view.state;
    const battlefield = s.zones.shared.battlefield;
    const target = battlefield.find(
      (id) => s.objects[id]?.cardName === rule.attacker && s.objects[id]?.attacking,
    );
    if (!target) return [];
    return battlefield
      .filter((id) => {
        const o = s.objects[id];
        return o?.controller === this.playerId && o.cardName === rule.with && !o.tapped;
      })
      .map((blocker) => ({ blocker, attacker: target }));
  }
}

function buildGame(scenario) {
  const players = scenario.players;
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: COMMANDER_RULES,
    decks: players.map((player) => ({
      player,
      cards: basics(60),
      commander: scenario.commanders?.[player] ?? COMMANDERS[player],
    })),
  });
  const start = scenario.start ?? "precombat-main";
  game.advanceUntil((s) => s.turn.step === start && s.priority.holder === players[0]);

  const ids = {};
  for (const player of players) {
    for (const land of basics(scenario.lands?.[player] ?? 0)) {
      game.debugSpawn(land, player, "battlefield", { summoningSick: false });
    }
    ids[player] = (scenario.battlefield?.[player] ?? []).map((name) =>
      game.debugSpawn(name, player, "battlefield", { summoningSick: false }),
    );
    for (const name of scenario.hand?.[player] ?? []) game.debugSpawn(name, player, "hand");
    if (scenario.life?.[player] !== undefined) game.state.players[player].life = scenario.life[player];
  }
  scenario.setup?.(game, ids);
  return game;
}

const manager = new RoomManager();
/** code -> { room, game } for every scenario currently being served. */
const live = new Map();

function buildRoom(code) {
  const scenario = SCENARIOS[code];
  const game = buildGame(scenario);
  const bots = scenario.bots ?? {};
  const room = new Room(code, game, {
    pacing: "realtime",
    botController: (player) => new ScriptedBot(player, bots[player] ?? {}),
  });
  for (const player of Object.keys(bots)) room.addBot(player);
  room.start();
  // `RoomManager` has no public way to adopt a hand-built room. The
  // transport binds a room's frames to itself on first message
  // (`requireRoom`), which is the pattern this relies on.
  manager.rooms.set(code, room);
  live.set(code, { room, game });
}

for (const code of Object.keys(SCENARIOS)) buildRoom(code);

const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer });
attachRoomServer(wss, manager);

// ---- the control port --------------------------------------------------

const describe = (game, id) => {
  const o = game.state.objects[id];
  const bits = [o.cardName];
  if (o.tapped) bits.push("tapped");
  if (o.counters?.loyalty !== undefined) bits.push(`loyalty ${o.counters.loyalty}`);
  if (o.attacking) bits.push(`attacking ${o.attacking}`);
  return `${id} ${bits.join(", ")}`;
};

function stateOf(game) {
  const s = game.state;
  const players = {};
  for (const p of s.turnOrder) {
    players[p] = {
      life: s.players[p].life,
      hand: s.zones.perPlayer[p].hand.map((id) => describe(game, id)),
      battlefield: s.zones.shared.battlefield
        .filter((id) => s.objects[id].controller === p && !BASICS.includes(s.objects[id].cardName))
        .map((id) => describe(game, id)),
      lands: s.zones.shared.battlefield.filter(
        (id) => s.objects[id].controller === p && BASICS.includes(s.objects[id].cardName),
      ).length,
      command: s.zones.shared.command
        .filter((id) => s.objects[id].owner === p)
        .map((id) => describe(game, id)),
    };
  }
  return {
    turn: s.turn.number,
    active: s.turnOrder[s.turn.activePlayerIndex],
    step: s.turn.step,
    priority: s.priority.holder,
    awaiting: s.awaiting ? `${s.awaiting.kind} (${s.awaiting.player ?? "several"})` : null,
    stack: s.zones.shared.stack.map((id) => describe(game, id)),
    players,
  };
}

/** Object ids from `ids`, or every object named in `names` (optionally only
 * `player`'s), anywhere but the library. */
function resolveIds(game, { ids, names, player }) {
  if (ids) return ids;
  const s = game.state;
  return Object.keys(s.objects).filter((id) => {
    const o = s.objects[id];
    return (
      names?.includes(o.cardName) &&
      o.zone !== "library" &&
      (player === undefined || o.controller === player || o.owner === player)
    );
  });
}

const ops = {
  list: () =>
    Object.fromEntries(
      [...live].map(([code, { game }]) => [
        code,
        {
          about: SCENARIOS[code].about,
          players: game.state.turnOrder,
          bots: Object.keys(SCENARIOS[code].bots ?? {}),
          step: `turn ${game.state.turn.number}, ${game.state.turn.step}`,
          url: `http://localhost:5173/?room=${code}`,
        },
      ]),
    ),
  state: (_room, game) => stateOf(game),
  reset: (room, _game, cmd) => {
    room.dispose();
    manager.rooms.delete(cmd.room);
    buildRoom(cmd.room);
    // Tabs reconnect on their own and reclaim their seat with the token they
    // already hold; the rebuilt room has every seat free, so the claim lands.
    for (const client of wss.clients) client.close();
    return { reset: cmd.room };
  },
  spawn: (_room, game, cmd) => {
    const zone = cmd.zone ?? "battlefield";
    return cmd.cards.map((name) =>
      game.debugSpawn(name, cmd.player, zone, {
        summoningSick: cmd.sick === true ? undefined : false,
        tapped: cmd.tapped === true,
      }),
    );
  },
  move: (_room, game, cmd) => {
    const ids = resolveIds(game, cmd);
    for (const id of ids) game.moveObject(id, cmd.to);
    return ids;
  },
  life: (_room, game, cmd) => {
    game.state.players[cmd.player].life = cmd.value;
    return { [cmd.player]: cmd.value };
  },
  eval: (room, game, cmd) => new Function("game", "room", "registry", cmd.js)(game, room, registry),
};
/** Commands that change a room, and so push a frame afterwards. */
const MUTATES = new Set(["spawn", "move", "life", "eval"]);

createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    res.setHeader("Content-Type", "application/json");
    try {
      const cmd = body ? JSON.parse(body) : { op: "list" };
      const op = ops[cmd.op];
      if (!op) throw new Error(`unknown op "${cmd.op}" (try: ${Object.keys(ops).join(", ")})`);
      let result;
      if (cmd.op === "list") {
        result = op();
      } else {
        const entry = live.get(cmd.room);
        if (!entry) throw new Error(`no room "${cmd.room}" (try: ${[...live.keys()].join(", ")})`);
        result = op(entry.room, entry.game, cmd);
        if (MUTATES.has(cmd.op)) entry.room.publish();
      }
      res.end(`${JSON.stringify(result ?? null, null, 2)}\n`);
    } catch (err) {
      res.statusCode = 400;
      res.end(`${JSON.stringify({ error: String(err?.message ?? err) })}\n`);
    }
  });
}).listen(CONTROL_PORT, "127.0.0.1");

httpServer.listen(PORT, () => {
  console.log(`dev rooms on ws://localhost:${PORT}, commands on http://127.0.0.1:${CONTROL_PORT}`);
  for (const [code, info] of Object.entries(ops.list())) {
    console.log(`  ${code}  ${info.url}\n         ${info.about}`);
  }
});
