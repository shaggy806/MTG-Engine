import { defineCard } from "../define.js";

export default defineCard({
  name: "Web-Warriors",
  manaCost: "{4}{G/W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Spider", "Hero"],
  power: 4,
  toughness: 3,
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
