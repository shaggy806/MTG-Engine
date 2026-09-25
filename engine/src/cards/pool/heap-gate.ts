import { defineCard } from "../define.js";

export default defineCard({
  name: "Heap Gate",
  colors: [],
  types: ["land"],
  subtypes: ["Gate"],
  text: "{T}: Add {C}.\n{1}, {T}: Add one mana of any color.\n{1}, {T}, Tap an untapped Gate you control: Create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add one mana of any color.",
    },
    {
      cost: {
        mana: "{1}",
        tap: true,
        tapOthers: { count: 1, filter: { subtype: "Gate", controlledBy: "you" } },
      },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "{1}, {T}, Tap an untapped Gate you control: Create a Treasure token.",
    },
  ],
});
