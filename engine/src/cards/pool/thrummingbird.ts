import { defineCard } from "../define.js";

export default defineCard({
  name: "Thrummingbird",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Bird", "Horror"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature deals combat damage to a player, proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: "Whenever this creature deals combat damage to a player, proliferate.",
    },
  ],
});
