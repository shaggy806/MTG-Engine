import { defineCard } from "../define.js";

export default defineCard({
  name: "Unhallowed Phalanx",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Soldier"],
  power: 1,
  toughness: 13,
  text: "This creature enters tapped.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This creature enters tapped.",
    },
  ],
});
