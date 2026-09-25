import { defineCard } from "../define.js";

export default defineCard({
  name: "Raging Redcap",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Knight"],
  power: 1,
  toughness: 2,
  keywords: ["double-strike"],
  text: "Double strike (This creature deals both first-strike and regular combat damage.)",
});
