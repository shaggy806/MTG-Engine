import { defineCard } from "../define.js";

// Will of the Sultai's commander clause, asked as the modes are chosen.
export default defineCard({
  name: "Drown in Dreams",
  manaCost: "{X}{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Choose one. If you control a commander as you cast this spell, you may choose both instead.\n" +
    "• Target player draws X cards.\n" +
    "• Target player mills twice X cards.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    maxModesIf: { condition: { kind: "controls", filter: { isCommander: true }, atLeast: 1 }, maxModes: 2 },
    modes: [
      {
        text: "Target player draws X cards.",
        targets: ["player"],
        effect: { kind: "draw", amount: "x", target: 0 },
      },
      {
        text: "Target player mills twice X cards.",
        targets: ["player"],
        effect: { kind: "mill", target: 0, amount: { sum: ["x", "x"] } },
      },
    ],
  },
});
