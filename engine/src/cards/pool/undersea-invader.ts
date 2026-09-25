import { defineCard } from "../define.js";

export default defineCard({
  name: "Undersea Invader",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Giant", "Rogue"],
  power: 5,
  toughness: 6,
  keywords: ["flash"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nThis creature enters tapped.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This creature enters tapped.",
    },
  ],
});
