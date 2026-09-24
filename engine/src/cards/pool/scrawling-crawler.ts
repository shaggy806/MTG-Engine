import { defineCard } from "../define.js";

// A `draws` trigger fires once per card; "that player" is whoever drew it.
export default defineCard({
  name: "Scrawling Crawler",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Construct"],
  power: 3,
  toughness: 2,
  text:
    "At the beginning of your upkeep, each player draws a card.\n" +
    "Whenever an opponent draws a card, that player loses 1 life.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "draw", amount: 1, who: "each-player" },
      resolve: null,
      text: "At the beginning of your upkeep, each player draws a card.",
    },
    {
      trigger: { on: "draws", who: "opponent" },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "trigger-controller" },
      resolve: null,
      text: "Whenever an opponent draws a card, that player loses 1 life.",
    },
  ],
});
