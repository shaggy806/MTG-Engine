import { defineCard } from "../define.js";

export default defineCard({
  name: "Sliptide Serpent",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Serpent"],
  power: 4,
  toughness: 4,
  text: "{3}{U}: Return this creature to its owner's hand.",
  activated: [
    {
      cost: { mana: "{3}{U}", tap: false },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "{3}{U}: Return this creature to its owner's hand.",
    },
  ],
});
