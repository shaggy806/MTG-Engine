import { defineCard } from "../define.js";

export default defineCard({
  name: "Plumeveil",
  manaCost: "{W/U}{W/U}{W/U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 4,
  toughness: 4,
  keywords: ["flash", "defender", "flying"],
  text: "Flash\nDefender, flying",
});
