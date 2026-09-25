import { defineCard } from "../define.js";

export default defineCard({
  name: "Swooping Lookout",
  manaCost: "{W}",
  colors: ["W"],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Construct"],
  power: 1,
  toughness: 2,
  keywords: ["flying", "vigilance"],
  text: "Flying, vigilance",
});
