import { defineCard } from "../define.js";

export default defineCard({
  name: "Shield Wall",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Creatures you control get +0/+2 until end of turn.",
  effect: {
    kind: "modify-pt-all",
    filter: { type: "creature", controlledBy: "you" },
    power: 0,
    toughness: 2,
    duration: "end-of-turn",
  },
});
