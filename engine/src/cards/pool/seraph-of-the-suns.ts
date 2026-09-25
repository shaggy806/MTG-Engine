import { defineCard } from "../define.js";

export default defineCard({
  name: "Seraph of the Suns",
  manaCost: "{5}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "indestructible"],
  text: "Flying\nIndestructible (Damage and effects that say \"destroy\" don't destroy this creature. If its toughness is 0 or less, it still dies.)",
});
