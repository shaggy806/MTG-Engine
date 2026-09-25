import { defineCard } from "../define.js";

export default defineCard({
  name: "Apprentice Wizard",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 0,
  toughness: 1,
  text: "{U}, {T}: Add {C}{C}{C}.",
  activated: [
    {
      cost: { mana: "{U}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 3 },
      resolve: null,
      text: "{U}, {T}: Add {C}{C}{C}.",
    },
  ],
});
