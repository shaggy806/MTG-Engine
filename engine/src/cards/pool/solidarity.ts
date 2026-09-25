import { defineCard } from "../define.js";

export default defineCard({
  name: "Solidarity",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Creatures you control get +0/+5 until end of turn.",
  effect: {
    kind: "modify-pt-all",
    filter: { type: "creature", controlledBy: "you" },
    power: 0,
    toughness: 5,
    duration: "end-of-turn",
  },
});
