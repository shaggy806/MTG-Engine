import { defineCard } from "../define.js";

export default defineCard({
  name: "Marisi's Twinclaws",
  manaCost: "{2}{R/W}{G}",
  colors: ["W", "R", "G"],
  types: ["creature"],
  subtypes: ["Cat", "Warrior"],
  power: 2,
  toughness: 4,
  keywords: ["double-strike"],
  text: "Double strike",
});
