import { defineCard } from "../define.js";

export default defineCard({
  name: "Bitterbow Sharpshooters",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Jackal", "Archer"],
  power: 4,
  toughness: 4,
  keywords: ["reach", "vigilance"],
  text: "Reach, vigilance",
});
