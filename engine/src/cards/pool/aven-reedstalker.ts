import { defineCard } from "../define.js";

export default defineCard({
  name: "Aven Reedstalker",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird", "Warrior"],
  power: 2,
  toughness: 3,
  keywords: ["flash", "flying"],
  text: "Flash\nFlying",
});
