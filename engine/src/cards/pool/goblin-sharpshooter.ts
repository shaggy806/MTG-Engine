import { defineCard } from "../define.js";

// EDHREC rank 3825.

export default defineCard({
  name: "Goblin Sharpshooter",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 1,
  toughness: 1,
  text: "This creature doesn't untap during your untap step.\nWhenever a creature dies, untap this creature.\n{T}: This creature deals 1 damage to any target.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{T}: This creature deals 1 damage to any target.",
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "Whenever a creature dies, untap this creature.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      doesntUntap: true,
      text: "This creature doesn't untap during your untap step.",
    },
  ],
});
