import { defineCard } from "../define.js";

export default defineCard({
  name: "Gifted Aetherborn",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Aetherborn", "Vampire"],
  power: 2,
  toughness: 3,
  keywords: ["deathtouch", "lifelink"],
  text: "Deathtouch, lifelink",
});
