import { defineCard } from "../define.js";
import { offspringTrigger } from "../helpers.js";

// Offspring (rule 702.175): the optional additional cost is a `kicker` under
// its own keyword, and `offspringTrigger()` makes the 1/1 copy.
export default defineCard({
  name: "Darkstar Augur",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Bat", "Warlock"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: "Offspring {B} (You may pay an additional {B} as you cast this spell. If you do, when this creature enters, create a 1/1 token copy of it.)\nFlying\nAt the beginning of your upkeep, reveal the top card of your library and put that card into your hand. You lose life equal to its mana value.",
  triggered: [
    offspringTrigger(),
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      // Put into your hand, not drawn: a revealed top card, then the life.
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 1,
        min: 1,
        max: 1,
        destination: "hand",
        leftover: "stay",
        reveal: true,
        then: { kind: "lose-life", who: "you", amount: { manaValueOf: 0 } },
      },
      resolve: null,
      text: "At the beginning of your upkeep, reveal the top card of your library and put that card into your hand. You lose life equal to its mana value.",
    },
  ],
  kicker: { cost: "{B}", keyword: "offspring" },
});
