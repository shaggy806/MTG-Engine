import { defineCard } from "../define.js";

export default defineCard({
  name: "Two-Headed Cerberus",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dog"],
  power: 1,
  toughness: 2,
  keywords: ["double-strike"],
  text: "Double strike (This creature deals both first-strike and regular combat damage.)",
});
