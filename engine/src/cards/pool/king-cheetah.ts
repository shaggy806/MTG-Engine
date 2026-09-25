import { defineCard } from "../define.js";

export default defineCard({
  name: "King Cheetah",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 3,
  toughness: 2,
  keywords: ["flash"],
  text: "Flash",
});
