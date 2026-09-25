import { defineCard } from "../define.js";

export default defineCard({
  name: "Steadfastness",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Creatures you control get +0/+3 until end of turn.",
  effect: {
    kind: "modify-pt-all",
    filter: { type: "creature", controlledBy: "you" },
    power: 0,
    toughness: 3,
    duration: "end-of-turn",
  },
});
