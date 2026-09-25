import { defineCard } from "../define.js";

export default defineCard({
  name: "Merfolk of the Depths",
  manaCost: "{4}{G/U}{G/U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Merfolk", "Soldier"],
  power: 4,
  toughness: 2,
  keywords: ["flash"],
  text: "Flash (You may cast this spell any time you could cast an instant.)",
});
