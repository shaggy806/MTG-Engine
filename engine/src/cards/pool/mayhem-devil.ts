import { defineCard } from "../define.js";

// "A player sacrifices" — any player, the controller of the sacrificed
// permanent (rule 701.21a), for a sacrifice as a cost or as an effect alike.
export default defineCard({
  name: "Mayhem Devil",
  manaCost: "{1}{B}{R}",
  colors: ["B", "R"],
  types: ["creature"],
  subtypes: ["Devil"],
  power: 3,
  toughness: 3,
  text: "Whenever a player sacrifices a permanent, this creature deals 1 damage to any target.",
  triggered: [
    {
      trigger: { on: "sacrifice", who: "any" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "Whenever a player sacrifices a permanent, this creature deals 1 damage to any target.",
    },
  ],
});
