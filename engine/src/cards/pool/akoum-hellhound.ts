import { defineCard } from "../define.js";

export default defineCard({
  name: "Akoum Hellhound",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Dog"],
  power: 0,
  toughness: 1,
  text: "Landfall — Whenever a land you control enters, this creature gets +2/+2 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, this creature gets +2/+2 until end of turn.",
    },
  ],
});
