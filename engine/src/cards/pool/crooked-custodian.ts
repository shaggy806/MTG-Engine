import { defineCard } from "../define.js";

export default defineCard({
  name: "Crooked Custodian",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Ogre", "Rogue"],
  power: 3,
  toughness: 2,
  text: "This creature enters tapped.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This creature enters tapped.",
    },
  ],
});
