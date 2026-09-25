import { defineCard } from "../define.js";

export default defineCard({
  name: "Eumidian Terrabotanist",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect", "Druid"],
  power: 2,
  toughness: 3,
  text: "Landfall — Whenever a land you control enters, you gain 1 life.",
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
