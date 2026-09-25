import { defineCard } from "../define.js";

export default defineCard({
  name: "Grendel, Spawn of Knull",
  manaCost: "{3}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Symbiote", "Dragon", "Villain"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "deathtouch"],
  text: "Flying (This creature can't be blocked except by creatures with flying or reach.)\nDeathtouch (Any amount of damage this deals to a creature is enough to destroy it.)",
});
