import { defineCard } from "../define.js";

export default defineCard({
  name: "Unruly Catapult",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 0,
  toughness: 4,
  keywords: ["defender"],
  text: "Defender\n{T}: This creature deals 1 damage to each opponent.\nWhenever you cast an instant or sorcery spell, untap this creature.",
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
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "Whenever you cast an instant or sorcery spell, untap this creature.",
    },
  ],
});
