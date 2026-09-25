import { defineCard } from "../define.js";

export default defineCard({
  name: "Faerie Invaders",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie", "Rogue"],
  power: 3,
  toughness: 3,
  keywords: ["flash", "flying"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nFlying",
});
