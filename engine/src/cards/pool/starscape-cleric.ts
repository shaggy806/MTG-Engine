import { defineCard } from "../define.js";
import { offspringTrigger } from "../helpers.js";

// Offspring (rule 702.175): the optional additional cost is a `kicker` under
// its own keyword, and `offspringTrigger()` makes the 1/1 copy.
export default defineCard({
  name: "Starscape Cleric",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Bat", "Cleric"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: "Offspring {2}{B} (You may pay an additional {2}{B} as you cast this spell. If you do, when this creature enters, create a 1/1 token copy of it.)\nFlying\nThis creature can't block.\nWhenever you gain life, each opponent loses 1 life.",
  triggered: [
    offspringTrigger(),
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever you gain life, each opponent loses 1 life.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["cant-block"],
      text: "This creature can't block.",
    },
  ],
  kicker: { cost: "{2}{B}", keyword: "offspring" },
});
