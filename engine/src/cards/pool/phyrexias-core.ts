import { defineCard } from "../define.js";

export default defineCard({
  name: "Phyrexia's Core",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{1}, {T}, Sacrifice an artifact: You gain 1 life.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{1}", tap: true, sacrifice: { filter: { type: "artifact" } } },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "{1}, {T}, Sacrifice an artifact: You gain 1 life.",
    },
  ],
});
