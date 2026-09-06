import { defineCard } from "../define.js";

export default defineCard({
  name: "Serra Angel",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "vigilance"],
});
