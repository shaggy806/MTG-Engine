import { defineCard } from "../define.js";

export default defineCard({
  name: "Affa Protector",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier", "Ally"],
  power: 1,
  toughness: 4,
  keywords: ["vigilance"],
  text: "Vigilance",
});
