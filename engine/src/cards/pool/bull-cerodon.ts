import { defineCard } from "../define.js";

export default defineCard({
  name: "Bull Cerodon",
  manaCost: "{4}{R}{W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 5,
  toughness: 5,
  keywords: ["vigilance", "haste"],
  text: "Vigilance, haste",
});
