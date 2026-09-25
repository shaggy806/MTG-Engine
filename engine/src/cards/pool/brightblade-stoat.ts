import { defineCard } from "../define.js";

export default defineCard({
  name: "Brightblade Stoat",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Weasel", "Soldier"],
  power: 2,
  toughness: 2,
  keywords: ["first-strike", "lifelink"],
  text: "First strike, lifelink",
});
