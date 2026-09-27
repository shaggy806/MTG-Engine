/**
 * Capturing a bot's blunder as a training scenario — a developer's tool,
 * switched on by starting the server with `--capture` (and always on in
 * dev-rooms), never on the public site: a capture is the whole game, every
 * hand and library included.
 *
 * A room with a `CaptureLog` keeps the state from just before each of its
 * bots' last few real decisions. Whoever is testing picks one, then what the
 * bot should have done there — or "anything but what it did" — and the log
 * writes it to the git-ignored `captures/` folder at the repo root as a
 * `ScenarioCapture`, which `bot:scenarios` and `bot:fit-scenarios` read as a
 * training scenario. See `engine/src/bot/capture.ts`.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { captureOptions, cloneGameState, describeMove } from "engine";
import type { Action, CaptureOption, CardRegistry, GameState, PlayerId, ScenarioCapture } from "engine";
import type { CaptureSummary } from "protocol";

/** Where captures go unless told otherwise: `captures/` at the repo root. */
export const DEFAULT_CAPTURE_DIR = fileURLToPath(new URL("../../captures/", import.meta.url));

/** How many recent bot decisions a room keeps. A late four-player state is
 * a few megabytes in memory, so not many. */
export const CAPTURE_KEEP = 12;

export interface CaptureConfig {
  readonly dir: string;
  readonly registry: CardRegistry;
}

interface Captured {
  readonly id: number;
  readonly player: PlayerId;
  readonly state: GameState;
  readonly action: Action;
  /** Worked out the first time someone asks (`options`). */
  options?: readonly CaptureOption[];
}

export class CaptureLog {
  private readonly config: CaptureConfig;
  private readonly roomId: string;
  private entries: Captured[] = [];
  private nextId = 1;

  constructor(config: CaptureConfig, roomId: string) {
    this.config = config;
    this.roomId = roomId;
  }

  /** The state a bot is about to decide in, copied before it decides. */
  before(state: GameState): GameState {
    return cloneGameState({ ...state, eventLog: [] });
  }

  /** What the bot did from `state` (a copy from `before`). */
  record(player: PlayerId, state: GameState, action: Action): void {
    this.entries.push({ id: this.nextId++, player, state, action });
    if (this.entries.length > CAPTURE_KEEP) this.entries.shift();
  }

  /** The decisions kept, newest first. */
  list(): CaptureSummary[] {
    return [...this.entries].reverse().map((entry) => ({
      id: entry.id,
      player: entry.player,
      turn: entry.state.turn.number,
      step: entry.state.turn.step,
      decision: entry.state.awaiting?.kind ?? "priority",
      did: describeMove(entry.state, entry.action, this.config.registry),
    }));
  }

  /** Everything the bot could have done at decision `id`, to pick the right
   * answer from. */
  options(id: number): { did: string; options: { index: number; text: string }[] } {
    const entry = this.find(id);
    entry.options ??= captureOptions(entry.state, this.config.registry, entry.player);
    return {
      did: describeMove(entry.state, entry.action, this.config.registry),
      options: entry.options.map((option, index) => ({ index, text: option.text })),
    };
  }

  /** Writes decision `id` as a training scenario, returning the file path. */
  save(id: number, expect: number | "not-this", note: string, name?: string): string {
    const entry = this.find(id);
    let expected: ScenarioCapture["expect"];
    if (expect === "not-this") {
      expected = { kind: "not-this" };
    } else {
      entry.options ??= captureOptions(entry.state, this.config.registry, entry.player);
      const option = entry.options[expect];
      if (option === undefined) throw new Error(`no option ${expect} for capture ${id}`);
      expected = { kind: "action", action: option.action };
    }
    const turn = entry.state.turn.number;
    const did = describeMove(entry.state, entry.action, this.config.registry);
    const capture: ScenarioCapture = {
      version: 1,
      name: name?.trim() || `${entry.player}, turn ${turn} ${entry.state.turn.step}: not ${did}`,
      note: note.trim(),
      player: entry.player,
      state: entry.state,
      did: entry.action,
      expect: expected,
      savedAt: new Date().toISOString(),
    };
    mkdirSync(this.config.dir, { recursive: true });
    const stamp = capture.savedAt.replace(/[:.]/g, "-");
    const file = join(this.config.dir, `${stamp}-${this.roomId}-t${turn}-${entry.player}.json`);
    writeFileSync(file, JSON.stringify(capture));
    return file;
  }

  private find(id: number): Captured {
    const entry = this.entries.find((e) => e.id === id);
    if (entry === undefined) throw new Error(`capture ${id} is gone — only the last ${CAPTURE_KEEP} are kept`);
    return entry;
  }
}
