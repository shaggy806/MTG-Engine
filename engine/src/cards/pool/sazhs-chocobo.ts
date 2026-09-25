import { defineCard } from "../define.js";

export default defineCard({
  name: "Sazh's Chocobo",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 0,
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
