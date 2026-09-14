import { defineCard } from "../define.js";

export default defineCard({
  name: "Ancient Tomb",
  types: ["land"],
  text: "{T}: Add {C}{C}. Ancient Tomb deals 2 damage to you.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 2, painToController: 2 },
      resolve: null,
      text: "{T}: Add {C}{C}. Ancient Tomb deals 2 damage to you.",
    },
  ],
});
