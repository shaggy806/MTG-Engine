import { defineCard } from "../define.js";

export default defineCard({
  name: "Gaea's Skyfolk",
  manaCost: "{G}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Elf", "Merfolk"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying",
});
