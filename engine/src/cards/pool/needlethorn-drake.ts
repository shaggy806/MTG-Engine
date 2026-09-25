import { defineCard } from "../define.js";

export default defineCard({
  name: "Needlethorn Drake",
  manaCost: "{G}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 1,
  toughness: 1,
  keywords: ["flying", "deathtouch"],
  text: "Flying, deathtouch",
});
