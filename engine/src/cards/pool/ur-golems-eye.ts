import { defineCard } from "../define.js";

export default defineCard({
  name: "Ur-Golem's Eye",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {C}{C}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 2 },
      resolve: null,
      text: "{T}: Add {C}{C}.",
    },
  ],
});
