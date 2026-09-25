import { defineCard } from "../define.js";

export default defineCard({
  name: "Moorish Cavalry",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 3,
  toughness: 3,
  keywords: ["trample"],
  text: "Trample",
});
