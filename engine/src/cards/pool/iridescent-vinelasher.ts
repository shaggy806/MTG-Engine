import { defineCard } from "../define.js";
import { offspringTrigger } from "../helpers.js";

// Offspring (rule 702.175): the optional additional cost is a `kicker` under
// its own keyword, and `offspringTrigger()` makes the 1/1 copy.
const LANDFALL_TEXT =
  "Landfall — Whenever a land you control enters, this creature deals 1 damage to target opponent.";

export default defineCard({
  name: "Iridescent Vinelasher",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Lizard", "Assassin"],
  power: 1,
  toughness: 2,
  text:
    "Offspring {2} (You may pay an additional {2} as you cast this spell. If you do, when this " +
    "creature enters, create a 1/1 token copy of it.)\n" +
    LANDFALL_TEXT,
  kicker: { cost: "{2}", keyword: "offspring" },
  triggered: [
    offspringTrigger(),
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: ["opponent"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
});
