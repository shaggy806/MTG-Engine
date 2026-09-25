import { defineCard } from "../define.js";

export default defineCard({
  name: "Zodiac Rooster",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 1,
  keywords: ["plainswalk"],
  text: "Plainswalk (This creature can't be blocked as long as defending player controls a Plains.)",
});
