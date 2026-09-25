import { defineCard } from "../define.js";

export default defineCard({
  name: "Hulking Cyclops",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Cyclops"],
  power: 5,
  toughness: 5,
  text: "This creature can't block.",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["cant-block"],
      text: "This creature can't block.",
    },
  ],
});
