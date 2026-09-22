import { defineCard } from "../define.js";

// A 1/1 red Goblin — Krenko, Mob Boss's tap ability.
export default defineCard({
  name: "Goblin Token",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 1,
  toughness: 1,
});
