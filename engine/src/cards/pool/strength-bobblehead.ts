import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

// EDHREC rank 6065.
//
// Rulings:
//   [2024-03-08] The value of X is determined only once, as Strength Bobblehead's last ability
//     resolves.

const PUMP_TEXT =
  "{3}, {T}: Put X +1/+1 counters on target creature, where X is the number of Bobbleheads you control. Activate only as a sorcery.";

export default defineCard({
  name: "Strength Bobblehead",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Bobblehead"],
  text: `{T}: Add one mana of any color.\n${PUMP_TEXT}`,
  activated: [
    addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." }),
    {
      cost: { mana: "{3}", tap: true },
      targets: ["creature"],
      // Counted as it resolves (the ruling).
      effect: {
        kind: "add-counter",
        target: 0,
        counter: "+1/+1",
        amount: { countOf: { subtype: "Bobblehead", controlledBy: "you" } },
      },
      resolve: null,
      text: PUMP_TEXT,
      sorcerySpeed: true,
    },
  ],
});
