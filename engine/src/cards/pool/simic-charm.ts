import { defineCard } from "../define.js";

export default defineCard({
  name: "Simic Charm",
  manaCost: "{G}{U}",
  colors: ["G", "U"],
  types: ["instant"],
  text:
    "Choose one —\n" +
    "• Target creature gets +3/+3 until end of turn.\n" +
    "• Permanents you control gain hexproof until end of turn.\n" +
    "• Return target creature to its owner's hand.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Target creature gets +3/+3 until end of turn.",
        targets: ["creature"],
        effect: { kind: "modify-pt", target: 0, power: 3, toughness: 3, duration: "end-of-turn" },
      },
      {
        text: "Permanents you control gain hexproof until end of turn.",
        effect: {
          kind: "grant-keyword-all",
          filter: { controlledBy: "you" },
          keyword: "hexproof",
          duration: "end-of-turn",
        },
      },
      {
        text: "Return target creature to its owner's hand.",
        targets: ["creature"],
        effect: { kind: "return-to-hand", target: 0 },
      },
    ],
  },
});
