import { defineCard } from "../define.js";

export default defineCard({
  name: "Horseshoe Crab",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Crab"],
  power: 1,
  toughness: 3,
  text: "{U}: Untap this creature.",
  activated: [
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "{U}: Untap this creature.",
    },
  ],
});
