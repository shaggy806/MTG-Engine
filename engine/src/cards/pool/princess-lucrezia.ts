import { defineCard } from "../define.js";

export default defineCard({
  name: "Princess Lucrezia",
  manaCost: "{3}{U}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 5,
  toughness: 4,
  text: "{T}: Add {U}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}.",
    },
  ],
});
