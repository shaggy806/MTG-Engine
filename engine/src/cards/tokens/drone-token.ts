import { defineCard } from "../define.js";

// Pinnacle Emissary's Drone token.

export default defineCard({
  name: "Drone Token",
  art: "3fcf8950-117a-4587-8522-79001dffa500",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Drone"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nThis token can block only creatures with flying.",
  static: [
    {
      affects: { scope: "self" },
      canBlockOnly: { keyword: "flying" },
      text: "This token can block only creatures with flying.",
    },
  ],
});
