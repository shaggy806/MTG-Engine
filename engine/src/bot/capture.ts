/**
 * A position saved from a live game, and the right answer someone picked for
 * it — a blunder seen at the table turned into a training scenario, with no
 * code written (BACKLOG, "Capture a game as a training scenario").
 *
 * A room started with capture on (`server --capture`, and dev-rooms) keeps
 * the state from just before each of its bots' recent decisions. Whoever is
 * testing picks one, then either the move the bot should have made, from
 * everything it could have done there (`captureOptions`), or "anything but
 * what it did". The server writes that as a {@link ScenarioCapture} to the
 * git-ignored `captures/` folder at the repo root, and `bot:scenarios` and
 * `bot:fit-scenarios` read every file there as a training scenario
 * (`scenarioFromCapture`) beside the hand-built ones. Once the bot gets one
 * right, `bot:captures -- resolve` stamps it (`resolved`) and moves it to
 * `captures/resolved/`, where it's read as a gate scenario instead.
 *
 * The state is the whole game, every hand and library included — fine for a
 * developer's own bot table, which is the only place capture is switched on.
 * Pure: the file I/O is the server's and the scripts'.
 */

import type { Action, LegalAction } from "../actions.js";
import type { CardRegistry } from "../cards.js";
import { withComputedCache } from "../characteristics.js";
import { Game } from "../game.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import { printedCardName } from "../state.js";
import type { TargetRef } from "../target.js";
import { candidateActions } from "./candidates.js";
import { decisionCandidates } from "./decisions.js";
import { aimOffer } from "./eval-bot.js";
import type { BotScenario, ScenarioResult } from "./scenarios.js";

/** What a capture file holds. `version` is bumped if the shape changes. */
export interface ScenarioCapture {
  readonly version: 1;
  /** A short name, shown as the scenario's. */
  readonly name: string;
  /** Why the bot's move was wrong, in the tester's words. */
  readonly note: string;
  /** The seat that was deciding. */
  readonly player: PlayerId;
  /** The game just before that decision, event log dropped. */
  readonly state: GameState;
  /** What the bot did there. */
  readonly did: Action;
  /** The right answer: this move, or anything but the one it made. */
  readonly expect:
    | { readonly kind: "action"; readonly action: Action }
    | { readonly kind: "not-this" };
  /** ISO time it was saved. */
  readonly savedAt: string;
  /** Set once the bot gets it right and the file has moved to
   * `captures/resolved/` (`npm run bot:captures -- resolve`). */
  readonly resolved?: CaptureResolution;
}

/** How a capture was resolved. A resolved capture is a gate scenario: the
 * bot must keep getting it right. */
export interface CaptureResolution {
  /** ISO time it was marked resolved. */
  readonly at: string;
  /** The commit the bot first got it right at (`git rev-parse --short HEAD`). */
  readonly commit: string;
  /** What fixed it, in a line. */
  readonly note: string;
}

/** A capture option: a move the player could have made, and how to say it. */
export interface CaptureOption {
  readonly action: Action;
  readonly text: string;
}

/** Keys sorted, so two equal actions built in different orders compare
 * equal. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Whether two actions are the same move. */
export function sameMove(a: Action, b: Action): boolean {
  return canonical(a) === canonical(b);
}

const nameOf = (state: GameState, id: ObjectId): string => {
  const object = state.objects[id];
  return object === undefined ? String(id) : printedCardName(object);
};

function targetText(state: GameState, target: TargetRef | null | undefined): string {
  if (target === null || target === undefined) return "nothing";
  if (target.kind === "player") return target.player;
  const object = state.objects[target.object];
  if (object === undefined) return String(target.object);
  return `${printedCardName(object)} (${object.zone === "battlefield" || object.zone === "stack" ? object.controller : object.owner}'s)`;
}

const targetsText = (state: GameState, targets: readonly (TargetRef | null)[] | undefined): string =>
  targets === undefined || targets.length === 0
    ? ""
    : ` → ${targets.map((t) => targetText(state, t)).join(", ")}`;

/** `action` in words, for a picker — an activation by its ability's text
 * when `registry` can say it. */
export function describeMove(state: GameState, action: Action, registry?: CardRegistry): string {
  switch (action.type) {
    case "pass-priority":
      return "Pass";
    case "play-land":
      return `Play ${nameOf(state, action.card)}`;
    case "cast-spell": {
      const extra = [
        action.xValue !== undefined ? `X=${action.xValue}` : "",
        action.modes !== undefined ? `modes ${action.modes.map((m) => m + 1).join("+")}` : "",
        action.kicked === true ? "kicked" : "",
        action.sacrifice !== undefined ? `sacrificing ${nameOf(state, action.sacrifice)}` : "",
      ].filter((part) => part !== "");
      return `Cast ${nameOf(state, action.card)}${targetsText(state, action.targets)}${extra.length > 0 ? ` (${extra.join(", ")})` : ""}`;
    }
    case "activate-ability": {
      const object = state.objects[action.source];
      const name = object === undefined ? undefined : printedCardName(object);
      const printed =
        registry !== undefined && name !== undefined && registry.has(name)
          ? registry.get(name).activated?.[action.abilityIndex]?.text
          : undefined;
      const text = printed ?? `ability ${action.abilityIndex + 1}`;
      return `Activate ${nameOf(state, action.source)}: ${text}${targetsText(state, action.targets)}${action.xValue !== undefined ? ` (X=${action.xValue})` : ""}`;
    }
    case "choose-modes": {
      const awaiting = state.awaiting;
      const texts = awaiting?.kind === "choose-modes" ? awaiting.modes.map((m) => m.text) : [];
      return action.modes.length === 0
        ? "Choose no mode (decline)"
        : `Choose ${action.modes.map((i) => texts[i] ?? `mode ${i + 1}`).join(" + ")}`;
    }
    case "choose-targets":
      return `Target${targetsText(state, action.targets)}`;
    case "commander-replacement": {
      // Rule 903.9: which zone the commander goes to, the one it was headed
      // for or the command zone.
      const awaiting = state.awaiting;
      const name = awaiting?.kind === "commander-replacement" ? nameOf(state, awaiting.commander) : "commander";
      const intended = awaiting?.kind === "commander-replacement" ? awaiting.intendedZone : "its zone";
      return action.toCommandZone ? `Put ${name} in the command zone` : `Let ${name} go to the ${intended}`;
    }
    case "sacrifice":
      return `Sacrifice ${action.permanents.map((id) => nameOf(state, id)).join(", ")}`;
    case "discard":
      return `Discard ${action.cards.map((id) => nameOf(state, id)).join(", ")}`;
    case "declare-attackers":
      return action.attackers.length === 0
        ? "Attack with nothing"
        : `Attack: ${action.attackers.map((a) => `${nameOf(state, a.attacker)} → ${state.players[a.defender as PlayerId] !== undefined ? a.defender : nameOf(state, a.defender as ObjectId)}`).join("; ")}`;
    case "declare-blockers":
      return action.blocks.length === 0
        ? "Block with nothing"
        : `Block: ${action.blocks.map((b) => `${nameOf(state, b.blocker)} blocks ${nameOf(state, b.attacker)}`).join("; ")}`;
    case "mulligan":
      return action.keep ? "Keep the hand" : "Mulligan";
    case "put-on-bottom":
      return `Put on the bottom: ${action.cards.map((id) => nameOf(state, id)).join(", ")}`;
    default:
      return action.type;
  }
}

/** The most options a capture offers — a wide board has thousands of target
 * combinations, and the right answer is nearly always near the top of the
 * search's own ranking. */
const MAX_OPTIONS = 60;

/**
 * Everything `player` could do in `state`, best-ranked first as the search
 * ranks it, for picking the right answer: a priority window's casts,
 * activations and land drops (mana abilities left out, as the search leaves
 * them out) and passing; a decision's candidate answers. Combat declarations
 * aren't enumerated — a capture of one can only say "not this".
 */
export function captureOptions(
  state: GameState,
  registry: CardRegistry,
  player: PlayerId,
): CaptureOption[] {
  const game = Game.fromSnapshot(state, { registry });
  const legal = game.legalActions(player);
  const actions: Action[] = withComputedCache(() => {
    if (state.awaiting !== null) {
      const offer = legal.find((l) => l.kind !== "pass-priority");
      if (offer === undefined) return [];
      return (
        decisionCandidates(
          aimOffer(game.state, registry, player, offer),
          player,
          undefined,
          (id) => game.state.objects[id]?.controller,
        ) ?? []
      );
    }
    const out: Action[] = [{ type: "pass-priority", player }];
    for (const offer of legal) {
      if (offer.kind === "activate-ability" && offer.manaAbility === true) continue;
      out.push(...candidateActions(aimOffer(game.state, registry, player, offer as LegalAction), player));
    }
    return out;
  });
  const seen = new Set<string>();
  const options: CaptureOption[] = [];
  for (const action of actions) {
    const key = canonical(action);
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({ action, text: describeMove(state, action, registry) });
    if (options.length >= MAX_OPTIONS) break;
  }
  return options;
}

/** A capture as a scenario, asked with one `act` like the hand-built
 * positions, so `bot:fit-scenarios` can replay it too: a training scenario
 * while it's open, a gate one once resolved — a fixed blunder must stay
 * fixed. */
export function scenarioFromCapture(capture: ScenarioCapture): BotScenario {
  const judgeWith = (registry?: CardRegistry) => (action: Action): ScenarioResult => {
    const chose = describeMove(capture.state, action, registry);
    if (capture.expect.kind === "action") {
      const want = describeMove(capture.state, capture.expect.action, registry);
      return sameMove(action, capture.expect.action)
        ? { passed: true, detail: `chose ${chose}` }
        : { passed: false, detail: `chose ${chose}, not ${want}` };
    }
    const did = describeMove(capture.state, capture.did, registry);
    return sameMove(action, capture.did)
      ? { passed: false, detail: `chose ${did} again` }
      : { passed: true, detail: `chose ${chose}, not ${did}` };
  };
  const position = (registry: CardRegistry) => ({
    game: Game.fromSnapshot(capture.state, { registry }),
    player: capture.player,
    judge: judgeWith(registry),
  });
  return {
    name: `${capture.resolved === undefined ? "capture" : "resolved capture"}: ${capture.name}`,
    rule: capture.note === "" ? "A position captured from a live game." : capture.note,
    kind: capture.resolved === undefined ? "training" : "gate",
    position,
    run(weights, registry, makeBot) {
      const { game, player } = position(registry);
      return judgeWith(registry)(makeBot(player, registry, weights).act(game.controllerView(player)));
    },
  };
}
