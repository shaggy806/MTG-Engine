import { describe, expect, it } from "vitest";

import { createSandbox, sandboxAdvance } from "./sandbox.js";
import type { TargetRef } from "./target.js";

const findObj = (sb: ReturnType<typeof createSandbox>, name: string, controller: string) =>
  Object.values(sb.game.state.objects).find(
    (o) => o.cardName === name && o.controller === controller && o.zone === "battlefield",
  );

describe("card sandbox", () => {
  it("starts on you's first precombat main with you idle on priority", () => {
    const sb = createSandbox("Grizzly Bears");
    expect(sb.game.state.turn.step).toBe("precombat-main");
    expect(sb.game.state.priority.holder).toBe(sb.you);
    expect(sb.game.state.awaiting).toBeNull();
  });

  it("puts a permanent both in hand and on the battlefield; a spell only in hand", () => {
    const perm = createSandbox("Grizzly Bears");
    expect(perm.onBattlefield).not.toBeNull();
    expect(perm.inHand).not.toBeNull();

    const spell = createSandbox("Lightning Bolt");
    expect(spell.onBattlefield).toBeNull();
    expect(spell.inHand).not.toBeNull();
  });

  it("resolves a cast spell once you pass (the foe auto-passes)", () => {
    const sb = createSandbox("Lightning Bolt");
    const cast = sb.game.legalActions(sb.you).find((a) => a.kind === "cast-spell");
    expect(cast).toBeDefined();
    const bears = findObj(sb, "Grizzly Bears", sb.foe);
    expect(bears).toBeDefined();
    const target: TargetRef = { kind: "object", object: bears!.id };

    sb.game.dispatch({ type: "cast-spell", player: sb.you, card: cast!.card, targets: [target] });
    sandboxAdvance(sb.game);
    sb.game.dispatch({ type: "pass-priority", player: sb.you });
    sandboxAdvance(sb.game);

    expect(sb.game.state.objects[bears!.id].zone).toBe("graveyard");
  });

  it("exposes a static ability's effect on the battlefield copy", () => {
    const sb = createSandbox("Glorious Anthem");
    const bears = findObj(sb, "Grizzly Bears", sb.you);
    const view = sb.game.viewFor(sb.you).objects[bears!.id];
    expect(view.power).toBe(3);
    expect(view.toughness).toBe(3);
  });

  it("carries a CardDefinition.art override through to the view", () => {
    const sb = createSandbox("Grovewatch Elder");
    const elder = findObj(sb, "Grovewatch Elder", sb.you);
    const view = sb.game.viewFor(sb.you).objects[elder!.id];
    expect(view.art).toContain("scryfall.io");
  });
});
