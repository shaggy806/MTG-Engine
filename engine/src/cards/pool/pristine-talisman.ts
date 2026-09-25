import { defineCard } from "../define.js";

export default defineCard({
  name: "Pristine Talisman",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {C}. You gain 1 life.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1, also: { kind: "gain-life", amount: 1 } },
      resolve: null,
      text: "{T}: Add {C}. You gain 1 life.",
    },
  ],
});
