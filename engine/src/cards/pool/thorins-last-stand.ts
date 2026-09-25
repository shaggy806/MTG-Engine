import { defineCard } from "../define.js";

export default defineCard({
  name: "Thorin's Last Stand",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Choose one —\n• Creatures you control get +2/+1 until end of turn.\n• Destroy target artifact or enchantment. You gain 2 life.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Creatures you control get +2/+1 until end of turn.",
        effect: {
          kind: "modify-pt-all",
          filter: { type: "creature", controlledBy: "you" },
          power: 2,
          toughness: 1,
          duration: "end-of-turn",
        },
      },
      {
        text: "Destroy target artifact or enchantment. You gain 2 life.",
        targets: ["artifact-or-enchantment"],
        effect: {
          kind: "sequence",
          effects: [{ kind: "destroy", target: 0 }, { kind: "gain-life", amount: 2 }],
        },
      },
    ],
  },
});
