import { defineCard } from "../define.js";

// A 2/2 black Zombie — Cemetery Reaper's token.
export default defineCard({
  name: "Zombie Token",
  art: "https://scryfall.com/card/tm14/5/zombie",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 2,
});
