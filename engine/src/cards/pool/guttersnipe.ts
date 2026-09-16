import { defineCard } from "../define.js";

export default defineCard({
  name: "Guttersnipe",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Shaman"],
  power: 2,
  toughness: 2,
  text:
    "Whenever you cast an instant or sorcery spell, Guttersnipe deals 2 damage to " +
    "each opponent.",
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        filter: { typesAnyOf: ["instant", "sorcery"] },
      },
      targets: [],
      effect: { kind: "damage", amount: 2, who: "each-opponent" },
      resolve: null,
      text:
        "Whenever you cast an instant or sorcery spell, Guttersnipe deals 2 damage to " +
        "each opponent.",
    },
  ],
});
