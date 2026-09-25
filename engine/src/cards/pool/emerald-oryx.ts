import { defineCard } from "../define.js";

export default defineCard({
  name: "Emerald Oryx",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Antelope"],
  power: 2,
  toughness: 3,
  keywords: ["forestwalk"],
  text: "Forestwalk (This creature can't be blocked as long as defending player controls a Forest.)",
});
