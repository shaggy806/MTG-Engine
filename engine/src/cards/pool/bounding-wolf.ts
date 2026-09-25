import { defineCard } from "../define.js";

export default defineCard({
  name: "Bounding Wolf",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wolf"],
  power: 3,
  toughness: 2,
  keywords: ["flash", "reach"],
  text: "Flash\nReach",
});
