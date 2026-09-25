import { defineCard } from "../define.js";

export default defineCard({
  name: "Pharika's Libation",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Choose one —\n• Target opponent sacrifices a creature of their choice.\n• Target opponent sacrifices an enchantment of their choice.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Target opponent sacrifices a creature of their choice.",
        targets: ["opponent"],
        effect: { kind: "sacrifice", who: "target", filter: { type: "creature" }, count: 1 },
      },
      {
        text: "Target opponent sacrifices an enchantment of their choice.",
        targets: ["opponent"],
        effect: { kind: "sacrifice", who: "target", filter: { type: "enchantment" }, count: 1 },
      },
    ],
  },
});
