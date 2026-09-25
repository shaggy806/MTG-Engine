import { defineCard } from "../define.js";

export default defineCard({
  name: "Serpentine Kavu",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Kavu"],
  power: 4,
  toughness: 4,
  text: "{R}: This creature gains haste until end of turn.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "haste", duration: "end-of-turn" },
      resolve: null,
      text: "{R}: This creature gains haste until end of turn.",
    },
  ],
});
