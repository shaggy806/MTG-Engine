import { defineCard } from "../define.js";
import { offspringTrigger } from "../helpers.js";

// Offspring (rule 702.175): the optional additional cost is a `kicker` under
// its own keyword, and `offspringTrigger()` makes the 1/1 copy.
export default defineCard({
  name: "Agate Instigator",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Lizard", "Rogue"],
  power: 1,
  toughness: 3,
  text: "Offspring {1}{R} (You may pay an additional {1}{R} as you cast this spell. If you do, when this creature enters, create a 1/1 token copy of it.)\nWhenever another creature you control enters, this creature deals 1 damage to each opponent.",
  triggered: [
    offspringTrigger(),
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever another creature you control enters, this creature deals 1 damage to each opponent.",
    },
  ],
  kicker: { cost: "{1}{R}", keyword: "offspring" },
});
