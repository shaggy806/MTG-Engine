import { defineCard } from "../define.js";

export default defineCard({
  name: "Thran Dynamo",
  manaCost: "{4}",
  types: ["artifact"],
  text: "{T}: Add {C}{C}{C}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 3 },
      resolve: null,
      text: "{T}: Add {C}{C}{C}.",
    },
  ],
});
