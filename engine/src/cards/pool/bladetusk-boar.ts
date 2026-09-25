import { defineCard } from "../define.js";

export default defineCard({
  name: "Bladetusk Boar",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Boar"],
  power: 3,
  toughness: 2,
  keywords: ["intimidate"],
  text: "Intimidate (This creature can't be blocked except by artifact creatures and/or creatures that share a color with it.)",
});
