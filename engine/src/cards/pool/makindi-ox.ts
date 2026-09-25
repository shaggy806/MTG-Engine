import { defineCard } from "../define.js";

export default defineCard({
  name: "Makindi Ox",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Ox"],
  power: 4,
  toughness: 4,
  text: "Landfall — Whenever a land you control enters, tap target creature an opponent controls.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, tap target creature an opponent controls.",
    },
  ],
});
