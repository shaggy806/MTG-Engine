import { defineCard } from "../define.js";

export default defineCard({
  name: "Greenwood Sentinel",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Scout"],
  power: 2,
  toughness: 2,
  keywords: ["vigilance"],
  text: "Vigilance (Attacking doesn't cause this creature to tap.)",
});
