import { defineCard } from "../define.js";

export default defineCard({
  name: "Machinesmith Automaton",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["artifact", "creature"],
  subtypes: ["Robot", "Villain"],
  power: 2,
  toughness: 2,
  keywords: ["trample"],
  text: "Trample\nWhenever another artifact you control enters, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "artifact" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever another artifact you control enters, put a +1/+1 counter on this creature.",
    },
  ],
});
