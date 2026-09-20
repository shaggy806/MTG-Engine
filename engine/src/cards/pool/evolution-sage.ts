import { defineCard } from "../define.js";

export default defineCard({
  name: "Evolution Sage",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 3,
  toughness: 2,
  text: "Landfall — Whenever a land you control enters, proliferate.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, proliferate.",
    },
  ],
});
