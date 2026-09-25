import { defineCard } from "../define.js";

export default defineCard({
  name: "Territorial Scythecat",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 2,
  toughness: 1,
  keywords: ["trample"],
  text: "Trample (This creature can deal excess combat damage to the player or planeswalker it's attacking.)\nLandfall — Whenever a land you control enters, put a +1/+1 counter on this creature.",
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
