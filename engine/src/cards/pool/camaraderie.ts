import { defineCard } from "../define.js";

export default defineCard({
  name: "Camaraderie",
  manaCost: "{4}{G}{W}",
  colors: ["G", "W"],
  types: ["sorcery"],
  text:
    "You gain X life and draw X cards, where X is the number of creatures you " +
    "control. Creatures you control get +1/+1 until end of turn.",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "gain-life",
        amount: { countOf: { type: "creature", controlledBy: "you" } },
      },
      {
        kind: "draw",
        amount: { countOf: { type: "creature", controlledBy: "you" } },
      },
      {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
    ],
  },
});
