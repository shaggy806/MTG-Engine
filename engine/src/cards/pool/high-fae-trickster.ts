import { defineCard } from "../define.js";

// Casting only: an ability "activate only as a sorcery" stays one (the
// ruling).
export default defineCard({
  name: "High Fae Trickster",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie", "Wizard"],
  power: 4,
  toughness: 2,
  keywords: ["flash", "flying"],
  text:
    "Flash (You may cast this spell any time you could cast an instant.)\n" +
    "Flying\n" +
    "You may cast spells as though they had flash.",
  static: [
    {
      affects: { scope: "self" },
      castAsThoughFlash: true,
      text: "You may cast spells as though they had flash.",
    },
  ],
});
