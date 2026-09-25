import { defineCard } from "../define.js";

export default defineCard({
  name: "Spectral Rider",
  manaCost: "{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["intimidate"],
  text: "Intimidate (This creature can't be blocked except by artifact creatures and/or creatures that share a color with it.)",
});
