import { defineCard } from "../define.js";

export default defineCard({
  name: "Makindi Stampede",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Creatures you control get +2/+2 until end of turn.",
  effect: {
    kind: "modify-pt-all",
    filter: { type: "creature", controlledBy: "you" },
    power: 2,
    toughness: 2,
    duration: "end-of-turn",
  },
  faces: ["Makindi Stampede", "Makindi Mesas"],
});
