import { defineCard } from "../define.js";

export default defineCard({
  name: "Simic Ragworm",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Worm"],
  power: 3,
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
