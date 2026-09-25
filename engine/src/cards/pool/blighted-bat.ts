import { defineCard } from "../define.js";

export default defineCard({
  name: "Blighted Bat",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Bat"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\n{1}: This creature gains haste until end of turn.",
  activated: [
    {
      cost: { mana: "{1}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "haste", duration: "end-of-turn" },
      resolve: null,
      text: "{1}: This creature gains haste until end of turn.",
    },
  ],
});
