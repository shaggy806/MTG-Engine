import { defineCard } from "../define.js";

export default defineCard({
  name: "Boros Recruit",
  manaCost: "{R/W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Goblin", "Soldier"],
  power: 1,
  toughness: 1,
  keywords: ["first-strike"],
  text: "({R/W} can be paid with either {R} or {W}.)\nFirst strike",
});
