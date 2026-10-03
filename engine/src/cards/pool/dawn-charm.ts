import { defineCard } from "../define.js";

// Two of the three modes target, so the mode is chosen as it's cast
// (`castModal`). The third can target a spell with several targets, as long
// as you are one of them (the ruling).
export default defineCard({
  name: "Dawn Charm",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Choose one —\n" +
    "• Prevent all combat damage that would be dealt this turn.\n" +
    "• Regenerate target creature.\n" +
    "• Counter target spell that targets you.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Prevent all combat damage that would be dealt this turn.",
        effect: { kind: "prevent-all-combat-damage" },
      },
      {
        text: "Regenerate target creature.",
        targets: ["creature"],
        effect: { kind: "regenerate", target: 0 },
      },
      {
        text: "Counter target spell that targets you.",
        targets: [{ kind: "spell", filter: { targets: { player: "you" } } }],
        effect: { kind: "counter", target: 0 },
      },
    ],
  },
});
