import { defineCard } from "../define.js";

export default defineCard({
  name: "Hussar Patrol",
  manaCost: "{2}{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 4,
  keywords: ["flash", "vigilance"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nVigilance",
});
