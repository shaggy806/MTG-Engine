import { defineCard } from "../define.js";

export default defineCard({
  name: "Kozilek's Channeler",
  manaCost: "{5}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 4,
  toughness: 4,
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
