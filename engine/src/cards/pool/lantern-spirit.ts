import { defineCard } from "../define.js";

export default defineCard({
  name: "Lantern Spirit",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\n{U}: Return this creature to its owner's hand.",
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
