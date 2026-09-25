import { defineCard } from "../define.js";

export default defineCard({
  name: "Hired Blade",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 3,
  toughness: 2,
  keywords: ["flash"],
  text: "Flash (You may cast this spell any time you could cast an instant.)",
});
