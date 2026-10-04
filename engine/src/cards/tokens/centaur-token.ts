import { defineCard } from "../define.js";

// Hunted Horror's Centaur token.

export default defineCard({
  name: "Centaur Token",
  art: "dcd41697-6fe6-423c-a04a-035a3d4f8fd2",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Centaur"],
  power: 3,
  toughness: 3,
  text: "Protection from black",
  static: [
    {
      affects: { scope: "self" },
      protection: { colors: ["B"] },
      text: "Protection from black",
    },
  ],
});
