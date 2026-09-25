import { defineCard } from "../define.js";

export default defineCard({
  name: "Lightning Stormkin",
  manaCost: "{U}{R}",
  colors: ["U", "R"],
  types: ["creature"],
  subtypes: ["Elemental", "Wizard"],
  power: 2,
  toughness: 2,
  keywords: ["flying", "haste"],
  text: "Flying\nHaste (This creature can attack and {T} as soon as it comes under your control.)",
});
