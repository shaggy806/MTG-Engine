import { defineCard } from "../define.js";

export default defineCard({
  name: "Vitalizing Wind",
  manaCost: "{8}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Creatures you control get +7/+7 until end of turn.",
  effect: {
    kind: "modify-pt-all",
    filter: { type: "creature", controlledBy: "you" },
    power: 7,
    toughness: 7,
    duration: "end-of-turn",
  },
});
