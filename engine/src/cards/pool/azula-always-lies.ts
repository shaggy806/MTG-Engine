import { defineCard } from "../define.js";

export default defineCard({
  name: "Azula Always Lies",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  subtypes: ["Lesson"],
  text: "Choose one or both —\n• Target creature gets -1/-1 until end of turn.\n• Put a +1/+1 counter on target creature.",
  castModal: {
    minModes: 1,
    maxModes: 2,
    modes: [
      {
        text: "Target creature gets -1/-1 until end of turn.",
        targets: ["creature"],
        effect: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
      },
      {
        text: "Put a +1/+1 counter on target creature.",
        targets: ["creature"],
        effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      },
    ],
  },
});
