import { defineCard } from "../define.js";

export default defineCard({
  name: "Halberdier",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Barbarian"],
  power: 3,
  toughness: 1,
  keywords: ["first-strike"],
  text: "First strike",
});
