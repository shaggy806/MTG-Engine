import { defineCard } from "../define.js";

export default defineCard({
  name: "Aesthir Glider",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Bird", "Construct"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nThis creature can't block.",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["cant-block"],
      text: "This creature can't block.",
    },
  ],
});
