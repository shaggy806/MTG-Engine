import { defineCard } from "../define.js";

export default defineCard({
  name: "Family Reunion",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Choose one —\n• Creatures you control get +1/+1 until end of turn.\n• Creatures you control gain hexproof until end of turn. (They can't be the targets of spells or abilities your opponents control.)",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Creatures you control get +1/+1 until end of turn.",
        effect: {
          kind: "modify-pt-all",
          filter: { type: "creature", controlledBy: "you" },
          power: 1,
          toughness: 1,
          duration: "end-of-turn",
        },
      },
      {
        text: "Creatures you control gain hexproof until end of turn.",
        effect: {
          kind: "grant-keyword-all",
          filter: { type: "creature", controlledBy: "you" },
          keyword: "hexproof",
          duration: "end-of-turn",
        },
      },
    ],
  },
});
