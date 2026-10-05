import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_WEIGHTS,
  Game,
  HeuristicBotController,
  autoSettle,
  createDefaultRegistry,
  scenarioFromCapture,
} from "engine";
import type { ScenarioCapture } from "engine";

import { BUG_REPORT_EVENTS } from "../capture.js";
import type { BugReport } from "../capture.js";
import { ALICE, BOB, DECKS } from "../decks.js";
import { Room } from "../room.js";

const registry = createDefaultRegistry();
const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** Two v1 bots playing each other in a room that captures, to the end. */
/** Small, so a short game fills it: the default (`CAPTURE_KEEP`) is far more. */
const KEEP = 12;

function playedRoom(capture: boolean): { room: Room; dir: string } {
  const dir = mkdtempSync(join(tmpdir(), "mtg-capture-"));
  dirs.push(dir);
  const game = Game.create({
    seed: 1,
    registry,
    decks: [
      { player: ALICE, cards: [...DECKS.alice] },
      { player: BOB, cards: [...DECKS.bob] },
    ],
  });
  autoSettle(game);
  const room = new Room("CAPT1", game, {
    pacing: "immediate",
    botController: (player) => new HeuristicBotController(player, registry),
    ...(capture ? { capture: { dir, registry, keep: KEEP } } : {}),
  });
  room.addBot(ALICE);
  room.addBot(BOB);
  return { room, dir };
}

describe("capturing bot decisions", () => {
  it("saves what the default bot's search said with the move: its path and every candidate's score", () => {
    // A move the saved position can't reproduce needs the bot's own side of it
    // (an Adaptive Training Post, 2026-10-04): the room's default bots report
    // each candidate they score while capture is on.
    const dir = mkdtempSync(join(tmpdir(), "mtg-capture-"));
    dirs.push(dir);
    const game = Game.create({
      seed: 1,
      shuffle: false,
      registry,
      decks: [
        { player: ALICE, cards: Array<string>(40).fill("Mountain") },
        { player: BOB, cards: Array<string>(40).fill("Forest") },
      ],
    });
    game.advanceUntil((s) => s.priority.holder === ALICE && s.turn.step === "precombat-main");
    game.state.zones.perPlayer[ALICE].hand = [];
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Mountain", ALICE, "battlefield");
    game.debugSpawn("Lightning Bolt", ALICE, "hand");
    game.debugSpawn("Grizzly Bears", BOB, "battlefield", { summoningSick: false });
    const room = new Room("CAPT2", game, { pacing: "immediate", capture: { dir, registry, keep: 50 } });
    room.addBot(ALICE);
    const log = room.captures;
    if (log === null) throw new Error("no capture log");
    // The first decision it was asked: Bolt or pass, searched.
    const first = log.list().at(-1);
    if (first === undefined) throw new Error("nothing captured");
    const capture = JSON.parse(readFileSync(log.save(first.id, "not-this", "note"), "utf8")) as ScenarioCapture;
    expect(capture.diagnosis?.via).toBe("search");
    expect(capture.diagnosis?.expired).toBe(false);
    const scores = capture.diagnosis?.scores ?? [];
    expect(scores.some((s) => s.move.startsWith("Pass"))).toBe(true);
    expect(scores.some((s) => s.move.includes("Lightning Bolt"))).toBe(true);
    // Best first.
    const numbers = scores.map((s) => s.score ?? -Infinity);
    expect([...numbers].sort((x, y) => y - x)).toEqual(numbers);
  });

  it("keeps nothing without a capture config", () => {
    const { room } = playedRoom(false);
    expect(room.captures).toBeNull();
  });

  it("keeps the last few decisions and saves one as a training scenario", () => {
    const { room, dir } = playedRoom(true);
    const log = room.captures;
    if (log === null) throw new Error("no capture log");
    const entries = log.list();
    expect(entries.length).toBe(KEEP);
    // Newest first, each described.
    expect(entries[0].id).toBeGreaterThan(entries[entries.length - 1].id);
    expect(entries.every((e) => e.did.length > 0)).toBe(true);

    const entry = entries.find((e) => e.decision === "priority") ?? entries[0];
    const { options } = log.options(entry.id);
    expect(options.length).toBeGreaterThan(0);

    const file = log.save(entry.id, "not-this", "a note", "a name");
    expect(readdirSync(dir)).toHaveLength(1);
    const capture = JSON.parse(readFileSync(file, "utf8")) as ScenarioCapture;
    expect(capture).toMatchObject({ version: 1, name: "a name", note: "a note", player: entry.player });
    expect(capture.state.eventLog).toEqual([]);

    // The file plays as a scenario: v1 again makes the move it made, so
    // "anything but that" fails.
    const scenario = scenarioFromCapture(capture);
    const result = scenario.run(DEFAULT_WEIGHTS, registry, (p) => new HeuristicBotController(p, registry));
    expect(result.passed).toBe(false);

    // With the bot's own move picked as the answer, it passes.
    const own = log.options(entry.id).options.findIndex((o) => o.text === entry.did);
    if (own >= 0) {
      const again = JSON.parse(readFileSync(log.save(entry.id, own, ""), "utf8")) as ScenarioCapture;
      const passes = scenarioFromCapture(again).run(
        DEFAULT_WEIGHTS,
        registry,
        (p) => new HeuristicBotController(p, registry),
      );
      expect(passes.passed).toBe(true);
    }
  });

  it("refuses a decision it no longer keeps", () => {
    const { room } = playedRoom(true);
    expect(() => room.captures?.options(1)).toThrow(/only the last/);
  });
});

describe("bug reports", () => {
  // The smallest PNG there is: one transparent pixel.
  const PIXEL =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

  it("saves the game as it stands, with a photo beside it, out of the scenarios' folder", () => {
    const { room, dir } = playedRoom(true);
    const log = room.captures;
    if (log === null) throw new Error("no capture log");
    const file = log.report(room.game.state, ALICE, "a title", "what went wrong", PIXEL);
    // Nothing in `captures/` itself, where the scenario loaders read.
    expect(readdirSync(dir)).toEqual(["bugs"]);
    const report = JSON.parse(readFileSync(file, "utf8")) as BugReport;
    expect(report).toMatchObject({
      version: 1,
      kind: "bug-report",
      title: "a title",
      description: "what went wrong",
      reporter: ALICE,
    });
    expect(report.state.eventLog.length).toBeLessThanOrEqual(BUG_REPORT_EVENTS);
    expect(report.state.eventLog.length).toBeGreaterThan(0);
    expect(report.image).toMatch(/\.png$/);
    const bytes = readFileSync(join(dir, "bugs", report.image ?? ""));
    expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  });

  it("files a report without a photo, and refuses one that isn't an image", () => {
    const { room, dir } = playedRoom(true);
    const log = room.captures;
    if (log === null) throw new Error("no capture log");
    const report = JSON.parse(readFileSync(log.report(room.game.state, null, "", "text only"), "utf8")) as BugReport;
    expect(report.image).toBeUndefined();
    expect(report.title).toMatch(/^Turn \d+/);
    expect(() =>
      log.report(room.game.state, null, "", "x", "data:text/html;base64,PGI+aGk8L2I+"),
    ).toThrow(/PNG, JPEG, GIF or WebP/);
    // The refused one wrote nothing.
    expect(readdirSync(join(dir, "bugs"))).toHaveLength(1);
  });
});
