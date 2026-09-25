import { defineCard } from "../define.js";

export default defineCard({
  name: "Underdark Basilisk",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Basilisk"],
  power: 1,
  toughness: 2,
  keywords: ["deathtouch"],
  text: "Deathtouch",
});
