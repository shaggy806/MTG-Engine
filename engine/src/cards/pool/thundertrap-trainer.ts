import { defineCard } from "../define.js";
import { offspringTrigger } from "../helpers.js";

// EDHREC rank 5659.
//
// Offspring (rule 702.175) is Coruscation Mage's shape: a `kicker` under its
// own keyword, and `offspringTrigger()` makes the 1/1 token copy — which has
// the look-at-four ability too, and it triggers as the copy enters (the
// rulings). The look is Search for Azcanta's, with the rest put on the
// bottom in a random order.
const LOOK_TEXT =
  "When this creature enters, look at the top four cards of your library. You may reveal a noncreature, nonland card from among them and put it into your hand. Put the rest on the bottom of your library in a random order.";

export default defineCard({
  name: "Thundertrap Trainer",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Otter", "Wizard"],
  power: 1,
  toughness: 2,
  text: `Offspring {4} (You may pay an additional {4} as you cast this spell. If you do, when this creature enters, create a 1/1 token copy of it.)\n${LOOK_TEXT}`,
  triggered: [
    offspringTrigger(),
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 4,
        reveal: "chosen",
        min: 0,
        max: 1,
        filter: { notTypes: ["creature", "land"] },
        destination: "hand",
        leftover: "bottom-random",
      },
      resolve: null,
      text: LOOK_TEXT,
    },
  ],
  kicker: { cost: "{4}", keyword: "offspring" },
});
