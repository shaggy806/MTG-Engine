import { defineCard } from "../define.js";

export default defineCard({
  name: "Alley Evasion",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Choose one —\n• Target creature you control gets +1/+2 until end of turn.\n• Return target creature you control to its owner's hand.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Target creature you control gets +1/+2 until end of turn.",
        targets: ["creature-you-control"],
        effect: { kind: "modify-pt", target: 0, power: 1, toughness: 2, duration: "end-of-turn" },
      },
      {
        text: "Return target creature you control to its owner's hand.",
        targets: ["creature-you-control"],
        effect: { kind: "return-to-hand", target: 0 },
      },
    ],
  },
});
