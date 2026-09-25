import { defineCard } from "../define.js";

export default defineCard({
  name: "Pitiless Gorgon",
  manaCost: "{1}{B/G}{B/G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Gorgon"],
  power: 2,
  toughness: 2,
  keywords: ["deathtouch"],
  text: "Deathtouch",
});
