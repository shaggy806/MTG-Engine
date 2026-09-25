import { defineCard } from "../define.js";

export default defineCard({
  name: "Cerodon Yearling",
  manaCost: "{R}{W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 2,
  toughness: 2,
  keywords: ["vigilance", "haste"],
  text: "Vigilance, haste",
});
