import { defineCard } from "../define.js";

export default defineCard({
  name: "Warrior's Honor",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Creatures you control get +1/+1 until end of turn.",
  effect: {
    kind: "modify-pt-all",
    filter: { type: "creature", controlledBy: "you" },
    power: 1,
    toughness: 1,
    duration: "end-of-turn",
  },
});
