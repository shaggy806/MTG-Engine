import { defineCard } from "../define.js";

export default defineCard({
  name: "Rally of Wings",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Untap all creatures you control. Creatures you control with flying get " +
    "+2/+2 until end of turn.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "untap-all", filter: { type: "creature", controlledBy: "you" } },
      {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you", keyword: "flying" },
        power: 2,
        toughness: 2,
        duration: "end-of-turn",
      },
    ],
  },
});
