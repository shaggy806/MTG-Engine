import { defineCard } from "../define.js";

export default defineCard({
  name: "Golem's Heart",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "Whenever a player casts an artifact spell, you may gain 1 life.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "any", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "may", prompt: "Gain 1 life?", effect: { kind: "gain-life", amount: 1 } },
      resolve: null,
      text: "Whenever a player casts an artifact spell, you may gain 1 life.",
    },
  ],
});
