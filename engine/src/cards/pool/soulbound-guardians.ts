import { defineCard } from "../define.js";

export default defineCard({
  name: "Soulbound Guardians",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Kor", "Spirit"],
  power: 4,
  toughness: 5,
  keywords: ["defender", "flying"],
  text: "Defender, flying",
});
