import { defineCard } from "../define.js";

export default defineCard({
  name: "Winged Coatl",
  manaCost: "{1}{G}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Snake"],
  power: 1,
  toughness: 1,
  keywords: ["flash", "flying", "deathtouch"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nFlying\nDeathtouch (Any amount of damage this deals to a creature is enough to destroy it.)",
});
