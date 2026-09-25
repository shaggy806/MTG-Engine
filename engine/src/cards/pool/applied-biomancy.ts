import { defineCard } from "../define.js";

export default defineCard({
  name: "Applied Biomancy",
  manaCost: "{G}{U}",
  colors: ["U", "G"],
  types: ["instant"],
  text: "Choose one or both —\n• Target creature gets +1/+1 until end of turn.\n• Return target creature to its owner's hand.",
  castModal: {
    minModes: 1,
    maxModes: 2,
    modes: [
      {
        text: "Target creature gets +1/+1 until end of turn.",
        targets: ["creature"],
        effect: { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      },
      {
        text: "Return target creature to its owner's hand.",
        targets: ["creature"],
        effect: { kind: "return-to-hand", target: 0 },
      },
    ],
  },
});
