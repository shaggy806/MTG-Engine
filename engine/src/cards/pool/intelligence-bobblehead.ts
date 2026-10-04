import { defineCard } from "../define.js";

// EDHREC rank 5907.
//
// Rulings:
//   [2024-03-08] The value of X is determined only once, as Intelligence Bobblehead's last ability
//     resolves.

export default defineCard({
  name: "Intelligence Bobblehead",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Bobblehead"],
  text: "{T}: Add one mana of any color.\n{5}, {T}: Draw X cards, where X is the number of Bobbleheads you control.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
    {
      cost: { mana: "{5}", tap: true },
      targets: [],
      // Counted as it resolves: itself included, while it's still there.
      effect: { kind: "draw", amount: { countOf: { subtype: "Bobblehead", controlledBy: "you" } } },
      resolve: null,
      text: "{5}, {T}: Draw X cards, where X is the number of Bobbleheads you control.",
    },
  ],
});
