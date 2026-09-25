import { defineCard } from "../define.js";

export default defineCard({
  name: "Nightguard Patrol",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 1,
  keywords: ["first-strike", "vigilance"],
  text: "First strike, vigilance",
});
