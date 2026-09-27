// One self-play game per message for `bot-behaviour.mjs`: every seat the same
// bot, every decision it makes counted. See the driver for what and why.

import { parentPort } from "node:worker_threads";
import { performance } from "node:perf_hooks";

import {
  COMMANDER_RULES,
  DEFAULT_WEIGHTS,
  EvalBotController,
  Game,
  HeuristicBotController,
  activePlayerOf,
  createDefaultRegistry,
  modalPolarities,
  offerPolarities,
  pendingTargetPolarities,
  sideOf,
  specSide,
} from "../dist/index.js";
import { tableFor } from "./bot-seating.mjs";

const registry = createDefaultRegistry();

const KINDS = ["dead", "manaOnly", "real", "decision", "combat"];

function newStats() {
  const perKind = () => Object.fromEntries(KINDS.map((k) => [k, 0]));
  return {
    windows: perKind(),
    ms: perKind(),
    maxMs: perKind(),
    overBudget: perKind(),
    simulations: {},
    ownTurns: 0,
    idleTurns: 0,
    idleCards: {},
    landSkips: 0,
    targeted: 0,
    wrongSide: 0,
    avoidable: 0,
    wrongCards: {},
  };
}

const isMana = (legal) => legal.kind === "activate-ability" && legal.manaAbility === true;

/** Castable without instant speed: what's left in hand when the bot passes its
 * own last main phase is a play it declined, not one it's holding up. */
const sorcerySpeed = (legal) => {
  if (legal.kind !== "cast-spell" || !registry.has(legal.cardName)) return false;
  const def = registry.get(legal.cardName);
  return !def.types.includes("instant") && !(def.keywords ?? []).includes("flash");
};

/**
 * One entry per target the action names, in its order: the slot's polarity,
 * its spec and its legal options — or `[]` when the source can't be read (a
 * granted ability, a card the registry doesn't know).
 */
function slotsOf(state, action, legal) {
  const slot = (polarity, spec, options) => ({ polarity: polarity ?? "either", spec, options: options ?? [] });
  if (action.type === "cast-spell") {
    const offer = legal.find(
      (l) => l.kind === "cast-spell" && l.card === action.card && (l.face ?? null) === (action.face ?? null),
    );
    if (offer === undefined) return [];
    if (action.modes !== undefined && offer.castModal !== undefined) {
      const byMode = modalPolarities(registry, offer);
      if (byMode === null) return [];
      return action.modes.flatMap((m) =>
        offer.castModal.modes[m].targetSpecs.map((spec, i) =>
          slot(byMode[m]?.[i], spec, offer.castModal.modes[m].targetOptions[i]),
        ),
      );
    }
    const polarities = offerPolarities(registry, offer);
    if (polarities === null) return [];
    return offer.targetSpecs.map((spec, i) => slot(polarities[i], spec, offer.targetOptions[i]));
  }
  if (action.type === "activate-ability") {
    const offer = legal.find(
      (l) => l.kind === "activate-ability" && l.source === action.source && l.abilityIndex === action.abilityIndex,
    );
    const polarities = offer === undefined ? null : offerPolarities(registry, offer);
    if (polarities === null) return [];
    return offer.targetSpecs.map((spec, i) => slot(polarities[i], spec, offer.targetOptions[i]));
  }
  if (action.type === "choose-targets") {
    const offer = legal.find((l) => l.kind === "choose-targets");
    const polarities = offer === undefined ? null : pendingTargetPolarities(state, registry);
    if (polarities === null) return [];
    return offer.specs.map((spec, i) => slot(polarities[i], spec, offer.options[i]));
  }
  return [];
}

/** Count what `action` aims where. Only a slot whose spec leaves the side
 * open and whose effect has a side counts: "target creature you control" is
 * the card choosing. */
function countTargets(stats, state, me, action, legal) {
  const slots = slotsOf(state, action, legal);
  if (slots.length === 0) return;
  (action.targets ?? []).forEach((target, i) => {
    if (target === null || target === undefined) return;
    // An "any number of" group's members all read its one slot.
    const { polarity, spec, options } = slots[Math.min(i, slots.length - 1)];
    if (polarity !== "harm" && polarity !== "help") return;
    if (specSide(spec) !== "any") return;
    const side = sideOf(state, target, me);
    if (side === null) return;
    stats.targeted += 1;
    const want = polarity === "harm" ? "opponent" : "own";
    if (side === want) return;
    stats.wrongSide += 1;
    const avoidable = options.some((o) => sideOf(state, o, me) === want);
    if (avoidable) stats.avoidable += 1;
    const name =
      action.type === "choose-targets"
        ? `${state.pendingTargetedTrigger?.cardName ?? "?"} (trigger)`
        : state.objects[action.card ?? action.source]?.cardName ?? "?";
    const key = `${name} — ${polarity === "harm" ? "harm at its own side" : "help at an opponent"}${
      avoidable ? "" : " (nothing else legal)"
    }`;
    stats.wrongCards[key] = (stats.wrongCards[key] ?? 0) + 1;
  });
}

function instrument(bot, me, stats, budget) {
  const act = bot.act.bind(bot);
  const turnsSeen = new Set();
  bot.act = (view) => {
    const state = view.state;
    const awaiting = state.awaiting;
    const started = performance.now();
    const action = act(view);
    const ms = performance.now() - started;
    const legal = view.legalActions();
    let kind;
    if (awaiting !== null) {
      kind = awaiting.kind === "attackers" || awaiting.kind === "blockers" ? "combat" : "decision";
    } else {
      const nonMana = legal.filter((l) => l.kind !== "pass-priority" && !isMana(l));
      kind = nonMana.length === 0 ? (legal.length === 1 ? "dead" : "manaOnly") : "real";
      if (activePlayerOf(state) === me && !turnsSeen.has(state.turn.number)) {
        turnsSeen.add(state.turn.number);
        stats.ownTurns += 1;
      }
      const lastMain =
        activePlayerOf(state) === me &&
        state.turn.step === "postcombat-main" &&
        state.zones.shared.stack.length === 0 &&
        action.type === "pass-priority";
      if (lastMain) {
        const declined = nonMana.filter(sorcerySpeed);
        if (declined.length > 0) {
          stats.idleTurns += 1;
          for (const l of declined) stats.idleCards[l.cardName] = (stats.idleCards[l.cardName] ?? 0) + 1;
        }
        if (legal.some((l) => l.kind === "play-land")) stats.landSkips += 1;
      }
      if (kind === "real" && bot.lastDecision !== undefined && bot.lastDecision !== null) {
        const n = bot.lastDecision.simulations;
        const bucket = n >= 10 ? "10+" : String(n);
        stats.simulations[bucket] = (stats.simulations[bucket] ?? 0) + 1;
      }
    }
    stats.windows[kind] += 1;
    stats.ms[kind] += ms;
    if (ms > stats.maxMs[kind]) stats.maxMs[kind] = ms;
    if (budget !== null && ms > budget) stats.overBudget[kind] += 1;
    countTargets(stats, state, me, action, legal);
    return action;
  };
}

parentPort.on("message", ({ seed, players, bot, budget, weights }) => {
  const { seats, decks } = tableFor(seed, players);
  const stats = newStats();
  const controllers = {};
  for (const seat of seats) {
    const controller =
      bot === "v1"
        ? new HeuristicBotController(seat, registry)
        : new EvalBotController(seat, registry, {
            ...(budget === null ? {} : { timeBudgetMs: budget }),
            ...(weights === null ? {} : { weights: { ...DEFAULT_WEIGHTS, ...weights } }),
          });
    instrument(controller, seat, stats, budget);
    controllers[seat] = controller;
  }
  const started = performance.now();
  try {
    const game = Game.create({
      seed,
      registry,
      controllers,
      mulligans: true,
      rules: COMMANDER_RULES,
      decks: seats.map((player, i) => ({ player, cards: decks[i].cards, commander: decks[i].commander })),
    });
    game.advance();
    parentPort.postMessage({ seed, turns: game.state.turn.number, ms: performance.now() - started, stats });
  } catch (error) {
    parentPort.postMessage({ seed, error: String(error?.stack ?? error) });
  }
});
