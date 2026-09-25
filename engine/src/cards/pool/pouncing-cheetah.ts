import { defineCard } from "../define.js";

export default defineCard({
  name: "Pouncing Cheetah",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 3,
  toughness: 2,
  keywords: ["flash"],
  text: "Flash",
});
