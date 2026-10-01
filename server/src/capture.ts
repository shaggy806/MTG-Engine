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
 *
 * The same panel files a bug report: the game as it stands now, its recent
 * events and what the tester saw, written to `captures/bugs/` — out of the
 * scenario loaders' way, which read only `captures/*.json`. Its `state` is a
 * snapshot `bot:replay --from` starts from. A photo sent with it (a
 * screenshot of what looked wrong) is written beside it, same name, its own
 * extension.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { captureOptions, cloneGameState, describeMove } from "engine";
import type {
  Action,
  CaptureOption,
  CardRegistry,
  GameEvent,
  GameState,
  PlayerId,
  ScenarioCapture,
} from "engine";
import type { CaptureSummary } from "protocol";

/** Where captures go unless told otherwise: `captures/` at the repo root. */
export const DEFAULT_CAPTURE_DIR = fileURLToPath(new URL("../../captures/", import.meta.url));

/**
 * How many recent bot decisions a room keeps, unless `CaptureConfig.keep`
 * (the server's `--capture-keep N`) says otherwise.
 *
 * Measured on three four-player v2 games (2026-09-30): late in a game the
 * bots make 15–60 real decisions a turn, so the 12 kept before this didn't
 * always reach back one full turn; 200 reach back 5–30 turns. A late state
 * is ~0.3 MB as JSON and ~0.4 MB in memory, so 200 hold ~80 MB per room —
 * fine for the developer's machine this runs on (capture is never on in
 * production).
 */
export const CAPTURE_KEEP = 200;

/** How many of the game's latest events a bug report keeps — enough to see
 * what led up to it, without a whole long game's log. */
export const BUG_REPORT_EVENTS = 300;

/** A bug report's photo may be one of these, sent as a data URL. */
const IMAGE_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp" } as const;

/** The largest photo a bug report takes, decoded. */
export const BUG_REPORT_IMAGE_MAX = 10 * 1024 * 1024;

/** What a bug-report file holds. `version` is bumped if the shape changes. */
export interface BugReport {
  readonly version: 1;
  readonly kind: "bug-report";
  readonly title: string;
  /** What went wrong, in the tester's words. */
  readonly description: string;
  readonly roomId: string;
  /** The seat that filed it, or null for a spectating host. */
  readonly reporter: PlayerId | null;
  /** The photo sent with it: a file name in the same folder. */
  readonly image?: string;
  /** The game when it was filed, its event log cut to the last
   * {@link BUG_REPORT_EVENTS}. */
  readonly state: GameState;
  /** ISO time it was saved. */
  readonly savedAt: string;
}

export interface CaptureConfig {
  readonly dir: string;
  readonly registry: CardRegistry;
  /** How many decisions to keep; {@link CAPTURE_KEEP} if absent. */
  readonly keep?: number;
}

interface Captured {
  readonly id: number;
  readonly player: PlayerId;
  readonly state: GameState;
  readonly action: Action;
  /** Worked out the first time someone asks (`options`). */
  options?: readonly CaptureOption[];
}

/** A photo's bytes and extension from its data URL — an image of a type in
 * {@link IMAGE_TYPES}, no bigger than {@link BUG_REPORT_IMAGE_MAX} — or a
 * thrown error saying why not. */
function decodeImage(dataUrl: string): { bytes: Buffer; extension: string } {
  const match = /^data:([a-z/]+);base64,([A-Za-z0-9+/=]*)$/.exec(dataUrl);
  const type = match?.[1];
  if (match === null || type === undefined || !(type in IMAGE_TYPES)) {
    throw new Error("a bug report's photo must be a PNG, JPEG, GIF or WebP image");
  }
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > BUG_REPORT_IMAGE_MAX) throw new Error("that photo is over 10 MB");
  return { bytes, extension: IMAGE_TYPES[type as keyof typeof IMAGE_TYPES] };
}

export class CaptureLog {
  private readonly config: CaptureConfig;
  private readonly roomId: string;
  private readonly keep: number;
  private entries: Captured[] = [];
  private nextId = 1;

  constructor(config: CaptureConfig, roomId: string) {
    this.config = config;
    this.roomId = roomId;
    this.keep = Math.max(1, config.keep ?? CAPTURE_KEEP);
  }

  /** The state a bot is about to decide in, copied before it decides. */
  before(state: GameState): GameState {
    return cloneGameState({ ...state, eventLog: [] });
  }

  /** What the bot did from `state` (a copy from `before`). */
  record(player: PlayerId, state: GameState, action: Action): void {
    this.entries.push({ id: this.nextId++, player, state, action });
    if (this.entries.length > this.keep) this.entries.shift();
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

  /** Writes the game as it stands as a bug report, returning the file path. */
  report(
    state: GameState,
    reporter: PlayerId | null,
    title: string,
    description: string,
    imageDataUrl?: string,
  ): string {
    const image = imageDataUrl === undefined ? null : decodeImage(imageDataUrl);
    const eventLog: GameEvent[] = state.eventLog.slice(-BUG_REPORT_EVENTS);
    const turn = state.turn.number;
    const savedAt = new Date().toISOString();
    const base = `${savedAt.replace(/[:.]/g, "-")}-${this.roomId}-t${turn}`;
    const imageFile = image === null ? null : `${base}.${image.extension}`;
    const report: BugReport = {
      version: 1,
      kind: "bug-report",
      title: title.trim() || `Turn ${turn} ${state.turn.step}`,
      description: description.trim(),
      roomId: this.roomId,
      reporter,
      ...(imageFile !== null ? { image: imageFile } : {}),
      state: cloneGameState({ ...state, eventLog }),
      savedAt,
    };
    const dir = join(this.config.dir, "bugs");
    mkdirSync(dir, { recursive: true });
    if (image !== null && imageFile !== null) writeFileSync(join(dir, imageFile), image.bytes);
    const file = join(dir, `${base}.json`);
    writeFileSync(file, JSON.stringify(report));
    return file;
  }

  private find(id: number): Captured {
    const entry = this.entries.find((e) => e.id === id);
    if (entry === undefined) throw new Error(`capture ${id} is gone — only the last ${this.keep} are kept`);
    return entry;
  }
}
