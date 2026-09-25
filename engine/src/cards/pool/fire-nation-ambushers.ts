import { defineCard } from "../define.js";

export default defineCard({
  name: "Fire Nation Ambushers",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 2,
  keywords: ["flash"],
  text: "Flash (You may cast this spell any time you could cast an instant.)",
});
