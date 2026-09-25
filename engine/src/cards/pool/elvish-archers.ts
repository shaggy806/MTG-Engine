import { defineCard } from "../define.js";

export default defineCard({
  name: "Elvish Archers",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Archer"],
  power: 2,
  toughness: 1,
  keywords: ["first-strike"],
  text: "First strike",
});
