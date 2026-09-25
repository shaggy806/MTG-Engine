import { defineCard } from "../define.js";

export default defineCard({
  name: "Bar the Door",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Creatures you control get +0/+4 until end of turn.",
  effect: {
    kind: "modify-pt-all",
    filter: { type: "creature", controlledBy: "you" },
    power: 0,
    toughness: 4,
    duration: "end-of-turn",
  },
});
