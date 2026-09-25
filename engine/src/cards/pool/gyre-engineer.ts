import { defineCard } from "../define.js";

export default defineCard({
  name: "Gyre Engineer",
  manaCost: "{1}{G}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Vedalken", "Wizard"],
  power: 1,
  toughness: 1,
  text: "{T}: Add {G}{U}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { all: ["G", "U"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {G}{U}.",
    },
  ],
});
