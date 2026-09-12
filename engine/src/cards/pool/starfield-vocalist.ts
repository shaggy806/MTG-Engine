import { defineCard } from "../define.js";

// needed-cards P15. New: StaticAbility.doubleEntryTriggers (Panharmonicon-
// style ETB-trigger doubling, rule-114-adjacent). Warp (cast from hand for
// an alternate cost, exile at end step, may cast again later) isn't modeled
// — dropped, same as this card's other omitted alt-cast mechanics elsewhere
// in the pool.
export default defineCard({
  name: "Starfield Vocalist",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Bard"],
  power: 3,
  toughness: 4,
  text:
    "If a permanent entering the battlefield causes a triggered ability of a permanent " +
    "you control to trigger, that ability triggers an additional time.",
  static: [
    {
      affects: { scope: "self" },
      doubleEntryTriggers: {},
      text:
        "If a permanent entering the battlefield causes a triggered ability of a permanent " +
        "you control to trigger, that ability triggers an additional time.",
    },
  ],
});
