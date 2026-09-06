import { defineCard } from "../define.js";

export default defineCard({
  name: "Vampire Nighthawk",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Shaman"],
  power: 2,
  toughness: 3,
  keywords: ["flying", "deathtouch", "lifelink"],
  text: "Flying, deathtouch, lifelink",
});
