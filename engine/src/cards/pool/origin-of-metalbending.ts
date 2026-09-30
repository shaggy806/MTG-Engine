import { defineCard } from "../define.js";

export default defineCard({
  name: "Origin of Metalbending",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  subtypes: ["Lesson"],
  text:
    "Choose one —\n" +
    "• Destroy target artifact or enchantment.\n" +
    "• Put a +1/+1 counter on target creature you control. It gains indestructible until end of turn.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Destroy target artifact or enchantment.",
        targets: ["artifact-or-enchantment"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Put a +1/+1 counter on target creature you control. It gains indestructible until end of turn.",
        targets: ["creature-you-control"],
        effect: {
          kind: "sequence",
          effects: [
            { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
            { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
          ],
        },
      },
    ],
  },
});
