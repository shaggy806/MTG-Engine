import { defineCard } from "../define.js";

export default defineCard({
  name: "Soliton",
  manaCost: "{5}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 3,
  toughness: 4,
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
