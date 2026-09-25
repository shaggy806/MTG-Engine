import { defineCard } from "../define.js";

export default defineCard({
  name: "Geyser Glider",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Beast"],
  power: 4,
  toughness: 4,
  text: "Landfall — Whenever a land you control enters, this creature gains flying until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, this creature gains flying until end of turn.",
    },
  ],
});
