import { defineCard } from "../define.js";

export default defineCard({
  name: "Harmattan Efreet",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Efreet"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{1}{U}{U}: Target creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{U}{U}", tap: false },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{1}{U}{U}: Target creature gains flying until end of turn.",
    },
  ],
});
