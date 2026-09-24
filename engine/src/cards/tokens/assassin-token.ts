import { defineCard } from "../define.js";

// A 1/1 black Assassin with deathtouch and haste — Queen Marchesa.
export default defineCard({
  name: "Assassin Token",
  art: "3a0d35d2-1e30-4aba-abf5-4ac2707c9ea3",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Assassin"],
  power: 1,
  toughness: 1,
  keywords: ["deathtouch", "haste"],
});
