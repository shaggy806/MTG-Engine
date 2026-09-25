import { defineCard } from "../define.js";

export default defineCard({
  name: "Prowling Felidar",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Beast"],
  power: 2,
  toughness: 3,
  keywords: ["vigilance"],
  text: "Vigilance\nLandfall — Whenever a land you control enters, put a +1/+1 counter on this creature.",
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
