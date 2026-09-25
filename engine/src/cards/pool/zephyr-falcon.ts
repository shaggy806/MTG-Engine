import { defineCard } from "../define.js";

export default defineCard({
  name: "Zephyr Falcon",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 1,
  keywords: ["flying", "vigilance"],
  text: "Flying, vigilance",
});
