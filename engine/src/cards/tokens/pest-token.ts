import { defineCard } from "../define.js";

const DIES_TEXT = "When this token dies, you gain 1 life.";

/** 1/1 black and green Pest — Beledros Witherbloom's token. */
export default defineCard({
  name: "Pest Token",
  art: "c72ceae7-72d6-41dc-82cc-b86e845d7aa6",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Pest"],
  power: 1,
  toughness: 1,
  text: DIES_TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
