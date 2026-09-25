import { defineCard } from "../define.js";

export default defineCard({
  name: "Fighting Drake",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 2,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying",
});
