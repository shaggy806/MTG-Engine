import { defineCard } from "../define.js";

export default defineCard({
  name: "Victory's Envoy",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 3,
  toughness: 3,
  text: "At the beginning of your upkeep, put a +1/+1 counter on each other creature you control.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
        exceptSource: true,
      },
      resolve: null,
      text: "At the beginning of your upkeep, put a +1/+1 counter on each other creature you control.",
    },
  ],
});
