import { defineCard } from "../define.js";

export default defineCard({
  name: "Nephalia Seakite",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 3,
  keywords: ["flash", "flying"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nFlying",
});
