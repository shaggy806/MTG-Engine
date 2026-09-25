import { defineCard } from "../define.js";

export default defineCard({
  name: "Archweaver",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spider"],
  power: 5,
  toughness: 5,
  keywords: ["reach", "trample"],
  text: "Reach, trample",
});
