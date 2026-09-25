import { defineCard } from "../define.js";

export default defineCard({
  name: "Zodiac Rabbit",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Rabbit"],
  power: 1,
  toughness: 1,
  keywords: ["forestwalk"],
  text: "Forestwalk (This creature can't be blocked as long as defending player controls a Forest.)",
});
