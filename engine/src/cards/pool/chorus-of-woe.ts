import { defineCard } from "../define.js";

export default defineCard({
  name: "Chorus of Woe",
  manaCost: "{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Creatures you control get +1/+0 until end of turn.",
  effect: {
    kind: "modify-pt-all",
    filter: { type: "creature", controlledBy: "you" },
    power: 1,
    toughness: 0,
    duration: "end-of-turn",
  },
});
