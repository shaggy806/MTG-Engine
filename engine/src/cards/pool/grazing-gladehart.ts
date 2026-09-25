import { defineCard } from "../define.js";

export default defineCard({
  name: "Grazing Gladehart",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Antelope"],
  power: 2,
  toughness: 2,
  text: "Landfall — Whenever a land you control enters, you may gain 2 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "may", prompt: "Gain 2 life?", effect: { kind: "gain-life", amount: 2 } },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, you may gain 2 life.",
    },
  ],
});
