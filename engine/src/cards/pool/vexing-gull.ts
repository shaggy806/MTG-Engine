import { defineCard } from "../define.js";

export default defineCard({
  name: "Vexing Gull",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 2,
  keywords: ["flash", "flying"],
  text: "Flash\nFlying",
});
