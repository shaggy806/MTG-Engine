import { defineCard } from "../define.js";

export default defineCard({
  name: "Zealous Guardian",
  manaCost: "{W/U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Kithkin", "Soldier"],
  power: 1,
  toughness: 1,
  keywords: ["flash"],
  text: "Flash",
});
