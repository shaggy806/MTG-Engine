import { defineCard } from "../define.js";

export default defineCard({
  name: "Spectral Sailor",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Spirit", "Pirate"],
  power: 1,
  toughness: 1,
  keywords: ["flash", "flying"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nFlying\n{3}{U}: Draw a card.",
  activated: [
    {
      cost: { mana: "{3}{U}", tap: false },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{3}{U}: Draw a card.",
    },
  ],
});
