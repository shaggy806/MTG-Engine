import { defineCard } from "../define.js";

export default defineCard({
  name: "Scarwood Treefolk",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Treefolk"],
  power: 3,
  toughness: 5,
  text: "This creature enters tapped.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This creature enters tapped.",
    },
  ],
});
