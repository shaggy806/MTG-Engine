import { defineCard } from "../define.js";

export default defineCard({
  name: "Iroas's Champion",
  manaCost: "{1}{R}{W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 2,
  keywords: ["double-strike"],
  text: "Double strike (This creature deals both first-strike and regular combat damage.)",
});
