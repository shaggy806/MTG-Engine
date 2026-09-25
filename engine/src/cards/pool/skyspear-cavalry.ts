import { defineCard } from "../define.js";

export default defineCard({
  name: "Skyspear Cavalry",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 2,
  keywords: ["flying", "double-strike"],
  text: "Flying\nDouble strike (This creature deals both first-strike and regular combat damage.)",
});
