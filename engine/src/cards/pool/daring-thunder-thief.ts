import { defineCard } from "../define.js";

export default defineCard({
  name: "Daring Thunder-Thief",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Turtle", "Rogue"],
  power: 4,
  toughness: 4,
  keywords: ["flash"],
  text: "Flash\nThis creature enters tapped.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This creature enters tapped.",
    },
  ],
});
