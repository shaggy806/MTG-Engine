import { defineCard } from "../define.js";

export default defineCard({
  name: "Gelectrode",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  types: ["creature"],
  subtypes: ["Weird"],
  power: 0,
  toughness: 1,
  text: "{T}: This creature deals 1 damage to any target.\nWhenever you cast an instant or sorcery spell, you may untap this creature.",
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
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: { kind: "may", prompt: "Untap ~?", effect: { kind: "untap", target: "source" } },
      resolve: null,
      text: "Whenever you cast an instant or sorcery spell, you may untap this creature.",
    },
  ],
});
