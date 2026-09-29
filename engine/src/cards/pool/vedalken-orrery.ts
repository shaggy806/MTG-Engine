import { defineCard } from "../define.js";

export default defineCard({
  name: "Vedalken Orrery",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "You may cast spells as though they had flash.",
  static: [
    {
      affects: { scope: "self" },
      castAsThoughFlash: true,
      text: "You may cast spells as though they had flash.",
    },
  ],
});
