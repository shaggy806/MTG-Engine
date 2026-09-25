import { defineCard } from "../define.js";

export default defineCard({
  name: "Supply Runners",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dog"],
  power: 2,
  toughness: 2,
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
