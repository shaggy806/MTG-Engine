import { defineCard } from "../define.js";

export default defineCard({
  name: "Icecave Crasher",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 4,
  toughness: 4,
  keywords: ["trample"],
  text: "Trample\nLandfall — Whenever a land you control enters, this creature gets +1/+0 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, this creature gets +1/+0 until end of turn.",
    },
  ],
});
