import { defineCard } from "../define.js";

export default defineCard({
  name: "Elfhame Wurm",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wurm"],
  power: 5,
  toughness: 4,
  keywords: ["vigilance", "trample"],
  text: "Vigilance, trample",
});
