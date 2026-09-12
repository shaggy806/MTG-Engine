import { defineCard } from "../define.js";

/** needed-cards P10. The "if X is 10 or more, that creature gains haste and
 * you may have it fight target creature an opponent controls" clause is
 * dropped — it needs a way to hook a follow-up effect onto whichever
 * permanent a `choose-from-zone` decision resolves to, which nothing in the
 * engine does yet. Ferocious (the cost reduction) and the base tutor are
 * fully implemented. */
export default defineCard({
  name: "Finale of Devastation",
  manaCost: "{X}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text:
    "Search your library for a creature card with mana value X or less, put it onto " +
    "the battlefield, then shuffle. If X is 10 or more, that creature gains haste until " +
    "end of turn and you may have it fight target creature an opponent controls.\n" +
    "Ferocious — This spell costs {2} less to cast if you control a creature with power 4 or greater.",
  selfCostReduction: {
    condition: { kind: "controls", filter: { type: "creature", power: { op: "gte", n: 4 } }, atLeast: 1 },
    reduceGeneric: 2,
  },
  resolve: (ctx) => {
    ctx.searchLibrary({ type: "creature", manaValue: { op: "lte", n: ctx.x } }, "battlefield", 0, 1, false);
  },
});
