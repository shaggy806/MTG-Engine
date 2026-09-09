/**
 * A single-card sandbox — a `Game` pre-loaded so one card can be cast /
 * activated / watched in isolation, without playing a real match. Powers the
 * card lab (`client/src/lab/`); not used in normal play.
 *
 * The setup: two players `you` + `foe`, `you` starts, both hands empty, huge
 * rule limits, life 40. `you` gets 25 basic lands (5 of each) untapped plus a
 * friendly Grizzly Bears; `foe` gets 4 Forests, a Grizzly Bears, a deathtouch
 * Typhoid Rats, and a Garruk Wildspeaker (a planeswalker) — enough fodder for
 * every `TargetSpec`. The preview card is put in `you`'s hand, and — if it's a
 * permanent — a second copy onto the battlefield so its static abilities /
 * P/T show immediately.
 */

import { AutomaticController } from "./controller.js";
import { Game } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { PlayerId } from "./primitives.js";
import { createDefaultRegistry } from "./cards/registry.js";
import type { CardRegistry } from "./cards/registry.js";

export const SANDBOX_YOU: PlayerId = asPlayerId("you");
export const SANDBOX_FOE: PlayerId = asPlayerId("foe");

const BASICS = ["Plains", "Island", "Swamp", "Mountain", "Forest"] as const;
const PERMANENT_TYPES = new Set([
  "creature",
  "artifact",
  "enchantment",
  "planeswalker",
  "land",
  "battle",
]);

export interface SandboxOptions {
  /** Registry to resolve the card in (defaults to the built-in pool). Pass a
   * custom one to preview a card that isn't in `BUILTIN_CARDS` yet. */
  readonly registry?: CardRegistry;
  /** Where the preview card goes. `"auto"` (default) = hand, plus the
   * battlefield too for a permanent. */
  readonly place?: "auto" | "hand" | "battlefield";
}

export interface Sandbox {
  readonly game: Game;
  readonly you: PlayerId;
  readonly foe: PlayerId;
  /** The preview card's battlefield instance, if one was spawned. */
  readonly onBattlefield: string | null;
  /** The preview card's hand instance, if one was spawned. */
  readonly inHand: string | null;
}

export function createSandbox(cardName: string, opts: SandboxOptions = {}): Sandbox {
  const registry = opts.registry ?? createDefaultRegistry();
  const def = registry.get(cardName); // throws early on a bad name

  const filler = Array<string>(20).fill("Forest");
  const game = Game.create({
    registry,
    seed: 1,
    shuffle: false,
    startingPlayer: SANDBOX_YOU,
    controllers: {
      [SANDBOX_YOU]: new AutomaticController(SANDBOX_YOU),
      [SANDBOX_FOE]: new AutomaticController(SANDBOX_FOE),
    },
    rules: {
      startingLife: 40,
      openingHandSize: 0,
      skipFirstDraw: true,
      maxHandSize: 999,
      maxLandsPerTurn: 999,
    },
    decks: [
      { player: SANDBOX_YOU, cards: filler },
      { player: SANDBOX_FOE, cards: filler },
    ],
  });

  // Mana base + target fodder.
  for (let i = 0; i < 5; i += 1) {
    for (const basic of BASICS) game.debugSpawn(basic, SANDBOX_YOU, "battlefield");
  }
  game.debugSpawn("Grizzly Bears", SANDBOX_YOU, "battlefield", { summoningSick: false });
  for (let i = 0; i < 4; i += 1) game.debugSpawn("Forest", SANDBOX_FOE, "battlefield");
  game.debugSpawn("Grizzly Bears", SANDBOX_FOE, "battlefield", { summoningSick: false });
  game.debugSpawn("Typhoid Rats", SANDBOX_FOE, "battlefield", { summoningSick: false });
  game.debugSpawn("Garruk Wildspeaker", SANDBOX_FOE, "battlefield");

  const isPermanent =
    def.types.some((t) => PERMANENT_TYPES.has(t)) &&
    !def.types.includes("instant") &&
    !def.types.includes("sorcery") &&
    // An Aura only stays on the battlefield attached to something; spawned bare
    // it dies to an SBA. Cast it from the hand copy instead.
    !def.subtypes.includes("Aura");
  const place = opts.place ?? "auto";

  let onBattlefield: string | null = null;
  let inHand: string | null = null;
  if (place === "battlefield" || (place === "auto" && isPermanent)) {
    onBattlefield = game.debugSpawn(cardName, SANDBOX_YOU, "battlefield", {
      summoningSick: false,
    });
  }
  if (place === "hand" || place === "auto") {
    inHand = game.debugSpawn(cardName, SANDBOX_YOU, "hand");
  }

  // Fast-forward to `you`'s first precombat main phase, with `you` idle on
  // priority — the AutomaticControllers pass every window and resolve any
  // stray trigger on the way. `sandboxAdvance` is then how the lab resumes
  // after each of `you`'s actions.
  sandboxAdvance(game, (s) => s.turn.step === "precombat-main");
  return { game, you: SANDBOX_YOU, foe: SANDBOX_FOE, onBattlefield, inHand };
}

/**
 * Run the game forward until `you` has a real decision to make — holding
 * priority (optionally only once `extra` also holds, e.g. a target step), or
 * owed an `awaiting` decision — letting the `foe` / `you` AutomaticControllers
 * clear every other window (priority passes, the stack resolving, `foe`'s
 * forced choices). The lab calls this after every action `you` dispatches.
 */
export function sandboxAdvance(
  game: Game,
  extra: (s: Game["state"]) => boolean = () => true,
): void {
  game.advanceUntil((s) => {
    if (s.result.over) return true;
    if (s.awaiting !== null) return s.awaiting.player === SANDBOX_YOU;
    if (s.priority.active && s.priority.holder === SANDBOX_YOU) return extra(s);
    return false;
  });
}
