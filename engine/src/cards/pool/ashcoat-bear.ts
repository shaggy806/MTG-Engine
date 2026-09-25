import { defineCard } from "../define.js";

export default defineCard({
  name: "Ashcoat Bear",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Bear"],
  power: 2,
  toughness: 2,
  keywords: ["flash"],
  text: "Flash (You may cast this spell any time you could cast an instant.)",
});
