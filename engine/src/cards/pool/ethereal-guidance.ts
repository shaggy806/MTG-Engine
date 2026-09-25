import { defineCard } from "../define.js";

export default defineCard({
  name: "Ethereal Guidance",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Creatures you control get +2/+1 until end of turn.",
  effect: {
    kind: "modify-pt-all",
    filter: { type: "creature", controlledBy: "you" },
    power: 2,
    toughness: 1,
    duration: "end-of-turn",
  },
});
