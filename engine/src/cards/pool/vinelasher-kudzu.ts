import { defineCard } from "../define.js";

export default defineCard({
  name: "Vinelasher Kudzu",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant"],
  power: 1,
  toughness: 1,
  text: "Landfall — Whenever a land you control enters, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, put a +1/+1 counter on this creature.",
    },
  ],
});
