import { defineCard } from "../define.js";

export default defineCard({
  name: "Hit-Monkey",
  manaCost: "{3}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Monkey", "Assassin"],
  power: 3,
  toughness: 3,
  keywords: ["reach", "vigilance", "deathtouch", "hexproof", "haste"],
  cantBeCountered: true,
  text: "This spell can't be countered.\nReach, vigilance, deathtouch, hexproof, haste",
});
