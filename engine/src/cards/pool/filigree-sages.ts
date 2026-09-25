import { defineCard } from "../define.js";

export default defineCard({
  name: "Filigree Sages",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Vedalken", "Wizard"],
  power: 2,
  toughness: 3,
  text: "{2}{U}: Untap target artifact.",
  activated: [
    {
      cost: { mana: "{2}{U}", tap: false },
      targets: ["artifact"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "{2}{U}: Untap target artifact.",
    },
  ],
});
