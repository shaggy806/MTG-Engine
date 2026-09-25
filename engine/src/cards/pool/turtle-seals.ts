import { defineCard } from "../define.js";

export default defineCard({
  name: "Turtle-Seals",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Turtle", "Seal"],
  power: 2,
  toughness: 4,
  keywords: ["vigilance"],
  text: "Vigilance (Attacking doesn't cause this creature to tap.)",
});
