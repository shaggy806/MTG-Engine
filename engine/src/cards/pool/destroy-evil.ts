import { defineCard } from "../define.js";

// EDHREC rank 5059.

const CREATURE_MODE = "Destroy target creature with toughness 4 or greater.";
const ENCHANTMENT_MODE = "Destroy target enchantment.";

export default defineCard({
  name: "Destroy Evil",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: `Choose one —\n• ${CREATURE_MODE}\n• ${ENCHANTMENT_MODE}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: CREATURE_MODE,
        targets: [{ kind: "permanent", filter: { type: "creature", toughness: { op: "gte", n: 4 } } }],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: ENCHANTMENT_MODE,
        targets: ["enchantment"],
        effect: { kind: "destroy", target: 0 },
      },
    ],
  },
});
