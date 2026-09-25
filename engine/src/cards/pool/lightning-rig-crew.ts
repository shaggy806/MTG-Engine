import { defineCard } from "../define.js";

export default defineCard({
  name: "Lightning-Rig Crew",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Pirate"],
  power: 0,
  toughness: 5,
  text: "{T}: This creature deals 1 damage to each opponent.\nWhenever you cast a Pirate spell, untap this creature.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "{T}: This creature deals 1 damage to each opponent.",
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { subtype: "Pirate" } },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "Whenever you cast a Pirate spell, untap this creature.",
    },
  ],
});
