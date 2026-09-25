import { defineCard } from "../define.js";

export default defineCard({
  name: "Erebor Flamesmith",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dwarf", "Artificer"],
  power: 2,
  toughness: 1,
  text: "Whenever you cast an instant or sorcery spell, this creature deals 1 damage to each opponent.",
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
