import { defineCard } from "../define.js";

// EDHREC rank 2412.
//
// Every mode targets, so the mode is chosen as it's cast (`castModal`). The
// third mode's two targets are separate instances of the word "target", so an
// artifact enchantment may be both (rule 115.3); they're destroyed together.
export default defineCard({
  name: "Hull Breach",
  manaCost: "{R}{G}",
  colors: ["R", "G"],
  types: ["sorcery"],
  text: "Choose one —\n• Destroy target artifact.\n• Destroy target enchantment.\n• Destroy target artifact and target enchantment.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Destroy target artifact.",
        targets: ["artifact"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Destroy target enchantment.",
        targets: ["enchantment"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Destroy target artifact and target enchantment.",
        targets: ["artifact", "enchantment"],
        effect: {
          kind: "sequence",
          simultaneous: true,
          effects: [
            { kind: "destroy", target: 0 },
            { kind: "destroy", target: 1 },
          ],
        },
      },
    ],
  },
});
