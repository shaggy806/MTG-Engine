import { defineCard } from "../define.js";

// EDHREC rank 3052.
//
// Miirym, Sentinel Wyrm's shape: the token copies the Zombie's copiable values
// (what it's copying, if it's a copy), not counters or other effects, and its
// own enters abilities and "enters with" replacements work (the rulings).
const TEXT = "Whenever a nontoken Zombie you control enters, create a token that's a copy of that creature.";

export default defineCard({
  name: "Necroduality",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { token: false, subtype: "Zombie" },
      },
      targets: [],
      effect: { kind: "create-token-copy", of: "trigger-object", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
