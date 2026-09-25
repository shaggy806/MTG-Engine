import { defineCard } from "../define.js";

export default defineCard({
  name: "Cloaked Siren",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Siren"],
  power: 3,
  toughness: 2,
  keywords: ["flash", "flying"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nFlying",
});
