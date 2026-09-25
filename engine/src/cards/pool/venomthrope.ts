import { defineCard } from "../define.js";

export default defineCard({
  name: "Venomthrope",
  manaCost: "{1}{G}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Tyranid"],
  power: 2,
  toughness: 2,
  keywords: ["flying", "deathtouch", "hexproof"],
  text: "Flying, deathtouch, hexproof",
});
