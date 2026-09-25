import { defineCard } from "../define.js";

export default defineCard({
  name: "Illvoi Galeblade",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Jellyfish", "Warrior"],
  power: 1,
  toughness: 1,
  keywords: ["flash", "flying"],
  text: "Flash\nFlying\n{2}, Sacrifice this creature: Draw a card.",
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}, Sacrifice this creature: Draw a card.",
    },
  ],
});
