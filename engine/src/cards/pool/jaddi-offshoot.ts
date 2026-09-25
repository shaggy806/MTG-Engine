import { defineCard } from "../define.js";

export default defineCard({
  name: "Jaddi Offshoot",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant"],
  power: 0,
  toughness: 3,
  keywords: ["defender"],
  text: "Defender\nLandfall — Whenever a land you control enters, you gain 1 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, you gain 1 life.",
    },
  ],
});
