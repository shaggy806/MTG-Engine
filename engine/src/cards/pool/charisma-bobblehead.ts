import { defineCard } from "../define.js";

// EDHREC rank 5975.
//
// Rulings:
//   [2024-03-08] The value of X is calculated only once, as Charisma Bobblehead’s last ability
//     resolves.

export default defineCard({
  name: "Charisma Bobblehead",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Bobblehead"],
  text: "{T}: Add one mana of any color.\n{4}, {T}: Create X 1/1 white Soldier creature tokens, where X is the number of Bobbleheads you control. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
    {
      cost: { mana: "{4}", tap: true },
      targets: [],
      // X counted once, as it resolves (the ruling).
      effect: {
        kind: "create-token",
        token: "Soldier Token",
        count: { countOf: { subtype: "Bobblehead", controlledBy: "you" } },
      },
      resolve: null,
      text: "{4}, {T}: Create X 1/1 white Soldier creature tokens, where X is the number of Bobbleheads you control. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
