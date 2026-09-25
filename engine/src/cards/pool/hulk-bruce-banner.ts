import { defineCard } from "../define.js";

export default defineCard({
  name: "Hulk, Bruce Banner",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Gamma", "Berserker", "Hero"],
  power: 7,
  toughness: 4,
  keywords: ["trample"],
  text: "Trample (This creature can deal excess combat damage to the player he's attacking.)",
});
