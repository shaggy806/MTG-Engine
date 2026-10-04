import { defineCard } from "../define.js";

// EDHREC rank 3893.
//
// Rulings:
//   [2022-02-18] If you control both an artifact and an enchantment, you will draw two cards. If a
//     single permanent is both an artifact and an enchantment, that counts as controlling both.

const SAC_TEXT =
  "{2}, {T}, Sacrifice this land: Draw a card if you control an artifact. Draw a card if you control an enchantment.";

// Two independent checks as it resolves: an artifact enchantment satisfies both (the ruling).
export default defineCard({
  name: "Roadside Reliquary",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${SAC_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "conditional",
            condition: { kind: "controls", filter: { type: "artifact" }, atLeast: 1 },
            then: { kind: "draw", amount: 1 },
          },
          {
            kind: "conditional",
            condition: { kind: "controls", filter: { type: "enchantment" }, atLeast: 1 },
            then: { kind: "draw", amount: 1 },
          },
        ],
      },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
