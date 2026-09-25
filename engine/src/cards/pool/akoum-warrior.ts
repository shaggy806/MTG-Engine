import { defineCard } from "../define.js";

export default defineCard({
  name: "Akoum Warrior",
  manaCost: "{5}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Minotaur", "Warrior"],
  power: 4,
  toughness: 5,
  keywords: ["trample"],
  text: "Trample",
  faces: ["Akoum Warrior", "Akoum Teeth"],
});
