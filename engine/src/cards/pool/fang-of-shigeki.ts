import { defineCard } from "../define.js";

export default defineCard({
  name: "Fang of Shigeki",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment", "creature"],
  subtypes: ["Snake", "Ninja"],
  power: 1,
  toughness: 1,
  keywords: ["deathtouch"],
  text: "Deathtouch",
});
