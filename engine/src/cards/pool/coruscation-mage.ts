import { defineCard } from "../define.js";
import { offspringTrigger } from "../helpers.js";

// Offspring (rule 702.175): the optional additional cost is a `kicker` under
// its own keyword, and `offspringTrigger()` makes the 1/1 copy.
export default defineCard({
  name: "Coruscation Mage",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Otter", "Wizard"],
  power: 2,
  toughness: 2,
  text: "Offspring {2} (You may pay an additional {2} as you cast this spell. If you do, when this creature enters, create a 1/1 token copy of it.)\nWhenever you cast a noncreature spell, this creature deals 1 damage to each opponent.",
  triggered: [
    offspringTrigger(),
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever you cast a noncreature spell, this creature deals 1 damage to each opponent.",
    },
  ],
  kicker: { cost: "{2}", keyword: "offspring" },
});
