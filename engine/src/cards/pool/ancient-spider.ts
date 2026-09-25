import { defineCard } from "../define.js";

export default defineCard({
  name: "Ancient Spider",
  manaCost: "{2}{G}{W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Spider"],
  power: 2,
  toughness: 5,
  keywords: ["reach", "first-strike"],
  text: "Reach (This creature can block creatures with flying.)\nFirst strike",
});
