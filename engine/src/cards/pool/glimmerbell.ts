import { defineCard } from "../define.js";

export default defineCard({
  name: "Glimmerbell",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Elemental", "Jellyfish"],
  power: 1,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\n{1}{U}: Untap this creature.",
  activated: [
    {
      cost: { mana: "{1}{U}", tap: false },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "{1}{U}: Untap this creature.",
    },
  ],
});
