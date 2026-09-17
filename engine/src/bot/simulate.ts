/**
 * "What would the board look like if I did this?"
 *
 * The engine makes this nearly free: `GameState` is one plain
 * `structuredClone`-able tree, `Game.fromSnapshot` rebuilds a working `Game`
 * from one, and `dispatch` is the only writer — so a candidate move can be
 * played out against a throwaway copy with no risk to the real game and no
 * per-card special-casing. Measured at roughly 0.3ms per candidate mid-game.
 *
 * Two things here are load-bearing and easy to get wrong:
 *
 * 1. **Every seat in the simulation gets a non-searching stand-in.**
 *    `Game.tick()` invokes `controllers[holder].act()`, so a simulation that
 *    inherited the searching bot's own controller would recurse forever. The
 *    stand-ins also do the useful work of passing priority, which is what
 *    drains the stack. Which stand-in is the `RolloutPolicy`.
 *
 * 2. **The horizon has to be past the stack.** Dispatching `cast-spell`
 *    leaves the spell *on the stack* with nothing resolved, so scoring there
 *    reads every spell as "one fewer card in hand" and the bot never casts
 *    anything. See `docs/plans/smarter-bots.md`.
 */

import { Game } from "../game.js";
import type { Action } from "../actions.js";
import type { CardRegistry } from "../cards.js";
import { HeuristicBotController } from "../controller.js";
import type { ControllerView, PlayerController } from "../controller.js";
import type { PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

/**
 * How far past the candidate action to run before scoring.
 *
 * - `"stack"` — until the stack is empty, i.e. the action and everything it
 *   put on the stack has resolved. Cheap, and enough to see what a spell did.
 * - `"turn"` — until the turn number changes. Puts every candidate, including
 *   `pass-priority`, on a common footing so they can be compared directly
 *   instead of against a "better than doing nothing" threshold. 2-3x dearer.
 */
export type Horizon = "stack" | "turn";

/**
 * How the stand-in seats play a priority rollout out.
 *
 * - `"passive"` — `AutomaticController` everywhere: pass, never attack, never
 *   block. Cheapest, but no rollout ever contains combat, so casting a
 *   creature before combat looks the same as after it, and a decision on an
 *   opponent's turn never sees their attack coming.
 * - `"combat"` — `CombatRolloutController` everywhere: still pass at every
 *   priority window, but attack and block as v1 does.
 * - `"defensive"` — v1's blocks everywhere, but only opponents attack; our
 *   own seat never does. v1 swings with everything, which is a poor stand-in
 *   for the bot's own, far more careful attacks.
 * - `"playing"` — **v3's policy**: every seat plays its whole turn as v1 does,
 *   casting and activating rather than only fighting combat. The three above
 *   all pass at every priority window for *every* seat including our own, so a
 *   candidate is scored as "I do this, and then nobody does anything else all
 *   turn" — mana is never spent, cards in hand are inert, and nothing can be
 *   valued for what it enables. Measured: eight untapped Forests and two
 *   creatures in hand, rolled to end of turn, leaves an empty board under all
 *   three, and a board with both creatures under this one, for 1.7x the cost
 *   (1.26ms to 2.18ms). See `docs/plans/bot-v3-search.md`.
 */
export type RolloutPolicy = "passive" | "combat" | "defensive" | "playing";

/**
 * How far past the candidate action a v3 rollout runs, counted in *player
 * turns* rather than rounds.
 *
 * `players + 1` is the meaningful default: far enough to come back round to
 * ourselves, so a play, every opponent's answer, and our own follow-up all sit
 * inside the horizon. At two players that is the three turns v3 is named for.
 */
export interface Depth {
  readonly turns: number;
}

/** A hard ceiling on one rollout, so a pathological line can't stall a room. */
const MAX_STEPS = 400;

/**
 * Play `action` against a copy of `state` and return the resulting state, or
 * `null` if the engine refused it.
 *
 * A refusal is expected, not exceptional: `legalActions` enumerates a *shape*
 * ("cast this, here are the legal targets"), and a specific concrete filling
 * of that shape can still be illegal. The caller just skips the candidate.
 */
export function simulateAction(
  state: GameState,
  registry: CardRegistry,
  action: Action,
  horizon: Horizon,
  policy: RolloutPolicy = "passive",
  self?: PlayerController,
): GameState | null {
  // The event log is roughly half the bytes of a mid-game state and nothing
  // downstream of here reads it — dropping it before the clone takes the copy
  // from ~0.46ms to ~0.27ms.
  const seed: GameState = { ...state, eventLog: [] };
  const startingTurn = state.turn.number;

  try {
    const sim = Game.fromSnapshot(seed, {
      registry,
      controllers: rolloutControllers(state, registry, action.player, policy, self),
    });
    sim.dispatch(action);
    let steps = 0;
    sim.advanceUntil((s) => {
      steps += 1;
      if (steps > MAX_STEPS) return true;
      return horizon === "stack"
        ? s.zones.shared.stack.length === 0
        : s.turn.number !== startingTurn;
    });
    return sim.state;
  } catch {
    return null;
  }
}

/**
 * The stand-in for every seat in a *combat* simulation: v1's answer to
 * anything the engine is waiting on — above all, how to block — and a pass at
 * every priority window. The priority search's stand-ins never block
 * (`AutomaticController`), which would make every attack look free. Never a
 * searching bot, or the simulation would recurse.
 */
export class CombatRolloutController extends HeuristicBotController {
  act(view: ControllerView): Action {
    if (view.state.awaiting !== null) return super.act(view);
    return { type: "pass-priority", player: this.playerId };
  }
}

const COMBAT_STEPS: ReadonlySet<string> = new Set([
  "declare-attackers",
  "declare-blockers",
  "combat-damage",
]);

/**
 * Play a `declare-attackers` or `declare-blockers` action against a copy of
 * `state` through the end of combat — blocks and damage included, every seat
 * answering as v1 would — and return the state after it, or `null` if the
 * engine refused the declaration.
 */
export function simulateCombat(
  state: GameState,
  registry: CardRegistry,
  action: Action,
): GameState | null {
  const seed: GameState = { ...state, eventLog: [] };
  const controllers: Record<PlayerId, PlayerController> = {};
  for (const player of state.turnOrder) {
    controllers[player] = new CombatRolloutController(player, registry);
  }
  const startingTurn = state.turn.number;
  try {
    const sim = Game.fromSnapshot(seed, { registry, controllers });
    sim.dispatch(action);
    let steps = 0;
    sim.advanceUntil((s) => {
      steps += 1;
      return (
        steps > MAX_STEPS ||
        s.turn.number !== startingTurn ||
        (!COMBAT_STEPS.has(s.turn.step) && s.zones.shared.stack.length === 0)
      );
    });
    return sim.state;
  } catch {
    return null;
  }
}

/** Holds back from attacking; otherwise v1's answers, like its parent. */
export class DefendingRolloutController extends CombatRolloutController {
  declareAttackers(): readonly [] {
    return [];
  }
}

/**
 * Plain v1, playing its whole turn — the v3 rollout stand-in.
 *
 * It exists as a named class rather than using `HeuristicBotController`
 * directly so the policy table reads uniformly, and so there is one place to
 * hang the warning: this is the only stand-in that *acts*, and therefore the
 * only one whose own mistakes end up inside the measurement. Three turns of v1
 * making mediocre decisions can drown the thing being measured, which is
 * exactly what killed v2's sibling-pair labels. Averaging over sampled worlds
 * is the mitigation; if it isn't enough, a better rollout policy is the fix,
 * not more samples.
 */
export class PlayingRolloutController extends HeuristicBotController {}

/**
 * Play `action` against a copy of `state` and run `depth.turns` player turns of
 * `policy` past it, returning the resulting state — v3's rollout.
 *
 * The caller is expected to hand in an already-determinized `state` (see
 * `determinize.ts`) and to reuse the same sampled worlds across every candidate
 * at one decision.
 */
export function simulateTurns(
  state: GameState,
  registry: CardRegistry,
  action: Action,
  depth: Depth,
  policy: RolloutPolicy = "playing",
  self?: PlayerController,
): GameState | null {
  const seed: GameState = { ...state, eventLog: [] };
  const until = state.turn.number + Math.max(1, depth.turns);
  try {
    const sim = Game.fromSnapshot(seed, {
      registry,
      controllers: rolloutControllers(state, registry, action.player, policy, self),
    });
    sim.dispatch(action);
    let steps = 0;
    sim.advanceUntil((s) => {
      steps += 1;
      // A deeper rollout runs many more ticks than a one-turn one, so the step
      // ceiling scales with the depth rather than staying at `MAX_STEPS` and
      // silently truncating every rollout at the same place.
      return steps > MAX_STEPS * depth.turns || s.turn.number >= until;
    });
    return sim.state;
  } catch {
    return null;
  }
}

function rolloutControllers(
  state: GameState,
  registry: CardRegistry,
  me: PlayerId,
  policy: RolloutPolicy,
  self: PlayerController | undefined,
): Record<PlayerId, PlayerController> | undefined {
  // `fromSnapshot` fills any seat left out with an AutomaticController.
  if (policy === "passive") return self === undefined ? undefined : { [me]: self };
  const controllers: Record<PlayerId, PlayerController> = {};
  for (const player of state.turnOrder) {
    controllers[player] =
      policy === "playing"
        ? new PlayingRolloutController(player, registry)
        : policy === "defensive" && player === me
          ? new DefendingRolloutController(player, registry)
          : new CombatRolloutController(player, registry);
  }
  if (self !== undefined) controllers[me] = self;
  return controllers;
}
