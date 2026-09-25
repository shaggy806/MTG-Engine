import { defineCard } from "../define.js";

export default defineCard({
  name: "Ridgescale Tusker",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Pangolin", "Beast"],
  power: 5,
  toughness: 5,
  text: "When this creature enters, put a +1/+1 counter on each other creature you control.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
        exceptSource: true,
      },
      resolve: null,
      text: "When this creature enters, put a +1/+1 counter on each other creature you control.",
    },
  ],
});
