// One self-play game per message for `bot-crackback.mjs`: every attack
// declaration logged with what the table was showing, and whether the
// attacker died before its own next turn. See the driver for what and why.

import { parentPort } from "node:worker_threads";

import {
  COMMANDER_RULES,
  DEFAULT_WEIGHTS,
  EvalBotController,
  Game,
  activePlayerOf,
  combatCreatures,
  createDefaultRegistry,
  damageThrough,
  isLethal,
} from "../dist/index.js";
import { tableFor } from "./bot-seating.mjs";

const registry = createDefaultRegistry();

/** Living opponents in the order they act after `me`. */
function opponentsAfter(state, me) {
  const order = state.turnOrder.filter((p) => !state.players[p].hasLost);
  const i = order.indexOf(me);
  return [...order.slice(i + 1), ...order.slice(0, Math.max(0, i))];
}

/**
 * What could come back at `me` with `blockers` home: each opponent swinging
 * every creature able to attack, through `combat-math.ts`'s best blocks.
 * `lethalAll` counts every opponent in full; `lethalNext` only the next one;
 * `lethalBot` is the bot's own reading with `weights` — the next opponent in
 * full, the rest at `crackbackParanoia`, `crackbackMargin` held back, and no
 * `crackbackGrowth`, so the readings stay comparable across weight vectors.
 */
function threat(state, me, blockers, weights) {
  const per = opponentsAfter(state, me).map((o) => {
    const attackers = combatCreatures(state, registry, o, false).filter((c) => c.canAttack);
    return damageThrough(attackers, blockers);
  });
  const sum = (weight) => {
    let damage = 0;
    const commanderDamage = new Map();
    per.forEach((through, i) => {
      const w = weight(i);
      damage += through.damage * w;
      for (const [k, v] of through.commanderDamage) commanderDamage.set(k, (commanderDamage.get(k) ?? 0) + v * w);
    });
    return { damage, commanderDamage };
  };
  const bot = sum((i) => (i === 0 ? 1 : weights.crackbackParanoia));
  return {
    life: state.players[me].life,
    alive: per.length + 1,
    nextThrough: per[0]?.damage ?? 0,
    allThrough: per.reduce((s, t) => s + t.damage, 0),
    botThrough: bot.damage,
    lethalNext: per.length > 0 && isLethal(state, me, per[0]),
    lethalAll: isLethal(state, me, sum(() => 1)),
    lethalBot: isLethal(state, me, bot, -weights.crackbackMargin),
  };
}

/** What can give `player`'s creatures haste: a static "have haste" grant on
 * the battlefield or (Anger) in the graveyard, or an ability granting it. */
function hasteEnablers(state, player) {
  const out = [];
  for (const id of state.zones.shared.battlefield) {
    const o = state.objects[id];
    if (o?.controller !== player || !registry.has(o.cardName)) continue;
    const def = registry.get(o.cardName);
    const grants = (def.static ?? []).some(
      (st) => (st.grantKeywords ?? []).includes("haste") && st.affects?.scope !== "self" && !st.fromGraveyard,
    );
    if (grants || JSON.stringify([def.activated ?? [], def.triggered ?? []]).includes('"haste"')) out.push(o.cardName);
  }
  for (const id of state.zones.perPlayer[player]?.graveyard ?? []) {
    const o = state.objects[id];
    if (o === undefined || !registry.has(o.cardName)) continue;
    if ((registry.get(o.cardName).static ?? []).some((st) => st.fromGraveyard && (st.grantKeywords ?? []).includes("haste"))) {
      out.push(`${o.cardName} (graveyard)`);
    }
  }
  return out;
}

const nativeHaste = (name) => registry.has(name) && (registry.get(name).keywords ?? []).includes("haste");

parentPort.on("message", ({ seed, players, weights: overrides }) => {
  const weights = { ...DEFAULT_WEIGHTS, ...overrides };
  const { seats, decks } = tableFor(seed, players);
  const records = [];
  /** Per seat, its latest swing still waiting for the board it hands over. */
  const awaitingHandoff = new Map();
  let game = null;

  const observe = (state) => {
    // The first decision anyone makes once the attacker's turn is over reads
    // the board the opponents actually got: combat resolved, blockers dead,
    // players the attack killed gone, its attackers still tapped.
    for (const [seat, rec] of awaitingHandoff) {
      if (state.turn.number === rec.turn) continue;
      awaitingHandoff.delete(seat);
      if (state.players[seat].hasLost) continue;
      rec.handoff = threat(state, seat, combatCreatures(state, registry, seat, true), weights);
    }
  };

  const controllers = {};
  for (const seat of seats) {
    const controller = new EvalBotController(seat, registry, overrides ? { weights } : {});
    const act = controller.act.bind(controller);
    controller.act = (view) => {
      const state = view.state;
      observe(state);
      const action = act(view);
      if (state.awaiting?.kind !== "attackers" || action.type !== "declare-attackers" || activePlayerOf(state) !== seat) {
        return action;
      }
      const legal = view.legalActions().find((l) => l.kind === "declare-attackers");
      const eligible = combatCreatures(state, registry, seat, false).filter(
        (c) => c.damage > 0 && legal.eligible.includes(c.id),
      ).length;
      if (eligible === 0) return action;
      const declared = new Map();
      for (const d of action.attackers) {
        const n = d.count ?? Math.min(state.objects[d.attacker]?.stackCount ?? 1, 30);
        declared.set(d.attacker, (declared.get(d.attacker) ?? 0) + n);
      }
      const sent = [...declared.values()].reduce((a, b) => a + b, 0);
      // Home to block: untapped creatures not sent, and vigilant attackers.
      const untapped = combatCreatures(state, registry, seat, true);
      const home = untapped.filter((c) => {
        if (c.keywords.has("vigilance")) return c.canBlock;
        const n = declared.get(c.id) ?? 0;
        if (n > 0) {
          declared.set(c.id, n - 1);
          return false;
        }
        return c.canBlock;
      });
      const rec = {
        seat,
        deck: decks[seats.indexOf(seat)].name,
        turn: state.turn.number,
        eligible,
        sent,
        couldBlock: untapped.filter((c) => c.canBlock).length,
        home: home.length,
        holdingBack: threat(state, seat, untapped, weights),
        swinging: threat(state, seat, home, weights),
        handoff: null,
        hasteEnablers: opponentsAfter(state, seat).flatMap((o) => hasteEnablers(state, o)),
        eventIndex: game?.events.length ?? 0,
        onBoard: opponentsAfter(state, seat).flatMap((o) => combatCreatures(state, registry, o, false).map((c) => c.id)),
        died: null,
      };
      records.push(rec);
      awaitingHandoff.set(seat, rec);
      return action;
    };
    controllers[seat] = controller;
  }

  try {
    game = Game.create({
      seed,
      registry,
      controllers,
      mulligans: true,
      rules: COMMANDER_RULES,
      decks: seats.map((player, i) => ({ player, cards: decks[i].cards, commanders: decks[i].commanders })),
    });
    game.advance();
  } catch (error) {
    parentPort.postMessage({ seed, error: String(error?.stack ?? error) });
    return;
  }

  // Close each record: walk the opponents' turns up to the attacker's next
  // one, and if it died in them, say what did it.
  const { events, state } = game;
  for (const rec of records) {
    const onBoard = new Set(rec.onBoard);
    const took = { onBoard: 0, arrived: 0, noncombat: 0, lifeLost: 0, hastyNative: 0, hastyGranted: 0 };
    const hasty = [];
    const sources = new Set();
    let opponentsTurn = false;
    let enteredThisTurn = new Set();
    let reachedNextTurn = false;
    for (let i = rec.eventIndex; i < events.length; i += 1) {
      const e = events[i];
      if (e.type === "turn-began") {
        if (e.activePlayer === rec.seat) {
          reachedNextTurn = true;
          break;
        }
        opponentsTurn = true;
        enteredThisTurn = new Set();
        continue;
      }
      // Dying on its own turn after the swing (a blocker's trigger, its own
      // drain) counts too, with `onTurnOf` itself.
      if (e.type === "player-lost" && e.player === rec.seat) {
        let onTurnOf = null;
        for (let j = i; j >= 0; j -= 1) {
          if (events[j].type === "turn-began") {
            onTurnOf = events[j].activePlayer;
            break;
          }
        }
        rec.died = { reason: e.reason, onTurnOf, ...took, hasty, opponents: sources.size };
        break;
      }
      if (!opponentsTurn) continue;
      if (e.type === "permanent-entered-battlefield" || e.type === "control-changed") enteredThisTurn.add(e.object);
      if (e.type === "damage-dealt" && e.target.kind === "player" && e.target.player === rec.seat && e.amount > 0) {
        const name = state.objects[e.source]?.cardName ?? null;
        const controller = state.objects[e.source]?.controller;
        if (controller !== undefined) sources.add(controller);
        if (!e.combat) took.noncombat += e.amount;
        else if (onBoard.has(e.source)) took.onBoard += e.amount;
        else took.arrived += e.amount;
        // Attacked the turn it arrived: it had haste from somewhere.
        if (e.combat && enteredThisTurn.has(e.source)) {
          if (name !== null && nativeHaste(name)) took.hastyNative += e.amount;
          else took.hastyGranted += e.amount;
          hasty.push(name ?? "?");
        }
      }
      if (e.type === "life-changed" && e.player === rec.seat && e.delta < 0) took.lifeLost -= e.delta;
    }
    // A swing that ended the game in the attacker's favour has no crackback to
    // measure.
    rec.unresolved = rec.died === null && !reachedNextTurn && state.result.winner === rec.seat;
    delete rec.eventIndex;
    delete rec.onBoard;
  }
  parentPort.postMessage({
    seed,
    weights: overrides ?? null,
    turns: state.turn.number,
    winner: state.result.winner,
    seats,
    records,
  });
});
