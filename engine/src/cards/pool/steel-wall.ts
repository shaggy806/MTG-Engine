import { defineCard } from "../define.js";

export default defineCard({
  name: "Steel Wall",
  manaCost: "{1}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 4,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)",
});
