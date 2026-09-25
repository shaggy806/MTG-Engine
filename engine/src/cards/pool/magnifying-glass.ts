import { defineCard } from "../define.js";

export default defineCard({
  name: "Magnifying Glass",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {C}.\n{4}, {T}: Investigate. (Create a Clue token. It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{4}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Clue Token", count: 1 },
      resolve: null,
      text: "{4}, {T}: Investigate.",
    },
  ],
});
