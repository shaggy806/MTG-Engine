import { defineCard } from "../define.js";

export default defineCard({
  name: "Swift Spinner",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spider"],
  power: 2,
  toughness: 3,
  keywords: ["flash", "reach"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nReach (This creature can block creatures with flying.)",
});
