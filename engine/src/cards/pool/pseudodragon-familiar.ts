import { defineCard } from "../define.js";

export default defineCard({
  name: "Pseudodragon Familiar",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\n{2}{U}: Target creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: "{2}{U}", tap: false },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{2}{U}: Target creature gains flying until end of turn.",
    },
  ],
});
