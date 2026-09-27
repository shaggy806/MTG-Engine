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

import { CAPTURE_KEEP } from "../capture.js";
import { ALICE, BOB, DECKS } from "../decks.js";
import { Room } from "../room.js";

const registry = createDefaultRegistry();
const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** Two v1 bots playing each other in a room that captures, to the end. */
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
    ...(capture ? { capture: { dir, registry } } : {}),
  });
  room.addBot(ALICE);
  room.addBot(BOB);
  return { room, dir };
}

describe("capturing bot decisions", () => {
  it("keeps nothing without a capture config", () => {
    const { room } = playedRoom(false);
    expect(room.captures).toBeNull();
  });

  it("keeps the last few decisions and saves one as a training scenario", () => {
    const { room, dir } = playedRoom(true);
    const log = room.captures;
    if (log === null) throw new Error("no capture log");
    const entries = log.list();
    expect(entries.length).toBe(CAPTURE_KEEP);
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
