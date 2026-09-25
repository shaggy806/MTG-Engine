import { defineCard } from "../define.js";

export default defineCard({
  name: "Crystacean",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Crab"],
  power: 1,
  toughness: 6,
  keywords: ["flash"],
  text: "Flash (You may cast this spell any time you could cast an instant.)",
});
