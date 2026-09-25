import { defineCard } from "../define.js";

export default defineCard({
  name: "Dawn's Light Archer",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Archer"],
  power: 4,
  toughness: 2,
  keywords: ["flash", "reach"],
  text: "Flash\nReach",
});
