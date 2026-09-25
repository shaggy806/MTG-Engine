import { defineCard } from "../define.js";

export default defineCard({
  name: "Spined Thopter",
  manaCost: "{2}{U/P}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Thopter"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: "({U/P} can be paid with either {U} or 2 life.)\nFlying",
});
