import { defineCard } from "../define.js";

// The spell is cast while Electrodominance is still resolving (rule 608.2g),
// so a creature dealt lethal damage is still on the battlefield as it's cast.
// With its target illegal, Electrodominance doesn't resolve and no spell is
// cast (608.2b).
const TEXT =
  "Electrodominance deals X damage to any target. You may cast a spell with mana value X or less from your hand without paying its mana cost.";

export default defineCard({
  name: "Electrodominance",
  manaCost: "{X}{R}{R}",
  colors: ["R"],
  types: ["instant"],
  text: TEXT,
  targets: ["any-target"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage", target: 0, amount: "x" },
      { kind: "cast-now", from: "hand", free: true, spell: { manaValue: { op: "lte", n: { amount: "x" } } } },
    ],
  },
});
