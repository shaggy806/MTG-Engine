import { defineCard } from "../define.js";

export default defineCard({
  name: "Darksteel Gargoyle",
  manaCost: "{7}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Gargoyle"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "indestructible"],
  text: "Flying\nIndestructible (Damage and effects that say \"destroy\" don't destroy this creature.)",
});
