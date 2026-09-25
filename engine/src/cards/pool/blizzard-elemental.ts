import { defineCard } from "../define.js";

export default defineCard({
  name: "Blizzard Elemental",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying\n{3}{U}: Untap this creature.",
  activated: [
    {
      cost: { mana: "{3}{U}", tap: false },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "{3}{U}: Untap this creature.",
    },
  ],
});
