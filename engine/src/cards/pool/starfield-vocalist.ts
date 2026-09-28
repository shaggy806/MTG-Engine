import { defineCard } from "../define.js";

// needed-cards P15. New: StaticAbility.doubleEntryTriggers (Panharmonicon-
// style ETB-trigger doubling, rule-114-adjacent). Warp is `warp` (rule
// 702.185).
const DOUBLING_TEXT =
  "If a permanent entering the battlefield causes a triggered ability of a permanent " +
  "you control to trigger, that ability triggers an additional time.";

export default defineCard({
  name: "Starfield Vocalist",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Bard"],
  power: 3,
  toughness: 4,
  text:
    `${DOUBLING_TEXT}\n` +
    "Warp {1}{U} (You may cast this card from your hand for its warp cost. Exile this creature " +
    "at the beginning of the next end step, then you may cast it from exile on a later turn.)",
  warp: { cost: "{1}{U}" },
  static: [
    {
      affects: { scope: "self" },
      doubleEntryTriggers: {},
      text: DOUBLING_TEXT,
    },
  ],
});
