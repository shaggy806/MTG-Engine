import { defineCard } from "../define.js";

export default defineCard({
  name: "Weaver of Currents",
  manaCost: "{1}{G}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Snake", "Druid"],
  power: 2,
  toughness: 2,
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
