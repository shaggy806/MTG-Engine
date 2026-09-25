import { defineCard } from "../define.js";

export default defineCard({
  name: "Electrostatic Field",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 4,
  keywords: ["defender"],
  text: "Defender\nWhenever you cast an instant or sorcery spell, this creature deals 1 damage to each opponent.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever you cast an instant or sorcery spell, this creature deals 1 damage to each opponent.",
    },
  ],
});
