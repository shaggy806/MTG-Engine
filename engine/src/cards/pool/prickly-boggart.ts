import { defineCard } from "../define.js";

export default defineCard({
  name: "Prickly Boggart",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Goblin", "Rogue"],
  power: 1,
  toughness: 1,
  keywords: ["fear"],
  text: "Fear (This creature can't be blocked except by artifact creatures and/or black creatures.)",
});
