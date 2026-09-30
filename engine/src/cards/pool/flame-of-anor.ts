import { defineCard } from "../define.js";

// Will of the Sultai's shape: a second mode while you control a Wizard as
// the spell is cast (rule 601.2b).
export default defineCard({
  name: "Flame of Anor",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  types: ["instant"],
  text:
    "Choose one. If you control a Wizard as you cast this spell, you may choose two instead.\n" +
    "• Target player draws two cards.\n" +
    "• Destroy target artifact.\n" +
    "• Flame of Anor deals 5 damage to target creature.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    maxModesIf: { condition: { kind: "controls", filter: { subtype: "Wizard" }, atLeast: 1 }, maxModes: 2 },
    modes: [
      {
        text: "Target player draws two cards.",
        targets: ["player"],
        effect: { kind: "draw", amount: 2, target: 0 },
      },
      {
        text: "Destroy target artifact.",
        targets: ["artifact"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Flame of Anor deals 5 damage to target creature.",
        targets: ["creature"],
        effect: { kind: "damage", amount: 5, target: 0 },
      },
    ],
  },
});
