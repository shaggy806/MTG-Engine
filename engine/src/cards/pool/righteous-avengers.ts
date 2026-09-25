import { defineCard } from "../define.js";

export default defineCard({
  name: "Righteous Avengers",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 1,
  keywords: ["plainswalk"],
  text: "Plainswalk (This creature can't be blocked as long as defending player controls a Plains.)",
});
