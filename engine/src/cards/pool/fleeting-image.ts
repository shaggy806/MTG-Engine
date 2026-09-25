import { defineCard } from "../define.js";

export default defineCard({
  name: "Fleeting Image",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Illusion"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying (This creature can't be blocked except by creatures with flying or reach.)\n{1}{U}: Return this creature to its owner's hand.",
  activated: [
    {
      cost: { mana: "{1}{U}", tap: false },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "{1}{U}: Return this creature to its owner's hand.",
    },
  ],
});
