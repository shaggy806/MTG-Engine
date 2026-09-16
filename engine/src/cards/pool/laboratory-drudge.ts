import { defineCard } from "../define.js";

export default defineCard({
  name: "Laboratory Drudge",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Zombie", "Horror"],
  power: 3,
  toughness: 4,
  text:
    "At the beginning of each end step, draw a card if you've cast a spell from " +
    "a graveyard or activated an ability of a card in a graveyard this turn.",
  triggered: [
    {
      // "**Each** end step" — yours and everyone else's.
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: { kind: "used-graveyard-this-turn" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text:
        "At the beginning of each end step, draw a card if you've cast a spell from " +
        "a graveyard or activated an ability of a card in a graveyard this turn.",
    },
  ],
});
