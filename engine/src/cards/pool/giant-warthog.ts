import { defineCard } from "../define.js";

export default defineCard({
  name: "Giant Warthog",
  manaCost: "{5}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Boar", "Beast"],
  power: 5,
  toughness: 5,
  keywords: ["trample"],
  text: "Trample",
});
