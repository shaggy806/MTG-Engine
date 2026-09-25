import { defineCard } from "../define.js";

export default defineCard({
  name: "Vampire of the Dire Moon",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 1,
  toughness: 1,
  keywords: ["deathtouch", "lifelink"],
  text: "Deathtouch (Any amount of damage this deals to a creature is enough to destroy it.)\nLifelink (Damage dealt by this creature also causes you to gain that much life.)",
});
