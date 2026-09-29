import { defineCard } from "../define.js";

// An artifact land is played, not cast, so it isn't affected (the ruling).
export default defineCard({
  name: "Shimmer Myr",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Myr"],
  power: 2,
  toughness: 2,
  keywords: ["flash"],
  text: "Flash\nYou may cast artifact spells as though they had flash.",
  static: [
    {
      affects: { scope: "self" },
      castAsThoughFlash: { type: "artifact" },
      text: "You may cast artifact spells as though they had flash.",
    },
  ],
});
