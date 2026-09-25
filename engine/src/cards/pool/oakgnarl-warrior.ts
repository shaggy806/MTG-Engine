import { defineCard } from "../define.js";

export default defineCard({
  name: "Oakgnarl Warrior",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Treefolk", "Warrior"],
  power: 5,
  toughness: 7,
  keywords: ["vigilance", "trample"],
  text: "Vigilance, trample",
});
