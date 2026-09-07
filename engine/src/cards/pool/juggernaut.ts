import { defineCard } from "../define.js";

export default defineCard({
  name: "Juggernaut",
  manaCost: "{4}",
  types: ["artifact", "creature"],
  subtypes: ["Juggernaut"],
  power: 5,
  toughness: 3,
  text: "Juggernaut attacks each combat if able. Juggernaut can't be blocked by Walls.",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["must-attack"],
      text: "Juggernaut attacks each combat if able.",
    },
  ],
});
