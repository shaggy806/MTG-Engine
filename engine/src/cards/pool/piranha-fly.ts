import { defineCard } from "../define.js";

export default defineCard({
  name: "Piranha Fly",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Fish", "Insect"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nThis creature enters tapped.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This creature enters tapped.",
    },
  ],
});
