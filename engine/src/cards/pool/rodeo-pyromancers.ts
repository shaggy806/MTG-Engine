import { defineCard } from "../define.js";

export default defineCard({
  name: "Rodeo Pyromancers",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Mercenary"],
  power: 3,
  toughness: 4,
  text: "Whenever you cast your first spell each turn, add {R}{R}.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", firstEachTurn: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 2 },
      resolve: null,
      text: "Whenever you cast your first spell each turn, add {R}{R}.",
    },
  ],
});
