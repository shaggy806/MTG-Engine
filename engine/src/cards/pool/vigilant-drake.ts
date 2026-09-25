import { defineCard } from "../define.js";

export default defineCard({
  name: "Vigilant Drake",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\n{2}{U}: Untap this creature.",
  activated: [
    {
      cost: { mana: "{2}{U}", tap: false },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "{2}{U}: Untap this creature.",
    },
  ],
});
