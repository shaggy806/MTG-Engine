import { defineCard } from "../define.js";

export default defineCard({
  name: "Darting Merfolk",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk"],
  power: 1,
  toughness: 1,
  text: "{U}: Return this creature to its owner's hand.",
  activated: [
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "{U}: Return this creature to its owner's hand.",
    },
  ],
});
