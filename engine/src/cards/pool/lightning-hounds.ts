import { defineCard } from "../define.js";

export default defineCard({
  name: "Lightning Hounds",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dog"],
  power: 3,
  toughness: 2,
  keywords: ["first-strike"],
  text: "First strike",
});
