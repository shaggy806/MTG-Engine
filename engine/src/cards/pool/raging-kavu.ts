import { defineCard } from "../define.js";

export default defineCard({
  name: "Raging Kavu",
  manaCost: "{1}{R}{G}",
  colors: ["R", "G"],
  types: ["creature"],
  subtypes: ["Kavu"],
  power: 3,
  toughness: 1,
  keywords: ["flash", "haste"],
  text: "Flash\nHaste",
});
