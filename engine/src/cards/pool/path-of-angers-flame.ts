import { defineCard } from "../define.js";

export default defineCard({
  name: "Path of Anger's Flame",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  subtypes: ["Arcane"],
  text: "Creatures you control get +2/+0 until end of turn.",
  effect: {
    kind: "modify-pt-all",
    filter: { type: "creature", controlledBy: "you" },
    power: 2,
    toughness: 0,
    duration: "end-of-turn",
  },
});
