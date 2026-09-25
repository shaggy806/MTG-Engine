import { defineCard } from "../define.js";

export default defineCard({
  name: "Glissa's Courier",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Horror"],
  power: 2,
  toughness: 3,
  keywords: ["mountainwalk"],
  text: "Mountainwalk (This creature can't be blocked as long as defending player controls a Mountain.)",
});
