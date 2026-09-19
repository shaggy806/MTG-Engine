import { defineCard } from "../define.js";

/** needed-cards P10. Drops the "and/or **graveyard**" half of the search —
 * `search-library` searches one zone — so the shuffle rider is unconditional
 * here rather than the printed "if you search your library this way". */
export default defineCard({
  name: "Finale of Devastation",
  manaCost: "{X}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text:
    "Search your library for a creature card with mana value X or less and put it onto " +
    "the battlefield, then shuffle. If X is 10 or more, creatures you control get +X/+X " +
    "and gain haste until end of turn.",
  resolve: (ctx) => {
    ctx.searchLibrary(
      null,
      { type: "creature", manaValue: { op: "lte", n: ctx.x } },
      "battlefield",
      0,
      1,
      false,
    );
    // "If X is 10 or more" has no `StaticCondition` equivalent (conditions
    // read the board, not the spell's own X), which is what the imperative
    // hatch is for.
    if (ctx.x >= 10) {
      const yours = { type: "creature" as const, controlledBy: "you" as const };
      ctx.modifyPtAll(yours, ctx.x, ctx.x, "end-of-turn");
      ctx.grantKeywordAll(yours, "haste", "end-of-turn");
    }
  },
});
