import { defineCard } from "../define.js";

export default defineCard({
  name: "Remnant Elemental",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 0,
  toughness: 4,
  keywords: ["reach"],
  text: "Reach\nLandfall — Whenever a land you control enters, this creature gets +2/+0 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, this creature gets +2/+0 until end of turn.",
    },
  ],
});
