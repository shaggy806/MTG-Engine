import { defineCard } from "../define.js";

export default defineCard({
  name: "Skyknight Legionnaire",
  manaCost: "{1}{R}{W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["flying", "haste"],
  text: "Flying, haste",
});
