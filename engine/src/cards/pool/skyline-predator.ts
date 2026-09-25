import { defineCard } from "../define.js";

export default defineCard({
  name: "Skyline Predator",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 3,
  toughness: 4,
  keywords: ["flash", "flying"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nFlying",
});
