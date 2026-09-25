import { defineCard } from "../define.js";

export default defineCard({
  name: "Virtuous Charge",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Creatures you control get +1/+1 until end of turn.",
  effect: {
    kind: "modify-pt-all",
    filter: { type: "creature", controlledBy: "you" },
    power: 1,
    toughness: 1,
    duration: "end-of-turn",
  },
});
