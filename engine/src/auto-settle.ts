/**
 * Advances a {@link Game} past everything it can decide on its own, stopping
 * only where an external decision-maker must act: game over, an `awaiting`
 * declaration, or someone holding priority. Also fast-forwards "dead"
 * priority windows — where the holder's only legal action is
 * `pass-priority` — so a caller is never asked to prompt for a no-op pass.
 *
 * Every driver that sits on top of `Game` (the client's hot-seat UI, the
 * multiplayer server) calls this after each dispatch so a game always
 * settles the same way regardless of who's driving it.
 */

import type { Game } from "./game.js";
import type { PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

export function isSettled(state: GameState): boolean {
  return (
    state.result.over ||
    state.awaiting !== null ||
    (state.priority.active && state.priority.holder !== null)
  );
}

function isDeadWindow(game: Game, holder: PlayerId): boolean {
  const acts = game.legalActions(holder);
  return acts.length === 1 && acts[0].kind === "pass-priority";
}

export function autoSettle(game: Game): void {
  game.advanceUntil(isSettled);
  for (let i = 0; i < 1000; i += 1) {
    const s = game.state;
    if (s.result.over || s.awaiting !== null || !s.priority.active) return;
    const holder = s.priority.holder;
    if (holder === null || !isDeadWindow(game, holder)) return;
    game.dispatch({ type: "pass-priority", player: holder });
    game.advanceUntil(isSettled);
  }
}
