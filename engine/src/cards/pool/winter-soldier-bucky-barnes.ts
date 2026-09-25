import { defineCard } from "../define.js";

export default defineCard({
  name: "Winter Soldier, Bucky Barnes",
  manaCost: "{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier", "Hero"],
  power: 2,
  toughness: 2,
  text: "Winter Soldier enters tapped.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "Winter Soldier enters tapped.",
    },
  ],
});
