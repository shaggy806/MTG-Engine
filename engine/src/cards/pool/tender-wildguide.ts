import { defineCard } from "../define.js";
import { offspringTrigger } from "../helpers.js";

// Offspring (rule 702.175): the optional additional cost is a `kicker` under
// its own keyword, and `offspringTrigger()` makes the 1/1 copy.
export default defineCard({
  name: "Tender Wildguide",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Possum", "Druid"],
  power: 2,
  toughness: 2,
  text: "Offspring {2} (You may pay an additional {2} as you cast this spell. If you do, when this creature enters, create a 1/1 token copy of it.)\n{T}: Add one mana of any color.\n{T}: Put a +1/+1 counter on this creature.",
  triggered: [offspringTrigger()],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{T}: Put a +1/+1 counter on this creature.",
    },
  ],
  kicker: { cost: "{2}", keyword: "offspring" },
});
