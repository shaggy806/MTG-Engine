import { defineCard } from "../define.js";

export default defineCard({
  name: "Silver Erne",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 2,
  keywords: ["flying", "trample"],
  text: "Flying, trample",
});
