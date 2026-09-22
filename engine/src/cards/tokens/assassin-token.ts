import { defineCard } from "../define.js";

// A 1/1 black Assassin with deathtouch and haste — Queen Marchesa.
export default defineCard({
  name: "Assassin Token",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Assassin"],
  power: 1,
  toughness: 1,
  keywords: ["deathtouch", "haste"],
});
