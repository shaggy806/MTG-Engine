import { defineCard } from "../define.js";

export default defineCard({
  name: "Rumbling Slum",
  manaCost: "{1}{R}{G}{G}",
  colors: ["R", "G"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 5,
  toughness: 5,
  text: "At the beginning of your upkeep, this creature deals 1 damage to each player.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-player" },
      resolve: null,
      text: "At the beginning of your upkeep, this creature deals 1 damage to each player.",
    },
  ],
});
