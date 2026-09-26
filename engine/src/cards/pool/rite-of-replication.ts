import { defineCard } from "../define.js";

// "Create a token" — the caster creates it, so it's theirs whoever controls
// the creature it copies (`who: "you"`).
export default defineCard({
  name: "Rite of Replication",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text:
    "Kicker {5} (You may pay an additional {5} as you cast this spell.)\n" +
    "Create a token that's a copy of target creature. If this spell was kicked, create five of those tokens instead.",
  targets: ["creature"],
  effect: { kind: "create-token-copy", of: 0, count: 1, who: "you" },
  kicker: {
    cost: "{5}",
    targets: ["creature"],
    effect: { kind: "create-token-copy", of: 0, count: 5, who: "you" },
  },
});
