import { defineCard } from "../define.js";

export default defineCard({
  name: "Zodiac Monkey",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Monkey"],
  power: 2,
  toughness: 1,
  keywords: ["forestwalk"],
  text: "Forestwalk (This creature can't be blocked as long as defending player controls a Forest.)",
});
