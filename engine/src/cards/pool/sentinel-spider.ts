import { defineCard } from "../define.js";

export default defineCard({
  name: "Sentinel Spider",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spider"],
  power: 4,
  toughness: 4,
  keywords: ["reach", "vigilance"],
  text: "Reach, vigilance",
});
