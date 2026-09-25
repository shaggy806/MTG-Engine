import { defineCard } from "../define.js";

export default defineCard({
  name: "Topaz Dragon",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "deathtouch"],
  text: "Flying, deathtouch",
  faces: ["Topaz Dragon", "Entropic Cloud"],
  adventure: true,
});
