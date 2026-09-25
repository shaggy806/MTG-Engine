import { defineCard } from "../define.js";

export default defineCard({
  name: "Pixie Queen",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Faerie"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\n{G}{G}{G}, {T}: Target creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: "{G}{G}{G}", tap: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{G}{G}{G}, {T}: Target creature gains flying until end of turn.",
    },
  ],
});
